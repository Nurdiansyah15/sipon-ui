/* eslint-disable no-undef */
// Service workers register as classic (non-module) scripts, so ES `import` is not
// valid here — Firebase's own docs use importScripts() with the compat build for
// exactly this reason. This config is the public Firebase Web SDK config (same
// values as NUXT_PUBLIC_FIREBASE_* in .env) — not a secret, safe to inline.
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAu2oERVGGNpph1e9T0I2FE0HyvOAxQEUU',
  authDomain: 'sipon-2f5f6.firebaseapp.com',
  projectId: 'sipon-2f5f6',
  storageBucket: 'sipon-2f5f6.firebasestorage.app',
  messagingSenderId: '119053554404',
  appId: '1:119053554404:web:323d47dda5ec3b5fcf12f1',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'SIPON'
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  }
  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const clickAction = event.notification.data?.click_action
  if (clickAction) {
    event.waitUntil(clients.openWindow(clickAction))
  }
  else {
    event.waitUntil(clients.openWindow('/'))
  }
})
