/**
 * Visiting Card Contacts Page
 * Raw contact data pushed in from the external business-card scanning system
 * (same HRMS login as this app). Unscoped - a shared inbox anyone with view
 * permission can see. Staff can also add cards manually here, and promote a
 * card into a real, scoped Contact via "Convert to Contact".
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Users, UserCircle, Building2, IdCard, Plus, Edit, Trash2, ArrowRightCircle, X, Mail, Phone, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip } from '../UI/Tooltip';
import { DetailDrawer } from '../components/ui/DetailDrawer';
import { downloadCsv } from '../lib/csv-export';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { marketingAPI, VisitingCardContact, ExhibitionLite, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

const emptyForm = (): Partial<VisitingCardContact> => ({
  name: '',
  company_name: '',
  designation: '',
  phone_numbers: [],
  emails: [],
  website: '',
  social_media: [],
  address: '',
  notes: '',
  source: 'manual',
});

/** Small editable list of text values (phone numbers / emails / social links). */
const ListField: React.FC<{
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}> = ({ label, values, onChange, placeholder }) => {
  const update = (i: number, val: string) => {
    const next = [...values];
    next[i] = val;
    onChange(next);
  };
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const add = () => onChange([...values, '']);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              containerClassName="flex-1"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-slate-400 hover:text-rose-500 p-1.5 shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="xs" onClick={add} leftIcon={<Plus size={12} />}>
          Add {label.toLowerCase()}
        </Button>
      </div>
    </div>
  );
};

