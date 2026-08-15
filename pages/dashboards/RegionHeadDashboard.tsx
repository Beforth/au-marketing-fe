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
import { WonLostDonut } from '../../components/dashboard/WonLostDonut';
import { monthOverMonthDelta } from '../../components/dashboard/trendUtils';
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

  const leadsDelta = monthOverMonthDelta(data.monthly_trend, 'lead_count');
  const ordersDelta = monthOverMonthDelta(data.monthly_trend, 'order_revenue');

  return (
    <PageLayout title="Region Dashboard" description="Your region's team — you, your Region Coordinators, and every Employee below you">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardStatCard
          label="Team Leads"
          value={data.total_leads}
          subtitle={`${data.open_leads} open`}
          icon={<Users size={16} />}
          delta={leadsDelta}
          sparkline={data.monthly_trend.map((p) => p.lead_count)}
          linkTo="/leads"
        />
        <DashboardStatCard
          label="Team Orders"
          value={data.total_orders}
          subtitle="all time"
          icon={<ShoppingBag size={16} />}
          accentClassName="bg-emerald-50 text-emerald-600"
          delta={ordersDelta}
          sparkline={data.monthly_trend.map((p) => p.order_revenue)}
          linkTo="/orders"
        />
        <DashboardStatCard
          label="Conversion"
          value={data.conversion_ratio_pct != null ? `${data.conversion_ratio_pct}%` : '—'}
          subtitle="won vs won+lost this period"
          icon={<TrendingUp size={16} />}
          accentClassName="bg-amber-50 text-amber-600"
          right={<WonLostDonut won={data.won_count_month} lost={data.lost_count_month} centerLabel={String(data.won_count_month)} centerSub="won" />}
        />
        <DashboardStatCard
          label="Team Customers"
          value={data.customers_count}
          subtitle="in your scope"
          icon={<Building2 size={16} />}
          accentClassName="bg-violet-50 text-violet-600"
          linkTo="/customers"
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
        <div className="md:col-span-2">
          <MonthlyTrendChart data={data.monthly_trend} title="Team Won Value — Last 6 Months" />
        </div>
        <LeadStatusChart data={data.by_status} title="Team Leads by Status" />
        <LeadSourceChart data={data.lead_source_breakdown} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 items-start">
        <FollowUpsDueList followUps={data.follow_ups_due} title="Team Follow-ups Due" />
        <RecentLeadsList leads={data.recent_leads} title="Team's Recent Leads" />
      </div>
    </PageLayout>
  );
};
