# DSR + Expense Report Full Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the view-only DSR page into a full integration: create/edit/delete Indoor & Outdoor DSRs, and a new Expense Report tab with list/create/edit/delete, all against the existing HRMS REST API.

**Architecture:** All calls go straight from the browser to HRMS (`lib/hrms-rbac.ts`, `Authorization: Token <token>`), same as the existing `getDSR`. Pure logic (status grouping, permission rules, validation, expense total) lives in a new `lib/dsr-helpers.ts` so it can be unit-tested. UI is two form modals + one expense panel under `components/dsr/`, wired into `pages/DSRPage.tsx`. No Marketing API / backend changes.

**Tech Stack:** React 19 + TypeScript, Vite, Vitest + jsdom, existing UI kit (`Modal`, `ConfirmModal`, `Input`, `Select`, `DatePicker`, `Button`, `SegmentToggle`, `Card`).

**Spec:** `docs/DSR_MODULE_INTEGRATION.md` (§0 checklist, §2 permissions, §3 DSR endpoints, §5 statuses, §6 gotchas, §8 Expense Report).

## Global Constraints

- Every HRMS call sends `Authorization: Token <token>` (token from `selectToken`). Base URL is `API_CONFIG.HRMS_RBAC_URL` (already `…/api/rbac`), reached via `this.baseURL` inside `HRMSRBACClient`.
- DSR endpoints: `GET /dsr/`, `POST /dsr/create/`, `POST /dsr/<id>/update/`, `POST /dsr/<id>/delete/`. Expense: `GET /expense/`, `POST /expense/create/`, `POST /expense/<id>/update/`, `POST /expense/<id>/delete/`. Use `POST` for update/delete (all are accepted; POST is simplest).
- Never send `status` in an update body. Never send `total` for expenses — the server computes it.
- Edit and Delete buttons show **only** for the viewer's own reports (`selectedEmployee` is empty = "My logs") **and** only while status is pending (`pending_approval` / `pending` / `draft`) **and** only if the user holds the matching permission code (or is superuser).
- Dates are sent as plain `YYYY-MM-DD`; times as `HH:MM`.
- `hours` must be `0 < hours <= 24` with at most 1 decimal; `title` ≤ 255 chars — enforced client-side because the server can 500 on bad values (§6).
- Out of scope: approve/reject (no API in the guide), creating a report for another employee (`dsr.view_all` vs `dsr.assign_task` mismatch, §2), 9am–7pm window (API doesn't enforce it; we don't either).
- Project rules (CLAUDE.md): no commits unless the user asks; update `CHANGES.md` in the same turn as the code; `npx tsc --noEmit` is the type check.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `lib/hrms-rbac.ts` | Modify | Types (`DSRStatus`, `DSRType`, `DSRTask`, `DSRInput`, `ExpenseReport`, `ExpenseInput`) + 7 new client methods + `type` param on `getDSR` |
| `lib/dsr-helpers.ts` | Create | Status grouping/labels, permission rules, form validation, expense total preview |
| `components/dsr/DSRFormModal.tsx` | Create | Create/edit form for Indoor + Outdoor DSR |
| `components/dsr/ExpenseFormModal.tsx` | Create | Create/edit form for Expense Report |
| `components/dsr/ExpenseReportsPanel.tsx` | Create | Expense tab: list + New/Edit/Delete |
| `pages/DSRPage.tsx` | Modify | New Report button, Edit/Delete per card, new status filter, Daily Report / Expense tabs |
| `components/ui/Navbar.tsx` | Modify | Count `pending_approval` as pending (uses helper) |
| `pages/MyTeamPage.tsx` | Modify | Same status fix as Navbar |
| `src/test/dsr-helpers.test.ts` | Create | Unit tests for helpers |
| `src/test/hrms-dsr-api.test.ts` | Create | Unit tests for new client methods (mocked `fetch`) |
| `CHANGES.md` | Modify | New revision under "DSR (Daily Status Reports)" |

---

### Task 1: HRMS client — types and CRUD methods

**Files:**
- Modify: `lib/hrms-rbac.ts:122-144` (types), `lib/hrms-rbac.ts:393-423` (`getDSR`), add methods before `logout`
- Test: `src/test/hrms-dsr-api.test.ts`

**Interfaces:**
- Produces:
  - `type DSRStatus = 'pending_approval' | 'approved' | 'rejected' | 'pending' | 'completed' | 'draft'`
  - `type DSRType = 'indoor' | 'outdoor'`
  - `interface DSRTask` (extended, see code)
  - `interface DSRInput` (create/update body)
  - `interface ExpenseReport`, `interface ExpenseInput`
  - `hrmsRBACClient.getDSR(token, { username?, date?, filter_date?, status?: DSRStatus, type?: DSRType }): Promise<DSRTask[]>`
  - `hrmsRBACClient.createDSR(token, input: DSRInput): Promise<{ id: number }>`
  - `hrmsRBACClient.updateDSR(token, id: number, input: Partial<DSRInput>): Promise<void>`
  - `hrmsRBACClient.deleteDSR(token, id: number): Promise<void>`
  - `hrmsRBACClient.getExpenses(token, { username?, date?, filter_date?, status? }): Promise<ExpenseReport[]>`
  - `hrmsRBACClient.createExpense(token, input: ExpenseInput): Promise<{ id: number }>`
  - `hrmsRBACClient.updateExpense(token, id: number, input: Partial<ExpenseInput>): Promise<void>`
  - `hrmsRBACClient.deleteExpense(token, id: number): Promise<void>`
  - All mutation methods **throw** `Error(message)` on failure (server `error`/`detail` text, or `HTTP <code>`), so the UI can toast it. `getDSR`/`getExpenses` keep the existing "return `[]` on failure" behavior.

- [ ] **Step 1: Write the failing tests**

Create `src/test/hrms-dsr-api.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/hrms-dsr-api.test.ts`
Expected: FAIL — `createDSR is not a function` (and type errors on `type`/`status` params).

- [ ] **Step 3: Replace the DSR types** at `lib/hrms-rbac.ts:122-131` (the `DSRTask` interface) with:

