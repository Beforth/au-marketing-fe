/**
 * Service module — Stage 3: all work orders.
 * Sidebar "Work Orders". Route: /service/work-orders
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { SearchInput } from '../components/ui/SearchInput';
import { DataTable } from '../components/ui/DataTable';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectEmployee, selectUser } from '../store/slices/authSlice';
import { ClipboardList, PackageCheck, SquarePen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../UI/Tooltip';
import { marketingAPI, ServiceWorkOrder, ServiceWorkOrderStatus, workOrderPath } from '../lib/marketing-api';

const NEXT_STEP: Record<ServiceWorkOrderStatus, string> = {
  prepared: 'Next: coordinator marks it Checked',
  checked: 'Next: manager Approves it',
  approved: 'Approved — the store sends the parts',
};

const STATUS_VARIANT: Record<ServiceWorkOrderStatus, 'outline' | 'warning' | 'success'> = {
  prepared: 'outline',
  checked: 'warning',
  approved: 'success',
};

export const ServiceWorkOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));
  const myDepartment = useAppSelector(selectEmployee)?.department || null;
  const myUsername = (useAppSelector(selectUser)?.username || '').toLowerCase();

  const [rows, setRows] = useState<ServiceWorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ServiceWorkOrderStatus>('');
  const [deptFilter, setDeptFilter] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [waitingForMe, setWaitingForMe] = useState(false);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    marketingAPI
      .getServiceWorkOrders({ status: statusFilter || undefined })
      .then(setRows)
      .catch((e) => {
        showToast(e?.message || 'Failed to load work orders', 'error');
        setRows([]);
      })
      .finally(() => setIsLoading(false));
  }, [canView, statusFilter, showToast]);

  const departmentNames = useMemo(
    () => Array.from(new Set(rows.flatMap((w) => (w.departments ?? []).map((d) => d.name)))).sort(),
    [rows],
  );

  // work orders where it is this person's turn to approve (HRMS approval template)
  const isWaitingForMe = (w: ServiceWorkOrder) => {
    if (!myUsername || w.status === 'approved') return false;
    const step = (w.approval_chain ?? [])[w.current_level ?? 0];
    return !!step && (step.approver_username || '').toLowerCase() === myUsername;
  };
  const waitingCount = useMemo(() => rows.filter(isWaitingForMe).length, [rows, myUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    const mine = (myDepartment || '').trim().toLowerCase();
    const base = rows.filter(
      (w) =>
        (!deptFilter || (w.departments ?? []).some((d) => d.name === deptFilter)) &&
        (!onlyMine || (!!mine && (w.departments ?? []).some((d) => d.name.trim().toLowerCase() === mine))) &&
        (!waitingForMe || isWaitingForMe(w)),
    );
    if (!t) return base;
    return base.filter(
      (w) =>
        (w.departments ?? []).some((d) => d.name.toLowerCase().includes(t)) ||
        (w.wo_number || '').toLowerCase().includes(t) ||
        (w.customer_name || '').toLowerCase().includes(t) ||
        (w.contract_number || '').toLowerCase().includes(t) ||
        (w.visit_title || '').toLowerCase().includes(t),
    );
  }, [rows, search, deptFilter, onlyMine, myDepartment, waitingForMe, myUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  const breadcrumbs = [{ label: 'Service', href: '/service/contracts' }, { label: 'Work Orders' }];

  if (!canView) {
    return (
      <PageLayout title="Work Orders" breadcrumbs={breadcrumbs}>
        <Card><p className="text-slate-600">You do not have permission to view work orders.</p></Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Work Orders" description="Prepared → Checked → Approved." breadcrumbs={breadcrumbs}>
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Filter by WO number, customer, contract, visit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          containerClassName="max-w-sm shadow-none"
        />
        <div className="w-48">
          <Select
            options={[{ value: '', label: 'All departments' }, ...departmentNames.map((n) => ({ value: n, label: n }))]}
            value={deptFilter}
            onChange={(v) => setDeptFilter((v as string) || '')}
            searchable={false}
          />
        </div>
        <button
          type="button"
          onClick={() => setWaitingForMe((v) => !v)}
          className={`h-9 px-3 rounded-lg border text-sm font-medium transition-colors inline-flex items-center gap-2 ${waitingForMe ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          title="Work orders where it is your turn to approve"
        >
          Waiting for me
          {waitingCount > 0 && (
            <span className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">{waitingCount}</span>
          )}
        </button>
        {myDepartment && (
          <button
            type="button"
            onClick={() => setOnlyMine((v) => !v)}
            className={`h-9 px-3 rounded-lg border text-sm font-medium transition-colors ${onlyMine ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            title={`Only work orders sent to ${myDepartment}`}
          >
            My department
          </button>
        )}
        <div className="w-44">
          <Select
            options={[
              { value: '', label: 'All statuses' },
              { value: 'prepared', label: 'Prepared' },
              { value: 'checked', label: 'Checked' },
              { value: 'approved', label: 'Approved' },
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as ServiceWorkOrderStatus) || '')}
            searchable={false}
          />
        </div>
      </div>

      <Card noPadding contentClassName="py-0" className="overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <ClipboardList className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">No work orders</p>
            <p className="text-slate-500 text-sm mt-2">Create one from a visit on its contract's Service Plan.</p>
          </div>
        ) : (
          <DataTable<ServiceWorkOrder>
            bordered={false}
            data={filtered}
            rowKey={(w) => w.id}
            onRowClick={(w) => navigate(workOrderPath(w))}
            dense
            showVerticalLines
            columns={[
              {
                key: 'wo_number',
                label: 'Work order',
                render: (w) => (
                  <div>
                    <div className="font-medium text-slate-900">{w.wo_number || `WO #${w.id}`}</div>
                    <div className="text-xs text-slate-500">{w.visit_id ? `${w.visit_title || `Visit #${w.visit_id}`}${w.visit_date ? ` · ${w.visit_date}` : ''}` : 'Whole contract — all visits'}</div>
                  </div>
                ),
              },
              {
                key: 'files',
                label: 'Files',
                render: (w) => <span className="text-sm text-slate-600">{(w.files ?? []).length || <span className="text-slate-400">—</span>}</span>,
              },
              {
                key: 'departments',
                label: 'Department',
                render: (w) => <span className="text-sm text-slate-600">{(w.departments ?? []).map((d) => d.name).join(', ') || <span className="text-slate-400">—</span>}</span>,
              },
              {
                key: 'customer_name',
                label: 'Customer',
                render: (w) => (
                  <div>
                    <div className="text-sm text-slate-900">{w.customer_name || '—'}</div>
                    {w.plant_name && <div className="text-xs text-slate-500">{w.plant_name}</div>}
                  </div>
                ),
              },
              { key: 'contract_number', label: 'Contract', render: (w) => <span className="text-sm text-slate-600">{w.contract_number || '—'}</span> },
              {
                key: 'status',
                label: 'Status',
                render: (w) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[w.status]}>{w.status.charAt(0).toUpperCase() + w.status.slice(1)}</Badge>
                      {w.revision > 0 && <span className="text-[11px] text-amber-600">edited {w.revision}×</span>}
                      {(w.times_reopened ?? 0) > 0 && <Badge variant="warning">Reopened {w.times_reopened}×</Badge>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {(w.approval_chain ?? []).length > 0 && w.status !== 'approved'
                        ? (() => {
                            const step = (w.approval_chain ?? [])[w.current_level ?? 0];
                            return `Waiting for ${step?.approver_name || step?.approver_username || 'approver'} (level ${(w.current_level ?? 0) + 1} of ${(w.approval_chain ?? []).length})`;
                          })()
                        : NEXT_STEP[w.status]}
                    </div>
                  </div>
                ),
              },
              { key: 'materials', label: 'Parts', render: (w) => <span className="text-sm text-slate-600">{w.dispatch_summary || '—'}</span> },
              {
                key: 'actions',
                label: '',
                sortable: false,
                align: 'right',
                render: (w) => (
                  <div className="flex items-center justify-end gap-1">
                    {w.status === 'approved' && (
                      <Tooltip content="Go to Store / Dispatch">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="w-8 h-8 p-0 text-slate-500 hover:text-blue-700 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/service/store');
                          }}
                        >
                          <PackageCheck size={16} />
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip content="Open work order">
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(workOrderPath(w));
                        }}
                      >
                        <SquarePen size={16} />
                      </Button>
                    </Tooltip>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>
    </PageLayout>
  );
};
