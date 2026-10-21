import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { marketingAPI } from '../lib/marketing-api';
import { getPresenceLabel, subscribePresenceLabel } from '../lib/presence-label-store';

const HEARTBEAT_INTERVAL_MS = 30000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;
const ACTIVITY_THROTTLE_MS = 2000;   // how often we bother noting activity
const BACK_FROM_IDLE_MS = 180000;    // after this long untouched, the next touch pings straight away

/** Whole seconds since the person last used the screen. */
export const idleSecondsSince = (lastActiveMs: number, nowMs = Date.now()) => Math.max(0, Math.round((nowMs - lastActiveMs) / 1000));

/**
 * Sends a lightweight presence heartbeat (current page + optional record label,
 * e.g. "Acme Corp" set via presence-label-store by the page being viewed) to the
 * backend every 30s. Mount once in DashboardLayout — nothing is persisted
 * server-side (in-memory only).
 */
export const usePresence = () => {
  const location = useLocation();
  const pageRef = useRef<string>('');
  const lastActiveRef = useRef<number>(Date.now());

  const sendHeartbeat = () => {
    marketingAPI.pingPresence(pageRef.current, getPresenceLabel() || undefined, idleSecondsSince(lastActiveRef.current)).catch(() => {
      // Best-effort heartbeat; ignore failures (server may be briefly offline).
    });
  };

  useEffect(() => {
    pageRef.current = `${location.pathname}${location.search}`;
    lastActiveRef.current = Date.now(); // moving to another screen is activity
    sendHeartbeat();
  }, [location]);

  useEffect(() => {
    // Re-heartbeat as soon as the current page announces/clears its record
    // label, instead of waiting for the next 30s tick.
    return subscribePresenceLabel(sendHeartbeat);
  }, []);

  useEffect(() => {
    // Note when the person really uses the screen, so the server can tell active from "tab left open".
    // Coming back after a long break pings at once so their dot turns green straight away.
    const onActivity = () => {
      const now = Date.now();
      const gap = now - lastActiveRef.current;
      if (gap < ACTIVITY_THROTTLE_MS) return;
      lastActiveRef.current = now;
      if (gap > BACK_FROM_IDLE_MS) sendHeartbeat();
    };
    const onVisible = () => { if (!document.hidden) onActivity(); };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);
};
