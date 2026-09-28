import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { hrmsRBACClient, DSRInput, DSRTask } from '../../lib/hrms-rbac';
import type { MyLeadActivity } from '../../lib/marketing-api';
import { hoursBetween, hoursToWords } from '../../lib/dsr-helpers';
import {
  buildDSRForLog, addMinutes, logTime, logTypeLabel, logCompany, DEFAULT_LOG_MINUTES, existingDSRsForLogs,
} from '../../lib/dsr-from-lead-logs';
import { dsrStatusLabel } from '../../lib/dsr-helpers';
import { useApp } from '../../App';

interface CreateDSRFromLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  /** DSR date (YYYY-MM-DD) — the day the logs were loaded for. */
  date: string;
  logs: MyLeadActivity[];
  /** At least one DSR created in HRMS (go to history). */
  onCreated: () => void;
  /** "Just fill the form" (one log ticked) — copy its fields into the form for editing. */
  onFillForm: (fields: Partial<DSRInput>) => void;
}

interface Row {
  log: MyLeadActivity;
  include: boolean;
  start: string;
  end: string;
  error?: string;
  /** DSR already created from this log (not rejected) — row is locked so it can't be duplicated. */
  existing?: DSRTask;
}

const timeInput = 'h-8 w-[6.5rem] px-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';

/**
 * "Create DSR from lead activity": one DSR per lead log. Each log is a row with a tick box and its
 * own Start / End Time (Start = log time, End = +30 min by default, so nothing falls back to HRMS's
 * 8-hour default). Confirm creates one HRMS DSR per ticked row; rows that fail stay in the box.
 */
export const CreateDSRFromLeadsModal: React.FC<CreateDSRFromLeadsModalProps> = ({
  isOpen, onClose, token, date, logs, onCreated, onFillForm,
}) => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  // Build rows, then lock any log that already has a DSR for this day (duplicate protection).
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fresh = logs.map(log => {
      const start = logTime(log.activity_date);
      return { log, include: true, start, end: addMinutes(start, DEFAULT_LOG_MINUTES) } as Row;
    });
    setRows(fresh);
    setChecking(true);
    hrmsRBACClient.getDSR(token, { filter_date: date, type: 'indoor' })
      .then(dsrs => {
        if (cancelled) return;
        const existing = existingDSRsForLogs(logs, dsrs);
        setRows(fresh.map(r => (existing.has(r.log.id) ? { ...r, include: false, existing: existing.get(r.log.id) } : r)));
      })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [isOpen, logs, token, date]);

  const update = (id: number, patch: Partial<Row>) =>
    setRows(rs => rs.map(r => (r.log.id === id && !r.existing ? { ...r, ...patch, error: undefined } : r)));

  const selected = rows.filter(r => r.include && !r.existing);
  const alreadyDone = rows.filter(r => r.existing).length;
  const niceDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const fieldsFor = (r: Row): Partial<DSRInput> => ({
    ...buildDSRForLog(r.log),
    start_time: r.start || undefined,
    end_time: r.end || undefined,
  });

  const confirm = async () => {
    // Check every selected row first so nothing is half-sent because of an obvious mistake.
    const rowError = (r: Row) =>
      !r.start || !r.end ? 'Enter start and end time'
        : hoursBetween(r.start, r.end) === 0 ? 'End must differ from start'
          : undefined;
    if (selected.some(rowError)) {
      setRows(rs => rs.map(r => (r.include ? { ...r, error: rowError(r) } : r)));
      return;
    }

    setSaving(true);
    const failed: Record<number, string> = {};
    let created = 0;
    for (const r of selected) {
      try {
        const fields = fieldsFor(r);
        const body = Object.fromEntries(
          Object.entries({ ...fields, dsr_type: 'indoor', date }).filter(([, v]) => v != null && v !== '')
        ) as unknown as DSRInput;
        body.hours = hoursBetween(r.start, r.end) ?? undefined;
        await hrmsRBACClient.createDSR(token, body);
        created += 1;
      } catch (e) {
        failed[r.log.id] = e instanceof Error ? e.message : 'Could not create';
      }
    }
    setSaving(false);

    const failedCount = Object.keys(failed).length;
    if (!failedCount) {
      showToast(`${created} DSR${created === 1 ? '' : 's'} submitted for approval`, 'success');
      onCreated();
      return;
    }
    // Keep only the failed rows in the box so they can be retried.
    setRows(rs => rs.filter(r => r.log.id in failed).map(r => ({ ...r, error: failed[r.log.id] })));
    showToast(`${created} created, ${failedCount} failed — see the rows below`, 'error');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create DSR from lead activity"
      contentClassName="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFillForm(fieldsFor(selected[0]))}
            disabled={saving || selected.length !== 1}
            title={selected.length === 1 ? 'Copy this log into the form to edit before submitting' : 'Tick exactly one log to edit it in the form'}
          >
            Just fill the form
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={confirm} disabled={saving || checking || !selected.length}>
              {saving ? 'Submitting…' : checking ? 'Checking…' : `Create ${selected.length} DSR${selected.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{logs.length} lead log{logs.length === 1 ? '' : 's'}</span> on{' '}
          <span className="font-semibold text-slate-900">{niceDate}</span>. Each ticked log becomes its own DSR — set the time spent on each.
          {alreadyDone > 0 && (
            <> <span className="font-semibold text-emerald-700">{alreadyDone} already {alreadyDone === 1 ? 'has' : 'have'} a DSR</span> and {alreadyDone === 1 ? 'is' : 'are'} skipped.</>
          )}
        </p>
        {!checking && rows.length > 0 && alreadyDone === rows.length && (
          <p className="text-sm text-emerald-700 flex items-center gap-1.5"><CheckCircle2 size={15} /> All of this day's lead logs already have DSRs.</p>
        )}

        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {rows.map(r => {
            const dur = hoursBetween(r.start, r.end);
            return (
              <div key={r.log.id} className={`px-4 py-3 ${r.existing ? 'bg-slate-50' : ''} ${r.include ? '' : 'opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={r.include}
                    disabled={!!r.existing}
                    onChange={e => update(r.log.id, { include: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                    aria-label={`Include ${r.log.title}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {logCompany(r.log)} <span className="font-normal text-slate-500">— {r.log.title}</span>
                      {r.existing && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 align-middle">
                          <CheckCircle2 size={11} /> Already in DSR · {dsrStatusLabel(r.existing.status, r.existing.current_level)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {logTypeLabel(r.log.activity_type)} · logged at {logTime(r.log.activity_date)}
                      {r.log.contact_person_name && <> · {r.log.contact_person_name}</>}
                    </p>
                    {r.log.description?.trim() && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.log.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <input type="time" value={r.start} disabled={!r.include || !!r.existing} aria-label="Start time"
                        onChange={e => update(r.log.id, { start: e.target.value })} className={timeInput} />
                      <span className="text-xs text-slate-400">to</span>
                      <input type="time" value={r.end} disabled={!r.include || !!r.existing} aria-label="End time"
                        onChange={e => update(r.log.id, { end: e.target.value })} className={timeInput} />
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock size={11} className="text-slate-400" />
                      {dur != null && dur > 0 ? hoursToWords(dur) : '—'}
                      {dur != null && dur > 0 && r.end < r.start && <span className="text-slate-400">(overnight)</span>}
                    </p>
                  </div>
                </div>
                {r.error && (
                  <p className="mt-2 ml-7 flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} /> {r.error}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
