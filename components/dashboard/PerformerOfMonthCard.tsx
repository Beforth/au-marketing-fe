import React from 'react';
import { Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import type { PerformerOfMonthItem } from '../../lib/marketing-api';

const formatCurrency = (value: number) => {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)} K`;
  return `₹${value}`;
};

interface PerformerOfMonthCardProps {
  performers: PerformerOfMonthItem[] | null | undefined;
}

export const PerformerOfMonthCard: React.FC<PerformerOfMonthCardProps> = ({ performers: performersProp }) => {
  const performers = performersProp || [];
  const top = performers[0];

  return (
    <Card noPadding className="min-h-0">
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">Performer of the Month</p>
          {top ? (
            <>
              <p className="text-lg font-bold text-slate-900 mt-1 truncate">{top.employee_name}</p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {formatCurrency(top.achieved_value)} · {top.won_count} won · {top.achievement_pct}% of target
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400 mt-1.5">No data yet this month</p>
          )}
        </div>
        <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Trophy size={18} />
        </div>
      </div>
    </Card>
  );
};
