import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { marketingAPI } from '../lib/marketing-api';
import { getPresenceLabel, subscribePresenceLabel } from '../lib/presence-label-store';

const HEARTBEAT_INTERVAL_MS = 30000;

/**
 * Sends a lightweight presence heartbeat (current page + optional record label,
 * e.g. "Acme Corp" set via presence-label-store by the page being viewed) to the
 * backend every 30s. Mount once in DashboardLayout — nothing is persisted
 * server-side (in-memory only).
 */
export const usePresence = () => {
  const location = useLocation();
  const pageRef = useRef<string>('');

  const sendHeartbeat = () => {
    marketingAPI.pingPresence(pageRef.current, getPresenceLabel() || undefined).catch(() => {
      // Best-effort heartbeat; ignore failures (server may be briefly offline).
    });
  };

  useEffect(() => {
    pageRef.current = `${location.pathname}${location.search}`;
    sendHeartbeat();
  }, [location]);

  useEffect(() => {
    // Re-heartbeat as soon as the current page announces/clears its record
    // label, instead of waiting for the next 30s tick.
    return subscribePresenceLabel(sendHeartbeat);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);
};
