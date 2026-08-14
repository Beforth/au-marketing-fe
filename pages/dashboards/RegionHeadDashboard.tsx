import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Building2, TrendingUp } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { DashboardStatCard } from '../../components/dashboard/DashboardStatCard';
import { TargetProgressBar } from '../../components/dashboard/TargetProgressBar';
import { LeadStatusChart } from '../../components/dashboard/LeadStatusChart';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { PerformerOfMonthCard } from '../../components/dashboard/PerformerOfMonthCard';
import { LeadSourceChart } from '../../components/dashboard/LeadSourceChart';
import { FollowUpsDueList } from '../../components/dashboard/FollowUpsDueList';
import { marketingAPI, RoleDashboardSummary, PerformerOfMonthItem } from '../../lib/marketing-api';

interface RegionHeadDashboardProps {
  data: RoleDashboardSummary;
}

export const RegionHeadDashboard: React.FC<RegionHeadDashboardProps> = ({ data }) => {
  const [performers, setPerformers] = useState<PerformerOfMonthItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    marketingAPI
      .getPerformerOfMonth()
      .then((res) => { if (!cancelled) setPerformers(res.performers || []); })
      .catch(() => { /* non-fatal: leaderboard just stays empty */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageLayout title="Region Dashboard" description="Your region's team — you, your Region Coordinators, and every Employee below you">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard label="Team Leads" value={data.total_leads} subtitle={`${data.open_leads} open`} icon={<Users size={18} />} />
        <DashboardStatCard
          label="Team Orders"
          value={data.total_orders}
          subtitle="all time"
          icon={<ShoppingBag size={18} />}
          accentClassName="bg-emerald-50 text-emerald-600"
        />
        <DashboardStatCard
          label="Conversion"
          value={data.conversion_ratio_pct != null ? `${data.conversion_ratio_pct}%` : '—'}
          subtitle="won vs won+lost, this month"
          icon={<TrendingUp size={18} />}
          accentClassName="bg-amber-50 text-amber-600"
        />
        <DashboardStatCard label="Team Customers" value={data.customers_count} icon={<Building2 size={18} />} accentClassName="bg-violet-50 text-violet-600" />
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4 items-start">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="md:col-span-2">
            <MonthlyTrendChart data={data.monthly_trend} title="Team Won Value — Last 6 Months" />
          </div>
          <LeadStatusChart data={data.by_status} title="Team Leads by Status" />
          <LeadSourceChart data={data.lead_source_breakdown} />
        </div>
        <div className="space-y-4">
          <FollowUpsDueList followUps={data.follow_ups_due} title="Team Follow-ups Due" />
          <RecentLeadsList leads={data.recent_leads} title="Team's Recent Leads" />
        </div>
      </div>
    </PageLayout>
  );
};
