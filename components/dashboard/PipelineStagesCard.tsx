import React from 'react';
import { Layers } from 'lucide-react';
import type { DashboardStatusCount } from '../../lib/marketing-api';
import { CardShell, EmptyState } from './ListCard';

/**
 * Leads by stage as labelled bars (like HRMS "Workforce"): each status with its count, share of all
 * leads and a bar in the status's own colour. Open stages first (in the order the server sends,
 * i.e. the status order), then Won and Lost at the bottom. Same data as LeadStatusChart (kept).
 */
export const PipelineStagesCard: React.FC<{ data: DashboardStatusCount[] | null | undefined; title?: string }> = ({ data, title = 'Leads by Stage' }) => {
  const rows = (data || []).filter((d) => d.count > 0);
  const open = rows.filter((d) => !d.is_final && !d.is_lost);
  const closed = rows.filter((d) => d.is_final || d.is_lost);
  const total = rows.reduce((n, d) => n + d.count, 0);
  const max = Math.max(1, ...rows.map((d) => d.count));

  const bar = (d: DashboardStatusCount) => {
    const color = d.color || (d.is_lost ? '#e11d48' : d.is_final ? '#10b981' : '#2563eb');
    const share = total > 0 ? Math.round((d.count / total) * 100) : 0;
    return (
      <div key={`${d.status_id ?? d.status}`}>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-slate-700 truncate">{d.status}</span>
          <span className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
            {d.count} <span className="text-[11px] font-normal text-slate-400">{share}%</span>
          </span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.count / max) * 100}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  };

  return (
    <CardShell title={title} subtitle={`${total} lead${total === 1 ? '' : 's'} in your scope`} bodyClassName="overflow-y-auto">
      {rows.length === 0 ? (
        <EmptyState icon={<Layers size={20} />} message="No leads yet" link={{ label: '+ Add a lead', to: '/leads/new' }} />
      ) : (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-100">
            {[
              { label: 'Open', n: open.reduce((a, d) => a + d.count, 0), dot: 'bg-blue-500' },
              { label: 'Won', n: closed.filter((d) => d.is_final && !d.is_lost).reduce((a, d) => a + d.count, 0), dot: 'bg-emerald-500' },
              { label: 'Lost', n: closed.filter((d) => d.is_lost).reduce((a, d) => a + d.count, 0), dot: 'bg-rose-500' },
            ].map((k) => (
              <div key={k.label} className="rounded-lg bg-slate-50/70 border border-slate-100 px-3 py-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${k.dot}`} /> {k.label}
                </p>
                <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight">
                  {k.n} <span className="text-[11px] font-normal text-slate-400">{total > 0 ? Math.round((k.n / total) * 100) : 0}%</span>
                </p>
              </div>
            ))}
          </div>
          {open.map(bar)}
          {closed.length > 0 && <div className="pt-2 border-t border-slate-100 space-y-3">{closed.map(bar)}</div>}
        </div>
      )}
    </CardShell>
  );
};
