import { describe, it, expect } from 'vitest';
import { leadMatchesSearch } from '../../lib/lead-search';
import type { Lead } from '../../lib/marketing-api';

const lead = (over: Partial<Lead> = {}): Lead => ({
  id: 245,
  series: 'L-2026-045',
  notes: 'Needs demo next week',
  assigned_to_username: 'rahul.k',
  quotation_numbers: ['QTN-2026-012'],
  contact: {
    id: 1, contact_person_name: 'Ravi Sharma', contact_email: 'ravi@abcpharma.com', contact_phone: '+91 98765-43210',
    organization: { id: 3, name: 'ABC Pharma Pvt Ltd' },
  },
  customer: { id: 9, company_name: 'ABC Pharma', city: 'Pune' },
  ...over,
} as unknown as Lead);

describe('leadMatchesSearch', () => {
  it('empty query matches everything', () => {
    expect(leadMatchesSearch(lead(), '')).toBe(true);
    expect(leadMatchesSearch(lead(), '   ')).toBe(true);
  });

  it('matches name, company, email, lead number, notes (case-insensitive)', () => {
    for (const q of ['ravi', 'abc pharma', 'abcpharma.com', 'l-2026-045', 'DEMO']) {
      expect(leadMatchesSearch(lead(), q)).toBe(true);
    }
  });

  it('matches the new fields: quotation number, assigned person, city', () => {
    expect(leadMatchesSearch(lead(), 'QTN-2026-012')).toBe(true);
    expect(leadMatchesSearch(lead(), 'rahul')).toBe(true);
    expect(leadMatchesSearch(lead(), 'pune')).toBe(true);
  });

  it('words can be in any order and needn\'t be next to each other', () => {
    expect(leadMatchesSearch(lead(), 'pune ravi')).toBe(true);
    expect(leadMatchesSearch(lead(), 'pharma rahul')).toBe(true);
    expect(leadMatchesSearch(lead(), 'pune mumbai')).toBe(false); // every word must match
  });

  it('phone matches however it is typed', () => {
    for (const q of ['9876543210', '98765 43210', '+91 98765-43210', '43210']) {
      expect(leadMatchesSearch(lead(), q)).toBe(true);
    }
    expect(leadMatchesSearch(lead(), '11111')).toBe(false);
  });

  it('matches lead id when typed as a number or #number', () => {
    expect(leadMatchesSearch(lead(), '#245')).toBe(true);
  });

  it('handles a lead with no contact or customer', () => {
    expect(leadMatchesSearch(lead({ contact: null, customer: undefined }), 'rahul')).toBe(true);
    expect(leadMatchesSearch(lead({ contact: null, customer: undefined }), 'ravi')).toBe(false);
  });
});
