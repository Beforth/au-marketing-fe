import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { hrmsRBACClient } from '../../lib/hrms-rbac';
import { useEmployeeOptions } from './useEmployeeOptions';
import { useApp } from '../../App';

interface AssignDSRFormProps {
  token: string;
  onSaved: () => void;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_DUE_TIME = '18:00';

/**
 * "Assign DSR Task" (guide §9.3, changed 2026-09-28): creates an HRMS **To-Do task** — not a DSR —
 * for one or more employees, with a Complete By deadline (POST /api/rbac/todo/create/, one
 * independent task + notification per person). The DSR is created by HRMS when the assignee marks
 * the task done. Field order as the HRMS form: Assign To → Task Title → Task Description →
 * Complete By Date + Time.
 */
export const AssignDSRForm: React.FC<AssignDSRFormProps> = ({ token, onSaved }) => {
  const { showToast } = useApp();
  const employeeOptions = useEmployeeOptions(true);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(today());
  const [dueTime, setDueTime] = useState(DEFAULT_DUE_TIME);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const selectable = useMemo(() => employeeOptions.filter(o => o.hrmsEmployeeId != null), [employeeOptions]);
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? selectable.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)) : selectable;
  }, [selectable, filter]);

  const toggle = (id: number) => setPicked(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const reset = () => {
    setPicked(new Set());
    setFilter('');
    setTitle('');
    setDescription('');
    setDueDate(today());
    setDueTime(DEFAULT_DUE_TIME);
    setErrors({});
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!picked.size) errs.assignee = 'Pick at least one employee';
    if (!title.trim()) errs.title = 'Task title is required';
    else if (title.length > 255) errs.title = 'Title must be 255 characters or less';
    if (!dueDate) errs.due = 'Complete By date is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const res = await hrmsRBACClient.createTodo(token, {
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        employee_ids: Array.from(picked),
        due_date: dueDate,
        due_time: dueTime || DEFAULT_DUE_TIME,
      });
      const names = selectable.filter(o => picked.has(o.hrmsEmployeeId as number)).map(o => o.label);
      const who = names.length === 1 ? names[0] : `${res.count || names.length} employees`;
      showToast(`Task assigned to ${who} — it'll become a DSR when they mark it done`, 'success');
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not assign task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const pickedNames = selectable.filter(o => picked.has(o.hrmsEmployeeId as number)).map(o => o.label);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-slate-700 ml-0.5 mb-1">Assign To *</label>
        <div className={`rounded-lg border ${errors.assignee ? 'border-red-400' : 'border-slate-200'}`}>
          <div className="relative border-b border-slate-100">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search employees…"
              className="w-full h-9 pl-9 pr-3 text-sm bg-transparent focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {visible.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400">{selectable.length ? 'No employees match' : 'Loading employees…'}</p>
            ) : visible.map(o => (
              <label key={o.hrmsEmployeeId} className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={picked.has(o.hrmsEmployeeId as number)}
                  onChange={() => toggle(o.hrmsEmployeeId as number)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                {o.label}
                <span className="text-xs text-slate-400">@{o.value}</span>
              </label>
            ))}
          </div>
        </div>
        <p className={`mt-1 ml-0.5 text-xs ${errors.assignee ? 'text-red-600' : 'text-slate-500'}`}>
          {errors.assignee
            || (pickedNames.length
              ? `${pickedNames.length} selected: ${pickedNames.slice(0, 4).join(', ')}${pickedNames.length > 4 ? ` +${pickedNames.length - 4} more` : ''} — each gets their own task`
              : 'Pick one or more people')}
        </p>
      </div>

      <Input
        label="Task Title *"
        value={title}
        maxLength={255}
        onChange={e => setTitle(e.target.value)}
        placeholder="e.g. Call ABC Pharma about the pending quotation"
        error={errors.title}
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700 ml-0.5">Task Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Details of the task..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>
      {/* [&_label]:block: DatePicker renders its label inline, which drops it below the Time label */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5 [&_label]:block">
        <div>
          <DatePicker label="Complete By Date *" value={dueDate} onChange={v => setDueDate(v || '')} minDate={today()} />
          {errors.due && <p className="text-xs text-red-600 mt-1">{errors.due}</p>}
        </div>
        <Input label="Complete By Time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <Button variant="outline" onClick={reset} disabled={saving}>Reset Form</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Assigning…' : 'Assign Task'}</Button>
      </div>
    </div>
  );
};
