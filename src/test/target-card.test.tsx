import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';

const pts = [{ day: 1, value: 0 }, { day: 2, value: 1_000_000 }, { day: 3, value: 3_800_000 }];

describe('Monthly Target (befui Pace chart)', () => {
  it('Monthly Target: percentage, achieved vs target and a pace chart with the ahead/behind chip', () => {
    render(<TargetRingCard target={10_000_000} achieved={3_800_000} scopeLabel="All" employeeCount={15} wonCount={4} wonByDay={pts} />);
    expect(screen.getByText('38%')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('won by day 3'));
    expect(screen.getByText(/pace/)).toBeInTheDocument(); // "Behind pace by …" or "Ahead of pace"
  });

  it('Monthly Target: no chart without a target; a plain progress bar when the daily data is missing', () => {
    const { rerender } = render(<TargetRingCard target={0} achieved={500} scopeLabel="All" employeeCount={1} wonByDay={pts} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('of no target set')).toBeInTheDocument();
    rerender(<TargetRingCard target={10_000_000} achieved={500} scopeLabel="All" employeeCount={1} />);
    expect(screen.queryByRole('img', { name: /won by day/ })).not.toBeInTheDocument(); // no pace chart
    expect(screen.getByRole('img', { name: /projected/ })).toBeInTheDocument();       // pace bar instead, never blank
    expect(screen.getByText(/Needed \/ day/)).toBeInTheDocument();
  });
});
