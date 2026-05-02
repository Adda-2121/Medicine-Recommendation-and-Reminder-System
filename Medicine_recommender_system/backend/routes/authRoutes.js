const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, sendVerificationOtp, sendVerificationSms, verifyOtp, verifyEmailOtp } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
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

const upload = multer({ storage: storage });

router.post('/send-verification', sendVerificationOtp);       // email OTP
router.post('/send-verification-sms', sendVerificationSms);   // SMS OTP
router.post('/verify-otp', verifyOtp);                        // unified verify
router.post('/verify-email', verifyEmailOtp);                 // backwards compat alias
router.post('/register', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'id_document', maxCount: 1 },
  { name: 'degree_document', maxCount: 1 },
  { name: 'experience_document', maxCount: 1 }
]), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
