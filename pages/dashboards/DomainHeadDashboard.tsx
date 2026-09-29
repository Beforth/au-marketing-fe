import React, { useEffect, useState } from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StandardKpis } from '../../components/dashboard/StandardKpis';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { OutcomeCard } from '../../components/dashboard/OutcomeCard';
import { PipelineStagesCard } from '../../components/dashboard/PipelineStagesCard';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { FollowUpsDueList } from '../../components/dashboard/FollowUpsDueList';
import { PerformerOfMonthCard } from '../../components/dashboard/PerformerOfMonthCard';
import { MyTodoCard } from '../../components/dashboard/MyTodoCard';
import { HighValueLeadsList } from '../../components/dashboard/HighValueLeadsList';
import { RegionBreakdownChart } from '../../components/dashboard/RegionBreakdownChart';
import { RevenuePipelineChart } from '../../components/dashboard/RevenuePipelineChart';
import { LeadsByRegionCard } from '../../components/dashboard/LeadsByRegionCard';
import { marketingAPI, RoleDashboardSummary, PerformerOfMonthItem, HeadDashboardSummaryResponse } from '../../lib/marketing-api';

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
  const [performers, setPerformers] = useState<PerformerOfMonthItem[]>([]);
  const [headSummary, setHeadSummary] = useState<HeadDashboardSummaryResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      marketingAPI.getPerformerOfMonth().catch(() => null),
      marketingAPI.getHeadDashboardSummary().catch(() => null),
    ]).then(([perf, head]) => {
      if (cancelled) return;
      if (perf) setPerformers(perf.performers || []);
      if (head) setHeadSummary(head);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <BentoGrid>
      {/* Row 1: hero (6) · [leads · hot leads] (3) · [open pipeline · won this month] (3) */}
      <Tile span="wide" height="auto" index={0}>
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
      <StandardKpis data={data} leadsLabel="Domain Leads" />

      {/* Row 2: won-value trend (6) · target ring (3) · won vs lost (3) — 320px */}
      <Tile span="wide" index={3}>
        <MonthlyTrendChart data={data.monthly_trend} title="Domain Won Value — Last 6 Months" />
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
        <LeadsByRegionCard size="big" />
      </Tile>

      {/* Row 4+: secondary pairs — 320px */}
      {/* Row 4: high-value leads (6) · recent leads (3) · performer of the month (3) */}
      <Tile span="wide" index={7}><HighValueLeadsList leads={data.high_value_leads} size="medium" /></Tile>
      <Tile span="small" index={8}><RecentLeadsList leads={data.recent_leads} title="Domain's Recent Leads" size="medium" /></Tile>
      <Tile span="small" index={9}><PerformerOfMonthCard performers={performers} /></Tile>
      <HalfPair index={10} left={<MyTodoCard size="medium" />} right={<FollowUpsDueList followUps={data.follow_ups_due} title="Domain Follow-ups Due" size="medium" onChanged={onRefresh} />} />
      <HalfPair index={12} left={<PipelineStagesCard data={data.by_status} title="Domain Leads by Stage" />} right={<RevenuePipelineChart pipeline={data.revenue_pipeline} />} />
      <HalfPair index={14} left={<RegionBreakdownChart regions={headSummary?.region_breakdown || []} />} />
    </BentoGrid>
  );
};
