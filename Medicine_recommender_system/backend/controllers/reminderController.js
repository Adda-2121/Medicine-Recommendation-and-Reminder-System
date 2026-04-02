const { Reminder, TreatmentPlan, User } = require('../models');

// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private (Doctor, Admin, Patient)
exports.createReminder = async (req, res) => {
  try {
    const { treatment_plan_id, patient_id, reminder_type, scheduled_time, medicine_name, medicine_type, dose, frequency } = req.body;

    // Determine the target patient
    let targetPatientId = patient_id;

    if (req.user.role === 'patient') {
      // Patients can only create reminders for themselves
      targetPatientId = req.user.id;
    } else if (!targetPatientId) {
      // Doctors/Admins must specify a patient
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    const reminder = await Reminder.create({
      treatment_plan_id,
      patient_id: targetPatientId,
      reminder_type,
      scheduled_time,
      medicine_name,
      medicine_type,
      dose,
      frequency,
    });

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder,
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Server error creating reminder' });
  }
};

// @desc    Get user's reminders
// @route   GET /api/reminders
// @access  Private
exports.getReminders = async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'patient') {
      whereClause.patient_id = req.user.id;
    }

    const reminders = await Reminder.findAll({
      where: whereClause,
      include: [{ model: User, as: 'Patient', attributes: ['id', 'name', 'email'] }],
      order: [['scheduled_time', 'ASC']]
    });

    res.status(200).json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error fetching reminders' });
  }
};
