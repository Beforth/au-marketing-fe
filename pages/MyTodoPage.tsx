import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ListTodo, UserPlus, Users } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { TasksPanel } from '../components/dsr/TasksPanel';
import { useEmployeeOptions } from '../components/dsr/useEmployeeOptions';
import { getDSRPermissions } from '../lib/dsr-helpers';
import { useAppSelector } from '../store/hooks';
import { selectToken, selectPermissions, selectUser, selectEmployee } from '../store/slices/authSlice';

/**
 * "My To-Do" — HRMS To-Do tasks (guide §9.3 "REST API for ToDoItem"). Its own page, like HRMS's
 * /todo/ page, separate from DSR History (which keeps HRMS's 4 tabs).
 * - My Tasks: tasks assigned to me — Mark done (HRMS creates the DSR), Edit, Delete.
 * - Tasks I Assigned (dsr.assign_task): pick an employee → tasks I gave them — Edit, Delete.
 * URL: ?tab=mine|assigned
 */
type Tab = 'mine' | 'assigned';

export const MyTodoPage: React.FC = () => {
  const navigate = useNavigate();
  const token = useAppSelector(selectToken);
  const permissionCodes = useAppSelector(selectPermissions);
  const currentUser = useAppSelector(selectUser);
  const employeeProfile = useAppSelector(selectEmployee);
  const perms = useMemo(() => getDSRPermissions(permissionCodes, !!currentUser?.is_superuser), [permissionCodes, currentUser]);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get('tab') === 'assigned' && perms.canAssign ? 'assigned' : 'mine';
  const employeeOptions = useEmployeeOptions(perms.canAssign);
  const me = useMemo(
    () => ({ employeeId: employeeProfile?.id ?? null, username: currentUser?.username ?? null }),
    [employeeProfile, currentUser]
  );

  const tabBtn = (active: boolean) =>
    `inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`;

  return (
    <PageLayout
      title="My To-Do"
      description="Tasks assigned to you — mark one done and HRMS logs it as your DSR"
      breadcrumbs={[{ label: 'My To-Do', href: '/my-todo' }]}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1 text-slate-600">
            <ChevronLeft size={16} /> Back to Dashboard
          </Button>
          {perms.canAssign && (
            <Button onClick={() => navigate('/daily-service-reports/new?tab=assign')} className="flex items-center gap-2">
              <UserPlus size={15} /> Assign Task
            </Button>
          )}
        </div>
      }
    >
      {perms.canAssign && (
        <div className="mb-4 pb-2 border-b border-slate-200">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100/80 border border-slate-200">
            <button type="button" onClick={() => setSearchParams({}, { replace: true })} className={tabBtn(tab === 'mine')}>
              <ListTodo size={16} /> My Tasks
            </button>
            <button type="button" onClick={() => setSearchParams({ tab: 'assigned' }, { replace: true })} className={tabBtn(tab === 'assigned')}>
              <Users size={16} /> Tasks I Assigned
            </button>
          </div>
        </div>
      )}

      {token && tab === 'mine' && <TasksPanel token={token} mode="mine" />}
      {token && tab === 'assigned' && <TasksPanel token={token} mode="assigned" employees={employeeOptions} me={me} />}
    </PageLayout>
  );
};

export default MyTodoPage;
