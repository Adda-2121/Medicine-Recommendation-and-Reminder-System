const { Consultation, User, Payment, Availability } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');

// @desc    Request a new consultation
// @route   POST /api/consultations
// @access  Private (Patient)
exports.requestConsultation = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can request consultations' });
    }

    const { symptoms_description, reason, report_url, doctor_id, appointment_date, appointment_time } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Doctor selection, date, and time are required.' });
    }

    // Validate availability
    const slot = await Availability.findOne({
      where: {
        doctor_id,
        date: appointment_date,
        start_time: appointment_time,
        is_booked: false
      }
    });

    if (!slot) {
      return res.status(400).json({ message: 'The selected time slot is no longer available.' });
    }

    // Mark slot as booked
    slot.is_booked = true;
    await slot.save();

    const consultation = await Consultation.create({
      patient_id: req.user.id,
      doctor_id,
      appointment_date,
      appointment_time,
      symptoms_description,
      reason,
      report_url,
      status: 'pending',
    });

    // Generate reference code
    const referenceCode = 'TEL-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Create empty pending payment
    const payment = await Payment.create({
      consultation_id: consultation.id,
      patient_id: req.user.id,
      reference_code: referenceCode,
      status: 'pending',
      amount: null,
    });

    res.status(201).json({
      message: 'Consultation requested successfully',
      consultation: { ...consultation.toJSON(), Payment: payment },
    });
  } catch (error) {
    console.error('Request consultation error:', error);
    res.status(500).json({ message: 'Server error requesting consultation' });
  }
};

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Private (Admin, Doctor, Patient)
exports.getConsultations = async (req, res) => {
  try {
    let whereClause = {};

    // Filter based on role
    if (req.user.role === 'patient') {
      whereClause.patient_id = req.user.id;
    } else if (req.user.role === 'doctor') {
      whereClause.doctor_id = req.user.id;
    }
    // 'company_admin' sees everything

    const consultations = await Consultation.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'Patient', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'Doctor', attributes: ['id', 'name', 'email'] },
        { model: Payment, as: 'Payment' }
      ],
      order: [['created_at', 'DESC']]
    });

    // Anonymize contact info if payment is not verified
    const sanitizedConsultations = consultations.map(c => {
      const consultation = c.toJSON();
      if (!consultation.Payment || consultation.Payment.status !== 'verified') {
        if (req.user.role === 'patient' && consultation.Doctor) {
          delete consultation.Doctor.email;
          delete consultation.Doctor.phone;
        } else if (req.user.role === 'doctor' && consultation.Patient) {
          delete consultation.Patient.email;
          delete consultation.Patient.phone;
        }
      }
      return consultation;
    });

    res.status(200).json(sanitizedConsultations);
  } catch (error) {
    console.error('Get consultations error:', error);
    res.status(500).json({ message: 'Server error fetching consultations' });
  }
};

// @desc    Assign a doctor to a consultation (Automatic or Admin)
// @route   PUT /api/consultations/:id/assign
// @access  Private (Company Admin)
exports.assignDoctor = async (req, res) => {
  try {
    const { doctor_id } = req.body;
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Optional: Verify doctor_id exists and is actually a doctor
    const doctor = await User.findByPk(doctor_id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    consultation.doctor_id = doctor_id;
    consultation.status = 'assigned';
    await consultation.save();

    res.status(200).json({
      message: 'Doctor assigned successfully',
      consultation,
    });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ message: 'Server error assigning doctor' });
  }
};