```ts
/** DSR status values from HRMS (DSR guide §5). `pending`/`completed` are legacy. */
export type DSRStatus = 'pending_approval' | 'approved' | 'rejected' | 'pending' | 'completed' | 'draft';
export type DSRType = 'indoor' | 'outdoor';

export interface DSRTask {
  id: number;
  date: string;
  title: string;
  description?: string;
  status: DSRStatus;
  dsr_type?: DSRType;
  current_level?: number | null;
  rejection_reason?: string | null;
  // Indoor
  department?: string;
  task_type?: string;
  hours?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  call_for?: string;
  // Outdoor
  company_name?: string;
  reason_for_visit?: string;
  region?: string;
  visit_plan?: string;
  appointment_status?: string;
  visit_status?: string;
  visited_date?: string | null;
  meeting_output?: string;
  next_action_needed?: string;
  mail_status?: string;
  // Shared
  contact_person?: string;
  contact_number?: string;
  mail_id?: string;
  remarks?: string;
  next_follow_up?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

/** Body for POST /dsr/create/ and /dsr/<id>/update/ (guide §3.2/§3.3). Never includes `status`. */
export interface DSRInput {
  dsr_type: DSRType;
  date: string;
  title?: string;
  description?: string;
  department?: string;
  task_type?: string;
  hours?: number;
  start_time?: string;
  end_time?: string;
  call_for?: string;
  company_name?: string;
  reason_for_visit?: string;
  region?: string;
  visit_plan?: string;
  appointment_status?: string;
  visit_status?: string;
  visited_date?: string;
  meeting_output?: string;
  next_action_needed?: string;
  mail_status?: string;
  contact_person?: string;
  contact_number?: string;
  mail_id?: string;
  remarks?: string;
  next_follow_up?: string;
}

/** The 7 expense amount fields (guide §8.2). Server sums them into `total`. */
export const EXPENSE_AMOUNT_FIELDS = [
  'travelling_bus',
  'travelling_shared_auto',
  'lodging',
  'day_allowance',
  'phone',
  'material_purchase',
  'cash_pay_to_other',
] as const;
export type ExpenseAmountField = typeof EXPENSE_AMOUNT_FIELDS[number];

export interface ExpenseReport extends Partial<Record<ExpenseAmountField, number | string>> {
  id: number;
  date: string;
  tour_destination?: string;
  description?: string;
  company_name?: string;
  total: number | string;
  status: DSRStatus;
  current_level?: number | null;
  rejection_reason?: string | null;
  created_at?: string;
}

/** Body for POST /expense/create/ and /expense/<id>/update/. Never includes `total` or `status`. */
export interface ExpenseInput extends Partial<Record<ExpenseAmountField, number>> {
  date: string;
  tour_destination?: string;
  description?: string;
  company_name?: string;
}
```

- [ ] **Step 4: Replace `getDSR`** (`lib/hrms-rbac.ts:393-423`) and add the new methods right after it, before `logout`:

