import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { RoleDashboardSummary } from '../../lib/marketing-api';

// Charts don't render in jsdom — replace with a stub that shows nothing.
vi.mock('react-apexcharts', () => ({ default: () => null }));

const getTodos = vi.fn();
const completeTodo = vi.fn();
const createLeadActivity = vi.fn();
const scheduleLeadFollowUp = vi.fn();
const showToast = vi.fn();
vi.mock('../../App', () => ({ useApp: () => ({ showToast }) }));
vi.mock('../../lib/hrms-rbac', async (orig) => ({
  ...(await orig<typeof import('../../lib/hrms-rbac')>()),
  hrmsRBACClient: { getTodos: (...a: unknown[]) => getTodos(...a), completeTodo: (...a: unknown[]) => completeTodo(...a) },
}));
vi.mock('../../lib/marketing-api', async (orig) => ({
  ...(await orig<typeof import('../../lib/marketing-api')>()),
  marketingAPI: {
    getPerformerOfMonth: vi.fn().mockResolvedValue({ performers: [] }),
    createLeadActivity: (...a: unknown[]) => createLeadActivity(...a),
    scheduleLeadFollowUp: (...a: unknown[]) => scheduleLeadFollowUp(...a),
    getHeadDashboardSummary: vi.fn().mockResolvedValue({ region_breakdown: [] }),
    getLeadsByRegion: vi.fn().mockResolvedValue({
      totals: { lead_count: 0, quotation_count: 0, quotation_value: 0, won_count: 0, won_value: 0 }, regions: [],
    }),
  },
}));

const data: RoleDashboardSummary = {
  dashboard_role: 'employee', scope_label: 'Me', year: 2026, month: 9,
  total_leads: 42, open_leads: 30, won_count_month: 3, lost_count_month: 1, conversion_ratio_pct: 75,
  by_status: [{ status: 'New', count: 5, is_final: false, is_lost: false }],
  recent_leads: [{ id: 7, company: 'ABC Pharma', series: 'L-7', status: 'New', status_color: '#2563eb', potential_value: 250000, created_at: '2026-09-20T10:00:00Z' }],
  monthly_trend: [{ month: '2026-09', label: 'Sep', lead_count: 5, won_value: 100, order_revenue: 50 }],
  total_orders: 9, total_revenue_month: 0, contacts_count: 0, customers_count: 12,
  monthly_target: 1000000, achieved_this_month: 400000, employee_count: 1, avg_open_lead_age_days: 12,
  revenue_pipeline: { achieved: 1, committed: 2, pipeline: 3 }, hot_leads_count: 4,
  follow_ups_due: [
    { id: 1, company: 'Overdue Co', series: 'L-1', next_follow_up_at: '2026-09-20T10:00:00Z', due_label: 'Overdue' },
    { id: 2, company: 'Today Co', series: 'L-2', next_follow_up_at: '2026-09-28T15:00:00Z', due_label: 'Today' },
  ],
  lead_source_breakdown: [], high_value_leads: [],
};

const makeStore = (permissions: string[] = []) => configureStore({
  reducer: {
    auth: () => ({ token: 't', user: { first_name: 'Aditya', username: 'ady' }, employee: null, roles: [], permissions }),
  },
});

const renderIt = (el: React.ReactElement, permissions: string[] = []) =>
  render(<Provider store={makeStore(permissions)}><MemoryRouter>{el}</MemoryRouter></Provider>);

beforeEach(() => {
  getTodos.mockReset();
  getTodos.mockResolvedValue([{ id: 5, title: 'Call ABC about quote', is_overdue: true, overdue_by: '1 day', due_date: '2026-09-27' }]);
  [completeTodo, createLeadActivity, scheduleLeadFollowUp, showToast].forEach((m) => m.mockReset());
  completeTodo.mockResolvedValue({ dsr_id: 77 });
  createLeadActivity.mockResolvedValue({});
  scheduleLeadFollowUp.mockResolvedValue({});
});

