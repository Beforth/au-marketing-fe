import type { RegionGroup } from './marketing-api';

/** ₹1.2 Cr / ₹4.5 L / ₹12,300 — same short style as the dashboard cards. */
export function formatINRShort(value: number | null | undefined): string {
  const v = value ?? 0;
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)} L`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per lead (with its region), for the page's "Download CSV". Values are plain numbers. */
export function regionReportToCsv(regions: RegionGroup[]): string {
  const header = ['Domain', 'Region', 'Lead', 'Lead No.', 'Company', 'Status', 'Owner', 'Quotations sent', 'Quotation value', 'Won', 'Won value', 'Won date'];
  const lines = [header.map(csvCell).join(',')];
  for (const g of regions) {
    for (const l of g.leads) {
      lines.push([
        g.domain_name || '', g.region_name, l.name, l.series || '', l.company || '', l.status_label || '', l.owner_name || '',
        l.quotation_count, l.quotation_value, l.won ? 'Yes' : 'No', l.won_value, l.won_at ? l.won_at.slice(0, 10) : '',
      ].map(csvCell).join(','));
    }
  }
  return lines.join('\n');
}
