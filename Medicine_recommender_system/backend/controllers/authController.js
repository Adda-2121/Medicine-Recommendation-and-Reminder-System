const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, sequelize } = require('../models');
const sendEmail = require('../utils/sendEmail');
const { sendSMS } = require('../utils/smsService');

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const getLoginKey = (req, email) => {
  const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : 'unknown';
  return `${req.ip || 'unknown'}:${normalizedEmail}`;
};

const isLoginWindowExpired = (attempt) => {
  if (!attempt || !attempt.firstAttempt) return true;
  return Date.now() - attempt.firstAttempt >= LOGIN_WINDOW_MS;
};

const recordFailedLogin = (req, email) => {
  const key = getLoginKey(req, email);
  const existing = loginAttempts.get(key);
  if (!existing || isLoginWindowExpired(existing)) {
    loginAttempts.set(key, { count: 1, firstAttempt: Date.now() });
  } else {
    loginAttempts.set(key, { count: existing.count + 1, firstAttempt: existing.firstAttempt });
  }
};

const resetLoginAttempts = (req, email) => {
  loginAttempts.delete(getLoginKey(req, email));
};

const hasExceededLoginAttempts = (req, email) => {
  const attempt = loginAttempts.get(getLoginKey(req, email));
  if (!attempt) return false;
  if (isLoginWindowExpired(attempt)) {
    loginAttempts.delete(getLoginKey(req, email));
    return false;
  }
  return attempt.count >= MAX_LOGIN_ATTEMPTS;
};

// @desc    Check if email exists
// @route   POST /api/auth/check-email
// @access  Public
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ exists: false, message: 'Email is required' });
    }
    
    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });
    
    if (user) {
      return res.json({ 
        exists: true, 
        message: 'An account with this email already exists' 
      });
    }
    
    return res.json({ exists: false, message: 'Email is available' });
  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ exists: false, message: 'Server error' });
  }
};

