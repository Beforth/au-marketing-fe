import React, { useEffect, useState } from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StarPerformerSlot } from '../../components/dashboard/StarPerformerSlot';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { PipelineStagesCard } from '../../components/dashboard/PipelineStagesCard';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { FollowUpsDueList } from '../../components/dashboard/FollowUpsDueList';
import { MyTodoCard } from '../../components/dashboard/MyTodoCard';
import { RegionBreakdownChart } from '../../components/dashboard/RegionBreakdownChart';
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

      {/* Row 2: won-value trend (6) · target ring (3) · won vs lost (3) — 320px */}
      <Tile span="full" height="auto" index={3}>
        <TargetRingCard
          target={data.monthly_target}
          achieved={data.achieved_this_month}
          scopeLabel={data.scope_label}
          employeeCount={data.employee_count}
          wonCount={data.won_count_month}
          wonByDay={data.won_by_day}
        />
      </Tile>
      <Tile span="full" height="big" index={4}>
        <MonthlyTrendChart data={data.monthly_trend} title="Domain Won Value — Last 6 Months" />
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
      {/* Row 4: leads — recent / high value tabs (full width) */}
      <Tile span="full" index={7}><RecentLeadsList leads={data.recent_leads} highValueLeads={data.high_value_leads} size="medium" /></Tile>
      <HalfPair index={10} left={<MyTodoCard size="medium" />} right={<FollowUpsDueList followUps={data.follow_ups_due} total={data.follow_ups_total} title="Domain Follow-ups Needed" size="medium" onChanged={onRefresh} />} />
      <HalfPair index={12} left={<PipelineStagesCard data={data.by_status} title="Domain Leads by Stage" />} right={<RevenuePipelineChart pipeline={data.revenue_pipeline} />} />
      <HalfPair index={14} left={<RegionBreakdownChart regions={headSummary?.region_breakdown || []} />} />
    </BentoGrid>
  );
};
