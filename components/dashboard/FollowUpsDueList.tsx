import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import type { DashboardFollowUp } from '../../lib/marketing-api';

interface FollowUpsDueListProps {
  followUps: DashboardFollowUp[] | null | undefined;
  title?: string;
}

export const FollowUpsDueList: React.FC<FollowUpsDueListProps> = ({ followUps: followUpsProp, title = 'Follow-ups Due — Act Now' }) => {
  const followUps = followUpsProp || [];
  return (
    <Card title={title} description="Soonest first, in your scope" noPadding>
      {followUps.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">Nothing due — you're all caught up</div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
          {followUps.map((f) => (
            <Link
              key={f.id}
              to={`/leads/${f.id}/edit`}
              className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-slate-50/80 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{f.company || f.series || `Lead #${f.id}`}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{f.series || `#${f.id}`}</p>
              </div>
              <span
                className={
                  'text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ' +
                  (f.due_label === 'Overdue'
                    ? 'bg-rose-50 text-rose-600'
                    : f.due_label === 'Today'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-slate-100 text-slate-500')
                }
              >
                {f.due_label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
};
