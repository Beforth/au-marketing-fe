import React from 'react';
import { Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import type { PerformerOfMonthItem } from '../../lib/marketing-api';

interface PerformerOfMonthCardProps {
  performers: PerformerOfMonthItem[] | null | undefined;
}

export const PerformerOfMonthCard: React.FC<PerformerOfMonthCardProps> = ({ performers: performersProp }) => {
  const performers = (performersProp || []).slice(0, 3);

  return (
    <Card noPadding className="min-h-0" title="Performer of the Month" description="Top by target achievement">
      {performers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 py-8">
          <Trophy size={22} />
          <p className="text-xs font-semibold">No performer data yet this month</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {performers.map((p, index) => {
            const rank = index + 1;
            const initials = p.employee_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div key={p.employee_id} className="flex items-center gap-3 px-4 py-2.5">
                <div
                  className={cn(
                    'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold',
                    rank === 1 ? 'bg-amber-50 text-amber-600' : rank === 2 ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {rank === 1 ? <Trophy size={12} /> : rank}
                </div>
                <div
                  className={cn(
                    'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border',
                    rank === 1 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                  )}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{p.employee_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{p.domain_name}{p.region_name ? ` · ${p.region_name}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 tabular-nums">{p.achievement_pct}%</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{p.won_count} won</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
