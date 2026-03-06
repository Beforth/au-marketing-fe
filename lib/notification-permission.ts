/**
 * Request notification permission when user is logged in.
 * Uses OneSignal SDK (loaded via script in index.html) to show the native browser prompt
 * so the user can subscribe to push notifications.
 */

type OneSignalDeferredCallback = (OneSignal: {
  Notifications: {
    requestPermission: () => Promise<boolean>;
    permission: boolean;
  };
}) => void | Promise<void>;

declare global {
  interface Window {
    OneSignalDeferred?: OneSignalDeferredCallback[];
  }
}

/**
 * Request push notification permission via OneSignal when the user is logged in.
 * Call this after login so the permission prompt is shown in context.
 * No-op if OneSignal isn't loaded or permission already granted.
 */
export function requestNotificationPermissionWhenLoggedIn(): void {
  if (typeof window === 'undefined') return;
  const deferred = window.OneSignalDeferred;
  if (!deferred || !Array.isArray(deferred)) return;

  deferred.push(async (OneSignal) => {
    try {
      if (OneSignal?.Notifications?.permission === true) return; // already granted
      await OneSignal.Notifications.requestPermission();
    } catch {
      // Ignore; permission may be denied or OneSignal not fully ready
    }
  });
}
