const { Prescription, Drug, Consultation, User } = require('../models');

exports.createPrescription = async (req, res) => {
  try {
    const { consultation_id, patient_id, drugs } = req.body;
    const doctor_id = req.user.id;

    if (!consultation_id || !patient_id || !drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return res.status(400).json({ message: 'Missing required fields or empty drugs array' });
    }

    const prescriptions = [];
    for (const item of drugs) {
      const p = await Prescription.create({
        consultation_id,
        patient_id,
        doctor_id,
        drug_id: item.drug_id,
        instructions: item.instructions || null
      });
      prescriptions.push(p);
    }

    res.status(201).json({ message: 'Prescription created successfully', prescriptions });
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
        { model: Drug },
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
        { model: Drug },
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
        { model: Drug },
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
