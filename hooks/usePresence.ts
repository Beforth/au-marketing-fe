import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { marketingAPI } from '../lib/marketing-api';

const HEARTBEAT_INTERVAL_MS = 30000;

/**
 * Sends a lightweight presence heartbeat (current page) to the backend every 30s.
 * Mount once in DashboardLayout — nothing is persisted server-side (in-memory only).
 */
export const usePresence = () => {
  const location = useLocation();
  const pageRef = useRef<string>('');

  useEffect(() => {
    pageRef.current = `${location.pathname}${location.search}`;
    marketingAPI.pingPresence(pageRef.current).catch(() => {
      // Best-effort heartbeat; ignore failures (server may be briefly offline).
    });
  }, [location]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      marketingAPI.pingPresence(pageRef.current).catch(() => {
        // Best-effort heartbeat; ignore failures.
      });
    }, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);
};
