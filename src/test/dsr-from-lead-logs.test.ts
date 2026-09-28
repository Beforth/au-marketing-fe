import { describe, it, expect } from 'vitest';
import { buildDSRForLog, addMinutes, logTime, localDayRange, existingDSRsForLogs } from '../../lib/dsr-from-lead-logs';
import type { DSRTask } from '../../lib/hrms-rbac';
import type { MyLeadActivity } from '../../lib/marketing-api';

// Dates without a "Z" are parsed as local time, so these tests pass in any timezone.
const log = (over: Partial<MyLeadActivity>): MyLeadActivity => ({
  id: 1, lead_id: 1, activity_type: 'call', title: 'Discussed pricing',
  activity_date: '2026-09-24T10:00:00', lead_name: 'Ravi (L-1)', company_name: 'ABC Pharma',
  ...over,
});

describe('buildDSRForLog — one DSR per lead log', () => {
  it('maps the log type to a Marketing task type', () => {
    expect(buildDSRForLog(log({})).task_type).toBe('Calling');
    expect(buildDSRForLog(log({ activity_type: 'email' })).task_type).toBe('Calling');
    expect(buildDSRForLog(log({ activity_type: 'contacted_different_person' })).task_type).toBe('Calling');
    expect(buildDSRForLog(log({ activity_type: 'qtn_submitted' })).task_type).toBe('Quotation');
    expect(buildDSRForLog(log({ activity_type: 'meeting' })).task_type).toBe('Meeting');
    expect(buildDSRForLog(log({})).department).toBe('Marketing');
  });

  it('title = company — what was logged; description = the log text + type + contact', () => {
    const f = buildDSRForLog(log({ description: 'Asked for 5% discount on 2 units', contact_person_name: 'Ravi', contact_person_phone: '111' }));
    expect(f.title).toBe('ABC Pharma — Discussed pricing');
    expect(f.description).toBe('Call: Discussed pricing\nAsked for 5% discount on 2 units\nContact: Ravi, 111\nLead log #1');
  });

  it('description without notes or contact is just the logged line', () => {
    expect(buildDSRForLog(log({})).description).toBe('Call: Discussed pricing\nLead log #1');
  });

  it('copies the log contact into calling details', () => {
    const f = buildDSRForLog(log({ contact_person_name: 'Meena', contact_person_email: 'm@x.com', contact_person_phone: '222' }));
    expect(f).toMatchObject({ contact_person: 'Meena', mail_id: 'm@x.com', contact_number: '222' });
  });

  it('falls back to lead name when there is no company; title capped at 255', () => {
    expect(buildDSRForLog(log({ company_name: null })).title).toBe('Ravi (L-1) — Discussed pricing');
    expect(buildDSRForLog(log({ title: 'x'.repeat(400) })).title!.length).toBeLessThanOrEqual(255);
  });
});

describe('time helpers', () => {
  it('logTime reads local HH:MM', () => {
    expect(logTime('2026-09-24T09:05:00')).toBe('09:05');
  });
  it('addMinutes wraps past midnight', () => {
    expect(addMinutes('10:00', 30)).toBe('10:30');
    expect(addMinutes('23:45', 30)).toBe('00:15');
  });
  it('localDayRange returns local midnight to next local midnight', () => {
    const { start, end } = localDayRange('2026-09-24');
    expect(new Date(start).getTime()).toBe(new Date('2026-09-24T00:00:00').getTime());
    expect(new Date(end).getTime()).toBe(new Date('2026-09-25T00:00:00').getTime());
  });
});

describe('existingDSRsForLogs — duplicate protection', () => {
  const dsr = (over: Partial<DSRTask>): DSRTask => ({ id: 900, date: '2026-09-24', title: 'x', status: 'pending_approval', dsr_type: 'indoor', ...over } as DSRTask);
  const logs = [log({ id: 1 }), log({ id: 2, title: 'Quotation Q-12', company_name: 'XYZ Ltd' }), log({ id: 3, title: 'Follow up', company_name: 'PQR Labs' })];

  it('finds DSRs by their "Lead log #id" reference', () => {
    const m = existingDSRsForLogs(logs, [dsr({ id: 901, description: 'Call: Discussed pricing\nLead log #1' })]);
    expect(m.get(1)?.id).toBe(901);
    expect(m.has(2)).toBe(false);
  });

  it('does not confuse #1 with #12', () => {
    const m = existingDSRsForLogs([log({ id: 1 })], [dsr({ description: 'Lead log #12' })]);
    expect(m.has(1)).toBe(false);
  });

  it('matches older DSRs (no reference line) by title', () => {
    const m = existingDSRsForLogs(logs, [dsr({ id: 902, title: 'XYZ Ltd — Quotation Q-12', description: 'Quotation submitted: Quotation Q-12' })]);
    expect(m.get(2)?.id).toBe(902);
  });

  it('ignores rejected DSRs so the log can be created again', () => {
    const m = existingDSRsForLogs(logs, [dsr({ status: 'rejected', description: 'Lead log #1' })]);
    expect(m.has(1)).toBe(false);
  });

  it('ignores outdoor DSRs', () => {
    const m = existingDSRsForLogs(logs, [dsr({ dsr_type: 'outdoor', description: 'Lead log #1' })]);
    expect(m.has(1)).toBe(false);
  });
});