```ts
  /**
   * Get DSR reports for a user (guide §3.1).
   * GET /api/rbac/dsr/ – without username, returns the authenticated user's reports.
   */
  async getDSR(
    token: string,
    params?: { username?: string; date?: string; filter_date?: string; status?: DSRStatus; type?: DSRType }
  ): Promise<DSRTask[]> {
    try {
      const query = new URLSearchParams();
      if (params?.username) query.set('username', params.username);
      if (params?.date) query.set('date', params.date);
      if (params?.filter_date) query.set('filter_date', params.filter_date);
      if (params?.status) query.set('status', params.status);
      if (params?.type) query.set('type', params.type);
      const qs = query.toString();
      const url = `${this.baseURL}/dsr/${qs ? '?' + qs : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) return [];
      return Array.isArray(data.reports) ? data.reports : [];
    } catch (error) {
      console.error('DSR fetch error:', error);
      return [];
    }
  }

  /**
   * POST a JSON body to an HRMS DSR/Expense mutation endpoint.
   * Throws Error(server message) on failure so callers can toast it.
   */
  private async postMutation(token: string, path: string, body?: object): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data: Record<string, unknown> = {};
    try {
      data = await response.json();
    } catch {
      // non-JSON error page (e.g. a 500 from bad input, guide §6)
    }
    if (!response.ok || data.success === false) {
      const msg = (data.error || data.detail || data.message) as string | undefined;
      throw new Error(msg || `HTTP ${response.status}`);
    }
    return data;
  }

  /** POST /api/rbac/dsr/create/ (guide §3.2). */
  async createDSR(token: string, input: DSRInput): Promise<{ id: number }> {
    const { status: _s, ...body } = input as DSRInput & { status?: unknown };
    const data = await this.postMutation(token, '/dsr/create/', body);
    return { id: Number(data.dsr_id ?? data.id) };
  }

  /** POST /api/rbac/dsr/<id>/update/ (guide §3.3). Only pending reports; status is never sent. */
  async updateDSR(token: string, id: number, input: Partial<DSRInput>): Promise<void> {
    const { status: _s, ...body } = input as Partial<DSRInput> & { status?: unknown };
    await this.postMutation(token, `/dsr/${id}/update/`, body);
  }

  /** POST /api/rbac/dsr/<id>/delete/ (guide §3.4). Also deletes approval history on the server. */
  async deleteDSR(token: string, id: number): Promise<void> {
    await this.postMutation(token, `/dsr/${id}/delete/`);
  }

  /** GET /api/rbac/expense/ (guide §8.3). Returns [] on failure, like getDSR. */
  async getExpenses(
    token: string,
    params?: { username?: string; date?: string; filter_date?: string; status?: DSRStatus }
  ): Promise<ExpenseReport[]> {
    try {
      const query = new URLSearchParams();
      if (params?.username) query.set('username', params.username);
      if (params?.date) query.set('date', params.date);
      if (params?.filter_date) query.set('filter_date', params.filter_date);
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      const response = await fetch(`${this.baseURL}/expense/${qs ? '?' + qs : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) return [];
      // Guide doesn't pin the array key; accept the likely names.
      const rows = data.expenses ?? data.reports ?? data.vouchers;
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error('Expense fetch error:', error);
      return [];
    }
  }

  /** POST /api/rbac/expense/create/ (guide §8.3). `total` is computed server-side and never sent. */
  async createExpense(token: string, input: ExpenseInput): Promise<{ id: number }> {
    const { total: _t, status: _s, ...body } = input as ExpenseInput & { total?: unknown; status?: unknown };
    const data = await this.postMutation(token, '/expense/create/', body);
    return { id: Number(data.expense_id ?? data.id) };
  }

  /** POST /api/rbac/expense/<id>/update/ (guide §8.3). Only pending_approval reports. */
  async updateExpense(token: string, id: number, input: Partial<ExpenseInput>): Promise<void> {
    const { total: _t, status: _s, ...body } = input as Partial<ExpenseInput> & { total?: unknown; status?: unknown };
    await this.postMutation(token, `/expense/${id}/update/`, body);
  }

  /** POST /api/rbac/expense/<id>/delete/ (guide §8.3). */
  async deleteExpense(token: string, id: number): Promise<void> {
    await this.postMutation(token, `/expense/${id}/delete/`);
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/test/hrms-dsr-api.test.ts`
Expected: 8 passed.

- [ ] **Step 6: Type check** — this will surface the `'pending' | 'completed'` comparisons in Navbar/MyTeam/DSRPage, which still compile (they're still members of `DSRStatus`). Fix only real errors in this task.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Verify the real response shape once** (the guide doesn't show list/expense response JSON). With the dev server running and logged in, open `/dsr`, then use `read_network_requests` (or DevTools → Network) to inspect the `dsr/?…` response. Confirm `reports[]` rows include `dsr_type` and `current_level`. Then call `GET <HRMS>/api/rbac/expense/` with the same header (copy as fetch from the DSR request, change the path) and note the array key. If it's not `expenses`/`reports`/`vouchers`, update the `rows` line in `getExpenses` and the test.

---

### Task 2: Pure helpers — status, permissions, validation

**Files:**
- Create: `lib/dsr-helpers.ts`
- Test: `src/test/dsr-helpers.test.ts`

**Interfaces:**
- Consumes: `DSRStatus`, `DSRType`, `DSRInput`, `ExpenseInput`, `EXPENSE_AMOUNT_FIELDS` from Task 1.
- Produces:
  - `isPendingDSR(status: string): boolean`
  - `isDoneDSR(status: string): boolean`
  - `type DSRStatusGroup = 'pending' | 'done' | 'rejected'`
  - `dsrStatusGroup(status: string): DSRStatusGroup`
  - `dsrStatusLabel(status: string, currentLevel?: number | null): string`
  - `interface DSRPermissions` + `getDSRPermissions(codes: string[], isSuperuser: boolean): DSRPermissions`
  - `canModifyDSR(action: 'edit' | 'delete', report: { status: string; dsr_type?: DSRType }, isOwn: boolean, perms: DSRPermissions): boolean`
  - `canModifyExpense(action: 'edit' | 'delete', report: { status: string }, isOwn: boolean, perms: DSRPermissions): boolean`
  - `validateDSRInput(input: DSRInput): Record<string, string>` (field → error; empty = valid)
  - `validateExpenseInput(input: ExpenseInput): Record<string, string>`
  - `expenseTotalPreview(input: Partial<ExpenseInput>): number`

- [ ] **Step 1: Write the failing tests**

Create `src/test/dsr-helpers.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  isPendingDSR, isDoneDSR, dsrStatusGroup, dsrStatusLabel,
  getDSRPermissions, canModifyDSR, canModifyExpense,
  validateDSRInput, validateExpenseInput, expenseTotalPreview,
} from '../../lib/dsr-helpers';

describe('status helpers', () => {
  it('groups statuses', () => {
    expect(isPendingDSR('pending_approval')).toBe(true);
    expect(isPendingDSR('pending')).toBe(true);
    expect(isPendingDSR('draft')).toBe(true);
    expect(isPendingDSR('approved')).toBe(false);
    expect(isDoneDSR('approved')).toBe(true);
    expect(isDoneDSR('completed')).toBe(true);
    expect(dsrStatusGroup('rejected')).toBe('rejected');
    expect(dsrStatusGroup('approved')).toBe('done');
    expect(dsrStatusGroup('pending_approval')).toBe('pending');
    expect(dsrStatusGroup('something_new')).toBe('pending');
  });

  it('labels statuses', () => {
    expect(dsrStatusLabel('pending_approval', 2)).toBe('Pending level 2 approval');
    expect(dsrStatusLabel('pending_approval')).toBe('Pending approval');
    expect(dsrStatusLabel('approved')).toBe('Approved');
    expect(dsrStatusLabel('rejected')).toBe('Rejected');
    expect(dsrStatusLabel('completed')).toBe('Completed');
    expect(dsrStatusLabel('pending')).toBe('Pending');
  });
});

describe('permissions', () => {
  it('maps codes; indoor_create also allows outdoor create (guide §2)', () => {
    const p = getDSRPermissions(['dsr.indoor_create'], false);
    expect(p.canCreateIndoor).toBe(true);
    expect(p.canCreateOutdoor).toBe(true);
    expect(p.canEditIndoor).toBe(false);
  });

  it('superuser gets everything', () => {
    const p = getDSRPermissions([], true);
    expect(Object.values(p).every(Boolean)).toBe(true);
  });

  it('expense view_all implies view', () => {
    expect(getDSRPermissions(['expense_report.view_all'], false).canViewExpense).toBe(true);
  });

  it('edit/delete need own + pending + matching type permission', () => {
    const p = getDSRPermissions(['dsr.outdoor_edit', 'dsr.outdoor_delete'], false);
    const outdoorPending = { status: 'pending_approval', dsr_type: 'outdoor' as const };
    expect(canModifyDSR('edit', outdoorPending, true, p)).toBe(true);
    expect(canModifyDSR('delete', outdoorPending, true, p)).toBe(true);
    expect(canModifyDSR('edit', outdoorPending, false, p)).toBe(false);            // not own
    expect(canModifyDSR('edit', { ...outdoorPending, status: 'approved' }, true, p)).toBe(false); // not pending
    expect(canModifyDSR('edit', { ...outdoorPending, dsr_type: 'indoor' }, true, p)).toBe(false); // wrong type
    expect(canModifyDSR('edit', { status: 'pending_approval' }, true, p)).toBe(false); // unknown type
  });

  it('expense edit/delete rules', () => {
    const p = getDSRPermissions(['expense_report.edit'], false);
    expect(canModifyExpense('edit', { status: 'pending_approval' }, true, p)).toBe(true);
    expect(canModifyExpense('delete', { status: 'pending_approval' }, true, p)).toBe(false);
    expect(canModifyExpense('edit', { status: 'approved' }, true, p)).toBe(false);
  });
});

describe('validation', () => {
  it('indoor requires title and sane hours', () => {
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23' })).toHaveProperty('title');
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'x', hours: -1 })).toHaveProperty('hours');
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'x', hours: 25 })).toHaveProperty('hours');
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'x', hours: 7.55 })).toHaveProperty('hours');
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'x', hours: 7.5 })).toEqual({});
  });

  it('title max 255', () => {
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'a'.repeat(256) })).toHaveProperty('title');
  });

  it('end time must be after start time', () => {
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'x', start_time: '10:00', end_time: '09:00' })).toHaveProperty('end_time');
  });

  it('outdoor requires company name', () => {
    expect(validateDSRInput({ dsr_type: 'outdoor', date: '2026-09-23' })).toHaveProperty('company_name');
    expect(validateDSRInput({ dsr_type: 'outdoor', date: '2026-09-23', company_name: 'Acme' })).toEqual({});
  });

  it('date is required and must be YYYY-MM-DD', () => {
    expect(validateDSRInput({ dsr_type: 'outdoor', date: '', company_name: 'A' })).toHaveProperty('date');
    expect(validateExpenseInput({ date: '23/09/2026' })).toHaveProperty('date');
  });

  it('expense amounts must be >= 0', () => {
    expect(validateExpenseInput({ date: '2026-09-23', lodging: -5 })).toHaveProperty('lodging');
    expect(validateExpenseInput({ date: '2026-09-23', lodging: 5 })).toEqual({});
  });

  it('expense total preview sums the 7 fields', () => {
    expect(expenseTotalPreview({ travelling_bus: 100, lodging: 500, day_allowance: 300 })).toBe(900);
    expect(expenseTotalPreview({})).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/dsr-helpers.test.ts`
Expected: FAIL — cannot resolve `../../lib/dsr-helpers`.

- [ ] **Step 3: Implement** — create `lib/dsr-helpers.ts`:

```ts
/**
 * Pure rules for the HRMS DSR + Expense Report integration
 * (see docs/DSR_MODULE_INTEGRATION.md §2, §5, §6, §8).
 */
import {
  EXPENSE_AMOUNT_FIELDS,
  type DSRInput,
  type DSRType,
  type ExpenseInput,
} from './hrms-rbac';

const PENDING = ['pending_approval', 'pending', 'draft'];
const DONE = ['approved', 'completed'];

export const isPendingDSR = (status: string) => PENDING.includes(status);
export const isDoneDSR = (status: string) => DONE.includes(status);

export type DSRStatusGroup = 'pending' | 'done' | 'rejected';

/** Unknown statuses fall into 'pending' so they stay visible rather than disappearing. */
export function dsrStatusGroup(status: string): DSRStatusGroup {
  if (status === 'rejected') return 'rejected';
  if (isDoneDSR(status)) return 'done';
  return 'pending';
}

export function dsrStatusLabel(status: string, currentLevel?: number | null): string {
  switch (status) {
    case 'pending_approval':
      return currentLevel ? `Pending level ${currentLevel} approval` : 'Pending approval';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'completed': return 'Completed';
    case 'draft': return 'Draft';
    default: return 'Pending';
  }
}

export interface DSRPermissions {
  canCreateIndoor: boolean;
  canCreateOutdoor: boolean;
  canEditIndoor: boolean;
  canEditOutdoor: boolean;
  canDeleteIndoor: boolean;
  canDeleteOutdoor: boolean;
  canViewExpense: boolean;
  canCreateExpense: boolean;
  canEditExpense: boolean;
  canDeleteExpense: boolean;
}

export function getDSRPermissions(codes: string[], isSuperuser: boolean): DSRPermissions {
  const has = (code: string) => isSuperuser || codes.includes(code);
  return {
    canCreateIndoor: has('dsr.indoor_create'),
    // Guide §2: outdoor_create OR indoor_create allows outdoor creation.
    canCreateOutdoor: has('dsr.outdoor_create') || has('dsr.indoor_create'),
    canEditIndoor: has('dsr.indoor_edit'),
    canEditOutdoor: has('dsr.outdoor_edit'),
    canDeleteIndoor: has('dsr.indoor_delete'),
    canDeleteOutdoor: has('dsr.outdoor_delete'),
    canViewExpense: has('expense_report.view') || has('expense_report.view_all'),
    canCreateExpense: has('expense_report.create'),
    canEditExpense: has('expense_report.edit'),
    canDeleteExpense: has('expense_report.delete'),
  };
}

/**
 * Server allows edit only on own + pending reports (§2). We also limit delete to
 * own + pending in the UI so approved history isn't removed by accident.
 */
export function canModifyDSR(
  action: 'edit' | 'delete',
  report: { status: string; dsr_type?: DSRType },
  isOwn: boolean,
  perms: DSRPermissions,
): boolean {
  if (!isOwn || !isPendingDSR(report.status) || !report.dsr_type) return false;
  if (action === 'edit') return report.dsr_type === 'indoor' ? perms.canEditIndoor : perms.canEditOutdoor;
  return report.dsr_type === 'indoor' ? perms.canDeleteIndoor : perms.canDeleteOutdoor;
}

export function canModifyExpense(
  action: 'edit' | 'delete',
  report: { status: string },
  isOwn: boolean,
  perms: DSRPermissions,
): boolean {
  if (!isOwn || !isPendingDSR(report.status)) return false;
  return action === 'edit' ? perms.canEditExpense : perms.canDeleteExpense;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Client-side checks — the server can 500 on bad hours/times (§6). */
export function validateDSRInput(input: DSRInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.date || !DATE_RE.test(input.date)) errors.date = 'Pick a date';
  if (input.dsr_type === 'indoor') {
    if (!input.title?.trim()) errors.title = 'Title is required';
    if (input.hours != null) {
      if (!(input.hours > 0 && input.hours <= 24)) errors.hours = 'Hours must be between 0 and 24';
      else if (Math.round(input.hours * 10) !== input.hours * 10) errors.hours = 'Use at most one decimal (e.g. 7.5)';
    }
    if (input.start_time && input.end_time && input.end_time <= input.start_time) {
      errors.end_time = 'End time must be after start time';
    }
  } else {
    if (!input.company_name?.trim()) errors.company_name = 'Company name is required';
    if (input.visited_date && !DATE_RE.test(input.visited_date)) errors.visited_date = 'Invalid date';
  }
  if (input.title && input.title.length > 255) errors.title = 'Title must be 255 characters or less';
  return errors;
}

export function validateExpenseInput(input: ExpenseInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.date || !DATE_RE.test(input.date)) errors.date = 'Pick a date';
  for (const field of EXPENSE_AMOUNT_FIELDS) {
    const v = input[field];
    if (v != null && (Number.isNaN(v) || v < 0)) errors[field] = 'Must be 0 or more';
  }
  return errors;
}

/** Display-only preview; the server computes the real total (§8.2). */
export function expenseTotalPreview(input: Partial<ExpenseInput>): number {
  return EXPENSE_AMOUNT_FIELDS.reduce((sum, f) => sum + (Number(input[f]) || 0), 0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/test/dsr-helpers.test.ts`
Expected: all passed.

---

### Task 3: Fix pending/done counting in Navbar and My Team

New reports come back as `pending_approval`/`approved`, which the old `=== 'pending'` / `=== 'completed'` checks miss — so the bell badge and My Team DSR list would show 0 for every new report.

**Files:**
- Modify: `components/ui/Navbar.tsx:213,215,243,248,256,261`
- Modify: `pages/MyTeamPage.tsx:1247,1253,1263,1269`

**Interfaces:**
- Consumes: `isPendingDSR`, `isDoneDSR` from `lib/dsr-helpers.ts`.

- [ ] **Step 1: Navbar** — add `import { isPendingDSR, isDoneDSR } from '../../lib/dsr-helpers';` next to the other `lib` imports, then replace every
  - `dsrTasks.filter(t => t.status === 'pending')` → `dsrTasks.filter(t => isPendingDSR(t.status))`
  - `dsrTasks.filter(t => t.status === 'completed')` → `dsrTasks.filter(t => isDoneDSR(t.status))`

- [ ] **Step 2: MyTeamPage** — add `import { isPendingDSR, isDoneDSR } from '../lib/dsr-helpers';` and make the same two replacements at lines 1247, 1253, 1263, 1269.

- [ ] **Step 3: Verify nothing else compares DSR status to literals**

Run: `grep -rn "status === 'pending'\|status === 'completed'" components/ui/Navbar.tsx pages/MyTeamPage.tsx`
Expected: no DSR matches (MyTeamPage may have unrelated matches on other entities — leave those).

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 4: DSR create/edit form modal

**Files:**
- Create: `components/dsr/DSRFormModal.tsx`

**Interfaces:**
- Consumes: `hrmsRBACClient.createDSR/updateDSR`, `DSRTask`, `DSRInput`, `DSRType` (Task 1); `validateDSRInput`, `DSRPermissions` (Task 2); `Modal`, `Input`, `Select`, `DatePicker`, `Button`, `SegmentToggle`.
- Produces: `<DSRFormModal isOpen onClose onSaved existing? perms token />`
  - `existing?: DSRTask` — when set, edit mode (type locked to `existing.dsr_type`).
  - `onSaved: () => void` — parent refetches.

- [ ] **Step 1: Create the component**

```tsx
import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { SegmentToggle } from '../ui/SegmentToggle';
import { hrmsRBACClient, DSRTask, DSRInput, DSRType } from '../../lib/hrms-rbac';
import { validateDSRInput, DSRPermissions } from '../../lib/dsr-helpers';
import { useApp } from '../../App';

interface DSRFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
  perms: DSRPermissions;
  existing?: DSRTask | null;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Build the form state from an existing report (edit) or blank (create). */
function initialState(existing: DSRTask | null | undefined, defaultType: DSRType): DSRInput {
  if (!existing) return { dsr_type: defaultType, date: today() };
  const { id: _id, status: _status, current_level: _l, rejection_reason: _r, created_at: _c, updated_at: _u, completed_at: _ca, hours, ...rest } = existing;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) if (v != null) clean[k] = v;
  return {
    ...(clean as Partial<DSRInput>),
    dsr_type: existing.dsr_type ?? defaultType,
    date: existing.date,
    hours: hours != null && hours !== '' ? Number(hours) : undefined,
  };
}

export const DSRFormModal: React.FC<DSRFormModalProps> = ({ isOpen, onClose, onSaved, token, perms, existing }) => {
  const { showToast } = useApp();
  const defaultType: DSRType = perms.canCreateIndoor ? 'indoor' : 'outdoor';
  const [form, setForm] = useState<DSRInput>(() => initialState(existing, defaultType));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!existing;

  useEffect(() => {
    if (isOpen) {
      setForm(initialState(existing, defaultType));
      setErrors({});
    }
  }, [isOpen, existing, defaultType]);

  const set = <K extends keyof DSRInput>(key: K, value: DSRInput[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const text = (key: keyof DSRInput, label: string, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
    <Input
      label={label}
      value={(form[key] as string | undefined) ?? ''}
      onChange={e => set(key, e.target.value as never)}
      error={errors[key]}
      inputSize="sm"
      {...extra}
    />
  );

  const typeOptions = [
    ...(perms.canCreateIndoor ? [{ label: 'Indoor', value: 'indoor' as DSRType }] : []),
    ...(perms.canCreateOutdoor ? [{ label: 'Outdoor', value: 'outdoor' as DSRType }] : []),
  ];

  const handleSave = async () => {
    const errs = validateDSRInput(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      // Drop empty strings so we don't overwrite fields with "" or send bad dates.
      const body = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v != null)
      ) as DSRInput;
      if (isEdit && existing) {
        await hrmsRBACClient.updateDSR(token, existing.id, body);
        showToast('Report updated', 'success');
      } else {
        await hrmsRBACClient.createDSR(token, body);
        showToast('Report submitted for approval', 'success');
      }
      onSaved();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save report', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Daily Report' : 'New Daily Report'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Submit'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {!isEdit && typeOptions.length > 1 && (
          <SegmentToggle options={typeOptions} value={form.dsr_type} onChange={v => set('dsr_type', v)} />
        )}
        <DatePicker label="Date" value={form.date} onChange={v => set('date', v || '')} inputSize="sm" />
        {errors.date && <p className="text-xs text-red-600 -mt-3">{errors.date}</p>}

        {form.dsr_type === 'indoor' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">{text('title', 'Title *', { maxLength: 255 })}</div>
            <div className="sm:col-span-2">{text('description', 'Description')}</div>
            {text('department', 'Department')}
            {text('task_type', 'Task type')}
            <Input
              label="Hours"
              type="number"
              step="0.5"
              min={0}
              max={24}
              value={form.hours ?? ''}
              onChange={e => set('hours', e.target.value === '' ? undefined : Number(e.target.value))}
              error={errors.hours}
              inputSize="sm"
            />
            {text('call_for', 'Call for')}
            {text('start_time', 'Start time', { type: 'time' })}
            {text('end_time', 'End time', { type: 'time' })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">{text('company_name', 'Company name *')}</div>
            {text('reason_for_visit', 'Reason for visit')}
            {text('region', 'Region')}
            {text('visit_plan', 'Visit plan')}
            {text('appointment_status', 'Appointment status')}
            {text('visit_status', 'Visit status')}
            <DatePicker label="Visited date" value={form.visited_date ?? ''} onChange={v => set('visited_date', v || '')} inputSize="sm" />
            <div className="sm:col-span-2">{text('meeting_output', 'Meeting output')}</div>
            {text('next_action_needed', 'Next action needed')}
            {text('mail_status', 'Mail status')}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {text('contact_person', 'Contact person')}
          {text('contact_number', 'Contact number', { type: 'tel' })}
          {text('mail_id', 'Email', { type: 'email' })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {text('remarks', 'Remarks')}
          <DatePicker label="Next follow-up" value={form.next_follow_up ?? ''} onChange={v => set('next_follow_up', v || '')} inputSize="sm" />
        </div>
      </div>
    </Modal>
  );
};
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors. (`DatePicker` without `showTime` returns plain `YYYY-MM-DD` — `components/ui/DatePicker.tsx:8,194-205`.)

---

### Task 5: Wire DSR create/edit/delete + new statuses into DSRPage

**Files:**
- Modify: `pages/DSRPage.tsx`

**Interfaces:**
- Consumes: `DSRFormModal` (Task 4); `getDSRPermissions`, `canModifyDSR`, `dsrStatusGroup`, `dsrStatusLabel`, `DSRStatusGroup` (Task 2); `hrmsRBACClient.deleteDSR` (Task 1); `ConfirmModal`; `selectPermissions`, `selectUser`.

- [ ] **Step 1: Imports** — at the top of `pages/DSRPage.tsx`:

```tsx
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DSRFormModal } from '../components/dsr/DSRFormModal';
import { getDSRPermissions, canModifyDSR, dsrStatusGroup, dsrStatusLabel, DSRStatusGroup } from '../lib/dsr-helpers';
import { selectHasPermission, selectToken, selectPermissions, selectUser } from '../store/slices/authSlice';
```
(replace the existing `authSlice` import line) and add `Plus, Pencil, Trash2, XCircle` to the `lucide-react` import.

- [ ] **Step 2: State + permissions** — replace line 57 (`statusFilter` state) with:

```tsx
  const [statusFilter, setStatusFilter] = useState<'all' | DSRStatusGroup>('all');
  const permissionCodes = useAppSelector(selectPermissions);
  const currentUser = useAppSelector(selectUser);
  const dsrPerms = useMemo(
    () => getDSRPermissions(permissionCodes, !!currentUser?.is_superuser),
    [permissionCodes, currentUser]
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DSRTask | null>(null);
  const [deleting, setDeleting] = useState<DSRTask | null>(null);
```

And after `selectedEmployee` is defined (after line 79):

```tsx
  // Edit/Delete only on your own reports (guide §2) — i.e. when viewing "My logs".
  const viewingOwn = !selectedEmployee;
```

- [ ] **Step 3: Grouping** — replace lines 155-161 with:

```tsx
  const filteredDSR = useMemo(() => {
    if (statusFilter === 'all') return dsrTasks;
    return dsrTasks.filter(t => dsrStatusGroup(t.status) === statusFilter);
  }, [dsrTasks, statusFilter]);

  const pendingTasks = filteredDSR.filter(t => dsrStatusGroup(t.status) === 'pending');
  const completedTasks = filteredDSR.filter(t => dsrStatusGroup(t.status) === 'done');
  const rejectedTasks = filteredDSR.filter(t => dsrStatusGroup(t.status) === 'rejected');

  const handleDelete = async () => {
    if (!deleting || !token) return;
    try {
      await hrmsRBACClient.deleteDSR(token, deleting.id);
      showToast('Report deleted', 'success');
      fetchDSR();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete report', 'error');
    } finally {
      setDeleting(null);
    }
  };
```

- [ ] **Step 4: Status filter buttons** — replace lines 209-218 with:

```tsx
              {(['all', 'pending', 'done', 'rejected'] as const).map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s === 'pending' ? 'Pending' : s === 'done' ? 'Approved' : 'Rejected'}
                </Button>
              ))}
