import React, { useEffect, useState } from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StarPerformerSlot } from '../../components/dashboard/StarPerformerSlot';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { LeadBreakdownCard } from '../../components/dashboard/LeadBreakdownCard';
import { MyTodoCard } from '../../components/dashboard/MyTodoCard';
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

      <Tile span="full" height="big" index={12}><LeadBreakdownCard stages={data.by_status} sources={data.lead_source_breakdown} title="Lead Breakdown" /></Tile>
    </BentoGrid>
  );
};
