import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TargetRingCard } from '../../components/dashboard/TargetRingCard';

const pts = [{ day: 1, value: 0 }, { day: 2, value: 1_000_000 }, { day: 3, value: 3_800_000 }];

describe('Monthly Target (pace bar)', () => {
  it('Monthly Target: percentage, achieved vs target and a pace chart with the ahead/behind chip', () => {
    render(<TargetRingCard target={10_000_000} achieved={3_800_000} scopeLabel="All" employeeCount={15} wonCount={4} wonByDay={pts} />);
    expect(screen.getByText('38%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /projected/ })).toBeInTheDocument();
    expect(screen.getByText(/pace/)).toBeInTheDocument(); // "Behind pace by …" or "Ahead of pace"
  });

  it('Monthly Target: hovering the target / should-be-today lines shows the amount', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 16)); // day 16 of 31
    render(<TargetRingCard target={31_000_000} achieved={3_800_000} scopeLabel="All" employeeCount={3} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('img', { name: /^Target:/ }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Target');
    expect(screen.getByRole('tooltip')).toHaveTextContent('3.10 Cr');
    fireEvent.mouseLeave(screen.getByRole('img', { name: /^Target:/ }));
    fireEvent.mouseEnter(screen.getByRole('img', { name: /^Should be here today:/ }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('day 16 of 31');
    vi.useRealTimers();
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

describe('Monthly Target filters (financial-year quarters)', () => {
  afterEach(() => vi.useRealTimers());
  // Apr 2026 .. Mar 2027: 10 L won and a 20 L target in each of Apr–Oct, nothing after.
  const trend = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'].map((month, i) => ({
    month, label: month.slice(5), lead_count: 0, order_revenue: 0, won_value: i < 7 ? 1_000_000 : 0, target_value: 2_000_000,
  }));

  it('Month / Quarter / Year switch the numbers; a past quarter is closed', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21)); // Oct 2026 = Q3 of FY 2026-27
    render(<TargetRingCard target={2_000_000} achieved={1_000_000} scopeLabel="All" employeeCount={3} trend={trend} />);
    expect(screen.getByText('Monthly Target')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Quarter' }));
    expect(screen.getByText(/Quarterly Target · Q3/)).toBeInTheDocument();   // current quarter by default (Oct–Dec)
    expect(screen.getByRole('tab', { name: 'Q4' })).toBeDisabled();           // future quarter can't be picked
    fireEvent.click(screen.getByRole('tab', { name: 'Q1' }));                 // Apr–Jun: 30 L of 60 L, already over
    expect(screen.getByText(/Quarterly Target · Q1/)).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText(/Missed by/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Year' }));               // whole FY: 70 L of 240 L
    expect(screen.getByText('Yearly Target')).toBeInTheDocument();
    expect(screen.getByText('29%')).toBeInTheDocument();
  });

  it('without trend data (older backend) only the plain month view is offered', () => {
    render(<TargetRingCard target={2_000_000} achieved={1_000_000} scopeLabel="All" employeeCount={1} />);
    expect(screen.queryByRole('tab', { name: 'Quarter' })).not.toBeInTheDocument();
  });
});