```

Rename the "Completed" KPI card label (line 276) to `Approved`.

- [ ] **Step 5: New Report button** — pass it through the DSR `Card`'s existing `headerAction` prop (`components/ui/Card.tsx:11`) at line 314:

```tsx
      <Card
        title="DSR Tasks"
        description={/* unchanged */}
        className="mb-6"
        headerAction={
          viewingOwn && (dsrPerms.canCreateIndoor || dsrPerms.canCreateOutdoor) ? (
            <Button size="sm" className="flex items-center gap-1.5" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus size={13} /> New Report
            </Button>
          ) : undefined
        }
      >
```

- [ ] **Step 6: Task card with type, status and actions** — add this component above `export const DSRPage` and use it for pending, completed and rejected lists (replacing the three inline `<div key={task.id} …>` blocks at lines 335-341 and 351-357):

```tsx
const DSRTaskCard: React.FC<{
  task: DSRTask;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ task, canEdit, canDelete, onEdit, onDelete }) => {
  const group = dsrStatusGroup(task.status);
  const heading = task.title || task.company_name || `Report #${task.id}`;
  const badge =
    group === 'done' ? 'bg-emerald-50 text-emerald-700'
    : group === 'rejected' ? 'bg-red-50 text-red-700'
    : 'bg-amber-50 text-amber-700';
  return (
    <div className="border border-slate-200 rounded-lg p-3 flex gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800">{heading}</p>
          {task.dsr_type && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{task.dsr_type}</span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>
            {dsrStatusLabel(task.status, task.current_level)}
          </span>
        </div>
        {(task.description || task.meeting_output) && (
          <p className="text-xs text-slate-500 mt-1">{task.description || task.meeting_output}</p>
        )}
        {group === 'rejected' && task.rejection_reason && (
          <p className="text-xs text-red-600 mt-1">Reason: {task.rejection_reason}</p>
        )}
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <Calendar size={11} /> {task.date}
          {task.hours != null && task.hours !== '' && <span className="ml-2">{task.hours} h</span>}
        </p>
      </div>
      {(canEdit || canDelete) && (
        <div className="flex items-start gap-1 shrink-0">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit report"><Pencil size={14} /></Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete report"><Trash2 size={14} className="text-red-500" /></Button>
          )}
        </div>
      )}
    </div>
  );
};
```

Render call (same for each list):

```tsx
<DSRTaskCard
  key={task.id}
  task={task}
  canEdit={canModifyDSR('edit', task, viewingOwn, dsrPerms)}
  canDelete={canModifyDSR('delete', task, viewingOwn, dsrPerms)}
  onEdit={() => { setEditing(task); setFormOpen(true); }}
  onDelete={() => setDeleting(task)}