describe('role dashboards render with the new layout', () => {
  it('employee: hero actions, KPIs, follow-ups (overdue pulses), My To-Do', async () => {
    const { EmployeeDashboard } = await import('../../pages/dashboards/EmployeeDashboard');
    renderIt(<EmployeeDashboard data={data} />);
    expect(screen.getByText(/My Dashboard ·/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New Lead/ })).toHaveAttribute('href', '/leads/new');
    expect(screen.getByText('2 follow-ups due · 4 hot leads · 30 open leads')).toBeInTheDocument();
    expect(screen.getByText('My Leads')).toBeInTheDocument();
    expect(screen.getByText('Overdue Co')).toBeInTheDocument();
    expect(screen.getAllByText('1 overdue').length).toBeGreaterThan(0);
    expect(await screen.findByText('Call ABC about quote')).toBeInTheDocument();
  });

  it('region head, domain head and super admin render without crashing', async () => {
    const { RegionHeadDashboard } = await import('../../pages/dashboards/RegionHeadDashboard');
    const { DomainHeadDashboard } = await import('../../pages/dashboards/DomainHeadDashboard');
    const { SuperAdminDashboard } = await import('../../pages/dashboards/SuperAdminDashboard');
    for (const [Comp, name] of [
      [RegionHeadDashboard, 'Region Dashboard'],
      [DomainHeadDashboard, 'Domain Dashboard'],
      [SuperAdminDashboard, 'Marketing Overview'],
    ] as const) {
      const { unmount } = renderIt(<Comp data={data} />);
      expect(screen.getByText(new RegExp(`${name} ·`))).toBeInTheDocument();
      expect((await screen.findAllByText('Leads by Region')).length).toBe(2); // quick action + the card
      unmount();
    }
  });

  it('empty lists show an empty state, not a blank box', async () => {
    getTodos.mockResolvedValue([]);
    const { EmployeeDashboard } = await import('../../pages/dashboards/EmployeeDashboard');
    renderIt(<EmployeeDashboard data={{ ...data, follow_ups_due: [], recent_leads: [] }} />);
    expect(screen.getByText("Nothing due — you're all caught up")).toBeInTheDocument();
    expect(screen.getByText('No leads yet')).toBeInTheDocument();
    expect(await screen.findByText('No pending tasks')).toBeInTheDocument();
  });

  it('shows the new KPI set, target ring and won/lost card', async () => {
    const { EmployeeDashboard } = await import('../../pages/dashboards/EmployeeDashboard');
    renderIt(<EmployeeDashboard data={data} />);
    expect(screen.getByText('Open Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Quotes Sent This Month')).toBeInTheDocument();
    expect(screen.queryByText('Won This Month')).not.toBeInTheDocument(); // it's the ring's "Achieved" figure now
    expect(screen.getByText('Monthly Target')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument(); // 4L of 10L
    expect(screen.getByText('Won vs Lost')).toBeInTheDocument();
    expect(screen.getByText('My Leads by Stage')).toBeInTheDocument();
    await screen.findByText('Call ABC about quote');
  });

  it('follow-up row actions need edit_lead; Log call and Reschedule call the lead APIs and reload', async () => {
    const onRefresh = vi.fn();
    const { EmployeeDashboard } = await import('../../pages/dashboards/EmployeeDashboard');
    const { unmount } = renderIt(<EmployeeDashboard data={data} onRefresh={onRefresh} />);
    expect(screen.queryAllByRole('button', { name: 'Log call' })).toHaveLength(0);
    unmount();

    renderIt(<EmployeeDashboard data={data} onRefresh={onRefresh} />, ['marketing.edit_lead']);
    fireEvent.click(screen.getAllByRole('button', { name: 'Log call' })[0]);
    fireEvent.change(screen.getByPlaceholderText(/Asked for revised price/), { target: { value: 'Wants discount' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Log call' }).at(-1)!);
    await waitFor(() => expect(createLeadActivity).toHaveBeenCalledWith(1, { activity_type: 'call', title: 'Follow-up call', description: 'Wants discount' }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getAllByRole('button', { name: 'Reschedule' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Reschedule' }).at(-1)!);
    await waitFor(() => expect(scheduleLeadFollowUp).toHaveBeenCalledWith(1, expect.objectContaining({ follow_up_reminder_type: 'once' })));
  });

  it('My To-Do tick marks the task done after confirming', async () => {
    const { EmployeeDashboard } = await import('../../pages/dashboards/EmployeeDashboard');
    renderIt(<EmployeeDashboard data={data} />);
    await screen.findByText('Call ABC about quote');
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    // The confirmation popup adds a second "Mark done" button — confirm with it.
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Mark done' }).length).toBe(2));
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark done' }).at(-1)!);
    await waitFor(() => expect(completeTodo).toHaveBeenCalledWith('t', 5));
    await waitFor(() => expect(screen.queryByText('Call ABC about quote')).not.toBeInTheDocument());
  });
});
