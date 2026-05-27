const express = require('express');
const router = express.Router();
const { getChatHistory, uploadAttachment, markMessagesSeen } = require('../controllers/chatController');
const { protect, verifiedProfessional } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure attachments directory exists robustly
const uploadDir = path.join(__dirname, '..', 'uploads', 'attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/attachments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/:consultationId/seen', protect, markMessagesSeen);
router.get('/:consultationId', protect, getChatHistory);
router.post('/upload', protect, verifiedProfessional, upload.single('file'), uploadAttachment);

module.exports = router;