/>
```

Rename the "Completed" list heading to `Approved`, and add a third block after it for `rejectedTasks` with heading `Rejected ({rejectedTasks.length})` in `text-red-600`. Remove the old `line-through` styling (approved ≠ struck out). (`ghost` is an existing Button variant — `components/ui/Button.tsx:18`.)

- [ ] **Step 7: Mount the modals** — just before `</PageLayout>`:

```tsx
      {token && (
        <DSRFormModal
          isOpen={formOpen}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSaved={fetchDSR}
          token={token}
          perms={dsrPerms}
          existing={editing}
        />
      )}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete report?"
        message="This permanently deletes the report and its approval history in HRMS."
        confirmLabel="Delete"
        variant="danger"
      />
```

- [ ] **Step 8: Page text** — change the `PageLayout` `description` (line 175) to `"Submit and track daily reports, plus recent leads and orders."`

- [ ] **Step 9: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Browser check** — `preview_start {name: "au-marketing-fe"}`, log in, open `/dsr`:
  1. "New Report" visible (as a user with `dsr.*_create`). Submit an Indoor report with title + 7.5 hours → toast "Report submitted for approval", card appears under Pending with "Pending level 1 approval".
  2. Try hours `-1` → inline error, no request sent (check Network tab).
  3. Edit that report → form pre-filled → change title → saved.
  4. Delete it → confirm dialog → gone.
  5. Pick another employee in the Employee dropdown → no New/Edit/Delete buttons.
  6. Console: no errors. Navbar DSR badge counts the new pending report.

---

### Task 6: Expense Report form modal

**Files:**
- Create: `components/dsr/ExpenseFormModal.tsx`

**Interfaces:**
- Consumes: `hrmsRBACClient.createExpense/updateExpense`, `ExpenseReport`, `ExpenseInput`, `EXPENSE_AMOUNT_FIELDS`, `ExpenseAmountField` (Task 1); `validateExpenseInput`, `expenseTotalPreview` (Task 2).
- Produces: `<ExpenseFormModal isOpen onClose onSaved token existing? />`

- [ ] **Step 1: Create the component**

```tsx
import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import {
  hrmsRBACClient, ExpenseReport, ExpenseInput, EXPENSE_AMOUNT_FIELDS, ExpenseAmountField,
} from '../../lib/hrms-rbac';
import { validateExpenseInput, expenseTotalPreview } from '../../lib/dsr-helpers';
import { useApp } from '../../App';

