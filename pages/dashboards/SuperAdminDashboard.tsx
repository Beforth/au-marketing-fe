import React, { useEffect, useState } from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StarPerformerSlot } from '../../components/dashboard/StarPerformerSlot';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { LeadBreakdownCard } from '../../components/dashboard/LeadBreakdownCard';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { FollowUpsDueList } from '../../components/dashboard/FollowUpsDueList';
import { MyTodoCard } from '../../components/dashboard/MyTodoCard';
import { RegionBreakdownChart } from '../../components/dashboard/RegionBreakdownChart';
import { LeadsByRegionCard } from '../../components/dashboard/LeadsByRegionCard';
import { WorldMapCard } from '../../components/dashboard/WorldMapCard';
import { marketingAPI, RoleDashboardSummary, HeadDashboardSummaryResponse } from '../../lib/marketing-api';

interface SuperAdminDashboardProps {
  data: RoleDashboardSummary;
  /** Reload the dashboard numbers (after a row action such as logging a call). */
  onRefresh?: () => void;
}

/**
 * Super admin (org-wide): Leads by Region (full width) → high-value + recent leads → To-Do +
 * follow-ups → stages · sources · leaderboard → region won/lost.
 */
export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ data, onRefresh }) => {
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
          dashboardName="Marketing Overview"
          subtitle={heroSubtitle(
            [
              [data.hot_leads_count, 'hot lead', 'hot leads'],
              [data.open_leads, 'open lead', 'open leads'],
            ],
            'Every domain, every region, every lead — org-wide'
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
        <MonthlyTrendChart data={data.monthly_trend} title="Org-wide Won Value — Last 6 Months" />
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
      <HalfPair index={10} left={<MyTodoCard size="medium" />} right={<FollowUpsDueList followUps={data.follow_ups_due} total={data.follow_ups_total} title="Follow-ups Needed" size="medium" onChanged={onRefresh} />} />

      <Tile span="full" height="big" index={12}><LeadBreakdownCard stages={data.by_status} sources={data.lead_source_breakdown} title="Lead Breakdown" /></Tile>
      <HalfPair index={14} left={<RegionBreakdownChart regions={headSummary?.region_breakdown || []} />} />
    </BentoGrid>
  );
};
