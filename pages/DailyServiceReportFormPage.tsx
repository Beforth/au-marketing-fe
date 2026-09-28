import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Building2, ChevronLeft, ClipboardCheck, FileText, History, MapPin, Receipt, UserPlus } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DSRForm } from '../components/dsr/DSRForm';
import { ExpenseForm } from '../components/dsr/ExpenseForm';
import { AssignDSRForm } from '../components/dsr/AssignDSRForm';
import { hrmsRBACClient, DSRTask, ExpenseReport } from '../lib/hrms-rbac';
import { getDSRPermissions, canModifyDSR, canModifyExpense } from '../lib/dsr-helpers';
import { DSR_FORMAT_LABEL } from '../lib/dsr-options';
import { useAppSelector } from '../store/hooks';
import { selectToken, selectPermissions, selectUser, selectUserDisplayName } from '../store/slices/authSlice';

/**
 * Full-page create/edit form for HRMS Daily Service Reports (docs/DSR_MODULE_INTEGRATION.md).
 *
 * Routes (App.tsx):
 *   /daily-service-reports/new?tab=indoor|outdoor|expense   — create
 *   /daily-service-reports/new?tab=assign                   — "Assign DSR Task": creates HRMS To-Do tasks (no tab switcher, guide §9.3)
 *   /daily-service-reports/:id/edit                          — edit a DSR (indoor/outdoor)
 *   /daily-service-reports/expense/:id/edit                  — edit an expense report
 * Edit pages take the row from router state (passed by the list page) and fall
 * back to re-fetching the list, since HRMS has no get-one endpoint.
 */
type FormTab = 'indoor' | 'outdoor' | 'expense';

const TAB_META: Record<FormTab, { label: string; icon: React.ElementType }> = {
  indoor: { label: 'Indoor DSR', icon: Building2 },
  outdoor: { label: 'Outdoor DSR (OD Plan & Visit)', icon: MapPin },
  expense: { label: 'Expense Report', icon: FileText },
};

