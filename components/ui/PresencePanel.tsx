import React, { useEffect, useState } from 'react';
import { Users, X, Radio } from 'lucide-react';
import { usePresenceFeed } from '../../hooks/usePresenceFeed';
import { Avatar } from './Avatar';
import { resolveHrmsMediaUrl } from '../../lib/hrms-rbac';
import {
  presenceCounts,
  presenceDetailLabel,
  presenceStatus,
  PRESENCE_AVATAR_COLORS,
} from '../../lib/presence-utils';

interface PresencePanelProps {
  open: boolean;
  onClose: () => void;
}

export const PresencePanel: React.FC<PresencePanelProps> = ({ open, onClose }) => {
  const { users, loading, error } = usePresenceFeed(open);
  const counts = presenceCounts(users);
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

        {users.length > 0 && (
          <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-3 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{counts.active} active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{counts.idle} idle</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" />{counts.away} away</span>
          </div>
        )}
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
            users.map((u) => {
              const st = presenceStatus(u);
              return (
                <div
                  key={u.employee_id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors ${st.key === 'away' ? 'opacity-60' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Avatar
                      src={resolveHrmsMediaUrl(u.profile_picture)}
                      name={u.employee_name}
                      className={`w-9 h-9 rounded-xl border font-bold text-xs ${
                        PRESENCE_AVATAR_COLORS[u.employee_id % PRESENCE_AVATAR_COLORS.length]
                      }`}
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${st.dot}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{u.employee_name}</p>
                    <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                      <Radio size={10} className="text-blue-500 shrink-0" />
                      {presenceDetailLabel(u.page, u.label)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.badge}`}>
                    {st.text}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <footer className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-medium">
          Updates live · presence is in-memory only (not stored)
        </footer>
      </aside>
    </>
  );
};
