import React from 'react';
import { PieChart } from 'lucide-react';
import { CardShell, EmptyState } from './ListCard';
import { HalfDonutChart } from '../ui/HalfDonutChart';

interface OutcomeCardProps {
  won: number;
  lost: number;
  open: number;
  conversionPct: number | null;
}

/**
 * Won vs Lost this month as a half donut (befui), conversion % under the arch (hover a segment to read it), and
 * the counts underneath — plus how many leads are still open right now (not part of the ring,
 * since "open" is a current count and won/lost are this month's).
 */
export const OutcomeCard: React.FC<OutcomeCardProps> = ({ won, lost, open, conversionPct }) => {
  const closed = won + lost;

  return (
    <CardShell title="Won vs Lost" subtitle="This month" bodyClassName="flex flex-col p-4">
      {closed === 0 && open === 0 ? (
        <EmptyState icon={<PieChart size={20} />} message="Nothing closed yet this month" />
      ) : (
        <>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <HalfDonutChart
              size={200}
              thickness={18}
              data={[
                { label: 'Won', value: won, color: 'text-emerald-500' },
                { label: 'Lost', value: lost, color: 'text-rose-500' },
              ]}
              center={(
                <>
                  <span className="text-[10px] text-slate-400">Conversion</span>
                  <span className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{conversionPct != null ? `${conversionPct}%` : '—'}</span>
                </>
              )}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">{won}</p>
              <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Won</p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-600 tabular-nums">{lost}</p>
              <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-rose-500" />Lost</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600 tabular-nums">{open}</p>
              <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-500" />Open now</p>
            </div>
          </div>
        </>
      )}
    </CardShell>
  );
};
