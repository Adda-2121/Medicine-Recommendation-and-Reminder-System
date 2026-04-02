const express = require('express');
const router = express.Router();
const { createReminder, getReminders } = require('../controllers/reminderController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createReminder);
router.get('/', protect, getReminders);

module.exports = router;
