import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, FileText, MapPin, Plus, RefreshCw, Search } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { DSRHistoryTable, ExpenseHistoryTable, RowActions } from '../components/dsr/DSRHistoryTable';
import { ApproveModal, RejectModal, ApprovalTarget } from '../components/dsr/ApprovalModals';
import { useEmployeeOptions } from '../components/dsr/useEmployeeOptions';
import { PendingApprovalsPanel, pendingCount } from '../components/dsr/PendingApprovalsPanel';
import { hrmsRBACClient, DSRStatus, DSRTask, ExpenseReport, PendingDSR, PendingExpense } from '../lib/hrms-rbac';
import { getDSRPermissions, canModifyDSR, canModifyExpense, matchesSearch, paginate, DSR_PENDING_CHANGED_EVENT } from '../lib/dsr-helpers';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectToken, selectPermissions, selectUser, selectUserDisplayName, selectEmployee } from '../store/slices/authSlice';
import { DSR_FORMAT_LABEL } from '../lib/dsr-options';

/**
 * "View DSR History" for HRMS Daily Service Reports + Expense Reports
 * (docs/DSR_MODULE_INTEGRATION.md §9.4). Separate from the Marketing "DSR" page (pages/DSRPage.tsx).
 * Create/edit live on DailyServiceReportFormPage.
 *
 * Same 4 tabs as HRMS's "Daily Service Report History & Log" (templates/employees/daily_service_report_view.html):
 * URL ?tab=indoor|outdoor|expense|pending — "pending" = Pending My Approval (guide §9.7), shown only when
 * something is waiting on me. To-Do tasks live on their own page (pages/MyTodoPage.tsx), as in HRMS.
 */
type ReportTab = 'indoor' | 'outdoor' | 'expense';
type Tab = ReportTab | 'pending';

const TABS: { key: ReportTab; label: string; icon: React.ElementType; search: string }[] = [
  { key: 'indoor', label: 'Indoor DSR', icon: Building2, search: 'Search tasks, person, remarks...' },
  { key: 'outdoor', label: 'Outdoor DSR (Marketing View)', icon: MapPin, search: 'Search company, visit, person...' },
  { key: 'expense', label: 'Expense Report', icon: FileText, search: 'Search destination, company...' },
];

