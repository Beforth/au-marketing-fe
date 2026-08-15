import type { DashboardMonthPoint } from '../../lib/marketing-api';

/** Month-over-month % change for a trend series (last vs second-to-last point). */
export function monthOverMonthDelta(
  trend: DashboardMonthPoint[] | null | undefined,
  key: 'lead_count' | 'won_value' | 'order_revenue'
): number | null {
  if (!trend || trend.length < 2) return null;
  const current = trend[trend.length - 1][key];
  const previous = trend[trend.length - 2][key];
  if (previous > 0) return Math.round(((current - previous) / previous) * 1000) / 10;
  return null;
}
