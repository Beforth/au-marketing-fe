import React from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StarPerformerSlot } from '../../components/dashboard/StarPerformerSlot';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { LeadBreakdownCard } from '../../components/dashboard/LeadBreakdownCard';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { FollowUpsDueList } from '../../components/dashboard/FollowUpsDueList';
import { MyTodoCard } from '../../components/dashboard/MyTodoCard';
import { LeadsByRegionCard } from '../../components/dashboard/LeadsByRegionCard';
import { RoleDashboardSummary } from '../../lib/marketing-api';

interface RegionHeadDashboardProps {
  data: RoleDashboardSummary;
  /** Reload the dashboard numbers (after a row action such as logging a call). */
  onRefresh?: () => void;
}

/**
 * Region head: works FROM the team's follow-ups (full width) → To-Do + recent leads → Leads by Region
 * → stages · sources · leaderboard.
 */
export const RegionHeadDashboard: React.FC<RegionHeadDashboardProps> = ({ data, onRefresh }) => {
  return (
    <BentoGrid>
      {/* Row 1: hero (9) · star performer (3) */}
      <Tile span="hero" height="auto" index={0}>
        <DashboardHero
          dashboardName="Region Dashboard"
          subtitle={heroSubtitle(
            [
              [data.follow_ups_total ?? data.follow_ups_due?.length ?? 0, 'team follow-up needed', 'team follow-ups needed'],
              [data.hot_leads_count, 'hot lead', 'hot leads'],
              [data.open_leads, 'open lead', 'open leads'],
            ],
            'Your region\'s team — you, your Region Coordinators and every Employee below you'
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
        <MonthlyTrendChart data={data.monthly_trend} title="Team Won Value — Last 6 Months" />
      </Tile>

      {/* Row 3: the list worked from daily — full width, 384px */}
      <Tile span="full" height="big" index={6}>
        <FollowUpsDueList followUps={data.follow_ups_due} total={data.follow_ups_total} title="Team Follow-ups Needed" size="big" onChanged={onRefresh} />
      </Tile>

      {/* Row 4+: secondary pairs — 320px */}
      <Tile span="wide" index={7}><MyTodoCard size="medium" /></Tile>
      <Tile span="wide" index={8}><RecentLeadsList leads={data.recent_leads} title="Team's Recent Leads" size="medium" /></Tile>
      <HalfPair index={10} height="auto" left={<LeadsByRegionCard size="medium" />} />
      <Tile span="full" height="big" index={11}><LeadBreakdownCard stages={data.by_status} sources={data.lead_source_breakdown} title="Team Leads — Stage & Source" /></Tile>
    </BentoGrid>
  );
};
