// src/firebaseMessaging.js
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';

export const initMessaging = async () => {
  try {
    const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
    if (token) {
      console.log('FCM Token:', token);
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
};

onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // Handle incoming message
});
