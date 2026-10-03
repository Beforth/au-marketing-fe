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
  Building2,
  Edit3,
  MapPin,
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
  // Plans can only be made for NEXT month; every other month is read-only (unplanned visits are the exception)
  const canEditPlan = year === nextMonth.year && month === nextMonth.month;
  const monthName = (y: number, m: number) => new Date(y, m - 1).toLocaleString('default', { month: 'long' });
  const isCurrentMonthView = year === new Date().getFullYear() && month === new Date().getMonth() + 1;

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
  // every picked day opens expanded so its "Add plan" button is visible; this holds the ones the user closed
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [justSaved, setJustSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashSaved = useCallback(() => {
    setJustSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 3000);
  }, []);
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

  // Who / where a visit is: an existing contact, a company (+ plant) when the person isn't known, or just a place
  type VisitMode = 'contact' | 'org' | 'place';
  const [visitMode, setVisitMode] = useState<VisitMode>('contact');
  const [unplannedMode, setUnplannedMode] = useState(false);
  const [visitOrg, setVisitOrg] = useState<{ id: number; name: string } | null>(null);
  const [visitOrgQuery, setVisitOrgQuery] = useState('');
  const [visitOrgResults, setVisitOrgResults] = useState<{ id: number; name: string }[]>([]);
  const [visitOrgSearching, setVisitOrgSearching] = useState(false);
  const [visitPlants, setVisitPlants] = useState<Plant[]>([]);
  const [visitPlantId, setVisitPlantId] = useState<number | undefined>(undefined);
  const [newCoMode, setNewCoMode] = useState<null | 'company' | 'plant'>(null);
  const [newCo, setNewCo] = useState<{ company_name: string; plant_name: string; city: string; domain_id?: number; region_id?: number }>({ company_name: '', plant_name: '', city: '' });
  const [coRegions, setCoRegions] = useState<{ id: number; name: string }[]>([]);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const visitOrgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const resetVisitTarget = useCallback(() => {
    setVisitMode('contact');
    setVisitOrg(null);
    setVisitOrgQuery('');
    setVisitOrgResults([]);
    setVisitPlants([]);
    setVisitPlantId(undefined);
    setNewCoMode(null);
    setNewCo({ company_name: '', plant_name: '', city: '', domain_id: domains.length === 1 ? domains[0].id : undefined, region_id: undefined });
  }, [domains]);

  // company search for the "Company and plant" option (same organization visibility rules as the Organizations page)
  const onVisitOrgQueryChange = (value: string) => {
    setVisitOrgQuery(value);
    if (visitOrgTimeoutRef.current) clearTimeout(visitOrgTimeoutRef.current);
    if (value.trim().length < 2) { setVisitOrgResults([]); return; }
    visitOrgTimeoutRef.current = setTimeout(() => {
      setVisitOrgSearching(true);
      marketingAPI.getOrganizations({ page: 1, page_size: 15, search: value.trim(), is_active: true })
        .then((res) => setVisitOrgResults((res.items ?? []).map((o: { id: number; name: string }) => ({ id: o.id, name: o.name }))))
        .catch(() => setVisitOrgResults([]))
        .finally(() => setVisitOrgSearching(false));
    }, 300);
  };

  const pickVisitOrg = (org: { id: number; name: string }) => {
    setVisitOrg(org);
    setVisitOrgQuery('');
    setVisitOrgResults([]);
    setVisitPlantId(undefined);
    setNewCoMode(null);
    marketingAPI.getOrganizationPlants(org.id).then(setVisitPlants).catch(() => setVisitPlants([]));
  };

  useEffect(() => {
    if (newCo.domain_id) {
      marketingAPI.getRegions({ domain_id: newCo.domain_id, is_active: true, page: 1, page_size: 100 })
        .then((r) => setCoRegions(r.items.map((rr: { id: number; name: string }) => ({ id: rr.id, name: rr.name }))))
        .catch(() => setCoRegions([]));
    } else {
      setCoRegions([]);
    }
  }, [newCo.domain_id]);

  const handleCreateCompanyAndPlant = async () => {
    if (newCoMode === 'company' && !newCo.company_name.trim()) { showToast('Company name is required', 'error'); return; }
    if (!newCo.plant_name.trim()) { showToast('Plant name is required', 'error'); return; }
    if (!newCo.domain_id) { showToast('Pick the domain this plant belongs to', 'error'); return; }
    setCreatingCompany(true);
    try {
      let org = visitOrg;
      if (newCoMode === 'company') {
        const created = await marketingAPI.createOrganization({ name: newCo.company_name.trim(), is_active: true });
        org = { id: created.id, name: created.name };
      }
      if (!org) return;
      const plant = await marketingAPI.createOrganizationPlant(org.id, {
        plant_name: newCo.plant_name.trim(),
        city: newCo.city.trim() || undefined,
        domain_id: newCo.domain_id,
        region_id: newCo.region_id,
      });
      setVisitOrg(org);
      setVisitPlants(await marketingAPI.getOrganizationPlants(org.id));
      setVisitPlantId(plant.id);
      setNewCoMode(null);
      setNewCo((f) => ({ ...f, company_name: '', plant_name: '', city: '' }));
      showToast(newCoMode === 'company' ? 'Company and plant added' : 'Plant added', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not add the company', 'error');
    } finally {
      setCreatingCompany(false);
    }
  };

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await marketingAPI.getODPlanReport(year, month);
      setReport(data);
      setEntries(data.entries || []);
      if (!(year === nextMonth.year && month === nextMonth.month)) {
        setSelectedDates(new Set((data.entries || []).map((e) => e.plan_date.slice(0, 10))));
      }
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

  // /reports/od-plan?unplanned=1 (from MIS) opens the unplanned-visit form straight away
  useEffect(() => {
    if (!loading && isCurrentMonthView && searchParams.get('unplanned')) {
      openAddUnplanned();
      const next = new URLSearchParams(searchParams);
      next.delete('unplanned');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
    setUnplannedMode(false);
    resetVisitTarget();
    setEntryModalOpen(true);
  };

  // Unplanned visit: something that already happened and was not in the plan (today or earlier, this month only)
  const openAddUnplanned = () => {
    const now = new Date();
    const today = dateToKey(now);
    openAddEntry(today);
    setUnplannedMode(true);
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
    setSelectedContact(entry.contact_id ? { id: entry.contact_id, contact_email: entry.contact_email ?? '', first_name: entry.contact_name ?? '', last_name: '' } as Contact : null);
    setContactSearch('');
    setEditingEntryId(entry.id);
    setUnplannedMode(false);
    resetVisitTarget();
    if (!entry.contact_id && entry.organization_id) {
      setVisitMode('org');
      setVisitOrg({ id: entry.organization_id, name: entry.organization_name ?? 'Company' });
      setVisitPlantId(entry.plant_id ?? undefined);
      marketingAPI.getOrganizationPlants(entry.organization_id).then(setVisitPlants).catch(() => setVisitPlants([]));
    } else if (!entry.contact_id && entry.where_place) {
      setVisitMode('place');
    }
    setEntryModalOpen(true);
  };

  const persistEntries = useCallback(async (updatedEntries: ODPlanEntryItem[]) => {
    if (deadline.isPast) {
      showToast(deadline.message, 'error');
      return;
    }
    setSaving(true);
    try {
      // unplanned visits have their own endpoints and are never part of the plan being saved
      const payload: ODPlanEntryCreate[] = updatedEntries.filter((e) => !e.is_unplanned).map((e) => ({
        plan_date: e.plan_date.slice(0, 10),
        entry_type: e.entry_type,
        where_place: e.where_place ?? undefined,
        travel_time: e.travel_time ?? undefined,
        travel_type: e.travel_type ?? undefined,
        contact_id: e.contact_id ?? undefined,
        organization_id: e.contact_id ? undefined : e.organization_id ?? undefined,
        plant_id: e.contact_id ? undefined : e.plant_id ?? undefined,
        notes: e.notes ?? undefined,
      }));
      const updated = await marketingAPI.saveODPlanReport(year, month, { entries: payload });
      setReport(updated);
      setEntries(updated.entries || []);
      flashSaved();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save plan', 'error');
      setEntries(updatedEntries);
    } finally {
      setSaving(false);
    }
  }, [year, month, showToast]);

  const saveEntryToLocal = async () => {
    if (!entryForm.plan_date.trim()) return;
    const isVisit = unplannedMode || entryForm.entry_type === 'visit';
    const byContact = isVisit && visitMode === 'contact';
    const byOrg = isVisit && visitMode === 'org';
    const place = isVisit && visitMode === 'place' ? (entryForm.where_place || '').trim() : (isVisit ? '' : (entryForm.where_place || ''));
    const contactId = byContact ? (selectedContact?.id ?? entryForm.contact_id ?? null) : null;
    if (isVisit && !(contactId || (byOrg && visitOrg) || place)) {
      showToast('Say who or where: pick a contact, a company, or type a place', 'error');
      return;
    }
    const orgId = byOrg ? visitOrg?.id ?? null : null;
    const plantId = byOrg ? visitPlantId ?? null : null;

    if (unplannedMode) {
      const day = entryForm.plan_date.slice(0, 10);
      if (day > dateToKey(new Date()) || day.slice(0, 7) !== `${year}-${String(month).padStart(2, '0')}`) {
        showToast('An unplanned visit must be today or an earlier date in this month', 'error');
        return;
      }
      setSaving(true);
      try {
        await marketingAPI.addUnplannedVisit(year, month, {
          plan_date: day, entry_type: 'visit', where_place: place || undefined, contact_id: contactId ?? undefined,
          organization_id: orgId ?? undefined, plant_id: plantId ?? undefined, notes: entryForm.notes || undefined,
        });
        setEntryModalOpen(false);
        setUnplannedMode(false);
        await loadReport();
        setSelectedDates((prev) => new Set(prev).add(day));
        setCollapsedDays((prev) => { const n = new Set(prev); n.delete(day); return n; });
        flashSaved();
        showToast('Unplanned visit added', 'success');
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'Could not add the unplanned visit', 'error');
      } finally {
        setSaving(false);
      }
      return;
    }

    const plantName = visitPlants.find((pl) => pl.id === plantId)?.plant_name ?? null;
    const newEntry: ODPlanEntryItem = {
      id: editingEntryId ?? -(Date.now()),
      plan_date: entryForm.plan_date,
      entry_type: entryForm.entry_type,
      where_place: place || null,
      travel_time: entryForm.travel_time || null,
      travel_type: entryForm.travel_type || null,
      contact_id: contactId,
      contact_name: byContact && selectedContact ? [selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ').trim() || null : null,
      contact_email: (byContact ? selectedContact?.contact_email ?? null : null) as string | null,
      organization_id: orgId,
      organization_name: byOrg ? visitOrg?.name ?? null : null,
      plant_id: plantId,
      plant_name: byOrg ? plantName : null,
      is_unplanned: false,
      notes: entryForm.notes || null,
    };
    setEntryModalOpen(false);
    const updated = editingEntryId != null
      ? entries.map((e) => (e.id === editingEntryId ? newEntry : e))
      : [...entries, newEntry];
    setEntries(updated);
    persistEntries(updated);
  };

  const removeEntry = async (id: number) => {
    setDeleteConfirmEntryId(null);
    const target = entries.find((e) => e.id === id);
    if (target?.is_unplanned) {
      try {
        await marketingAPI.deleteUnplannedVisit(id);
        await loadReport();
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'Could not remove the visit', 'error');
      }
      return;
    }
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    persistEntries(updated);
  };

  const handleCreateContact = async () => {
    if (!createContactForm.first_name?.trim()) {
      showToast('First name is required', 'error');
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
    { label: 'MIS', href: '/reports' },
    { label: 'OD Plan', href: '/reports/od-plan' },
  ];

  return (
    <PageLayout
      title={`Outdoor plan — ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`}
      description="Add visit, travel, or return-home plans for each date. For a visit, pick who or where: a contact, a company and plant, or just a place."
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          {isCurrentMonthView && (
            <Button size="sm" leftIcon={<Plus size={14} />} onClick={openAddUnplanned}>
              Add unplanned visit
            </Button>
          )}
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
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading…
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${deadline.isPast ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              <AlertCircle size={16} className="shrink-0" />
              <span>{deadline.message}</span>
            </div>
            {!canEditPlan && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm bg-slate-50 text-slate-700 border border-slate-200">
                <span>You're viewing {monthName(year, month)} {year}. Plans can only be made for <strong>{monthName(nextMonth.year, nextMonth.month)} {nextMonth.year}</strong>.</span>
                <Button size="sm" onClick={() => navigate(`/reports/od-plan?year=${nextMonth.year}&month=${nextMonth.month}`)}>Plan {monthName(nextMonth.year, nextMonth.month)}</Button>
              </div>
            )}
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
                  {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year} <span className="font-normal text-slate-400">({String(month).padStart(2, '0')}/{year})</span>
                </span>
                {saving && (
                  <div className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-400" />
                )}
                {justSaved && !saving && <span className="text-xs font-semibold text-emerald-600">✓ Saved</span>}
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
              const totalVisits = entries.filter(e => e.entry_type === 'visit' && !e.is_unplanned).length;
              const totalUnplanned = entries.filter(e => e.is_unplanned).length;
              const totalTravels = entries.filter(e => e.entry_type === 'travel').length;
              const totalReturnHome = entries.filter(e => e.entry_type === 'return_home').length;
              const daysWithEntries = new Set(entries.map(e => e.plan_date.slice(0, 10))).size;
              if (entries.length === 0) return null;
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
                  {totalUnplanned > 0 && (
                    <>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        <span className="text-amber-600 font-bold">{totalUnplanned}</span> unplanned
                      </span>
                    </>
                  )}
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    <span className="text-slate-800 font-bold">{daysWithEntries}</span> days
                  </span>
                </div>
              );
            })()}

            {canEditPlan && (<>
            {/* Step 1 — pick the days */}
            <div className="px-1">
              <p className="text-sm font-semibold text-slate-800">Step 1 · Pick the days you'll be out of office</p>
              <p className="text-xs text-slate-500">Click the box and choose one or more dates.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <DatePicker
                  selectedDates={selectedDates}
                  onSelectedDatesChange={(dates) => setSelectedDates(dates)}
                  placeholder="Click here to pick your dates"
                  selectedLabel={(n) => `${n} day${n > 1 ? 's' : ''} picked · click to change`}
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
                Use today
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

            {selectedDates.size > 0 && (
              <div className="px-1">
                <p className="text-sm font-semibold text-slate-800">Step 2 · For each day below, click "Add plan" and say what you'll do</p>
                <p className="text-xs text-slate-500">Choose a visit, travel, or return home. Changes save as you go.</p>
              </div>
            )}

            </>)}

            {/* Accordion for selected dates */}
            <div className="space-y-2">
              {Array.from(selectedDates).sort().map((key) => {
                const dayEntries = entriesByDate[key] || [];
                const dt = new Date(key + 'T00:00:00');
                const dayName = dt.toLocaleString('default', { weekday: 'short' });
                const dayNum = dt.getDate();
                const isToday = key === todaysKey;
                const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
                const isExpanded = !collapsedDays.has(key);

                const toggleDay = () => {
                  setCollapsedDays((prev) => {
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
                          const label = entry.where_place || entry.organization_name || entry.contact_name || entry.entry_type;
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
                            <p className="text-sm text-slate-500 mb-3">Nothing planned for this day{canEditPlan ? ' yet' : ''}</p>
                            {canEditPlan && (
                              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => openAddEntry(key)}>
                                Add plan for {dt.toLocaleString('default', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </Button>
                            )}
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
                                            {entry.where_place || entry.organization_name || entry.contact_name || '—'}
                                          </span>
                                          {entry.is_unplanned && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">Unplanned</span>
                                          )}
                                        </div>
                                        {(entry.organization_name || entry.plant_name) && (
                                          <div className="text-xs text-slate-500 ml-1 flex items-center gap-1">
                                            <Building2 size={11} className="shrink-0" />
                                            {[entry.organization_name, entry.plant_name].filter(Boolean).join(' · ')}
                                          </div>
                                        )}
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
                                        {!entry.is_unplanned && canEditPlan && (
                                          <Tooltip content="Edit entry">
                                            <button
                                              type="button"
                                              onClick={() => openEditEntry(entry)}
                                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                            >
                                              <Edit3 size={14} />
                                            </button>
                                          </Tooltip>
                                        )}
                                        {(canEditPlan || entry.is_unplanned) && <Tooltip content="Remove entry">
                                          <button
                                            type="button"
                                            onClick={() => setDeleteConfirmEntryId(entry.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                          >
                                            <X size={14} />
                                          </button>
                                        </Tooltip>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {canEditPlan && (
                              <button
                                type="button"
                                onClick={() => openAddEntry(key)}
                                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-blue-700 bg-blue-50/60 hover:bg-blue-100 transition-colors border-t border-blue-100"
                              >
                                <Plus size={16} /> Add another visit or travel plan
                              </button>
                            )}
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
        title={unplannedMode ? 'Add unplanned visit' : editingEntryId ? 'Edit plan' : 'Add visit or travel plan'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <DatePicker value={entryFormDate} onChange={(v) => { setEntryFormDate(v || ''); setEntryForm((f) => ({ ...f, plan_date: v || '' })); }} />
          </div>
          {unplannedMode && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              For a visit that already happened and was not in your plan. Use today or an earlier date in this month. It stays open after the plan deadline.
            </p>
          )}
          {!unplannedMode && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">What will you do?</label>
              <div className="grid grid-cols-3 gap-2">
                {[['visit', 'Visit', 'A customer, company or place'], ['travel', 'Travel', 'Going from one place to another'], ['return_home', 'Return home', 'Back to base']].map(([v, label, hint]) => (
                  <button key={v} type="button" onClick={() => setEntryForm((f) => ({ ...f, entry_type: v }))}
                    className={`text-left rounded-lg border px-3 py-2 transition-colors ${entryForm.entry_type === v ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`text-sm font-semibold ${entryForm.entry_type === v ? 'text-blue-700' : 'text-slate-700'}`}>{label}</div>
                    <div className="text-[11px] text-slate-500 leading-snug">{hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Where, Travel time, Travel type — for Travel and Return home */}
          {(entryForm.entry_type === 'travel' || entryForm.entry_type === 'return_home') && (
            <>
              <Input label="Where (place/city)" value={entryForm.where_place || ''} onChange={(e) => setEntryForm((f) => ({ ...f, where_place: e.target.value }))} placeholder="e.g. Mumbai office" />
              <Input label="Travel time" value={entryForm.travel_time || ''} onChange={(e) => setEntryForm((f) => ({ ...f, travel_time: e.target.value }))} placeholder="e.g. 09:00–10:00" />
              <Input label="Travel type" value={entryForm.travel_type || ''} onChange={(e) => setEntryForm((f) => ({ ...f, travel_type: e.target.value }))} placeholder="e.g. Car, Flight" />
            </>
          )}
          {/* Who / where — only for Visit: a contact, a company (+ plant), or just a place */}
          {(unplannedMode || entryForm.entry_type === 'visit') && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Who or where</label>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-3">
                {([['contact', 'Existing contact'], ['org', 'Company and plant'], ['place', 'Just a place']] as [VisitMode, string][]).map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setVisitMode(k)}
                    className={`flex-1 px-2 py-2 text-xs font-semibold border-r border-slate-200 last:border-r-0 transition-colors ${visitMode === k ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {visitMode === 'contact' && (
                <div>
                  <Input
                    placeholder="Search contact by name, company or email"
                    value={selectedContact ? ([selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ').trim() || selectedContact.contact_person_name || selectedContact.contact_email || '') : contactSearch}
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
                          <span className="text-xs text-slate-500">No contact found. Don't know the person? Use Company and plant.</span>
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
                            <div className="font-medium text-slate-800">{[c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.contact_person_name || '—'}</div>
                            <div className="text-xs text-slate-500">{[c.organization?.name, c.plant?.plant_name, c.contact_email].filter(Boolean).join(' · ')}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {visitMode === 'org' && (
                <div className="space-y-3">
                  {visitOrg ? (
                    <div className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-slate-800 flex items-center gap-2"><Building2 size={14} className="text-slate-400" />{visitOrg.name}</span>
                      <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => { setVisitOrg(null); setVisitPlants([]); setVisitPlantId(undefined); setNewCoMode(null); }}>Change</button>
                    </div>
                  ) : (
                    <div>
                      <Input placeholder="Search company name" value={visitOrgQuery} onChange={(e) => onVisitOrgQueryChange(e.target.value)} />
                      {visitOrgSearching && <p className="text-xs text-slate-500 mt-1">Searching…</p>}
                      {visitOrgQuery.trim().length >= 2 && (
                        <div className="mt-1 border border-slate-200 rounded-lg max-h-44 overflow-y-auto">
                          {visitOrgResults.map((o) => (
                            <button key={o.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100" onClick={() => pickVisitOrg(o)}>
                              {o.name}
                            </button>
                          ))}
                          {!visitOrgSearching && visitOrgResults.length === 0 && (
                            <p className="px-3 py-2 text-xs text-slate-500">No company found. You can only see companies your role allows.</p>
                          )}
                          {canCreateOrg && canCreatePlant && (
                            <button type="button" className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-1.5"
                              onClick={() => { setNewCoMode('company'); setNewCo((f) => ({ ...f, company_name: visitOrgQuery.trim() })); }}>
                              <Plus size={12} /> Not in the list? Add "{visitOrgQuery.trim()}" as a new company
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {visitOrg && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Plant</label>
                      <Select
                        options={visitPlants.map((pl) => ({ value: pl.id, label: [pl.plant_name, pl.city].filter(Boolean).join(' · ') }))}
                        value={visitPlantId ?? ''}
                        onChange={(v) => setVisitPlantId(v !== undefined && v !== '' ? Number(v) : undefined)}
                        placeholder={visitPlants.length ? 'Select plant' : 'No plants yet'}
                        clearable
                      />
                      {canCreatePlant && newCoMode !== 'plant' && (
                        <button type="button" className="mt-1.5 text-xs text-blue-600 hover:underline" onClick={() => setNewCoMode('plant')}>+ Add a plant to this company</button>
                      )}
                    </div>
                  )}

                  {newCoMode && (
                    <div className="border border-dashed border-slate-300 rounded-lg p-3 space-y-3">
                      <p className="text-xs font-semibold text-slate-700">{newCoMode === 'company' ? 'New company and its plant' : `New plant for ${visitOrg?.name ?? 'this company'}`}</p>
                      <p className="text-[11px] text-slate-500">Search first so you don't add a duplicate.</p>
                      {newCoMode === 'company' && (
                        <Input label="Company name" value={newCo.company_name} onChange={(e) => setNewCo((f) => ({ ...f, company_name: e.target.value }))} />
                      )}
                      <Input label="Plant name" value={newCo.plant_name} onChange={(e) => setNewCo((f) => ({ ...f, plant_name: e.target.value }))} placeholder="e.g. Taloja Unit" />
                      <Input label="City" value={newCo.city} onChange={(e) => setNewCo((f) => ({ ...f, city: e.target.value }))} />
                      <div className="grid grid-cols-2 gap-3">
                        <Select label="Domain" options={domains.map((d) => ({ value: d.id, label: d.name }))} value={newCo.domain_id ?? ''}
                          onChange={(v) => setNewCo((f) => ({ ...f, domain_id: v ? Number(v) : undefined, region_id: undefined }))} placeholder="Select domain" searchable={false} />
                        <Select label="Region" options={coRegions.map((r) => ({ value: r.id, label: r.name }))} value={newCo.region_id ?? ''}
                          onChange={(v) => setNewCo((f) => ({ ...f, region_id: v ? Number(v) : undefined }))} placeholder={newCo.domain_id ? 'Select region' : 'Pick a domain first'} searchable={false} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setNewCoMode(null)}>Cancel</Button>
                        <Button size="sm" disabled={creatingCompany} onClick={handleCreateCompanyAndPlant}>{creatingCompany ? 'Adding…' : newCoMode === 'company' ? 'Add company and plant' : 'Add plant'}</Button>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">No contact person needed. You can add one later.</p>
                </div>
              )}

              {visitMode === 'place' && (
                <Input placeholder="e.g. Taloja industrial area" value={entryForm.where_place || ''} onChange={(e) => setEntryForm((f) => ({ ...f, where_place: e.target.value }))} />
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
              <Button size="sm" disabled={saving} onClick={saveEntryToLocal}>{unplannedMode ? 'Add unplanned visit' : 'Add to plan'}</Button>
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
            <div className="flex-1"><Input label="Last name" value={createContactForm.last_name} onChange={(e) => setCreateContactForm((f) => ({ ...f, last_name: e.target.value }))} placeholder="Last name" /></div>
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
            <Button size="sm" disabled={creatingContact || !createContactForm.first_name?.trim() || !(serializePhoneWithCountryCode(createContactForm.phone_country_code, createContactForm.contact_phone)?.trim()) || !createContactForm.domain_id} onClick={handleCreateContact}>
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
