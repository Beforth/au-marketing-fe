import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineStagesCard } from '../../components/dashboard/PipelineStagesCard';
import { OutcomeCard } from '../../components/dashboard/OutcomeCard';

describe('befui charts on the dashboard', () => {
  it('Leads by Stage: a funnel row per stage with its count and share, closed stages below', () => {
    render(
      <PipelineStagesCard
        data={[
          { status_id: 1, status: 'Enquiry', count: 6 },
          { status_id: 2, status: 'Quotation', count: 2 },
          { status_id: 3, status: 'Won', count: 2, is_final: true },
        ] as any}
      />,
    );
    expect(screen.getByText('Enquiry')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument(); // 6 of 10
    expect(screen.getAllByText('Won').length).toBeGreaterThan(1); // summary tile + funnel row
  });

  it('Won vs Lost: half donut with conversion in the middle and the counts underneath', () => {
    render(<OutcomeCard won={3} lost={1} open={7} conversionPct={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Won 3, Lost 1');
    expect(screen.getByText('Open now')).toBeInTheDocument();
  });
});
