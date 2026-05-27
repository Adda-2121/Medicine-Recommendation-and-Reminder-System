const { body, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Provides reusable validation rules and error handling
 */

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Name validation rules
const nameValidation = () => [
  body('name')
    .trim()
    .notEmpty().withMessage('Please fill in your full name')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\u1200-\u137F]+$/).withMessage('Name can only contain letters and spaces')
    .customSanitizer(value => value.replace(/\s+/g, ' ')) // Remove extra spaces
];

// Email validation rules
const emailValidation = () => [
  body('email')
    .trim()
    .notEmpty().withMessage('Please fill in your email address')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase()
];

// Password validation rules
const passwordValidation = (fieldName = 'password') => [
  body(fieldName)
    .notEmpty().withMessage('Please fill in your password')
    .isLength({ min: 8, max: 100 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .not().matches(/\s/).withMessage('Password cannot contain spaces')
];

// Phone number validation rules (Ethiopian format)
const phoneValidation = (isRequired = false) => {
  const validation = body('phone_number')
    .trim()
    .matches(/^\+251[79]\d{8}$/).withMessage('Please enter a valid Ethiopian phone number (e.g., +251911234567)');
  
  if (isRequired) {
    validation.notEmpty().withMessage('Please fill in your phone number');
  } else {
    validation.optional({ checkFalsy: true });
  }
  
  return [validation];
};

// Age validation rules
const ageValidation = () => [
  body('age')
    .notEmpty().withMessage('Please fill in your age')
    .isInt({ min: 1, max: 150 }).withMessage('Age must be between 1 and 150')
    .toInt()
];

// Gender validation rules
const genderValidation = () => [
  body('sex')
    .notEmpty().withMessage('Please select your gender')
    .isIn(['Male', 'Female']).withMessage('Gender must be Male or Female')
];

// Role validation rules
const roleValidation = () => [
  body('role')
    .notEmpty().withMessage('Please select your role')
    .isIn(['patient', 'doctor', 'laboratorist', 'radiologist', 'admin']).withMessage('Invalid role selected')
];

// Confirm password validation
const confirmPasswordValidation = () => [
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Doctor-specific validations
const doctorValidation = () => [
  body('specialty')
    .trim()
    .notEmpty().withMessage('Please fill in your specialty')
    .isLength({ min: 2, max: 100 }).withMessage('Specialty must be between 2 and 100 characters'),
  
  body('license_number')
    .trim()
    .notEmpty().withMessage('Please fill in your license number')
    .isLength({ min: 3, max: 50 }).withMessage('License number must be between 3 and 50 characters'),
  
  body('license_expiry_date')
    .notEmpty().withMessage('Please fill in license expiry date')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('License expiry date must be in the future');
      }
      return true;
    }),
  
  body('license_issuing_authority')
    .trim()
    .notEmpty().withMessage('Please fill in issuing authority')
    .isLength({ min: 2, max: 100 }).withMessage('Issuing authority must be between 2 and 100 characters'),
  
  body('degree')
    .trim()
    .notEmpty().withMessage('Please fill in your degree')
    .isLength({ min: 2, max: 100 }).withMessage('Degree must be between 2 and 100 characters'),
  
  body('university_name')
    .trim()
    .notEmpty().withMessage('Please fill in your university name')
    .isLength({ min: 2, max: 100 }).withMessage('University name must be between 2 and 100 characters'),
  
  body('graduation_year')
    .notEmpty().withMessage('Please fill in graduation year')
    .isInt({ min: 1950, max: new Date().getFullYear() }).withMessage(`Graduation year must be between 1950 and ${new Date().getFullYear()}`)
    .toInt(),
  
  body('experience_years')
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 70 }).withMessage('Experience years must be between 0 and 70')
    .toInt(),
  
  body('current_workplace')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Current workplace must not exceed 200 characters')
];

// Specialist validation (laboratorist/radiologist)
const specialistValidation = () => [
  body('work_location')
    .trim()
    .notEmpty().withMessage('Please fill in work location')
    .isLength({ min: 2, max: 200 }).withMessage('Work location must be between 2 and 200 characters'),
  
  body('specializations')
    .isArray({ min: 1 }).withMessage('Please select at least one specialization')
];

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
  // Remove any HTML tags from string inputs
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.replace(/<[^>]*>/g, '').trim();
    }
    return str;
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  next();
};

