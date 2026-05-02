const fs = require('fs');

const path = 'c:/Users/HP/Documents/Medicine-Recommendation-and-Reminder-System/Medicine_recommender_system/backend/controllers/consultationController.js';
let content = fs.readFileSync(path, 'utf8');

const resumeFunc = `
// @desc    Resume a consultation after results are ready
// @route   PUT /api/consultations/:id/resume
// @access  Private (Doctor)
exports.resumeConsultation = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can resume consultations.' });
    }

    const { id } = req.params;
    const consultation = await Consultation.findByPk(id);

    if (!consultation || consultation.doctor_id !== req.user.id) {
      return res.status(404).json({ message: 'Consultation not found or unauthorized.' });
    }

    if (consultation.status !== 'result_ready' && consultation.status !== 'waiting_for_results') {
      return res.status(400).json({ message: 'Consultation is not waiting for results.' });
    }

    // Mark doctor as busy
    const doctor = await User.findByPk(req.user.id);
    if (doctor) {
      doctor.availability_status = 'busy';
      await doctor.save();
    }

    // Update consultation status to in_progress
    consultation.status = 'in_progress';
    await consultation.save();

    // Notify the patient via push notification / socket
    const { sendPushNotification } = require('../utils/pushHelper');
    await sendPushNotification(
      consultation.patient_id,
      'Doctor Resumed Case',
      'The doctor has reviewed your results and resumed the consultation.',
      'case_resumed',
      '/patient'
    );

    if (global.io) {
      global.io.emit('queue_update');
    }

    res.status(200).json({ message: 'Consultation resumed successfully.', consultation });
  } catch (error) {
    console.error('Error resuming consultation:', error);
    res.status(500).json({ message: 'Server error resuming consultation.' });
  }
};
`;

content = content + resumeFunc;
fs.writeFileSync(path, content, 'utf8');
console.log('consultationController patched');
