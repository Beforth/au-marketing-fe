/**
 * Customers list – tabular view, fetches from marketing API.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { NavLink } from 'react-router-dom';
import { Users, UserCircle, Search, UserPlus, Building2, Edit, Trash2, User, Mail, Filter, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { SearchInput } from '../components/ui/SearchInput';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { marketingAPI, Customer, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, customerPrimaryContactName } from '../lib/marketing-api';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_customer'));
  const canCreate = useAppSelector(selectHasPermission('marketing.create_customer'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_customer'));
  const location = useLocation();
  const underDatabase = location.pathname.startsWith('/database');

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
        (customerPrimaryContactName(c) && customerPrimaryContactName(c).toLowerCase().includes(term)) ||
        (c.primary_contact_contact?.contact_email && c.primary_contact_contact.contact_email.toLowerCase().includes(term))
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

  const breadcrumbs = underDatabase
    ? [{ label: 'Database', href: '/database' }, { label: 'Customers', href: '/database/customers' }]
    : [{ label: 'Customers', href: '/customers' }];
  if (!canView) {
    return (
      <PageLayout title="Customer Registry" description="Manage enterprise-level client relationships." breadcrumbs={breadcrumbs}>
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
      breadcrumbs={breadcrumbs}
    >
      {/* Consolidated Command Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-3 mb-4">
        <div className="flex items-center justify-between gap-6 flex-wrap lg:flex-nowrap">
          {/* Internal Navigation group */}
          <div className="flex items-center gap-6 border-r border-slate-100 pr-6">
            <nav className="flex gap-4">
              {[
                { path: '/database/organizations', label: 'Organizations', icon: Building2, permission: 'marketing.view_organization' },
                { path: '/database/customers', label: 'Customers', icon: Users, permission: 'marketing.view_customer' },
                { path: '/database/contacts', label: 'Contacts', icon: UserCircle, permission: 'marketing.view_contact' },
              ].map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 py-2 px-1 text-sm font-bold transition-all border-b-2',
                      isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    )
                  }
                >
                  <tab.icon size={14} strokeWidth={2.5} />
                  <span className="uppercase tracking-widest text-[11px] whitespace-nowrap">{tab.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Action group: search */}
          <div className="flex flex-1 items-center gap-3">
            <SearchInput
              placeholder="Filter by company, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              containerClassName="max-w-md shadow-none border-slate-100"
            />
          </div>
        </div>
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
              dense={true}
              showVerticalLines={true}
              columns={[
                {
                  key: 'company_name',
                  label: 'Company',
                  render: (c) => (
                    <div>
                      <div className="font-medium text-slate-900">{c.company_name}</div>
                      {(c.organization?.industry || c.organization?.website) && (
                        <div className="text-xs text-slate-500 mt-0.5">{[c.organization?.industry, c.organization?.website].filter(Boolean).join(' · ')}</div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'primary_contact',
                  label: 'Contact',
                  render: (c) => (
                    <div>
                      <div className="text-sm text-slate-900">{customerPrimaryContactName(c) || '—'}</div>
                      {c.primary_contact_contact?.contact_job_title && <div className="text-xs text-slate-500">{c.primary_contact_contact.contact_job_title}</div>}
                    </div>
                  ),
                },
                {
                  key: 'primary_contact_email',
                  label: 'Email',
                  render: (c) =>
                    c.primary_contact_contact?.contact_email ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {c.primary_contact_contact.contact_email}
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
                          size="xxs"
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
                        size="xxs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${c.id}/edit`);
                        }}
                      >
                        <Edit size={12} />
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
