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

// @desc    Doctor marks a consultation as completed
// @route   PUT /api/consultations/:id/complete
// @access  Private (Doctor)
exports.completeConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (consultation.doctor_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this consultation' });
    }

    if (consultation.status === 'completed') {
      return res.status(400).json({ message: 'Consultation is already completed' });
    }

    consultation.status = 'completed';
    consultation.queue_status = 'completed';
    await consultation.save();

    // Free up doctor availability
    const busyCount = await Consultation.count({
      where: { doctor_id: req.user.id, status: { [Op.in]: ['pending', 'assigned'] } }
    });
    if (busyCount === 0) {
      await User.update(
        { availability_status: 'available' },
        { where: { id: req.user.id } }
      );
    }

    res.status(200).json({ message: 'Consultation completed successfully', consultation });
  } catch (error) {
    console.error('Complete consultation error:', error);
    res.status(500).json({ message: 'Server error completing consultation' });
  }
};

// @desc    Get patient status categories for admin dashboard
// @route   GET /api/consultations/patient-statuses
// @access  Private (Company Admin)
exports.getPatientStatuses = async (req, res) => {
  try {
    const { TreatmentPlan, ServiceRequest } = require('../models');
    const INACTIVE_DAYS = parseInt(req.query.inactive_days) || 30;
    const inactiveCutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);

    // Fetch all patients with all consultations, payments, treatment plans, and active service requests
    const patients = await User.findAll({
      where: { role: 'patient' },
      attributes: ['id', 'name', 'email', 'created_at', 'updated_at'],
      include: [
        {
          model: Consultation,
          as: 'PatientConsultations',
          required: false,
          include: [
            { model: Payment, as: 'Payment', required: false },
            { model: TreatmentPlan, required: false },
            {
              model: ServiceRequest,
              required: false,
              where: { status: { [Op.in]: ['pending', 'in_progress'] } },
              separate: true // avoids cartesian product with other includes
            }
          ]
        }
      ]
    });

    const result = {
      in_consultation: [],
      completed_cured: [],
      inactive: [],
      paid_not_started: [],
      under_lab_process: []
    };

    for (const patient of patients) {
      const consultations = patient.PatientConsultations || [];
      const patientData = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        joined: patient.created_at
      };

      // Last activity = most recent consultation update, or account creation date
      const lastActivity = consultations.length > 0
        ? new Date(Math.max(...consultations.map(c => new Date(c.updated_at))))
        : new Date(patient.created_at);

      const daysInactive = Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24));

      // ── Category 5: Under Lab Process ──────────────────────────────────────
      // Has at least one service request with status pending OR in_progress
      const labConsultation = consultations.find(c =>
        c.ServiceRequests && c.ServiceRequests.length > 0
      );
      if (labConsultation) {
        result.under_lab_process.push({
          ...patientData,
          consultation_id: labConsultation.id,
          pending_lab_requests: labConsultation.ServiceRequests.length,
          last_activity: lastActivity
        });
      }

      // ── Category 1: Currently in Consultation ──────────────────────────────
      // Has a consultation with status pending OR assigned (not yet completed)
      const activeConsultation = consultations.find(c =>
        c.status === 'pending' || c.status === 'assigned'
      );
      if (activeConsultation) {
        result.in_consultation.push({
          ...patientData,
          consultation_id: activeConsultation.id,
          consultation_status: activeConsultation.status,
          severity: activeConsultation.severity_level,
          payment_status: activeConsultation.Payment?.status || 'none',
          appointment_date: activeConsultation.appointment_date,
          appointment_time: activeConsultation.appointment_time
        });
        continue; // active consultation takes priority — skip lower categories
      }

      // ── Category 2: Completed / Cured ──────────────────────────────────────
      // Consultation is completed (doctor marked it done, with or without a treatment plan)
      const curedConsultation = consultations.find(c => c.status === 'completed');
      if (curedConsultation) {
        result.completed_cured.push({
          ...patientData,
          consultation_id: curedConsultation.id,
          completed_at: curedConsultation.updated_at,
          cured_at: curedConsultation.TreatmentPlan?.cured_at || null,
          had_treatment_plan: !!curedConsultation.TreatmentPlan
        });
        continue;
      }

      // ── Category 4: Paid but Not Started Treatment ─────────────────────────
      // Payment is verified AND consultation has no treatment plan yet
      const paidNotStarted = consultations.find(c =>
        c.Payment &&
        c.Payment.status === 'verified' &&
        !c.TreatmentPlan
      );
      if (paidNotStarted) {
        result.paid_not_started.push({
          ...patientData,
          consultation_id: paidNotStarted.id,
          payment_status: paidNotStarted.Payment.status,
          consultation_status: paidNotStarted.status,
          payment_verified_at: paidNotStarted.Payment.updated_at
        });
        continue;
      }

      // ── Category 3: Inactive / Out of System ──────────────────────────────
      // Registered but no activity for the defined period (default 30 days)
      if (consultations.length === 0 || daysInactive >= INACTIVE_DAYS) {
        result.inactive.push({
          ...patientData,
          last_activity: lastActivity,
          days_inactive: daysInactive
        });
      }
    }

    res.status(200).json({
      summary: {
        in_consultation: result.in_consultation.length,
        completed_cured: result.completed_cured.length,
        inactive: result.inactive.length,
        paid_not_started: result.paid_not_started.length,
        under_lab_process: result.under_lab_process.length,
        total_patients: patients.length
      },
      inactive_threshold_days: INACTIVE_DAYS,
      data: result
    });
  } catch (error) {
    console.error('Get patient statuses error:', error);
    res.status(500).json({ message: 'Server error fetching patient statuses' });
  }
};
