const cron = require('node-cron');
const { Op } = require('sequelize');
const { Consultation, User } = require('../models');

/**
 * Run job every 15 minutes to check for consultations that have reached their 24h limit
 * after a prescription was submitted.
 * NOTE: Referred consultations are closed immediately on referral — they are never
 * in prescription_submitted or closing_soon state, so this cron never touches them.
 */
const consultationJob = cron.schedule('*/15 * * * *', async () => {
    try {
        console.log('[CRON] Running Consultation Auto-Closure check...');
        
        const expiredConsultations = await Consultation.findAll({
            where: {
                status: {
                    [Op.in]: ['prescription_submitted', 'closing_soon']
                },
                // Only non-referred consultations (belt-and-suspenders guard)
                closing_at: {
                    [Op.lt]: new Date()
                }
            }
        });

        if (expiredConsultations.length > 0) {
            console.log(`[CRON] Found ${expiredConsultations.length} consultations pending closure. Terminating...`);
            
            for (const consultation of expiredConsultations) {
                consultation.status = 'completed';
                consultation.queue_status = 'completed';
                await consultation.save();

                // Notify via Socket if available
                if (global.io) {
                    global.io.to(consultation.id).emit('case_status_updated', {
                        consultation_id: consultation.id,
                        status: 'completed',
                        message: 'This consultation has been automatically closed after the 24-hour follow-up period.'
                    });
                }

                // Sync doctor availability if they have no other active cases
                const doctor = await User.findByPk(consultation.doctor_id);
                if (doctor) {
                    const activeCount = await Consultation.count({
                        where: {
                            doctor_id: doctor.id,
                            status: { [Op.in]: ['assigned', 'in_progress', 'waiting_for_results'] }
                        }
                    });
                    if (activeCount === 0) {
                        doctor.availability_status = 'available';
                        await doctor.save();
                    }
                }
            }
            console.log('[CRON] Successfully closed expired consultations.');
        } else {
            console.log('[CRON] No consultations to close.');
        }
    } catch (error) {
        console.error('[CRON] Error running Consultation Auto-Closure job:', error);
    }
});

module.exports = consultationJob;
