/**
 * Service module — Stage 1: Contracts list.
 * AMC / CMC maintenance contracts for customers' plants.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../components/layout/PageLayout';
import { SearchInput } from '../components/ui/SearchInput';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Plus, Edit, Trash2, ScrollText, CalendarClock } from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';
import {
  marketingAPI,
  ServiceContract,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '../lib/marketing-api';

const STATUS_VARIANT: Record<string, 'success' | 'outline' | 'warning' | 'error'> = {
  active: 'success',
  draft: 'outline',
  expired: 'warning',
  cancelled: 'error',
};

export const ServiceContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));
  const canCreate = useAppSelector(selectHasPermission('service.create_contract'));
  const canEdit = useAppSelector(selectHasPermission('service.edit_contract'));
  const canDelete = useAppSelector(selectHasPermission('service.delete_contract'));

  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getServiceContracts({ page, page_size: pageSize });
      setContracts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load contracts', 'error');
      setContracts([]);
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
  }, [canView, page, pageSize]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contracts;
    return contracts.filter(
      (c) =>
        (c.contract_number || '').toLowerCase().includes(term) ||
        (c.customer_name || '').toLowerCase().includes(term) ||
        (c.plant_name || '').toLowerCase().includes(term) ||
        c.contract_type.toLowerCase().includes(term),
    );
  }, [contracts, search]);

  const handleDelete = async (c: ServiceContract) => {
    if (!window.confirm(`Delete contract ${c.contract_number || `#${c.id}`}? This cannot be undone.`)) return;
    try {
      await marketingAPI.deleteServiceContract(c.id);
      showToast('Contract deleted', 'success');
      load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete contract', 'error');
    }
  };

  const breadcrumbs = [{ label: 'Service', href: '/service/contracts' }, { label: 'Contracts' }];

  if (!canView) {
    return (
      <PageLayout title="Service Contracts" breadcrumbs={breadcrumbs}>
        <Card>
          <p className="text-slate-600">You do not have permission to view service contracts.</p>
          <p className="text-sm text-slate-500 mt-2">Required permission: service.view</p>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Service Contracts"
      description="AMC / CMC maintenance contracts for customer plants."
      breadcrumbs={breadcrumbs}
      actions={
        canCreate ? (
          <Button size="sm" onClick={() => navigate('/service/contracts/new')} leftIcon={<Plus size={14} strokeWidth={3} />}>
            New Contract
          </Button>
        ) : null
      }
    >
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm px-5 h-14 mb-4 flex items-center">
        <SearchInput
          placeholder="Filter by number, customer, plant, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          containerClassName="max-w-md shadow-none"
        />
      </div>

      <Card noPadding contentClassName="py-0" className="overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading contracts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <ScrollText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">No contracts found</p>
            <p className="text-slate-500 text-sm mt-2">Create a contract to get started.</p>
            {canCreate && (
              <Button className="mt-4" size="sm" onClick={() => navigate('/service/contracts/new')} leftIcon={<Plus size={14} />}>
                New Contract
              </Button>
            )}
          </div>
        ) : (
          <>
            <DataTable<ServiceContract>
              bordered={false}
              data={filtered}
              rowKey={(c) => c.id}
              onRowClick={canEdit ? (c) => navigate(`/service/contracts/${c.id}/edit`) : undefined}
              dense
              showVerticalLines
              columns={[
                {
                  key: 'contract_number',
                  label: 'Contract #',
                  render: (c) => (
                    <span className="font-medium text-slate-900">{c.contract_number || <span className="text-slate-400">—</span>}</span>
                  ),
                },
                {
                  key: 'customer_name',
                  label: 'Customer',
                  render: (c) => (
                    <div>
                      <div className="text-sm text-slate-900">{c.customer_name || `Customer #${c.customer_id}`}</div>
                      {(c.customer_contact_name || c.plant_name) && (
                        <div className="text-xs text-slate-500">
                          {[c.customer_contact_name, c.plant_name].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'contract_type',
                  label: 'Type',
                  render: (c) => <Badge variant="outline">{c.contract_type}</Badge>,
                },
                {
                  key: 'period',
                  label: 'Period',
                  render: (c) =>
                    c.start_date || c.end_date ? (
                      <span className="text-sm text-slate-600">
                        {c.start_date || '—'} → {c.end_date || '—'}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    ),
                },
                {
                  key: 'items',
                  label: 'Coverage lines',
                  render: (c) => <span className="text-sm text-slate-600">{c.items?.length ?? 0}</span>,
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (c) => <Badge variant={STATUS_VARIANT[c.status] || 'outline'}>{c.status}</Badge>,
                },
                {
                  key: 'actions',
                  label: '',
                  sortable: false,
                  align: 'right',
                  render: (c) => (
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content="Service plan & visits">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="w-8 h-8 p-0 text-slate-500 hover:text-blue-700 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/service/contracts/${c.id}/plan`);
                          }}
                        >
                          <CalendarClock size={16} />
                        </Button>
                      </Tooltip>
                      {canEdit && (
                        <Tooltip content="Edit contract">
                          <Button
                            variant="ghost"
                            size="xs"
                            className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/service/contracts/${c.id}/edit`);
                            }}
                          >
                            <Edit size={16} />
                          </Button>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip content="Delete contract">
                          <Button
                            variant="ghost"
                            size="xs"
                            className="w-8 h-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(c);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  ),
                },
              ]}
            />
            <div className="border-t border-slate-200 px-4 py-3">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </div>
          </>
        )}
      </Card>
    </PageLayout>
  );
};
