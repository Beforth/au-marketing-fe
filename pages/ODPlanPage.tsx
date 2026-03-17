import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { Modal } from '../components/ui/Modal';
import { marketingAPI } from '../lib/marketing-api';
import type { ODPlanEntryItem, ODPlanEntryCreate, ODPlanReportItem, Contact, Plant } from '../lib/marketing-api';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText } from '../constants';
import { serializePhoneWithCountryCode } from '../lib/name-phone-utils';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Loader2,
  MapPin,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const ENTRY_TYPES = [
  { value: 'visit', label: 'Visit' },
  { value: 'travel', label: 'Travel' },
  { value: 'return_home', label: 'Return home' },
];

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month - 1, d));
  }
  return days;
}

function dateToKey(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export const ODPlanPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canCreateContact = useAppSelector(selectHasPermission('marketing.create_contact'));
  const canCreatePlant = useAppSelector(selectHasPermission('marketing.create_plant'));
  const canCreateOrg = useAppSelector(selectHasPermission('marketing.create_organization'));

  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month');
  const nextMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);
  const year = yearParam ? parseInt(yearParam, 10) : nextMonth.year;
  const month = monthParam ? parseInt(monthParam, 10) : nextMonth.month;

  const [report, setReport] = useState<ODPlanReportItem | null>(null);
  const [entries, setEntries] = useState<ODPlanEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryFormDate, setEntryFormDate] = useState<string>(dateToKey(new Date(year, month - 1, 1)));
  const [entryForm, setEntryForm] = useState<ODPlanEntryCreate>({
    plan_date: entryFormDate,
    entry_type: 'visit',
    where_place: '',
    travel_time: '',
    travel_type: '',
    contact_id: undefined,
    notes: '',
  });
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  const [contactSearch, setContactSearch] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState<Contact[]>([]);
  const [contactSearching, setContactSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [createContactForm, setCreateContactForm] = useState({
    name_prefix: '',
    first_name: '',
    last_name: '',
    contact_email: '',
    phone_country_code: DEFAULT_COUNTRY_CODE,
    contact_phone: '',
    domain_id: undefined as number | undefined,
    region_id: undefined as number | undefined,
    organization_id: undefined as number | undefined,
    plant_id: undefined as number | undefined,
  });
  const [createContactSelectedOrg, setCreateContactSelectedOrg] = useState<{ id: number; name: string } | null>(null);
  const [domains, setDomains] = useState<{ id: number; name: string }[]>([]);
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [contactCreatePlants, setContactCreatePlants] = useState<Plant[]>([]);
  const [showAddPlantInContactModal, setShowAddPlantInContactModal] = useState(false);
  const [newPlantForm, setNewPlantForm] = useState({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' });
  const [addingPlant, setAddingPlant] = useState(false);
  const contactSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [orgSuggestions, setOrgSuggestions] = useState<{ id: number; name: string; code?: string; industry?: string; website?: string }[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState<{ name: string; code: string; description: string; website: string; industry: string; organization_size: string }>({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' });
  const orgSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await marketingAPI.getODPlanReport(year, month);
      setReport(data);
      setEntries(data.entries || []);
    } catch {
      setReport(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    marketingAPI.getDomains({ is_active: true, page: 1, page_size: 50 }).then((r) =>
      setDomains(r.items.map((d: { id: number; name: string }) => ({ id: d.id, name: d.name })))
    ).catch(() => setDomains([]));
  }, []);

  useEffect(() => {
    if (createContactForm.domain_id) {
      marketingAPI.getRegions({ domain_id: createContactForm.domain_id, is_active: true, page: 1, page_size: 100 })
        .then((r) => setRegions(r.items.map((rr: { id: number; name: string }) => ({ id: rr.id, name: rr.name }))))
        .catch(() => setRegions([]));
    } else {
      setRegions([]);
    }
  }, [createContactForm.domain_id]);

  useEffect(() => {
    if (createContactForm.organization_id) {
      marketingAPI.getOrganizationPlants(createContactForm.organization_id).then(setContactCreatePlants).catch(() => setContactCreatePlants([]));
    } else {
      setContactCreatePlants([]);
      setCreateContactForm((f) => ({ ...f, plant_id: undefined }));
    }
  }, [createContactForm.organization_id]);

  const searchOrganizationsByName = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setOrgSuggestions([]);
      return;
    }
    setOrgSearchQuery(q);
    marketingAPI.getOrganizations({ page: 1, page_size: 15, search: q, is_active: true })
      .then((res) => setOrgSuggestions(res.items?.map((o: { id: number; name: string; code?: string; industry?: string; website?: string }) => ({ id: o.id, name: o.name, code: o.code, industry: o.industry, website: o.website })) ?? []))
      .catch(() => setOrgSuggestions([]));
  }, []);

  const onOrganizationSearchChange = useCallback((value: string) => {
    setCreateContactSelectedOrg(null);
    setCreateContactForm((f) => ({ ...f, organization_id: undefined, plant_id: undefined }));
    setContactCreatePlants([]);
    setOrgSearchQuery(value);
    if (orgSearchTimeoutRef.current) clearTimeout(orgSearchTimeoutRef.current);
    orgSearchTimeoutRef.current = setTimeout(() => searchOrganizationsByName(value), 300);
  }, [searchOrganizationsByName]);

  const clearContactOrganization = useCallback(() => {
    setCreateContactSelectedOrg(null);
    setCreateContactForm((f) => ({ ...f, organization_id: undefined, plant_id: undefined }));
    setContactCreatePlants([]);
    setOrgSearchQuery('');
    setOrgSuggestions([]);
  }, []);

  const openCreateOrgModal = useCallback(() => {
    setNewOrgForm({
      name: createContactSelectedOrg?.name?.trim() || orgSearchQuery || '',
      code: '',
      description: '',
      website: '',
      industry: '',
      organization_size: '',
    });
    setOrgModalOpen(true);
    setOrgSuggestions([]);
    setOrgSearchQuery('');
  }, [createContactSelectedOrg?.name, orgSearchQuery]);

  const handleCreateOrganization = useCallback(async () => {
    if (!newOrgForm.name.trim()) {
      showToast('Organization name is required', 'error');
      return;
    }
    setCreatingOrg(true);
    try {
      const org = await marketingAPI.createOrganization({
        name: newOrgForm.name.trim(),
        code: newOrgForm.code.trim() || undefined,
        description: newOrgForm.description.trim() || undefined,
        website: newOrgForm.website.trim() || undefined,
        industry: newOrgForm.industry.trim() || undefined,
        organization_size: newOrgForm.organization_size?.trim() || undefined,
        is_active: true,
      });
      setCreateContactSelectedOrg({ id: org.id, name: org.name });
      setCreateContactForm((f) => ({ ...f, organization_id: org.id }));
      setOrgModalOpen(false);
      setNewOrgForm({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' });
      marketingAPI.getOrganizationPlants(org.id).then(setContactCreatePlants).catch(() => setContactCreatePlants([]));
      showToast('Organization created and linked', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create organization', 'error');
    } finally {
      setCreatingOrg(false);
    }
  }, [newOrgForm, showToast]);

  const handleAddPlantInContactModal = useCallback(async () => {
    const orgId = createContactForm.organization_id;
    if (!orgId || !newPlantForm.plant_name?.trim()) {
      showToast('Plant name is required', 'error');
      return;
    }
    setAddingPlant(true);
    try {
      const plant = await marketingAPI.createOrganizationPlant(orgId, newPlantForm);
      const updated = await marketingAPI.getOrganizationPlants(orgId);
      setContactCreatePlants(updated);
      setCreateContactForm((f) => ({ ...f, plant_id: plant.id }));
      setNewPlantForm({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' });
      setShowAddPlantInContactModal(false);
      showToast('Plant added', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to add plant', 'error');
    } finally {
      setAddingPlant(false);
    }
  }, [createContactForm.organization_id, newPlantForm, showToast]);

  useEffect(() => {
    if (contactSearch.trim().length < 2) {
      setContactSearchResults([]);
      return;
    }
    if (contactSearchTimeoutRef.current) clearTimeout(contactSearchTimeoutRef.current);
    contactSearchTimeoutRef.current = setTimeout(() => {
      setContactSearching(true);
      marketingAPI.searchContacts(contactSearch.trim(), 15)
        .then(setContactSearchResults)
        .catch(() => setContactSearchResults([]))
        .finally(() => setContactSearching(false));
      contactSearchTimeoutRef.current = null;
    }, 300);
    return () => {
      if (contactSearchTimeoutRef.current) clearTimeout(contactSearchTimeoutRef.current);
    };
  }, [contactSearch]);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const entriesByDate = useMemo(() => {
    const map: Record<string, ODPlanEntryItem[]> = {};
    entries.forEach((e) => {
      const key = e.plan_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [entries]);

  const openAddEntry = (dateStr: string) => {
    setEntryFormDate(dateStr);
    setEntryForm({
      plan_date: dateStr,
      entry_type: 'visit',
      where_place: '',
      travel_time: '',
      travel_type: '',
      contact_id: undefined,
      notes: '',
    });
    setSelectedContact(null);
    setContactSearch('');
    setEditingEntryId(null);
    setEntryModalOpen(true);
  };

  const openEditEntry = (entry: ODPlanEntryItem) => {
    setEntryFormDate(entry.plan_date.slice(0, 10));
    setEntryForm({
      plan_date: entry.plan_date.slice(0, 10),
      entry_type: entry.entry_type,
      where_place: entry.where_place ?? '',
      travel_time: entry.travel_time ?? '',
      travel_type: entry.travel_type ?? '',
      contact_id: entry.contact_id ?? undefined,
      notes: entry.notes ?? '',
    });
    setSelectedContact(entry.contact_id ? { id: entry.contact_id, contact_email: entry.contact_email ?? '', first_name: '', last_name: '' } as Contact : null);
    setContactSearch(entry.contact_email ?? '');
    setEditingEntryId(entry.id);
    setEntryModalOpen(true);
  };

  const saveEntryToLocal = () => {
    if (!entryForm.plan_date.trim()) return;
    const newEntry: ODPlanEntryItem = {
      id: editingEntryId ?? -(Date.now()),
      plan_date: entryForm.plan_date,
      entry_type: entryForm.entry_type,
      where_place: entryForm.where_place || null,
      travel_time: entryForm.travel_time || null,
      travel_type: entryForm.travel_type || null,
      contact_id: selectedContact?.id ?? entryForm.contact_id ?? null,
      contact_name: selectedContact ? [selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ').trim() || null : null,
      contact_email: (selectedContact?.contact_email ?? null) as string | null,
      notes: entryForm.notes || null,
    };
    if (editingEntryId != null) {
      setEntries((prev) => prev.map((e) => (e.id === editingEntryId ? newEntry : e)));
    } else {
      setEntries((prev) => [...prev, newEntry]);
    }
    setEntryModalOpen(false);
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveReport = async () => {
    setSaving(true);
    try {
      const payload: ODPlanEntryCreate[] = entries.map((e) => ({
        plan_date: e.plan_date.slice(0, 10),
        entry_type: e.entry_type,
        where_place: e.where_place ?? undefined,
        travel_time: e.travel_time ?? undefined,
        travel_type: e.travel_type ?? undefined,
        contact_id: e.contact_id ?? undefined,
        notes: e.notes ?? undefined,
      }));
      const updated = await marketingAPI.saveODPlanReport(year, month, { entries: payload });
      setReport(updated);
      setEntries(updated.entries || []);
      showToast('OD plan saved', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateContact = async () => {
    if (!createContactForm.first_name?.trim() || !createContactForm.last_name?.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }
    const fullPhone = serializePhoneWithCountryCode(createContactForm.phone_country_code, createContactForm.contact_phone);
    if (!fullPhone?.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!createContactForm.domain_id) {
      showToast('Domain is required', 'error');
      return;
    }
    setCreatingContact(true);
    try {
      const contact = await marketingAPI.createContact({
        title: createContactForm.name_prefix?.trim() || undefined,
        first_name: createContactForm.first_name.trim() || undefined,
        last_name: createContactForm.last_name.trim() || undefined,
        contact_email: createContactForm.contact_email.trim() || undefined,
        contact_phone: fullPhone.trim() || undefined,
        domain_id: createContactForm.domain_id,
        region_id: createContactForm.region_id ?? undefined,
        organization_id: createContactForm.organization_id ?? undefined,
        plant_id: createContactForm.plant_id ?? undefined,
      });
      setSelectedContact(contact);
      setEntryForm((f) => ({ ...f, contact_id: contact.id }));
      setAddContactModalOpen(false);
      setCreateContactForm({ name_prefix: '', first_name: '', last_name: '', contact_email: '', phone_country_code: DEFAULT_COUNTRY_CODE, contact_phone: '', domain_id: undefined, region_id: undefined, organization_id: undefined, plant_id: undefined });
      setCreateContactSelectedOrg(null);
      setContactCreatePlants([]);
      showToast('Contact created', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create contact', 'error');
    } finally {
      setCreatingContact(false);
    }
  };

  const breadcrumbs = [
    { label: 'Reports', href: '/reports' },
    { label: 'OD Plan', href: '/reports/od-plan' },
  ];

  return (
    <PageLayout
      title={`Outdoor plan — ${year} / ${String(month).padStart(2, '0')}`}
      description="Add visit, travel, or return-home plans for each date. For visits, add place, travel time/type, and contact (search by email or add new)."
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/reports')}>
          Back
        </Button>
      }
    >
      <Card>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-slate-500">
            <Loader2 size={20} className="animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
                  {day}
                </div>
              ))}
              {daysInMonth[0] && (() => {
                const firstDay = daysInMonth[0].getDay();
                return Array.from({ length: firstDay }, (_, i) => <div key={`pad-${i}`} />);
              })()}
              {daysInMonth.map((d) => {
                const key = dateToKey(d);
                const dayEntries = entriesByDate[key] || [];
                return (
                  <div
                    key={key}
                    className="min-h-[80px] border border-slate-200 rounded-lg p-2 flex flex-col"
                  >
                    <div className="text-xs font-medium text-slate-700 mb-1">{d.getDate()}</div>
                    <div className="flex-1 space-y-0.5">
                      {dayEntries.slice(0, 2).map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => openEditEntry(e)}
                          className="w-full text-left text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 truncate"
                          title={`${e.entry_type}: ${e.where_place || e.notes || '—'}`}
                        >
                          {e.entry_type === 'visit' && <MapPin size={10} className="inline mr-0.5" />}
                          {e.entry_type}: {e.where_place || e.contact_name || '—'}
                        </button>
                      ))}
                      {dayEntries.length > 2 && <span className="text-[10px] text-slate-500">+{dayEntries.length - 2}</span>}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={() => openAddEntry(key)} leftIcon={<Plus size={10} />}>
                      Add
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              <Button size="sm" leftIcon={saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} disabled={saving} onClick={handleSaveReport}>
                {saving ? 'Saving…' : 'Save report for this month'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>Cancel</Button>
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit entry modal */}
      <Modal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        title={editingEntryId ? 'Edit plan entry' : 'Add plan entry'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <DatePicker value={entryFormDate} onChange={(v) => { setEntryFormDate(v || ''); setEntryForm((f) => ({ ...f, plan_date: v || '' })); }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <Select
              options={ENTRY_TYPES}
              value={entryForm.entry_type}
              onChange={(v) => setEntryForm((f) => ({ ...f, entry_type: (typeof v === 'string' ? v : String(v ?? 'visit')) }))}
              searchable={false}
            />
          </div>
          {/* Where, Travel time, Travel type — for Travel and Return home */}
          {(entryForm.entry_type === 'travel' || entryForm.entry_type === 'return_home') && (
            <>
              <Input label="Where (place/city)" value={entryForm.where_place || ''} onChange={(e) => setEntryForm((f) => ({ ...f, where_place: e.target.value }))} placeholder="e.g. Mumbai office" />
              <Input label="Travel time" value={entryForm.travel_time || ''} onChange={(e) => setEntryForm((f) => ({ ...f, travel_time: e.target.value }))} placeholder="e.g. 09:00–10:00" />
              <Input label="Travel type" value={entryForm.travel_type || ''} onChange={(e) => setEntryForm((f) => ({ ...f, travel_type: e.target.value }))} placeholder="e.g. Car, Flight" />
            </>
          )}
          {/* Contact (search by email) — only for Visit */}
          {entryForm.entry_type === 'visit' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact (search by email)</label>
              <Input
                placeholder="Type email to search contacts"
                value={selectedContact ? (selectedContact.contact_email || [selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ')) : contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  if (!e.target.value) setSelectedContact(null);
                }}
              />
              {contactSearching && <p className="text-xs text-slate-500 mt-1">Searching…</p>}
              {contactSearch.trim().length >= 2 && !selectedContact && (
                <div className="mt-1 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                  {contactSearchResults.length === 0 ? (
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-slate-500">No contact found</span>
                      {canCreateContact && (
                        <Button variant="outline" size="sm" leftIcon={<UserPlus size={12} />} onClick={() => { setCreateContactForm((f) => ({ ...f, contact_email: contactSearch.trim() })); setCreateContactSelectedOrg(null); setOrgSearchQuery(''); setAddContactModalOpen(true); }}>
                          Add contact
                        </Button>
                      )}
                    </div>
                  ) : (
                    contactSearchResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        onClick={() => { setSelectedContact(c); setEntryForm((f) => ({ ...f, contact_id: c.id })); setContactSearch(''); }}
                      >
                        {[c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.contact_person_name || '—'} {c.contact_email && `(${c.contact_email})`}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[60px]"
              value={entryForm.notes || ''}
              onChange={(e) => setEntryForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes"
            />
          </div>
          <div className="flex justify-between gap-2">
            <div>
              {editingEntryId != null && (
                <Button variant="outline" size="sm" className="text-rose-600 border-rose-200" leftIcon={<Trash2 size={14} />} onClick={() => { removeEntry(editingEntryId); setEntryModalOpen(false); }}>
                  Remove entry
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEntryModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={saveEntryToLocal}>Save entry</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add contact modal: company name searches organizations, link or create org; then plant optional */}
      <Modal
        isOpen={addContactModalOpen}
        onClose={() => {
          setAddContactModalOpen(false);
          setCreateContactForm({ name_prefix: '', first_name: '', last_name: '', contact_email: '', phone_country_code: DEFAULT_COUNTRY_CODE, contact_phone: '', domain_id: undefined, region_id: undefined, organization_id: undefined, plant_id: undefined });
          setCreateContactSelectedOrg(null);
          setOrgSuggestions([]);
          setOrgSearchQuery('');
          setShowAddPlantInContactModal(false);
          setNewPlantForm({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' });
        }}
        title="Create contact"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Type to search organizations; link to one or create new. Then add plant if needed.</p>
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <Select label="Title" options={NAME_PREFIXES} value={createContactForm.name_prefix} onChange={(v) => setCreateContactForm((f) => ({ ...f, name_prefix: (v ?? '') as string }))} searchable={false} />
            </div>
            <div className="flex-1"><Input label="First name" value={createContactForm.first_name} onChange={(e) => setCreateContactForm((f) => ({ ...f, first_name: e.target.value }))} placeholder="First name" required /></div>
            <div className="flex-1"><Input label="Last name" value={createContactForm.last_name} onChange={(e) => setCreateContactForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Last name" required /></div>
          </div>
          <div className="flex gap-2">
            <div className="w-28 shrink-0">
              <Select label="Phone code" options={COUNTRY_CODES} value={createContactForm.phone_country_code} onChange={(v) => setCreateContactForm((f) => ({ ...f, phone_country_code: (v ?? '') as string }))} searchable getSearchText={getCountryCodeSearchText} />
            </div>
            <div className="flex-1"><Input label="Phone" value={createContactForm.contact_phone} onChange={(e) => setCreateContactForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="Number" required /></div>
          </div>
          <Input label="Email" type="email" value={createContactForm.contact_email} onChange={(e) => setCreateContactForm((f) => ({ ...f, contact_email: e.target.value }))} placeholder="email@example.com" />
          <div className="relative">
            <Input
              label="Organization (optional)"
              value={createContactSelectedOrg?.name ?? orgSearchQuery}
              onChange={(e) => onOrganizationSearchChange(e.target.value)}
              onBlur={() => setTimeout(() => { setOrgSuggestions([]); }, 150)}
              placeholder="Type to search organization"
            />
            {createContactForm.organization_id != null && (
              <div className="absolute right-2 top-8 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={clearContactOrganization}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Clear organization"
                >
                  <X size={16} />
                </button>
                <a
                  href={`/organizations/${createContactForm.organization_id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md transition-colors"
                  title="Open organization in new tab"
                >
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
            {(orgSuggestions.length > 0 || (orgSearchQuery.trim().length >= 2 && canCreateOrg)) && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                {orgSuggestions.length > 0 && (
                  <>
                    <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100">Link to organization:</p>
                    {orgSuggestions.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col gap-0.5"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOrgSuggestions([]);
                          setOrgSearchQuery('');
                          marketingAPI.getOrganization(org.id).then((fullOrg) => {
                            marketingAPI.getOrganizationPlants(org.id).then((plants) => {
                              const firstPlant = plants?.length ? plants[0] : null;
                              setCreateContactSelectedOrg({ id: fullOrg.id, name: fullOrg.name });
                              setCreateContactForm((f) => ({ ...f, organization_id: fullOrg.id, plant_id: firstPlant ? firstPlant.id : undefined }));
                              setContactCreatePlants(plants ?? []);
                              showToast('Linked to organization' + (firstPlant ? ' and plant' : ''), 'success');
                            }).catch(() => {
                              setCreateContactSelectedOrg({ id: fullOrg.id, name: fullOrg.name });
                              setCreateContactForm((f) => ({ ...f, organization_id: fullOrg.id }));
                              setContactCreatePlants([]);
                              showToast('Linked to organization', 'success');
                            });
                          }).catch(() => {
                            setCreateContactSelectedOrg({ id: org.id, name: org.name });
                            setCreateContactForm((f) => ({ ...f, organization_id: org.id }));
                            setContactCreatePlants([]);
                            showToast('Linked to organization', 'success');
                          });
                        }}
                      >
                        <span className="font-medium">{org.name}</span>
                        {(org.industry || org.website || org.code) && <span className="text-slate-500 text-xs">{[org.code, org.industry, org.website].filter(Boolean).join(' · ')}</span>}
                      </button>
                    ))}
                  </>
                )}
                {canCreateOrg && (
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100 text-indigo-600 font-medium"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); openCreateOrgModal(); }}
                  >
                    <Plus size={16} />
                    {orgSuggestions.length === 0 ? `Create organization "${orgSearchQuery || createContactSelectedOrg?.name || ''}"` : 'Create new organization'}
                  </button>
                )}
              </div>
            )}
          </div>
          <Select
            label="Domain *"
            options={[{ value: '', label: '— Select —' }, ...domains.map((d) => ({ value: String(d.id), label: d.name }))]}
            value={createContactForm.domain_id != null ? String(createContactForm.domain_id) : ''}
            onChange={(v) => setCreateContactForm((f) => ({ ...f, domain_id: v ? Number(v) : undefined, region_id: undefined }))}
            searchable
          />
          {createContactForm.domain_id && (
            <Select
              label="Region"
              options={[{ value: '', label: '— Select —' }, ...regions.map((r) => ({ value: String(r.id), label: r.name }))]}
              value={createContactForm.region_id != null ? String(createContactForm.region_id) : ''}
              onChange={(v) => setCreateContactForm((f) => ({ ...f, region_id: v ? Number(v) : undefined }))}
              searchable
            />
          )}
          {createContactForm.organization_id != null && (
            <div className="space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Plant"
                    options={[{ value: '', label: 'None' }, ...contactCreatePlants.map((p) => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` }))]}
                    value={createContactForm.plant_id != null ? String(createContactForm.plant_id) : ''}
                    onChange={(v) => setCreateContactForm((f) => ({ ...f, plant_id: v ? Number(v) : undefined }))}
                    placeholder={contactCreatePlants.length === 0 ? 'No plants — add one below' : 'Select plant'}
                    searchable
                  />
                </div>
                {canCreatePlant && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddPlantInContactModal((p) => !p)} leftIcon={<Plus size={14} />}>Add plant</Button>
                )}
              </div>
              {showAddPlantInContactModal && canCreatePlant && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <p className="text-xs font-medium text-slate-700">New plant for this organization</p>
                  <Input label="Plant name" value={newPlantForm.plant_name} onChange={(e) => setNewPlantForm((f) => ({ ...f, plant_name: e.target.value }))} placeholder="e.g. Main Plant" />
                  <Input label="Address" value={newPlantForm.address_line1} onChange={(e) => setNewPlantForm((f) => ({ ...f, address_line1: e.target.value }))} placeholder="Address line 1" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="City" value={newPlantForm.city} onChange={(e) => setNewPlantForm((f) => ({ ...f, city: e.target.value }))} placeholder="City" />
                    <Input label="Country" value={newPlantForm.country} onChange={(e) => setNewPlantForm((f) => ({ ...f, country: e.target.value }))} placeholder="Country" />
                  </div>
                  <Input label="Postal code" value={newPlantForm.postal_code} onChange={(e) => setNewPlantForm((f) => ({ ...f, postal_code: e.target.value }))} placeholder="Postal code" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddPlantInContactModal} disabled={addingPlant || !newPlantForm.plant_name?.trim()}>{addingPlant ? 'Adding…' : 'Add plant'}</Button>
                    <Button variant="outline" size="sm" onClick={() => { setShowAddPlantInContactModal(false); setNewPlantForm({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' }); }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setAddContactModalOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={creatingContact || !createContactForm.first_name?.trim() || !createContactForm.last_name?.trim() || !(serializePhoneWithCountryCode(createContactForm.phone_country_code, createContactForm.contact_phone)?.trim()) || !createContactForm.domain_id} onClick={handleCreateContact}>
              {creatingContact ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create organization modal */}
      <Modal
        isOpen={orgModalOpen}
        onClose={() => { setOrgModalOpen(false); setNewOrgForm({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' }); }}
        title="Create organization"
      >
        <div className="space-y-3">
          <Input label="Name *" value={newOrgForm.name} onChange={(e) => setNewOrgForm((f) => ({ ...f, name: e.target.value }))} placeholder="Organization name" />
          <Input label="Code" value={newOrgForm.code} onChange={(e) => setNewOrgForm((f) => ({ ...f, code: e.target.value }))} placeholder="Optional code" />
          <Input label="Website" value={newOrgForm.website} onChange={(e) => setNewOrgForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
          <Input label="Industry" value={newOrgForm.industry} onChange={(e) => setNewOrgForm((f) => ({ ...f, industry: e.target.value }))} placeholder="e.g. IT, Manufacturing" />
          <Select
            label="Size"
            options={COMPANY_SIZES}
            value={newOrgForm.organization_size}
            onChange={(v) => setNewOrgForm((f) => ({ ...f, organization_size: (v as string) || '' }))}
            placeholder="Select size"
            searchable
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[60px]" value={newOrgForm.description} onChange={(e) => setNewOrgForm((f) => ({ ...f, description: e.target.value }))} placeholder="Notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOrgModalOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={creatingOrg || !newOrgForm.name?.trim()} onClick={handleCreateOrganization}>{creatingOrg ? 'Creating…' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
