import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Flame, Clock } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { DashboardStatCard } from '../../components/dashboard/DashboardStatCard';
import { TargetProgressBar } from '../../components/dashboard/TargetProgressBar';
import { LeadStatusChart } from '../../components/dashboard/LeadStatusChart';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { PerformerOfMonthCard } from '../../components/dashboard/PerformerOfMonthCard';
import { RegionBreakdownChart } from '../../components/dashboard/RegionBreakdownChart';
import { RevenuePipelineChart } from '../../components/dashboard/RevenuePipelineChart';
import { marketingAPI, RoleDashboardSummary, PerformerOfMonthItem, HeadDashboardSummaryResponse } from '../../lib/marketing-api';

interface DomainHeadDashboardProps {
  data: RoleDashboardSummary;
}

export const DomainHeadDashboard: React.FC<DomainHeadDashboardProps> = ({ data }) => {
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
    <PageLayout title="Domain Dashboard" description="Your whole domain — every Domain Coordinator, Region Head, Region Coordinator, and Employee below you">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard label="Domain Leads" value={data.total_leads} subtitle={`${data.open_leads} open`} icon={<Users size={18} />} />
        <DashboardStatCard
          label="Domain Orders"
          value={data.total_orders}
          subtitle="all time"
          icon={<ShoppingBag size={18} />}
          accentClassName="bg-emerald-50 text-emerald-600"
        />
        <DashboardStatCard
          label="Hot Leads"
          value={data.hot_leads_count}
          subtitle="overdue or due within 7 days"
          icon={<Flame size={18} />}
          accentClassName="bg-rose-50 text-rose-600"
        />
        <DashboardStatCard
          label="Avg Lead Age"
          value={data.avg_open_lead_age_days != null ? `${data.avg_open_lead_age_days}d` : '—'}
          subtitle="how stale the open pipeline is"
          icon={<Clock size={18} />}
          accentClassName="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <TargetProgressBar
          target={data.monthly_target}
          achieved={data.achieved_this_month}
          scopeLabel={data.scope_label}
          employeeCount={data.employee_count}
        />
        <PerformerOfMonthCard performers={performers} />
      </div>

      <div className="mt-4">
        <MonthlyTrendChart data={data.monthly_trend} title="Domain Won Value — Last 6 Months" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <RegionBreakdownChart regions={headSummary?.region_breakdown || []} />
        <RevenuePipelineChart pipeline={data.revenue_pipeline} />
      </div>

      <div className="mt-4">
        <LeadStatusChart data={data.by_status} title="Domain Leads by Status" />
      </div>

      <div className="mt-4">
        <RecentLeadsList leads={data.recent_leads} title="Domain's Recent Leads" />
      </div>
    </PageLayout>
  );
};