// Rate limiting validation helper
const checkRateLimit = (identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + identifier;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, []);
    }
    
    const userAttempts = attempts.get(key).filter(time => now - time < windowMs);
    
    if (userAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.'
      });
    }
    
    userAttempts.push(now);
    attempts.set(key, userAttempts);
    
    next();
  };
};

// Combined registration validation
const registrationValidation = () => [
  ...nameValidation(),
  ...emailValidation(),
  ...passwordValidation(),
  ...ageValidation(),
  ...genderValidation(),
  ...roleValidation(),
  ...phoneValidation(false)
];

// Login validation
const loginValidation = () => [
  body('email')
    .trim()
    .notEmpty().withMessage('Please fill in your email address')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty().withMessage('Please fill in your password')
];

// Profile update validation
const profileUpdateValidation = () => [
  ...nameValidation(),
  ...ageValidation(),
  ...genderValidation(),
  ...phoneValidation(false),
  
  body('current_workplace')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Current workplace must not exceed 200 characters')
];

// Password update validation
const passwordUpdateValidation = () => [
  body('currentPassword')
    .notEmpty().withMessage('Please fill in your current password'),
  
  ...passwordValidation('newPassword'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Consultation validation
const consultationValidation = () => [
  body('reason')
    .trim()
    .notEmpty().withMessage('Please select a reason for visit')
    .isLength({ min: 1, max: 200 }).withMessage('Reason must not exceed 200 characters'),
  
  body('symptoms_description')
    .trim()
    .notEmpty().withMessage('Please describe your symptoms')
    .isLength({ min: 10, max: 2000 }).withMessage('Symptoms description must be between 10 and 2000 characters')
];

// Referral validation
const referralValidation = () => [
  body('target_specialty')
    .trim()
    .notEmpty().withMessage('Please select specialist type'),
  
  body('referral_reason')
    .trim()
    .notEmpty().withMessage('Please fill in referral reason')
    .isLength({ min: 10, max: 500 }).withMessage('Referral reason must be between 10 and 500 characters'),
  
  body('referral_notes')
    .trim()
    .notEmpty().withMessage('Please fill in referral notes')
    .isLength({ min: 10, max: 1000 }).withMessage('Referral notes must be between 10 and 1000 characters'),
  
  body('urgency')
    .notEmpty().withMessage('Please select urgency level')
    .isIn(['routine', 'urgent', 'emergency']).withMessage('Invalid urgency level')
];

// Reminder validation
const reminderValidation = () => [
  body('patient_id')
    .notEmpty().withMessage('Please fill in patient ID')
    .isInt({ min: 1 }).withMessage('Invalid patient ID')
    .toInt(),
  
  body('reminder_type')
    .notEmpty().withMessage('Please select reminder type')
    .isIn(['medicine', 'follow_up', 'general']).withMessage('Invalid reminder type'),
  
  body('scheduled_time')
    .notEmpty().withMessage('Please fill in scheduled time')
    .isISO8601().withMessage('Invalid date/time format'),
  
  body('medicine_name')
    .if(body('reminder_type').equals('medicine'))
    .notEmpty().withMessage('Please fill in medicine name')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Medicine name must be between 2 and 200 characters')
];

// Feedback validation
const feedbackValidation = () => [
  body('rating')
    .notEmpty().withMessage('Please select a rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
    .toInt(),
  
  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 1000 }).withMessage('Comment must be between 5 and 1000 characters')
];

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  checkRateLimit,
  
  // Individual validations
  nameValidation,
  emailValidation,
  passwordValidation,
  phoneValidation,
  ageValidation,
  genderValidation,
  roleValidation,
  confirmPasswordValidation,
  doctorValidation,
  specialistValidation,
  
  // Combined validations
  registrationValidation,
  loginValidation,
  profileUpdateValidation,
  passwordUpdateValidation,
  consultationValidation,
  referralValidation,
  reminderValidation,
  feedbackValidation
};
