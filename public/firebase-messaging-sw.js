importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

const params = new URLSearchParams(self.location.search);
firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

firebase.messaging().onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Nouveau message';
  self.registration.showNotification(title, {
    body: payload.notification?.body || 'Vous avez reçu un nouveau message.',
    icon: '/pwa-192x192.png',
    data: payload.data || {},
  });
});