const AMOUNT_LABELS: Record<ExpenseAmountField, string> = {
  travelling_bus: 'Bus / train',
  travelling_shared_auto: 'Shared auto',
  lodging: 'Lodging',
  day_allowance: 'Day allowance',
  phone: 'Phone',
  material_purchase: 'Material purchase',
  cash_pay_to_other: 'Cash paid to others',
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function initialState(existing?: ExpenseReport | null): ExpenseInput {
  if (!existing) return { date: today() };
  const out: ExpenseInput = {
    date: existing.date,
    tour_destination: existing.tour_destination ?? '',
    description: existing.description ?? '',
    company_name: existing.company_name ?? '',
  };
  for (const f of EXPENSE_AMOUNT_FIELDS) {
    const v = existing[f];
    if (v != null && v !== '') out[f] = Number(v);
  }
  return out;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string;
  existing?: ExpenseReport | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSaved, token, existing }) => {
  const { showToast } = useApp();
  const [form, setForm] = useState<ExpenseInput>(() => initialState(existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!existing;

  useEffect(() => {
    if (isOpen) {
      setForm(initialState(existing));
      setErrors({});
    }
  }, [isOpen, existing]);

  const handleSave = async () => {
    const errs = validateExpenseInput(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (isEdit && existing) {
        await hrmsRBACClient.updateExpense(token, existing.id, form);
        showToast('Expense updated', 'success');
      } else {
        await hrmsRBACClient.createExpense(token, form);
        showToast('Expense submitted for approval', 'success');
      }
      onSaved();
      onClose();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Expense Report' : 'New Expense Report'}
      footer={
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            Total: <span className="font-bold text-slate-900">₹{expenseTotalPreview(form).toLocaleString('en-IN')}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Submit'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <DatePicker label="Date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v || '' }))} inputSize="sm" />
            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
          </div>
          <Input label="Tour destination" value={form.tour_destination ?? ''} onChange={e => setForm(f => ({ ...f, tour_destination: e.target.value }))} inputSize="sm" />
          <Input label="Company name" value={form.company_name ?? ''} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} inputSize="sm" />
          <Input label="Description" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} inputSize="sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {EXPENSE_AMOUNT_FIELDS.map(field => (
            <Input
              key={field}
              label={`${AMOUNT_LABELS[field]} (₹)`}
              type="number"
              min={0}
              step="1"
              value={form[field] ?? ''}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value === '' ? undefined : Number(e.target.value) }))}
              error={errors[field]}
              inputSize="sm"
            />
          ))}
        </div>
        <p className="text-[11px] text-slate-400">The final total is calculated by HRMS.</p>
      </div>
    </Modal>
  );
};
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 7: Expense tab on the DSR page

