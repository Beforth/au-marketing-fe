import React from 'react';
import { CardShell } from './ListCard';
import { BarList } from '../ui/BarList';
import type { DashboardLeadSource } from '../../lib/marketing-api';

interface LeadSourceChartProps {
  data: DashboardLeadSource[] | null | undefined;
}

/** Top lead sources as a ranked bar list, without the card frame (shared with LeadBreakdownCard). */
export const SourceBars: React.FC<LeadSourceChartProps> = ({ data }) => {
  const rows = (data || []).filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
  const total = rows.reduce((n, d) => n + d.count, 0);
  return (
    <div className="h-full overflow-y-auto p-3">
      {rows.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-slate-400">No source data yet</div>
      ) : (
        <BarList
          items={rows.map((d) => ({ label: d.source, value: d.count }))}
          format={(n) => `${n} · ${Math.round((n / total) * 100)}%`}
        />
      )}
    </div>
  );
};

export const LeadSourceChart: React.FC<LeadSourceChartProps> = ({ data }) => (
  <CardShell title="Lead Sources" subtitle="Where leads in your scope are coming from">
    <SourceBars data={data} />
  </CardShell>
);
