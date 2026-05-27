const { Prescription, Drug, Consultation, User } = require('../models');

exports.createPrescription = async (req, res) => {
  try {
    const { consultation_id, patient_id, drugs, counseling_notes } = req.body;
    const doctor_id = req.user.id;

    // Must have at least medications or counseling notes
    const hasDrugs = Array.isArray(drugs) && drugs.length > 0;
    const hasCounseling = Array.isArray(counseling_notes) && counseling_notes.length > 0;

    if (!consultation_id || !patient_id || (!hasDrugs && !hasCounseling)) {
      return res.status(400).json({ message: 'Missing required fields. Provide at least one medication or counseling note.' });
    }

    // Guard: cannot prescribe on a closed/completed case
    const consultation = await Consultation.findByPk(consultation_id);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    if (['completed', 'closing_soon', 'prescription_submitted', 'referred', 'archived'].includes(consultation.status)) {
      return res.status(400).json({ message: 'Cannot prescribe on a case that is already referred, closing, or completed.' });
    }
    if (consultation.doctor_id !== doctor_id) {
      return res.status(403).json({ message: 'Not authorized for this consultation' });
    }

    const prescriptions = [];

    // Create medication entries
    if (hasDrugs) {
      for (const item of drugs) {
        const p = await Prescription.create({
          consultation_id,
          patient_id,
          doctor_id,
          drug_id: item.drug_id,
          instructions: item.instructions || null,
          entry_type: 'medication',
        });
        prescriptions.push(p);
      }
    }

    // Create counseling note entries
    if (hasCounseling) {
      for (const note of counseling_notes) {
        if (!note.trim()) continue;
        const p = await Prescription.create({
          consultation_id,
          patient_id,
          doctor_id,
          drug_id: null,
          counseling_note: note.trim(),
          entry_type: 'counseling',
        });
        prescriptions.push(p);
      }
    }

    // Mark consultation as prescription_submitted and schedule 24h auto-closure
    const now = new Date();
    const closingAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    consultation.status = 'prescription_submitted';
    consultation.prescription_submitted_at = now;
    consultation.closing_at = closingAt;
    await consultation.save();

    // Notify patient
    const { sendPushNotification } = require('../utils/pushHelper');
    await sendPushNotification(
      patient_id,
      'Prescription Received — Follow-up Active',
      'Your doctor has submitted your prescription. You have 24 hours to ask any follow-up questions before the chat closes.',
      'prescription',
      '/consultations'
    );

    // Notify via socket
    if (global.io) {
      global.io.to(`user_${patient_id}`).emit('case_status_updated', {
        consultation_id,
        status: 'prescription_submitted',
        closing_at: closingAt.toISOString()
      });
    }

    res.status(201).json({ message: 'Prescription created successfully', prescriptions, closing_at: closingAt });
  } catch (err) {
    console.error('Error creating prescription:', err);
    res.status(500).json({ message: 'Failed to create prescription' });
  }
};

exports.getPrescriptionsByConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const prescriptions = await Prescription.findAll({
      where: { consultation_id: consultationId },
      include: [
        { model: Drug, required: false },
        { model: User, as: 'Doctor', attributes: ['id', 'name', 'specialty'] }
      ]
    });
    res.status(200).json(prescriptions);
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const prescriptions = await Prescription.findAll({
      where: { patient_id },
      include: [
        { model: Drug, required: false },
        { model: Consultation },
        { model: User, as: 'Doctor', attributes: ['id', 'name', 'specialty'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.status(200).json(prescriptions);
  } catch (err) {
    console.error('Error fetching patient prescriptions:', err);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

exports.getPrescriptionsByDoctor = async (req, res) => {
  try {
    const doctor_id = req.user.id;
    const prescriptions = await Prescription.findAll({
      where: { doctor_id },
      include: [
        { model: Drug, required: false },
        { model: Consultation, attributes: ['id', 'reason', 'status', 'created_at'] },
        { model: User, as: 'Patient', attributes: ['id', 'name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.status(200).json(prescriptions);
  } catch (err) {
    console.error('Error fetching doctor prescriptions:', err);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};
