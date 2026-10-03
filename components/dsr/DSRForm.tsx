import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Clock, Phone, Sparkles } from 'lucide-react';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { hrmsRBACClient, DSRTask, DSRInput, DSRType } from '../../lib/hrms-rbac';
import { validateDSRInput, hoursBetween, hoursToWords, formatTimeRange } from '../../lib/dsr-helpers';
import { EntryRows } from './EntryRows';
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
  // Create: a list of entries saved together (one HRMS DSR each). Edit: always exactly one.
  const [rows, setRows] = useState<DSRInput[]>(() => [initialState(existing, dsrType)]);
  /** Index of the open entry; -1 = all folded. */
  const [active, setActive] = useState(0);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  /** '' = me; otherwise the HRMS username the report is filed under. */
  const [assignee, setAssignee] = useState('');
  const [callingOpen, setCallingOpen] = useState<Set<number>>(new Set());
  const employeeOptions = useEmployeeOptions(canAssign && !isEdit);
  const canViewLeads = useAppSelector(selectHasPermission('marketing.view_lead'));
  const [filling, setFilling] = useState(false);
  /** Logs + built fields shown in the "Create DSR from lead activity" confirm box. */
  const [leadPreview, setLeadPreview] = useState<{ date: string; logs: MyLeadActivity[] } | null>(null);

  const kind = rows[0]?.dsr_type ?? dsrType;
  const sharedDate = rows[0]?.date ?? today();
  const entryWord = kind === 'indoor' ? 'Task' : 'Visit';

  const reset = () => {
    setRows([initialState(existing, dsrType)]);
    setActive(0);
    setAssignee('');
    setErrors({});
  };

  // Tab switch or a different record → start over.
  useEffect(reset, [existing, dsrType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calling details start collapsed, but open if the record already has some.
  useEffect(() => {
    setCallingOpen(existing && (existing.contact_person || existing.contact_number || existing.mail_id || existing.call_for || existing.remarks || existing.next_follow_up) ? new Set([0]) : new Set());
  }, [existing]);

  const setRow = (i: number, patch: Partial<DSRInput>) => setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const setSharedDate = (v: string) => setRows(rs => rs.map(r => ({ ...r, date: v })));
  const toggleCalling = (i: number) => setCallingOpen(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  const text = (i: number, key: keyof DSRInput, label: string, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
    <Input
      label={label}
      value={(rows[i][key] as string | undefined) ?? ''}
      onChange={e => setRow(i, { [key]: e.target.value } as Partial<DSRInput>)}
      error={errors[i]?.[key]}
      {...extra}
    />
  );

  const select = (i: number, key: keyof DSRInput, label: string, values: readonly string[], placeholder?: string) => (
    <Select
      label={label}
      options={toOptions(values)}
      value={(rows[i][key] as string | undefined) ?? ''}
      onChange={v => setRow(i, { [key]: v ? String(v) : '' } as Partial<DSRInput>)}
      placeholder={placeholder ?? `-- Select ${label.replace(' *', '')} --`}
      error={errors[i]?.[key]}
    />
  );

  const textarea = (i: number, key: keyof DSRInput, label: string, placeholder?: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-700 ml-0.5">{label}</label>
      <textarea
        rows={3}
        value={(rows[i][key] as string | undefined) ?? ''}
        onChange={e => setRow(i, { [key]: e.target.value } as Partial<DSRInput>)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
      {errors[i]?.[key] && <p className="text-xs text-red-600">{errors[i][key]}</p>}
    </div>
  );

  const departmentField = (i: number) => (
    <Select
      label={kind === 'indoor' ? 'Department *' : 'Department'}
      options={toOptions(kind === 'indoor' ? INDOOR_DEPARTMENTS : OUTDOOR_DEPARTMENTS)}
      value={rows[i].department ?? ''}
      // Task Type depends on Department, so clear it when the department changes.
      onChange={v => setRow(i, { department: v ? String(v) : '', task_type: '' })}
      placeholder="-- Select Department --"
      error={errors[i]?.department}
    />
  );

  const taskTypeField = (i: number) => {
    const types = taskTypeOptions(kind, rows[i].department);
    return types === null
      ? text(i, 'task_type', kind === 'indoor' ? 'Task Type *' : 'Task Type', { placeholder: 'Type the task type' })
      : (
        <Select
          label={kind === 'indoor' ? 'Task Type *' : 'Task Type'}
          options={toOptions(types)}
          value={rows[i].task_type ?? ''}
          onChange={v => setRow(i, { task_type: v ? String(v) : '' })}
          placeholder={rows[i].department ? '-- Select Task Type --' : 'Select a department first'}
          disabled={!rows[i].department}
          error={errors[i]?.task_type}
        />
      );
  };

  /**
   * "Create DSR from lead activity": load the user's own lead logs on the form's date and show a
   * confirm box with one row per log (own Start/End Time) — Confirm creates one HRMS DSR per ticked
   * log; "Just fill the form" (one log ticked) copies it into the open entry for editing instead.
   * Only for your own report — the logs are yours, not the assignee's.
   */
  const openLeadActivity = async () => {
    if (!sharedDate) {
      showToast('Pick a date first', 'error');
      return;
    }
    setFilling(true);
    try {
      const { start, end } = localDayRange(sharedDate);
      const logs = await marketingAPI.getMyLeadActivities(start, end);
      if (!logs.length) {
        showToast('No lead activity on this date', 'info');
        return;
      }
      setLeadPreview({ date: sharedDate, logs });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not load lead activity', 'error');
    } finally {
      setFilling(false);
    }
  };

  const fillFormFrom = (filled: Partial<DSRInput>) => {
    const target = active >= 0 ? active : rows.length - 1;
    setRow(target, {
      department: filled.department,
      task_type: filled.task_type,
      title: filled.title,
      description: filled.description,
      start_time: filled.start_time ?? '',
      end_time: filled.end_time ?? '',
      contact_person: filled.contact_person ?? rows[target].contact_person,
      contact_number: filled.contact_number ?? rows[target].contact_number,
      mail_id: filled.mail_id ?? rows[target].mail_id,
    });
    setActive(target);
    setErrors({});
    if (filled.contact_person || filled.contact_number || filled.mail_id) setCallingOpen(prev => new Set(prev).add(target));
    setLeadPreview(null);
    showToast('Form filled from your lead logs — review and submit', 'success');
  };
  const showFillButton = kind === 'indoor' && !isEdit && !assignee && canViewLeads;

  const CALLING_KEYS = ['contact_person', 'contact_number', 'mail_id', 'call_for', 'remarks', 'next_follow_up'];

  /** Validate one entry; shows its errors, opens its Calling Details if the problem is in there. */
  const validateRow = (i: number): boolean => {
    const errs = validateDSRInput(rows[i]);
    setErrors({ [i]: errs });
    const bad = Object.keys(errs).length > 0;
    if (bad) {
      if (kind === 'indoor' && Object.keys(errs).some(k => CALLING_KEYS.includes(k))) setCallingOpen(prev => new Set(prev).add(i));
      showToast(rows.length > 1 ? `${entryWord} ${i + 1}: please fix the highlighted fields` : 'Please fix the highlighted fields', 'error');
    }
    return !bad;
  };

  const handleDone = () => {
    if (active < 0 || !validateRow(active)) return;
    setErrors({});
    setActive(-1);
  };

  const handleAdd = () => {
    if (active >= 0 && !validateRow(active)) return;
    const prev = rows[rows.length - 1];
    const next: DSRInput = kind === 'indoor'
      ? { ...blankForm('indoor'), date: sharedDate, start_time: prev?.end_time ?? '' }
      : { ...blankForm('outdoor'), date: sharedDate };
    setErrors({});
    setRows(rs => [...rs, next]);
    setActive(rows.length);
  };

  const handleOpen = (i: number) => {
    if (active >= 0 && active !== i && !validateRow(active)) return;
    setErrors({});
    setActive(i);
  };

  const handleRemove = (i: number) => {
    setRows(rs => rs.filter((_, k) => k !== i));
    setErrors({});
    setCallingOpen(new Set());
    setActive(a => (a === i ? Math.max(0, i - 1) : a > i ? a - 1 : a));
  };

  /** One HRMS DSR per entry. Hours come from the times, exactly like the HRMS web form (guide §3.2). */
  const buildBody = (row: DSRInput): DSRInput => {
    // Empty text fields are dropped on create, but sent on edit so a cleared field actually clears.
    const body = Object.fromEntries(
      Object.entries(row).filter(([k, v]) => {
        if (k === 'hours') return false; // derived from the times below, never typed
        if (v == null) return false;
        if (v !== '') return true;
        return isEdit && !NON_TEXT_FIELDS.has(k);
      })
    ) as DSRInput;
    const d = hoursBetween(row.start_time, row.end_time);
    if (row.dsr_type === 'indoor' && d != null) body.hours = d;
    return body;
  };

  const handleSubmit = async () => {
    for (let i = 0; i < rows.length; i++) {
      const errs = validateDSRInput(rows[i]);
      if (Object.keys(errs).length) {
        setErrors({ [i]: errs });
        setActive(i);
        if (kind === 'indoor' && Object.keys(errs).some(k => CALLING_KEYS.includes(k))) setCallingOpen(prev => new Set(prev).add(i));
        showToast(rows.length > 1 ? `${entryWord} ${i + 1}: please fix the highlighted fields` : 'Please fix the highlighted fields', 'error');
        return;
      }
    }
    setSaving(true);
    try {
      if (isEdit && existing) {
        await hrmsRBACClient.updateDSR(token, existing.id, buildBody(rows[0]));
        showToast('Report updated', 'success');
        onSaved();
        return;
      }
      // Save the entries one by one (the HRMS API takes one per call). Stop at the first failure and keep the
      // unsaved entries on screen so nothing is lost or filed twice.
      const who = employeeOptions.find(o => o.value === assignee)?.label ?? assignee;
      let savedCount = 0;
      let failure: { index: number; message: string } | null = null;
      for (let i = 0; i < rows.length; i++) {
        try {
          const body = buildBody(rows[i]);
          await hrmsRBACClient.createDSR(token, assignee ? { ...body, username: assignee } : body);
          savedCount++;
        } catch (e) {
          failure = { index: i, message: e instanceof Error ? e.message : 'Could not save report' };
          break;
        }
      }
      if (!failure) {
        if (rows.length === 1) showToast(assignee ? `Report filed for ${who}` : 'Report submitted for approval', 'success');
        else showToast(`${rows.length} ${kind === 'indoor' ? 'Indoor DSR tasks' : 'Outdoor DSR visits'} ${assignee ? `filed for ${who}` : 'submitted for approval'}`, 'success');
        onSaved();
      } else {
        const label = rows[failure.index].title || rows[failure.index].company_name || `${entryWord} ${failure.index + 1}`;
        setRows(rs => rs.slice(savedCount));
        setActive(0);
        setErrors({});
        showToast(`${savedCount} of ${rows.length} saved. "${label}" failed: ${failure.message}. Fix it and submit again.`, 'error');
      }
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

  const dateError = Object.values(errors).map(e => e.date).find(Boolean);
  const dateField = (
    <div>
      <DatePicker label="Date *" value={sharedDate} onChange={v => setSharedDate(v || '')} />
      {dateError && <p className="text-xs text-red-600 mt-1">{dateError}</p>}
    </div>
  );

  // Field order follows guide §9.3 "Field order, exact" — laid out left-to-right in rows.
  const grid = (cols: 2 | 3 | 4) =>
    `grid grid-cols-1 sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : cols === 4 ? 'lg:grid-cols-4' : ''} gap-x-5 gap-y-5`;

  /** The fields of one entry (employee and date are shared and sit above the list). */
  const renderEntry = (i: number) => {
    const r = rows[i];
    if (kind === 'indoor') {
      const duration = hoursBetween(r.start_time, r.end_time);
      return (
        <div className="space-y-6">
          <div className={grid(2)}>
            {departmentField(i)}
            {taskTypeField(i)}
          </div>
          {text(i, 'title', 'Task Title *', { maxLength: 255, placeholder: 'e.g. Prepared quotation for ABC Pharma' })}
          {textarea(i, 'description', 'Task Description / Details', 'Describe what was done, key outcomes, and any notes...')}
          {/* Guide row is Start / End / OT Minutes; OT is left out because the API can't carry it (guide §9.3 note B).
              Hours is not typed — it's computed from the two times (note C). */}
          <div>
            <div className={grid(2)}>
              {text(i, 'start_time', 'Start Time', { type: 'time' })}
              {text(i, 'end_time', 'End Time', { type: 'time' })}
            </div>
            <p className="mt-2 ml-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={13} className="text-slate-400" />
              {duration != null ? (
                <>Duration: <span className="font-semibold text-slate-800">{hoursToWords(duration)}</span>
                  {r.end_time && r.start_time && r.end_time < r.start_time && <span className="text-slate-400">(overnight)</span>}
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
              onClick={() => toggleCalling(i)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
              aria-expanded={callingOpen.has(i)}
            >
              <span className="flex items-center gap-2"><Phone size={15} className="text-blue-600" /> Calling Details <span className="font-normal text-slate-400">(Optional)</span></span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${callingOpen.has(i) ? 'rotate-180' : ''}`} />
            </button>
            {callingOpen.has(i) && (
              <div className={`px-4 pb-5 pt-2 border-t border-slate-100 ${grid(3)}`}>
                {text(i, 'contact_person', 'Contact Person')}
                {text(i, 'contact_number', 'Contact Number', { type: 'tel' })}
                {text(i, 'mail_id', 'Mail ID', { type: 'email' })}
                {text(i, 'call_for', 'Call For')}
                {text(i, 'remarks', 'Remarks')}
                <DatePicker label="Next Follow-up Date" value={r.next_follow_up ?? ''} onChange={v => setRow(i, { next_follow_up: v || '' })} />
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <p className="text-xs text-slate-500">Fill in a company name or a reason for the visit (at least one).</p>
        <div className={grid(2)}>
          {select(i, 'visit_plan', 'Visit Plan', VISIT_PLANS)}
          {text(i, 'region', 'Region')}
        </div>
        <div className={grid(3)}>
          {departmentField(i)}
          {taskTypeField(i)}
          {text(i, 'company_name', 'Company Name')}
        </div>
        <div className={grid(3)}>
          {text(i, 'contact_person', 'Contact Person')}
          {text(i, 'contact_number', 'Contact Number', { type: 'tel' })}
          {text(i, 'mail_id', 'Mail ID', { type: 'email' })}
        </div>
        <div className={grid(4)}>
          {select(i, 'reason_for_visit', 'Reason for Visit', REASONS_FOR_VISIT)}
          {select(i, 'appointment_status', 'Appointment Status', APPOINTMENT_STATUSES)}
          {select(i, 'visit_status', 'Visit Status', VISIT_STATUSES)}
          <DatePicker label="Visited Date" value={r.visited_date ?? ''} onChange={v => setRow(i, { visited_date: v || '' })} />
        </div>
        {textarea(i, 'meeting_output', 'Meeting Output', 'What was discussed / decided...')}
        <div className={grid(2)}>
          {text(i, 'next_action_needed', 'Next Action Needed')}
          {text(i, 'mail_status', 'Mail Status')}
        </div>
        <div className={grid(2)}>
          {text(i, 'remarks', 'Remarks')}
          <DatePicker label="Next Follow-up Date" value={r.next_follow_up ?? ''} onChange={v => setRow(i, { next_follow_up: v || '' })} />
        </div>
      </div>
    );
  };

  const entrySummary = (r: DSRInput) => {
    if (kind === 'indoor') {
      const d = hoursBetween(r.start_time, r.end_time);
      const time = formatTimeRange(r.start_time, r.end_time);
      return {
        title: r.title || 'Untitled task',
        detail: `${r.department || '—'} › ${r.task_type || '—'}${time ? ` · ${time}${d != null ? ` (${hoursToWords(d)})` : ''}` : ''}`,
      };
    }
    return {
      title: r.company_name || 'Visit',
      detail: [r.reason_for_visit, r.visit_status, r.department && `${r.department}${r.task_type ? ` › ${r.task_type}` : ''}`].filter(Boolean).join(' · ') || undefined,
    };
  };

  const totalHours = kind === 'indoor' ? rows.reduce((a, r) => a + (hoursBetween(r.start_time, r.end_time) ?? 0), 0) : 0;

  // [&_label]:block — DatePicker renders its label inline, which drops it a few px below the other labels in a row.
  return (
    <div className="space-y-6 [&_label]:block">
      {showFillButton && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
          <p className="text-sm text-slate-700">
            Worked on leads this day? Create this report from your lead logs for <span className="font-semibold">{sharedDate
              ? new Date(`${sharedDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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

      {/* Employee and date are entered once and apply to every entry below */}
      <div className={grid(3)}>
        {employeePicker}
        {dateField}
      </div>

      {isEdit ? (
        renderEntry(0)
      ) : (
        <EntryRows
          rows={rows}
          active={active}
          summary={entrySummary}
          renderOpen={(_, i) => renderEntry(i)}
          onOpen={handleOpen}
          onRemove={handleRemove}
          onDone={handleDone}
          onAdd={handleAdd}
          addLabel={kind === 'indoor' ? 'Add another task' : 'Add another visit'}
          footer={kind === 'indoor' && rows.length > 1 && totalHours > 0 ? <>Total: <span className="font-semibold text-slate-800">{hoursToWords(Math.round(totalHours * 10) / 10)}</span></> : undefined}
        />
      )}

      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <Button variant="outline" onClick={reset} disabled={saving}>Reset Form</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : rows.length > 1 ? `Submit ${rows.length} ${kind === 'indoor' ? 'tasks' : 'visits'}` : 'Submit'}
        </Button>
      </div>
    </div>
  );
};
