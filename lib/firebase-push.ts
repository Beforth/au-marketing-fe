import { marketingAPI } from './marketing-api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const firebaseVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

let started = false;

function hasFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseVapidKey
  );
}

export async function initWebPushRegistration(): Promise<void> {
  if (started) return;
  started = true;
  if (typeof window === 'undefined') return;
  if (!hasFirebaseConfig()) return;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (Notification.permission === 'denied') return;

  try {
    const [{ getApps, initializeApp }, { getMessaging, getToken, isSupported, onMessage }] = await Promise.all([
      import('firebase/app'),
      import('firebase/messaging'),
    ]);

    const supported = await isSupported();
    if (!supported) return;

    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig as any);

    const perm = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (perm !== 'granted') return;

    const swParams = new URLSearchParams({
      apiKey: firebaseConfig.apiKey || '',
      authDomain: firebaseConfig.authDomain || '',
      projectId: firebaseConfig.projectId || '',
      storageBucket: firebaseConfig.storageBucket || '',
      messagingSenderId: firebaseConfig.messagingSenderId || '',
      appId: firebaseConfig.appId || '',
    });
    const swRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams.toString()}`);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: swRegistration,
    });
    if (!token) return;

    // Foreground notifications: when app is open, show native notification too.
    onMessage(messaging, (payload) => {
      if (Notification.permission !== 'granted') return;
      const title = payload?.notification?.title || 'Notification';
      const body = payload?.notification?.body || '';
      try {
        new Notification(title, { body });
      } catch {
        // no-op
      }
    });

    await marketingAPI.registerNotificationDevice({
      token,
      platform: 'web',
      user_agent: navigator.userAgent,
    });
    localStorage.setItem('marketing_fcm_token', token);
  } catch {
    // Keep app functional even when push setup fails.
  }
}
