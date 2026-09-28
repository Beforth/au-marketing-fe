import { describe, it, expect } from 'vitest';
import { formatINRShort, regionReportToCsv } from '../../lib/region-report';
import type { RegionGroup } from '../../lib/marketing-api';

describe('formatINRShort', () => {
  it('formats crore / lakh / plain', () => {
    expect(formatINRShort(25_000_000)).toBe('₹2.50 Cr');
    expect(formatINRShort(135_500)).toBe('₹1.4 L');
    expect(formatINRShort(12_300)).toBe('₹12,300');
    expect(formatINRShort(null)).toBe('₹0');
  });
});

describe('regionReportToCsv', () => {
  it('writes one row per lead and quotes commas', () => {
    const regions: RegionGroup[] = [{
      region_id: 1, region_name: 'West', domain_name: 'Pharma', lead_count: 1, quotation_count: 1, quotation_value: 100,
      won_count: 1, won_value: 50,
      leads: [{ lead_id: 9, name: 'Ravi, ABC', series: 'L-1', company: 'ABC', status_label: 'Won', owner_name: 'Amit',
        quotation_count: 1, quotation_value: 100, won: true, won_value: 50, won_at: '2026-09-01T10:00:00Z' }],
    }];
    const [header, row] = regionReportToCsv(regions).split('\n');
    expect(header.startsWith('Domain,Region,Lead')).toBe(true);
    expect(row).toBe('Pharma,West,"Ravi, ABC",L-1,ABC,Won,Amit,1,100,Yes,50,2026-09-01');
  });
});
