const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { sendSMS } = require('../utils/smsService');
const validateEmail = require('../utils/validateEmail');

// In-memory OTP store keyed by identifier (email or phone)
// { identifier -> { otp, expiresAt, verified, method } }
const otpStore = new Map();

// ── helpers ──────────────────────────────────────────────────────────────────
const startCooldownCleanup = (key) => {
  setTimeout(() => otpStore.delete(key), 11 * 60 * 1000); // auto-clean after 11 min
};

// @desc    Send email verification OTP before registration
// @route   POST /api/auth/send-verification
// @access  Public
exports.sendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    // 1. Validate email is real (format + MX + disposable check)
    const emailCheck = await validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.reason });
    }

    // 2. Check not already registered
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const key = email.toLowerCase();

    otpStore.set(key, { otp, expiresAt, verified: false, method: 'email' });
    startCooldownCleanup(key);

    console.log(`\n🔐 [EMAIL OTP] ${email} → CODE: ${otp}  (expires in 10 min)\n`);

    const message =
      `Your HealthConnect email verification code is:\n\n` +
      `  ${otp}\n\n` +
      `This code expires in 10 minutes. Do not share it with anyone.\n\n` +
      `If you did not request this, please ignore this email.`;

    await sendEmail({ email, subject: 'HealthConnect — Email Verification Code', message });

    return res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Send verification OTP error:', error);
    return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
  }
};

// @desc    Send SMS verification OTP before registration
// @route   POST /api/auth/send-verification-sms
// @access  Public
exports.sendVerificationSms = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    // Basic phone format check — must start with + and have 7-15 digits
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Please enter a valid phone number with country code (e.g. +251911234567).' });
    }

    const normalised = phone.replace(/\s/g, '');

    // Check not already registered with this phone
    const existing = await User.findOne({ where: { phone_number: normalised } });
    if (existing) {
      return res.status(400).json({ message: 'An account with this phone number already exists.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(normalised, { otp, expiresAt, verified: false, method: 'sms' });
    startCooldownCleanup(normalised);

    console.log(`\n🔐 [SMS OTP] ${normalised} → CODE: ${otp}  (expires in 10 min)\n`);

    const sent = await sendSMS(normalised,
      `Your HealthConnect verification code is: ${otp}. It expires in 10 minutes. Do not share it.`
    );

    if (!sent) {
      return res.status(500).json({ message: 'Failed to send SMS. Please try email verification instead.' });
    }

    return res.status(200).json({ message: 'Verification code sent via SMS.' });
  } catch (error) {
    console.error('Send SMS OTP error:', error);
    return res.status(500).json({ message: 'Failed to send SMS. Please try again.' });
  }
};

// @desc    Verify OTP (email or SMS)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body; // identifier = email or phone
    if (!identifier || !otp) return res.status(400).json({ message: 'Identifier and OTP are required.' });

    const key = identifier.toLowerCase().replace(/\s/g, '');
    const record = otpStore.get(key);

    if (!record) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Incorrect verification code. Please try again.' });
    }

    record.verified = true;
    otpStore.set(key, record);

    return res.status(200).json({ message: 'Verified successfully.', method: record.method });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Server error verifying code.' });
  }
};

// Keep old endpoint name as alias for backwards compatibility
exports.verifyEmailOtp = exports.verifyOtp;

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone_number, age, sex, license_number, license_issuing_authority, license_expiry_date, degree, university_name, graduation_year, experience_years, current_workplace } = req.body;

    // Validation
    if (/\d/.test(name)) {
      return res.status(400).json({ message: 'Name cannot contain numbers.' });
    }

    // Validate email — checks format, typo detection, disposable domains, and MX records
    const emailCheck = await validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.reason });
    }

    // Require OTP verification before account creation (email or phone)
    // Check email OTP first; if not found, check phone OTP (SMS verification path)
    const emailKey = email.toLowerCase();
    const phoneKey = phone_number ? phone_number.replace(/\s/g, '') : null;

    let otpRecord = otpStore.get(emailKey);
    let usedKey = emailKey;

    if (!otpRecord || !otpRecord.verified) {
      // Try phone key as fallback (SMS verification)
      if (phoneKey) {
        otpRecord = otpStore.get(phoneKey);
        usedKey = phoneKey;
      }
    }

    if (!otpRecord || !otpRecord.verified) {
      return res.status(400).json({ message: 'Identity must be verified before registering. Please complete the verification step.' });
    }
    otpStore.delete(usedKey);

    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Validate role to prevent admin registration on public endpoint
    const userRole = role || 'patient';
    if (userRole === 'admin' || userRole === 'company_admin') {
      return res.status(403).json({ message: 'Registration as admin is not allowed.' });
    }

    if (userRole === 'doctor') {
      if (!req.files || !req.files['document'] || !req.files['selfie'] || !req.files['id_document'] || !req.files['degree_document']) {
        return res.status(400).json({ message: 'License Document, Selfie, National ID, and Degree Document are required for doctors.' });
      }
      if (!license_number || !license_issuing_authority || !license_expiry_date || !degree || !university_name || !graduation_year) {
        return res.status(400).json({ message: 'All professional and educational fields are required for doctors.' });
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
      userPayload.degree = degree;
      userPayload.university_name = university_name;
      userPayload.graduation_year = graduation_year;
      userPayload.experience_years = experience_years || null;
      userPayload.current_workplace = current_workplace || null;
      
      userPayload.verification_document = req.files['document'][0].path;
      userPayload.selfie_document = req.files['selfie'][0].path;
      userPayload.id_document = req.files['id_document'][0].path;
      userPayload.degree_document = req.files['degree_document'][0].path;
      if (req.files['experience_document']) {
        userPayload.experience_document = req.files['experience_document'][0].path;
      }
      
      userPayload.is_verified = false;
      userPayload.verification_status = 'pending';
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
        is_verified: user.is_verified,
        verification_status: user.verification_status,
        rejection_reason: user.rejection_reason,
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
