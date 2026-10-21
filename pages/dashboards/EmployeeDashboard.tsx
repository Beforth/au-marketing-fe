import React from 'react';
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { BentoGrid, Tile, HalfPair, quickActions, heroSubtitle } from '../../components/dashboard/DashboardFrame';
import { StarPerformerSlot } from '../../components/dashboard/StarPerformerSlot';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';
import { PipelineStagesCard } from '../../components/dashboard/PipelineStagesCard';
import { MyTodoCard } from '../../components/dashboard/MyTodoCard';
import { RoleDashboardSummary } from '../../lib/marketing-api';

interface EmployeeDashboardProps {
  data: RoleDashboardSummary;
  /** Reload the dashboard numbers (after a row action such as logging a call). */
  onRefresh?: () => void;
}

/**
 * Employee: works FROM follow-ups (full width) → To-Do + recent leads → stages + leaderboard.
 */
export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ data, onRefresh }) => {
  return (
    <BentoGrid>
      {/* Row 1: hero (9) · star performer (3) */}
      <Tile span="hero" height="auto" index={0}>
        <DashboardHero
          dashboardName="My Dashboard"
          subtitle={heroSubtitle(
            [
              [data.follow_ups_total ?? data.follow_ups_due?.length ?? 0, 'follow-up needed', 'follow-ups needed'],
              [data.hot_leads_count, 'hot lead', 'hot leads'],
              [data.open_leads, 'open lead', 'open leads'],
            ],
            'Your leads, orders and monthly target'
          )}
          actions={quickActions(false)}
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


      {/* Row 4: To-Do — 320px */}
      <Tile span="wide" index={7}><MyTodoCard size="medium" /></Tile>

      <HalfPair index={10} left={<PipelineStagesCard data={data.by_status} title="My Leads by Stage" />} />
    </BentoGrid>
  );
};
