import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Users, X, Radio } from 'lucide-react';
import { marketingAPI, PresenceUser } from '../../lib/marketing-api';
import { API_CONFIG } from '../../lib/api';
import { Avatar } from './Avatar';
import {
  presencePageLabel,
  presenceTimeAgo,
  PRESENCE_AVATAR_COLORS,
} from '../../lib/presence-utils';

function presenceWebSocketUrl(): string {
  const token = localStorage.getItem('auth_token') || '';
  const wsBase = API_CONFIG.BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/api/presence/ws?token=${encodeURIComponent(token)}`;
}

interface PresencePanelProps {
  open: boolean;
  onClose: () => void;
}

export const PresencePanel: React.FC<PresencePanelProps> = ({ open, onClose }) => {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
    } else {
      setClosing(true);
      const t = window.setTimeout(() => setMounted(false), 220);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const wsRef = useRef<WebSocket | null>(null);

  // One-shot REST fallback, used only if the WebSocket can't connect (e.g. blocked by a proxy).
  const loadOnce = useCallback(async () => {
    try {
      const res = await marketingAPI.getActiveUsers();
      setUsers(res.users);
      setError(null);
    } catch {
      setError('Could not load who is online.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);

    const ws = new WebSocket(presenceWebSocketUrl());
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setUsers(data.users || []);
        setError(null);
      } catch {
        // ignore malformed frame
      } finally {
        setLoading(false);
      }
    };
    ws.onerror = () => {
      loadOnce();
    };

    return () => {
      wsRef.current = null;
      ws.close();
    };
  }, [open, loadOnce]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-[60] ${
          closing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-[320px] bg-white border-l border-slate-200 shadow-2xl z-[70] flex flex-col ${
          closing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        }`}
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-slate-900">Who's online</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
              {users.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {error ? (
            <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
              {error}
            </div>
          ) : loading && users.length === 0 ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100/70 animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center">
              <Users size={22} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-500">No one is online right now</p>
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.employee_id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="relative shrink-0">
                  <Avatar
                    src={u.profile_picture}
                    name={u.employee_name}
                    className={`w-9 h-9 rounded-xl border font-bold text-xs ${
                      PRESENCE_AVATAR_COLORS[u.employee_id % PRESENCE_AVATAR_COLORS.length]
                    }`}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{u.employee_name}</p>
                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    <Radio size={10} className="text-blue-500 shrink-0" />
                    {presencePageLabel(u.page)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    u.seconds_ago < 30 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {presenceTimeAgo(u.seconds_ago)}
                </span>
              </div>
            ))
          )}
        </div>

        <footer className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-medium">
          Updates live · presence is in-memory only (not stored)
        </footer>
      </aside>
    </>
  );
};
