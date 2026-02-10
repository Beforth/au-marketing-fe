/**
 * Contacts Management Page
 * Cold leads/data for cold DM/email
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { FilterPopover } from '../components/ui/FilterPopover';
import { Search, UserPlus, Filter, Edit, Trash2, Eye, Building2, Mail, Phone, MapPin, X } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { marketingAPI, Contact, Domain, Region, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_contact'));
  const canCreate = useAppSelector(selectHasPermission('marketing.create_contact'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_contact'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_contact'));
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [tempSelectedDomain, setTempSelectedDomain] = useState<number | null>(null);
  const [tempSelectedRegion, setTempSelectedRegion] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState<number | null>(null);
  const [convertContact, setConvertContact] = useState<{ id: number; company_name: string } | null>(null);
  const filterButtonRef = React.useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!canView) {
      showToast('You do not have permission to view contacts', 'error');
      return;
    }
    loadData();
  }, [canView, debouncedSearchTerm, selectedDomain, selectedRegion, page, pageSize]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getContacts({
        page,
        page_size: pageSize,
        domain_id: selectedDomain || undefined,
        region_id: selectedRegion || undefined,
        search: debouncedSearchTerm || undefined
      });
      setContacts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (error: any) {
      showToast(error.message || 'Failed to load contacts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const openDeleteContactConfirm = (id: number) => {
    if (!canDelete) {
      showToast('You do not have permission to delete contacts', 'error');
      return;
    }
    setDeleteContactId(id);
  };

  const handleConfirmDeleteContact = async () => {
    if (deleteContactId == null) return;
    try {
      await marketingAPI.deleteContact(deleteContactId);
      showToast('Contact deleted successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete contact', 'error');
    }
  };

  const openConvertConfirm = (contact: Contact) => {
    setConvertContact({ id: contact.id, company_name: contact.company_name });
  };

  const handleConfirmConvertToCustomer = async () => {
    if (convertContact == null) return;
    try {
      await marketingAPI.convertContactToCustomer(convertContact.id);
      showToast('Contact converted to customer successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to convert contact', 'error');
    }
  };


  // Contacts are already filtered by API
  const filteredContacts = contacts;

  if (!canView) {
    return (
      <PageLayout title="Contacts">
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view contacts.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_contact</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Contacts' },
  ];

  const actions = canCreate ? (
    <Button
      size="sm"
      onClick={() => navigate('/contacts/new')}
      leftIcon={<UserPlus size={14} strokeWidth={3} />}
    >
      Add Contact
    </Button>
  ) : null;

  return (
    <PageLayout title="Contacts" actions={actions} breadcrumbs={breadcrumbs}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            variant="white"
            inputSize="sm"
            className="rounded-full shadow-sm"
            icon={<Search size={14} strokeWidth={2.5} />}
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="max-w-md"
          />
          <div ref={filterButtonRef} className="inline-block">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full" 
              leftIcon={<Filter size={14} />}
              onClick={() => {
                setTempSelectedDomain(selectedDomain);
                setTempSelectedRegion(selectedRegion);
                setShowFilters(!showFilters);
              }}
            >
              Filter
            </Button>
          </div>
          {(selectedDomain || selectedRegion) && (
            <Badge variant="outline" className="text-xs">
              Filtered
            </Badge>
          )}
          {(selectedDomain || selectedRegion) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDomain(null);
                setSelectedRegion(null);
                setTempSelectedDomain(null);
                setTempSelectedRegion(null);
              }}
              className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Clear filters"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Filter Popover */}
        <FilterPopover
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          triggerRef={filterButtonRef}
          onApply={() => {
            setSelectedDomain(tempSelectedDomain);
            setSelectedRegion(tempSelectedRegion);
            setShowFilters(false);
          }}
          onClear={() => {
            setTempSelectedDomain(null);
            setTempSelectedRegion(null);
            setSelectedDomain(null);
            setSelectedRegion(null);
            setShowFilters(false);
          }}
        >
          <AsyncSelect
            label="Domain"
            loadOptions={async (search) => {
              if (search) {
                const res = await marketingAPI.getDomains({ is_active: true, page: 1, page_size: 25, search });
                return [
                  { value: '', label: 'All Domains' },
                  ...res.items.map(d => ({ value: d.id, label: d.name }))
                ];
              }
              return [{ value: '', label: 'All Domains' }];
            }}
            value={tempSelectedDomain || ''}
            onChange={(val) => {
              const domainId = val ? Number(val) : null;
              setTempSelectedDomain(domainId);
              setTempSelectedRegion(null);
            }}
            placeholder="All Domains"
            initialOptions={[{ value: '', label: 'All Domains' }]}
          />

          {tempSelectedDomain && (
            <AsyncSelect
              label="Region"
              loadOptions={async (search) => {
                const res = await marketingAPI.getRegions({
                  domain_id: tempSelectedDomain,
                  is_active: true,
                  page: 1,
                  page_size: 25,
                  search: search || undefined
                });
                return [
                  { value: '', label: 'All Regions' },
                  ...res.items.map(r => ({ value: r.id, label: r.name }))
                ];
              }}
              value={tempSelectedRegion || ''}
              onChange={(val) => setTempSelectedRegion(val ? Number(val) : null)}
              placeholder="All Regions"
              initialOptions={[]}
            />
          )}
        </FilterPopover>
      </div>

      <div className="mt-4">
        {/* Contacts List */}
        <Card noPadding contentClassName="py-6 px-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-slate-600">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No contacts found</p>
            </div>
          ) : (
            <>
            <DataTable<Contact>
              data={filteredContacts}
              rowKey={(c) => c.id}
              className="border-none"
              columns={[
                {
                  key: 'company_name',
                  label: 'Company',
                  render: (contact) => (
                    <div>
                      <div className="font-medium text-slate-900">{contact.company_name}</div>
                      {contact.industry && <div className="text-xs text-slate-500 mt-1">{contact.industry}</div>}
                    </div>
                  ),
                },
                {
                  key: 'contact_person_name',
                  label: 'Contact Person',
                  render: (contact) =>
                    contact.contact_person_name ? (
                      <div>
                        <div className="text-sm text-slate-900">{contact.contact_person_name}</div>
                        {contact.contact_job_title && <div className="text-xs text-slate-500">{contact.contact_job_title}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    ),
                },
                {
                  key: 'contact_email',
                  label: 'Email',
                  render: (contact) =>
                    contact.contact_email ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} />
                        {contact.contact_email}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    ),
                },
                {
                  key: 'domain',
                  label: 'Domain',
                  render: (contact) => contact.domain ? <Badge variant="outline">{contact.domain.name}</Badge> : null,
                },
                {
                  key: 'region',
                  label: 'Region',
                  render: (contact) =>
                    contact.region ? <Badge variant="outline">{contact.region.name}</Badge> : <span className="text-slate-400 text-sm">-</span>,
                },
                {
                  key: 'is_converted',
                  label: 'Status',
                  render: (contact) =>
                    contact.is_converted ? <Badge variant="success">Converted</Badge> : <Badge variant="outline">Active</Badge>,
                },
                {
                  key: 'actions',
                  label: '',
                  sortable: false,
                  align: 'right',
                  render: (contact) => (
                    <div className="flex items-center justify-end gap-2">
                      {!contact.is_converted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConvertConfirm(contact);
                          }}
                        >
                          Convert
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/contacts/${contact.id}/edit`); }}>
                          <Edit size={14} />
                        </Button>
                      )}
                      {canDelete && !contact.is_converted && (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openDeleteContactConfirm(contact.id); }}>
                          <Trash2 size={14} />
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
      </div>

      <ConfirmModal
        isOpen={deleteContactId != null}
        onClose={() => setDeleteContactId(null)}
        onConfirm={handleConfirmDeleteContact}
        title="Delete contact"
        message="Are you sure you want to delete this contact?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
      <ConfirmModal
        isOpen={convertContact != null}
        onClose={() => setConvertContact(null)}
        onConfirm={handleConfirmConvertToCustomer}
        title="Convert to customer"
        message={convertContact ? `Convert ${convertContact.company_name} to a customer? This will create a new customer record.` : ''}
        confirmLabel="Convert"
        cancelLabel="Cancel"
        variant="primary"
      />
    </PageLayout>
  );
};
