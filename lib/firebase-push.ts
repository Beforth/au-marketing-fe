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

const NOTIFICATION_SOUND_URL = '/notifcation.mpeg';

/** Play notification sound (foreground). Uses notifcation.mpeg from public folder. */
function playNotificationSound(): void {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.7;
    audio.play().catch(() => {
      // Fallback: short beep if file fails (e.g. format not supported)
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    });
  } catch {
    // Ignore if Audio not supported or autoplay blocked
  }
}

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

    // Foreground notifications: when app is open, show native notification and play sound.
    onMessage(messaging, (payload) => {
      if (Notification.permission !== 'granted') return;
      const title = payload?.notification?.title || 'Notification';
      const body = payload?.notification?.body || '';
      playNotificationSound();
      try {
        new Notification(title, { body, silent: false });
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
