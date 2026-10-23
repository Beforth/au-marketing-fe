import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { CardShell, EmptyState } from './ListCard';
import { ListSkeleton } from './Skeleton';
import { Avatar } from '../ui/Avatar';
import { formatINRShort } from '../../lib/region-report';
import { periodRange } from '../../lib/period-ranges';
import { marketingAPI, WonByPersonResponse } from '../../lib/marketing-api';

type Period = 'month' | 'quarter' | 'year';
const QUARTER_MONTHS = ['Apr–Jun', 'Jul–Sep', 'Oct–Dec', 'Jan–Mar'];
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Won lead value per person for a month / financial-year quarter / financial year (super admin only). */
export const WonByPersonCard: React.FC = () => {
  const now = new Date();
  // Financial-year quarter (Q1 = Apr–Jun), same as the Domains targets.
  const currentQuarter = Math.floor(((now.getMonth() - 3 + 12) % 12) / 3) + 1;
  const [period, setPeriod] = useState<Period>('month');
  const [quarter, setQuarter] = useState(currentQuarter);
  const [data, setData] = useState<WonByPersonResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let from: string;
    let to: string;
    if (period === 'quarter') {
      const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const startMonth = 3 + (quarter - 1) * 3; // may pass 11 → next calendar year, Date handles it
      from = ymd(new Date(fyStart, startMonth, 1));
      to = ymd(new Date(fyStart, startMonth + 3, 0));
    } else {
      const r = periodRange(period);
      from = r.date_from!;
      to = r.date_to!;
    }
    setData(null);
    setFailed(false);
    marketingAPI.getWonByPerson(from, to).then((r) => { if (!cancelled) setData(r); }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, quarter]);

  const tab = (on: boolean, disabled = false) => `rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${on ? 'bg-white text-slate-900 shadow-sm' : disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800'}`;
  const top = data?.people[0]?.won_value || 1;
  const periodText = period === 'month'
    ? now.toLocaleString('en-GB', { month: 'long', year: 'numeric' })
    : period === 'quarter' ? `${QUARTER_MONTHS[quarter - 1]} · financial year` : 'Apr–Mar financial year';

  return (
    <CardShell
      title="Won by Person"
      subtitle={data ? `${periodText} · ${formatINRShort(data.total_value)} from ${data.total_count} won lead${data.total_count === 1 ? '' : 's'}` : periodText}
      headerExtra={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="tablist" aria-label="Period">
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
        </div>
      }
      className="h-96"
      bodyClassName="overflow-y-auto"
    >
      {failed ? (
        <EmptyState icon={<Trophy size={18} />} message="Couldn't load won value by person." />
      ) : !data ? (
        <ListSkeleton />
      ) : data.people.length === 0 ? (
        <EmptyState icon={<Trophy size={18} />} message="No lead won in this period yet." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.people.map((p, i) => (
            <li key={p.employee_id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
              <Avatar name={p.employee_name} className="h-8 w-8 shrink-0 rounded-full text-xs" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900" title={p.employee_name}>{p.employee_name}</span>
                  <span className="shrink-0 text-sm font-bold text-slate-900">{formatINRShort(p.won_value)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max((p.won_value / top) * 100, 2)}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right text-[11px] text-slate-400">{p.won_count} lead{p.won_count === 1 ? '' : 's'}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  );
};
