import React from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StandardKpis } from '../../components/dashboard/StandardKpis';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { OutcomeCard } from '../../components/dashboard/OutcomeCard';
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
      {/* Row 1: hero (6) · [leads · hot leads] (3) · [open pipeline · won this month] (3) */}
      <Tile span="hero" height="auto" index={0}>
        <DashboardHero
          dashboardName="Region Dashboard"
          subtitle={heroSubtitle(
            [
              [data.follow_ups_due?.length || 0, 'team follow-up due', 'team follow-ups due'],
              [data.hot_leads_count, 'hot lead', 'hot leads'],
              [data.open_leads, 'open lead', 'open leads'],
            ],
            'Your region\'s team — you, your Region Coordinators and every Employee below you'
          )}
          actions={quickActions(true)}
        />
      </Tile>
      <StandardKpis data={data} leadsLabel="Team Leads" />

      {/* Row 2: won-value trend (6) · target ring (3) · won vs lost (3) — 320px */}
      <Tile span="wide" index={3}>
        <MonthlyTrendChart data={data.monthly_trend} title="Team Won Value — Last 6 Months" />
      </Tile>
      <Tile span="small" index={4}>
        <TargetRingCard
          target={data.monthly_target}
          achieved={data.achieved_this_month}
          scopeLabel={data.scope_label}
          employeeCount={data.employee_count}
          wonCount={data.won_count_month}
        />
      </Tile>
      <Tile span="small" index={5}>
        <OutcomeCard won={data.won_count_month} lost={data.lost_count_month} open={data.open_leads} conversionPct={data.conversion_ratio_pct} />
      </Tile>

      {/* Row 3: the list worked from daily — full width, 384px */}
      <Tile span="full" height="big" index={6}>
        <FollowUpsDueList followUps={data.follow_ups_due} title="Team Follow-ups Due" size="big" onChanged={onRefresh} />
      </Tile>

      {/* Row 4+: secondary pairs — 320px */}
      <Tile span="wide" index={7}><MyTodoCard size="medium" /></Tile>
      <Tile span="wide" index={8}><RecentLeadsList leads={data.recent_leads} title="Team's Recent Leads" size="medium" /></Tile>
      <HalfPair index={10} height="auto" left={<LeadsByRegionCard size="medium" />} />
      <Tile span="full" height="big" index={11}><LeadBreakdownCard stages={data.by_status} sources={data.lead_source_breakdown} title="Team Leads — Stage & Source" /></Tile>
    </BentoGrid>
  );
};
