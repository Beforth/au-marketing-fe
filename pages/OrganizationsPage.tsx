/**
 * Organizations list – same listing UI as Customers/Contacts (Card, DataTable, search, Pagination).
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageLayout } from '../components/layout/PageLayout';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { marketingAPI, Organization, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useApp();
  const underDatabase = location.pathname.startsWith('/database');
  const canCreate = useAppSelector(selectHasPermission('marketing.create_organization'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_organization'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_organization'));

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getOrganizations({
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
      });
      setOrganizations(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: any) {
      showToast(e.message || 'Failed to load organizations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, searchTerm]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await marketingAPI.deleteOrganization(deleteId);
      showToast('Organization deleted', 'success');
      setDeleteId(null);
      loadData();
    } catch (e: any) {
      showToast(e.message || 'Failed to delete organization', 'error');
    }
  };

  const actions = canCreate ? (
    <Button size="sm" onClick={() => navigate('/organizations/new')} leftIcon={<Plus size={14} strokeWidth={3} />}>
      Add Organization
    </Button>
  ) : undefined;

  const breadcrumbs = underDatabase
    ? [{ label: 'Database', href: '/database' }, { label: 'Organizations', href: '/database/organizations' }]
    : [{ label: 'Organizations', href: '/organizations' }];
  return (
    <PageLayout
      title="Organizations"
      breadcrumbs={breadcrumbs}
      description="Manage organizations and their plants. Select an organization when adding a customer or contact."
      actions={actions}
    >
      <div className="flex items-center gap-3 mb-4">
        <Input
          variant="white"
          inputSize="sm"
          className="rounded-full shadow-sm"
          icon={<Search size={14} strokeWidth={2.5} />}
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="max-w-md"
        />
      </div>

      <Card noPadding contentClassName="py-0">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-slate-600">Loading organizations...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="py-24 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">No organizations found</p>
            <p className="text-slate-500 text-sm mt-2">Add an organization or adjust your search.</p>
            {canCreate && (
              <Button className="mt-4" size="sm" onClick={() => navigate('/organizations/new')} leftIcon={<Plus size={14} />}>
                Add Organization
              </Button>
            )}
          </div>
        ) : (
          <>
            <DataTable<Organization>
              data={organizations}
              rowKey={(o) => o.id}
              onRowClick={canEdit ? (o) => navigate(`/organizations/${o.id}/edit`) : undefined}
              columns={[
                {
                  key: 'name',
                  label: 'Organization',
                  render: (o) => (
                    <div>
                      <div className="font-medium text-slate-900">{o.name}</div>
                      {o.code && <div className="text-xs text-slate-500 mt-0.5">{o.code}</div>}
                    </div>
                  ),
                },
                {
                  key: 'description',
                  label: 'Details',
                  render: (o) => (
                    <div className="text-sm text-slate-600 max-w-xs truncate" title={o.description || undefined}>
                      {o.description || '—'}
                    </div>
                  ),
                },
                {
                  key: 'industry',
                  label: 'Industry',
                  render: (o) => <span className="text-sm text-slate-600">{o.industry || '—'}</span>,
                },
                {
                  key: 'is_active',
                  label: 'Status',
                  render: (o) =>
                    o.is_active ? (
                      <span className="text-xs font-medium text-emerald-600">Active</span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Inactive</span>
                    ),
                },
                {
                  key: 'actions',
                  label: '',
                  sortable: false,
                  align: 'right',
                  render: (o) => (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organizations/${o.id}/edit`);
                          }}
                          leftIcon={<Edit size={14} />}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(o.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                          leftIcon={<Trash2 size={14} />}
                        >
                          Delete
                        </Button>
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
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </div>
          </>
        )}
      </Card>
      <ConfirmModal
        isOpen={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete organization"
        message="Are you sure? This will also remove all plants under this organization."
      />
    </PageLayout>
  );
};
