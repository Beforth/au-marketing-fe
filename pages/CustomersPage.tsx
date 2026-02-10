/**
 * Customers list – tabular view, fetches from marketing API.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, UserPlus, Building2, Edit, User, Mail } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { marketingAPI, Customer, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.customer.view'));
  const canCreate = useAppSelector(selectHasPermission('marketing.customer.create'));
  const canEdit = useAppSelector(selectHasPermission('marketing.customer.edit'));

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!canView) {
      showToast('You do not have permission to view customers', 'error');
      return;
    }
    loadCustomers();
  }, [canView, page, pageSize]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getCustomers({ page, page_size: pageSize, is_active: undefined });
      setCustomers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (error: any) {
      showToast(error.message || 'Failed to load customers', 'error');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const filteredCustomers = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        (c.company_name && c.company_name.toLowerCase().includes(term)) ||
        (c.primary_contact_name && c.primary_contact_name.toLowerCase().includes(term)) ||
        (c.primary_contact_email && c.primary_contact_email.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  const actions = canCreate ? (
    <Button
      size="sm"
      onClick={() => navigate('/customers/new')}
      leftIcon={<UserPlus size={14} strokeWidth={3} />}
    >
      New Client Account
    </Button>
  ) : null;

  if (!canView) {
    return (
      <PageLayout title="Customer Registry" description="Manage enterprise-level client relationships.">
        <Card>
          <p className="text-slate-600">You do not have permission to view customers.</p>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Customer Registry"
      description="Manage enterprise-level client relationships."
      actions={actions}
    >
      <div className="flex items-center gap-3 mb-4">
        <Input
          variant="white"
          inputSize="sm"
          className="rounded-full shadow-sm"
          icon={<Search size={14} strokeWidth={2.5} />}
          placeholder="Filter by company, contact, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="max-w-md"
        />
      </div>

      <Card noPadding contentClassName="py-0">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-slate-600">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-24 text-center">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">No customers found</p>
            <p className="text-slate-500 text-sm mt-2">Create a customer or adjust your filters.</p>
            {canCreate && (
              <Button className="mt-4" size="sm" onClick={() => navigate('/customers/new')} leftIcon={<UserPlus size={14} />}>
                New Client Account
              </Button>
            )}
          </div>
        ) : (
          <>
            <DataTable<Customer>
              data={filteredCustomers}
              rowKey={(c) => c.id}
              onRowClick={canEdit ? (c) => navigate(`/customers/${c.id}/edit`) : undefined}
              columns={[
                {
                  key: 'company_name',
                  label: 'Company',
                  render: (c) => (
                    <div>
                      <div className="font-medium text-slate-900">{c.company_name}</div>
                      {c.industry && <div className="text-xs text-slate-500 mt-0.5">{c.industry}</div>}
                    </div>
                  ),
                },
                {
                  key: 'primary_contact_name',
                  label: 'Contact',
                  render: (c) => (
                    <div>
                      <div className="text-sm text-slate-900">{c.primary_contact_name || '—'}</div>
                      {c.primary_contact_job_title && <div className="text-xs text-slate-500">{c.primary_contact_job_title}</div>}
                    </div>
                  ),
                },
                {
                  key: 'primary_contact_email',
                  label: 'Email',
                  render: (c) =>
                    c.primary_contact_email ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {c.primary_contact_email}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    ),
                },
                {
                  key: 'domain',
                  label: 'Domain',
                  render: (c) => (c.domain ? <Badge variant="outline">{c.domain.name}</Badge> : <span className="text-slate-400">—</span>),
                },
                {
                  key: 'is_active',
                  label: 'Status',
                  render: (c) =>
                    c.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    ),
                },
                {
                  key: 'converted_from_contact_id',
                  label: 'From contact',
                  render: (c) =>
                    c.converted_from_contact_id ? (
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-indigo-500" />
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          className="text-indigo-600 p-0 h-auto min-w-0 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contacts/${c.converted_from_contact_id}/edit`);
                          }}
                        >
                          View contact
                        </Button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    ),
                },
                {
                  key: 'actions',
                  label: '',
                  sortable: false,
                  align: 'right',
                  render: (c) =>
                    canEdit ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${c.id}/edit`);
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                    ) : null,
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
    </PageLayout>
  );
};
