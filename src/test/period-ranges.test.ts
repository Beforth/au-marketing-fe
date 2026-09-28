import { describe, it, expect } from 'vitest';
import { periodRange, periodLabel } from '../../lib/period-ranges';

describe('periodRange (Apr–Mar fiscal year)', () => {
  const sep28 = new Date(2026, 8, 28);
  const feb10 = new Date(2027, 1, 10);
  it('month', () => expect(periodRange('month', sep28)).toEqual({ date_from: '2026-09-01', date_to: '2026-09-30' }));
  it('quarter Jul–Sep', () => expect(periodRange('quarter', sep28)).toEqual({ date_from: '2026-07-01', date_to: '2026-09-30' }));
  it('quarter Jan–Mar belongs to previous FY', () =>
    expect(periodRange('quarter', feb10)).toEqual({ date_from: '2027-01-01', date_to: '2027-03-31' }));
  it('year', () => {
    expect(periodRange('year', sep28)).toEqual({ date_from: '2026-04-01', date_to: '2027-03-31' });
    expect(periodRange('year', feb10)).toEqual({ date_from: '2026-04-01', date_to: '2027-03-31' });
  });
  it('all time has no dates', () => expect(periodRange('all', sep28)).toEqual({}));
  it('labels', () => {
    expect(periodLabel('quarter', sep28)).toBe('Q2 FY 2026-27');
    expect(periodLabel('quarter', feb10)).toBe('Q4 FY 2026-27');
    expect(periodLabel('year', sep28)).toBe('FY 2026-27');
  });
});