**Files:**
- Create: `components/dsr/ExpenseReportsPanel.tsx`
- Modify: `pages/DSRPage.tsx`

**Interfaces:**
- Consumes: `hrmsRBACClient.getExpenses/deleteExpense` (Task 1); `canModifyExpense`, `dsrStatusGroup`, `dsrStatusLabel`, `DSRPermissions` (Task 2); `ExpenseFormModal` (Task 6).
- Produces: `<ExpenseReportsPanel token perms filterDate username? viewingOwn />`

- [ ] **Step 1: Create the panel**

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { hrmsRBACClient, ExpenseReport } from '../../lib/hrms-rbac';
import { canModifyExpense, dsrStatusGroup, dsrStatusLabel, DSRPermissions } from '../../lib/dsr-helpers';
import { ExpenseFormModal } from './ExpenseFormModal';
import { useApp } from '../../App';
import { Calendar, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';

interface ExpenseReportsPanelProps {
  token: string;
  perms: DSRPermissions;
  /** YYYY-MM-DD, same filter the DSR list uses (HRMS filters by a single date). */
  filterDate?: string;
  /** HRMS username when viewing another employee; undefined = self. */
  username?: string;
  viewingOwn: boolean;
}

export const ExpenseReportsPanel: React.FC<ExpenseReportsPanelProps> = ({ token, perms, filterDate, username, viewingOwn }) => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseReport | null>(null);
  const [deleting, setDeleting] = useState<ExpenseReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await hrmsRBACClient.getExpenses(token, { filter_date: filterDate || undefined, username }));
    } finally {
      setLoading(false);
    }
  }, [token, filterDate, username]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await hrmsRBACClient.deleteExpense(token, deleting.id);
      showToast('Expense deleted', 'success');
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete expense', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const grandTotal = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);

  return (
    <Card
      title="Expense Reports"
      description={`${rows.length} report${rows.length !== 1 ? 's' : ''} · ₹${grandTotal.toLocaleString('en-IN')} total`}
      className="mb-6"
      headerAction={
        viewingOwn && perms.canCreateExpense ? (
          <Button size="sm" className="flex items-center gap-1.5" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={13} /> New Expense
          </Button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-500 justify-center">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
          <Receipt size={32} />
          <p className="text-sm">No expense reports for this period.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(r => {
            const group = dsrStatusGroup(r.status);
            const badge =
              group === 'done' ? 'bg-emerald-50 text-emerald-700'
              : group === 'rejected' ? 'bg-red-50 text-red-700'
              : 'bg-amber-50 text-amber-700';
            const canEdit = canModifyExpense('edit', r, viewingOwn, perms);
            const canDelete = canModifyExpense('delete', r, viewingOwn, perms);
            return (
              <div key={r.id} className="border border-slate-200 rounded-lg p-3 flex gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{r.tour_destination || r.company_name || `Expense #${r.id}`}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                      {dsrStatusLabel(r.status, r.current_level)}
                    </span>
                  </div>
                  {r.description && <p className="text-xs text-slate-500 mt-1">{r.description}</p>}
                  {group === 'rejected' && r.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {r.rejection_reason}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar size={11} /> {r.date}
                  </p>
                </div>
                <div className="flex items-start gap-2 shrink-0">
                  <span className="text-sm font-bold text-emerald-600">₹{(Number(r.total) || 0).toLocaleString('en-IN')}</span>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }} aria-label="Edit expense"><Pencil size={14} /></Button>
                  )}
                  {canDelete && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(r)} aria-label="Delete expense"><Trash2 size={14} className="text-red-500" /></Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ExpenseFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSaved={load}
        token={token}
        existing={editing}
      />
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete expense report?"
        message="This permanently deletes the expense report and its approval history in HRMS."
        confirmLabel="Delete"
        variant="danger"
      />
    </Card>
  );
};
```

- [ ] **Step 2: Tabs on DSRPage** — in `pages/DSRPage.tsx`:
  - Import `SegmentToggle` from `../components/ui/SegmentToggle` and `ExpenseReportsPanel` from `../components/dsr/ExpenseReportsPanel`.
  - Add state: `const [reportTab, setReportTab] = useState<'dsr' | 'expense'>('dsr');`
  - Directly above the `{/* ── DSR Tasks ── */}` card, render the toggle only if the user can see expenses:

```tsx
      {dsrPerms.canViewExpense && (
        <div className="mb-4">
          <SegmentToggle
            options={[{ label: 'Daily Reports', value: 'dsr' as const }, { label: 'Expenses', value: 'expense' as const }]}
            value={reportTab}
            onChange={setReportTab}
          />
        </div>
      )}
```

  - Wrap the existing DSR Tasks `<Card>` in `{reportTab === 'dsr' && ( … )}` and add after it:

```tsx
      {reportTab === 'expense' && token && (
        <ExpenseReportsPanel
          token={token}
          perms={dsrPerms}
          filterDate={dateFrom || undefined}
          username={selectedEmployee?.username || undefined}
          viewingOwn={viewingOwn}
        />
      )}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Browser check** — on `/dsr` as a user with `expense_report.view/create/edit`:
  1. "Expenses" tab visible; switch to it.
  2. New Expense → enter Lodging 500, Day allowance 300 → footer shows ₹800 → Submit → row appears with ₹800 from the server and "Pending level 1 approval".
  3. Enter −5 in any amount → inline error, no request.
  4. Edit → change lodging → total updates after save.
  5. Delete button only appears if user has `expense_report.delete`.
  6. As a user without any `expense_report.*` code → no tab shown.

---

### Task 8: Full test run + CHANGES.md

**Files:**
- Modify: `CHANGES.md` (index line for DSR + new Rev 2 at top of `## DSR (Daily Status Reports)` section)

- [ ] **Step 1: Run the whole suite and type check**

Run: `npm run test:run`
Expected: all tests pass (setup + dsr-helpers + hrms-dsr-api).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Update CHANGES.md** — change the index line to `- [DSR (Daily Status Reports)](#dsr-daily-status-reports) — rev 1.2.7, 1.4.17` and insert at the top of the DSR section (above `### Rev 1 — 2026-08-13 (v1.2.7)`):

```markdown
### Rev 2 — 2026-09-23 (v1.4.2) — [Revision]
- **Full HRMS DSR integration** (per `docs/DSR_MODULE_INTEGRATION.md` §0): the DSR page was view-only; it now supports creating, editing and deleting Indoor and Outdoor reports directly against the HRMS API. Edit/Delete show only on your own reports that are still pending approval, and only if you hold the matching `dsr.*_edit` / `dsr.*_delete` permission.
- **Expense Reports tab**: new tab on the DSR page (shown with `expense_report.view`/`view_all`) to list, submit, edit and delete daily expense reports; total is calculated by HRMS.
- **Approval statuses**: reports now show "Pending level N approval" / "Approved" / "Rejected" (with reason) instead of the old pending/completed pair. The Navbar DSR badge and My Team DSR list now count `pending_approval` reports as pending (they previously showed 0 for every new-style report).
- Not included: approve/reject (no HRMS API), submitting on behalf of another employee.
- Files: `lib/hrms-rbac.ts`, `lib/dsr-helpers.ts`, `components/dsr/DSRFormModal.tsx`, `components/dsr/ExpenseFormModal.tsx`, `components/dsr/ExpenseReportsPanel.tsx`, `pages/DSRPage.tsx`, `components/ui/Navbar.tsx`, `pages/MyTeamPage.tsx`, `src/test/dsr-helpers.test.ts`, `src/test/hrms-dsr-api.test.ts`
```

- [ ] **Step 3: Hand back to user** — summarize what was built, the browser checks done, and ask whether to (a) commit, (b) add a `CHANGELOG.md` entry (both root and `au-marketing-api/` copies, plus `package.json` + `Sidebar.tsx` version bump to v1.4.2). Do neither without a yes.

---

## Self-Review Notes

- **Spec §0 coverage:** DSR create (Task 4/5), list (existing + Task 1 type/status params), update (Task 4/5), delete (Task 5); Expense create (Task 6/7), list (Task 7), update (Task 6/7), delete (Task 7). ✅
- **§2 permissions:** mapped in `getDSRPermissions`, including the `indoor_create → outdoor` rule; ownership enforced via `viewingOwn`. ✅
- **§3.3 no `status` in update / §8 no `total`:** stripped in client methods, tested. ✅
- **§5 statuses:** `DSRStatus` + `dsrStatusLabel`, including `current_level`. ✅
- **§6 thin validation:** `validateDSRInput` / `validateExpenseInput`. ✅
- **Known unknowns:** exact JSON shape of list rows and the expense list key — Task 1 Step 7 checks them against the live API before UI work.
