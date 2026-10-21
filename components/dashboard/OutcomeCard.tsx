import React from 'react';
import { PieChart } from 'lucide-react';
import { CardShell, EmptyState } from './ListCard';

interface OutcomeCardProps {
  won: number;
  lost: number;
  open: number;
  conversionPct: number | null;
}

/**
 * Won vs Lost this month as a donut (like HRMS "Leave Overview"), conversion % in the middle, and
 * the counts underneath — plus how many leads are still open right now (not part of the ring,
 * since "open" is a current count and won/lost are this month's).
 */
export const OutcomeCard: React.FC<OutcomeCardProps> = ({ won, lost, open, conversionPct }) => {
  const size = 128;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const closed = won + lost;
  const wonLen = closed > 0 ? (won / closed) * c : 0;

  return (
    <CardShell title="Won vs Lost" subtitle="This month" bodyClassName="flex flex-col p-4">
      {closed === 0 && open === 0 ? (
        <EmptyState icon={<PieChart size={20} />} message="Nothing closed yet this month" />
      ) : (
        <>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={closed > 0 ? '#f43f5e' : '#eef2f7'} strokeWidth={stroke} />
                {won > 0 && (
                  <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#10b981" strokeWidth={stroke} strokeDasharray={`${wonLen} ${c}`} />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400">Conversion</span>
                <span className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{conversionPct != null ? `${conversionPct}%` : '—'}</span>
              </div>
            </div>
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
