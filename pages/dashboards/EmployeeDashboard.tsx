import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, Flame, TrendingUp } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { DashboardStatCard } from '../../components/dashboard/DashboardStatCard';
import { TargetProgressBar } from '../../components/dashboard/TargetProgressBar';
import { LeadStatusChart } from '../../components/dashboard/LeadStatusChart';
import { MonthlyTrendChart } from '../../components/dashboard/MonthlyTrendChart';
import { RecentLeadsList } from '../../components/dashboard/RecentLeadsList';
import { FollowUpsDueList } from '../../components/dashboard/FollowUpsDueList';
import { PerformerOfMonthCard } from '../../components/dashboard/PerformerOfMonthCard';
import { WonLostDonut } from '../../components/dashboard/WonLostDonut';
import { monthOverMonthDelta } from '../../components/dashboard/trendUtils';
import { marketingAPI, RoleDashboardSummary, PerformerOfMonthItem } from '../../lib/marketing-api';

interface EmployeeDashboardProps {
  data: RoleDashboardSummary;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ data }) => {
  const [performers, setPerformers] = useState<PerformerOfMonthItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    marketingAPI
      .getPerformerOfMonth()
      .then((res) => { if (!cancelled) setPerformers(res.performers || []); })
      .catch(() => { /* non-fatal: leaderboard just stays empty */ });
    return () => { cancelled = true; };
  }, []);

  const leadsDelta = monthOverMonthDelta(data.monthly_trend, 'lead_count');
  const ordersDelta = monthOverMonthDelta(data.monthly_trend, 'order_revenue');

  return (
    <PageLayout title="My Dashboard" description="Your leads, orders, and monthly target — nothing outside your own scope">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardStatCard
          label="My Leads"
          value={data.total_leads}
          subtitle={`${data.open_leads} open`}
          icon={<Users size={16} />}
          delta={leadsDelta}
          sparkline={data.monthly_trend.map((p) => p.lead_count)}
          linkTo="/leads"
        />
        <DashboardStatCard
          label="My Orders"
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
          label="Conversion"
          value={data.conversion_ratio_pct != null ? `${data.conversion_ratio_pct}%` : '—'}
          subtitle="won vs won+lost this period"
          icon={<TrendingUp size={16} />}
          accentClassName="bg-amber-50 text-amber-600"
          right={<WonLostDonut won={data.won_count_month} lost={data.lost_count_month} centerLabel={String(data.won_count_month)} centerSub="won" />}
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
        <MonthlyTrendChart data={data.monthly_trend} title="My Won Value vs Target — Last 6 Months" />
        <LeadStatusChart data={data.by_status} title="My Leads by Status" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 items-start">
        <FollowUpsDueList followUps={data.follow_ups_due} title="My Follow-ups — Act Now" />
        <RecentLeadsList leads={data.recent_leads} title="My Recent Leads" />
      </div>
    </PageLayout>
  );
};
