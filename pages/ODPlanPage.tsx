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
import { getSubmissionDeadline } from '../lib/deadline-utils';
import { Tooltip } from '../UI/Tooltip';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText, INDUSTRY_OPTIONS } from '../constants';
import { serializePhoneWithCountryCode } from '../lib/name-phone-utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Edit3,
  Loader2,
  Plus,
  Save,
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

function dateToKey(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export const ODPlanPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const deadline = getSubmissionDeadline();

  const [report, setReport] = useState<ODPlanReportItem | null>(null);
  const [entries, setEntries] = useState<ODPlanEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const todaysKey = useMemo(() => dateToKey(new Date()), []);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => {
    const datesParam = searchParams.get('dates');
    if (datesParam) {
      const parsed = datesParam.split(',').filter(Boolean);
      if (parsed.length > 0) return new Set(parsed);
    }
    return new Set([todaysKey]);
  });
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [deleteConfirmEntryId, setDeleteConfirmEntryId] = useState<number | null>(null);
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

  // Sync selected dates to URL for refresh persistence
  useEffect(() => {
    const dates = Array.from(selectedDates).sort().join(',');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (selectedDates.size > 0) next.set('dates', dates);
      else next.delete('dates');
      return next;
    }, { replace: true });
  }, [selectedDates, setSearchParams]);

  const entriesByDate = useMemo(() => {
    const map: Record<string, ODPlanEntryItem[]> = {};
    entries.forEach((e) => {
      const key = e.plan_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [entries]);
  const prevMonthNav = useMemo(() => {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  }, [year, month]);
  const nextMonthNav = useMemo(() => {
    if (month === 12) return { year: year + 1, month: 1 };
    return { year, month: month + 1 };
  }, [year, month]);

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

  const persistEntries = useCallback(async (updatedEntries: ODPlanEntryItem[]) => {
    if (deadline.isPast) {
      showToast(deadline.message, 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: ODPlanEntryCreate[] = updatedEntries.map((e) => ({
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
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save plan', 'error');
      setEntries(updatedEntries);
    } finally {
      setSaving(false);
    }
  }, [year, month, showToast]);

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
    setEntryModalOpen(false);
    const updated = editingEntryId != null
      ? entries.map((e) => (e.id === editingEntryId ? newEntry : e))
      : [...entries, newEntry];
    setEntries(updated);
    persistEntries(updated);
  };

  const removeEntry = (id: number) => {
    setDeleteConfirmEntryId(null);
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    persistEntries(updated);
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/reports')}>
            Back
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <Card>
            <div className="flex items-center gap-2 py-8 text-slate-500 justify-center">
              <Loader2 size={20} className="animate-spin" /> Loading…
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${deadline.isPast ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              <AlertCircle size={16} className="shrink-0" />
              <span>{deadline.message}</span>
            </div>
            {/* Month navigation + saving indicator */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
              <button
                type="button"
                onClick={() => navigate(`/reports/od-plan?year=${prevMonthNav.year}&month=${prevMonthNav.month}`)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">
                  {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                </span>
                {saving && (
                  <Loader2 size={14} className="animate-spin text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate(`/reports/od-plan?year=${nextMonthNav.year}&month=${nextMonthNav.month}`)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Summary stats */}
            {(() => {
              const totalVisits = entries.filter(e => e.entry_type === 'visit').length;
              const totalTravels = entries.filter(e => e.entry_type === 'travel').length;
              const totalReturnHome = entries.filter(e => e.entry_type === 'return_home').length;
              const daysWithEntries = new Set(entries.map(e => e.plan_date.slice(0, 10))).size;
              return (
                <div className="flex items-center gap-4 px-1">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    <span className="text-blue-600 font-bold">{totalVisits}</span> visits
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    <span className="text-amber-600 font-bold">{totalTravels}</span> travels
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    <span className="text-slate-600 font-bold">{totalReturnHome}</span> return
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    <span className="text-slate-800 font-bold">{daysWithEntries}</span> days
                  </span>
                </div>
              );
            })()}

            {/* Date picker — multi-select mode */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <DatePicker
                  selectedDates={selectedDates}
                  onSelectedDatesChange={(dates) => setSelectedDates(dates)}
                  placeholder="Select dates..."
                  onChange={() => {}}
                />
              </div>
              <button
                type="button"
                onClick={() => setSelectedDates(new Set([todaysKey]))}
                className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                  selectedDates.has(todaysKey) && selectedDates.size === 1
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
            </div>

            {/* Selected date chips */}
            {selectedDates.size > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from(selectedDates).sort().map((key) => {
                  const dt = new Date(key + 'T00:00:00');
                  const label = dt.toLocaleString('default', { weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                      {label}
                      <button type="button" onClick={() => setSelectedDates((prev) => { const n = new Set(prev); n.delete(key); return n; })} className="hover:text-blue-900">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                {selectedDates.size > 0 && (
                  <button type="button" onClick={() => setSelectedDates(new Set())} className="text-xs text-slate-400 hover:text-slate-600 ml-1">
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Accordion for selected dates */}
            <div className="space-y-2">
              {Array.from(selectedDates).sort().map((key) => {
                const dayEntries = entriesByDate[key] || [];
                const dt = new Date(key + 'T00:00:00');
                const dayName = dt.toLocaleString('default', { weekday: 'short' });
                const dayNum = dt.getDate();
                const isToday = key === todaysKey;
                const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                const isExpanded = expandedDays.has(key);

                const toggleDay = () => {
                  setExpandedDays((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                };

                const chipColor = (type: string) =>
                  type === 'visit' ? 'bg-blue-100 text-blue-700' :
                  type === 'travel' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600';

                return (
                  <div key={key} className={`border border-slate-200 rounded-lg overflow-hidden ${isWeekend ? 'bg-slate-50/40' : 'bg-white'}`}>
                    {/* Collapsed row — clickable */}
                    <button
                      type="button"
                      onClick={toggleDay}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isToday ? 'bg-blue-50/50' : ''} hover:bg-slate-50/80`}
                    >
                      <span className={`text-base font-bold w-7 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                        {dayNum}
                      </span>
                      <span className={`text-xs font-semibold w-10 ${isToday ? 'text-blue-700' : 'text-slate-600'}`}>
                        {dayName}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
                          Today
                        </span>
                      )}
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        {dayEntries.length === 0 && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                        {dayEntries.map((entry) => {
                          const label = entry.where_place || entry.contact_name || entry.entry_type;
                          const words = label.split(/\s+/).slice(0, 2).join(' ');
                          return (
                            <span
                              key={entry.id}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider truncate max-w-[120px] ${chipColor(entry.entry_type)}`}
                            >
                              {words}
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 mr-1">
                        {dayEntries.length}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-slate-100">
                        {dayEntries.length === 0 && (
                          <div className="px-4 py-6 text-center">
                            <button
                              type="button"
                              onClick={() => { setEntryFormDate(key); setEditingEntryId(null); setEntryForm({ plan_date: key, entry_type: 'visit', where_place: '', travel_time: '', travel_type: '', contact_id: undefined, notes: '' }); setContactSearch(''); setSelectedContact(null); setEntryModalOpen(true); }}
                              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <Plus size={12} /> Add entry
                            </button>
                          </div>
                        )}
                        {dayEntries.length > 0 && (
                          <>
                            <div className="divide-y divide-slate-100">
                              {dayEntries.map((entry) => {
                                const typeLabel = ENTRY_TYPES.find(t => t.value === entry.entry_type)?.label || entry.entry_type;
                                return (
                                  <div key={entry.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${chipColor(entry.entry_type)}`}>
                                            {typeLabel}
                                          </span>
                                          <span className="text-sm font-medium text-slate-800 truncate">
                                            {entry.where_place || entry.contact_name || '—'}
                                          </span>
                                        </div>
                                        {entry.contact_name && (
                                          <div className="text-xs text-slate-500 ml-1">
                                            {entry.contact_name}{entry.contact_email ? ` · ${entry.contact_email}` : ''}
                                          </div>
                                        )}
                                        {entry.travel_time && (
                                          <div className="text-xs text-slate-500 ml-1">
                                            {entry.travel_time}{entry.travel_type ? ` · ${entry.travel_type}` : ''}
                                          </div>
                                        )}
                                        {entry.notes && (
                                          <div className="text-xs text-slate-400 ml-1 mt-0.5 italic line-clamp-1">{entry.notes}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 ml-3 shrink-0">
                                        <Tooltip content="Edit entry">
                                          <button
                                            type="button"
                                            onClick={() => openEditEntry(entry)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                          >
                                            <Edit3 size={14} />
                                          </button>
                                        </Tooltip>
                                        <Tooltip content="Remove entry">
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmEntryId(entry.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                          >
                                            <X size={14} />
                                          </button>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <button
                              type="button"
                              onClick={() => { setEntryFormDate(key); setEditingEntryId(null); setEntryForm({ plan_date: key, entry_type: 'visit', where_place: '', travel_time: '', travel_type: '', contact_id: undefined, notes: '' }); setContactSearch(''); setSelectedContact(null); setEntryModalOpen(true); }}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors border-t border-slate-100"
                            >
                              <Plus size={12} /> Add entry
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteConfirmEntryId != null}
        onClose={() => setDeleteConfirmEntryId(null)}
        title="Remove entry"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirmEntryId(null)}>Keep it</Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => deleteConfirmEntryId != null && removeEntry(deleteConfirmEntryId)}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to remove this entry? This action cannot be undone.</p>
      </Modal>

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
                <Tooltip content="Clear organization">
                  <button
                    type="button"
                    onClick={clearContactOrganization}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <X size={16} />
                  </button>
                </Tooltip>
                <Tooltip content="Open organization in new tab">
                  <a
                    href={`/organizations/${createContactForm.organization_id}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md transition-colors"
                  >
                    <ArrowRight size={16} />
                  </a>
                </Tooltip>
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
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 text-blue-600 font-medium"
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
          <Select label="Industry" options={INDUSTRY_OPTIONS} value={newOrgForm.industry} onChange={(v) => setNewOrgForm((f) => ({ ...f, industry: (v as string) || '' }))} placeholder="Select industry..." />
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
