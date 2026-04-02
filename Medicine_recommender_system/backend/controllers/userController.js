const { User } = require('../models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');


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

    const doctors = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'specialty', 'experience_years', 'is_verified'],
      order: [['name', 'ASC']]
    });

    res.status(200).json(doctors);
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
    const { name, email, password, role, specialty, license_number, experience_years } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};