export const DailyServiceReportFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = useAppSelector(selectToken);
  const permissionCodes = useAppSelector(selectPermissions);
  const currentUser = useAppSelector(selectUser);
  const myName = useAppSelector(selectUserDisplayName) || 'Me';
  const perms = useMemo(
    () => getDSRPermissions(permissionCodes, !!currentUser?.is_superuser),
    [permissionCodes, currentUser]
  );

  const isExpenseEdit = location.pathname.includes('/expense/');
  const isEdit = !!id;
  const stateRow = (location.state as { report?: DSRTask | ExpenseReport } | null)?.report;

  const [dsr, setDsr] = useState<DSRTask | null>(isEdit && !isExpenseEdit ? (stateRow as DSRTask) ?? null : null);
  const [expense, setExpense] = useState<ExpenseReport | null>(isEdit && isExpenseEdit ? (stateRow as ExpenseReport) ?? null : null);
  const [loadingRow, setLoadingRow] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Edit opened directly (refresh / pasted link): find the row in the user's list.
  useEffect(() => {
    if (!isEdit || !token || (isExpenseEdit ? expense : dsr)) return;
    setLoadingRow(true);
    const load = isExpenseEdit ? hrmsRBACClient.getExpenses(token) : hrmsRBACClient.getDSR(token);
    load
      .then((rows: Array<DSRTask | ExpenseReport>) => {
        const row = rows.find(r => String(r.id) === id);
        if (!row) setNotFound(true);
        else if (isExpenseEdit) setExpense(row as ExpenseReport);
        else setDsr(row as DSRTask);
      })
      .finally(() => setLoadingRow(false));
  }, [isEdit, isExpenseEdit, id, token, dsr, expense]);

  const availableTabs: FormTab[] = useMemo(() => {
    if (isEdit) {
      if (isExpenseEdit) return ['expense'];
      return dsr?.dsr_type ? [dsr.dsr_type] : [];
    }
    return [
      ...(perms.canCreateIndoor ? ['indoor' as const] : []),
      ...(perms.canCreateOutdoor ? ['outdoor' as const] : []),
      ...(perms.canCreateExpense ? ['expense' as const] : []),
    ];
  }, [isEdit, isExpenseEdit, dsr, perms]);

  const requestedTab = searchParams.get('tab') as FormTab | 'assign' | null;
  const isAssign = !isEdit && requestedTab === 'assign' && perms.canAssign;
  const [tab, setTab] = useState<FormTab | null>(null);
  useEffect(() => {
    if (!availableTabs.length) return;
    setTab(t => (t && availableTabs.includes(t) ? t : requestedTab && availableTabs.includes(requestedTab as FormTab) ? requestedTab as FormTab : availableTabs[0]));
  }, [availableTabs, requestedTab]);

  const historyPath = tab && tab !== 'indoor' ? `/daily-service-reports?tab=${tab}` : '/daily-service-reports';
  const goHistory = () => navigate(historyPath);

  const editAllowed = !isEdit
    || (isExpenseEdit ? !!expense && canModifyExpense('edit', expense, true, perms) : !!dsr && canModifyDSR('edit', dsr, true, perms));

  const pageTitle = isAssign ? 'Assign DSR Task' : tab === 'expense' ? 'Daily Expense Report' : 'Daily Service Report (DSR)';
  const crumb = isEdit ? 'Edit Report' : isAssign ? 'Assign DSR Task' : 'New Report';

  let body: React.ReactNode;
  if (!token) {
    body = null;
  } else if (loadingRow) {
    body = (
      <div className="flex items-center gap-2 py-12 text-slate-500 justify-center">
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading report…
      </div>
    );
  } else if (notFound) {
    body = <p className="py-12 text-center text-sm text-slate-500">This report wasn't found in your reports.</p>;
  } else if (isAssign) {
    body = <AssignDSRForm token={token} onSaved={() => navigate('/my-todo?tab=assigned')} />;
  } else if (!availableTabs.length && !isEdit) {
    body = <p className="py-12 text-center text-sm text-slate-500">You don't have permission to submit reports. Ask HR/Admin for DSR or Expense Report access in HRMS.</p>;
  } else if (!editAllowed) {
    body = <p className="py-12 text-center text-sm text-slate-500">This report can no longer be edited — only your own reports that are still pending approval can be changed.</p>;
  } else if (tab === 'expense') {
    body = <ExpenseForm token={token} existing={expense} myName={myName} onSaved={goHistory} />;
  } else if (tab) {
    body = (
      <DSRForm
        token={token}
        dsrType={tab}
        existing={dsr}
        canAssign={perms.canFileDSRForOthers}
        myName={myName}
        onSaved={goHistory}
      />
    );
  }

  const HeaderIcon = isAssign ? UserPlus : tab === 'expense' ? Receipt : ClipboardCheck;
  const cardTitle = isAssign
    ? 'Assign DSR Task'
    : tab === 'expense'
      ? (isEdit ? 'Edit Expense Report' : 'Log Expense Report')
      : (isEdit ? 'Edit Daily Service Report' : 'Log Daily Service Report');
  const cardSubtitle = isAssign
    ? 'Give one or more people a task with a deadline — it becomes their DSR when they mark it done'
    : tab === 'expense'
      ? 'Enter the day’s travel, lodging and other expenses'
      : tab === 'outdoor'
        ? 'Enter client visit details and outcome'
        : 'Enter task information and optional client calling details';

  return (
    <PageLayout
      title={pageTitle}
      description={isAssign ? 'Assign a To-Do task to your team' : tab === 'expense' ? 'Submit your daily travel and expense claim' : 'Submit daily service task activities and client interactions'}
      breadcrumbs={[
        { label: 'Daily Service Reports', href: '/daily-service-reports' },
        { label: crumb, href: location.pathname },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1 text-slate-600">
            <ChevronLeft size={16} /> Back to Dashboard
          </Button>
          <Button onClick={goHistory} className="flex items-center gap-2">
            <History size={15} /> View DSR History
          </Button>
        </div>
      }
    >
      <div>
        {!isAssign && availableTabs.length > 1 && (
          <div className="mb-4 pb-2 border-b border-slate-200">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100/80 border border-slate-200">
            {availableTabs.map(t => {
              const { label, icon: Icon } = TAB_META[t];
              const active = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
                >
                  <Icon size={16} /> {label}
                </button>
              );
            })}
          </div>
          </div>
        )}

        <Card noPadding>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50/80 rounded-t-xl">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><HeaderIcon size={20} /></div>
            <div>
              <p className="text-base font-semibold text-slate-900">{cardTitle}</p>
              <p className="text-xs text-slate-500">{cardSubtitle}</p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {DSR_FORMAT_LABEL}
            </span>
          </div>
          <div className="px-6 py-6">{body}</div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default DailyServiceReportFormPage;
