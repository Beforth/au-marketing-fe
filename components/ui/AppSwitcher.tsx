/**
 * App-switcher — jump from this app to another Intranet app without signing in
 * again. Renders the app name (with a chevron) as the trigger; the popover lists
 * the other Intranet apps, fetched live from HRMS.
 *
 * When there are no other apps to switch to (logged out, no `intranet.view`, or
 * the list is empty) it renders the name as plain text — no chevron, no popover.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import {
  listIntranetApps,
  generateSSOToken,
  isCurrentApp,
  type IntranetApp,
} from '../../lib/intranet-sso';

const AppIcon: React.FC<{ app: IntranetApp }> = ({ app }) => {
  if (app.icon) {
    return <img src={app.icon} alt="" className="h-7 w-7 rounded-md object-contain flex-shrink-0" />;
  }
  return (
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
      {app.name.charAt(0).toUpperCase()}
    </span>
  );
};

interface AppSwitcherProps {
  /** Display name of the app we're in (shown as the trigger). */
  currentName: string;
}

export const AppSwitcher: React.FC<AppSwitcherProps> = ({ currentName }) => {
  const [apps, setApps] = useState<IntranetApp[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    listIntranetApps().then((list) => {
      if (alive) setApps(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const others = (apps ?? []).filter((a) => !isCurrentApp(a.url));

  const nameClass = 'text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap';

  // No other apps — just the name, not interactive.
  if (others.length === 0) {
    return <span className={nameClass}>{currentName}</span>;
  }

  const handleSwitch = async (app: IntranetApp) => {
    setBusyId(app.id);
    setError(null);
    try {
      const { redirect_url } = await generateSSOToken(app.id);
      window.location.href = redirect_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not switch apps.');
      setBusyId(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md -mx-1 px-1 py-0.5 hover:bg-slate-100 transition-colors"
      >
        <span className={nameClass}>{currentName}</span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Switch app
          </p>
          {others.map((app) => (
            <button
              key={app.id}
              type="button"
              disabled={busyId !== null}
              onClick={() => handleSwitch(app)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <AppIcon app={app} />
              <span className="truncate">{app.name}</span>
              {busyId === app.id && (
                <Loader2 size={14} className="ml-auto flex-shrink-0 animate-spin text-slate-400" />
              )}
            </button>
          ))}
          {error && (
            <div className="mx-1 mt-1 flex items-start gap-1.5 rounded-md bg-rose-50 px-2 py-1.5 text-[11px] leading-snug text-rose-700">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
