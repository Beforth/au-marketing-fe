import React from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * "Several entries in one submission" list for the HRMS DSR forms (guide §9.3, added 2026-10-03):
 * finished entries fold into a compact summary row (number badge, title, one-line detail, pencil + trash),
 * the open one shows its fields and ends with a green Done button, and "Add another …" appends a new row.
 * Folded rows are only hidden by the parent — it keeps all rows in state and saves them all.
 */
interface EntryRowsProps<T> {
  rows: T[];
  /** Index of the open row, or -1 when every row is folded. */
  active: number;
  summary: (row: T, index: number) => { title: string; detail?: string };
  renderOpen: (row: T, index: number) => React.ReactNode;
  onOpen: (index: number) => void;
  onRemove: (index: number) => void;
  onDone: () => void;
  onAdd: () => void;
  /** e.g. "Add another task" */
  addLabel: string;
  /** Extra line under the list, e.g. "Total: 5 hours". */
  footer?: React.ReactNode;
}

export function EntryRows<T>({ rows, active, summary, renderOpen, onOpen, onRemove, onDone, onAdd, addLabel, footer }: EntryRowsProps<T>) {
  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        if (i === active) {
          return (
            <div key={i} className="rounded-xl border border-blue-200 bg-white p-4 sm:p-5 space-y-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{i + 1}</span>
                  {rows.length > 1 ? `Entry ${i + 1}` : 'Entry'}
                </span>
                {rows.length > 1 && (
                  <button type="button" onClick={() => onRemove(i)} className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete entry ${i + 1}`}>
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              {renderOpen(row, i)}
              <div className="flex justify-end">
                <button type="button" onClick={onDone} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
                  <Check size={16} /> Done
                </button>
              </div>
            </div>
          );
        }
        const s = summary(row, i);
        return (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
              {s.detail && <p className="text-xs text-slate-500 truncate">{s.detail}</p>}
            </div>
            <button type="button" onClick={() => onOpen(i)} className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" aria-label={`Edit entry ${i + 1}`}>
              <Pencil size={20} />
            </button>
            {rows.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete entry ${i + 1}`}>
                <Trash2 size={20} />
              </button>
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={onAdd}>{addLabel}</Button>
        {footer && <p className="text-sm text-slate-600">{footer}</p>}
      </div>
    </div>
  );
}
