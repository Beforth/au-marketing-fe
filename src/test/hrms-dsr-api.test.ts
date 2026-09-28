import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hrmsRBACClient } from '../../lib/hrms-rbac';
import { API_CONFIG } from '../../lib/api';

const BASE = API_CONFIG.HRMS_RBAC_URL;

function mockFetch(body: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('HRMS DSR client', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('getDSR passes type and status query params', async () => {
    const fetchFn = mockFetch({ success: true, reports: [{ id: 1, date: '2026-09-23', title: 'x', status: 'pending_approval' }] });
    const rows = await hrmsRBACClient.getDSR('tok', { type: 'outdoor', status: 'pending_approval' });
    expect(rows).toHaveLength(1);
    const url = fetchFn.mock.calls[0][0] as string;
    expect(url).toContain(`${BASE}/dsr/?`);
    expect(url).toContain('type=outdoor');
    expect(url).toContain('status=pending_approval');
  });

  it('createDSR posts JSON with Token auth and returns the new id', async () => {
    const fetchFn = mockFetch({ success: true, dsr_id: 42 }, true, 201);
    const res = await hrmsRBACClient.createDSR('tok', { dsr_type: 'indoor', date: '2026-09-23', title: 'T', hours: 2 });
    expect(res).toEqual({ id: 42 });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE}/dsr/create/`);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Token tok');
    expect(JSON.parse(init.body)).toMatchObject({ dsr_type: 'indoor', title: 'T', hours: 2 });
  });

  it('createDSR passes username when assigning to another employee', async () => {
    const fetchFn = mockFetch({ success: true, dsr_id: 43 }, true, 201);
    await hrmsRBACClient.createDSR('tok', { dsr_type: 'outdoor', date: '2026-09-24', company_name: 'Acme', username: 'ravi' });
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toMatchObject({ username: 'ravi' });
  });

  it('updateDSR strips status from the body', async () => {
    const fetchFn = mockFetch({ success: true });
    await hrmsRBACClient.updateDSR('tok', 7, { title: 'New', status: 'approved' } as never);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE}/dsr/7/update/`);
    expect(JSON.parse(init.body)).toEqual({ title: 'New' });
  });

  it('deleteDSR throws the server error message on 403', async () => {
    mockFetch({ success: false, error: 'Only the owner can delete' }, false, 403);
    await expect(hrmsRBACClient.deleteDSR('tok', 7)).rejects.toThrow('Only the owner can delete');
  });

  it('mutations fall back to HTTP code when no message', async () => {
    mockFetch({}, false, 500);
    await expect(hrmsRBACClient.deleteDSR('tok', 7)).rejects.toThrow('HTTP 500');
  });

  it('createExpense never sends total', async () => {
    const fetchFn = mockFetch({ success: true, expense_id: 9 }, true, 201);
    const res = await hrmsRBACClient.createExpense('tok', { date: '2026-09-23', lodging: 500, total: 999 } as never);
    expect(res).toEqual({ id: 9 });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE}/expense/create/`);
    expect(JSON.parse(init.body)).toEqual({ date: '2026-09-23', lodging: 500 });
  });

  it('getExpenses accepts either "expenses" or "reports" array key', async () => {
    mockFetch({ success: true, expenses: [{ id: 1, date: '2026-09-23', total: 10, status: 'pending_approval' }] });
    expect(await hrmsRBACClient.getExpenses('tok')).toHaveLength(1);
    mockFetch({ success: true, reports: [{ id: 2, date: '2026-09-23', total: 10, status: 'approved' }] });
    expect(await hrmsRBACClient.getExpenses('tok')).toHaveLength(1);
  });

  it('getExpenses returns [] on failure', async () => {
    mockFetch({ success: false }, false, 403);
    expect(await hrmsRBACClient.getExpenses('tok')).toEqual([]);
  });

  it('approveDSR posts optional comments to /dsr/<id>/approve/', async () => {
    const fetchFn = mockFetch({ success: true, status: 'approved', current_level: 1 });
    const res = await hrmsRBACClient.approveDSR('tok', 42, 'Looks good');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE}/dsr/42/approve/`);
    expect(JSON.parse(init.body)).toEqual({ comments: 'Looks good' });
    expect(res.status).toBe('approved');
  });

  it('rejectDSR sends rejection_reason', async () => {
    const fetchFn = mockFetch({ success: true, status: 'rejected' });
    await hrmsRBACClient.rejectDSR('tok', 42, 'Missing task detail');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE}/dsr/42/reject/`);
    expect(JSON.parse(init.body)).toEqual({ rejection_reason: 'Missing task detail' });
  });

  it('approveExpense / rejectExpense hit the expense endpoints', async () => {
    const fetchFn = mockFetch({ success: true, status: 'approved' });
    await hrmsRBACClient.approveExpense('tok', 17);
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/expense/17/approve/`);
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({});
    const fetch2 = mockFetch({ success: true, status: 'rejected' });
    await hrmsRBACClient.rejectExpense('tok', 18, 'No receipts attached');
    expect(fetch2.mock.calls[0][0]).toBe(`${BASE}/expense/18/reject/`);
    expect(JSON.parse(fetch2.mock.calls[0][1].body)).toEqual({ rejection_reason: 'No receipts attached' });
  });

  it('approve surfaces the 400 message when report is not pending', async () => {
    mockFetch({ success: false, error: 'Report is not pending approval' }, false, 400);
    await expect(hrmsRBACClient.approveDSR('tok', 42)).rejects.toThrow('Report is not pending approval');
  });

  it('getPendingApprovals merges DSR + expense pending lists', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ success: true, count: 1, pending: [{ id: 42, dsr_type: 'indoor', date: '2026-09-24', employee: { id: 7, name: 'Ravi Kumar' }, title: 'T', current_level: 1 }] }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ success: true, count: 1, pending: [{ id: 17, date: '2026-09-23', employee: { id: 7, name: 'Ravi Kumar' }, tour_destination: 'Pune', total: 650, current_level: 1 }] }) });
    vi.stubGlobal('fetch', fetchFn);
    const res = await hrmsRBACClient.getPendingApprovals('tok');
    expect(fetchFn.mock.calls.map(c => c[0])).toEqual([`${BASE}/dsr/pending-approval/`, `${BASE}/expense/pending-approval/`]);
    expect(res.dsr).toHaveLength(1);
    expect(res.expense[0].tour_destination).toBe('Pune');
  });

  it('getPendingApprovals returns empty lists on failure (e.g. endpoint not deployed)', async () => {
    mockFetch({ detail: 'Not found' }, false, 404);
    expect(await hrmsRBACClient.getPendingApprovals('tok')).toEqual({ dsr: [], expense: [] });
  });

  it('createTodo sends employee_ids and deadline', async () => {
    const fetchFn = mockFetch({ success: true, count: 2, tasks: [{ id: 1 }, { id: 2 }] }, true, 201);
    const res = await hrmsRBACClient.createTodo('tok', { title: 'Call ABC', employee_ids: [7, 9], due_date: '2026-09-29', due_time: '18:00' });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE}/todo/create/`);
    expect(JSON.parse(init.body)).toEqual({ title: 'Call ABC', employee_ids: [7, 9], due_date: '2026-09-29', due_time: '18:00' });
    expect(res.count).toBe(2);
  });

  it('getTodos passes filters and accepts tasks/todos/items keys', async () => {
    const fetchFn = mockFetch({ success: true, tasks: [{ id: 1, title: 'x', status: 'pending' }] });
    const rows = await hrmsRBACClient.getTodos('tok', { username: 'ravi', status: 'pending' });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/todo/?username=ravi&status=pending`);
    expect(rows).toHaveLength(1);
    mockFetch({ success: true, todos: [{ id: 2 }] });
    expect(await hrmsRBACClient.getTodos('tok')).toHaveLength(1);
  });

  it('completeTodo returns the created dsr_id; update/delete hit their endpoints', async () => {
    const fetchFn = mockFetch({ success: true, dsr_id: 88 });
    expect(await hrmsRBACClient.completeTodo('tok', 5)).toEqual({ dsr_id: 88 });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/todo/5/complete/`);
    const f2 = mockFetch({ success: true });
    await hrmsRBACClient.updateTodo('tok', 5, { title: 'New', due_date: '' });
    expect(f2.mock.calls[0][0]).toBe(`${BASE}/todo/5/update/`);
    expect(JSON.parse(f2.mock.calls[0][1].body)).toEqual({ title: 'New', due_date: '' });
    const f3 = mockFetch({ success: true });
    await hrmsRBACClient.deleteTodo('tok', 5);
    expect(f3.mock.calls[0][0]).toBe(`${BASE}/todo/5/delete/`);
  });
});
