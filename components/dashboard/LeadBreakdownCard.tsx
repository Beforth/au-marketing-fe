import React from 'react';
import type { DashboardStatusCount, DashboardLeadSource } from '../../lib/marketing-api';
import { CardShell } from './ListCard';
import { StageBars } from './PipelineStagesCard';
import { SourceBars } from './LeadSourceChart';

/** Leads by stage (left) and lead sources (right) in one full-width card; stacks on small screens. */
export const LeadBreakdownCard: React.FC<{
  stages: DashboardStatusCount[] | null | undefined;
  sources: DashboardLeadSource[] | null | undefined;
  title?: string;
}> = ({ stages, sources, title = 'Lead Breakdown' }) => {
  const total = (stages || []).reduce((n, d) => (d.count > 0 ? n + d.count : n), 0);
  return (
    <CardShell title={title} subtitle={`${total} lead${total === 1 ? '' : 's'} in your scope · by stage and by source`} bodyClassName="overflow-y-auto lg:overflow-hidden">
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-slate-100">
        <section className="min-h-0 lg:overflow-y-auto" aria-label="Leads by stage">
          <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">By stage</p>
          <StageBars data={stages} columns />
        </section>
        <section className="min-h-[18rem] lg:min-h-0 flex flex-col" aria-label="Lead sources">
          <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">By source</p>
          <div className="flex-1 min-h-0"><SourceBars data={sources} /></div>
        </section>
      </div>
    </CardShell>
  );
};
