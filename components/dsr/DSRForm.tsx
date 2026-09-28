import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Clock, Phone, Sparkles } from 'lucide-react';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { hrmsRBACClient, DSRTask, DSRInput, DSRType } from '../../lib/hrms-rbac';
import { validateDSRInput, hoursBetween, hoursToWords } from '../../lib/dsr-helpers';
import {
  INDOOR_DEPARTMENTS, OUTDOOR_DEPARTMENTS, VISIT_PLANS, REASONS_FOR_VISIT,
  APPOINTMENT_STATUSES, VISIT_STATUSES, taskTypeOptions, toOptions,
} from '../../lib/dsr-options';
import { useEmployeeOptions } from './useEmployeeOptions';
import { useApp } from '../../App';
import { marketingAPI, MyLeadActivity } from '../../lib/marketing-api';
import { CreateDSRFromLeadsModal } from './CreateDSRFromLeadsModal';
import { localDayRange } from '../../lib/dsr-from-lead-logs';
import { useAppSelector } from '../../store/hooks';
import { selectHasPermission } from '../../store/slices/authSlice';

interface DSRFormProps {
  token: string;
  /** Which report type this form is for — set by the page's Indoor / Outdoor tabs. */
  dsrType: DSRType;
  /** Edit mode when set. */
  existing?: DSRTask | null;
  /** Show other employees in the Employee dropdown (guide §9.3: only with assign permission). */
  canAssign: boolean;
  /** Label for the "(Me)" option. */
  myName: string;
  onSaved: () => void;
}

/** Fields that must never be sent as "" — the server can 500 on them (guide §6). */
const NON_TEXT_FIELDS = new Set(['date', 'visited_date', 'next_follow_up', 'start_time', 'end_time', 'hours']);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Blank form, with the HRMS defaults for outdoor dropdowns (guide §9.3 option table). */
function blankForm(dsrType: DSRType): DSRInput {
  return dsrType === 'outdoor'
    ? { dsr_type: 'outdoor', date: today(), visit_plan: VISIT_PLANS[0], appointment_status: APPOINTMENT_STATUSES[0], visit_status: VISIT_STATUSES[0] }
    : { dsr_type: 'indoor', date: today() };
}

/** Build the form state from an existing report (edit) or blank (create). */
function initialState(existing: DSRTask | null | undefined, dsrType: DSRType): DSRInput {
  if (!existing) return blankForm(dsrType);
  const { id: _id, status: _status, current_level: _l, rejection_reason: _r, created_at: _c, updated_at: _u, completed_at: _ca, hours, ...rest } = existing;
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) if (v != null) clean[k] = v;
  return {
    ...(clean as Partial<DSRInput>),
    dsr_type: existing.dsr_type ?? dsrType,
    date: existing.date,
    hours: hours != null && hours !== '' ? Number(hours) : undefined,
  };
}

