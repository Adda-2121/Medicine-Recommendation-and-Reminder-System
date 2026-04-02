const { TreatmentPlan, Consultation, Payment } = require('../models');

// @desc    Create a treatment plan for a consultation
// @route   POST /api/treatments
// @access  Private (Doctor)
exports.createTreatmentPlan = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create treatment plans' });
    }

    const { consultation_id, medicine_recommendation, lifestyle_advice, lab_test_needed, follow_up_needed } = req.body;

    // Verify consultation exists and belongs to this doctor
    const consultation = await Consultation.findByPk(consultation_id);
    if (!consultation || consultation.doctor_id !== req.user.id) {
      return res.status(404).json({ message: 'Consultation not found or not assigned to you' });
    }

    // Verify payment is completed
    const payment = await Payment.findOne({ where: { consultation_id } });
    if (!payment || payment.status !== 'verified') {
      return res.status(403).json({ message: 'Payment must be verified before prescribing treatment.' });
    }

    const plan = await TreatmentPlan.create({
      consultation_id,
      medicine_recommendation,
      lifestyle_advice,
      lab_test_needed,
      follow_up_needed,
    });

    res.status(201).json({
      message: 'Treatment plan created successfully',
      plan,
    });
  } catch (error) {
    console.error('Create treatment plan error:', error);
    res.status(500).json({ message: 'Server error creating treatment plan' });
  }
};

// @desc    Get a treatment plan by consultation ID
// @route   GET /api/treatments/:consultationId
// @access  Private
exports.getTreatmentPlan = async (req, res) => {
  try {
    const plan = await TreatmentPlan.findOne({
      where: { consultation_id: req.params.consultationId }
    });

    if (!plan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error('Get treatment plan error:', error);
    res.status(500).json({ message: 'Server error fetching treatment plan' });
  }
};
