import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import {
  hrmsRBACClient, ExpenseReport, ExpenseInput, EXPENSE_AMOUNT_FIELDS, ExpenseAmountField,
} from '../../lib/hrms-rbac';
import { validateExpenseInput, expenseTotalPreview } from '../../lib/dsr-helpers';
import { useApp } from '../../App';
import { EntryRows } from './EntryRows';

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

interface ExpenseFormProps {
  token: string;
  /** Edit mode when set. */
  existing?: ExpenseReport | null;
  /** Shown read-only in "Submitted By". */
  myName: string;
  onSaved: () => void;
}

const addDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/**
 * Field order follows guide §9.3: Submitted By → Date + Tour Destination → Description + Company → 7 amounts + Total.
 * Creating takes several days in one submission (guide §9.3, 2026-10-03): each day is its own entry with its own date and
 * becomes its own HRMS expense voucher; HRMS recomputes every total. Editing is always a single day.
 */
export const ExpenseForm: React.FC<ExpenseFormProps> = ({ token, existing, myName, onSaved }) => {
  const { showToast } = useApp();
  const isEdit = !!existing;
  const [rows, setRows] = useState<ExpenseInput[]>(() => [initialState(existing)]);
  const [active, setActive] = useState(0);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setRows([initialState(existing)]);
    setActive(0);
    setErrors({});
  };
  useEffect(reset, [existing]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRow = (i: number, patch: Partial<ExpenseInput>) => setRows(rs => rs.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const validateRow = (i: number): boolean => {
    const errs = validateExpenseInput(rows[i]);
    setErrors({ [i]: errs });
    const bad = Object.keys(errs).length > 0;
    if (bad) showToast(rows.length > 1 ? `Day ${i + 1}: please fix the highlighted fields` : 'Please fix the highlighted fields', 'error');
    return !bad;
  };

  const handleDone = () => {
    if (active < 0 || !validateRow(active)) return;
    setErrors({});
    setActive(-1);
  };
  const handleAdd = () => {
    if (active >= 0 && !validateRow(active)) return;
    const last = rows[rows.length - 1];
    setErrors({});
    setRows(rs => [...rs, { date: last?.date ? addDay(last.date) : today() }]);
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
    setActive(a => (a === i ? Math.max(0, i - 1) : a > i ? a - 1 : a));
  };

  const handleSubmit = async () => {
    for (let i = 0; i < rows.length; i++) {
      const errs = validateExpenseInput(rows[i]);
      if (Object.keys(errs).length) {
        setErrors({ [i]: errs });
        setActive(i);
        showToast(rows.length > 1 ? `Day ${i + 1}: please fix the highlighted fields` : 'Please fix the highlighted fields', 'error');
        return;
      }
    }
    setSaving(true);
    try {
      if (isEdit && existing) {
        await hrmsRBACClient.updateExpense(token, existing.id, rows[0]);
        showToast('Expense updated', 'success');
        onSaved();
        return;
      }
      // One voucher per day, saved one by one; stop at the first failure and keep the unsaved days on screen.
      let savedCount = 0;
      let failure: { index: number; message: string } | null = null;
      for (let i = 0; i < rows.length; i++) {
        try {
          await hrmsRBACClient.createExpense(token, rows[i]);
          savedCount++;
        } catch (e) {
          failure = { index: i, message: e instanceof Error ? e.message : 'Could not save expense' };
          break;
        }
      }
      if (!failure) {
        showToast(rows.length === 1 ? 'Expense submitted for approval' : `${rows.length} expense days submitted for approval`, 'success');
        onSaved();
      } else {
        const failedDate = rows[failure.index].date;
        setRows(rs => rs.slice(savedCount));
        setActive(0);
        setErrors({});
        showToast(`${savedCount} of ${rows.length} saved. ${failedDate || `Day ${failure.index + 1}`} failed: ${failure.message}. Fix it and submit again.`, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderEntry = (i: number) => {
    const r = rows[i];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
          <div>
            <DatePicker label="Date *" value={r.date} onChange={v => setRow(i, { date: v || '' })} />
            {errors[i]?.date && <p className="text-xs text-red-600 mt-1">{errors[i].date}</p>}
          </div>
          <Input label="Tour Destination" placeholder="e.g. Pune - Nashik" value={r.tour_destination ?? ''} onChange={e => setRow(i, { tour_destination: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
          <Input label="Description & Location of Work" value={r.description ?? ''} onChange={e => setRow(i, { description: e.target.value })} />
          <Input label="Company Name" value={r.company_name ?? ''} onChange={e => setRow(i, { company_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 pt-5 border-t border-slate-100">
          {EXPENSE_AMOUNT_FIELDS.map(field => (
            <Input
              key={field}
              label={`${AMOUNT_LABELS[field]} (₹)`}
              type="number"
              min={0}
              step="1"
              value={r[field] ?? ''}
              onChange={e => setRow(i, { [field]: e.target.value === '' ? undefined : Number(e.target.value) } as Partial<ExpenseInput>)}
              error={errors[i]?.[field]}
            />
          ))}
          {/* Preview only — HRMS computes the real total (guide §8.2). */}
          <Input label="Total (₹)" value={expenseTotalPreview(r).toLocaleString('en-IN')} readOnly disabled />
        </div>
      </div>
    );
  };

  const grandTotal = rows.reduce((a, r) => a + expenseTotalPreview(r), 0);

  // [&_label]:block — DatePicker renders its label inline, which drops it a few px below the other labels in a row.
  return (
    <div className="space-y-6 [&_label]:block">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
        <Input label="Submitted By" value={myName} readOnly disabled />
      </div>

      {isEdit ? (
        renderEntry(0)
      ) : (
        <EntryRows
          rows={rows}
          active={active}
          summary={(r) => ({
            title: `${r.date ? new Date(`${r.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'No date'}${r.tour_destination ? ` · ${r.tour_destination}` : ''}`,
            detail: `${[r.company_name, r.description].filter(Boolean).join(' · ') || 'Expense'} · ${rupees(expenseTotalPreview(r))}`,
          })}
          renderOpen={(_, i) => renderEntry(i)}
          onOpen={handleOpen}
          onRemove={handleRemove}
          onDone={handleDone}
          onAdd={handleAdd}
          addLabel="Add another day"
          footer={rows.length > 1 ? <>Total of all days: <span className="font-semibold text-slate-800">{rupees(grandTotal)}</span></> : undefined}
        />
      )}

      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <Button variant="outline" onClick={reset} disabled={saving}>Reset Form</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : rows.length > 1 ? `Submit ${rows.length} days` : 'Submit'}
        </Button>
      </div>
    </div>
  );
};
