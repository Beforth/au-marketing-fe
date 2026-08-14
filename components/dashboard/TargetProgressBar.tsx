import React from 'react';
import { Target } from 'lucide-react';
import { Card } from '../ui/Card';

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
}

export const TargetProgressBar: React.FC<TargetProgressBarProps> = ({ target: targetProp, achieved: achievedProp, scopeLabel, employeeCount }) => {
  const target = targetProp ?? 0;
  const achieved = achievedProp ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const over = target > 0 && achieved > target;

  return (
    <Card noPadding className="min-h-0">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">Monthly Target</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(achieved)}</p>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              of {formatCurrency(target)} · {scopeLabel} scope{employeeCount > 1 ? ` · ${employeeCount} people` : ''}
            </p>
          </div>
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${over ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
            <Target size={18} />
          </div>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className={`text-[11px] font-semibold mt-1.5 ${over ? 'text-emerald-600' : 'text-slate-500'}`}>{pct}% of target</p>
      </div>
    </Card>
  );
};
