importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDwwJu9MD1f2mm16PYYak-xxdZ5n3PbH8Y',
  authDomain: 'clarendon-elite-sports-program.firebaseapp.com',
  projectId: 'clarendon-elite-sports-program',
  storageBucket: 'clarendon-elite-sports-program.firebasestorage.app',
  messagingSenderId: '600948928205',
  appId: '1:600948928205:web:e16b29f03dc99ab4784384',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'CESP';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/brand/cesp-logo.jpg',
    badge: '/brand/cesp-logo.jpg',
    data: payload.data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(clients.openWindow(url));
});
