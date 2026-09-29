import React, { useEffect, useState } from 'react';
import { Users, Flame, Wallet, FileText } from 'lucide-react';
import { marketingAPI, RoleDashboardSummary, RegionTotals } from '../../lib/marketing-api';
import { periodRange } from '../../lib/period-ranges';
import { formatINRShort } from '../../lib/region-report';
import { DashboardStatCard } from './DashboardStatCard';
import { KpiStack } from './DashboardFrame';
import { monthOverMonthDelta } from './trendUtils';

/**
 * The 4 headline numbers every role dashboard shows, as two stacks beside the hero:
 *   [Leads · Hot leads]  [Open pipeline ₹ · Quotes sent this month ₹]
 * Colour by meaning: blue neutral, rose urgent, amber waiting (open pipeline), violet secondary.
 * (Won this month isn't here — it's the "Achieved" figure in the target ring, TargetRingCard.)
 * Quotes sent this month comes from /api/leads-by-region/ totals — same scope and the same
 * "counted once, at the latest price, in the month first sent" rule as the Leads by Region card.
 * `leadsLabel` is the only role-specific part ("My Leads", "Team Leads", …).
 */
export const StandardKpis: React.FC<{ data: RoleDashboardSummary; leadsLabel: string; firstIndex?: number }> = ({ data, leadsLabel, firstIndex = 1 }) => {
  const [quotes, setQuotes] = useState<RegionTotals | null>(null);
  const [quotesFailed, setQuotesFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    marketingAPI
      .getLeadsByRegion({ ...periodRange('month'), include_leads: false })
      .then((res) => { if (!cancelled) setQuotes(res.totals); })
      .catch(() => { if (!cancelled) setQuotesFailed(true); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <KpiStack index={firstIndex}>
        <DashboardStatCard
          label={leadsLabel}
          value={data.total_leads}
          subtitle={`${data.open_leads} open`}
          icon={<Users size={20} />}
          accent="blue"
          delta={monthOverMonthDelta(data.monthly_trend, 'lead_count')}
          sparkline={data.monthly_trend.map((p) => p.lead_count)}
          linkTo="/leads"
        />
        <DashboardStatCard
          label="Hot Leads"
          value={data.hot_leads_count}
          subtitle="overdue or due within 7 days"
          icon={<Flame size={20} />}
          accent="rose"
          linkTo="/leads"
        />
      </KpiStack>
      <KpiStack index={firstIndex + 1}>
        <DashboardStatCard
          label="Open Pipeline"
          value={formatINRShort(data.revenue_pipeline?.pipeline)}
          subtitle="potential value of open leads"
          icon={<Wallet size={20} />}
          accent="amber"
          linkTo="/leads"
        />
        <DashboardStatCard
          label="Quotes Sent This Month"
          value={quotes ? formatINRShort(quotes.quotation_value) : '—'}
          subtitle={quotes ? `${quotes.quotation_count} quotation${quotes.quotation_count === 1 ? '' : 's'} sent` : quotesFailed ? 'could not load' : 'loading…'}
          icon={<FileText size={20} />}
          accent="violet"
          linkTo="/reports/leads-by-region?period=month"
        />
      </KpiStack>
    </>
  );
};
