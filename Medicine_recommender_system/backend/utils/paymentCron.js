const cron = require('node-cron');
const { Op } = require('sequelize');
const { Payment, User } = require('../models');
const { sendSMS } = require('./smsService');

// Run job every hour to check for expired payments
const paymentJob = cron.schedule('0 * * * *', async () => {
    try {
        console.log('Running Payment Expiration check...');
        
        // Find all verified payments whose expires_at is in the past
        const expiredPayments = await Payment.findAll({
            where: {
                status: 'verified',
                expires_at: {
                    [Op.lt]: new Date()
                }
            },
            include: [
                { model: User, as: 'Patient', attributes: ['name', 'phone_number'] }
            ]
        });

        if (expiredPayments.length > 0) {
            console.log(`Found ${expiredPayments.length} expired payments. Revoking access...`);
            
            for (const payment of expiredPayments) {
                payment.status = 'expired';
                await payment.save();

                // Notify patient via SMS
                if (payment.Patient && payment.Patient.phone_number) {
                    try {
                        await sendSMS(
                            payment.Patient.phone_number,
                            `Hello ${payment.Patient.name}, your 1-week consultation access has EXPIRED. Please re-subscribe to continue chatting with your doctor.`
                        );
                    } catch (smsError) {
                        console.error(`Failed to send SMS to ${payment.Patient.phone_number}:`, smsError);
                    }
                }
            }
            console.log('Successfully completed revoking expired payments.');
        } else {
            console.log('No expired payments found.');
        }
    } catch (error) {
        console.error('Error running Payment Expiration job:', error);
    }
});

module.exports = paymentJob;
