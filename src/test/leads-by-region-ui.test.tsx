import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LeadsByRegionResponse } from '../../lib/marketing-api';

const sample: LeadsByRegionResponse = {
  date_from: '2026-07-01',
  date_to: '2026-09-30',
  totals: { lead_count: 3, quotation_count: 2, quotation_value: 250000, won_count: 1, won_value: 90000 },
  regions: [
    {
      region_id: 1, region_name: 'West', domain_id: 5, domain_name: 'Pharma',
      lead_count: 2, quotation_count: 2, quotation_value: 250000, won_count: 1, won_value: 90000,
      leads: [
        { lead_id: 11, name: 'Ravi (L-11)', company: 'ABC Pharma', status_label: 'Won', owner_name: 'Amit',
          quotation_count: 1, quotation_value: 150000, won: true, won_value: 90000, won_at: '2026-08-02T00:00:00Z' },
        { lead_id: 12, name: 'Sita (L-12)', company: null, status_label: 'Quotation submitted', owner_name: null,
          quotation_count: 1, quotation_value: 100000, won: false, won_value: 0 },
      ],
    },
    {
      region_id: null, region_name: 'No region', lead_count: 1, quotation_count: 0, quotation_value: 0,
      won_count: 0, won_value: 0,
      leads: [{ lead_id: 13, name: 'New lead', quotation_count: 0, quotation_value: 0, won: false, won_value: 0 }],
    },
  ],
};

const getLeadsByRegion = vi.fn();
vi.mock('../../lib/marketing-api', async (orig) => ({
  ...(await orig<typeof import('../../lib/marketing-api')>()),
  marketingAPI: {
    getLeadsByRegion: (...a: unknown[]) => getLeadsByRegion(...a),
    getDomains: vi.fn().mockResolvedValue({ items: [] }),
    getRegions: vi.fn().mockResolvedValue({ items: [] }),
    getLeadStatuses: vi.fn().mockResolvedValue([]),
    getReportsScope: vi.fn().mockResolvedValue({ can_select_employee: false, employees: [], role: 'super_admin' }),
  },
}));
vi.mock('../../App', () => ({ useApp: () => ({ showToast: vi.fn() }) }));
vi.mock('../../components/layout/PageLayout', () => ({
  PageLayout: ({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) => (
    <div><h1>{title}</h1>{actions}{children}</div>
  ),
}));

beforeEach(() => {
  getLeadsByRegion.mockReset();
  getLeadsByRegion.mockResolvedValue(sample);
});

describe('LeadsByRegionCard (dashboard widget)', () => {
  it('shows each region, totals, and asks for totals only for this quarter', async () => {
    const { LeadsByRegionCard } = await import('../../components/dashboard/LeadsByRegionCard');
    render(<MemoryRouter><LeadsByRegionCard /></MemoryRouter>);
    expect(await screen.findByText('West')).toBeInTheDocument();
    expect(screen.getByText('No region')).toBeInTheDocument();
    expect(screen.getAllByText('₹2.5 L').length).toBeGreaterThan(0); // region + total quote value
    expect(screen.getAllByText('₹90,000').length).toBe(2);
    const args = getLeadsByRegion.mock.calls[0][0];
    expect(args.include_leads).toBe(false);
    expect(args.date_from).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('clicking a region opens the page filtered to it', async () => {
    const { LeadsByRegionCard } = await import('../../components/dashboard/LeadsByRegionCard');
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LeadsByRegionCard />} />
          <Route path="/reports/leads-by-region" element={<div>REPORT PAGE</div>} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByText('West'));
    expect(await screen.findByText('REPORT PAGE')).toBeInTheDocument();
  });
});

describe('LeadsByRegionPage', () => {
  it('reads filters from the URL, shows grand totals and lead rows with links', async () => {
    const { LeadsByRegionPage } = await import('../../pages/LeadsByRegionPage');
    render(
      <MemoryRouter initialEntries={['/reports/leads-by-region?period=all&region_id=1']}>
        <LeadsByRegionPage />
      </MemoryRouter>
    );
    // Two regions → both open by default; rows link to the lead.
    const link = await screen.findByRole('link', { name: 'Ravi (L-11)' });
    expect(link).toHaveAttribute('href', '/leads/11/edit');
    expect(screen.getByText('ABC Pharma')).toBeInTheDocument();
    expect(screen.getByText('Won leads')).toBeInTheDocument();
    const args = getLeadsByRegion.mock.calls[0][0];
    expect(args.region_id).toBe(1);
    expect(args.date_from).toBeUndefined(); // "All time"
    // Collapse all hides the rows.
    fireEvent.click(screen.getByText('Collapse all'));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Ravi (L-11)' })).not.toBeInTheDocument());
  });
});
