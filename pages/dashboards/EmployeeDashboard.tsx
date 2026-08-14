import React from 'react';
import { Users, ShoppingBag, Flame, TrendingUp } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { DashboardStatCard } from '../../components/dashboard/DashboardStatCard';
import { TargetProgressBar } from '../../components/dashboard/TargetProgressBar';
import { LeadStatusChart } from '../../components/dashboard/LeadStatusChart';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { FollowUpsDueList } from '../../components/dashboard/FollowUpsDueList';
import type { RoleDashboardSummary } from '../../lib/marketing-api';

interface EmployeeDashboardProps {
  data: RoleDashboardSummary;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ data }) => {
  return (
    <PageLayout title="My Dashboard" description="Your leads, orders, and monthly target — nothing outside your own scope">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardStatCard label="My Leads" value={data.total_leads} subtitle={`${data.open_leads} open`} icon={<Users size={18} />} />
        <DashboardStatCard
          label="My Orders"
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
          icon={<TrendingUp size={18} />}
          accentClassName="bg-amber-50 text-amber-600"
        />
        <TargetProgressBar
          target={data.monthly_target}
          achieved={data.achieved_this_month}
          scopeLabel={data.scope_label}
          employeeCount={data.employee_count}
        />
      </div>

      <div className="mt-4">
        <MonthlyTrendChart data={data.monthly_trend} title="My Won Value — Last 6 Months" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <FollowUpsDueList followUps={data.follow_ups_due} title="My Follow-ups — Act Now" />
        <LeadStatusChart data={data.by_status} title="My Leads by Status" />
      </div>

      <div className="mt-4">
        <RecentLeadsList leads={data.recent_leads} title="My Recent Leads" />
      </div>
    </PageLayout>
  );
};
