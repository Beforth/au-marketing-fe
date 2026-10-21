import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { presenceCounts, presenceStatus } from '../../lib/presence-utils';

const pingPresence = vi.fn().mockResolvedValue(undefined);
const getActiveUsers = vi.fn().mockResolvedValue({ users: [] });
vi.mock('../../lib/marketing-api', async (orig) => ({
  ...(await orig<typeof import('../../lib/marketing-api')>()),
  marketingAPI: { pingPresence: (...a: unknown[]) => pingPresence(...a), getActiveUsers: (...a: unknown[]) => getActiveUsers(...a) },
}));

describe('status wording and counts', () => {
  it('active, idle and away get their own dot and text', () => {
    expect(presenceStatus({ seconds_ago: 3, idle_seconds: 3, status: 'active' })).toMatchObject({ key: 'active', dot: 'bg-emerald-500', text: 'Active now' });
    expect(presenceStatus({ seconds_ago: 3, idle_seconds: 600, status: 'idle' })).toMatchObject({ key: 'idle', dot: 'bg-amber-400', text: 'Idle 10m' });
    expect(presenceStatus({ seconds_ago: 3, idle_seconds: 7200, status: 'away' })).toMatchObject({ key: 'away', dot: 'bg-slate-300', text: 'Away 2h' });
  });
  it('an older server that sends no status counts everyone as active', () => {
    expect(presenceStatus({ seconds_ago: 4 })).toMatchObject({ key: 'active', dot: 'bg-emerald-500' });
    expect(presenceCounts([{}, { status: 'idle' }, { status: 'away' }, { status: 'away' }])).toEqual({ active: 1, idle: 1, away: 2 });
  });
});

describe('Live Activity cards', () => {
  class FakeSocket {
    static last: FakeSocket | null = null;
    onopen: (() => void) | null = null; onmessage: ((e: { data: string }) => void) | null = null; onclose: (() => void) | null = null; onerror: (() => void) | null = null;
    constructor(public url: string) { FakeSocket.last = this; }
    close() {}
  }
  beforeEach(() => { vi.stubGlobal('WebSocket', FakeSocket); });
  afterEach(() => vi.unstubAllGlobals());

  it('shows each person with their status and a summary of how many are active, idle and away', async () => {
    const { LiveActivityPage } = await import('../../pages/LiveActivityPage');
    render(<MemoryRouter><LiveActivityPage /></MemoryRouter>);
    await act(async () => { FakeSocket.last!.onopen?.(); });
    const u = (id: number, name: string, status: string, idle: number) => ({ employee_id: id, employee_name: name, page: '/leads', label: null, last_seen_at: 0, seconds_ago: 2, idle_seconds: idle, status });
    await act(async () => { FakeSocket.last!.onmessage?.({ data: JSON.stringify({ users: [u(1, 'Asha Rao', 'active', 3), u(2, 'Ravi K', 'idle', 600), u(3, 'Meena S', 'away', 3600)] }) }); });
    expect(screen.getByText('1 active')).toBeInTheDocument();
    expect(screen.getByText('1 idle · 1 away')).toBeInTheDocument();
    expect(screen.getByText('Idle 10m')).toBeInTheDocument();
    expect(screen.getByText('Away 1h')).toBeInTheDocument();
  });
});

describe('heartbeat reports real activity', () => {
  beforeEach(() => { vi.useFakeTimers(); pingPresence.mockClear(); });
  afterEach(() => vi.useRealTimers());

  it('sends how long ago the screen was used, and pings at once when the person comes back', async () => {
    const { usePresence } = await import('../../hooks/usePresence');
    renderHook(() => usePresence(), { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> });
    expect(pingPresence).toHaveBeenLastCalledWith('/', undefined, 0);   // first ping on load: just used it

    await act(async () => { vi.advanceTimersByTime(30_000); });         // 30s of nothing: the timed ping says so
    expect(pingPresence).toHaveBeenLastCalledWith('/', undefined, 30);

    await act(async () => { vi.advanceTimersByTime(300_000); });        // 5 more minutes untouched
    const calls = pingPresence.mock.calls.length;
    expect(pingPresence.mock.calls.at(-1)![2]).toBeGreaterThanOrEqual(300);

    await act(async () => { window.dispatchEvent(new Event('mousemove')); }); // back at the desk
    expect(pingPresence.mock.calls.length).toBe(calls + 1);              // pinged straight away
    expect(pingPresence.mock.calls.at(-1)![2]).toBe(0);                  // and now counts as active
  });
});
