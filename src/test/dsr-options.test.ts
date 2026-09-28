import { describe, it, expect } from 'vitest';
import {
  INDOOR_DEPARTMENTS, OUTDOOR_DEPARTMENTS, VISIT_PLANS, REASONS_FOR_VISIT,
  APPOINTMENT_STATUSES, VISIT_STATUSES, taskTypeOptions,
} from '../../lib/dsr-options';

describe('DSR dropdown options (guide §9.3)', () => {
  it('has the exact department lists', () => {
    expect(INDOOR_DEPARTMENTS).toEqual(['Marketing', 'Service', 'QC', 'QA', 'Design', 'Production', 'General', 'HR & Admin', 'IT', 'PLC', 'Other']);
    expect(OUTDOOR_DEPARTMENTS).toEqual(['Marketing', 'Service', 'Other']);
  });

  it('task types depend on department', () => {
    expect(taskTypeOptions('indoor', 'Marketing')).toEqual(['Quotation', 'FAT', 'Calling', 'Documentation', 'Meeting', 'Other']);
    expect(taskTypeOptions('indoor', 'PLC')).toEqual(['Program Testing', 'Support', 'Complaint', 'Other']);
    expect(taskTypeOptions('outdoor', 'Marketing')?.[0]).toBe('Planned Visit');
    expect(taskTypeOptions('outdoor', 'Service')).toContain('AMC / CAMC');
  });

  it('"Other" department (or none picked) means free-text task type', () => {
    expect(taskTypeOptions('indoor', 'Other')).toBeNull();
    expect(taskTypeOptions('outdoor', 'Other')).toBeNull();
    expect(taskTypeOptions('indoor', '')).toEqual([]);
  });

  it('outdoor fixed lists, defaults first', () => {
    expect(VISIT_PLANS).toEqual(['Planned', 'Unplanned', 'Direct Visit']);
    expect(APPOINTMENT_STATUSES).toEqual(['Appointment Confirmed', 'Direct Visit']);
    expect(VISIT_STATUSES).toEqual(['Completed', 'Rescheduled', 'Cancelled']);
    expect(REASONS_FOR_VISIT).toHaveLength(12);
  });
});
