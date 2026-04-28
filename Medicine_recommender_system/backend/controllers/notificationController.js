const { Notification, PushSubscription } = require('../models');

// @desc    Get VAPID Public Key
// @route   GET /api/notifications/vapid-public-key
// @access  Public
exports.getVapidPublicKey = (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// @desc    Subscribe to push notifications
// @route   POST /api/notifications/subscribe
// @access  Private
exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    // Check if subscription exists, if not, create it
    const existingSub = await PushSubscription.findOne({ where: { endpoint } });
    if (existingSub) {
      // If it exists but for a different user (e.g. log in as different user on same device)
      if (existingSub.user_id !== req.user.id) {
        existingSub.user_id = req.user.id;
        existingSub.p256dh = keys.p256dh;
        existingSub.auth = keys.auth;
        await existingSub.save();
      }
      return res.status(200).json({ message: 'Subscription already exists and updated' });
    }

    await PushSubscription.create({
      user_id: req.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Push Subscribe error:', error);
    res.status(500).json({ message: 'Server error saving subscription' });
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50 // Keep history manageable
    });
    
    // Auto-delete older than top 50 can be handled by cron later, here we just limit what's retrieved.
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.is_read = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error updating notification' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error updating notifications' });
  }
};
