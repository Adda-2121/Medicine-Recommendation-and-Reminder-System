const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, checkEmail, checkPhone } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  registrationValidation,
  loginValidation,
  handleValidationErrors,
  sanitizeInput,
  checkRateLimit
} = require('../middlewares/validationMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    const allowedTypes = /jpeg|jpg|png|pdf|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WEBP) and PDF files are allowed'));
    }
  }
});

// Check email uniqueness
router.post('/check-email', sanitizeInput, checkEmail);

// Check phone uniqueness
router.post('/check-phone', sanitizeInput, checkPhone);

// Registration route with validation and rate limiting
router.post('/register', 
  checkRateLimit('register', 5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
    { name: 'id_document', maxCount: 1 },
    { name: 'degree_document', maxCount: 1 },
    { name: 'experience_document', maxCount: 1 }
  ]),
  sanitizeInput,
  registrationValidation(),
  handleValidationErrors,
  register
);

// Login route with validation
router.post('/login',
  sanitizeInput,
  loginValidation(),
  handleValidationErrors,
  login
);

// Get current user
router.get('/me', protect, getMe);

// Forgot password with rate limiting
router.post('/forgotpassword',
  checkRateLimit('forgotpassword', 3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  sanitizeInput,
  forgotPassword
);

// Reset password
router.put('/resetpassword/:resettoken',
  sanitizeInput,
  resetPassword
);

module.exports = router;
