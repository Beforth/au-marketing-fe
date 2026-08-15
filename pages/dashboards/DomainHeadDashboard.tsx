import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Flame, Clock } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { DashboardStatCard } from '../../components/dashboard/DashboardStatCard';
import { TargetProgressBar } from '../../components/dashboard/TargetProgressBar';
import { LeadStatusChart } from '../../components/dashboard/LeadStatusChart';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { HighValueLeadsList } from '../../components/dashboard/HighValueLeadsList';
import { PerformerOfMonthCard } from '../../components/dashboard/PerformerOfMonthCard';
import { RegionBreakdownChart } from '../../components/dashboard/RegionBreakdownChart';
import { RevenuePipelineChart } from '../../components/dashboard/RevenuePipelineChart';
import { monthOverMonthDelta } from '../../components/dashboard/trendUtils';
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

  const leadsDelta = monthOverMonthDelta(data.monthly_trend, 'lead_count');
  const ordersDelta = monthOverMonthDelta(data.monthly_trend, 'order_revenue');

  return (
    <PageLayout title="Domain Dashboard" description="Your whole domain — every Domain Coordinator, Region Head, Region Coordinator, and Employee below you">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardStatCard
          label="Domain Leads"
          value={data.total_leads}
          subtitle={`${data.open_leads} open`}
          icon={<Users size={16} />}
          delta={leadsDelta}
          sparkline={data.monthly_trend.map((p) => p.lead_count)}
          linkTo="/leads"
        />
        <DashboardStatCard
          label="Domain Orders"
          value={data.total_orders}
          subtitle="all time"
          icon={<ShoppingBag size={16} />}
          accentClassName="bg-emerald-50 text-emerald-600"
          delta={ordersDelta}
          sparkline={data.monthly_trend.map((p) => p.order_revenue)}
          linkTo="/orders"
        />
        <DashboardStatCard
          label="Hot Leads"
          value={data.hot_leads_count}
          subtitle="overdue or due within 7 days"
          icon={<Flame size={16} />}
          accentClassName="bg-rose-50 text-rose-600"
          linkTo="/leads"
        />
        <DashboardStatCard
          label="Avg Lead Age"
          value={data.avg_open_lead_age_days != null ? `${data.avg_open_lead_age_days}d` : '—'}
          subtitle="how stale the open pipeline is"
          icon={<Clock size={16} />}
          accentClassName="bg-violet-50 text-violet-600"
          linkTo="/leads"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3 items-stretch">
        <div className="lg:col-span-2">
          <TargetProgressBar
            target={data.monthly_target}
            achieved={data.achieved_this_month}
            scopeLabel={data.scope_label}
            employeeCount={data.employee_count}
            wonCount={data.won_count_month}
          />
        </div>
        <PerformerOfMonthCard performers={performers} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 items-stretch">
        <MonthlyTrendChart data={data.monthly_trend} title="Domain Won Value — Last 6 Months" />
        <RegionBreakdownChart regions={headSummary?.region_breakdown || []} />
        <RevenuePipelineChart pipeline={data.revenue_pipeline} />
        <LeadStatusChart data={data.by_status} title="Domain Leads by Status" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 items-start">
        <HighValueLeadsList leads={data.high_value_leads} />
        <RecentLeadsList leads={data.recent_leads} title="Domain's Recent Leads" />
      </div>
    </PageLayout>
  );
};
