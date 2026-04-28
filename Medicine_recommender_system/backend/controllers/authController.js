const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone_number, age, sex, license_number, license_issuing_authority, license_expiry_date } = req.body;

    // Validation
    if (/\d/.test(name)) {
      return res.status(400).json({ message: 'Name cannot contain numbers.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email format.' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Validate role to prevent admin registration on public endpoint
    const userRole = role || 'patient';
    if (userRole === 'admin' || userRole === 'company_admin') {
      return res.status(403).json({ message: 'Registration as admin is not allowed.' });
    }

    if (userRole === 'doctor') {
      if (!req.files || !req.files['document'] || !req.files['selfie']) {
        return res.status(400).json({ message: 'Both License Document and Selfie are required for doctors.' });
      }
      if (!license_number || !license_issuing_authority || !license_expiry_date) {
        return res.status(400).json({ message: 'License Number, Issuing Authority, and Expiry Date are required for doctors.' });
      }
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userPayload = {
      name,
      email,
      password: hashedPassword,
      role: userRole,
      phone_number: phone_number || null,
      age: age || null,
      sex: sex || null,
    };

    if (userRole === 'doctor') {
      userPayload.license_number = license_number;
      userPayload.license_issuing_authority = license_issuing_authority;
      userPayload.license_expiry_date = license_expiry_date;
      userPayload.verification_document = req.files['document'][0].path;
      userPayload.selfie_document = req.files['selfie'][0].path;
      userPayload.is_verified = false;
    }

    const user = await User.create(userPayload);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT Payload
    const payload = {
      id: user.id,
      role: user.role,
    };

    // Sign Token securely with HS256 algorithm
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret123',
      {
        expiresIn: '7d',
        algorithm: 'HS256'
      }
    );

    // Security Audit Log
    if (user.role === 'company_admin') {
      console.log(`[SECURITY] Admin ${user.email} logged in successfully from IP: ${req.ip || 'unknown'}`);
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        specializations: user.specializations,
        work_location: user.work_location,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { method, identifier } = req.body;

    // Support legacy requests that only send email
    const resetMethod = method || 'email';
    const resetIdentifier = identifier || req.body.email;

    if (!resetIdentifier) {
      return res.status(400).json({ message: 'Please provide an email or phone number' });
    }

    let user;
    if (resetMethod === 'email') {
      user = await User.findOne({ where: { email: resetIdentifier } });
    } else if (resetMethod === 'sms') {
      user = await User.findOne({ where: { phone_number: resetIdentifier } });
    } else {
      return res.status(400).json({ message: 'Invalid reset method' });
    }

    if (!user) {
      return res.status(404).json({ message: `There is no user with that ${resetMethod}` });
    }

    if (resetMethod === 'email') {
      // Email Reset Logic (Link)
      const resetToken = crypto.randomBytes(20).toString('hex');

      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      await user.save();

      const resetUrl = `${req.protocol}://${req.get('host').replace('5000', '5173')}/reset-password/${resetToken}`;
      const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Password reset token',
          message
        });
        res.status(200).json({ message: 'Email sent' });
      } catch (err) {
        console.log(err);
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        return res.status(500).json({ message: 'Email could not be sent' });
      }

    } else if (resetMethod === 'sms') {
      // SMS Reset Logic (6-digit OTP)
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

      user.resetOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');
      user.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      const message = `Your HealthConnect password reset code is: ${otp}. It expires in 10 minutes.`;

      // MOCK SMS PROVIDER
      console.log(`\n\n========== MOCK SMS ==========\nTo: ${user.phone_number}\nMessage: ${message}\n==============================\n\n`);

      res.status(200).json({ message: 'SMS sent successfully', requireOtp: true });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error on forgot password' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const tokenOrOtp = req.params.resettoken;
    let user;

    // Check if it's a 6-digit OTP or a hash token
    if (/^\d{6}$/.test(tokenOrOtp)) {
      // It's an OTP
      const resetOtp = crypto
        .createHash('sha256')
        .update(tokenOrOtp)
        .digest('hex');

      user = await User.findOne({
        where: {
          resetOtp,
          resetOtpExpire: { [Op.gt]: Date.now() }
        }
      });
    } else {
      // It's a URL Token
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(tokenOrOtp)
        .digest('hex');

      user = await User.findOne({
        where: {
          resetPasswordToken,
          resetPasswordExpire: { [Op.gt]: Date.now() }
        }
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token/OTP' });
    }

    if (!req.body.password || req.body.password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Clear both token and OTP fields
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    user.resetOtp = null;
    user.resetOtpExpire = null;

    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error on resetting password' });
  }
};
