import { describe, it, expect } from 'vitest';
import { isTodoDone, todoDueParts, todoAssignedByName, isAssignedBy } from '../../lib/todo-helpers';
import type { TodoTask } from '../../lib/hrms-rbac';

const t = (over: Partial<TodoTask>): TodoTask => ({ id: 1, title: 'x', status: 'pending', ...over });

describe('todo helpers', () => {
  it('done = status completed or completed_at set', () => {
    expect(isTodoDone(t({}))).toBe(false);
    expect(isTodoDone(t({ status: 'completed' }))).toBe(true);
    expect(isTodoDone(t({ status: undefined, completed_at: '2026-09-28T10:00:00' }))).toBe(true);
  });

  it('due parts from due_at (local) or due_date + due_time', () => {
    expect(todoDueParts(t({ due_at: '2026-09-29T18:00:00' }))).toEqual({ date: '2026-09-29', time: '18:00' });
    expect(todoDueParts(t({ due_date: '2026-09-29', due_time: '17:30:00' }))).toEqual({ date: '2026-09-29', time: '17:30' });
    expect(todoDueParts(t({ due_date: '2026-09-29' }))).toEqual({ date: '2026-09-29', time: '' });
    expect(todoDueParts(t({}))).toEqual({ date: '', time: '' });
  });

  it('assigned-by name from object, name field or string', () => {
    expect(todoAssignedByName(t({ assigned_by: { id: 3, name: 'Priya' } }))).toBe('Priya');
    expect(todoAssignedByName(t({ assigned_by_name: 'Priya' }))).toBe('Priya');
    expect(todoAssignedByName(t({ assigned_by: 'Priya S' }))).toBe('Priya S');
    expect(todoAssignedByName(t({ assigned_by: 3 }))).toBe('');
  });

  it('isAssignedBy matches employee id or username; unknown shape → true (don\'t hide)', () => {
    expect(isAssignedBy(t({ assigned_by: { id: 3 } }), { employeeId: 3, username: 'p' })).toBe(true);
    expect(isAssignedBy(t({ assigned_by: { id: 4 } }), { employeeId: 3, username: 'p' })).toBe(false);
    expect(isAssignedBy(t({ assigned_by: 3 }), { employeeId: 3, username: 'p' })).toBe(true);
    expect(isAssignedBy(t({ assigned_by: { username: 'p' } }), { employeeId: 9, username: 'p' })).toBe(true);
    expect(isAssignedBy(t({}), { employeeId: 3, username: 'p' })).toBe(true);
  });
});