const STATUS_OPTIONS: { value: '' | DSRStatus; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const filterInput = 'h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500';

export const DailyServiceReportsPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const token = useAppSelector(selectToken);
  const permissionCodes = useAppSelector(selectPermissions);
  const currentUser = useAppSelector(selectUser);
  const myName = useAppSelector(selectUserDisplayName) || 'Me';
  const perms = useMemo(
    () => getDSRPermissions(permissionCodes, !!currentUser?.is_superuser),
    [permissionCodes, currentUser]
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeProfile = useAppSelector(selectEmployee);

  // ── Pending My Approval (guide §3.7 / §9.7) ──
  const [pending, setPending] = useState<{ dsr: PendingDSR[]; expense: PendingExpense[] }>({ dsr: [], expense: [] });
  const [pendingLoading, setPendingLoading] = useState(false);
  const [everHadPending, setEverHadPending] = useState(false);
  const loadPending = useCallback(async () => {
    if (!token) return;
    setPendingLoading(true);
    try {
      const p = await hrmsRBACClient.getPendingApprovals(token);
      setPending(p);
      if (pendingCount(p) > 0) setEverHadPending(true);
    } finally {
      setPendingLoading(false);
    }
  }, [token]);
  useEffect(() => { loadPending(); }, [loadPending]);
  const pendingChanged = useCallback(() => {
    loadPending();
    window.dispatchEvent(new Event(DSR_PENDING_CHANGED_EVENT));
  }, [loadPending]);

  const reportTabs = TABS.filter(t => t.key !== 'expense' || perms.canViewExpense);
  const tabParam = searchParams.get('tab') as Tab | null;
  // Non-approvers never see the approval tab; once it has shown this visit it stays (so "all caught up" can show).
  const showPendingTab = everHadPending || tabParam === 'pending';
  const extraTabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    ...(showPendingTab ? [{ key: 'pending' as Tab, label: 'Pending My Approval', icon: CheckCircle2, count: pendingCount(pending) }] : []),
  ];
  const allTabKeys: Tab[] = [...reportTabs.map(t => t.key), ...extraTabs.map(t => t.key)];
  const tab: Tab = tabParam && allTabKeys.includes(tabParam) ? tabParam : 'indoor';
  const isReportTab = tab === 'indoor' || tab === 'outdoor' || tab === 'expense';
  const isExpense = tab === 'expense';

  // ── Filters (guide §9.4 filter bar) ──
  const [q, setQ] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [status, setStatus] = useState<'' | DSRStatus>('');
  const [employee, setEmployee] = useState(''); // HRMS username; '' = me
  const [page, setPage] = useState(1);
  const canViewAll = isExpense ? perms.canViewAllExpense : perms.canViewAllDSR;
  const employeeOptions = useEmployeeOptions(perms.canViewAllDSR || perms.canViewAllExpense || perms.canAssign);

  const resetFilters = () => {
    setQ('');
    setFilterDate('');
    setStatus('');
    setEmployee('');
    setPage(1);
  };
  const switchTab = (t: Tab) => {
    resetFilters();
    setSearchParams(t === 'indoor' ? {} : { tab: t }, { replace: true });
  };

  // ── Data ──
  const [dsrRows, setDsrRows] = useState<DSRTask[]>([]);
  const [expenseRows, setExpenseRows] = useState<ExpenseReport[]>([]);
  const [loading, setLoading] = useState(false);

  const username = canViewAll && employee ? employee : undefined;
  const load = useCallback(async () => {
    if (!token || !isReportTab) return;
    setLoading(true);
    try {
      const params = { username, filter_date: filterDate || undefined, status: status || undefined };
      if (isExpense) setExpenseRows(await hrmsRBACClient.getExpenses(token, params));
      else setDsrRows(await hrmsRBACClient.getDSR(token, { ...params, type: tab as 'indoor' | 'outdoor' }));
    } finally {
      setLoading(false);
    }
  }, [token, isReportTab, isExpense, tab, username, filterDate, status]);

  useEffect(() => { load(); }, [load]);

  // Count on every tab, like HRMS (for the selected employee, no other filters).
  const [tabCounts, setTabCounts] = useState<Record<ReportTab, number | null>>({ indoor: null, outdoor: null, expense: null });
  const loadCounts = useCallback(async () => {
    if (!token) return;
    const [ind, out, exp] = await Promise.all([
      hrmsRBACClient.getDSR(token, { username, type: 'indoor' }),
      hrmsRBACClient.getDSR(token, { username, type: 'outdoor' }),
      perms.canViewExpense ? hrmsRBACClient.getExpenses(token, { username }) : Promise.resolve([]),
    ]);
    setTabCounts({ indoor: ind.length, outdoor: out.length, expense: exp.length });
  }, [token, username, perms.canViewExpense]);
  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { setPage(1); }, [q, filterDate, status, employee, tab]);

  const isOwn = !username || username === currentUser?.username;
  const selectedOption = username ? employeeOptions.find(o => o.value === username) : undefined;
  const employeeName = username ? (selectedOption?.label ?? username) : myName;
  const employeeCode = username ? selectedOption?.code ?? null : (employeeProfile?.employee_id ?? null);

  const filteredDsr = useMemo(() => dsrRows.filter(r => matchesSearch(r, q)), [dsrRows, q]);
  const filteredExpense = useMemo(() => expenseRows.filter(r => matchesSearch(r, q)), [expenseRows, q]);
  const pageInfo = paginate<DSRTask | ExpenseReport>(isExpense ? filteredExpense : filteredDsr, page);

  // ── Approve / Reject (one shared pair, guide §9.5) + Delete ──
  const [approveTarget, setApproveTarget] = useState<ApprovalTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalTarget | null>(null);
  const [deleting, setDeleting] = useState<{ id: number; kind: 'dsr' | 'expense' } | null>(null);

  const targetFor = (id: number, date: string): ApprovalTarget => ({
    id, kind: isExpense ? 'expense' : 'dsr', employeeName, date,
  });

  const confirmApprove = async (comments: string) => {
    if (!approveTarget || !token) return;
    try {
      const res = approveTarget.kind === 'expense'
        ? await hrmsRBACClient.approveExpense(token, approveTarget.id, comments || undefined)
        : await hrmsRBACClient.approveDSR(token, approveTarget.id, comments || undefined);
      showToast(res.message || (res.status === 'approved' ? 'Fully approved' : 'Approved — sent to the next approver'), 'success');
      setApproveTarget(null);
      load();
      loadCounts();
      pendingChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not approve', 'error');
    }
  };

  const confirmReject = async (reason: string) => {
    if (!rejectTarget || !token) return;
    try {
      if (rejectTarget.kind === 'expense') await hrmsRBACClient.rejectExpense(token, rejectTarget.id, reason);
      else await hrmsRBACClient.rejectDSR(token, rejectTarget.id, reason);
      showToast('Rejected', 'success');
      setRejectTarget(null);
      load();
      loadCounts();
      pendingChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not reject', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleting || !token) return;
    try {
      if (deleting.kind === 'expense') await hrmsRBACClient.deleteExpense(token, deleting.id);
      else await hrmsRBACClient.deleteDSR(token, deleting.id);
      showToast('Entry deleted', 'success');
      load();
      loadCounts();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not delete', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const dsrActions: RowActions<DSRTask> = {
    canApprove: r => perms.canApproveDSR && r.status === 'pending_approval',
    canEdit: r => canModifyDSR('edit', r, isOwn, perms),
    canDelete: r => canModifyDSR('delete', r, isOwn, perms),
    onApprove: r => setApproveTarget(targetFor(r.id, r.date)),
    onReject: r => setRejectTarget(targetFor(r.id, r.date)),
    onEdit: r => navigate(`/daily-service-reports/${r.id}/edit`, { state: { report: r } }),
    onDelete: r => setDeleting({ id: r.id, kind: 'dsr' }),
  };
  const expenseActions: RowActions<ExpenseReport> = {
    canApprove: r => perms.canApproveExpense && r.status === 'pending_approval',
    canEdit: r => canModifyExpense('edit', r, isOwn, perms),
    canDelete: r => canModifyExpense('delete', r, isOwn, perms),
    onApprove: r => setApproveTarget(targetFor(r.id, r.date)),
    onReject: r => setRejectTarget(targetFor(r.id, r.date)),
    onEdit: r => navigate(`/daily-service-reports/expense/${r.id}/edit`, { state: { report: r } }),
    onDelete: r => setDeleting({ id: r.id, kind: 'expense' }),
  };

  const canLog = isExpense ? perms.canCreateExpense : tab === 'indoor' ? perms.canCreateIndoor : perms.canCreateOutdoor;
  const activeTab = TABS.find(t => t.key === tab) ?? TABS[0];
  const tabBtn = (active: boolean) =>
    `inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`;

  return (
    <PageLayout
      title="Daily Service Report History & Log"
      description="Review submitted daily service reports, calling records, and approval statuses"
      breadcrumbs={[{ label: 'Daily Service Reports', href: '/daily-service-reports' }, { label: 'History & Log', href: '/daily-service-reports' }]}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-1 text-slate-600">
            <ChevronLeft size={16} /> Back to Dashboard
          </Button>
          {(perms.canCreateIndoor || perms.canCreateOutdoor || perms.canCreateExpense) && (
            <Button
              onClick={() => navigate(`/daily-service-reports/new${isReportTab && tab !== 'indoor' && canLog ? `?tab=${tab}` : ''}`)}
              className="flex items-center gap-2"
            >
              <Plus size={15} /> Log New DSR
            </Button>
          )}
        </div>
      }
    >
      {/* Tabs (same pill style as the create page) */}
      <div className="mb-4 pb-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100/80 border border-slate-200">
          {reportTabs.map(t => (
            <button key={t.key} type="button" onClick={() => switchTab(t.key)} className={tabBtn(t.key === tab)}>
              <t.icon size={16} /> {t.label}
              {tabCounts[t.key] != null && (
                <span className={`ml-0.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 text-[11px] font-bold ${t.key === tab ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/70 text-slate-600'}`}>
                  {tabCounts[t.key]}
                </span>
              )}
            </button>
          ))}
          {extraTabs.map(t => (
            <button key={t.key} type="button" onClick={() => switchTab(t.key)} className={tabBtn(t.key === tab)}>
              <t.icon size={16} /> {t.label}
              {t.count != null && (
                <span className={`ml-0.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 text-[11px] font-bold ${t.count > 0 ? 'bg-orange-500 text-white' : 'bg-slate-200/70 text-slate-600'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {DSR_FORMAT_LABEL}
        </span>
      </div>

      {tab === 'pending' && token && (
        <PendingApprovalsPanel token={token} pending={pending} loading={pendingLoading && !pendingCount(pending)} onChanged={pendingChanged} />
      )}

      {isReportTab && (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="bg-slate-50/80 border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[15rem]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder={activeTab.search}
                className={`${filterInput} w-full pl-9 placeholder:text-slate-400`} />
            </div>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={filterInput} aria-label="Filter by date" />
            <select value={status} onChange={e => setStatus(e.target.value as '' | DSRStatus)} className={filterInput} aria-label="Filter by status">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {canViewAll && (
              <select value={employee} onChange={e => setEmployee(e.target.value)} className={`${filterInput} max-w-[14rem]`} aria-label="Filter by employee">
                <option value="">{myName} ({employeeProfile?.employee_id || 'Staff'})</option>
                {employeeOptions.filter(o => o.value !== currentUser?.username).map(o => <option key={o.value} value={o.value}>{o.label} ({o.code || 'Staff'})</option>)}
              </select>
            )}
          </div>
          <button type="button" onClick={resetFilters}
            className="inline-flex h-9 items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors self-start md:self-auto">
            <RefreshCw size={13} /> Reset Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-12 text-slate-500 justify-center text-sm">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading…
            </div>
          ) : isExpense ? (
            <ExpenseHistoryTable rows={pageInfo.items as ExpenseReport[]} employeeName={employeeName} employeeCode={employeeCode} actions={expenseActions} />
          ) : (
            <DSRHistoryTable kind={tab as 'indoor' | 'outdoor'} rows={pageInfo.items as DSRTask[]} employeeName={employeeName} employeeCode={employeeCode} actions={dsrActions} />
          )}
        </div>

        {/* Pagination footer (15 rows/page) */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{pageInfo.from}</span> to{' '}
            <span className="font-semibold text-slate-900">{pageInfo.to}</span> of{' '}
            <span className="font-semibold text-slate-900">{pageInfo.total}</span> entries
          </div>
          {pageInfo.pages > 1 && (
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={pageInfo.page <= 1} onClick={() => setPage(pageInfo.page - 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded">Page {pageInfo.page} of {pageInfo.pages}</span>
              <button type="button" disabled={pageInfo.page >= pageInfo.pages} onClick={() => setPage(pageInfo.page + 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      <ApproveModal target={approveTarget} onClose={() => setApproveTarget(null)} onConfirm={confirmApprove} />
      <RejectModal target={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={confirmReject} />
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete entry?"
        message={`Delete this ${deleting?.kind === 'expense' ? 'expense report' : 'DSR entry'}? This also removes its approval history in HRMS.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </PageLayout>
  );
};

export default DailyServiceReportsPage;
