import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import {
  hrmsRBACClient, ExpenseReport, ExpenseInput, EXPENSE_AMOUNT_FIELDS, ExpenseAmountField,
} from '../../lib/hrms-rbac';
import { validateExpenseInput, expenseTotalPreview } from '../../lib/dsr-helpers';
import { useApp } from '../../App';

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

/** Field order follows guide §9.3: Submitted By → Date + Tour Destination → Description + Company → 7 amounts + Total. */
export const ExpenseForm: React.FC<ExpenseFormProps> = ({ token, existing, myName, onSaved }) => {
  const { showToast } = useApp();
  const isEdit = !!existing;
  const [form, setForm] = useState<ExpenseInput>(() => initialState(existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setForm(initialState(existing));
    setErrors({});
  };
  useEffect(reset, [existing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    const errs = validateExpenseInput(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      showToast('Please fix the highlighted fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && existing) {
        await hrmsRBACClient.updateExpense(token, existing.id, form);
        showToast('Expense updated', 'success');
      } else {
        await hrmsRBACClient.createExpense(token, form);
        showToast('Expense submitted for approval', 'success');
      }
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  // [&_label]:block — DatePicker renders its label inline, which drops it a few px below the other labels in a row.
  return (
    <div className="space-y-6 [&_label]:block">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-5">
        <Input label="Submitted By" value={myName} readOnly disabled />
        <div>
          <DatePicker label="Date *" value={form.date} onChange={v => setForm(f => ({ ...f, date: v || '' }))} />
          {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
        </div>
        <Input label="Tour Destination" placeholder="e.g. Pune - Nashik" value={form.tour_destination ?? ''} onChange={e => setForm(f => ({ ...f, tour_destination: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
        <Input label="Description & Location of Work" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Input label="Company Name" value={form.company_name ?? ''} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-5 pt-5 border-t border-slate-100">
        {EXPENSE_AMOUNT_FIELDS.map(field => (
          <Input
            key={field}
            label={`${AMOUNT_LABELS[field]} (₹)`}
            type="number"
            min={0}
            step="1"
            value={form[field] ?? ''}
            onChange={e => setForm(f => ({ ...f, [field]: e.target.value === '' ? undefined : Number(e.target.value) }))}
            error={errors[field]}
          />
        ))}
        {/* Preview only — HRMS computes the real total (guide §8.2). */}
        <Input label="Total (₹)" value={expenseTotalPreview(form).toLocaleString('en-IN')} readOnly disabled />
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <Button variant="outline" onClick={reset} disabled={saving}>Reset Form</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit'}
        </Button>
      </div>
    </div>
  );
};
