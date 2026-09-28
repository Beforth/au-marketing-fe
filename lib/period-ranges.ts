/**
 * Named reporting periods → { date_from, date_to } (YYYY-MM-DD, both inclusive), on the Apr–Mar
 * fiscal year the targets use (Q1 = Apr–Jun … Q4 = Jan–Mar). 'all' → no dates.
 */
export type PeriodKey = 'month' | 'quarter' | 'year' | 'all';

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This financial year' },
  { value: 'all', label: 'All time' },
];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function periodRange(key: PeriodKey, today: Date = new Date()): { date_from?: string; date_to?: string } {
  const y = today.getFullYear();
  const m = today.getMonth(); // 0 = Jan
  if (key === 'all') return {};
  if (key === 'month') return { date_from: ymd(new Date(y, m, 1)), date_to: ymd(new Date(y, m + 1, 0)) };
  // Fiscal year starts in April (month index 3).
  const fyStartYear = m >= 3 ? y : y - 1;
  if (key === 'year') return { date_from: ymd(new Date(fyStartYear, 3, 1)), date_to: ymd(new Date(fyStartYear + 1, 3, 0)) };
  const monthsIntoFy = (m - 3 + 12) % 12;
  const qStartMonth = 3 + Math.floor(monthsIntoFy / 3) * 3; // may be ≥ 12 → next calendar year
  return {
    date_from: ymd(new Date(fyStartYear, qStartMonth, 1)),
    date_to: ymd(new Date(fyStartYear, qStartMonth + 3, 0)),
  };
}

/** "Q2 FY 2026-27" style label for the current fiscal quarter/year. */
export function periodLabel(key: PeriodKey, today: Date = new Date()): string {
  const m = today.getMonth();
  const fy = m >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const fyText = `FY ${fy}-${String((fy + 1) % 100).padStart(2, '0')}`;
  if (key === 'quarter') return `Q${Math.floor(((m - 3 + 12) % 12) / 3) + 1} ${fyText}`;
  if (key === 'year') return fyText;
  if (key === 'month') return today.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  return 'All time';
}
