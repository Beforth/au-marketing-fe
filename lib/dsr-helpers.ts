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
  /** Assign a To-Do task to other employees ("Assign DSR Task"). */
  canAssign: boolean;
  /** Employee picker on the Indoor/Outdoor form (file a DSR under someone else's name). The DSR
   *  create API still checks dsr.view_all for this (guide §2 "Known inconsistency"), so require both. */
  canFileDSRForOthers: boolean;
  /** List other employees' To-Do tasks ("Tasks I assigned"). */
  canViewOthersTodos: boolean;
  /** See every employee's DSRs (Employee filter on the history page). */
  canViewAllDSR: boolean;
  /** Approve/Reject DSRs. The API also lets a report's own current approver do it, but the
   *  list response doesn't say who that is, so the UI can only go by permission. */
  canApproveDSR: boolean;
  canViewExpense: boolean;
  canCreateExpense: boolean;
  canEditExpense: boolean;
  canDeleteExpense: boolean;
  canViewAllExpense: boolean;
  canApproveExpense: boolean;
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
    // "Assign DSR Task" creates an HRMS To-Do (POST /todo/create/), which checks only
    // dsr.assign_task (guide §9.3, changed 2026-09-28 — it no longer creates a DSR directly).
    canAssign: has('dsr.assign_task'),
    canFileDSRForOthers: has('dsr.assign_task') && has('dsr.view_all'),
    canViewOthersTodos: has('dsr.assign_task') || has('dsr.view_all'),
    canViewAllDSR: has('dsr.view_all'),
    canApproveDSR: has('dsr.view_all'),
    canViewExpense: has('expense_report.view') || has('expense_report.view_all'),
    canCreateExpense: has('expense_report.create'),
    canEditExpense: has('expense_report.edit'),
    canDeleteExpense: has('expense_report.delete'),
    canViewAllExpense: has('expense_report.view_all'),
    canApproveExpense: has('expense_report.view_all'),
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
    if (!input.department?.trim()) errors.department = 'Department is required';
    if (!input.task_type?.trim()) errors.task_type = 'Task type is required';
    if (input.hours != null) {
      if (!(input.hours > 0 && input.hours <= 24)) errors.hours = 'Hours must be between 0 and 24';
      else if (Math.round(input.hours * 10) !== input.hours * 10) errors.hours = 'Use at most one decimal (e.g. 7.5)';
    }
    // End < Start is an overnight shift (guide §9.3 note C); only identical times are invalid.
    if (input.start_time && input.end_time && hoursBetween(input.start_time, input.end_time) === 0) {
      errors.end_time = 'End time must differ from start time';
    }
  } else {
    // Guide §9.3: an outdoor entry needs a Company Name OR a Reason for Visit (at least one)
    if (!input.company_name?.trim() && !input.reason_for_visit?.trim()) errors.company_name = 'Enter a company name or pick a reason for the visit';
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

/** History-page search (guide §9.4 "Search tasks, person, remarks..."): any string field contains the query. */
export function matchesSearch(row: object, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return Object.values(row).some(v => typeof v === 'string' && v.toLowerCase().includes(q));
}

export const HISTORY_PAGE_SIZE = 15;

/** Client-side paging (the HRMS list endpoints aren't paginated, guide §6). `page` is clamped. */
export function paginate<T>(rows: T[], page: number, size = HISTORY_PAGE_SIZE) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * size;
  const items = rows.slice(start, start + size);
  return { items, page: p, pages, total, from: total ? start + 1 : 0, to: start + items.length };
}

const TIME_RE = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

function minutesOfDay(t: string | null | undefined): number | null {
  const m = t ? TIME_RE.exec(t.trim()) : null;
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/**
 * Hours between two "HH:MM" times, rounded to 0.1 — the same rule as HRMS's web form
 * (guide §3.2 / §9.3 note C): End earlier than Start is an overnight shift (+24h).
 * The API does NOT compute this itself, so we send the result as `hours`.
 */
export function hoursBetween(start: string | null | undefined, end: string | null | undefined): number | null {
  const s = minutesOfDay(start);
  const e = minutesOfDay(end);
  if (s == null || e == null) return null;
  const diff = e >= s ? e - s : e + 24 * 60 - s;
  return Math.round((diff / 60) * 10) / 10;
}

/** 8.5 → "8 hours 30 minutes", 1 → "1 hour", 0.5 → "30 minutes" (guide §9.4 Hours cell). */
export function hoursToWords(hours: number | string | null | undefined): string {
  const total = Math.round((Number(hours) || 0) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m || !h) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  return parts.join(' ');
}

/** "09:00:00", "17:30" → "09:00 - 17:30"; null unless both times are valid. */
export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string | null {
  const s = minutesOfDay(start);
  const e = minutesOfDay(end);
  if (s == null || e == null) return null;
  const fmt = (x: number) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
  return `${fmt(s)} - ${fmt(e)}`;
}

/** Fired (window event) after an approve/reject so the sidebar's "pending for me" badge refreshes. */
export const DSR_PENDING_CHANGED_EVENT = 'dsr:pending-changed';