export const VisitingCardContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_visiting_card_contact'));
  const canCreate = useAppSelector(selectHasPermission('marketing.create_visiting_card_contact'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_visiting_card_contact'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_visiting_card_contact'));
  const isSuperUser = useAppSelector((st) => !!st.auth.user?.is_superuser);
  const [selected, setSelected] = useState<VisitingCardContact | null>(null);
  const [exporting, setExporting] = useState(false);
  const canConvert = useAppSelector(selectHasPermission('marketing.create_contact'));

  const [items, setItems] = useState<VisitingCardContact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [convertId, setConvertId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<VisitingCardContact>>(emptyForm());
  const [exhibitions, setExhibitions] = useState<ExhibitionLite[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!canView) return;
    marketingAPI.getActiveExhibitions()
      .then((rows) => setExhibitions(rows || []))
      .catch(() => setExhibitions([]));
  }, [canView]);

  useEffect(() => {
    if (!canView) {
      showToast('You do not have permission to view visiting card contacts', 'error');
      return;
    }
    loadData();
  }, [canView, debouncedSearchTerm, page, pageSize]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getVisitingCardContacts({
        page,
        page_size: pageSize,
        search: debouncedSearchTerm || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (error: any) {
      showToast(error.message || 'Failed to load visiting card contacts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEditForm = (item: VisitingCardContact) => {
    setEditingId(item.id);
    setForm({ ...item });
    setFormOpen(true);
  };

  const handleSaveForm = async () => {
    setIsSaving(true);
    try {
      const { exhibition_name, ...formFields } = form;
      const payload = {
        ...formFields,
        phone_numbers: (form.phone_numbers || []).map((v) => v.trim()).filter(Boolean),
        emails: (form.emails || []).map((v) => v.trim()).filter(Boolean),
        social_media: (form.social_media || []).map((v) => v.trim()).filter(Boolean),
      };
      if (editingId != null) {
        await marketingAPI.updateVisitingCardContact(editingId, payload);
        showToast('Visiting card contact updated', 'success');
      } else {
        await marketingAPI.createVisitingCardContact(payload);
        showToast('Visiting card contact added', 'success');
      }
      setFormOpen(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to save visiting card contact', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await marketingAPI.deleteVisitingCardContact(deleteId);
      showToast('Visiting card contact deleted', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete visiting card contact', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleConfirmConvert = async () => {
    if (convertId == null) return;
    try {
      const res = await marketingAPI.convertVisitingCardContactToContact(convertId, {});
      showToast('Converted to Contact — add company & scope details', 'success');
      setConvertId(null);
      navigate(`/contacts/${res.contact_id}/edit`);
    } catch (error: any) {
      showToast(error.message || 'Failed to convert to contact', 'error');
    }
  };

  const underDatabase = location.pathname.startsWith('/database');
  const breadcrumbsBase = underDatabase
    ? [{ label: 'Database', href: '/database' }, { label: 'Visiting Cards', href: '/database/visiting-card-contacts' }]
    : [{ label: 'Visiting Cards', href: '/visiting-card-contacts' }];

  if (!canView) {
    return (
      <PageLayout title="Visiting Cards" description="Raw contact data captured from business cards." breadcrumbs={breadcrumbsBase}>
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view visiting card contacts.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_visiting_card_contact</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

const handleExport = async () => {
    setExporting(true);
    try {
      const all: VisitingCardContact[] = [];
      for (let p = 1; ; p++) {
        const res = await marketingAPI.getVisitingCardContacts({ page: p, page_size: 100, search: debouncedSearchTerm || undefined });
        all.push(...res.items);
        if (p >= res.total_pages || res.items.length === 0) break;
      }
      downloadCsv(
        `visiting-cards-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Name', 'Designation', 'Company', 'Phones', 'Emails', 'Website', 'Social', 'Address', 'Exhibition', 'Source', 'Status', 'Notes', 'Created by', 'Created at'],
        all.map((c) => [c.name, c.designation, c.company_name, c.phone_numbers?.join('; '), c.emails?.join('; '), c.website, c.social_media?.join('; '), c.address, c.exhibition_name, c.source, c.is_converted ? 'Converted' : 'New', c.notes, c.created_by_username, c.created_at]),
      );
    } catch (error: any) {
      showToast(error.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      {isSuperUser && (
        <Button size="sm" variant="success" leftIcon={<Download size={14} />} onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export'}
        </Button>
      )}
      {canCreate && (
        <Button size="sm" onClick={openAddForm} leftIcon={<Plus size={14} strokeWidth={3} />}>
          Add Visiting Card
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout
      title="Visiting Cards"
      description="Contacts captured from business cards — from the external card scanner or added by hand. Convert a card to a full Contact when you want to work it."
      actions={actions}
      breadcrumbs={breadcrumbsBase}
    >
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm px-5 py-0 h-14 mb-4 flex items-center">
        <div className="flex items-center justify-between gap-6 w-full h-full flex-wrap lg:flex-nowrap">
          <div className="flex items-center h-full">
            <nav className="flex gap-6 h-full">
              {[
                { path: '/database/organizations', label: 'Organizations', icon: Building2, permission: 'marketing.view_organization' },
                { path: '/database/customers', label: 'Customers', icon: Users, permission: 'marketing.view_customer' },
                { path: '/database/contacts', label: 'Contacts', icon: UserCircle, permission: 'marketing.view_contact' },
                { path: '/database/visiting-card-contacts', label: 'Visiting Cards', icon: IdCard, permission: 'marketing.view_visiting_card_contact' },
              ].map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 h-full px-1 text-sm font-bold transition-all border-b-2 -mb-[1px] relative z-10',
                      isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                    )
                  }
                >
                  <tab.icon size={14} strokeWidth={2.5} />
                  <span className="uppercase tracking-widest text-[11px] whitespace-nowrap">{tab.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="hidden lg:block w-[1px] h-5 bg-slate-200" />

          <div className="flex flex-1 items-center gap-3">
            <SearchInput
              placeholder="Search visiting cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              containerClassName="max-w-md shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Card noPadding contentClassName="py-0" className="overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600">Loading visiting cards...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <IdCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No visiting card contacts found</p>
            </div>
          ) : (
            <>
              <DataTable<VisitingCardContact>
                bordered={false}
                data={items}
                rowKey={(c) => c.id}
                onRowClick={setSelected}
                dense={true}
                showVerticalLines={true}
                columns={[
                  {
                    key: 'name',
                    label: 'Name',
                    render: (item) => (
                      <div>
                        <div className="font-medium text-slate-900">{item.name || '—'}</div>
                        {item.designation && <div className="text-xs text-slate-500 mt-1">{item.designation}</div>}
                      </div>
                    ),
                  },
                  {
                    key: 'company_name',
                    label: 'Company',
                    render: (item) => item.company_name || <span className="text-slate-400 text-sm">-</span>,
                  },
                  {
                    key: 'phones',
                    label: 'Phone',
                    render: (item) =>
                      item.phone_numbers?.length ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone size={13} />
                          {item.phone_numbers[0]}
                          {item.phone_numbers.length > 1 && (
                            <span className="text-xs text-slate-400">+{item.phone_numbers.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      ),
                  },
                  {
                    key: 'emails',
                    label: 'Email',
                    render: (item) =>
                      item.emails?.length ? (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail size={13} />
                          {item.emails[0]}
                          {item.emails.length > 1 && <span className="text-xs text-slate-400">+{item.emails.length - 1}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      ),
                  },
                  {
                    key: 'exhibition',
                    label: 'Exhibition',
                    render: (item) => item.exhibition_name || <span className="text-slate-400 text-sm">-</span>,
                  },
                  {
                    key: 'source',
                    label: 'Source',
                    render: (item) => item.source || <span className="text-slate-400 text-sm">-</span>,
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (item) =>
                      item.is_converted ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Converted
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      ),
                  },
                  {
                    key: 'actions',
                    label: '',
                    sortable: false,
                    align: 'right',
                    render: (item) => (
                      <div className="flex items-center justify-end gap-1">
                        {canConvert && !item.is_converted && (
                          <Tooltip content="Convert to Contact">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="w-8 h-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-transparent transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConvertId(item.id);
                              }}
                            >
                              <ArrowRightCircle size={16} />
                            </Button>
                          </Tooltip>
                        )}
                        {canEdit && (
                          <Tooltip content="Edit">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditForm(item);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                          </Tooltip>
                        )}
                        {canDelete && !item.is_converted && (
                          <Tooltip content="Delete">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="w-8 h-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-transparent transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(item.id);
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
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete visiting card contact"
        message="Are you sure you want to delete this visiting card contact?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={convertId != null}
        onClose={() => setConvertId(null)}
        onConfirm={handleConfirmConvert}
        title="Convert to Contact"
        message="This creates a new Contact from this visiting card. You'll be taken to the Contact form to add company, domain and region."
        confirmLabel="Convert"
        cancelLabel="Cancel"
      />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId != null ? 'Edit Visiting Card' : 'Add Visiting Card'}
        contentClassName="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveForm} isLoading={isSaving}>
              {editingId != null ? 'Save Changes' : 'Add Visiting Card'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Name"
              value={form.name || ''}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
            />
            <Input
              label="Designation"
              value={form.designation || ''}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
              placeholder="e.g. Procurement Manager"
            />
          </div>
          <Input
            label="Company"
            value={form.company_name || ''}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            placeholder="Company name"
          />

          <ListField
            label="Phone numbers"
            values={form.phone_numbers || []}
            onChange={(v) => setForm((f) => ({ ...f, phone_numbers: v }))}
            placeholder="+91-XXXXXXXXXX"
          />
          <ListField
            label="Emails"
            values={form.emails || []}
            onChange={(v) => setForm((f) => ({ ...f, emails: v }))}
            placeholder="name@company.com"
          />

          <Input
            label="Website"
            value={form.website || ''}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://company.com"
          />

          <ListField
            label="Social media"
            values={form.social_media || []}
            onChange={(v) => setForm((f) => ({ ...f, social_media: v }))}
            placeholder="https://linkedin.com/in/..."
          />

          <Input
            label="Address"
            value={form.address || ''}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Single-line address"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={form.notes || ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Anything else worth noting"
            />
          </div>

          <Select
            label="Exhibition / Roadshow"
            placeholder="Where was this card collected? (optional)"
            searchable
            clearable
            value={form.exhibition_id ?? undefined}
            options={exhibitions.map((e) => ({ value: e.id, label: `${e.name}${e.location ? ` — ${e.location}` : ''}` }))}
            onChange={(v) => setForm((f) => ({ ...f, exhibition_id: v == null ? null : Number(v) }))}
          />

          <Input
            label="Source"
            value={form.source || ''}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            placeholder="e.g. manual, card-scanner"
          />
        </div>
      </Modal>
    <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
        subtitle={[selected?.designation, selected?.company_name].filter(Boolean).join(' · ')}
        status={selected ? { label: selected.is_converted ? 'Converted' : 'New', tone: selected.is_converted ? 'green' : 'blue' } : undefined}
        onEdit={canEdit && selected ? () => { openEditForm(selected); setSelected(null); } : undefined}
        fields={selected ? [
          { label: 'Company', section: 'Contact', value: selected.company_name },
          { label: 'Phones', section: 'Contact', value: selected.phone_numbers?.join('\n') },
          { label: 'Emails', section: 'Contact', value: selected.emails?.join('\n') },
          { label: 'Website', section: 'Contact', href: selected.website ? (selected.website.startsWith('http') ? selected.website : `https://${selected.website}`) : undefined, value: selected.website },
          { label: 'Social', section: 'Contact', value: selected.social_media?.join('\n') },
          { label: 'Address', section: 'Contact', value: selected.address },
          { label: 'Exhibition', section: 'Captured', value: selected.exhibition_name },
          { label: 'Source', section: 'Captured', value: selected.source },
          { label: 'Created by', section: 'Captured', value: selected.created_by_username },
          { label: 'Notes', section: 'Notes', value: selected.notes },
        ] : []}
      />
    </PageLayout>
  );
};