export const DSRForm: React.FC<DSRFormProps> = ({ token, dsrType, existing, canAssign, myName, onSaved }) => {
  const { showToast } = useApp();
  const isEdit = !!existing;
  const [form, setForm] = useState<DSRInput>(() => initialState(existing, dsrType));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  /** '' = me; otherwise the HRMS username the report is filed under. */
  const [assignee, setAssignee] = useState('');
  const [callingOpen, setCallingOpen] = useState(false);
  const employeeOptions = useEmployeeOptions(canAssign && !isEdit);
  const canViewLeads = useAppSelector(selectHasPermission('marketing.view_lead'));
  const [filling, setFilling] = useState(false);
  /** Logs + built fields shown in the "Create DSR from lead activity" confirm box. */
  const [leadPreview, setLeadPreview] = useState<{ date: string; logs: MyLeadActivity[] } | null>(null);

  const reset = () => {
    setForm(initialState(existing, dsrType));
    setAssignee('');
    setErrors({});
  };

  // Tab switch or a different record → start over.
  useEffect(reset, [existing, dsrType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calling details start collapsed, but open if the record already has some.
  useEffect(() => {
    setCallingOpen(!!(existing && (existing.contact_person || existing.contact_number || existing.mail_id || existing.call_for || existing.remarks || existing.next_follow_up)));
  }, [existing]);

  const set = <K extends keyof DSRInput>(key: K, value: DSRInput[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const kind = form.dsr_type;
  const departments = kind === 'indoor' ? INDOOR_DEPARTMENTS : OUTDOOR_DEPARTMENTS;
  const taskTypes = useMemo(() => taskTypeOptions(kind, form.department), [kind, form.department]);

  const text = (key: keyof DSRInput, label: string, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
    <Input
      label={label}
      value={(form[key] as string | undefined) ?? ''}
      onChange={e => set(key, e.target.value as never)}
      error={errors[key]}
      {...extra}
    />
  );

  const select = (key: keyof DSRInput, label: string, values: readonly string[], placeholder?: string) => (
    <Select
      label={label}
      options={toOptions(values)}
      value={(form[key] as string | undefined) ?? ''}
      onChange={v => set(key, (v ? String(v) : '') as never)}
      placeholder={placeholder ?? `-- Select ${label.replace(' *', '')} --`}
      error={errors[key]}
    />
  );

  const textarea = (key: keyof DSRInput, label: string, placeholder?: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-700 ml-0.5">{label}</label>
      <textarea
        rows={3}
        value={(form[key] as string | undefined) ?? ''}
        onChange={e => set(key, e.target.value as never)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
      {errors[key] && <p className="text-xs text-red-600">{errors[key]}</p>}
    </div>
  );

  const departmentField = (
    <Select
      label={kind === 'indoor' ? 'Department *' : 'Department'}
      options={toOptions(departments)}
      value={form.department ?? ''}
      // Task Type depends on Department, so clear it when the department changes.
      onChange={v => setForm(f => ({ ...f, department: v ? String(v) : '', task_type: '' }))}
      placeholder="-- Select Department --"
      error={errors.department}
    />
  );

  const taskTypeField = taskTypes === null
    ? text('task_type', kind === 'indoor' ? 'Task Type *' : 'Task Type', { placeholder: 'Type the task type' })
    : (
      <Select
        label={kind === 'indoor' ? 'Task Type *' : 'Task Type'}
        options={toOptions(taskTypes)}
        value={form.task_type ?? ''}
        onChange={v => set('task_type', v ? String(v) : '')}
        placeholder={form.department ? '-- Select Task Type --' : 'Select a department first'}
        disabled={!form.department}
        error={errors.task_type}
      />
    );

  /**
   * "Create DSR from lead activity": load the user's own lead logs on the form's date and show a
   * confirm box with one row per log (own Start/End Time) — Confirm creates one HRMS DSR per ticked
   * log; "Just fill the form" (one log ticked) copies it into this form for editing instead.
   * Only for your own report — the logs are yours, not the assignee's.
   */
  const openLeadActivity = async () => {
    if (!form.date) {
      showToast('Pick a date first', 'error');
      return;
    }
    setFilling(true);
    try {
      const { start, end } = localDayRange(form.date);
      const logs = await marketingAPI.getMyLeadActivities(start, end);
      if (!logs.length) {
        showToast('No lead activity on this date', 'info');
        return;
      }
      setLeadPreview({ date: form.date, logs });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not load lead activity', 'error');
    } finally {
      setFilling(false);
    }
  };

  const fillFormFrom = (filled: Partial<DSRInput>) => {
    setForm(f => ({
      ...f,
      department: filled.department,
      task_type: filled.task_type,
      title: filled.title,
      description: filled.description,
      start_time: filled.start_time ?? '',
      end_time: filled.end_time ?? '',
      contact_person: filled.contact_person ?? f.contact_person,
      contact_number: filled.contact_number ?? f.contact_number,
      mail_id: filled.mail_id ?? f.mail_id,
    }));
    setErrors({});
    if (filled.contact_person || filled.contact_number || filled.mail_id) setCallingOpen(true);
    setLeadPreview(null);
    showToast('Form filled from your lead logs — review and submit', 'success');
  };
  const showFillButton = kind === 'indoor' && !isEdit && !assignee && canViewLeads;

  // Live "Duration" preview under Start/End Time (guide §9.3) — same number that gets saved.
  const duration = hoursBetween(form.start_time, form.end_time);

  const handleSubmit = async () => {
    const errs = validateDSRInput(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (kind === 'indoor' && Object.keys(errs).some(k => ['contact_person', 'contact_number', 'mail_id', 'call_for', 'remarks', 'next_follow_up'].includes(k))) {
        setCallingOpen(true);
      }
      showToast('Please fix the highlighted fields', 'error');
      return;
    }
    setSaving(true);
    try {
      // Empty text fields are dropped on create, but sent on edit so a cleared field actually clears.
      const body = Object.fromEntries(
        Object.entries(form).filter(([k, v]) => {
          if (k === 'hours') return false; // derived from the times below, never typed
          if (v == null) return false;
          if (v !== '') return true;
          return isEdit && !NON_TEXT_FIELDS.has(k);
        })
      ) as DSRInput;
      // The API saves whatever `hours` it gets (default 8.0) and ignores the times, so compute it
      // here exactly like the HRMS web form does (guide §3.2). No times → leave it to HRMS's default.
      if (kind === 'indoor' && duration != null) body.hours = duration;
      if (isEdit && existing) {
        await hrmsRBACClient.updateDSR(token, existing.id, body);
        showToast('Report updated', 'success');
      } else if (assignee) {
        await hrmsRBACClient.createDSR(token, { ...body, username: assignee });
        const who = employeeOptions.find(o => o.value === assignee)?.label ?? assignee;
        showToast(`Report filed for ${who}`, 'success');
      } else {
        await hrmsRBACClient.createDSR(token, body);
        showToast('Report submitted for approval', 'success');
      }
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save report', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Always shown like HRMS ("<name> (Me)"); only people allowed to file for others can change it.
  const employeePicker = !isEdit && (
    <Select
      label="Employee"
      options={[{ value: '', label: `${myName} (Me)` }, ...(canAssign ? employeeOptions : [])]}
      value={assignee}
      onChange={v => setAssignee(v ? String(v) : '')}
      searchable={canAssign}
      disabled={!canAssign}
    />
  );

  const dateField = (
    <div>
      <DatePicker label="Date *" value={form.date} onChange={v => set('date', v || '')} />
      {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
    </div>
  );

  // Field order follows guide §9.3 "Field order, exact" — laid out left-to-right in rows.
  const row = (cols: 2 | 3 | 4) =>
    `grid grid-cols-1 sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : cols === 4 ? 'lg:grid-cols-4' : ''} gap-x-5 gap-y-5`;

  // [&_label]:block — DatePicker renders its label inline, which drops it a few px below the other labels in a row.
  return (
    <div className="space-y-6 [&_label]:block">
      {showFillButton && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
          <p className="text-sm text-slate-700">
            Worked on leads this day? Create this report from your lead logs for <span className="font-semibold">{form.date
              ? new Date(`${form.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'the selected date'}</span>.
          </p>
          <Button variant="outline" size="sm" onClick={openLeadActivity} disabled={filling} className="flex items-center gap-1.5 bg-white">
            <Sparkles size={14} className="text-blue-600" /> {filling ? 'Loading…' : 'Create DSR from lead activity'}
          </Button>
        </div>
      )}
      {leadPreview && (
        <CreateDSRFromLeadsModal
          isOpen
          onClose={() => setLeadPreview(null)}
          token={token}
          date={leadPreview.date}
          logs={leadPreview.logs}
          onCreated={() => { setLeadPreview(null); onSaved(); }}
          onFillForm={fillFormFrom}
        />
      )}

      {kind === 'indoor' ? (
        <>
          <div className={row(employeePicker ? 4 : 3)}>
            {employeePicker}
            {dateField}
            {departmentField}
            {taskTypeField}
          </div>
          {text('title', 'Task Title *', { maxLength: 255, placeholder: 'e.g. Prepared quotation for ABC Pharma' })}
          {textarea('description', 'Task Description / Details', 'Describe what was done, key outcomes, and any notes...')}
          {/* Guide row is Start / End / OT Minutes; OT is left out because the API can't carry it (guide §9.3 note B).
              Hours is not typed — it's computed from the two times (note C). */}
          <div>
            <div className={row(2)}>
              {text('start_time', 'Start Time', { type: 'time' })}
              {text('end_time', 'End Time', { type: 'time' })}
            </div>
            <p className="mt-2 ml-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={13} className="text-slate-400" />
              {duration != null ? (
                <>Duration: <span className="font-semibold text-slate-800">{hoursToWords(duration)}</span>
                  {form.end_time && form.start_time && form.end_time < form.start_time && <span className="text-slate-400">(overnight)</span>}
                </>
              ) : (
                isEdit && existing?.hours != null && existing.hours !== ''
                  ? <>Recorded: <span className="font-semibold text-slate-800">{hoursToWords(existing.hours)}</span> — enter start and end time to recalculate.</>
                  : <>Enter start and end time to calculate hours{!isEdit && ' — HRMS records 8 hours if left blank'}.</>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setCallingOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
              aria-expanded={callingOpen}
            >
              <span className="flex items-center gap-2"><Phone size={15} className="text-blue-600" /> Calling Details <span className="font-normal text-slate-400">(Optional)</span></span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${callingOpen ? 'rotate-180' : ''}`} />
            </button>
            {callingOpen && (
              <div className={`px-4 pb-5 pt-2 border-t border-slate-100 ${row(3)}`}>
                {text('contact_person', 'Contact Person')}
                {text('contact_number', 'Contact Number', { type: 'tel' })}
                {text('mail_id', 'Mail ID', { type: 'email' })}
                {text('call_for', 'Call For')}
                {text('remarks', 'Remarks')}
                <DatePicker label="Next Follow-up Date" value={form.next_follow_up ?? ''} onChange={v => set('next_follow_up', v || '')} />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={row(employeePicker ? 4 : 3)}>
            {employeePicker}
            {dateField}
            {select('visit_plan', 'Visit Plan', VISIT_PLANS)}
            {text('region', 'Region')}
          </div>
          <div className={row(3)}>
            {departmentField}
            {taskTypeField}
            {text('company_name', 'Company Name *')}
          </div>
          <div className={row(3)}>
            {text('contact_person', 'Contact Person')}
            {text('contact_number', 'Contact Number', { type: 'tel' })}
            {text('mail_id', 'Mail ID', { type: 'email' })}
          </div>
          <div className={row(4)}>
            {select('reason_for_visit', 'Reason for Visit', REASONS_FOR_VISIT)}
            {select('appointment_status', 'Appointment Status', APPOINTMENT_STATUSES)}
            {select('visit_status', 'Visit Status', VISIT_STATUSES)}
            <DatePicker label="Visited Date" value={form.visited_date ?? ''} onChange={v => set('visited_date', v || '')} />
          </div>
          {textarea('meeting_output', 'Meeting Output', 'What was discussed / decided...')}
          <div className={row(2)}>
            {text('next_action_needed', 'Next Action Needed')}
            {text('mail_status', 'Mail Status')}
          </div>
          <div className={row(2)}>
            {text('remarks', 'Remarks')}
            <DatePicker label="Next Follow-up Date" value={form.next_follow_up ?? ''} onChange={v => set('next_follow_up', v || '')} />
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <Button variant="outline" onClick={reset} disabled={saving}>Reset Form</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit'}
        </Button>
      </div>
    </div>
  );
};
