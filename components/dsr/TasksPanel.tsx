import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleCheck, ListTodo, Pencil, Search, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { ConfirmModal } from '../ui/ConfirmModal';
import { hrmsRBACClient, TodoTask } from '../../lib/hrms-rbac';
import { matchesSearch } from '../../lib/dsr-helpers';
import { isTodoDone, todoDueParts, todoAssignedByName, isAssignedBy } from '../../lib/todo-helpers';
import type { EmployeeOption } from './useEmployeeOptions';
import { useApp } from '../../App';

/**
 * HRMS To-Do tasks on DSR History (guide §9.3 "REST API for ToDoItem"):
 * - mode "mine":     tasks assigned to me — Mark done (HRMS then creates the DSR), Edit, Delete.
 * - mode "assigned": pick an employee, see the tasks I gave them — Edit, Delete (no Mark done:
 *                    only the task's own employee can complete it).
 * Edit only while pending (API rule). There's no "reopen" in the API.
 */
type StatusFilter = 'pending' | 'completed' | 'all';

interface TasksPanelProps {
  token: string;
  mode: 'mine' | 'assigned';
  /** For "assigned" mode: who can be picked, and who I am (to keep only tasks I assigned). */
  employees?: EmployeeOption[];
  me?: { employeeId?: number | null; username?: string | null };
  /** Pending-task count changed (tab badge). */
  onCountChange?: (pending: number) => void;
}

