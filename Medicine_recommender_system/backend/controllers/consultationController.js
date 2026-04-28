const { Consultation, User, Payment, Availability } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sendPushNotification } = require('../utils/pushHelper');
const { calculateSeverity } = require('../utils/severityCalculator');

// @desc    Request a new consultation (Join Priority Queue)
// @route   POST /api/consultations
// @access  Private (Patient)
exports.requestConsultation = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can request consultations' });
    }

    const { symptoms_description, reason, report_url } = req.body;

    if (!symptoms_description) {
      return res.status(400).json({ message: 'Symptoms description is required.' });
    }

    const severity_level = calculateSeverity(reason || '', symptoms_description);

    const consultation = await Consultation.create({
      patient_id: req.user.id,
      doctor_id: null,
      symptoms_description,
      reason,
      report_url,
      status: 'pending',
      severity_level,
      queue_status: 'waiting'
    });

    // Check if patient has an active subscription
    const activeSub = await Payment.findOne({
      where: {
        patient_id: req.user.id,
        status: 'verified',
        expires_at: { [Op.gt]: new Date() }
      },
      order: [['expires_at', 'DESC']]
    });

    const { Setting } = require('../models');
    let paymentStatus = 'pending';
    let expiresAt = null;
    let paymentAmount = null;

    if (activeSub) {
      paymentStatus = 'verified';
      expiresAt = activeSub.expires_at;
      paymentAmount = 0;
    } else {
      const setting = await Setting.findOne({ where: { key: 'consultation_fee' } });
      paymentAmount = setting ? parseInt(setting.value, 10) : 100;
    }

    const referenceCode = 'TEL-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const payment = await Payment.create({
      consultation_id: consultation.id,
      patient_id: req.user.id,
      reference_code: referenceCode,
      status: paymentStatus,
      amount: paymentAmount,
      expires_at: expiresAt,
    });

    // Notify admins/system (No specific doctor assigned yet)
    if (global.io) {
      global.io.emit('queue_update', { message: 'New patient joined the queue' });
    }

    // Try to auto-assign a doctor if one is available
    exports.triggerAutoAssignment();

    res.status(201).json({
      message: 'Joined consultation queue successfully',
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

    // Notify the patient
    await sendPushNotification(
      consultation.patient_id,
      'Consultation Assigned',
      'A doctor has been assigned to your consultation.',
      'consultation',
      '/consultations'
    );

    res.status(200).json({
      message: 'Doctor assigned successfully',
      consultation,
    });
  } catch (error) {
    console.error('Assign doctor error:', error);
    res.status(500).json({ message: 'Server error assigning doctor' });
  }
};

// @desc    Get patient queue status
// @route   GET /api/consultations/queue/status
// @access  Private (Patient)
exports.getQueueStatus = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      where: { patient_id: req.user.id, queue_status: 'waiting' },
      order: [['created_at', 'DESC']]
    });

    if (!consultation) {
      return res.status(200).json({ status: 'not_in_queue' });
    }

    // Calculate position
    const severityValues = { 'high': 3, 'medium': 2, 'low': 1 };
    const mySeverity = severityValues[consultation.severity_level];

    // Find all waiting consultations that have higher severity, OR same severity but older timestamp
    const aheadInQueue = await Consultation.count({
      where: {
        queue_status: 'waiting',
        [Op.or]: [
          {
            severity_level: {
              [Op.in]: Object.keys(severityValues).filter(k => severityValues[k] > mySeverity)
            }
          },
          {
            severity_level: consultation.severity_level,
            created_at: { [Op.lt]: consultation.created_at }
          }
        ]
      }
    });

    const position = aheadInQueue + 1;
    // Estimate wait time: say 15 mins per patient ahead
    const estimated_wait_time_mins = position * 15;

    res.status(200).json({
      status: 'waiting',
      severity_level: consultation.severity_level,
      position,
      estimated_wait_time_mins
    });
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({ message: 'Server error fetching queue status' });
  }
};

// Internal function to auto-assign doctors
exports.triggerAutoAssignment = async () => {
  try {
    // Find all available doctors
    let availableDoctors = await User.findAll({
      where: { role: 'doctor', availability_status: 'available' }
    });

    if (availableDoctors.length === 0) {
      availableDoctors = await User.findAll({
        where: { role: 'doctor', is_verified: true }
      });
    }

    if (availableDoctors.length === 0) return;

    const pendingConsultations = await Consultation.findAll({
      where: { queue_status: 'waiting', status: 'pending' },
      include: [{
        model: Payment,
        as: 'Payment',
        where: { status: 'verified' }
      }]
    });

    if (pendingConsultations.length === 0) return;

    const severityRank = { 'high': 3, 'medium': 2, 'low': 1 };
    pendingConsultations.sort((a, b) => {
      const rankA = severityRank[a.severity_level] || 1;
      const rankB = severityRank[b.severity_level] || 1;
      if (rankA !== rankB) return rankB - rankA; // Descending
      return new Date(a.created_at) - new Date(b.created_at); // Ascending time
    });

    // Assign them
    let docIndex = 0;

    for (let patIndex = 0; patIndex < pendingConsultations.length; patIndex++) {
      const doctor = availableDoctors[docIndex % availableDoctors.length];
      const consultation = pendingConsultations[patIndex];

      // Assign
      consultation.doctor_id = doctor.id;
      consultation.status = 'assigned';
      consultation.queue_status = 'assigned';
      await consultation.save();

      // Update doctor status if they were available
      if (doctor.availability_status === 'available') {
        doctor.availability_status = 'busy';
        await doctor.save();
      }

      // Notify
      sendPushNotification(consultation.patient_id, 'Doctor Assigned', `Dr. ${doctor.name} has been assigned to your consultation.`, 'consultation', '/consultations').catch(()=>{});
      sendPushNotification(doctor.id, 'New Patient', 'A new patient has been assigned to you.', 'consultation', '/consultations').catch(()=>{});

      if (global.io) {
        global.io.to(`user_${consultation.patient_id}`).emit('doctor_assigned', { consultation_id: consultation.id, doctor_name: doctor.name });
        global.io.to(`user_${doctor.id}`).emit('new_patient_assigned', { consultation_id: consultation.id });
        global.io.emit('queue_update', {});
      }

      docIndex++;
    }
  } catch (error) {
    console.error('Error in auto assignment:', error);
  }
};
