/**
 * Small readers for HRMS To-Do tasks (TodoTask). The guide documents the endpoints but not every
 * response field, so these accept the likely shapes (object / id / string) instead of assuming one.
 */
import type { TodoTask } from './hrms-rbac';

export const isTodoDone = (t: TodoTask) => t.status === 'completed' || (!t.status && !!t.completed_at);

const pad = (n: number) => String(n).padStart(2, '0');

/** Deadline as { date: 'YYYY-MM-DD', time: 'HH:MM' } ('' when missing) — from due_at, or due_date + due_time. */
export function todoDueParts(t: TodoTask): { date: string; time: string } {
  if (t.due_at) {
    const d = new Date(t.due_at);
    if (!Number.isNaN(d.getTime())) {
      return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
    }
  }
  return { date: t.due_date || '', time: (t.due_time || '').slice(0, 5) };
}

export function todoAssignedByName(t: TodoTask): string {
  if (t.assigned_by_name) return t.assigned_by_name;
  const a = t.assigned_by;
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object') return a.name || a.username || '';
  return '';
}

/** Was this task assigned by me? If HRMS doesn't send assigned_by, don't hide the task (returns true). */
export function isAssignedBy(t: TodoTask, me: { employeeId?: number | null; username?: string | null }): boolean {
  const a = t.assigned_by;
  if (a == null) return true;
  if (typeof a === 'number') return me.employeeId != null && a === me.employeeId;
  if (typeof a === 'string') return true;
  if (a.id != null && me.employeeId != null) return a.id === me.employeeId;
  if (a.username && me.username) return a.username === me.username;
  return true;
}
