import React, { useCallback, useEffect, useState } from 'react';
import { Check, ListTodo } from 'lucide-react';
import { useApp } from '../../App';
import { ConfirmModal } from '../ui/ConfirmModal';
import { hrmsRBACClient, TodoTask } from '../../lib/hrms-rbac';
import { todoAssignedByName, todoDueParts } from '../../lib/todo-helpers';
import { useAppSelector } from '../../store/hooks';
import { selectToken } from '../../store/slices/authSlice';
import { ListCard, ListRow, RowAction, CardSize } from './ListCard';
import { StatusBadge } from './StatusBadge';

const dueText = (t: TodoTask) => {
  const { date, time } = todoDueParts(t);
  if (!date) return '';
  const [y, m, d] = date.split('-');
  return `Due ${d}/${m}/${y}${time ? ` ${time}` : ''}`;
};

/**
 * Dashboard "My To-Do": my pending HRMS tasks (same data as the My To-Do page, pages/MyTodoPage.tsx),
 * overdue first. The tick marks a task done right here (HRMS then creates the DSR) — same call and
 * confirmation as the My To-Do page (components/dsr/TasksPanel.tsx). Rows open the My To-Do page.
 */
export const MyTodoCard: React.FC<{ size?: CardSize }> = ({ size = 'medium' }) => {
  const token = useAppSelector(selectToken);
  const { showToast } = useApp();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [completing, setCompleting] = useState<TodoTask | null>(null);

  const load = useCallback(() => {
    if (!token) { setLoading(false); return () => {}; }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    hrmsRBACClient
      .getTodos(token, { status: 'pending' })
      .then((rows) => {
        if (cancelled) return;
        // Overdue first, then by deadline.
        const key = (t: TodoTask) => `${t.is_overdue ? 0 : 1}${todoDueParts(t).date || '9999'}${todoDueParts(t).time || '99:99'}`;
        setTasks([...rows].sort((a, b) => key(a).localeCompare(key(b))));
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => load(), [load]);

  const doComplete = async () => {
    if (!completing || !token) return;
    try {
      const res = await hrmsRBACClient.completeTodo(token, completing.id);
      showToast(res.dsr_id ? `Done — DSR #${res.dsr_id} created and sent for approval` : 'Task marked done', 'success');
      setTasks((prev) => prev.filter((t) => t.id !== completing.id));
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not complete task', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const overdue = tasks.filter((t) => t.is_overdue).length;

  return (
    <>
    <ListCard
      title="My To-Do"
      subtitle="Tasks assigned to you — marking one done logs it as your DSR"
      size={size}
      viewAllHref="/my-todo"
      headerExtra={overdue > 0 ? <StatusBadge status="danger" label={`${overdue} overdue`} pulse /> : undefined}
      loading={loading}
      error={failed ? 'Could not load your tasks' : null}
      onRetry={load}
      isEmpty={tasks.length === 0}
      emptyIcon={<ListTodo size={20} />}
      emptyMessage="No pending tasks"
      emptyAction={{ label: 'Go to My To-Do', to: '/my-todo' }}
      endNote="That's all your pending tasks"
    >
      {tasks.map((t) => {
        const by = todoAssignedByName(t);
        const title = t.title || `Task #${t.id}`;
        return (
          <ListRow
            key={t.id}
            to="/my-todo"
            name={by || title}
            avatarTone={t.is_overdue ? 'rose' : 'violet'}
            title={title}
            subtitle={[by && `From ${by}`, dueText(t)].filter(Boolean).join(' · ')}
            trailing={
              t.is_overdue
                ? <StatusBadge status="danger" label={t.overdue_by ? `Overdue ${t.overdue_by}` : 'Overdue'} pulse />
                : <StatusBadge status="pending" label="Pending" />
            }
            actions={<RowAction label="Mark done" tone="emerald" onClick={() => setCompleting(t)}><Check size={15} /></RowAction>}
          />
        );
      })}
    </ListCard>
    <ConfirmModal
      isOpen={!!completing}
      onClose={() => setCompleting(null)}
      onConfirm={doComplete}
      title="Mark task as done?"
      message={`"${completing?.title ?? ''}" will be marked done and HRMS will create your DSR for it (hours counted from when it was assigned until now), sent for approval. This can't be undone here.`}
      confirmLabel="Mark done"
      variant="primary"
    />
    </>
  );
};
