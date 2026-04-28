const webpush = require('web-push');
const { Notification, PushSubscription } = require('../models');

// Configure web-push with VAPID keys from environment variables
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@healthconnect.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Sends a push notification to all devices registered to a specific user.
 * 
 * @param {string} userId - The unique identifier of the user.
 * @param {string} title - Title of the notification.
 * @param {string} message - Body of the notification.
 * @param {string} type - System type e.g. 'lab_request', 'consultation', 'reminder', 'chat'.
 * @param {string} redirectUrl - URL frontend should redirect to on click.
 */
const sendPushNotification = async (userId, title, message, type, redirectUrl = '/') => {
  try {
    // 1. Save to Database to form Notification History
    const newNotification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      redirect_url: redirectUrl,
      is_read: false
    });

    // 2. Fetch all Active Subscriptions for User
    const subscriptions = await PushSubscription.findAll({ where: { user_id: userId } });

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No active push subscriptions found for user: ${userId}`);
      return;
    }

    // 3. Construct Payload
    const payload = JSON.stringify({
      title,
      body: message,
      url: redirectUrl,
      icon: '/vite.svg', // generic icon
      badge: '/badge.png' // small icon for android top bar, assuming exists
    });

    // 4. Send parallel push notifications
    const pushPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushConfig, payload);
      } catch (error) {
        // If the subscription is no longer valid (e.g. user revoked permission or cleared browser history)
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Deleting invalid/expired subscription for user ${userId}`);
          await sub.destroy();
        } else {
          console.error(`Error sending push to subscription ${sub.id}:`, error);
        }
      }
    });

    await Promise.all(pushPromises);
    return newNotification;
  } catch (err) {
    console.error('Failed to process and send push notification:', err);
  }
};

module.exports = {
  sendPushNotification
};
