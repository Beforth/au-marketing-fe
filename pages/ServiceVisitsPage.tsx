/**
 * Service module — Stage 2: global list of all service visits.
 * Sidebar "Service Plan". Route: /service/visits
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
import { selectHasPermission } from '../store/slices/authSlice';
import { CalendarClock, CalendarDays, ClipboardList, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../UI/Tooltip';
import {
  marketingAPI,
  ServiceVisit,
  ServiceVisitStatus,
  SERVICE_VISIT_STATUSES,
} from '../lib/marketing-api';

const VISIT_STATUS_VARIANT: Record<ServiceVisitStatus, 'success' | 'warning' | 'outline' | 'error'> = {
  planned: 'outline',
  scheduled: 'warning',
  done: 'success',
  cancelled: 'error',
};

export const ServiceVisitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));

  const [visits, setVisits] = useState<ServiceVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ServiceVisitStatus>('');
  const [kindFilter, setKindFilter] = useState<'' | 'scheduled' | 'unscheduled'>('');

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getServiceVisits({
        status: statusFilter || undefined,
        kind: kindFilter || undefined,
      });
      setVisits(res);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load visits', 'error');
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, statusFilter, kindFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return visits;
    return visits.filter(
      (v) =>
        (v.title || '').toLowerCase().includes(term) ||
        (v.customer_name || '').toLowerCase().includes(term) ||
        (v.contract_number || '').toLowerCase().includes(term) ||
        (v.plant_name || '').toLowerCase().includes(term),
    );
  }, [visits, search]);

  const breadcrumbs = [{ label: 'Service', href: '/service/contracts' }, { label: 'Service Plan' }];

  if (!canView) {
    return (
      <PageLayout title="Service Visits" breadcrumbs={breadcrumbs}>
        <Card><p className="text-slate-600">You do not have permission to view service visits.</p></Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Service Visits"
      description="All planned, scheduled and completed visits across contracts."
      breadcrumbs={breadcrumbs}
    >
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm px-5 py-3 mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Filter by title, customer, contract, plant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          containerClassName="max-w-sm shadow-none"
        />
        <div className="w-40">
          <Select
            options={[{ value: '', label: 'All statuses' }, ...SERVICE_VISIT_STATUSES.map((s) => ({ value: s, label: s }))]}
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as ServiceVisitStatus) || '')}
            searchable={false}
          />
        </div>
        <div className="w-40">
          <Select
            options={[
              { value: '', label: 'All kinds' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'unscheduled', label: 'Unscheduled' },
            ]}
            value={kindFilter}
            onChange={(v) => setKindFilter((v as 'scheduled' | 'unscheduled') || '')}
            searchable={false}
          />
        </div>
      </div>

      <Card noPadding contentClassName="py-0" className="overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading visits...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <CalendarClock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">No visits found</p>
            <p className="text-slate-500 text-sm mt-2">Visits appear here once a contract has a service plan.</p>
          </div>
        ) : (
          <DataTable<ServiceVisit>
            bordered={false}
            data={filtered}
            rowKey={(v) => v.id}
            onRowClick={(v) => navigate(`/service/contracts/${v.contract_id}/plan`)}
            dense
            showVerticalLines
            columns={[
              {
                key: 'title',
                label: 'Visit',
                render: (v) => (
                  <div>
                    <div className="font-medium text-slate-900">{v.title || `Visit ${v.visit_number ?? v.id}`}</div>
                    <div className="text-xs text-slate-500">{v.contract_number || `Contract #${v.contract_id}`}</div>
                  </div>
                ),
              },
              {
                key: 'customer_name',
                label: 'Customer',
                render: (v) => (
                  <div>
                    <div className="text-sm text-slate-900">{v.customer_name || '—'}</div>
                    {v.plant_name && <div className="text-xs text-slate-500">{v.plant_name}</div>}
                  </div>
                ),
              },
              { key: 'kind', label: 'Kind', render: (v) => <Badge variant="outline">{v.kind}</Badge> },
              {
                key: 'date',
                label: 'Date',
                render: (v) => (
                  <span className="text-sm text-slate-600">{v.scheduled_date || v.planned_date || '—'}</span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (v) => <Badge variant={VISIT_STATUS_VARIANT[v.status]}>{v.status}</Badge>,
              },
              {
                key: 'actions',
                label: '',
                sortable: false,
                align: 'right',
                render: (v) => (
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip content="Open the contract's service plan">
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-8 h-8 p-0 text-slate-500 hover:text-blue-700 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service/contracts/${v.contract_id}/plan`);
                        }}
                      >
                        <CalendarDays size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Open this visit's work order">
                      <Button
                        variant="ghost"
                        size="xs"
                        className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service/visits/${v.id}/work-order`);
                        }}
                      >
                        <ClipboardList size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip content={v.report_status === 'submitted' ? 'Visit report (submitted)' : 'Visit report'}>
                      <Button
                        variant="ghost"
                        size="xs"
                        className={`w-8 h-8 p-0 hover:bg-transparent ${v.report_status === 'submitted' ? 'text-emerald-600' : 'text-slate-500 hover:text-blue-700'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service/visits/${v.id}/report`);
                        }}
                      >
                        <FileText size={16} />
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
