const { User, Availability, Testimonial, Consultation } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const validateEmail = require('../utils/validateEmail');
const sendEmail = require('../utils/sendEmail');


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
    // Accept both ?specialty= (legacy) and ?specialization= (triage system)
    const specialty = req.query.specialty || req.query.specialization;
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
      attributes: ['id', 'name', 'specialty', 'experience_years', 'is_verified', 'availability_status'],
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
          required: false,
          attributes: ['id']
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

    // For each doctor, count their active queue (pending + assigned consultations)
    const { Consultation } = require('../models');
    const doctorsWithRatings = await Promise.all(doctors.map(async (doc) => {
      const docJSON = doc.toJSON();
      const testimonials = docJSON.ReceivedTestimonials || [];
      const totalReviews = testimonials.length;
      const sum = testimonials.reduce((acc, curr) => acc + curr.rating, 0);
      const averageRating = totalReviews > 0 ? (sum / totalReviews).toFixed(1) : 0;

      // Count active patients in this doctor's queue
      const activeQueueCount = await Consultation.count({
        where: {
          doctor_id: doc.id,
          status: { [Op.in]: ['assigned', 'in_progress', 'waiting_for_results'] }
        }
      });

      // Count patients waiting to be assigned to this specialty
      const waitingCount = await Consultation.count({
        where: {
          queue_status: 'waiting',
          status: 'pending',
          ...(docJSON.specialty ? { target_specialty: docJSON.specialty } : {})
        }
      });

      // Estimated wait: 15 mins per active patient ahead
      const estimatedWaitMins = activeQueueCount * 15;

      delete docJSON.ReceivedTestimonials;
      docJSON.averageRating = Number(averageRating);
      docJSON.totalReviews = totalReviews;
      docJSON.activeQueueCount = activeQueueCount;
      docJSON.waitingCount = waitingCount;
      docJSON.estimatedWaitMins = estimatedWaitMins;
      return docJSON;
    }));

    // Sort: available first, then busy, then offline
    const statusOrder = { available: 0, busy: 1, offline: 2 };
    doctorsWithRatings.sort((a, b) => {
      const sa = statusOrder[a.availability_status] ?? 3;
      const sb = statusOrder[b.availability_status] ?? 3;
      if (sa !== sb) return sa - sb;
      return a.activeQueueCount - b.activeQueueCount; // within same status, least busy first
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

// @desc    Verify a doctor (Approve, Reject, Suspend)
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

    const { status, rejection_reason } = req.body;
    
    if (!['pending', 'verified', 'rejected', 'suspended'].includes(status)) {
       return res.status(400).json({ message: 'Invalid status' });
    }

    user.verification_status = status;
    user.is_verified = status === 'verified';
    
    if (status === 'rejected' || status === 'suspended') {
        user.rejection_reason = rejection_reason || null;
    } else {
        user.rejection_reason = null;
    }

    await user.save();

    // Send email notification to doctor based on status
    try {
      let subject, message;
      const appName = process.env.FROM_NAME || 'HealthConnect';
      const supportEmail = process.env.FROM_EMAIL || 'support@healthconnect.com';

      if (status === 'verified') {
        subject = `${appName} — Your Account Has Been Approved!`;
        message =
          `Dear Dr. ${user.name},\n\n` +
          `Great news! Your doctor account on ${appName} has been reviewed and approved by our admin team.\n\n` +
          `You can now log in and start accepting patient consultations.\n\n` +
          `Login at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login\n\n` +
          `If you have any questions, please contact us at ${supportEmail}.\n\n` +
          `Welcome aboard,\nThe ${appName} Team`;
      } else if (status === 'rejected') {
        subject = `${appName} — Application Update`;
        message =
          `Dear Dr. ${user.name},\n\n` +
          `We have reviewed your application and unfortunately we are unable to approve it at this time.\n\n` +
          (rejection_reason ? `Reason: ${rejection_reason}\n\n` : '') +
          `If you believe this is an error or would like to reapply with updated documents, please contact us at ${supportEmail}.\n\n` +
          `Regards,\nThe ${appName} Team`;
      } else if (status === 'suspended') {
        subject = `${appName} — Account Suspended`;
        message =
          `Dear Dr. ${user.name},\n\n` +
          `Your account on ${appName} has been suspended.\n\n` +
          (rejection_reason ? `Reason: ${rejection_reason}\n\n` : '') +
          `Please contact us at ${supportEmail} if you have questions or wish to appeal this decision.\n\n` +
          `Regards,\nThe ${appName} Team`;
      } else if (status === 'pending') {
        subject = `${appName} — Application Under Review`;
        message =
          `Dear Dr. ${user.name},\n\n` +
          `Your application is currently under review by our admin team. We will notify you once a decision has been made.\n\n` +
          `If you have any questions, please contact us at ${supportEmail}.\n\n` +
          `Regards,\nThe ${appName} Team`;
      }

      if (subject && message) {
        await sendEmail({ email: user.email, subject, message });
      }
    } catch (emailErr) {
      // Don't fail the request if email sending fails — just log it
      console.error('[verifyDoctor] Failed to send notification email:', emailErr.message);
    }

    res.status(200).json({
      message: `Doctor verification status updated to ${status}`,
      user: {
        id: user.id,
        name: user.name,
        is_verified: user.is_verified,
        verification_status: user.verification_status
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

// @desc    Update a user (doctor or specialist) by admin
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const {
      name, email, specialty, license_number, experience_years,
      work_location, specializations, current_workplace
    } = req.body;

    if (name !== undefined) user.name = name;
    if (specialty !== undefined) user.specialty = specialty;
    if (license_number !== undefined) user.license_number = license_number;
    if (experience_years !== undefined) user.experience_years = experience_years;
    if (work_location !== undefined) user.work_location = work_location;
    if (specializations !== undefined) user.specializations = specializations;
    if (current_workplace !== undefined) user.current_workplace = current_workplace;

    // Only update email if it changed and isn't taken
    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email is already in use by another account.' });
      user.email = email;
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// @desc    Get doctor availability status (auto-computed from active consultations)
// @route   GET /api/users/availability
// @access  Private (Doctor)
exports.getAvailabilityStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'role', 'is_verified', 'availability_status']
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Auto-derive status from active workload
    const activeCount = await Consultation.count({
      where: {
        doctor_id: req.user.id,
        status: { [Op.in]: ['assigned', 'in_progress', 'waiting_for_results'] }
      }
    });

    let computedStatus;
    if (!user.is_verified) {
      computedStatus = 'offline';
    } else if (activeCount > 0) {
      computedStatus = 'busy';
    } else {
      computedStatus = 'available';
    }

    // Keep the DB field in sync so the patient-facing doctor list stays accurate
    if (user.availability_status !== computedStatus) {
      await User.update({ availability_status: computedStatus }, { where: { id: req.user.id } });
    }

    res.status(200).json({
      availability_status: computedStatus,
      active_consultations: activeCount,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error fetching availability' });
  }
};

// @desc    (Deprecated — availability is now auto-computed) kept for backward compat
// @route   PUT /api/users/availability
// @access  Private (Doctor)
exports.toggleAvailability = async (req, res) => {
  // Redirect to the computed status — manual override is no longer supported
  return exports.getAvailabilityStatus(req, res);
};
