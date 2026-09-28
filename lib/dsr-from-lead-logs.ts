/**
 * Turn lead logs into HRMS Indoor DSRs — one DSR per log — for the
 * "Create DSR from lead activity" button on the DSR form.
 */
import type { DSRInput, DSRTask } from './hrms-rbac';
import type { MyLeadActivity } from './marketing-api';

const TYPE_LABELS: Record<string, string> = {
  call: 'Call',
  contacted: 'Contacted',
  email: 'Email',
  meeting: 'Meeting',
  contacted_different_person: 'Contacted different person',
  qtn_submitted: 'Quotation submitted',
};

/** Lead-log type → HRMS Indoor "Marketing" task type (docs/DSR_MODULE_INTEGRATION.md §9.3 option list). */
const TASK_TYPE_FOR: Record<string, string> = {
  call: 'Calling',
  contacted: 'Calling',
  email: 'Calling',
  contacted_different_person: 'Calling',
  qtn_submitted: 'Quotation',
  meeting: 'Meeting',
};

const TITLE_MAX = 255;

/** Default length of one log's DSR when the user doesn't change End Time. */
export const DEFAULT_LOG_MINUTES = 30;

export const logTypeLabel = (type: string) => TYPE_LABELS[type] ?? type.replace(/_/g, ' ');

/** Local "HH:MM" of an ISO timestamp. */
export function logTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "HH:MM" + minutes, wrapping past midnight. */
export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Reference line saved at the end of a DSR created from a lead log. It's how we know later that
 * this log already has a DSR (stored in HRMS itself, so no extra database is needed, and a deleted
 * DSR frees the log again automatically).
 */
export const leadLogRef = (logId: number) => `Lead log #${logId}`;
const LEAD_LOG_REF_RE = /Lead log #(\d+)\b/g;
const HAS_LEAD_LOG_REF = /Lead log #\d+\b/;

export const logCompany = (l: MyLeadActivity) => (l.company_name || '').trim() || l.lead_name;

/** Local midnight → next local midnight for a "YYYY-MM-DD" date, as ISO strings (sent to the API). */
export function localDayRange(date: string): { start: string; end: string } {
  const [y, m, d] = date.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * DSR fields for one lead log (times are chosen per log in the confirm box, not here):
 * - Department "Marketing"; Task Type from the log type (Calling / Quotation / Meeting).
 * - Title "Company — what was logged"; Description = what was logged + the log's notes + contact,
 *   so DSR History's Task Details shows the actual log content.
 * - Calling Details from the log's contact.
 */
export function buildDSRForLog(l: MyLeadActivity): Partial<DSRInput> {
  let title = `${logCompany(l)} — ${l.title}`;
  if (title.length > TITLE_MAX) title = `${title.slice(0, TITLE_MAX - 1)}…`;

  const contact = [l.contact_person_name, l.contact_person_phone, l.contact_person_email].filter(Boolean).join(', ');
  const description = [
    `${logTypeLabel(l.activity_type)}: ${l.title}`,
    l.description?.trim() || null,
    contact ? `Contact: ${contact}` : null,
    leadLogRef(l.id),
  ].filter(Boolean).join('\n');

  return {
    department: 'Marketing',
    task_type: TASK_TYPE_FOR[l.activity_type] ?? 'Calling',
    title,
    description,
    contact_person: l.contact_person_name || undefined,
    contact_number: l.contact_person_phone || undefined,
    mail_id: l.contact_person_email || undefined,
  };
}

/**
 * Which of these logs already have a DSR among the user's existing DSRs for that day:
 * matched by the "Lead log #id" reference line, or — for DSRs created before that line existed —
 * by the exact title we would generate. Rejected DSRs and outdoor DSRs don't count, so a rejected
 * log can be submitted again. Returns log id → the existing DSR.
 */
export function existingDSRsForLogs(logs: MyLeadActivity[], dsrs: DSRTask[]): Map<number, DSRTask> {
  const live = dsrs.filter(d => d.status !== 'rejected' && (d.dsr_type ?? 'indoor') === 'indoor');
  const byRef = new Map<number, DSRTask>();
  for (const d of live) {
    for (const m of (d.description ?? '').matchAll(LEAD_LOG_REF_RE)) byRef.set(Number(m[1]), d);
  }
  const out = new Map<number, DSRTask>();
  for (const l of logs) {
    const hit = byRef.get(l.id)
      ?? live.find(d => !HAS_LEAD_LOG_REF.test(d.description ?? '') && d.title === buildDSRForLog(l).title);
    if (hit) out.set(l.id, hit);
  }
  return out;
}