// @desc    Check if phone number exists
// @route   POST /api/auth/check-phone
// @access  Public
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ exists: false, message: 'Phone number is required' });
    }
    
    const user = await User.findOne({ 
      where: { phone_number: phone.replace(/\s/g, '') } 
    });
    
    if (user) {
      return res.json({ 
        exists: true, 
        message: 'An account with this phone number already exists' 
      });
    }
    
    return res.json({ exists: false, message: 'Phone number is available' });
  } catch (error) {
    console.error('Check phone error:', error);
    return res.status(500).json({ exists: false, message: 'Server error' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone_number, age, sex, license_number, license_issuing_authority, license_expiry_date, degree, university_name, graduation_year, experience_years, current_workplace, specialty } = req.body;

    // Validation: Name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'please wright your full name' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'please wright your full name' });
    }
    if (/\d/.test(name)) {
      return res.status(400).json({ message: 'Name cannot contain numbers.' });
    }
    if (!/^[a-zA-Z\s\u1200-\u137F]+$/.test(name)) {
      return res.status(400).json({ message: 'Name can only contain letters and spaces.' });
    }

    // Validation: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email.toLowerCase().trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Validation: Password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter.' });
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter.' });
    }
    if (!/(?=.*\d)/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number.' });
    }

    // Validation: Phone number (if provided)
    if (phone_number) {
      const phoneRegex = /^\+251[79]\d{8}$/;
      if (!phoneRegex.test(phone_number.replace(/\s/g, ''))) {
        return res.status(400).json({ message: 'Please enter a valid Ethiopian phone number (e.g., +251911234567).' });
      }
      
      // Check if phone number already exists
      const existingPhone = await User.findOne({ where: { phone_number: phone_number.replace(/\s/g, '') } });
      if (existingPhone) {
        return res.status(400).json({ message: 'An account with this phone number already exists.' });
      }
    }

    // Validation: Age (if provided)
    if (age) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        return res.status(400).json({ message: 'Please enter a valid age between 1 and 150.' });
      }
    }

    // Validate role to prevent admin registration on public endpoint
    const userRole = role || 'patient';
    if (userRole === 'admin' || userRole === 'company_admin') {
      return res.status(403).json({ message: 'Registration as admin is not allowed.' });
    }

    // Doctor-specific validations
    if (userRole === 'doctor') {
      if (!req.files || !req.files['document'] || !req.files['selfie'] || !req.files['id_document'] || !req.files['degree_document']) {
        const errMsg = 'License Document, Selfie, National ID, and Degree Document are required for doctors.';
        return res.status(400).json({ message: errMsg, errors: { document: errMsg, selfie: errMsg, id_document: errMsg, degree_document: errMsg } });
      }
      if (!license_number || license_number.trim().length === 0) {
        return res.status(400).json({ message: 'License number is required for doctors.' });
      }
      if (!license_issuing_authority || license_issuing_authority.trim().length === 0) {
        return res.status(400).json({ message: 'License issuing authority is required for doctors.' });
      }
      if (!license_expiry_date) {
        return res.status(400).json({ message: 'License expiry date is required for doctors.' });
      }
      // Validate license expiry date is in the future
      if (new Date(license_expiry_date) <= new Date()) {
        return res.status(400).json({ message: 'License expiry date must be in the future.' });
      }
      if (!degree || degree.trim().length === 0) {
        return res.status(400).json({ message: 'Degree is required for doctors.' });
      }
      if (!university_name || university_name.trim().length === 0) {
        return res.status(400).json({ message: 'University name is required for doctors.' });
      }
      if (!graduation_year) {
        return res.status(400).json({ message: 'Graduation year is required for doctors.' });
      }
      const gradYear = parseInt(graduation_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(gradYear) || gradYear < 1950 || gradYear > currentYear) {
        return res.status(400).json({ message: `Graduation year must be between 1950 and ${currentYear}.` });
      }
      if (!specialty || specialty.trim().length === 0) {
        return res.status(400).json({ message: 'Medical specialty is required for doctors.' });
      }
      if (experience_years) {
        const expYears = parseInt(experience_years);
        if (isNaN(expYears) || expYears < 0 || expYears > 70) {
          return res.status(400).json({ message: 'Experience years must be between 0 and 70.' });
        }
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const userPayload = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: userRole,
      phone_number: phone_number ? phone_number.replace(/\s/g, '') : null,
      age: age ? parseInt(age) : null,
      sex: sex || null,
    };

    if (userRole === 'doctor') {
      userPayload.license_number = license_number.trim();
      userPayload.license_issuing_authority = license_issuing_authority.trim();
      userPayload.license_expiry_date = license_expiry_date;
      userPayload.degree = degree.trim();
      userPayload.university_name = university_name.trim();
      userPayload.graduation_year = parseInt(graduation_year);
      userPayload.experience_years = experience_years ? parseInt(experience_years) : null;
      userPayload.current_workplace = current_workplace ? current_workplace.trim() : null;
      userPayload.specialty = specialty.trim();
      
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
    const msg = error?.message || 'Server error during registration';
    res.status(500).json({ message: msg });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (hasExceededLoginAttempts(req, email)) {
      return res.status(429).json({ message: 'Too many failed login attempts. Please try again later.' });
    }

    // Case-insensitive email lookup
    const user = await User.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')),
        email.toLowerCase().trim()
      )
    });

    const invalidResponse = () => {
      recordFailedLogin(req, email);
      return res.status(400).json({ message: 'Invalid credentials' });
    };

    if (!user) {
      return invalidResponse();
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return invalidResponse();
    }

    resetLoginAttempts(req, email);

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
        console.error('\n[WARNING] Email failed to send due to network/SMTP issues.', err.message);
        console.log(`[DEV MODE] Password Reset Link for ${user.email}:\n${resetUrl}\n`);
        
        // In development, if email fails, provide the link directly so testing can continue
        if (process.env.NODE_ENV === 'development') {
          return res.status(200).json({ 
            message: `Email sending failed (network blocked). DEV MODE FALLBACK activated.`,
            devResetUrl: resetUrl
          });
        }
        
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        return res.status(500).json({ message: 'Email could not be sent. Please contact support.' });
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
