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
import { PageLayout } from '../components/layout/PageLayout';
import { SearchInput } from '../components/ui/SearchInput';
import { DataTable } from '../components/ui/DataTable';
import { Tooltip } from '../UI/Tooltip';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { MessageSquareWarning, Plus, ArrowRight } from 'lucide-react';
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

export const ServiceComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));
  const canCreate = useAppSelector(selectHasPermission('service.create_complaint'));

  const [rows, setRows] = useState<ServiceComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ServiceComplaintStatus>('');
  const [typeFilter, setTypeFilter] = useState<'' | ServiceIssueType>('');

  useEffect(() => {
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
  }, [canView, statusFilter, typeFilter, showToast]);

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
          <Button size="sm" onClick={() => navigate('/service/complaints/new')} leftIcon={<Plus size={14} strokeWidth={3} />}>
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
      </div>

      <Card noPadding contentClassName="py-0" className="overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <MessageSquareWarning className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">No complaints</p>
            <p className="text-slate-500 text-sm mt-2">Raise one with “New Complaint”.</p>
          </div>
        ) : (
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
        )}
      </Card>
    </PageLayout>
  );
};
