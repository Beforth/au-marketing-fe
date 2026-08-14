import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Flame } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { DashboardStatCard } from '../../components/dashboard/DashboardStatCard';
import { TargetProgressBar } from '../../components/dashboard/TargetProgressBar';
import { LeadStatusChart } from '../../components/dashboard/LeadStatusChart';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { PerformerOfMonthCard } from '../../components/dashboard/PerformerOfMonthCard';
import { RegionBreakdownChart } from '../../components/dashboard/RegionBreakdownChart';
import { LeadSourceChart } from '../../components/dashboard/LeadSourceChart';
import { HighValueLeadsList } from '../../components/dashboard/HighValueLeadsList';
import { marketingAPI, RoleDashboardSummary, PerformerOfMonthItem, HeadDashboardSummaryResponse } from '../../lib/marketing-api';

interface SuperAdminDashboardProps {
  data: RoleDashboardSummary;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ data }) => {
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
    <PageLayout title="Marketing Overview" description="Every domain, every region, every lead — org-wide">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard label="Total Leads" value={data.total_leads} subtitle={`${data.open_leads} open`} icon={<Users size={18} />} />
        <DashboardStatCard
          label="Total Orders"
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
          label="Conversion"
          value={data.conversion_ratio_pct != null ? `${data.conversion_ratio_pct}%` : '—'}
          subtitle="won vs won+lost, this month"
          icon={<Users size={18} />}
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
        <MonthlyTrendChart data={data.monthly_trend} title="Org-wide Won Value — Last 6 Months" />
      </div>

      <div className="mt-4">
        <RegionBreakdownChart regions={headSummary?.region_breakdown || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <LeadSourceChart data={data.lead_source_breakdown} />
        <HighValueLeadsList leads={data.high_value_leads} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <LeadStatusChart data={data.by_status} title="Leads by Status" />
        <RecentLeadsList leads={data.recent_leads} title="Recent Leads" />
      </div>
    </PageLayout>
  );
};
