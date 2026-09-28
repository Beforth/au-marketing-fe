import { describe, it, expect } from 'vitest';
import {
  isPendingDSR, isDoneDSR, dsrStatusGroup, dsrStatusLabel,
  getDSRPermissions, canModifyDSR, canModifyExpense,
  validateDSRInput, validateExpenseInput, expenseTotalPreview,
  matchesSearch, paginate, hoursBetween, hoursToWords, formatTimeRange,
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

  it('assigning a task (HRMS To-Do API) needs only dsr.assign_task (guide §9.3)', () => {
    expect(getDSRPermissions(['dsr.assign_task'], false).canAssign).toBe(true);
    expect(getDSRPermissions(['dsr.view_all'], false).canAssign).toBe(false);
  });

  it('filing a DSR for someone else on the normal form still needs assign_task AND view_all (guide §2)', () => {
    expect(getDSRPermissions(['dsr.assign_task'], false).canFileDSRForOthers).toBe(false);
    expect(getDSRPermissions(['dsr.assign_task', 'dsr.view_all'], false).canFileDSRForOthers).toBe(true);
  });

  it('approve/reject: dsr.view_all for DSR, expense_report.view_all for expenses (guide §3.5, §8.3)', () => {
    expect(getDSRPermissions(['dsr.view_all'], false).canApproveDSR).toBe(true);
    expect(getDSRPermissions(['dsr.indoor_view'], false).canApproveDSR).toBe(false);
    expect(getDSRPermissions(['expense_report.view_all'], false).canApproveExpense).toBe(true);
    expect(getDSRPermissions(['expense_report.view'], false).canApproveExpense).toBe(false);
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
    const base = { dsr_type: 'indoor' as const, date: '2026-09-23', title: 'x', department: 'Sales', task_type: 'Calling' };
    expect(validateDSRInput({ ...base, hours: 7.5 })).toEqual({});
  });

  it('indoor requires department and task type (HRMS form marks them required)', () => {
    const errs = validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'x' });
    expect(errs).toHaveProperty('department');
    expect(errs).toHaveProperty('task_type');
  });

  it('title max 255', () => {
    expect(validateDSRInput({ dsr_type: 'indoor', date: '2026-09-23', title: 'a'.repeat(256) })).toHaveProperty('title');
  });

  it('end time earlier than start is an overnight shift, not an error (guide §9.3 note C)', () => {
    const base = { dsr_type: 'indoor' as const, date: '2026-09-23', title: 'x', department: 'Sales', task_type: 'Calling' };
    expect(validateDSRInput({ ...base, start_time: '21:00', end_time: '02:00' })).toEqual({});
    expect(validateDSRInput({ ...base, start_time: '10:00', end_time: '10:00' })).toHaveProperty('end_time');
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

describe('history table helpers', () => {
  it('search matches any text field, case-insensitive; empty query matches all', () => {
    const row = { id: 1, title: 'Quotation for ABC Pharma', contact_person: 'Ravi', remarks: 'call back', hours: 2 };
    expect(matchesSearch(row, '')).toBe(true);
    expect(matchesSearch(row, 'abc pharma')).toBe(true);
    expect(matchesSearch(row, 'RAVI')).toBe(true);
    expect(matchesSearch(row, 'nobody')).toBe(false);
  });

  it('paginates 15 per page and clamps the page number', () => {
    const rows = Array.from({ length: 42 }, (_, i) => i);
    expect(paginate(rows, 1)).toMatchObject({ page: 1, pages: 3, from: 1, to: 15, total: 42 });
    expect(paginate(rows, 3).items).toEqual(rows.slice(30));
    expect(paginate(rows, 3)).toMatchObject({ from: 31, to: 42 });
    expect(paginate(rows, 99).page).toBe(3);
    expect(paginate([], 1)).toMatchObject({ page: 1, pages: 1, from: 0, to: 0, total: 0 });
  });
});

describe('hours from start/end time (guide §3.2, §9.3 note C)', () => {
  it('computes hours rounded to 0.1', () => {
    expect(hoursBetween('09:00', '17:30')).toBe(8.5);
    expect(hoursBetween('09:00', '09:20')).toBe(0.3);
    expect(hoursBetween('09:00:00', '10:00:00')).toBe(1);
  });

  it('treats end < start as an overnight shift', () => {
    expect(hoursBetween('21:00', '02:00')).toBe(5);
  });

  it('returns null when a time is missing or invalid', () => {
    expect(hoursBetween('', '17:00')).toBeNull();
    expect(hoursBetween('09:00', undefined)).toBeNull();
    expect(hoursBetween('9am', '17:00')).toBeNull();
  });

  it('spells hours as words', () => {
    expect(hoursToWords(8)).toBe('8 hours');
    expect(hoursToWords(1)).toBe('1 hour');
    expect(hoursToWords(0.5)).toBe('30 minutes');
    expect(hoursToWords(8.5)).toBe('8 hours 30 minutes');
    expect(hoursToWords(1.1)).toBe('1 hour 6 minutes');
    expect(hoursToWords('7.5')).toBe('7 hours 30 minutes');
    expect(hoursToWords(0)).toBe('0 minutes');
  });

  it('formats a time range as HH:MM - HH:MM', () => {
    expect(formatTimeRange('09:00:00', '17:30')).toBe('09:00 - 17:30');
    expect(formatTimeRange('09:00', null)).toBeNull();
  });
});
