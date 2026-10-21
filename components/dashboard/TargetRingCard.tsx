import React from 'react';
import { CardShell } from './ListCard';
import { formatINRShort } from '../../lib/region-report';
import { PaceChart } from '../ui/PaceChart';

interface TargetRingCardProps {
  target: number | null | undefined;
  achieved: number | null | undefined;
  scopeLabel: string;
  employeeCount: number;
  wonCount?: number;
  /** Running total of won value per day of this month so far (from the dashboard summary). */
  wonByDay?: { day: number; value: number }[];
}

/**
 * Monthly target (full width, under the hero): achieved vs target and the % on the left, befui's Pace chart on the right (stacked on small screens) (running total, where you should be,
 * projection to month end, ahead/behind chip), then Won and Avg per day. Same numbers as TargetProgressBar (kept).
 */
/** Progress toward the target with a tick for where you should be today, a ghost bar for the month-end projection, and what it takes to finish. */
const PaceBar: React.FC<{ achieved: number; target: number; day: number; daysInMonth: number; projection: number }> = ({ achieved, target, day, daysInMonth, projection }) => {
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
        <p className="text-sm text-slate-500">Projected <span className="font-semibold text-slate-900 tabular-nums">{formatINRShort(projection)}</span> of {formatINRShort(target)}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${gap > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {gap > 0 ? `Behind pace by ${formatINRShort(gap)}` : 'Ahead of pace'}
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
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-blue-600/20" />Projected</span>
        <span className="flex items-center gap-1"><span className="h-3 w-0.5 rounded-full bg-amber-500" />Where you should be today</span>
        <span className="flex items-center gap-1"><span className="h-3 w-0.5 rounded-full bg-slate-900" />Target</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3 sm:gap-4">
        {stat('Avg / day so far', formatINRShort(avgPerDay))}
        {stat(daysLeft > 0 ? `Needed / day (${daysLeft} left)` : 'Month ended', daysLeft > 0 ? formatINRShort(needPerDay) : '—', needPerDay > avgPerDay * 1.5 ? 'text-rose-600' : 'text-slate-900')}
        {stat('Projected', formatINRShort(projection), 'text-blue-600')}
      </div>
    </div>
  );
};

export const TargetRingCard: React.FC<TargetRingCardProps> = ({ target: t, achieved: a, scopeLabel, employeeCount, wonCount, wonByDay }) => {
  const target = t ?? 0;
  const achieved = a ?? 0;
  const rawPct = target > 0 ? Math.round((achieved / target) * 100) : 0;
  const over = target > 0 && achieved >= target;
  // A tiny target (e.g. ₹167 typed instead of crores) gives silly percentages: cap what the ring shows and flag it.
  const pctText = rawPct > 999 ? '999%+' : `${rawPct}%`;
  const targetLooksWrong = target > 0 && rawPct > 500;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const avgPerDay = now.getDate() > 0 ? achieved / now.getDate() : 0;
  const projection = achieved > 0 ? (achieved / now.getDate()) * daysInMonth : 0;

  return (
    <CardShell
      title="Monthly Target"
      subtitle={`${scopeLabel} scope${employeeCount > 1 ? ` · ${employeeCount} people` : ''}`}
      headerExtra={
        <span className={
          over
            ? 'text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5'
            : daysLeft <= 5
              ? 'text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5'
              : 'text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5'
        }>
          {over ? 'Achieved' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
        </span>
      }
      bodyClassName="flex flex-col p-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
      <div className="flex items-end justify-between gap-4 lg:w-56 lg:shrink-0 lg:flex-col lg:items-start lg:justify-center lg:gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Achieved</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{formatINRShort(achieved)}</p>
          <p className="text-xs text-slate-500 tabular-nums">of {target > 0 ? formatINRShort(target) : 'no target set'}</p>
          <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">{wonCount != null ? `${wonCount} won · ` : ''}{formatINRShort(avgPerDay)} / day</p>
        </div>
        <div className="text-right shrink-0 lg:text-left">
          <span className={`${pctText.length > 4 ? 'text-2xl' : 'text-3xl lg:text-5xl'} font-bold tabular-nums leading-none ${over ? 'text-emerald-600' : 'text-slate-900'}`}>{target > 0 ? pctText : '—'}</span>
          <p className="text-[10px] text-slate-400 mt-1">of target</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
      {target > 0 && wonByDay && wonByDay.length > 0 ? (
        <PaceChart points={wonByDay} target={target} daysInMonth={daysInMonth} format={formatINRShort} className="max-w-2xl" />
      ) : target > 0 ? (
        // No daily data (older backend): a pace bar built from the totals alone, so the card is still useful.
        <PaceBar achieved={achieved} target={target} day={now.getDate()} daysInMonth={daysInMonth} projection={projection} />
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
