const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

// Get VAPID public key (can be public or private, making it public is fine)
router.get('/vapid-public-key', notificationController.getVapidPublicKey);

// Subscribe a device
router.post('/subscribe', protect, notificationController.subscribe);

// Notification history management
router.get('/', protect, notificationController.getNotifications);
router.put('/read-all', protect, notificationController.markAllAsRead);
router.put('/:id/read', protect, notificationController.markAsRead);

module.exports = router;
