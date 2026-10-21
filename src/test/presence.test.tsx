import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'fs';
import { presencePageLabel, presenceDetailLabel } from '../../lib/presence-utils';

// ---- page names -------------------------------------------------------------------------------------------------
describe('presence page names', () => {
  it('every screen registered in App.tsx has a readable name (never the raw address)', () => {
    const app = readFileSync('App.tsx', 'utf8');
    const paths = [...app.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1]).filter((p) => !p.startsWith('/')); // skip /login, /login-redirect and the layout root "/"
    expect(paths.length).toBeGreaterThan(40);
    const unnamed = paths.map((p) => `/${p.replace(/:[A-Za-z]+/g, '1')}`).filter((url) => presencePageLabel(url) === 'On the app');
    expect(unnamed).toEqual([]);
  });

  it('names a few real examples, keeps the record label, and hides the query string', () => {
    expect(presencePageLabel('/service/work-orders')).toBe('Service · Work Orders');
    expect(presencePageLabel('/contacts/12/edit')).toBe('Editing Contact');
    expect(presencePageLabel('/leads?status_id=5&q=Acme')).toBe('Leads');
    expect(presencePageLabel('/something-new?q=secret')).toBe('On the app');
    expect(presenceDetailLabel('/leads/9/edit', 'Acme Corp')).toBe('Editing Lead — Acme Corp');
    expect(presencePageLabel('/')).toBe('Dashboard');
  });
});

// ---- live feed --------------------------------------------------------------------------------------------------
const getActiveUsers = vi.fn();
vi.mock('../../lib/marketing-api', async (orig) => ({
  ...(await orig<typeof import('../../lib/marketing-api')>()),
  marketingAPI: { getActiveUsers: (...a: unknown[]) => getActiveUsers(...a) },
}));

class FakeSocket {
  static last: FakeSocket | null = null;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) { FakeSocket.last = this; }
  close() { /* the hook closes on unmount */ }
}

describe('Live Activity page', () => {
  beforeEach(() => {
    getActiveUsers.mockReset();
    getActiveUsers.mockResolvedValue({ users: [] });
    FakeSocket.last = null;
    vi.stubGlobal('WebSocket', FakeSocket);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('shows people pushed over the live connection and does not poll the server', async () => {
    vi.useFakeTimers();
    const { LiveActivityPage } = await import('../../pages/LiveActivityPage');
    render(<MemoryRouter><LiveActivityPage /></MemoryRouter>);
    await act(async () => { FakeSocket.last!.onopen?.(); });
    await act(async () => {
      FakeSocket.last!.onmessage?.({ data: JSON.stringify({ users: [{ employee_id: 7, employee_name: 'Asha Rao', page: '/leads/9/edit', label: 'Acme', last_seen_at: 0, seconds_ago: 2 }] }) });
    });
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Editing Lead — Acme')).toBeInTheDocument();
    expect(screen.getByText(/Updates live/)).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(60_000); }); // a minute passes: no 5-second polling
    expect(getActiveUsers).not.toHaveBeenCalled();
  });

  it('falls back to checking every 15 seconds when the live connection closes', async () => {
    vi.useFakeTimers();
    const { LiveActivityPage } = await import('../../pages/LiveActivityPage');
    render(<MemoryRouter><LiveActivityPage /></MemoryRouter>);
    await act(async () => { FakeSocket.last!.onclose?.(); });
    expect(getActiveUsers).toHaveBeenCalledTimes(1);          // immediate check
    await act(async () => { vi.advanceTimersByTime(15_000); });
    expect(getActiveUsers).toHaveBeenCalledTimes(2);          // then every 15s, not every 5s
  });
});
