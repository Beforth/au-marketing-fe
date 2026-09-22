/**
 * Service module — Stage 4: complaints list + history with filters (Step 13).
 * Sidebar "Complaints". Route: /service/complaints
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { PageLayout } from '../components/layout/PageLayout';
import { SearchInput } from '../components/ui/SearchInput';
import { DataTable } from '../components/ui/DataTable';
import { NewComplaintModal } from '../components/service/NewComplaintModal';
import { CloseComplaintModal } from '../components/service/CloseComplaintModal';
import { ReopenComplaintModal } from '../components/service/ReopenComplaintModal';
import { Tooltip } from '../UI/Tooltip';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { MessageSquareWarning, Plus, ArrowRight, LayoutGrid, List } from 'lucide-react';
import {
  marketingAPI,
  ServiceComplaint,
  ServiceComplaintStatus,
  ServiceIssueType,
} from '../lib/marketing-api';

const STATUS_VARIANT: Record<ServiceComplaintStatus, 'outline' | 'warning' | 'success' | 'error'> = {
  pending_approval: 'error',
  open: 'outline',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'outline',
};
const STATUS_LABEL: Record<ServiceComplaintStatus, string> = {
  pending_approval: 'Needs approval',
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};
const ISSUE_LABEL: Record<ServiceIssueType, string> = { hw: 'H/W', sw: 'S/W', plc: 'PLC' };

const COLUMNS: { status: ServiceComplaintStatus; label: string }[] = [
  { status: 'pending_approval', label: 'Needs approval' },
  { status: 'open', label: 'Open' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'resolved', label: 'Resolved' },
  { status: 'closed', label: 'Closed' },
];

type ViewMode = 'kanban' | 'table';

export const ServiceComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));
  const canCreate = useAppSelector(selectHasPermission('service.create_complaint'));
  const canManage = useAppSelector(selectHasPermission('service.manage_complaint'));
  const canApprove = useAppSelector(selectHasPermission('service.approve_complaint'));
  const canClose = useAppSelector(selectHasPermission('service.close_complaint'));
  const canReopen = useAppSelector(selectHasPermission('service.reopen_complaint'));

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [rows, setRows] = useState<ServiceComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ServiceComplaintStatus>('');
  const [typeFilter, setTypeFilter] = useState<'' | ServiceIssueType>('');

  const [newOpen, setNewOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<ServiceComplaint | null>(null);
  const [reopenTarget, setReopenTarget] = useState<ServiceComplaint | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ServiceComplaintStatus | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  const load = () => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    marketingAPI
      .getServiceComplaints({ status: statusFilter || undefined, issue_type: typeFilter || undefined })
      .then(setRows)
      .catch((e) => {
        showToast(e?.message || 'Failed to load complaints', 'error');
        setRows([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [canView, statusFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (c) =>
        c.display_number.toLowerCase().includes(t) ||
        c.title.toLowerCase().includes(t) ||
        (c.customer_name || '').toLowerCase().includes(t) ||
        (c.plant_name || '').toLowerCase().includes(t) ||
        (c.assignee_username || '').toLowerCase().includes(t),
    );
  }, [rows, search]);

  const byStatus = useMemo(() => {
    const map: Record<ServiceComplaintStatus, ServiceComplaint[]> = {
      pending_approval: [], open: [], in_progress: [], resolved: [], closed: [],
    };
    filtered.forEach((c) => { map[c.status]?.push(c); });
    return map;
  }, [filtered]);

  const patchRow = (updated: ServiceComplaint) => {
    setRows((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  };

  /**
   * What happens when a card is dropped on a column. Not every transition is a
   * plain status update — Close needs actual hours, Reopen needs a mandatory
   * reason, and pending_approval can only ever move to Open (via Approve).
   * Same rules the detail page enforces, just triggered by a drop instead of a button.
   */
  const applyMove = async (c: ServiceComplaint, target: ServiceComplaintStatus) => {
    if (c.status === target) return;

    if (target === 'pending_approval') {
      showToast('Complaints cannot be moved back to "Needs approval"', 'error');
      return;
    }
    if (c.status === 'pending_approval') {
      if (target !== 'open') {
        showToast('An issue needing approval can only move to Open, via Approve', 'error');
        return;
      }
      if (!canApprove) return showToast('You do not have permission to approve this', 'error');
      setMovingId(c.id);
      try {
        patchRow(await marketingAPI.approveServiceComplaint(c.id));
        showToast('Approved', 'success');
      } catch (e: any) {
        showToast(e?.message || 'Failed to approve', 'error');
      } finally {
        setMovingId(null);
      }
      return;
    }
    if (target === 'closed') {
      if (!canClose) return showToast('You do not have permission to close complaints', 'error');
      setCloseTarget(c);
      return;
    }
    if (c.status === 'closed') {
      if (!canReopen) return showToast('You do not have permission to reopen complaints', 'error');
      setReopenTarget(c);
      return;
    }
    if (!canManage) return showToast('You do not have permission to change complaint status', 'error');
    setMovingId(c.id);
    try {
      patchRow(await marketingAPI.setServiceComplaintStatus(c.id, target as 'open' | 'in_progress' | 'resolved'));
    } catch (e: any) {
      showToast(e?.message || 'Failed to update status', 'error');
    } finally {
      setMovingId(null);
    }
  };

  const canDrag = canManage || canApprove || canClose || canReopen;

  const breadcrumbs = [{ label: 'Service', href: '/service/contracts' }, { label: 'Complaints' }];

  if (!canView) {
    return (
      <PageLayout title="Complaints" breadcrumbs={breadcrumbs}>
        <Card><p className="text-slate-600">You do not have permission to view complaints.</p></Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Complaints"
      description="Customer machine complaints — every ticket, with full history."
      breadcrumbs={breadcrumbs}
      actions={
        canCreate ? (
          <Button size="sm" onClick={() => setNewOpen(true)} leftIcon={<Plus size={14} strokeWidth={3} />}>
            New Complaint
          </Button>
        ) : null
      }
    >
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Filter by number, title, customer, plant, assignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          containerClassName="max-w-sm shadow-none"
        />
        <div className="w-44">
          <Select
            options={[
              { value: '', label: 'All statuses' },
              ...(Object.keys(STATUS_LABEL) as ServiceComplaintStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
            ]}
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as ServiceComplaintStatus) || '')}
            searchable={false}
          />
        </div>
        <div className="w-36">
          <Select
            options={[
              { value: '', label: 'All types' },
              { value: 'hw', label: 'Hardware' },
              { value: 'sw', label: 'Software' },
              { value: 'plc', label: 'PLC' },
            ]}
            value={typeFilter}
            onChange={(v) => setTypeFilter((v as ServiceIssueType) || '')}
            searchable={false}
          />
        </div>
        <div className="flex-1" />
        <SegmentToggle<ViewMode>
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'kanban', label: 'Kanban', icon: LayoutGrid },
            { value: 'table', label: 'Table', icon: List },
          ]}
        />
      </div>

      {isLoading ? (
        <Card><div className="py-24 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-24 text-center">
            <MessageSquareWarning className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">No complaints</p>
            <p className="text-slate-500 text-sm mt-2">Raise one with “New Complaint”.</p>
          </div>
        </Card>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              className={`flex-shrink-0 w-72 bg-slate-50 rounded-2xl border flex flex-col max-h-[calc(100vh-260px)] transition-colors ${dragOverStatus === col.status ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200/80'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.status); }}
              onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStatus(null);
                const id = draggingId;
                setDraggingId(null);
                const c = id != null ? rows.find((r) => r.id === id) : undefined;
                if (c) applyMove(c, col.status);
              }}
            >
              <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-sm uppercase tracking-wide text-slate-600">{col.label}</span>
                <span className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">({byStatus[col.status].length})</span>
                  {col.status === 'open' && canCreate && (
                    <Tooltip content="Add complaint to Open">
                      <button type="button" onClick={() => setNewOpen(true)} className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-500">
                        <Plus size={16} strokeWidth={2.5} />
                      </button>
                    </Tooltip>
                  )}
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 scrollbar-hide">
                {byStatus[col.status].map((c) => (
                  <div
                    key={c.id}
                    draggable={canDrag}
                    onDragStart={() => setDraggingId(c.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
                    onClick={() => navigate(`/service/complaints/${c.id}`)}
                    className={`bg-white rounded-xl border border-slate-200 p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all ${draggingId === c.id ? 'opacity-40' : ''} ${movingId === c.id ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">{c.display_number}</span>
                      <Badge variant="outline">{ISSUE_LABEL[c.issue_type]}</Badge>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 mb-2">{c.title}</p>
                    <div className="text-xs text-slate-500">{c.customer_name || '—'}{c.plant_name ? ` · ${c.plant_name}` : ''}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">{c.assignee_username || 'Unassigned'}</span>
                      {c.reopen_count > 0 && <span className="text-[11px] text-amber-600">reopened ×{c.reopen_count}</span>}
                    </div>
                  </div>
                ))}
                {byStatus[col.status].length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No complaints here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card noPadding contentClassName="py-0" className="overflow-hidden">
          <DataTable<ServiceComplaint>
            bordered={false}
            data={filtered}
            rowKey={(c) => c.id}
            onRowClick={(c) => navigate(`/service/complaints/${c.id}`)}
            dense
            showVerticalLines
            columns={[
              {
                key: 'display_number',
                label: 'Complaint',
                render: (c) => (
                  <div>
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      {c.display_number}
                      <Badge variant="outline">{ISSUE_LABEL[c.issue_type]}</Badge>
                      {c.reopen_count > 0 && <span className="text-[11px] text-amber-600">reopened ×{c.reopen_count}</span>}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[280px]">{c.title}</div>
                  </div>
                ),
              },
              {
                key: 'customer_name',
                label: 'Customer / Plant',
                render: (c) => (
                  <div>
                    <div className="text-sm text-slate-900">{c.customer_name || '—'}</div>
                    <div className="text-xs text-slate-500">{c.plant_name || '—'}</div>
                  </div>
                ),
              },
              { key: 'assignee_username', label: 'Assigned to', render: (c) => <span className="text-sm text-slate-600">{c.assignee_username || <span className="text-slate-400">Unassigned</span>}</span> },
              {
                key: 'status',
                label: 'Status',
                render: (c) => <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>,
              },
              {
                key: 'actions',
                label: '',
                sortable: false,
                align: 'right',
                render: (c) => (
                  <Tooltip content="Open complaint">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="w-8 h-8 p-0 text-blue-600 hover:bg-transparent"
                      onClick={(e) => { e.stopPropagation(); navigate(`/service/complaints/${c.id}`); }}
                    >
                      <ArrowRight size={16} />
                    </Button>
                  </Tooltip>
                ),
              },
            ]}
          />
        </Card>
      )}

      <NewComplaintModal
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(c) => setRows((rs) => [c, ...rs])}
      />
      {closeTarget && (
        <CloseComplaintModal
          complaint={closeTarget}
          isOpen={!!closeTarget}
          onClose={() => setCloseTarget(null)}
          onClosed={patchRow}
        />
      )}
      {reopenTarget && (
        <ReopenComplaintModal
          complaint={reopenTarget}
          isOpen={!!reopenTarget}
          onClose={() => setReopenTarget(null)}
          onReopened={patchRow}
        />
      )}
    </PageLayout>
  );
};
