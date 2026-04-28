import api from './api';

/**
 * Utility function to convert VAPID public key to a Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Initializes and registers push notifications for the supported browsers.
 */
export const initializePushNotifications = async () => {
  try {
    // 1. Check for Service Worker and Push Manager support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported in this browser.');
      return false;
    }

    // 2. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Push notification permission denied.');
      return false;
    }

    // 3. Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered with scope:', registration.scope);

    // Ensure the service worker is ready before subscribing
    await navigator.serviceWorker.ready;

    // 4. Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    // 5. If not subscribed, fetch public key and subscribe
    if (!subscription) {
      const vapidResponse = await api.get('/notifications/vapid-public-key');
      const publicVapidKey = vapidResponse.data.publicKey;
      
      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    // 6. Send subscription to our backend
    await api.post('/notifications/subscribe', subscription);
    console.log('Push subscription successful.');
    return true;

  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
};
