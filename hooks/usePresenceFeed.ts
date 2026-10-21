import { useCallback, useEffect, useRef, useState } from 'react';
import { marketingAPI, PresenceUser } from '../lib/marketing-api';
import { API_CONFIG } from '../lib/api';

const POLL_FALLBACK_MS = 15000;

function presenceWebSocketUrl(): string {
  const token = localStorage.getItem('auth_token') || '';
  const wsBase = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/api/presence/ws?token=${encodeURIComponent(token)}`;
}

/**
 * Live "who is online" list, shared by the Who's Online side panel and the Live Activity page.
 * The server pushes the list over a WebSocket whenever it changes, so nothing polls while the socket is up.
 * If the socket can't connect (e.g. blocked by a proxy) it checks over REST every 15s and keeps retrying
 * the socket in the background. Pass `enabled=false` to stay disconnected (the side panel while closed).
 */
export function usePresenceFeed(enabled: boolean) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const pollTimerRef = useRef<number | null>(null);

  const loadOnce = useCallback(async () => {
    try {
      const res = await marketingAPI.getActiveUsers();
      setUsers(res.users);
      setError(null);
      setUpdatedAt(new Date());
    } catch {
      setError('Could not load who is online.');
    } finally {
      setLoading(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current != null) return;
    loadOnce();
    pollTimerRef.current = window.setInterval(loadOnce, POLL_FALLBACK_MS);
  }, [loadOnce]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
    intentionalCloseRef.current = false;

    const connect = () => {
      const ws = new WebSocket(presenceWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        stopPolling();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setUsers(data.users || []);
          setError(null);
          setUpdatedAt(new Date());
        } catch {
          // ignore malformed frame
        } finally {
          setLoading(false);
        }
      };

      ws.onclose = () => {
        if (intentionalCloseRef.current) return;
        // Keep updating via REST while the socket is retried in the background.
        startPolling();
        const attempt = reconnectAttemptsRef.current;
        const delay = Math.min(1000 * 2 ** attempt, 15000) + Math.random() * 500;
        reconnectAttemptsRef.current = attempt + 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onclose follows a failed connection and schedules the retry; this just stops the "loading" state.
        setLoading(false);
      };
    };

    connect();

    return () => {
      intentionalCloseRef.current = true;
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      stopPolling();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, startPolling, stopPolling]);

  return { users, loading, error, updatedAt };
}
