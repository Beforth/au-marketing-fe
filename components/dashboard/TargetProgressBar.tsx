import React from 'react';
import { Target, CalendarDays, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

const formatCurrency = (value: number) => {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)} K`;
  return `₹${value.toFixed(0)}`;
};

interface TargetProgressBarProps {
  target: number | null | undefined;
  achieved: number | null | undefined;
  scopeLabel: string;
  employeeCount: number;
  wonCount?: number;
}

export const TargetProgressBar: React.FC<TargetProgressBarProps> = ({
  target: targetProp,
  achieved: achievedProp,
  scopeLabel,
  employeeCount,
  wonCount,
}) => {
  const target = targetProp ?? 0;
  const achieved = achievedProp ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const over = target > 0 && achieved > target;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  const avgPerDay = now.getDate() > 0 ? Math.round(achieved / now.getDate()) : 0;
  const projection = achieved > 0 ? Math.round((achieved / now.getDate()) * daysInMonth) : 0;

  return (
    <Card noPadding className="min-h-0">
      <div className="flex flex-col p-4 h-full">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', over ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600')}>
              <Target size={16} />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">Monthly Target</p>
          </div>
          <span
            className={cn(
              'shrink-0 inline-flex items-center text-[11px] font-bold rounded-full px-2 py-0.5 border',
              over ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-blue-700 bg-blue-50 border-blue-100'
            )}
          >
            {pct}%
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-3 mt-2.5">
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(achieved)}</p>
          <p className="text-[11px] text-slate-500 truncate">
            of {formatCurrency(target)} · {scopeLabel} scope{employeeCount > 1 ? ` · ${employeeCount} people` : ''}
          </p>
        </div>

        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2.5">
          <div
            className={cn('h-full rounded-full transition-all duration-500', over ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-blue-600')}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="flex-1 flex items-center border-t border-slate-100 mt-4 pt-3.5">
          <div className="grid grid-cols-3 gap-3 w-full">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Won</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 tabular-nums">{wonCount ?? '—'}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">this month</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Avg / day</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5 tabular-nums">{formatCurrency(avgPerDay)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">since the 1st</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Projected</p>
              <p className="text-sm font-bold text-blue-600 mt-0.5 tabular-nums flex items-center gap-1">
                <TrendingUp size={12} />
                ~{formatCurrency(projection)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <CalendarDays size={10} />
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
