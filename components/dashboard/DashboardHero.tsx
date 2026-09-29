import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectEmployee, selectUser } from '../../store/slices/authSlice';
import { cn } from '../../lib/utils';
import { RefreshCw, Eye } from 'lucide-react';
import { useDashboardChrome, formatLastUpdated } from './DashboardChrome';

export interface HeroAction {
  label: string;
  href: string;
  icon?: React.ReactNode;
  primary?: boolean;
}

interface DashboardHeroProps {
  /** e.g. "My Dashboard", "Region Dashboard". Shown in the eyebrow line with today's date. */
  dashboardName: string;
  /** One line under the greeting. */
  subtitle: string;
  actions: HeroAction[];
}

const timeOfDay = (h: number) => (h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening');

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Gradient banner at the top of every role dashboard: eyebrow (dashboard · date), typed-out
 * "Good Morning/Afternoon/Evening, {first name}!", one-line subtitle, and the real quick actions.
 */
export const DashboardHero: React.FC<DashboardHeroProps> = ({ dashboardName, subtitle, actions }) => {
  const chrome = useDashboardChrome();
  const user = useAppSelector(selectUser);
  const employee = useAppSelector(selectEmployee);
  const firstName = (employee?.first_name || user?.first_name || user?.username || '').trim().split(/\s+/)[0];
  const greeting = useMemo(
    () => `Good ${timeOfDay(new Date().getHours())}${firstName ? `, ${firstName}` : ''}!`,
    [firstName]
  );
  const [typed, setTyped] = useState(() => (prefersReducedMotion() ? greeting : ''));

  useEffect(() => {
    if (prefersReducedMotion()) { setTyped(greeting); return; }
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(greeting.slice(0, i));
      if (i >= greeting.length) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, [greeting]);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="relative overflow-hidden h-full min-h-64 flex flex-col justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-6 sm:px-8 shadow-sm">
      {/* decorative circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute right-24 -bottom-20 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">
            {dashboardName} · {today}
          </p>
          {chrome && (
            <div className="flex items-center gap-2">
              {chrome.preview && (
                <label className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 pl-2.5 pr-1 py-0.5 text-[11px] font-semibold text-white">
                  <Eye size={12} /> Preview
                  <select
                    value={chrome.preview.value}
                    onChange={(e) => chrome.preview!.onChange(e.target.value)}
                    className="bg-transparent text-white text-[11px] font-semibold focus:outline-none cursor-pointer [&>option]:text-slate-900"
                    aria-label="Preview dashboard as"
                  >
                    {chrome.preview.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              )}
              <button
                type="button"
                onClick={chrome.onRefresh}
                disabled={chrome.refreshing}
                title="Refresh"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/25 disabled:opacity-60 transition-colors"
              >
                <RefreshCw size={12} className={chrome.refreshing ? 'animate-spin' : ''} />
                {chrome.refreshing ? 'Refreshing…' : chrome.lastUpdated ? `Updated ${formatLastUpdated(chrome.lastUpdated)}` : 'Refresh'}
              </button>
            </div>
          )}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight min-h-[2.25rem]" aria-label={greeting}>
          <span aria-hidden>{typed}</span>
          <span aria-hidden className="dash-caret ml-0.5 inline-block w-[2px] h-[0.9em] translate-y-[0.1em] bg-white/80" />
        </h1>
        <p className="mt-1 text-sm text-blue-100">{subtitle}</p>
        {chrome?.preview?.notice && (
          <p className="mt-2 inline-block rounded-full bg-amber-300/20 border border-amber-200/40 px-2.5 py-1 text-[11px] text-amber-100">
            {chrome.preview.notice}
          </p>
        )}

        {actions.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {actions.map((a, i) => (
              <Link
                key={a.href + a.label}
                to={a.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors',
                  (a.primary ?? i === 0)
                    ? 'bg-white text-blue-700 hover:bg-blue-50 shadow-sm'
                    : 'bg-white/15 border border-white/20 text-white hover:bg-white/25'
                )}
              >
                {a.icon}
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
