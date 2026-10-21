import React, { useState } from 'react';
import { CardShell } from './ListCard';
import { formatINRShort } from '../../lib/region-report';
import type { DashboardMonthPoint } from '../../lib/marketing-api';

interface TargetRingCardProps {
  target: number | null | undefined;
  achieved: number | null | undefined;
  scopeLabel: string;
  employeeCount: number;
  wonCount?: number;
  /** Running total of won value per day of this month so far (from the dashboard summary). */
  wonByDay?: { day: number; value: number }[];
  /** Won value and target for every month of this financial year (Apr–Mar); feeds the Quarter / Year filters. */
  trend?: DashboardMonthPoint[];
}

type Period = 'month' | 'quarter' | 'year';
const QUARTER_MONTHS = ['Apr–Jun', 'Jul–Sep', 'Oct–Dec', 'Jan–Mar'];
const DAY_MS = 86_400_000;

/**
 * Monthly target (full width, under the hero): achieved vs target and the % on the left, befui's Pace chart on the right (stacked on small screens) (running total, where you should be,
 * projection to month end, ahead/behind chip), then Won and Avg per day. Same numbers as TargetProgressBar (kept).
 */
/** Progress toward the target with a tick for where you should be today, a ghost bar for the month-end projection, and what it takes to finish. */
const PaceBar: React.FC<{ achieved: number; target: number; day: number; daysInMonth: number; projection: number; past?: boolean }> = ({ achieved, target, day, daysInMonth, projection, past }) => {
  const daysLeft = Math.max(daysInMonth - day, 0);
  const expected = target * (day / daysInMonth);
  const gap = expected - achieved;
  const max = Math.max(target, projection, achieved) * 1.02;
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const needPerDay = daysLeft > 0 ? Math.max(target - achieved, 0) / daysLeft : 0;
  const avgPerDay = day > 0 ? achieved / day : 0;
  const stat = (label: string, value: string, tone = 'text-slate-900') => (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-base font-bold tabular-nums whitespace-nowrap ${tone}`}>{value}</p>
    </div>
  );
  return (
    <div role="img" aria-label={`${formatINRShort(achieved)} of ${formatINRShort(target)}, projected ${formatINRShort(projection)}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {past
          ? <p className="text-sm text-slate-500">Won <span className="font-semibold text-slate-900 tabular-nums">{formatINRShort(achieved)}</span> against a target of <span className="font-semibold text-slate-900 tabular-nums">{formatINRShort(target)}</span>.</p>
          : <p className="text-sm text-slate-500">Won <span className="font-semibold text-slate-900 tabular-nums">{formatINRShort(achieved)}</span> so far. By today you should have <span className="font-semibold text-slate-900 tabular-nums">{formatINRShort(expected)}</span>.</p>}
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${gap > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {past ? (gap > 0 ? `Missed by ${formatINRShort(target - achieved)}` : 'Target met') : gap > 0 ? `Behind pace by ${formatINRShort(gap)}` : 'Ahead of pace'}
        </span>
      </div>
      <div className="relative h-5 rounded-full bg-slate-100">
        <span className="absolute inset-y-0 left-0 rounded-full bg-blue-600/20" style={{ width: pct(projection) }} />
        <span className="absolute inset-y-0 left-0 rounded-full bg-blue-600" style={{ width: pct(achieved) }} />
        <span title="Where you should be today" className="absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-amber-500" style={{ left: pct(expected) }} />
        <span title="Target" className="absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-slate-900" style={{ left: pct(target) }} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-blue-600" />Achieved</span>
        {!past && <span className="flex items-center gap-1"><span className="h-3 w-0.5 rounded-full bg-amber-500" />Where you should be today</span>}
        <span className="flex items-center gap-1"><span className="h-3 w-0.5 rounded-full bg-slate-900" />Target</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3 sm:gap-4">
        {stat('Avg / day', formatINRShort(avgPerDay))}
        {past ? stat('Period', 'Ended') : stat(daysLeft > 0 ? `Needed / day (${daysLeft} left)` : 'Period ended', daysLeft > 0 ? formatINRShort(needPerDay) : '—', needPerDay > avgPerDay * 1.5 ? 'text-rose-600' : 'text-slate-900')}
        {past ? stat('Gap to target', gap > 0 ? formatINRShort(target - achieved) : 'None', gap > 0 ? 'text-rose-600' : 'text-emerald-600') : stat('Projected', formatINRShort(projection), 'text-blue-600')}
      </div>
    </div>
  );
};

export const TargetRingCard: React.FC<TargetRingCardProps> = ({ target: t, achieved: a, scopeLabel, employeeCount, wonCount, trend }) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const trendMonths = trend && trend.length === 12 ? trend : null; // Apr..Mar; older backends don't send it, so only "Month" is offered
  // Financial-year quarter (Q1 = Apr–Jun), same as the Domains targets.
  const currentQuarter = Math.floor(((now.getMonth() - 3 + 12) % 12) / 3) + 1;
  const [period, setPeriod] = useState<Period>('month');
  const [quarter, setQuarter] = useState(currentQuarter);

  // The figures for the chosen period. Month = the live numbers sent for this month; Quarter / Year = the sum of that period's months.
  let target = t ?? 0, achieved = a ?? 0, wonN: number | undefined = wonCount, title = 'Monthly Target';
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (trendMonths && period !== 'month') {
    const from = period === 'quarter' ? (quarter - 1) * 3 : 0;
    const months = trendMonths.slice(from, period === 'quarter' ? from + 3 : 12);
    const [fy, fm] = months[0].month.split('-').map(Number);
    const [ly, lm] = months[months.length - 1].month.split('-').map(Number);
    start = new Date(fy, fm - 1, 1);
    end = new Date(ly, lm, 0);
    target = months.reduce((n, m) => n + (m.target_value ?? 0), 0);
    achieved = months.reduce((n, m) => n + m.won_value, 0);
    wonN = undefined;
    title = period === 'quarter' ? `Quarterly Target · Q${quarter}` : 'Yearly Target';
  }
  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const elapsed = Math.min(Math.max(Math.round((todayStart.getTime() - start.getTime()) / DAY_MS) + 1, 1), totalDays);
  const past = todayStart > end;
  const daysLeft = totalDays - elapsed;
  const rawPct = target > 0 ? Math.round((achieved / target) * 100) : 0;
  const over = target > 0 && achieved >= target;
  // A tiny target (e.g. ₹167 typed instead of crores) gives silly percentages: cap what the ring shows and flag it.
  const pctText = rawPct > 999 ? '999%+' : `${rawPct}%`;
  const targetLooksWrong = target > 0 && rawPct > 500;
  const avgPerDay = achieved / elapsed;
  const projection = achieved > 0 ? (achieved / elapsed) * totalDays : 0;

  const tab = (on: boolean, disabled = false) => `rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${on ? 'bg-white text-slate-900 shadow-sm' : disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800'}`;

  return (
    <CardShell
      title={title}
      subtitle={`${scopeLabel} scope${employeeCount > 1 ? ` · ${employeeCount} people` : ''}`}
      headerExtra={
        <span className={
          over
            ? 'text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5'
            : past
              ? 'text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5'
              : daysLeft <= 5
                ? 'text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5'
                : 'text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5'
        }>
          {over ? 'Achieved' : past ? 'Closed' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
        </span>
      }
      bodyClassName="flex flex-col p-4"
    >
      {trendMonths && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="tablist" aria-label="Target period">
            {(['month', 'quarter', 'year'] as Period[]).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={period === k} onClick={() => setPeriod(k)} className={tab(period === k)}>
                {k === 'month' ? 'Month' : k === 'quarter' ? 'Quarter' : 'Year'}
              </button>
            ))}
          </div>
          {period === 'quarter' && (
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="tablist" aria-label="Quarter">
              {[1, 2, 3, 4].map((q) => (
                <button key={q} type="button" role="tab" aria-selected={quarter === q} disabled={q > currentQuarter} title={QUARTER_MONTHS[q - 1]} onClick={() => setQuarter(q)} className={tab(quarter === q, q > currentQuarter)}>
                  Q{q}
                </button>
              ))}
            </div>
          )}
          {period !== 'month' && <span className="text-[11px] text-slate-400">{period === 'quarter' ? `${QUARTER_MONTHS[quarter - 1]} · financial year` : 'Apr–Mar financial year'}</span>}
        </div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
      <div className="flex items-end justify-between gap-4 lg:w-56 lg:shrink-0 lg:flex-col lg:items-start lg:justify-center lg:gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Achieved</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{formatINRShort(achieved)}</p>
          <p className="text-xs text-slate-500 tabular-nums">of {target > 0 ? formatINRShort(target) : 'no target set'}</p>
          <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">{wonN != null ? `${wonN} won · ` : ''}{formatINRShort(avgPerDay)} / day</p>
        </div>
        <div className="text-right shrink-0 lg:text-left">
          <span className={`${pctText.length > 4 ? 'text-2xl' : 'text-3xl lg:text-5xl'} font-bold tabular-nums leading-none ${over ? 'text-emerald-600' : 'text-slate-900'}`}>{target > 0 ? pctText : '—'}</span>
          <p className="text-[10px] text-slate-400 mt-1">of target</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
      {target > 0 ? (
        <PaceBar achieved={achieved} target={target} day={elapsed} daysInMonth={totalDays} projection={projection} past={past} />
      ) : null}
      </div>
      </div>
      {targetLooksWrong && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-800">
          The target ({formatINRShort(target)}) looks far too low next to what was achieved — check the target amounts under Domains.
        </p>
      )}
    </CardShell>
  );
};
