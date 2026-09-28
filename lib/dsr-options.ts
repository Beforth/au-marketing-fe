/**
 * Fixed dropdown options for the HRMS DSR forms, copied from
 * docs/DSR_MODULE_INTEGRATION.md §9.3 ("Exact option lists for every fixed dropdown").
 * The option value is what HRMS saves, so keep the strings exactly as written there.
 */
import type { DSRType } from './hrms-rbac';

export const INDOOR_DEPARTMENTS = [
  'Marketing', 'Service', 'QC', 'QA', 'Design', 'Production', 'General', 'HR & Admin', 'IT', 'PLC', 'Other',
] as const;

const INDOOR_TASK_TYPES: Record<string, string[]> = {
  Marketing: ['Quotation', 'FAT', 'Calling', 'Documentation', 'Meeting', 'Other'],
  Service: [
    'Service Support', 'Software Installation', 'Software Support', 'Software Testing', 'PLC Support',
    'Documentation', 'Demo', 'Training Session', 'Verification', 'FAT', 'Internal Meeting',
    'Internal Audit', 'Meeting', 'Other',
  ],
  QC: ['Inward Testing', 'Machine Testing', 'FAT', 'Documentation', 'Testing', 'Meeting', 'Other'],
  QA: ['File Preparation', 'Engg Support', 'Other Documentation', 'SOP Preparation & Manual', 'FAT Support', 'Meeting'],
  Design: ['Design and Drawing', 'Meeting', 'Other'],
  Production: ['Work', 'Meeting', 'Other'],
  General: ['Interview', 'Training', 'Meeting', 'Other'],
  'HR & Admin': ['Interview', 'Onboarding', 'Other'],
  IT: ['Complaints', 'Installation', 'Support', 'Software OQ', 'Other'],
  PLC: ['Program Testing', 'Support', 'Complaint', 'Other'],
};

export const OUTDOOR_DEPARTMENTS = ['Marketing', 'Service', 'Other'] as const;

const OUTDOOR_TASK_TYPES: Record<string, string[]> = {
  Marketing: [
    'Planned Visit', 'Unplanned Visit', 'Follow up', 'Order Closing', 'Layout Check',
    'Cold Calling', 'Exhibition', 'Travelling', 'Other',
  ],
  Service: [
    'Installation', 'AMC / CAMC', 'Calibration & Validation', 'Complaint Resolution', 'Layout Check',
    'Migration', 'Software Work', 'PLC Work', 'Travelling', 'Demo', 'Customer Meeting', 'Audit Support', 'Other',
  ],
};

/** First entry is the HRMS default. */
export const VISIT_PLANS = ['Planned', 'Unplanned', 'Direct Visit'] as const;
export const REASONS_FOR_VISIT = [
  'First Visit', 'Inquiry Collection', 'Follow up', 'Casual Visit', 'Order Finalization',
  'Technical Discussions', 'Payment Follow up', 'Payment Collection', 'Any Issue/Escalation',
  'Upgradation Requirement', 'AMC Requirement', 'Other',
] as const;
export const APPOINTMENT_STATUSES = ['Appointment Confirmed', 'Direct Visit'] as const;
export const VISIT_STATUSES = ['Completed', 'Rescheduled', 'Cancelled'] as const;

/**
 * Task Type choices for a department.
 * - `null`  → department is "Other": Task Type is a free-text input (guide §9.3).
 * - `[]`    → no department picked yet.
 */
export function taskTypeOptions(kind: DSRType, department: string | undefined): string[] | null {
  if (!department) return [];
  if (department === 'Other') return null;
  const map = kind === 'indoor' ? INDOOR_TASK_TYPES : OUTDOOR_TASK_TYPES;
  return map[department] ?? [];
}

/** `['A','B']` → Select options. */
export const toOptions = (values: readonly string[]) => values.map(v => ({ value: v, label: v }));

/** Fixed label HRMS shows on the DSR create and history pages (hard-coded in its templates). */
export const DSR_FORMAT_LABEL = 'Format: DSR 2025-26';
