const { Availability } = require('../models');

// @desc    Add availability slots
// @route   POST /api/availability
// @access  Private (Doctor)
exports.addAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can add availability slots.' });
    }

    const { date, start_time, end_time } = req.body;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({ message: 'Please provide date, start_time, and end_time.' });
    }

    const availability = await Availability.create({
      doctor_id: req.user.id,
      date,
      start_time,
      end_time,
      is_booked: false
    });

    res.status(201).json({
      message: 'Availability slot added successfully.',
      availability
    });
  } catch (error) {
    console.error('Add availability error:', error);
    res.status(500).json({ message: 'Server error adding availability.' });
  }
};

// @desc    Get availability slots (filtered by doctor)
// @route   GET /api/availability
// @access  Private
exports.getAvailabilities = async (req, res) => {
  try {
    const { doctor_id, date, is_booked } = req.query;
    
    let whereClause = {};

    if (doctor_id) whereClause.doctor_id = doctor_id;
    if (date) whereClause.date = date;
    if (is_booked !== undefined) whereClause.is_booked = is_booked === 'true';

    // If doctor fetches their own, they might want to see booked ones too.
    // If patient fetches, they only want is_booked=false (which they can pass in query).

    const availabilities = await Availability.findAll({
      where: whereClause,
      order: [['date', 'ASC'], ['start_time', 'ASC']]
    });

    res.status(200).json(availabilities);
  } catch (error) {
    console.error('Get availabilities error:', error);
    res.status(500).json({ message: 'Server error fetching availabilities.' });
  }
};

// @desc    Delete an availability slot
// @route   DELETE /api/availability/:id
// @access  Private (Doctor)
exports.deleteAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can delete availability slots.' });
    }

    const availability = await Availability.findByPk(req.params.id);

    if (!availability) {
      return res.status(404).json({ message: 'Availability slot not found.' });
    }

    if (availability.doctor_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this slot.' });
    }

    if (availability.is_booked) {
      return res.status(400).json({ message: 'Cannot delete a slot that is already booked.' });
    }

    await availability.destroy();

    res.status(200).json({ message: 'Availability slot deleted successfully.' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ message: 'Server error deleting availability.' });
  }
};
