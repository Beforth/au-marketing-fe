import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('LeadBreakdownCard', () => {
  it('shows the stage bars and the source chart in one card', async () => {
    const { LeadBreakdownCard } = await import('../../components/dashboard/LeadBreakdownCard');
    render(
      <LeadBreakdownCard
        stages={[{ status_id: 1, status: 'Enquiry', count: 3 }, { status_id: 2, status: 'Won', count: 1, is_final: true }] as any}
        sources={[{ source: 'Website', count: 2 }, { source: 'Referral', count: 1 }] as any}
      />,
    );
    expect(screen.getByText('Enquiry')).toBeInTheDocument();
    expect(screen.getByText('Lead Breakdown')).toBeInTheDocument();
    expect(screen.getByText('4 leads in your scope · by stage and by source')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
    expect(screen.getByText('2 · 67%')).toBeInTheDocument();
  });
});
