const { User, Availability, Testimonial } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const validateEmail = require('../utils/validateEmail');


// @desc    Get all users (filter by role optional)
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let whereClause = {};
    if (role) {
      whereClause.role = role;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Get verified doctors
// @route   GET /api/users/doctors
// @access  Public/Private (Patient)
exports.getVerifiedDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;
    let whereClause = {
      role: 'doctor',
      is_verified: true
    };
    
    if (specialty) {
      whereClause.specialty = specialty;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const doctors = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'specialty', 'experience_years', 'is_verified'],
      include: [
        {
          model: Availability,
          as: 'Availabilities',
          where: {
            is_booked: false,
            date: {
              [Op.gte]: today
            }
          },
          required: false, // Use left join so we get all doctors even without availabilities
          attributes: ['id'] // just need to check if exists/count
        },
        {
          model: Testimonial,
          as: 'ReceivedTestimonials',
          attributes: ['rating'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    const doctorsWithRatings = doctors.map(doc => {
      const docJSON = doc.toJSON();
      const testimonials = docJSON.ReceivedTestimonials || [];
      const totalReviews = testimonials.length;
      const sum = testimonials.reduce((acc, curr) => acc + curr.rating, 0);
      const averageRating = totalReviews > 0 ? (sum / totalReviews).toFixed(1) : 0;
      
      delete docJSON.ReceivedTestimonials; // keep payload small
      docJSON.averageRating = Number(averageRating);
      docJSON.totalReviews = totalReviews;
      return docJSON;
    });

    res.status(200).json(doctorsWithRatings);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error fetching doctors' });
  }
};

// @desc    Create a new user (Doctor/Admin etc)
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, specialty, license_number, experience_years, lab_categories, work_location } = req.body;

    const emailCheck = await validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.reason });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (work_location) {
      const existingRoom = await User.findOne({ where: { work_location } });
      if (existingRoom) {
        return res.status(400).json({ message: `Work location/Room '${work_location}' is already assigned to another specialist.` });
      }
    }

    const userPayload = {
      name,
      email,
      password: hashedPassword,
      role: role || 'patient',
    };

    if (role === 'doctor') {
      userPayload.specialty = specialty;
      userPayload.license_number = license_number;
      userPayload.experience_years = experience_years;
      userPayload.is_verified = false; // Requires explicit admin verification later
    }

    if (role === 'laboratorist' || role === 'radiologist') {
      userPayload.specializations = req.body.specializations || [];
      userPayload.work_location = work_location;
    }

    const user = await User.create(userPayload);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
};

// @desc    Verify a doctor
// @route   PUT /api/users/:id/verify
// @access  Private (Admin)
exports.verifyDoctor = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({ message: 'Only doctors can be verified' });
    }

    // Toggle verification status or explicitly set
    user.is_verified = req.body.is_verified !== undefined ? req.body.is_verified : true;
    await user.save();

    res.status(200).json({
      message: `Doctor ${user.is_verified ? 'verified' : 'unverified'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        is_verified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Verify doctor error:', error);
    res.status(500).json({ message: 'Server error verifying doctor' });
  }
};

// @desc    Update user profile & password
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone_number = req.body.phone;
    if (req.body.email) {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: 'Email address is already in use by another account.' });
      }
      user.email = req.body.email;
    }

    // Handle password update
    if (req.body.currentPassword && req.body.newPassword) {
      const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      if (req.body.newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.newPassword, salt);
    } else if (req.body.newPassword) {
      return res.status(400).json({ message: 'Current password is required.' });
    }

    if (req.file) {
      if (user.profile_picture) {
        try {
          const oldPath = path.join(__dirname, '..', user.profile_picture);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.error('Error removing old profile picture: ', err);
        }
      }
      user.profile_picture = `/uploads/profiles/${req.file.filename}`;
    }

    if (req.body.remove_picture === 'true' || req.body.remove_picture === true) {
      if (user.profile_picture) {
        try {
          const oldPath = path.join(__dirname, '..', user.profile_picture);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (err) {
          console.error('Error removing old profile picture: ', err);
        }
      }
      user.profile_picture = null;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        specializations: user.specializations,
        work_location: user.work_location,
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user. Make sure no records depend on this user.' });
  }
};

// @desc    Toggle doctor availability status
// @route   PUT /api/users/availability
// @access  Private (Doctor)
exports.toggleAvailability = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can toggle availability' });
    }

    const { status } = req.body; // 'available', 'busy', 'offline'
    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    user.availability_status = status;
    await user.save();

    // If they became available, trigger auto-assignment
    if (status === 'available') {
      const consultationController = require('./consultationController');
      // trigger auto assignment
      if (consultationController.triggerAutoAssignment) {
        consultationController.triggerAutoAssignment();
      }
    }

    res.status(200).json({
      message: `Status updated to ${status}`,
      availability_status: user.availability_status
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error updating availability' });
  }
};

// @desc    Get doctor availability status
// @route   GET /api/users/availability
// @access  Private (Doctor)
exports.getAvailabilityStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['availability_status'] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json({ availability_status: user.availability_status });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error fetching availability' });
  }
};
