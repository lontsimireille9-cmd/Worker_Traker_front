import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { api } from './api';
import { default as firebaseApp } from '../firebase/config';

let messagingPromise;

async function getBrowserMessaging() {
  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) => supported ? getMessaging(firebaseApp) : null);
  }
  return messagingPromise;
}

export async function registerForMessaging() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;
  const messaging = await getBrowserMessaging();
  if (!messaging) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return null;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.filter((registration) => registration.active?.scriptURL.includes('firebase-messaging-sw.js')).map((registration) => registration.unregister()));
  const workerUrl = new URL('../firebase/messaging-sw.js', import.meta.url);
  const registration = await navigator.serviceWorker.register(workerUrl, { type: 'module' });
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (token) await api.post('/messages/users/device-token', { token });
  onMessage(messaging, () => undefined);
  return token;
}