import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CardShell } from './ListCard';
import { formatINRShort } from '../../lib/region-report';

interface TargetRingCardProps {
  target: number | null | undefined;
  achieved: number | null | undefined;
  scopeLabel: string;
  employeeCount: number;
  wonCount?: number;
}

/**
 * Monthly target as a progress ring (like HRMS "Today's Attendance"): % in the centre, achieved vs
 * target beside it, then Won / Avg per day / Projected. Same numbers as TargetProgressBar (kept).
 */
export const TargetRingCard: React.FC<TargetRingCardProps> = ({ target: t, achieved: a, scopeLabel, employeeCount, wonCount }) => {
  const target = t ?? 0;
  const achieved = a ?? 0;
  const rawPct = target > 0 ? Math.round((achieved / target) * 100) : 0;
  const over = target > 0 && achieved >= target;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const avgPerDay = now.getDate() > 0 ? achieved / now.getDate() : 0;
  const projection = achieved > 0 ? (achieved / now.getDate()) * daysInMonth : 0;

  const size = 112;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = c * Math.min(1, rawPct / 100);
  const ringColor = over ? '#10b981' : '#2563eb';

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
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${filled} ${c}`} style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{target > 0 ? `${rawPct}%` : '—'}</span>
            <span className="text-[10px] text-slate-400 mt-1">of target</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Achieved</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">{formatINRShort(achieved)}</p>
          <p className="text-xs text-slate-500 tabular-nums">of {target > 0 ? formatINRShort(target) : 'no target set'}</p>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Won</p>
          <p className="text-sm font-bold text-slate-800 tabular-nums">{wonCount ?? '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Avg / day</p>
          <p className="text-sm font-bold text-slate-800 tabular-nums">{formatINRShort(avgPerDay)}</p>
        </div>
        <div title="Projected = current pace × days in the month">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Projected</p>
          <p className="text-sm font-bold text-blue-600 tabular-nums flex items-center gap-1"><TrendingUp size={12} />{formatINRShort(projection)}</p>
        </div>
      </div>
    </CardShell>
  );
};
