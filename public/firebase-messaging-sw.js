/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

(function initFirebaseMessagingSW() {
  try {
    const params = new URLSearchParams(self.location.search || '');
    const config = {
      apiKey: params.get('apiKey') || '',
      authDomain: params.get('authDomain') || undefined,
      projectId: params.get('projectId') || '',
      storageBucket: params.get('storageBucket') || undefined,
      messagingSenderId: params.get('messagingSenderId') || '',
      appId: params.get('appId') || '',
    };
    if (!config.apiKey || !config.projectId || !config.messagingSenderId || !config.appId) return;

    firebase.initializeApp(config);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload?.notification?.title || 'Notification';
      const options = {
        body: payload?.notification?.body || '',
        data: payload?.data || {},
        silent: false,
        vibrate: [200, 100, 200],
      };
      self.registration.showNotification(title, options);
    });
  } catch (_e) {
    // Silent fail: app should continue even if push is unavailable.
  }
})();

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification?.data?.link;
  if (link) {
    event.waitUntil(clients.openWindow(link));
  }
});