const formatDue = (t: TodoTask) => {
  const { date, time } = todoDueParts(t);
  if (!date) return null;
  const d = new Date(`${date}T${time || '00:00'}:00`);
  const day = Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return time ? `${day}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : day;
};

export const TasksPanel: React.FC<TasksPanelProps> = ({ token, mode, employees = [], me, onCountChange }) => {
  const { showToast } = useApp();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [employee, setEmployee] = useState(''); // username, "assigned" mode
  const [q, setQ] = useState('');
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<TodoTask | null>(null);
  const [deleting, setDeleting] = useState<TodoTask | null>(null);
  const [completing, setCompleting] = useState<TodoTask | null>(null);

  const load = useCallback(async () => {
    if (mode === 'assigned' && !employee) { setTasks([]); return; }
    setLoading(true);
    try {
      const rows = await hrmsRBACClient.getTodos(token, {
        username: mode === 'assigned' ? employee : undefined,
        status: status === 'all' ? undefined : status,
      });
      setTasks(mode === 'assigned' && me ? rows.filter(t => isAssignedBy(t, me)) : rows);
      if (mode === 'mine' && status === 'pending') onCountChange?.(rows.length);
    } finally {
      setLoading(false);
    }
  }, [token, mode, employee, status, me, onCountChange]);

  useEffect(() => { load(); }, [load]);

  const visible = tasks.filter(t => matchesSearch({ a: t.title ?? '', b: t.description ?? '', c: todoAssignedByName(t) }, q));

  const doComplete = async () => {
    if (!completing) return;
    try {
      const res = await hrmsRBACClient.completeTodo(token, completing.id);
      showToast(res.dsr_id ? `Done — DSR #${res.dsr_id} created and sent for approval` : 'Task marked done', 'success');
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not complete task', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    try {
      await hrmsRBACClient.deleteTodo(token, deleting.id);
      showToast('Task deleted', 'success');
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete task', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const filterInput = 'h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';
  const th = 'px-3 py-2.5 border-r border-slate-200';
  const td = 'px-3 py-2.5 border-r border-slate-100 align-top';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50/80 border-b border-slate-200 p-4 flex flex-wrap items-center gap-3">
        {mode === 'assigned' && (
          <select value={employee} onChange={e => setEmployee(e.target.value)} className={`${filterInput} max-w-[16rem]`} aria-label="Employee">
            <option value="">— Pick an employee —</option>
            {employees.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <div className="relative min-w-[14rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search tasks..."
            className={`${filterInput} w-full pl-9 placeholder:text-slate-400`} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as StatusFilter)} className={filterInput} aria-label="Status">
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
      </div>

      {mode === 'assigned' && !employee ? (
        <p className="py-12 text-center text-sm text-slate-400">Pick an employee to see the tasks you assigned them.</p>
      ) : loading ? (
        <div className="flex items-center gap-2 py-12 text-slate-500 justify-center text-sm">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading…
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center text-slate-400">
          {mode === 'mine' && status === 'pending' && !q
            ? <><CheckCircle2 size={36} className="text-emerald-500" /><p className="text-sm font-semibold text-slate-800">No pending tasks</p></>
            : <><ListTodo size={32} /><p className="text-sm">No tasks found.</p></>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <th className={th}>Task</th>
                <th className={th} style={{ width: '14%' }}>Assigned by</th>
                <th className={th} style={{ width: '18%' }}>Complete by</th>
                <th className={`${th} text-center`} style={{ width: '11%' }}>Status</th>
                <th className="px-2 py-2.5 text-center" style={{ width: '12%' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {visible.map(t => {
                const done = isTodoDone(t);
                const due = formatDue(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className={`${td} text-slate-900`}>
                      <span className="font-medium">{t.title || `Task #${t.id}`}</span>
                      {t.description && <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line">{t.description}</p>}
                    </td>
                    <td className={td}>{todoAssignedByName(t) || <span className="text-slate-300">Self</span>}</td>
                    <td className={td}>
                      {due ? <span className={t.is_overdue && !done ? 'font-semibold text-red-600' : ''}>{due}</span> : <span className="text-slate-300">No deadline</span>}
                      {t.overdue_by && (
                        <p className={`text-[11px] mt-0.5 ${done ? 'text-red-500' : 'text-red-600 font-semibold'}`}>
                          {done ? `Completed ${t.overdue_by} late` : `Overdue by ${t.overdue_by}`}
                        </p>
                      )}
                    </td>
                    <td className={`${td} text-center`}>
                      {done
                        ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Done</span>
                        : t.is_overdue
                          ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Overdue</span>
                          : <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Pending</span>}
                    </td>
                    <td className="px-2 py-2.5 text-center whitespace-nowrap align-top">
                      <div className="inline-flex items-center gap-1">
                        {mode === 'mine' && !done && (
                          <button type="button" onClick={() => setCompleting(t)} title="Mark done (creates the DSR)"
                            className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"><CircleCheck size={16} /></button>
                        )}
                        {!done && (
                          <button type="button" onClick={() => setEditing(t)} title="Edit task"
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil size={14} /></button>
                        )}
                        <button type="button" onClick={() => setDeleting(t)} title="Delete task"
                          className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <TodoEditModal token={token} task={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      <ConfirmModal
        isOpen={!!completing}
        onClose={() => setCompleting(null)}
        onConfirm={doComplete}
        title="Mark task as done?"
        message={`"${completing?.title ?? ''}" will be marked done and HRMS will create your DSR for it (hours counted from when it was assigned until now), sent for approval. This can't be undone here.`}
        confirmLabel="Mark done"
        variant="primary"
      />
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={doDelete}
        title="Delete task?"
        message={`Delete "${deleting?.title ?? ''}"? ${deleting && isTodoDone(deleting) ? 'The DSR it already created is not affected.' : 'The person will no longer see it in their to-do list.'}`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

/** Edit a pending task's title, description and deadline (POST /todo/<id>/update/). */
const TodoEditModal: React.FC<{ token: string; task: TodoTask | null; onClose: () => void; onSaved: () => void }> = ({ token, task, onClose, onSaved }) => {
  const { showToast } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    const due = todoDueParts(task);
    setTitle(task.title ?? '');
    setDescription(task.description ?? '');
    setDueDate(due.date);
    setDueTime(due.time);
  }, [task]);

  const save = async () => {
    if (!task) return;
    if (!title.trim()) { showToast('Title is required', 'error'); return; }
    setSaving(true);
    try {
      await hrmsRBACClient.updateTodo(token, task.id, {
        title: title.trim(),
        description: description.trim(),
        // '' clears the deadline (API rule); a time without a date is meaningless, so only send it with one.
        due_date: dueDate,
        ...(dueDate && dueTime ? { due_time: dueTime } : {}),
      });
      showToast('Task updated', 'success');
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update task', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title="Edit task"
      contentClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      }
    >
      <div className="space-y-4 [&_label]:block">
        <Input label="Task Title *" value={title} maxLength={255} onChange={e => setTitle(e.target.value)} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-700 ml-0.5">Task Description</label>
          <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Complete By Date" value={dueDate} onChange={v => setDueDate(v || '')} placeholder="No deadline" />
          <Input label="Complete By Time" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} disabled={!dueDate} />
        </div>
        <p className="text-[11px] text-slate-400">Clear the date to remove the deadline.</p>
      </div>
    </Modal>
  );
};
