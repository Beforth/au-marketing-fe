import React, { useEffect, useState } from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StarPerformerSlot } from '../../components/dashboard/StarPerformerSlot';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { PipelineStagesCard } from '../../components/dashboard/PipelineStagesCard';
import { MyTodoCard } from '../../components/dashboard/MyTodoCard';
import { RevenuePipelineChart } from '../../components/dashboard/RevenuePipelineChart';
import { LeadsByRegionCard } from '../../components/dashboard/LeadsByRegionCard';
import { WorldMapCard } from '../../components/dashboard/WorldMapCard';
import { marketingAPI, RoleDashboardSummary, HeadDashboardSummaryResponse } from '../../lib/marketing-api';

interface DomainHeadDashboardProps {
  data: RoleDashboardSummary;
  /** Reload the dashboard numbers (after a row action such as logging a call). */
  onRefresh?: () => void;
}

/**
 * Domain head: works FROM Leads by Region (full width) → high-value + recent leads → To-Do +
 * follow-ups → stages + leaderboard → pipeline + region won/lost.
 */
export const DomainHeadDashboard: React.FC<DomainHeadDashboardProps> = ({ data, onRefresh }) => {
  const [headSummary, setHeadSummary] = useState<HeadDashboardSummaryResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      marketingAPI.getHeadDashboardSummary().catch(() => null),
    ]).then(([head]) => {
      if (cancelled) return;
      if (head) setHeadSummary(head);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <BentoGrid>
      {/* Row 1: hero (9) · star performer (3) */}
      <Tile span="hero" height="auto" index={0}>
        <DashboardHero
          dashboardName="Domain Dashboard"
          subtitle={heroSubtitle(
            [
              [data.hot_leads_count, 'hot lead', 'hot leads'],
              [data.open_leads, 'open lead', 'open leads'],
              [data.avg_open_lead_age_days || 0, 'day average open-lead age', 'days average open-lead age'],
            ],
            'Your whole domain — every coordinator, region head and employee below you'
          )}
          actions={quickActions(true)}
        />
      </Tile>
      <StarPerformerSlot />

      {/* Row 2: Monthly Target with Month / Quarter / Year filters */}
      <Tile span="full" height="auto" index={3}>
        <TargetRingCard
          target={data.monthly_target}
          achieved={data.achieved_this_month}
          scopeLabel={data.scope_label}
          employeeCount={data.employee_count}
          wonCount={data.won_count_month}
          wonByDay={data.won_by_day}
          trend={data.monthly_trend}
        />
      </Tile>

      {/* Row 3: the list worked from daily — full width, 384px */}
      <Tile span="full" height="auto" index={6}>
        <LeadsByRegionCard size="big" />
      </Tile>

      {/* Leads around the world — hides itself for a domain head with no Export domain (API answers 403) */}
      <Tile span="full" height="auto" index={6} className="empty:hidden">
        <WorldMapCard />
      </Tile>

      {/* Row 4+: secondary pairs — 320px */}
      <HalfPair index={10} left={<MyTodoCard size="medium" />} />
      <HalfPair index={12} left={<PipelineStagesCard data={data.by_status} title="Domain Leads by Stage" />} right={<RevenuePipelineChart pipeline={data.revenue_pipeline} />} />
    </BentoGrid>
  );
};
