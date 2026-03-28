/**
 * Lead Form Page
 * Create or edit a lead
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SearchInput } from '../components/ui/SearchInput';
import { Select, SelectOption } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { SearchSuggestion } from '../components/ui/SearchSuggestion';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectUser, selectEmployee } from '../store/slices/authSlice';
import { marketingAPI, Lead, UpdateLeadRequest, LeadStatusOption, LeadTypeOption, LeadThroughOption, LeadActivity, LeadActivityAttachment, Domain, Region, Customer, Contact, Plant, Series, Organization, ReportScopeResponse, leadDisplayName, leadDisplayCompany, leadDisplayEmail } from '../lib/marketing-api';
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText, DEFAULT_LEAD_SERIES_STORAGE_KEY } from '../constants';

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];
import { parseNameWithPrefix, serializeNameWithPrefix, parsePhoneWithCountryCode, serializePhoneWithCountryCode } from '../lib/name-phone-utils';
import { getStoredMarketingScope } from '../lib/marketing-scope';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, ArrowRight, Clock, ChevronDown, ChevronRight, Globe, User, Building2, FileText, History, Edit2, Trash2, Paperclip, Download, Plus, Upload, X, Package, Trophy, XCircle, Search, Network, Info, Mail, List, Factory, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface LeadFormData extends Partial<Lead> {
  first_name?: string;
  last_name?: string;
  company?: string;
  email?: string;
  job_title?: string;
  title?: string;
  organization_id?: number;
  plant_id?: number;
}

export const LeadFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useApp();
  const user = useAppSelector(selectUser);
  const employee = useAppSelector(selectEmployee);
  const isEdit = Boolean(id);

  const canCreate = useAppSelector(selectHasPermission('marketing.create_lead'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_lead'));
  const canChangeLeadSeries = useAppSelector(selectHasPermission('marketing.admin'));
  const canCreateContact = useAppSelector(selectHasPermission('marketing.create_contact'));
  const canCreateOrg = useAppSelector(selectHasPermission('marketing.create_organization'));
  const canCreatePlant = useAppSelector(selectHasPermission('marketing.create_plant'));

  type LeadSourceType = 'contact' | 'customer' | 'none';
  const tabParam = searchParams.get('tab');
  const viewParam = searchParams.get('view');
  const viewMode = viewParam === '1';
  const activeTab: 'enquiry' | 'status_logs' = tabParam === 'status_logs' ? 'status_logs' : 'enquiry';
  const setActiveTab = (tab: 'enquiry' | 'status_logs') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusOption[]>([]);
  const [leadTypes, setLeadTypes] = useState<LeadTypeOption[]>([]);
  const [leadThroughOptions, setLeadThroughOptions] = useState<LeadThroughOption[]>([]);
  const [leadSourceType, setLeadSourceType] = useState<LeadSourceType>('none');
  const [domainRegionCollapsed, setDomainRegionCollapsed] = useState(true);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'note',
    title: '',
    description: '',
    contact_person_name_prefix: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone_code: DEFAULT_COUNTRY_CODE,
    contact_person_phone: '',
    from_status_id: undefined as number | undefined,
    to_status_id: undefined as number | undefined,
  });
  type AttachmentEntry = { id: string; kind: 'quotation' | 'attachment'; file: File | null; quotationNumber: string; title: string };
  const [attachmentEntries, setAttachmentEntries] = useState<AttachmentEntry[]>([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [addAttachmentActivityId, setAddAttachmentActivityId] = useState<number | null>(null);
  const [addAttachmentRows, setAddAttachmentRows] = useState<{ id: string; kind: 'quotation' | 'attachment'; file: File | null; quotationNumber: string; title: string }[]>([]);
  const [quotationSeriesCode, setQuotationSeriesCode] = useState('');
  const [addAttachmentQuotationSeriesCode, setAddAttachmentQuotationSeriesCode] = useState('');
  const [quotationIsRevised, setQuotationIsRevised] = useState(false);
  const [addAttachmentIsRevised, setAddAttachmentIsRevised] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [followUpTime, setFollowUpTime] = useState('');
  const [editActivityForm, setEditActivityForm] = useState({
    activity_type: 'note',
    title: '',
    description: '',
    contact_person_name_prefix: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone_code: DEFAULT_COUNTRY_CODE,
    contact_person_phone: '',
    from_status_id: undefined as number | undefined,
    to_status_id: undefined as number | undefined,
  });
  const [editActivitySubmitting, setEditActivitySubmitting] = useState(false);
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);
  const [uploadingAttachmentsForActivityId, setUploadingAttachmentsForActivityId] = useState<number | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  /** When creating lead: optional quotation file; adds one enquiry with title "Added quotation" and no description. */
  const [initialQuotationFile, setInitialQuotationFile] = useState<File | null>(null);
  /** Create flow: optional backdated enquiry date/time (local datetime-local value). */
  const [initialInquiryReceivedAtLocal, setInitialInquiryReceivedAtLocal] = useState('');
  /** Quick add quotation (edit mode, enquiry tab): one file → one enquiry with auto title/description. */
  const [quickAddQuotationFile, setQuickAddQuotationFile] = useState<File | null>(null);
  const [quickAddQuotationSubmitting, setQuickAddQuotationSubmitting] = useState(false);
  const [leadNamePrefix, setLeadNamePrefix] = useState('');
  const [leadPhoneCountryCode, setLeadPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [leadPhonePart, setLeadPhonePart] = useState('');
  const [leadSearchEmail, setLeadSearchEmail] = useState('');
  const [leadSearchPhone, setLeadSearchPhone] = useState('');
  const [contactSuggestions, setContactSuggestions] = useState<Contact[]>([]);
  const contactSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [createContactForm, setCreateContactForm] = useState({
    domain_id: undefined as number | undefined,
    region_id: undefined as number | undefined,
    organization_id: undefined as number | undefined,
    plant_id: undefined as number | undefined,
    title: '',
    first_name: '',
    last_name: '',
    contact_email: '',
    contact_phone_code: DEFAULT_COUNTRY_CODE,
    contact_phone: '',
  });
  const [createContactSelectedOrg, setCreateContactSelectedOrg] = useState<Organization | null>(null);
  const [contactCreatePlants, setContactCreatePlants] = useState<Plant[]>([]);
  const [orgSuggestions, setOrgSuggestions] = useState<Organization[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const orgSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState<{ name: string; code: string; description: string; website: string; industry: string; organization_size: string }>({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' });
  const [showAddPlantInContactModal, setShowAddPlantInContactModal] = useState(false);
  const [addingPlant, setAddingPlant] = useState(false);
  const [newPlantForm, setNewPlantForm] = useState<Partial<Plant>>({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
  const [plantModalData, setPlantModalData] = useState<Partial<Plant>>({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
  const [showPlantInline, setShowPlantInline] = useState(false);
  const [savingModal, setSavingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [selectedContactForDisplay, setSelectedContactForDisplay] = useState<Contact | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedPrimaryContact, setSelectedPrimaryContact] = useState<Contact | null>(null);
  const [primaryContactContactId, setPrimaryContactContactId] = useState<number | null>(null);
  const [primaryContactSearchQuery, setPrimaryContactSearchQuery] = useState('');
  const [leadSearchName, setLeadSearchName] = useState(''); // Search by contact name or company name
  const [inlineContactForm, setInlineContactForm] = useState({
    domain_id: undefined as number | undefined,
    region_id: undefined as number | undefined,
    organization_id: undefined as number | undefined,
    plant_id: undefined as number | undefined,
    title: '',
    first_name: '',
    last_name: '',
    contact_job_title: '',
    contact_email: '',
    contact_phone_code: DEFAULT_COUNTRY_CODE,
    contact_phone: '',
  });
  const [inlineContactOrgQuery, setInlineContactOrgQuery] = useState('');
  const [inlineContactOrgSuggestions, setInlineContactOrgSuggestions] = useState<Organization[]>([]);
  const inlineContactOrgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inlineContactPlants, setInlineContactPlants] = useState<Plant[]>([]);
  const [leadSearchContactResults, setLeadSearchContactResults] = useState<Contact[]>([]);
  const [leadSearchCustomerResults, setLeadSearchCustomerResults] = useState<Customer[]>([]);
  const [leadSearchLoading, setLeadSearchLoading] = useState(false);
  const leadSearchNameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inlineNewOrgForm, setInlineNewOrgForm] = useState({ code: '', website: '', industry: '', organization_size: '' });
  const [creatingOrgInline, setCreatingOrgInline] = useState(false);
  const [showInlineNewPlant, setShowInlineNewPlant] = useState(false);
  const [inlineNewPlantForm, setInlineNewPlantForm] = useState({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
  const [creatingPlantInline, setCreatingPlantInline] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    domain_id: undefined,
    region_id: undefined,
    contact_id: undefined,
    customer_id: undefined,
    plant_id: undefined,
    status_id: undefined,
    lead_type_id: undefined,
    lead_through_id: undefined,
    through_contact_id: undefined,
    referred_by_customer_id: undefined,
    potential_value: undefined,
    notes: '',
    series_code: undefined,
    series: undefined,
    assigned_to_employee_id: undefined,
    referred_by_employee_id: undefined,
    expected_closing_date: '',
  });
  // Referred by (person name): type none | employee | customer | contact (independent of Lead through)
  const [referredByType, setReferredByType] = useState<'none' | 'employee' | 'customer' | 'contact'>('none');
  const [selectedReferredByCustomerForDisplay, setSelectedReferredByCustomerForDisplay] = useState<Customer | null>(null);
  // Through contact (when referred-by type = contact): select existing or create inline
  const [throughContactSearchName, setThroughContactSearchName] = useState('');
  const [throughContactSearchResults, setThroughContactSearchResults] = useState<Contact[]>([]);
  const [throughContactSearchLoading, setThroughContactSearchLoading] = useState(false);
  const throughContactSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedThroughContactForDisplay, setSelectedThroughContactForDisplay] = useState<Contact | null>(null);
  const [showInlineThroughContact, setShowInlineThroughContact] = useState(false);
  const [inlineThroughContactForm, setInlineThroughContactForm] = useState({
    organization_id: undefined as number | undefined,
    plant_id: undefined as number | undefined,
    title: '',
    first_name: '',
    last_name: '',
    contact_job_title: '',
    contact_email: '',
    contact_phone_code: DEFAULT_COUNTRY_CODE,
    contact_phone: '',
  });
  const [inlineThroughContactOrgQuery, setInlineThroughContactOrgQuery] = useState('');
  const [inlineThroughContactOrgSuggestions, setInlineThroughContactOrgSuggestions] = useState<Organization[]>([]);
  const inlineThroughContactOrgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inlineThroughContactPlants, setInlineThroughContactPlants] = useState<Plant[]>([]);
  const [inlineThroughNewOrgForm, setInlineThroughNewOrgForm] = useState({ code: '', website: '', industry: '', organization_size: '' });
  const [showInlineThroughNewPlant, setShowInlineThroughNewPlant] = useState(false);
  const [inlineThroughNewPlantForm, setInlineThroughNewPlantForm] = useState({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
  const [creatingThroughOrgInline, setCreatingThroughOrgInline] = useState(false);
  const [creatingThroughPlantInline, setCreatingThroughPlantInline] = useState(false);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [reportScope, setReportScope] = useState<ReportScopeResponse | null>(null);
  const [generatingQuoteNumber, setGeneratingQuoteNumber] = useState(false);
  const [showMarkLostConfirm, setShowMarkLostConfirm] = useState(false);
  const [showMarkWonModal, setShowMarkWonModal] = useState(false);
  const [markWonClosedValue, setMarkWonClosedValue] = useState('');
  const [markWonPO, setMarkWonPO] = useState('');
  const [markWonSubmitting, setMarkWonSubmitting] = useState(false);
  const [markLostReason, setMarkLostReason] = useState('');
  const [markLostCompetitor, setMarkLostCompetitor] = useState('');
  const [markLostPrice, setMarkLostPrice] = useState('');
  const [markLostSubmitting, setMarkLostSubmitting] = useState(false);
  const [leadSeriesChangeCode, setLeadSeriesChangeCode] = useState('');
  const [leadSeriesUpdating, setLeadSeriesUpdating] = useState(false);
  const [quoteSeriesToGenerate, setQuoteSeriesToGenerate] = useState('');
  const [generatingQuoteNumberForLead, setGeneratingQuoteNumberForLead] = useState(false);
  // Quote number (separate from lead number) — create only: generated value to send on create
  const [createFormQuoteSeriesCode, setCreateFormQuoteSeriesCode] = useState('');
  const [generatedQuoteNumber, setGeneratedQuoteNumber] = useState<string | null>(null);
  const [generatedQuoteSeriesCode, setGeneratedQuoteSeriesCode] = useState<string | null>(null);
  const [generatingQuoteNumberOnCreate, setGeneratingQuoteNumberOnCreate] = useState(false);
  /** Create lead: optional manual quote number (no series); mutually exclusive with Generate */
  const [customCreateQuoteNumber, setCustomCreateQuoteNumber] = useState('');
  const [editQuoteSeriesCode, setEditQuoteSeriesCode] = useState('');
  const [generatingQuoteNumberInEdit, setGeneratingQuoteNumberInEdit] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setDomainRegionCollapsed(false);
      if (!canEdit) {
        showToast('You do not have permission to edit leads', 'error');
        navigate('/leads');
        return;
      }
      loadLead();
    } else {
      setDomainRegionCollapsed(true);
      if (!canCreate) {
        showToast('You do not have permission to create leads', 'error');
        navigate('/leads');
        return;
      }
    }
    loadDomains();
    if (!isEdit) loadCustomers();
    marketingAPI.getLeadStatuses().then(setLeadStatuses).catch(() => setLeadStatuses([]));
    marketingAPI.getLeadTypes().then(setLeadTypes).catch(() => setLeadTypes([]));
    marketingAPI.getLeadThroughOptions().then(setLeadThroughOptions).catch(() => setLeadThroughOptions([]));
    marketingAPI.getSeries({ page: 1, page_size: 100, is_active: true }).then((r) => setSeriesList(r.items)).catch(() => setSeriesList([]));
    marketingAPI.getReportsScope().then(setReportScope).catch(() => setReportScope(null));
  }, [id, isEdit, canCreate, canEdit, employee?.id, user?.id]);

  useEffect(() => {
    if (!isEdit) {
      const sid = searchParams.get('status_id');
      if (sid) {
        const n = parseInt(sid, 10);
        if (!Number.isNaN(n)) setFormData(prev => ({ ...prev, status_id: n }));
      }
    }
  }, [isEdit, searchParams]);

  useEffect(() => {
    if (formData.domain_id) {
      loadRegions(formData.domain_id);
    } else {
      setRegions([]);
    }
  }, [formData.domain_id]);

  useEffect(() => {
    if (formData.customer_id) {
      marketingAPI.getPlants({ customer_id: formData.customer_id }).then(setPlants).catch(() => setPlants([]));
    } else {
      setPlants([]);
    }
  }, [formData.customer_id]);

  const searchOrganizationsByName = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setOrgSuggestions([]);
      return;
    }
    marketingAPI.getOrganizations({ page: 1, page_size: 15, search: q, is_active: true })
      .then(res => setOrgSuggestions(res.items ?? []))
      .catch(() => setOrgSuggestions([]));
  }, []);

  const searchContactsByEmailOrPhone = useCallback((query: string) => {
    if (query.trim().length < 2) {
      setContactSuggestions([]);
      return;
    }
    marketingAPI.searchContacts(query.trim(), 10).then(setContactSuggestions).catch(() => setContactSuggestions([]));
  }, []);

  const searchContactsAndCustomersByName = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setLeadSearchContactResults([]);
      setLeadSearchCustomerResults([]);
      setLeadSearchLoading(false);
      return;
    }
    setLeadSearchLoading(true);
    Promise.all([
      marketingAPI.searchContacts(q, 15),
      marketingAPI.searchCustomers(q, 15),
    ]).then(([contacts, customers]) => {
      setLeadSearchContactResults(contacts || []);
      setLeadSearchCustomerResults(customers || []);
      setLeadSearchLoading(false);
    }).catch(() => {
      setLeadSearchContactResults([]);
      setLeadSearchCustomerResults([]);
      setLeadSearchLoading(false);
    });
  }, []);

  const onOrganizationSearchChange = useCallback((value: string) => {
    setSelectedOrganization(null);
    setFormData(prev => ({ ...prev, organization_id: undefined, plant_id: undefined }));
    setPlants([]);
    setNewOrgForm(prev => ({ ...prev, name: value }));
    setOrgSearchQuery(value);
    if (orgSearchTimeoutRef.current) clearTimeout(orgSearchTimeoutRef.current);
    orgSearchTimeoutRef.current = setTimeout(() => searchOrganizationsByName(value), 300);
  }, [searchOrganizationsByName]);

  const clearOrganization = useCallback(() => {
    setSelectedOrganization(null);
    setFormData(prev => ({ ...prev, organization_id: undefined, plant_id: undefined, company: orgSearchQuery.trim() || prev.company }));
    setPlants([]);
    setNewOrgForm(prev => ({ ...prev, name: orgSearchQuery.trim() || prev.name }));
    setOrgSearchQuery('');
    setOrgSuggestions([]);
  }, [orgSearchQuery]);

  const contactCompanyName = useCallback((c: Contact) => {
    if (c.organization?.name) return c.organization.name;
    return '';
  }, []);

  const contactDisplayName = useCallback((c: Contact) => {
    const parts = [c.title, c.first_name, c.last_name].filter(Boolean);
    if (parts.length) return parts.join(' ').trim();
    return c.contact_person_name || contactCompanyName(c) || '';
  }, [contactCompanyName]);

  const onPrimaryContactSearchChange = useCallback((value: string) => {
    setPrimaryContactSearchQuery(value);
    if (contactSearchTimeoutRef.current) clearTimeout(contactSearchTimeoutRef.current);
    contactSearchTimeoutRef.current = setTimeout(() => searchContactsByEmailOrPhone(value.trim()), 400);
  }, [searchContactsByEmailOrPhone]);

  const onLeadSearchNameChange = useCallback((value: string) => {
    setLeadSearchName(value);
    if (formData.contact_id != null || formData.customer_id != null) return;
    if (leadSearchNameTimeoutRef.current) clearTimeout(leadSearchNameTimeoutRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setLeadSearchContactResults([]);
      setLeadSearchCustomerResults([]);
      return;
    }
    leadSearchNameTimeoutRef.current = setTimeout(() => searchContactsAndCustomersByName(q), 300);
  }, [formData.contact_id, formData.customer_id, searchContactsAndCustomersByName]);

  // When user types first/last name in inline form, search contacts/customers by that name
  useEffect(() => {
    if (isEdit || formData.contact_id != null || formData.customer_id != null) return;
    const q = [inlineContactForm.first_name, inlineContactForm.last_name].filter(Boolean).join(' ').trim();
    setLeadSearchName(q);
    if (leadSearchNameTimeoutRef.current) clearTimeout(leadSearchNameTimeoutRef.current);
    if (q.length < 2) {
      setLeadSearchContactResults([]);
      setLeadSearchCustomerResults([]);
      return;
    }
    const t = setTimeout(() => searchContactsAndCustomersByName(q), 300);
    leadSearchNameTimeoutRef.current = t;
    return () => clearTimeout(t);
  }, [inlineContactForm.first_name, inlineContactForm.last_name, isEdit, formData.contact_id, formData.customer_id, searchContactsAndCustomersByName]);

  // When Lead through = Through contact: search contacts for "at the contact" (referrer) by name
  const referredByContactForSearch = referredByType === 'contact';
  useEffect(() => {
    if (!referredByContactForSearch || formData.through_contact_id != null) return;
    const q = throughContactSearchName.trim();
    if (q.length < 2) {
      setThroughContactSearchResults([]);
      setThroughContactSearchLoading(false);
      return;
    }
    if (throughContactSearchTimeoutRef.current) clearTimeout(throughContactSearchTimeoutRef.current);
    setThroughContactSearchLoading(true);
    throughContactSearchTimeoutRef.current = setTimeout(() => {
      marketingAPI.searchContacts(q, 15)
        .then((contacts) => {
          setThroughContactSearchResults(contacts || []);
          setThroughContactSearchLoading(false);
        })
        .catch(() => {
          setThroughContactSearchResults([]);
          setThroughContactSearchLoading(false);
        });
    }, 300);
    return () => {
      if (throughContactSearchTimeoutRef.current) clearTimeout(throughContactSearchTimeoutRef.current);
    };
  }, [referredByContactForSearch, throughContactSearchName, formData.through_contact_id]);

  const hasLeadSearchResults = leadSearchContactResults.length > 0 || leadSearchCustomerResults.length > 0;
  const showLeadSearchDropdown = !isEdit && (formData.contact_id == null && formData.customer_id == null) && leadSearchName.trim().length >= 2 && (hasLeadSearchResults || leadSearchLoading);

  /** Company name for quote generation: from linked contact's org, linked customer, or selected organization (inline new contact) */
  const effectiveCompanyNameForQuote = useMemo(() => {
    if (formData.contact_id && selectedContactForDisplay?.organization?.name) return selectedContactForDisplay.organization.name;
    if (formData.customer_id) return customers.find((c) => c.id === formData.customer_id)?.company_name?.trim() ?? '';
    if (inlineContactForm.organization_id) return inlineContactOrgQuery.trim();
    return formData.company?.trim() ?? inlineContactOrgQuery.trim();
  }, [formData.contact_id, formData.customer_id, formData.company, selectedContactForDisplay?.organization?.name, customers, inlineContactForm.organization_id, inlineContactOrgQuery]);

  /** True when lead has contact/customer linked, or is creating new contact (org selected + some contact details) so quote number can be generated */
  const hasEffectiveContactOrCustomerForQuote = !isEdit
    ? (formData.contact_id != null || formData.customer_id != null) ||
    (Boolean(inlineContactForm.organization_id) && Boolean(inlineContactForm.first_name?.trim() || inlineContactForm.last_name?.trim() || inlineContactForm.contact_email?.trim() || leadSearchName.trim()))
    : (formData.contact_id != null || formData.customer_id != null);

  const linkLeadToContact = useCallback((c: Contact) => {
    const namePart = [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.contact_person_name || '';
    const hasApiTitle = Boolean(c.title);
    const { prefix: np, namePart: part } = hasApiTitle ? { prefix: c.title ?? '', namePart } : parseNameWithPrefix(namePart);
    const first = part.trim().split(/\s+/)[0] || '';
    const last = part.trim().split(/\s+/).slice(1).join(' ') || '';
    const { code: pc, number: pNum } = parsePhoneWithCountryCode(c.contact_phone);
    setLeadNamePrefix(np);
    setLeadPhoneCountryCode(pc || DEFAULT_COUNTRY_CODE);
    setLeadPhonePart(pNum);
    setFormData(prev => ({
      ...prev,
      contact_id: c.id,
      customer_id: undefined,
      organization_id: c.organization_id ?? undefined,
      plant_id: c.plant_id ?? prev.plant_id,
      domain_id: c.domain_id ?? prev.domain_id,
      region_id: c.region_id ?? prev.region_id,
      company: c.organization?.name || prev.company,
    }));
    setSelectedContactForDisplay(c);
    setSelectedPrimaryContact(c);
    setPrimaryContactContactId(c.id);
    setSelectedOrganization(c.organization ?? null);
    if (c.organization_id) {
      marketingAPI.getOrganizationPlants(c.organization_id).then(setPlants).catch(() => setPlants([]));
    }
    setOrgSearchQuery('');
    setContactSuggestions([]);
    setLeadSearchContactResults([]);
    setLeadSearchCustomerResults([]);
    setLeadSearchLoading(false);
    setLeadSearchName([c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.contact_person_name || c.organization?.name || '');
    if (c.domain_id) loadRegions(c.domain_id);
    setLeadSourceType('contact');
    showToast('Contact linked', 'success');
  }, []);

  const linkLeadToCustomer = useCallback((cust: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_id: cust.id,
      contact_id: undefined,
      organization_id: cust.organization_id ?? undefined,
      plant_id: undefined,
      domain_id: cust.domain_id ?? prev.domain_id,
      region_id: cust.region_id ?? prev.region_id,
      company: cust.organization?.name || prev.company,
    }));
    setLeadSearchContactResults([]);
    setLeadSearchCustomerResults([]);
    setLeadSearchLoading(false);
    setLeadSearchName(cust.company_name || '');
    if (cust.domain_id) loadRegions(cust.domain_id);
    setLeadSourceType('customer');
    setSelectedContactForDisplay(null);
    setSelectedPrimaryContact(cust.primary_contact_contact ?? null);
    setPrimaryContactContactId(cust.primary_contact_contact_id ?? null);
    setSelectedOrganization(cust.organization ?? null);
    if (cust.organization_id) {
      marketingAPI.getOrganizationPlants(cust.organization_id).then(setPlants).catch(() => setPlants([]));
    }
    setOrgSearchQuery('');
    showToast('Customer linked', 'success');
  }, []);

  /** When Lead through = Through contact: link the referrer contact (who gave the lead) from contacts table */
  const linkThroughContact = useCallback((c: Contact) => {
    setFormData(prev => ({ ...prev, through_contact_id: c.id, referred_by_employee_id: undefined, referred_by_customer_id: undefined }));
    setReferredByType('contact');
    setSelectedThroughContactForDisplay(c);
    setSelectedReferredByCustomerForDisplay(null);
    setThroughContactSearchResults([]);
    setThroughContactSearchName('');
    setThroughContactSearchLoading(false);
    showToast('Referrer contact linked', 'success');
  }, []);


  const openCreateContactModal = useCallback(() => {
    setCreateContactForm({
      domain_id: formData.domain_id,
      region_id: formData.region_id,
      organization_id: undefined,
      plant_id: undefined,
      title: '',
      first_name: '',
      last_name: '',
      contact_email: leadSearchEmail.trim() || '',
      contact_phone_code: leadPhoneCountryCode,
      contact_phone: leadPhonePart,
    });
    setCreateContactSelectedOrg(null);
    setOrgSuggestions([]);
    setOrgSearchQuery('');
    setContactCreatePlants([]);
    setShowAddPlantInContactModal(false);
    setNewPlantForm({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
    setShowCreateContactModal(true);
  }, [formData.domain_id, formData.region_id, leadPhoneCountryCode, leadPhonePart, leadSearchEmail]);

  const handleCreateOrganizationInContactModal = useCallback(async () => {
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
      const plants = await marketingAPI.getOrganizationPlants(org.id).catch(() => []);
      setCreateContactForm(prev => ({
        ...prev,
        organization_id: org.id,
        plant_id: plants && plants.length > 0 ? plants[0].id : undefined,
      }));
      setCreateContactSelectedOrg(org);
      setContactCreatePlants(plants || []);
      setShowCreateOrgModal(false);
      setNewOrgForm({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' });
      showToast('Organization created', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create organization', 'error');
    } finally {
      setCreatingOrg(false);
    }
  }, [newOrgForm, showToast]);

  const handleAddPlantInContactModal = useCallback(async () => {
    if (createContactForm.organization_id == null || !newPlantForm.plant_name?.trim()) {
      showToast('Plant name is required', 'error');
      return;
    }
    setAddingPlant(true);
    try {
      const plant = await marketingAPI.createOrganizationPlant(createContactForm.organization_id, newPlantForm);
      const updated = await marketingAPI.getOrganizationPlants(createContactForm.organization_id);
      setContactCreatePlants(updated);
      setCreateContactForm(prev => ({ ...prev, plant_id: plant.id }));
      setNewPlantForm({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
      setShowAddPlantInContactModal(false);
      showToast('Plant added', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add plant', 'error');
    } finally {
      setAddingPlant(false);
    }
  }, [createContactForm.organization_id, newPlantForm, showToast]);

  const handleCreateContact = useCallback(async () => {
    if (!createContactForm.first_name?.trim() || !createContactForm.last_name?.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }
    const fullPhone = serializePhoneWithCountryCode(createContactForm.contact_phone_code, createContactForm.contact_phone);
    if (!fullPhone?.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (createContactForm.domain_id == null) {
      showToast('Domain is required', 'error');
      return;
    }
    setCreatingContact(true);
    try {
      const contact = await marketingAPI.createContact({
        domain_id: createContactForm.domain_id!,
        region_id: createContactForm.region_id ?? undefined,
        organization_id: createContactForm.organization_id ?? undefined,
        plant_id: createContactForm.plant_id ?? undefined,
        title: createContactForm.title?.trim() || undefined,
        first_name: createContactForm.first_name?.trim() || undefined,
        last_name: createContactForm.last_name?.trim() || undefined,
        contact_email: createContactForm.contact_email?.trim() || undefined,
        contact_phone: fullPhone?.trim() || undefined,
      });
      linkLeadToContact(contact);
      setShowCreateContactModal(false);
      setContactSuggestions([]);
      showToast('Contact created and linked to lead', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create contact', 'error');
    } finally {
      setCreatingContact(false);
    }
  }, [createContactForm, linkLeadToContact, showToast]);

  const loadActivities = () => {
    if (!isEdit || !id) return;
    setActivitiesLoading(true);
    marketingAPI.getLeadActivities(parseInt(id)).then(setActivities).catch(() => setActivities([])).finally(() => setActivitiesLoading(false));
  };

  useEffect(() => {
    if (isEdit && id) loadActivities();
  }, [isEdit, id]);

  useEffect(() => {
    if (quotationSeriesCode) return;
    if (isEdit && currentLead?.quote_series_code) {
      setQuotationSeriesCode(currentLead.quote_series_code);
      return;
    }
    if (seriesList.length > 0) {
      setQuotationSeriesCode(seriesList[0].code);
    }
  }, [quotationSeriesCode, isEdit, currentLead?.quote_series_code, seriesList]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const isQuotationLog = activityForm.activity_type === 'qtn_submitted';
    const effectiveTitle = isQuotationLog ? 'Added quotation' : activityForm.title.trim();
    if (!effectiveTitle) {
      showToast('Title is required', 'error');
      return;
    }
    if (isQuotationLog) {
      const quotationFiles = attachmentEntries.filter((entry) => entry.file && entry.kind === 'quotation');
      if (quotationFiles.length === 0) {
        showToast('Please upload a quotation file', 'error');
        return;
      }
    }
    if (activityForm.activity_type === 'lead_status_change' && !activityForm.to_status_id) {
      showToast('Please select "To status"', 'error');
      return;
    }
    setActivitySubmitting(true);
    try {
      const created = await marketingAPI.createLeadActivity(parseInt(id), {
        activity_type: activityForm.activity_type,
        title: effectiveTitle,
        description: activityForm.description?.trim() || undefined,
        from_status_id: activityForm.activity_type === 'lead_status_change' ? activityForm.from_status_id : undefined,
        to_status_id: activityForm.activity_type === 'lead_status_change' ? activityForm.to_status_id : undefined,
        contact_person_title: activityForm.activity_type === 'contacted_different_person' ? (activityForm.contact_person_name_prefix?.trim() || undefined) : undefined,
        contact_person_name: activityForm.activity_type === 'contacted_different_person' ? (activityForm.contact_person_name?.trim() || undefined) : undefined,
        contact_person_email: activityForm.activity_type === 'contacted_different_person' ? (activityForm.contact_person_email?.trim() || undefined) : undefined,
        contact_person_phone: activityForm.activity_type === 'contacted_different_person' ? (serializePhoneWithCountryCode(activityForm.contact_person_phone_code, activityForm.contact_person_phone)?.trim() || undefined) : undefined,
      });
      const toUpload = attachmentEntries.filter((e) => e.file);
      if (toUpload.length > 0) {
        await marketingAPI.uploadLeadActivityAttachments(
          parseInt(id),
          created.id,
          toUpload.map((e) => e.file!),
          toUpload.map((e) => e.kind),
          undefined,
          toUpload.map((e) => (e.kind === 'attachment' ? (e.title.trim() || undefined) : undefined)),
          toUpload.some((e) => e.kind === 'quotation') ? (quotationSeriesCode.trim() || undefined) : undefined,
          toUpload.some((e) => e.kind === 'quotation') ? quotationIsRevised : undefined
        );
      }
      showToast('Log added', 'success');
      setActivityForm({
        activity_type: 'note',
        title: '',
        description: '',
        contact_person_name_prefix: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone_code: '',
        contact_person_phone: '',
        from_status_id: undefined,
        to_status_id: undefined,
      });
      setAttachmentEntries([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]);
      setQuotationIsRevised(false);
      loadActivities();
    } catch (err: any) {
      showToast(err.message || 'Failed to add log', 'error');
    } finally {
      setActivitySubmitting(false);
    }
  };

  const handleQuickAddQuotation = async () => {
    if (!id || !quickAddQuotationFile) return;
    setQuickAddQuotationSubmitting(true);
    try {
      const created = await marketingAPI.createLeadActivity(parseInt(id), {
        activity_type: 'qtn_submitted',
        title: 'Added quotation',
        description: undefined,
      });
      await marketingAPI.uploadLeadActivityAttachments(
        parseInt(id),
        created.id,
        [quickAddQuotationFile],
        ['quotation'],
        undefined,
        undefined,
        quotationSeriesCode.trim() || undefined,
        quotationIsRevised
      );
      showToast('Quotation added', 'success');
      setQuickAddQuotationFile(null);
      setQuotationIsRevised(false);
      loadActivities();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add quotation', 'error');
    } finally {
      setQuickAddQuotationSubmitting(false);
    }
  };

  const canEditOrDeleteActivity = (a: LeadActivity) => user?.id != null && a.created_by_employee_id != null && user.id === a.created_by_employee_id;

  // Enquiry log: all activity types except system "lead_edit"; include lead_status_change so kanban popup (title, description, attachments) shows here
  const enquiryActivities = activities.filter((a) => a.activity_type !== 'lead_edit');
  const statusLogsActivities = activities.filter(
    (a) => a.activity_type === 'lead_edit' || a.activity_type === 'lead_status_change'
  );

  const latestQuotation = useMemo(() => {
    const isQuotation = (att: LeadActivityAttachment) => att.is_quotation === true || (att.quotation_number != null && att.quotation_number !== '');
    const pairs: { att: LeadActivityAttachment; activity: LeadActivity }[] = [];
    activities.forEach((activity) => {
      activity.attachments?.forEach((att) => {
        if (isQuotation(att)) pairs.push({ att, activity });
      });
    });
    if (pairs.length === 0) return null;
    pairs.sort((a, b) => {
      const dateA = a.activity.activity_date || a.activity.created_at || '';
      const dateB = b.activity.activity_date || b.activity.created_at || '';
      return dateB.localeCompare(dateA) || (b.att.id - a.att.id);
    });
    return pairs[0];
  }, [activities]);

  const startEditActivity = (a: LeadActivity) => {
    setEditingActivityId(a.id);
    const hasApiTitle = Boolean(a.contact_person_title);
    const { prefix: cpPrefix, namePart: cpName } = hasApiTitle ? { prefix: a.contact_person_title ?? '', namePart: a.contact_person_name ?? '' } : parseNameWithPrefix(a.contact_person_name);
    const { code: cpCode, number: cpNum } = parsePhoneWithCountryCode(a.contact_person_phone);
    setEditActivityForm({
      activity_type: a.activity_type,
      title: a.title,
      description: a.description ?? '',
      contact_person_name_prefix: cpPrefix,
      contact_person_name: cpName,
      contact_person_email: a.contact_person_email ?? '',
      contact_person_phone_code: cpCode || DEFAULT_COUNTRY_CODE,
      contact_person_phone: cpNum,
      from_status_id: a.from_status_id ?? undefined,
      to_status_id: a.to_status_id ?? undefined,
    });
  };

  const handleSaveEditActivity = async () => {
    if (!id || editingActivityId == null || !editActivityForm.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setEditActivitySubmitting(true);
    try {
      await marketingAPI.updateLeadActivity(parseInt(id), editingActivityId, {
        activity_type: editActivityForm.activity_type,
        title: editActivityForm.title.trim(),
        description: editActivityForm.description?.trim() || undefined,
        contact_person_title: editActivityForm.activity_type === 'contacted_different_person' ? (editActivityForm.contact_person_name_prefix?.trim() || undefined) : undefined,
        contact_person_name: editActivityForm.activity_type === 'contacted_different_person' ? (editActivityForm.contact_person_name?.trim() || undefined) : undefined,
        contact_person_email: editActivityForm.activity_type === 'contacted_different_person' ? (editActivityForm.contact_person_email?.trim() || undefined) : undefined,
        contact_person_phone: editActivityForm.activity_type === 'contacted_different_person' ? (serializePhoneWithCountryCode(editActivityForm.contact_person_phone_code, editActivityForm.contact_person_phone)?.trim() || undefined) : undefined,
        from_status_id: editActivityForm.activity_type === 'lead_status_change' ? editActivityForm.from_status_id : undefined,
        to_status_id: editActivityForm.activity_type === 'lead_status_change' ? editActivityForm.to_status_id : undefined,
      });
      showToast('Enquiry updated', 'success');
      setEditingActivityId(null);
      loadActivities();
    } catch (err: any) {
      showToast(err.message || 'Failed to update enquiry', 'error');
    } finally {
      setEditActivitySubmitting(false);
    }
  };

  const handleConfirmDeleteActivity = async () => {
    if (!id || deleteActivityId == null) return;
    try {
      await marketingAPI.deleteLeadActivity(parseInt(id), deleteActivityId);
      showToast('Enquiry deleted', 'success');
      setDeleteActivityId(null);
      loadActivities();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete enquiry', 'error');
    }
  };

  const ACTIVITY_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'note', label: 'Note' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'call', label: 'Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'lead_status_change', label: 'Status change' },
    { value: 'contacted_different_person', label: 'Contacted different person' },
    // Enquiry follow-up statuses
    { value: 'qtn_submitted', label: 'QTN Submitted' },
    { value: 'qtn_followup', label: 'QTN Followup' },
    { value: 'technical_discussions', label: 'Technical Discussions' },
    { value: 'at_customer_desk', label: 'At Customer Desk' },
    { value: 'order_finalization_ap', label: 'Order Finalization (AP)' },
    { value: 'po_release_ap', label: 'PO Release (AP)' },
    { value: 'po_acknowledge_ap', label: 'PO Acknowledge (AP)' },
    { value: 'wo_prepared', label: 'WO Prepared' },
    { value: 'on_hold_customer_end', label: 'On-Hold (Customer end)' },
    { value: 'requirement_cancelled_customer_end', label: 'Requirement Cancelled (Customer end)' },
    { value: 'order_loss_1', label: '1 - Order Loss' },
    { value: 'order_loss_2', label: '2 - Order Loss' },
    { value: 'order_loss_3', label: '3 - Order Loss' },
  ];

  const activityTypeLabel = (type: string) => {
    const opt = ACTIVITY_TYPE_OPTIONS.find((o) => o.value === type);
    return opt ? opt.label : type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const loadUserAssignments = async (): Promise<{ domain_id: number; region_id?: number } | null> => {
    const cachedScope = getStoredMarketingScope();
    if (cachedScope?.domain_id != null) {
      return {
        domain_id: cachedScope.domain_id,
        region_id: cachedScope.region_id ?? cachedScope.region_ids?.[0],
      };
    }
    const candidateIds = Array.from(new Set([employee?.id, user?.id].filter((v): v is number => typeof v === 'number' && Number.isFinite(v))));
    for (const candidateId of candidateIds) {
      try {
        const assignments = await marketingAPI.getEmployeeAssignments(candidateId);
        if (!assignments?.length) continue;
        const active = assignments.find((x: any) => x?.is_active) ?? assignments[0];
        if (!active) continue;
        if (active.region?.id != null && active.region?.domain_id != null) {
          return { domain_id: active.region.domain_id, region_id: active.region.id };
        }
        if (active.region_id != null) {
          try {
            const region = await marketingAPI.getRegion(active.region_id);
            if (region?.id != null && region?.domain_id != null) {
              return { domain_id: region.domain_id, region_id: region.id };
            }
          } catch (_) { }
        }
      } catch (_) { }
    }
    return null;
  };

  const loadDomains = async () => {
    try {
      const res = await marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 });
      const domainsData = res.items;
      setDomains(domainsData);
      if (!isEdit) {
        const assigned = await loadUserAssignments();
        if (assigned) {
          setFormData(prev => ({ ...prev, domain_id: assigned.domain_id, region_id: assigned.region_id ?? prev.region_id }));
          await loadRegions(assigned.domain_id);
        } else if (!formData.domain_id && domainsData.length > 0) {
          setFormData(prev => ({ ...prev, domain_id: domainsData[0].id }));
        }
      }
    } catch (error: any) {
      showToast('Failed to load domains', 'error');
    }
  };

  const loadRegions = async (domainId: number) => {
    try {
      const res = await marketingAPI.getRegions({ domain_id: domainId, is_active: true, page: 1, page_size: 100 });
      const regionsData = res.items;
      setRegions(regionsData);
    } catch (error: any) {
      showToast('Failed to load regions', 'error');
      setRegions([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await marketingAPI.getCustomers({ is_active: true, page: 1, page_size: 100 });
      setCustomers(res.items);
    } catch (error: any) {
      showToast('Failed to load customers', 'error');
    }
  };

  const loadLead = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [lead, customersRes] = await Promise.all([
        marketingAPI.getLead(parseInt(id)),
        marketingAPI.getCustomers({ is_active: true, page: 1, page_size: 100 })
      ]);
      const customersData = customersRes.items;

      setCurrentLead(lead);
      const contact = lead.contact;
      const customer = lead.customer;
      const primaryContact = customer?.primary_contact_contact;
      const firstName = contact?.first_name ?? primaryContact?.first_name ?? '';
      const lastName = contact?.last_name ?? primaryContact?.last_name ?? '';
      const company = contact?.organization?.name ?? customer?.company_name ?? '';
      const email = contact?.contact_email ?? primaryContact?.contact_email ?? '';
      const jobTitle = contact?.contact_job_title ?? primaryContact?.contact_job_title ?? '';
      const phone = contact?.contact_phone ?? primaryContact?.contact_phone ?? '';
      setLeadNamePrefix((contact?.title ?? primaryContact?.title ?? '') || '');
      const { code: phoneCode, number: phonePart } = parsePhoneWithCountryCode(phone);
      setLeadPhoneCountryCode(phoneCode || DEFAULT_COUNTRY_CODE);
      setLeadPhonePart(phonePart || '');
      setFormData({
        domain_id: lead.domain_id,
        region_id: lead.region_id || undefined,
        contact_id: lead.contact_id || undefined,
        customer_id: lead.customer_id || undefined,
        plant_id: lead.plant_id || undefined,
        status_id: lead.status_id ?? undefined,
        lead_type_id: lead.lead_type_id ?? undefined,
        lead_through_id: lead.lead_through_id ?? lead.lead_through_option?.id ?? undefined,
        through_contact_id: lead.through_contact_id ?? undefined,
        referred_by_customer_id: lead.referred_by_customer_id ?? undefined,
        potential_value: lead.potential_value || undefined,
        closed_value: lead.closed_value ?? undefined,
        closed_at: lead.closed_at ?? undefined,
        notes: lead.notes || '',
        series_code: lead.series_code ?? undefined,
        series: lead.series ?? undefined,
        quote_series_code: lead.quote_series_code ?? undefined,
        quote_number: lead.quote_number ?? undefined,
        next_follow_up_at: lead.next_follow_up_at ?? undefined,
        follow_up_reminder_type: lead.follow_up_reminder_type ?? undefined,
        assigned_to_employee_id: lead.assigned_to_employee_id ?? undefined,
        referred_by_employee_id: lead.referred_by_employee_id ?? undefined,
        expected_closing_date: lead.expected_closing_date || '',
        first_name: firstName,
        last_name: lastName,
        company,
        email,
        job_title: jobTitle,
      });
      if (lead.through_contact) {
        setSelectedThroughContactForDisplay(lead.through_contact);
      } else {
        setSelectedThroughContactForDisplay(null);
      }
      if (lead.referred_by_customer) {
        setSelectedReferredByCustomerForDisplay(lead.referred_by_customer);
      } else {
        setSelectedReferredByCustomerForDisplay(null);
      }
      if (lead.through_contact_id) setReferredByType('contact');
      else if (lead.referred_by_employee_id) setReferredByType('employee');
      else if (lead.referred_by_customer_id) setReferredByType('customer');
      else setReferredByType('none');
      if (lead.next_follow_up_at) {
        const d = new Date(lead.next_follow_up_at);
        const pad = (n: number) => String(n).padStart(2, '0');
        setFollowUpTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
      } else {
        setFollowUpTime('');
      }

      setCustomers(customersData);
      if (lead.contact_id) {
        setLeadSourceType('contact');
        const c = lead.contact ?? null;
        setSelectedContactForDisplay(c);
        setSelectedPrimaryContact(c);
        setPrimaryContactContactId(lead.contact_id);
      } else if (lead.customer_id) {
        setLeadSourceType('customer');
        setSelectedContactForDisplay(null);
        setSelectedPrimaryContact(lead.customer?.primary_contact_contact ?? null);
        setPrimaryContactContactId(lead.customer?.primary_contact_contact_id ?? null);
      } else {
        setLeadSourceType('none');
        setSelectedContactForDisplay(null);
        setSelectedPrimaryContact(null);
        setPrimaryContactContactId(null);
      }

      if (lead.contact?.organization) {
        setSelectedOrganization(lead.contact.organization);
      } else if (lead.customer?.organization) {
        setSelectedOrganization(lead.customer.organization);
      } else {
        setSelectedOrganization(null);
      }

      if (lead.customer_id) {
        const plantsData = await marketingAPI.getPlants({ customer_id: lead.customer_id });
        setPlants(plantsData);
      }

      if (lead.domain_id) {
        await loadRegions(lead.domain_id);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load lead', 'error');
      navigate('/leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.domain_id) {
      showToast('Domain is required', 'error');
      return;
    }
    let effectiveContactId = formData.contact_id ?? undefined;
    let effectiveCustomerId = formData.customer_id ?? undefined;
    let effectiveThroughContactId = formData.through_contact_id ?? undefined;
    const selectedLeadDomainId = formData.domain_id;
    const selectedLeadRegionId = formData.region_id ?? undefined;
    let effectiveDomainId = selectedLeadDomainId;
    let effectiveRegionId = selectedLeadRegionId;
    const referredByContactSubmit = referredByType === 'contact';

    if (!isEdit && !effectiveContactId && !effectiveCustomerId) {
      const inlineContactFilled = inlineContactForm.first_name?.trim() && inlineContactForm.last_name?.trim() && serializePhoneWithCountryCode(inlineContactForm.contact_phone_code, inlineContactForm.contact_phone)?.trim();
      const companyOrOrgName = (formData.company || inlineContactOrgQuery || newOrgForm.name || '').trim();

      if (!primaryContactContactId && !inlineContactFilled) {
        showToast('Please link an existing contact or fill the details below to create one on save', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        let organization_id = selectedOrganization?.id || inlineContactForm.organization_id;
        let plant_id = inlineContactForm.plant_id;
        let company_name = selectedOrganization?.name || formData.company;

        // 1. Create organization first if needed
        if (!organization_id && companyOrOrgName && canCreateOrg) {
          const plantsToCreate = inlineNewPlantForm.plant_name?.trim()
            ? [{ plant_name: inlineNewPlantForm.plant_name.trim(), address_line1: inlineNewPlantForm.address_line1?.trim() || undefined, address_line2: inlineNewPlantForm.address_line2?.trim() || undefined, city: inlineNewPlantForm.city?.trim() || undefined, state: inlineNewPlantForm.state?.trim() || undefined, country: inlineNewPlantForm.country?.trim() || undefined, postal_code: inlineNewPlantForm.postal_code?.trim() || undefined }]
            : undefined;
          const org = await marketingAPI.createOrganization({
            name: newOrgForm.name.trim() || companyOrOrgName,
            code: newOrgForm.code.trim() || undefined,
            website: newOrgForm.website.trim() || undefined,
            industry: newOrgForm.industry.trim() || undefined,
            organization_size: newOrgForm.organization_size?.trim() || undefined,
            is_active: true,
            plants: plantsToCreate,
          });
          organization_id = org.id;
          company_name = org.name;
          if (plantsToCreate?.length) {
            const plantsList = await marketingAPI.getOrganizationPlants(org.id).catch(() => []);
            plant_id = plantsList?.[0]?.id;
          }
        }

        // 2. Create contact if needed
        if (!primaryContactContactId && inlineContactFilled && canCreateContact) {
          const fullPhone = serializePhoneWithCountryCode(inlineContactForm.contact_phone_code, inlineContactForm.contact_phone);
          const contact = await marketingAPI.createContact({
            domain_id: effectiveDomainId!,
            region_id: effectiveRegionId,
            organization_id: organization_id,
            plant_id: plant_id,
            title: inlineContactForm.title?.trim() || undefined,
            first_name: inlineContactForm.first_name.trim(),
            last_name: inlineContactForm.last_name.trim(),
            contact_job_title: inlineContactForm.contact_job_title?.trim() || undefined,
            contact_email: inlineContactForm.contact_email?.trim() || undefined,
            contact_phone: fullPhone?.trim() || undefined,
          });
          effectiveContactId = contact.id;
        } else {
          effectiveContactId = primaryContactContactId ?? undefined;
        }
        
        effectiveDomainId = formData.domain_id!;
        effectiveRegionId = formData.region_id;
      } catch (err: any) {
        showToast(err?.message || 'Failed to create entities', 'error');
        setIsSubmitting(false);
        return;
      }
    }

    // When Lead through = Through contact and user added a new referrer contact inline, create it before saving lead
    if (referredByContactSubmit && !effectiveThroughContactId && (inlineThroughContactForm.first_name?.trim() || inlineThroughContactForm.last_name?.trim()) && effectiveDomainId) {
      setIsSubmitting(true);
      try {
        let throughOrgId = inlineThroughContactForm.organization_id ?? undefined;
        let throughPlantId = inlineThroughContactForm.plant_id ?? undefined;
        const throughTypedOrgName = inlineThroughContactOrgQuery.trim();
        if (!throughOrgId && throughTypedOrgName.length >= 2) {
          const orgSearch = await marketingAPI.getOrganizations({ page: 1, page_size: 25, search: throughTypedOrgName, is_active: true });
          const exact = (orgSearch.items || []).find((o) => o.name.trim().toLowerCase() === throughTypedOrgName.toLowerCase());
          if (exact) {
            throughOrgId = exact.id;
          } else if (canCreateOrg) {
            const createdOrg = await marketingAPI.createOrganization({
              name: throughTypedOrgName,
              code: inlineThroughNewOrgForm.code.trim() || undefined,
              website: inlineThroughNewOrgForm.website.trim() || undefined,
              industry: inlineThroughNewOrgForm.industry.trim() || undefined,
              organization_size: inlineThroughNewOrgForm.organization_size.trim() || undefined,
              is_active: true,
            });
            throughOrgId = createdOrg.id;
          }
        }
        if (throughOrgId && !throughPlantId && inlineThroughNewPlantForm.plant_name.trim() && canCreatePlant) {
          const createdPlant = await marketingAPI.createOrganizationPlant(throughOrgId, {
            plant_name: inlineThroughNewPlantForm.plant_name.trim(),
            address_line1: inlineThroughNewPlantForm.address_line1.trim() || undefined,
            address_line2: inlineThroughNewPlantForm.address_line2.trim() || undefined,
            city: inlineThroughNewPlantForm.city.trim() || undefined,
            state: inlineThroughNewPlantForm.state.trim() || undefined,
            country: inlineThroughNewPlantForm.country.trim() || undefined,
            postal_code: inlineThroughNewPlantForm.postal_code.trim() || undefined,
          });
          throughPlantId = createdPlant.id;
        }
        const resolvedThroughPhone = serializePhoneWithCountryCode(inlineThroughContactForm.contact_phone_code, inlineThroughContactForm.contact_phone)?.trim() || undefined;
        const throughContact = await marketingAPI.createContact({
          domain_id: effectiveDomainId,
          region_id: effectiveRegionId ?? undefined,
          organization_id: throughOrgId,
          plant_id: throughPlantId,
          title: inlineThroughContactForm.title?.trim() || undefined,
          first_name: inlineThroughContactForm.first_name?.trim() || undefined,
          last_name: inlineThroughContactForm.last_name?.trim() || undefined,
          contact_job_title: inlineThroughContactForm.contact_job_title?.trim() || undefined,
          contact_email: inlineThroughContactForm.contact_email?.trim() || undefined,
          contact_phone: resolvedThroughPhone,
        });
        effectiveThroughContactId = throughContact.id;
      } catch (err: any) {
        showToast(err?.message || 'Failed to create referrer contact', 'error');
        setIsSubmitting(false);
        return;
      }
    }

    const payload: Record<string, unknown> = {
      ...formData,
      contact_id: effectiveContactId,
      customer_id: effectiveCustomerId,
      through_contact_id: effectiveThroughContactId,
      plant_id: formData.plant_id ?? undefined,
      domain_id: effectiveDomainId,
      region_id: effectiveRegionId,
    };
    if (!(payload as any).expected_closing_date) {
      (payload as any).expected_closing_date = undefined;
    }
    if (!isEdit && typeof window !== 'undefined') {
      const assigned = (window.localStorage.getItem(DEFAULT_LEAD_SERIES_STORAGE_KEY) || '').trim();
      if (assigned) (payload as any).series_code = assigned;
    }
    // Quote number (separate from lead number): generated (series + number) or manual text only
    if (!isEdit && generatedQuoteSeriesCode && generatedQuoteNumber) {
      (payload as any).quote_series_code = generatedQuoteSeriesCode;
      (payload as any).quote_number = generatedQuoteNumber;
    } else if (!isEdit && customCreateQuoteNumber.trim()) {
      (payload as any).quote_number = customCreateQuoteNumber.trim();
    }

    const initialInquiryIso =
      !isEdit &&
      initialInquiryReceivedAtLocal.trim() &&
      !Number.isNaN(new Date(initialInquiryReceivedAtLocal).getTime())
        ? new Date(initialInquiryReceivedAtLocal).toISOString()
        : undefined;
    if (!isEdit && initialInquiryIso && !initialQuotationFile) {
      (payload as any).initial_inquiry_at = initialInquiryIso;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && id) {
        await marketingAPI.updateLead(parseInt(id), payload as UpdateLeadRequest);
        showToast('Lead updated successfully', 'success');
        setShowEditModal(false);
        loadLead();
        loadActivities();
      } else {
        const lead = await marketingAPI.createLead(payload as any);
        if (initialQuotationFile) {
          try {
            const createdActivity = await marketingAPI.createLeadActivity(lead.id, {
              activity_type: 'note',
              title: 'Added quotation',
              description: undefined,
              ...(initialInquiryIso ? { activity_date: initialInquiryIso } : {}),
            });
            await marketingAPI.uploadLeadActivityAttachments(
              lead.id,
              createdActivity.id,
              [initialQuotationFile],
              ['quotation'],
              undefined,
              undefined,
              // Use lead's quote number when set at create (generated or custom); otherwise optional series for first quotation
              generatedQuoteNumber || customCreateQuoteNumber.trim()
                ? undefined
                : (formData.series_code?.trim() || undefined)
            );
            showToast('Lead and enquiry created successfully', 'success');
            navigate(`/leads/${lead.id}/edit`);
            return;
          } catch (err: any) {
            showToast('Lead created but enquiry failed: ' + (err?.message || 'unknown error'), 'error');
            navigate(`/leads/${lead.id}/edit`);
            return;
          }
        }
        showToast('Lead created successfully', 'success');
        navigate('/leads');
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} lead`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateQuoteNumber = async () => {
    const code = formData.series_code?.trim();
    if (!code) return;
    const company = effectiveCompanyNameForQuote || formData.company?.trim();
    if (!company) {
      showToast('Select or enter an Organization in the Contact section first. The generated number may use the company/organization name.', 'error');
      return;
    }
    setGeneratingQuoteNumber(true);
    try {
      const res = isEdit && id
        ? await marketingAPI.generateNextSeriesNumberByCode(code, { lead_id: parseInt(id, 10) })
        : await marketingAPI.generateNextSeriesNumberByCode(code, { lead_context: { company } });
      const generated = res.generated_value ?? undefined;
      setFormData((prev) => ({ ...prev, series: generated }));
      if (isEdit && id && generated) {
        const updated = await marketingAPI.updateLead(parseInt(id, 10), { series_code: code, series: generated } as UpdateLeadRequest);
        setCurrentLead(updated);
        showToast('Lead number generated and saved', 'success');
      } else {
        showToast('Lead number generated', 'success');
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to generate lead number', 'error');
    } finally {
      setGeneratingQuoteNumber(false);
    }
  };

  const wonStatusId = useMemo(() => leadStatuses.find((s) => s.is_final && !s.is_lost)?.id ?? null, [leadStatuses]);
  const lostStatusId = useMemo(() => leadStatuses.find((s) => s.is_lost)?.id ?? null, [leadStatuses]);

  const handleMarkWonSubmit = async () => {
    if (!id || !wonStatusId || !markWonClosedValue.trim()) return;
    const value = parseFloat(markWonClosedValue.replace(/,/g, '').trim());
    if (Number.isNaN(value) || value < 0) {
      showToast('Please enter a valid positive number for closed value', 'error');
      return;
    }
    setMarkWonSubmitting(true);
    try {
      await marketingAPI.updateLead(parseInt(id), { status_id: wonStatusId ?? undefined, closed_value: value } as UpdateLeadRequest);
      const description = `Closed value: ₹${value.toLocaleString()}${markWonPO.trim() ? `\nPO: ${markWonPO.trim()}` : ''}`;
      await marketingAPI.createLeadActivity(parseInt(id), {
        activity_type: 'lead_status_change',
        title: 'Marked as Won',
        description,
        from_status_id: formData.status_id ?? undefined,
        to_status_id: wonStatusId,
      });
      showToast('Lead marked as Won', 'success');
      setShowMarkWonModal(false);
      setMarkWonClosedValue('');
      setMarkWonPO('');
      loadLead();
      loadActivities();
      navigate(`/orders/new?lead_id=${id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lead', 'error');
    } finally {
      setMarkWonSubmitting(false);
    }
  };

  const handleMarkLostConfirm = async () => {
    if (!id || !lostStatusId || markLostReason.trim().length < 100) return;
    setMarkLostSubmitting(true);
    try {
      await marketingAPI.updateLead(parseInt(id), {
        status_id: lostStatusId ?? undefined,
        status_change_reason: markLostReason.trim(),
        lost_to_competitor: markLostCompetitor.trim() || 'Not sure',
        lost_at_price: markLostPrice.trim() || 'Not sure',
      } as UpdateLeadRequest);
      showToast('Lead marked as Lost', 'success');
      setShowMarkLostConfirm(false);
      setMarkLostReason('');
      setMarkLostCompetitor('');
      setMarkLostPrice('');
      loadLead();
      loadActivities();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lead', 'error');
    } finally {
      setMarkLostSubmitting(false);
    }
  };

  const toDatetimeLocalValue = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const setFollowUpQuick = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(10, 0, 0, 0);
    setFollowUpTime('10:00');
    setFormData((f) => ({ ...f, next_follow_up_at: d.toISOString(), follow_up_reminder_type: 'once' }));
  };

  const saveFollowUp = async () => {
    if (!id) return;
    const reminderType = formData.follow_up_reminder_type ?? undefined;
    const isRecurring = reminderType === 'daily' || reminderType === 'weekly' || reminderType === 'monthly';
    const hasDate = !!formData.next_follow_up_at;
    if (reminderType === 'once' && !hasDate) {
      showToast('Please set the date and time for one-time follow-up.', 'error');
      return;
    }
    if (isRecurring && !followUpTime) {
      showToast('Please set the follow-up time.', 'error');
      return;
    }
    setFollowUpSaving(true);
    try {
      await marketingAPI.scheduleLeadFollowUp(parseInt(id), {
        next_follow_up_at: formData.next_follow_up_at || null,
        follow_up_reminder_type: reminderType || null,
        follow_up_time: isRecurring ? followUpTime : null,
      });
      showToast((reminderType || hasDate || followUpTime) ? 'Follow-up schedule saved' : 'Follow-up schedule cleared', 'success');
      await loadLead();
    } catch (e: any) {
      showToast(e?.message || 'Failed to save follow-up', 'error');
    } finally {
      setFollowUpSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Leads', href: '/leads' },
    { label: viewMode ? 'Lead details' : (isEdit ? 'Edit Lead' : 'Create Lead') },
  ];

  if (isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Lead' : 'Create Lead'} breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-600">Loading lead...</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={viewMode ? 'Lead details' : (isEdit ? 'Edit Lead' : 'Create Lead')}
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(viewMode ? '/orders?tab=lost' : '/leads')}
            leftIcon={<ArrowLeft size={14} />}
          >
            Back
          </Button>
          {isEdit && (
            <Button size="sm" onClick={() => setShowEditModal(true)} leftIcon={<Edit2 size={14} />}>
              Edit lead
            </Button>
          )}
        </div>
      }
    >
      {isEdit && id && !viewMode && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
          <span className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">Follow-up</span>
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-0.5">
            <button
              type="button"
              className="h-7 rounded-full px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
              onClick={() => setFollowUpQuick(1)}
            >
              Tomorrow 10:00
            </button>
            <button
              type="button"
              className="h-7 rounded-full px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
              onClick={() => setFollowUpQuick(7)}
            >
              Next week
            </button>
          </div>
          <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
          <select
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs min-w-[145px]"
            value={formData.follow_up_reminder_type === undefined || formData.follow_up_reminder_type === null ? '' : formData.follow_up_reminder_type}
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : e.target.value;
              setFormData({ ...formData, follow_up_reminder_type: v });
              if ((v === 'daily' || v === 'weekly' || v === 'monthly') && !followUpTime) {
                setFollowUpTime('10:00');
              }
            }}
            title="Repeat type"
          >
            <option value="">No reminder</option>
            <option value="once">Custom (one time)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {(formData.follow_up_reminder_type === 'daily' || formData.follow_up_reminder_type === 'weekly' || formData.follow_up_reminder_type === 'monthly') ? (
            <input
              type="time"
              className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs min-w-[150px]"
              value={followUpTime}
              onChange={(e) => setFollowUpTime(e.target.value)}
              title="Time"
            />
          ) : (
            <input
              type="datetime-local"
              className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs min-w-[205px]"
              value={toDatetimeLocalValue(formData.next_follow_up_at)}
              onChange={(e) => {
                setFormData({ ...formData, next_follow_up_at: e.target.value ? new Date(e.target.value).toISOString() : undefined });
                if (e.target.value) {
                  const d = new Date(e.target.value);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  setFollowUpTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
                }
              }}
              title="Date & time"
            />
          )}
          <button
            type="button"
            disabled={followUpSaving}
            onClick={saveFollowUp}
            className="h-8 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {followUpSaving ? 'Saving...' : 'Save follow-up'}
          </button>
          {formData.next_follow_up_at && (
            <span className="ml-auto pr-2 text-xs text-slate-500">
              Scheduled: {new Date(formData.next_follow_up_at).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {isEdit && (
        <div className="flex rounded-full border border-slate-200 p-0.5 bg-slate-100/50 mb-4 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('enquiry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'enquiry' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            <FileText size={16} /> Enquiry log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status_logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'status_logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            <History size={16} /> Lead status logs
          </button>
        </div>
      )}

      {isEdit && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <List size={16} className="text-slate-600" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Lead details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Lead No.</span><br /><span className="font-medium tabular-nums">{formData.series?.trim() || '—'}</span></div>
            {latestQuotation && (
              <div>
                <span className="text-slate-500">Latest quotation</span>
                <br />
                <span className="font-medium">{latestQuotation.att.quotation_number || '—'}</span>
                {id && (
                  <button
                    type="button"
                    onClick={() => marketingAPI.downloadLeadActivityAttachment(parseInt(id), latestQuotation.activity.id, latestQuotation.att.id, latestQuotation.att.file_name || 'download')}
                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-0.5"
                  >
                    <Download size={12} /> Download
                  </button>
                )}
              </div>
            )}
            <div><span className="text-slate-500">Name</span><br /><span className="font-medium">{currentLead ? leadDisplayName(currentLead) : '—'}</span></div>
            <div><span className="text-slate-500">Email</span><br /><span className="font-medium">{currentLead ? leadDisplayEmail(currentLead) || '—' : '—'}</span></div>
            <div><span className="text-slate-500">Company</span><br /><span className="font-medium">{currentLead ? leadDisplayCompany(currentLead) || '—' : '—'}</span></div>
            <div><span className="text-slate-500">Status</span><br /><span className="font-medium">{leadStatuses.find(s => s.id === formData.status_id)?.label ?? '—'}</span></div>
            <div><span className="text-slate-500">Domain · Region</span><br /><span className="font-medium">{domains.find(d => d.id === formData.domain_id)?.name ?? '—'}{formData.region_id ? ` · ${regions.find(r => r.id === formData.region_id)?.name ?? ''}` : ''}</span></div>
            {formData.potential_value != null && <div><span className="text-slate-500">Potential value</span><br /><span className="font-medium">₹{Number(formData.potential_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
            {formData.closed_value != null && formData.closed_value !== undefined && (
              <div>
                <span className="text-slate-500">Closed value</span>
                <br />
                <span className="font-medium text-emerald-700">₹{Number(formData.closed_value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                {formData.closed_at && (
                  <span className="text-xs text-slate-500 ml-1">
                    (closed {new Date(formData.closed_at).toLocaleDateString(undefined, { dateStyle: 'medium' })})
                  </span>
                )}
              </div>
            )}
          </div>
          {!viewMode && canEdit && (wonStatusId || lostStatusId) && formData.status_id !== wonStatusId && formData.status_id !== lostStatusId && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
              {wonStatusId && (
                <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" leftIcon={<Trophy size={14} />} onClick={() => setShowMarkWonModal(true)}>
                  Mark as Won
                </Button>
              )}
              {lostStatusId && (
                <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50" leftIcon={<XCircle size={14} />} onClick={() => setShowMarkLostConfirm(true)}>
                  Mark as Lost
                </Button>
              )}
            </div>
          )}
          {!viewMode && isEdit && id && formData.status_id === wonStatusId && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" leftIcon={<Package size={14} />} onClick={() => navigate(`/orders/new?lead_id=${id}`)}>
                Create Order from this lead
              </Button>
            </div>
          )}
        </Card>
      )}

      {!isEdit && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Primary Contact Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <User size={18} /> Primary contact
              </h3>
              <p className="text-sm text-slate-500 font-medium">Search existing contacts or fill in details below to create a new one.</p>
              
              {primaryContactContactId != null ? (
                <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-white rounded-xl border border-indigo-100/80 flex items-start justify-between gap-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      {selectedPrimaryContact ? (
                        <>
                          <p className="font-bold text-slate-900 truncate tracking-tight">{contactDisplayName(selectedPrimaryContact) || contactCompanyName(selectedPrimaryContact) || 'Contact'}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-slate-500 text-xs">
                             {selectedPrimaryContact.contact_email && <span className="flex items-center gap-1"><Mail size={12} className="text-slate-400" />{selectedPrimaryContact.contact_email}</span>}
                             {selectedPrimaryContact.contact_phone && <span className="flex items-center gap-1"><Info size={12} className="text-slate-400" />{selectedPrimaryContact.contact_phone}</span>}
                          </div>
                        </>
                      ) : (
                        <p className="font-bold text-slate-900">Contact linked</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => { 
                        setPrimaryContactContactId(null); 
                        setSelectedPrimaryContact(null); 
                        setPrimaryContactSearchQuery(''); 
                        setContactSuggestions([]); 
                        // Clear organization when changing contact
                        setSelectedOrganization(null);
                        setFormData(prev => ({ 
                          ...prev, 
                          contact_id: undefined, 
                          organization_id: undefined, 
                          plant_id: undefined 
                        }));
                        setPlants([]);
                        setOrgSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                    >
                      <X size={14} /> Change
                    </button>
                    <a
                      href={`/contacts/${primaryContactContactId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors shadow-sm"
                      title="Open contact in new tab"
                    >
                      <ArrowRight size={14} /> View
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-5 mt-1 relative overflow-hidden">
                  <div className="grid grid-cols-12 gap-x-4 gap-y-4">
                    {/* Row 1: Name Fields */}
                    <div className="col-span-12 lg:col-span-2">
                       <Select 
                         label="Title" 
                         options={NAME_PREFIXES} 
                         value={inlineContactForm.title} 
                         onChange={(v) => setInlineContactForm(prev => ({ ...prev, title: (v ?? '') as string }))} 
                         placeholder="—" 
                         searchable={false} 
                         inputSize="md"
                       />
                    </div>
                    <div className="col-span-12 md:col-span-6 lg:col-span-5">
                      <Input
                        label="First name"
                        value={inlineContactForm.first_name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setInlineContactForm(prev => ({ ...prev, first_name: v }));
                          onPrimaryContactSearchChange(v);
                        }}
                        placeholder="First name"
                        className="h-10"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6 lg:col-span-5 relative">
                      <Input
                        label="Last name"
                        value={inlineContactForm.last_name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setInlineContactForm(prev => ({ ...prev, last_name: v }));
                          onPrimaryContactSearchChange(v);
                        }}
                        placeholder="Last name"
                        className="h-10"
                      />
                      <SearchSuggestion
                        items={contactSuggestions}
                        onSelect={linkLeadToContact}
                        title="Did you mean an existing contact?"
                        renderItem={(c) => ({
                          id: c.id,
                          title: contactDisplayName(c),
                          subtitle: c.organization?.name || 'No Organization',
                          rightText: c.contact_phone
                        })}
                      />
                    </div>

                    {/* Row 2: Phone Fields */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3">
                      <Select 
                        label="Country Code" 
                        options={COUNTRY_CODES} 
                        value={inlineContactForm.contact_phone_code} 
                        onChange={(v) => setInlineContactForm(prev => ({ ...prev, contact_phone_code: (v ?? '') as string }))} 
                        placeholder="Code" 
                        searchable 
                        getSearchText={getCountryCodeSearchText} 
                        inputSize="md"
                        clearable={false}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-8 lg:col-span-9">
                      <Input 
                        label="Phone number" 
                        type="tel" 
                        value={inlineContactForm.contact_phone} 
                        onChange={(e) => setInlineContactForm(prev => ({ ...prev, contact_phone: e.target.value }))} 
                        placeholder="Number" 
                        className="h-10"
                      />
                    </div>

                    {/* Row 3: Details */}
                    <div className="col-span-12 md:col-span-6">
                      <Input 
                        label="Email address" 
                        type="email" 
                        value={inlineContactForm.contact_email} 
                        onChange={(e) => setInlineContactForm(prev => ({ ...prev, contact_email: e.target.value }))} 
                        placeholder="email@example.com" 
                        className="h-10"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <Input 
                        label="Designation / Job title" 
                        value={inlineContactForm.contact_job_title} 
                        onChange={(e) => setInlineContactForm(prev => ({ ...prev, contact_job_title: e.target.value }))} 
                        placeholder="e.g. Director" 
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Organization Section */}
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <Building2 size={18} /> Organization
              </h3>
              <p className="text-sm text-slate-500 font-medium">Link an existing organization or enter details below to create a new one.</p>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Company / Organization name</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={selectedOrganization?.name ?? orgSearchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOrgSearchQuery(v);
                      setNewOrgForm(prev => ({ ...prev, name: v }));
                      setFormData(prev => ({ ...prev, company: v }));
                      onOrganizationSearchChange(v);
                    }}
                    onBlur={() => setTimeout(() => setOrgSuggestions([]), 150)}
                    placeholder="Type to search and link existing organization..."
                    className={formData.organization_id != null ? 'pr-20' : undefined}
                    rightElement={
                      formData.organization_id != null ? (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={clearOrganization}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <X size={16} />
                          </button>
                          <a
                            href={`/organizations/${formData.organization_id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <ArrowRight size={16} />
                          </a>
                        </div>
                      ) : undefined
                    }
                  />
                  
                    <SearchSuggestion
                      items={orgSuggestions}
                      onSelect={(org) => {
                        setSelectedOrganization(org);
                        setFormData(prev => ({ ...prev, organization_id: org.id, company: org.name }));
                        setOrgSuggestions([]);
                        setOrgSearchQuery('');
                        marketingAPI.getOrganizationPlants(org.id).then(setPlants).catch(() => setPlants([]));
                      }}
                      title="Link to existing organization:"
                      icon={Building2}
                      renderItem={(org) => ({
                        id: org.id,
                        title: org.name,
                        subtitle: [org.industry, org.website].filter(Boolean).join(' · '),
                        rightText: org.code
                      })}
                    />
                </div>

                {selectedOrganization ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm mt-3 animate-in zoom-in-95 duration-200 shadow-sm">
                    <p className="font-bold text-slate-800">Linked organization</p>
                    <p className="text-slate-600 mt-0.5">{selectedOrganization.name}{selectedOrganization.code ? ` · ${selectedOrganization.code}` : ''}</p>
                    {(selectedOrganization.website || selectedOrganization.industry) && (
                      <p className="text-slate-500 text-xs mt-1 italic">{[selectedOrganization.website, selectedOrganization.industry].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                ) : (
                  canCreateOrg && orgSearchQuery.trim() !== '' && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-4 space-y-3 mt-3 animate-in slide-in-from-top-2">
                      <p className="text-sm font-bold text-slate-700">Create new organization on save</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Organization code *" value={newOrgForm.code} onChange={(e) => setNewOrgForm(prev => ({ ...prev, code: e.target.value }))} placeholder="e.g. ORG-123" required />
                        <Input label="Website" value={newOrgForm.website} onChange={(e) => setNewOrgForm(prev => ({ ...prev, website: e.target.value }))} placeholder="https://..." />
                        <div className="md:col-span-2">
                          <Input label="Description *" value={newOrgForm.description} onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Short description of the company..." required />
                        </div>
                        <Input label="Industry" value={newOrgForm.industry} onChange={(e) => setNewOrgForm(prev => ({ ...prev, industry: e.target.value }))} placeholder="e.g. IT, Manufacturing" />
                        <Select label="Size of organization" options={COMPANY_SIZES} value={newOrgForm.organization_size} onChange={(val) => setNewOrgForm(prev => ({ ...prev, organization_size: String(val ?? '') }))} placeholder="Select size" />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* 3. Enquiry Details Section */}
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <FileText size={18} /> Enquiry Details
              </h3>
              <p className="text-sm text-slate-500 font-medium">Categorize the lead and specify how they discovered us.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Lead Type *"
                  options={leadTypes.map(t => ({ value: String(t.id), label: t.label }))}
                  value={formData.lead_type_id ? String(formData.lead_type_id) : ''}
                  onChange={(v) => setFormData({ ...formData, lead_type_id: v ? Number(v) : undefined })}
                  placeholder="Select type"
                />
                <Select
                  label="Through *"
                  options={leadThroughOptions.map(t => ({ value: String(t.id), label: t.label }))}
                  value={formData.lead_through_id ? String(formData.lead_through_id) : ''}
                  onChange={(v) => setFormData({ ...formData, lead_through_id: v ? Number(v) : undefined })}
                  placeholder="Select source"
                />
                
                <div className="md:col-span-2 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
                  <div className="max-w-xs mb-4">
                    <Select
                      label="Referred By"
                      options={[
                        { value: 'none', label: 'NONE' },
                        { value: 'employee', label: 'EMPLOYEE' },
                        { value: 'customer', label: 'CUSTOMER' },
                        { value: 'contact', label: 'CONTACT' },
                      ]}
                      value={referredByType}
                      onChange={(v) => setReferredByType(v as any)}
                      searchable={false}
                      triggerClassName="font-bold tracking-tight"
                    />
                  </div>
                  
                  {referredByType === 'employee' && (
                    <AsyncSelect
                      loadOptions={async (search) => {
                        const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
                        return res.employees.map((e) => ({ value: e.id, label: [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email }));
                      }}
                      value={formData.referred_by_employee_id ?? undefined}
                      onChange={(val) => setFormData(prev => ({ ...prev, referred_by_employee_id: val ? Number(val) : undefined }))}
                      placeholder="Search employee..."
                    />
                  )}
                  {referredByType === 'customer' && (
                    <Select
                      options={[{ value: '', label: 'Select customer' }, ...customers.map((c) => ({ value: String(c.id), label: c.company_name }))]}
                      value={formData.referred_by_customer_id != null ? String(formData.referred_by_customer_id) : ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, referred_by_customer_id: val ? Number(val) : undefined }))}
                    />
                  )}
                  {referredByType === 'contact' && (
                    <div className="space-y-3">
                      {formData.through_contact_id != null ? (
                        <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-sm animate-in zoom-in-95">
                          <div className="text-sm">
                            <p className="font-bold text-slate-800">{contactDisplayName(selectedThroughContactForDisplay!) || 'Contact Linked'}</p>
                            <p className="text-slate-500 text-xs">{[selectedThroughContactForDisplay?.contact_email, selectedThroughContactForDisplay?.contact_phone].filter(Boolean).join(' · ')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, through_contact_id: undefined })); setSelectedThroughContactForDisplay(null); }}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            placeholder="Search contact by name, email or phone..."
                            value={throughContactSearchName}
                            onChange={(e) => setThroughContactSearchName(e.target.value)}
                            onBlur={() => setTimeout(() => setThroughContactSearchResults([]), 150)}
                          />
                          <SearchSuggestion
                            items={throughContactSearchResults}
                            onSelect={linkThroughContact}
                            title="Referrer Contacts Found"
                            renderItem={(c) => ({
                              id: c.id,
                              title: contactDisplayName(c),
                              subtitle: c.organization?.name || 'No Organization',
                              rightText: c.contact_phone
                            })}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Domain & Region Section */}
            <div className="border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setDomainRegionCollapsed(!domainRegionCollapsed)}
                className="flex items-center justify-between w-full p-2 hover:bg-slate-50 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-slate-400 group-hover:text-indigo-600" />
                  <span className="text-lg font-bold text-slate-900 tracking-tight">Domain & Region</span>
                </div>
                <ChevronDown size={20} className={cn("text-slate-400 transition-transform", !domainRegionCollapsed && "rotate-180")} />
              </button>

              {!domainRegionCollapsed && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                  <Select
                    label="Domain *"
                    options={domains.map(d => ({ value: String(d.id), label: d.name }))}
                    value={formData.domain_id ? String(formData.domain_id) : ''}
                    onChange={(v) => {
                      const did = v ? Number(v) : undefined;
                      setFormData({ ...formData, domain_id: did, region_id: undefined });
                      if (did) loadRegions(did);
                    }}
                    placeholder="Select domain"
                  />
                  <Select
                    label="Region"
                    options={[{ value: '', label: 'None' }, ...regions.map(r => ({ value: String(r.id), label: r.name }))]}
                    value={formData.region_id ? String(formData.region_id) : ''}
                    onChange={(v) => setFormData({ ...formData, region_id: v ? Number(v) : undefined })}
                    placeholder="Select region"
                    disabled={!formData.domain_id}
                  />
                  <AsyncSelect
                    label="Assigned To"
                    loadOptions={async (search) => {
                      const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
                      return res.employees.map((e) => ({ value: e.id, label: [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email }));
                    }}
                    value={formData.assigned_to_employee_id ?? undefined}
                    onChange={(val) => setFormData(prev => ({ ...prev, assigned_to_employee_id: val ? Number(val) : undefined }))}
                    placeholder="Search employee..."
                  />
                </div>
              )}
            </div>

            {/* 5. Additional Context */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div className="flex items-center gap-2">
                 <FileText size={18} className="text-slate-400" />
                 <span className="text-lg font-bold text-slate-900 tracking-tight">Additional Notes</span>
              </div>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] bg-slate-50/30 focus:bg-white transition-all"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any special instructions, meeting notes, or additional details..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
              <Button variant="ghost" type="button" onClick={() => navigate('/leads')} className="text-slate-500 font-bold px-4">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} leftIcon={<Plus size={16} />} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                {isSubmitting ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isEdit && activeTab === 'enquiry' && (
        <Card>
          {!viewMode && (
            <>
              <form onSubmit={handleAddActivity} className="mb-4">
                <div className="grid grid-cols-1 gap-3 max-w-2xl">
                  {/* Row 1: Type | Title | Add log */}
                  <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-end">
                    <div className="w-32 [&_button]:!h-9 [&_button]:!min-h-0 [&_label]:!text-[10px] [&_label]:!font-semibold">
                      <Select
                        label="Type"
                        value={activityForm.activity_type}
                        onChange={(val) => setActivityForm((f) => ({ ...f, activity_type: val as string }))}
                        options={ACTIVITY_TYPE_OPTIONS}
                        searchable={false}
                        containerClassName="!space-y-1"
                      />
                    </div>
                    {activityForm.activity_type === 'qtn_submitted' ? (
                      <div className="flex items-end pb-2.5">
                        <span className="text-[10px] text-emerald-600 font-bold tracking-tight">Title: Added quotation</span>
                      </div>
                    ) : (
                      <div className="min-w-0 !space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 tracking-tight block">Title</label>
                        <Input
                          value={activityForm.title}
                          onChange={(e) => setActivityForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder={
                            activityForm.activity_type === 'lead_status_change'
                              ? 'e.g. Status → Qualified'
                              : activityForm.activity_type === 'lead_type_change'
                                ? 'e.g. Type → Chamber'
                                : 'e.g. Called to discuss requirements'
                          }
                          required
                          className="h-9 text-xs"
                        />
                      </div>
                    )}
                    <Button type="submit" size="sm" disabled={activitySubmitting} className="h-9 shrink-0 px-4">
                      {activitySubmitting ? '…' : 'Add log'}
                    </Button>
                  </div>

                  {/* Notes */}
                  <div className="!space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-500 tracking-tight">Notes</label>
                    <textarea
                      rows={2}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                      placeholder="e.g. timeline, budget, next steps"
                      value={activityForm.description ?? ''}
                      onChange={(e) => setActivityForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  {/* Status change: From → To */}
                  {activityForm.activity_type === 'lead_status_change' && (
                    <div className="grid grid-cols-[auto_auto_auto] gap-3 items-end">
                      <div className="w-40 [&_button]:!h-9">
                        <Select
                          label="From"
                          value={activityForm.from_status_id != null ? String(activityForm.from_status_id) : ''}
                          onChange={(val) => setActivityForm((f) => ({ ...f, from_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                          options={[{ value: '', label: '—' }, ...leadStatuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                          searchable={false}
                        />
                      </div>
                      <span className="text-slate-400 text-sm pb-2">→</span>
                      <div className="w-40 [&_button]:!h-9">
                        <Select
                          label="To"
                          value={activityForm.to_status_id != null ? String(activityForm.to_status_id) : ''}
                          onChange={(val) => setActivityForm((f) => ({ ...f, to_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                          options={[{ value: '', label: '—' }, ...leadStatuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                          searchable={false}
                        />
                      </div>
                    </div>
                  )}

                  {/* Contacted different person */}
                  {activityForm.activity_type === 'contacted_different_person' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-200">
                      <div className="sm:col-span-2 grid grid-cols-[auto_1fr] gap-2 items-end">
                        <div className="w-24 [&_button]:!h-9">
                          <Select label="Title" options={NAME_PREFIXES} value={activityForm.contact_person_name_prefix} onChange={(v) => setActivityForm((f) => ({ ...f, contact_person_name_prefix: (v ?? '') as string }))} placeholder="—" searchable={false} />
                        </div>
                        <Input label="Name" value={activityForm.contact_person_name} onChange={(e) => setActivityForm((f) => ({ ...f, contact_person_name: e.target.value }))} placeholder="Name" inputSize="sm" />
                      </div>
                      <Input label="Email" value={activityForm.contact_person_email} onChange={(e) => setActivityForm((f) => ({ ...f, contact_person_email: e.target.value }))} placeholder="email@example.com" inputSize="sm" />
                      <div className="grid grid-cols-[auto_1fr] gap-2 items-end">
                        <div className="w-28 [&_button]:!h-9">
                          <Select label="Code" options={COUNTRY_CODES} value={activityForm.contact_person_phone_code} onChange={(v) => setActivityForm((f) => ({ ...f, contact_person_phone_code: (v ?? '') as string }))} placeholder="+" searchable getSearchText={getCountryCodeSearchText} exactValueMatchWhenQueryMatches={/^\+?\d+$/} triggerClassName="w-28" clearable={false} />
                        </div>
                        <Input label="Phone" value={activityForm.contact_person_phone} onChange={(e) => setActivityForm((f) => ({ ...f, contact_person_phone: e.target.value }))} placeholder="Number" inputSize="sm" />
                      </div>
                    </div>
                  )}

                  {/* Attach files toggle */}
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setShowAttachments((v) => !v)}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Paperclip size={12} />
                      {showAttachments ? 'Hide files' : 'Attach files'}
                    </button>
                    {showAttachments && (
                      <>
                        <div className="mt-2 space-y-2">
                          {attachmentEntries.map((row) => (
                            <div key={row.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white shadow-sm group/row">
                              <label className={cn(
                                "flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-all duration-200 shrink-0 min-w-[130px] justify-center",
                                row.file ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                              )}>
                                <Upload size={14} className={row.file ? "text-indigo-600" : "text-slate-400"} />
                                <span className="truncate max-w-[110px]">{row.file ? row.file.name : 'Choose file'}</span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                  className="hidden"
                                  multiple
                                  onChange={(e) => {
                                    const fileList = e.target.files;
                                    if (!fileList?.length) return;
                                    const files = Array.from(fileList);
                                    if (files.length === 1) {
                                      setAttachmentEntries((prev) =>
                                        prev.map((r) => (r.id === row.id ? { ...r, file: files[0] } : r))
                                      );
                                    } else {
                                      const newRows = files.map((file) => ({
                                        id: crypto.randomUUID(),
                                        kind: 'attachment' as const,
                                        file: file as File,
                                        quotationNumber: '',
                                        title: '',
                                      }));
                                      setAttachmentEntries((prev) =>
                                        prev.map((r) => (r.id === row.id ? { ...r, file: files[0] } : r)).concat(newRows.slice(1))
                                      );
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              <div className="w-28 shrink-0 [&_button]:!h-10 [&_button]:!min-h-0 [&_button]:!py-0">
                                <Select
                                  options={[
                                    { value: 'quotation', label: 'Quotation' },
                                    { value: 'attachment', label: 'Attachment' },
                                  ]}
                                  value={row.kind}
                                  onChange={(val) =>
                                    setAttachmentEntries((prev) =>
                                      prev.map((r) => (r.id === row.id ? { ...r, kind: (val || 'attachment') as 'quotation' | 'attachment' } : r))
                                    )
                                  }
                                  className="w-full"
                                  searchable={false}
                                />
                              </div>
                              {row.kind === 'quotation' ? (
                                <div className="h-10 flex-1 flex items-center px-3 bg-slate-50 border border-slate-100 rounded-lg">
                                  <span className="text-[11px] font-medium text-slate-500 italic">Auto from Lead</span>
                                </div>
                              ) : (
                                <Input
                                  placeholder="File title"
                                  value={row.title}
                                  onChange={(e) =>
                                    setAttachmentEntries((prev) =>
                                      prev.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r))
                                    )
                                  }
                                  inputSize="md"
                                  containerClassName="min-w-[160px] flex-1 !space-y-0"
                                />
                              )}
                              <div className="ml-auto flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAttachmentEntries((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))
                                  }
                                  className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAttachmentEntries((prev) => [...prev, { id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }])
                                  }
                                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-colors"
                                  title="Add row"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {attachmentEntries.some((e) => e.kind === 'quotation') && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border border-indigo-100 bg-indigo-50/50">
                            <Select
                              label="Quotation series"
                              value={quotationSeriesCode}
                              onChange={(v) => setQuotationSeriesCode((v ?? '') as string)}
                              options={seriesList.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` }))}
                              placeholder="Choose series"
                            />
                            <label className="inline-flex items-center gap-2 text-xs text-slate-700 mt-2 md:mt-7">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={quotationIsRevised}
                                onChange={(e) => setQuotationIsRevised(e.target.checked)}
                              />
                              Mark quotation as revised
                            </label>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </form>
            </>
          )}
          <h3 className="text-base font-bold text-slate-800 mb-2 border-t border-slate-200 pt-4 mt-2 tracking-tight">Enquiry log</h3>
          {activitiesLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : enquiryActivities.length === 0 ? (
            <p className="text-sm text-slate-500">{viewMode ? 'No logs yet.' : 'No logs yet. Add one above.'}</p>
          ) : (
            <ul className="space-y-3">
              {enquiryActivities.map((a) => {
                const displayName = a.created_by_name || a.created_by_username || 'Unknown';
                const tooltipParts = [
                  a.created_by_name && `Name: ${a.created_by_name}`,
                  a.created_by_username && `Username: ${a.created_by_username}`,
                  a.created_by_email && `Email: ${a.created_by_email}`,
                ].filter(Boolean);
                const tooltip = tooltipParts.length > 0 ? tooltipParts.join('\n') : undefined;
                const isEditing = editingActivityId === a.id;
                const canEditDelete = !viewMode && canEditOrDeleteActivity(a);
                return (
                  <li key={a.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Select
                            label="Type"
                            value={editActivityForm.activity_type}
                            onChange={(val) => setEditActivityForm((f) => ({ ...f, activity_type: val as string }))}
                            options={ACTIVITY_TYPE_OPTIONS}
                          />
                          <Input
                            label="Title"
                            value={editActivityForm.title}
                            onChange={(e) => setEditActivityForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Title"
                          />
                        </div>
                        {editActivityForm.activity_type === 'lead_status_change' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <Select
                              label="From status"
                              value={editActivityForm.from_status_id != null ? String(editActivityForm.from_status_id) : ''}
                              onChange={(val) => setEditActivityForm((f) => ({ ...f, from_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                              options={[{ value: '', label: '— Select —' }, ...leadStatuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                            />
                            <Select
                              label="To status"
                              value={editActivityForm.to_status_id != null ? String(editActivityForm.to_status_id) : ''}
                              onChange={(val) => setEditActivityForm((f) => ({ ...f, to_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                              options={[{ value: '', label: '— Select —' }, ...leadStatuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                            />
                          </div>
                        )}
                        {editActivityForm.activity_type === 'contacted_different_person' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="flex gap-2 items-end">
                              <div className="w-24 shrink-0">
                                <Select
                                  label="Title"
                                  options={NAME_PREFIXES}
                                  value={editActivityForm.contact_person_name_prefix}
                                  onChange={(v) => setEditActivityForm((f) => ({ ...f, contact_person_name_prefix: (v ?? '') as string }))}
                                  placeholder="—"
                                  searchable={false}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Input
                                  label="Contact person name"
                                  value={editActivityForm.contact_person_name}
                                  onChange={(e) => setEditActivityForm((f) => ({ ...f, contact_person_name: e.target.value }))}
                                  placeholder="Name"
                                />
                              </div>
                            </div>
                            <Input
                              label="Contact person email"
                              value={editActivityForm.contact_person_email}
                              onChange={(e) => setEditActivityForm((f) => ({ ...f, contact_person_email: e.target.value }))}
                              placeholder="email@example.com"
                            />
                            <div className="flex gap-2 items-end">
                              <div className="w-36 shrink-0">
                                <Select
                                  label="Country code"
                                  options={COUNTRY_CODES}
                                  value={editActivityForm.contact_person_phone_code}
                                  onChange={(v) => setEditActivityForm((f) => ({ ...f, contact_person_phone_code: (v ?? '') as string }))}
                                  placeholder="Code"
                                  searchable
                                  getSearchText={getCountryCodeSearchText}
                                  exactValueMatchWhenQueryMatches={/^\+?\d+$/}
                                  getOptionKey={(o) => o.label}
                                  triggerClassName="w-36"
                                  clearable={false}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Input
                                  label="Contact person phone"
                                  value={editActivityForm.contact_person_phone}
                                  onChange={(e) => setEditActivityForm((f) => ({ ...f, contact_person_phone: e.target.value }))}
                                  placeholder="Number"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                          <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={2}
                            value={editActivityForm.description}
                            onChange={(e) => setEditActivityForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Description"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEditActivity} disabled={editActivitySubmitting || !editActivityForm.title.trim()}>
                            {editActivitySubmitting ? 'Saving...' : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingActivityId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 flex-wrap">
                            {a.inquiry_number != null && (
                              <>
                                <span className="font-semibold text-slate-600">Inquiry #{a.inquiry_number}</span>
                                <span>·</span>
                              </>
                            )}
                            <span className="font-medium">{activityTypeLabel(a.activity_type)}</span>
                            <span>·</span>
                            <span
                              className="cursor-help border-b border-dotted border-slate-400"
                              title={tooltip}
                            >
                              {displayName}
                            </span>
                            <span>·</span>
                            <span>{a.activity_date ? new Date(a.activity_date).toLocaleString() : new Date(a.created_at).toLocaleString()}</span>
                          </div>
                          {canEditDelete && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditActivity(a)}
                                className="p-1.5 rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                                title="Edit enquiry"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteActivityId(a.id)}
                                className="p-1.5 rounded text-slate-500 hover:bg-rose-100 hover:text-rose-600"
                                title="Delete enquiry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="font-medium text-slate-900 text-sm">{a.title}</div>
                        {a.activity_type === 'lead_status_change' && (a.from_status_name || a.to_status_name) && (
                          <div className="text-xs text-slate-600 mt-1">
                            Status: {a.from_status_name || '—'} → {a.to_status_name || '—'}
                          </div>
                        )}
                        {a.description && <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.description}</div>}
                        {a.activity_type === 'contacted_different_person' && (a.contact_person_name || a.contact_person_email || a.contact_person_phone) && (
                          <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                            Contacted person: {[a.contact_person_name, a.contact_person_email, a.contact_person_phone].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        {(a.attachments?.length ?? 0) > 0 && (() => {
                          const isQuotation = (att: LeadActivityAttachment) => att.is_quotation === true || (att.is_quotation !== false && att.quotation_number != null && att.quotation_number !== '');
                          const quotations = a.attachments!.filter(isQuotation);
                          const attachments = a.attachments!.filter((att) => !isQuotation(att));
                          return (
                            <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                              {quotations.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                    <FileText size={12} /> Quotations
                                  </span>
                                  <ul className="mt-1 space-y-1">
                                    {quotations.map((att) => (
                                      <li key={att.id} className="flex items-center gap-2 text-xs">
                                        {att.quotation_number && (
                                          <span className="font-medium text-slate-600 shrink-0">{att.quotation_number}</span>
                                        )}
                                        {att.quotation_number && <span className="text-slate-400">·</span>}
                                        <button
                                          type="button"
                                          onClick={() => marketingAPI.downloadLeadActivityAttachment(parseInt(id!), a.id, att.id, att.file_name)}
                                          className="text-indigo-600 hover:underline flex items-center gap-1"
                                        >
                                          <Download size={12} /> {att.quotation_number || att.file_name}
                                        </button>
                                        {canEditDelete && (
                                          <button
                                            type="button"
                                            disabled={deletingAttachmentId === att.id}
                                            onClick={async () => {
                                              if (!id) return;
                                              setDeletingAttachmentId(att.id);
                                              try {
                                                await marketingAPI.deleteLeadActivityAttachment(parseInt(id), a.id, att.id);
                                                showToast('Removed', 'success');
                                                loadActivities();
                                              } catch (err: any) {
                                                showToast(err.message || 'Failed to remove', 'error');
                                              } finally {
                                                setDeletingAttachmentId(null);
                                              }
                                            }}
                                            className="text-rose-600 hover:underline"
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {attachments.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                    <Paperclip size={12} /> Attachments
                                  </span>
                                  <ul className="mt-1 space-y-1">
                                    {attachments.map((att) => (
                                      <li key={att.id} className="flex items-center gap-2 text-xs">
                                        {att.title && <span className="font-medium text-slate-600 shrink-0">{att.title}</span>}
                                        {att.title && <span className="text-slate-400">·</span>}
                                        <button
                                          type="button"
                                          onClick={() => marketingAPI.downloadLeadActivityAttachment(parseInt(id!), a.id, att.id, att.file_name)}
                                          className="text-indigo-600 hover:underline flex items-center gap-1"
                                        >
                                          <Download size={12} /> {att.title || att.file_name}
                                        </button>
                                        {canEditDelete && (
                                          <button
                                            type="button"
                                            disabled={deletingAttachmentId === att.id}
                                            onClick={async () => {
                                              if (!id) return;
                                              setDeletingAttachmentId(att.id);
                                              try {
                                                await marketingAPI.deleteLeadActivityAttachment(parseInt(id), a.id, att.id);
                                                showToast('Removed', 'success');
                                                loadActivities();
                                              } catch (err: any) {
                                                showToast(err.message || 'Failed to remove', 'error');
                                              } finally {
                                                setDeletingAttachmentId(null);
                                              }
                                            }}
                                            className="text-rose-600 hover:underline"
                                          >
                                            Remove
                                          </button>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {canEditDelete && (
                          <div className="mt-2">
                            {addAttachmentActivityId !== a.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddAttachmentActivityId(a.id);
                                  setAddAttachmentRows([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600"
                              >
                                <Plus size={12} /> Add attachments
                              </button>
                            ) : (
                              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-xs font-semibold text-slate-700">Add quotations / attachments</span>
                                  <div className="flex items-center gap-2">
                                    <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 shrink-0">
                                      <Upload size={12} /> Choose files
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                        className="hidden"
                                        multiple
                                        onChange={(e) => {
                                          const fileList = e.target.files;
                                          if (!fileList?.length) return;
                                          const newRows = Array.from(fileList).map((file) => ({
                                            id: crypto.randomUUID(),
                                            kind: 'attachment' as const,
                                            file: file as File,
                                            quotationNumber: '',
                                            title: '',
                                          }));
                                          setAddAttachmentRows((prev) => [...prev, ...newRows]);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAddAttachmentRows((prev) => [
                                          ...prev,
                                          { id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' },
                                        ])
                                      }
                                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                                    >
                                      <Plus size={12} /> Add row
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddAttachmentActivityId(null);
                                        setAddAttachmentRows([]);
                                        setAddAttachmentQuotationSeriesCode('');
                                        setAddAttachmentIsRevised(false);
                                      }}
                                      className="text-xs text-slate-500 hover:text-slate-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">Quote numbers for quotation documents use the series you choose when adding a quotation (or a base with rev2, rev3). The lead number is separate.</p>
                                {addAttachmentRows.map((row) => (
                                  <div key={row.id} className="flex flex-nowrap items-center gap-2">
                                    <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs text-slate-700 hover:bg-slate-100 shrink-0">
                                      <Upload size={12} />
                                      <span className="truncate max-w-[100px]">{row.file ? row.file.name : 'Choose file'}</span>
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          setAddAttachmentRows((prev) =>
                                            prev.map((r) => (r.id === row.id ? { ...r, file: file || null } : r))
                                          );
                                        }}
                                      />
                                    </label>
                                    <div className="w-28 shrink-0 [&_button]:!h-9 [&_button]:!min-h-0 [&_button]:!py-0">
                                      <Select
                                        options={[
                                          { value: 'quotation', label: 'Quotation' },
                                          { value: 'attachment', label: 'Attachment' },
                                        ]}
                                        value={row.kind}
                                        onChange={(val) =>
                                          setAddAttachmentRows((prev) =>
                                            prev.map((r) => (r.id === row.id ? { ...r, kind: (val || 'attachment') as 'quotation' | 'attachment' } : r))
                                          )
                                        }
                                        className="w-full"
                                        searchable={false}
                                      />
                                    </div>
                                    {row.kind === 'quotation' ? (
                                      <span className="text-xs text-slate-500 shrink-0">Number auto from lead</span>
                                    ) : (
                                      <Input
                                        placeholder="Title"
                                        value={row.title}
                                        onChange={(e) =>
                                          setAddAttachmentRows((prev) =>
                                            prev.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r))
                                          )
                                        }
                                        inputSize="sm"
                                        containerClassName="min-w-[120px] max-w-[180px] flex-1 !space-y-0"
                                      />
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAddAttachmentRows((prev) =>
                                          prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev
                                        )
                                      }
                                      className="h-9 w-9 shrink-0 flex items-center justify-center rounded text-slate-400 hover:text-rose-600"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    disabled={
                                      uploadingAttachmentsForActivityId === a.id ||
                                      addAttachmentRows.every((r) => !r.file)
                                    }
                                    onClick={async () => {
                                      const toUpload = addAttachmentRows.filter((r) => r.file);
                                      if (!id || toUpload.length === 0) return;
                                      setUploadingAttachmentsForActivityId(a.id);
                                      try {
                                        await marketingAPI.uploadLeadActivityAttachments(
                                          parseInt(id),
                                          a.id,
                                          toUpload.map((r) => r.file!),
                                          toUpload.map((r) => r.kind),
                                          undefined,
                                          toUpload.map((r) => (r.kind === 'attachment' ? (r.title.trim() || undefined) : undefined))
                                        );
                                        showToast('Added', 'success');
                                        setAddAttachmentActivityId(null);
                                        setAddAttachmentRows([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]);
                                        loadActivities();
                                      } catch (err: any) {
                                        showToast(err.message || 'Upload failed', 'error');
                                      } finally {
                                        setUploadingAttachmentsForActivityId(null);
                                      }
                                    }}
                                  >
                                    {uploadingAttachmentsForActivityId === a.id ? 'Uploading…' : 'Upload'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {isEdit && activeTab === 'status_logs' && (
        <Card>
          <h3 className="text-base font-bold text-slate-800 mb-3 tracking-tight">Lead status logs</h3>
          {activitiesLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : statusLogsActivities.length === 0 ? (
            <p className="text-sm text-slate-500">No status or edit logs yet.</p>
          ) : (
            <ul className="space-y-3">
              {statusLogsActivities.map((a) => (
                <li key={a.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-600">{a.activity_type === 'lead_edit' ? 'Lead updated' : 'Status change'}</span>
                    <span>·</span>
                    <span>{a.created_by_name || a.created_by_username || 'System'}</span>
                    <span>·</span>
                    <span>{a.activity_date ? new Date(a.activity_date).toLocaleString() : new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <div className="font-medium text-slate-900 text-sm">{a.title}</div>
                  {a.description && <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.description}</div>}
                  {a.activity_type === 'lead_status_change' && (a.from_status_name || a.to_status_name) && (
                    <div className="text-xs text-slate-600 mt-1">
                      Status: {a.from_status_name || '—'} → {a.to_status_name || '—'}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {!isEdit && showCreateContactModal && (
        <>
          <Modal
            isOpen={showCreateContactModal}
            onClose={() => {
              setShowCreateContactModal(false);
              setCreateContactForm(prev => ({ ...prev, organization_id: undefined, plant_id: undefined }));
              setContactCreatePlants([]);
              setShowAddPlantInContactModal(false);
              setNewPlantForm({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
            }}
            title="Create new contact"
            contentClassName="max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">Link to an organization (or create one), optionally add a plant, then create the contact. The lead will be linked to this new contact.</p>
              {/* Person fields first: Title, First name, Last name, Phone, Email */}
              <div className="flex gap-2">
                <div className="w-24 shrink-0">
                  <Select label="Title" options={NAME_PREFIXES} value={createContactForm.title} onChange={(v) => setCreateContactForm(prev => ({ ...prev, title: (v ?? '') as string }))} placeholder="—" inputSize="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <Input label="First name" value={createContactForm.first_name} onChange={(e) => setCreateContactForm(prev => ({ ...prev, first_name: e.target.value }))} placeholder="First name" required inputSize="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <Input label="Last name" value={createContactForm.last_name} onChange={(e) => setCreateContactForm(prev => ({ ...prev, last_name: e.target.value }))} placeholder="Last name" required inputSize="sm" />
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div className="w-36 shrink-0">
                  <Select
                    label="Phone code"
                    options={COUNTRY_CODES}
                    value={createContactForm.contact_phone_code}
                    onChange={(v) => setCreateContactForm(prev => ({ ...prev, contact_phone_code: (v ?? DEFAULT_COUNTRY_CODE) as string }))}
                    placeholder="Code"
                    searchable
                    getSearchText={getCountryCodeSearchText}
                    getOptionKey={(o) => o.label}
                    inputSize="sm"
                    triggerClassName="w-32"
                    clearable={false}
                  />
                </div>
                <Input label="Phone" value={createContactForm.contact_phone} onChange={(e) => setCreateContactForm(prev => ({ ...prev, contact_phone: e.target.value }))} placeholder="Number" containerClassName="flex-1 min-w-0" required inputSize="sm" />
              </div>
              <Input label="Email" type="email" value={createContactForm.contact_email} onChange={(e) => setCreateContactForm(prev => ({ ...prev, contact_email: e.target.value }))} placeholder="email@example.com" inputSize="sm" />
              {/* Organization: search/select or create */}
              <div className="relative">
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 ml-0.5">Organization</label>
                {createContactForm.organization_id != null ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="flex-1 text-sm font-medium text-slate-800 truncate">{createContactSelectedOrg?.name || 'Organization linked'}</span>
                    <button
                      type="button"
                      className="shrink-0 p-1.5 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                      onClick={() => {
                        setCreateContactForm(prev => ({ ...prev, organization_id: undefined, plant_id: undefined }));
                        setCreateContactSelectedOrg(null);
                        setContactCreatePlants([]);
                        setOrgSearchQuery('');
                      }}
                      title="Unlink organization"
                    >
                      <X size={18} />
                      <span className="text-xs font-medium">Unlink</span>
                    </button>
                  </div>
                ) : (
                  <SearchInput
                    value={orgSearchQuery || createContactSelectedOrg?.name || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOrgSearchQuery(v);
                      if (orgSearchTimeoutRef.current) clearTimeout(orgSearchTimeoutRef.current);
                      orgSearchTimeoutRef.current = setTimeout(() => searchOrganizationsByName(v), 300);
                    }}
                    onBlur={() => setTimeout(() => { setOrgSuggestions([]); }, 150)}
                    placeholder="Type to search..."
                    inputSize="sm"
                  />
                )}
                {(orgSuggestions.length > 0 || (orgSearchQuery.trim().length >= 2 && canCreateOrg)) && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {orgSuggestions.length > 0 && (
                      <>
                        <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100">Link to organization:</p>
                        {orgSuggestions.map(org => (
                          <button
                            key={org.id}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col gap-0.5"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOrgSuggestions([]);
                              setOrgSearchQuery('');
                              marketingAPI.getOrganizationPlants(org.id).then(plants => {
                                setContactCreatePlants(plants || []);
                                const firstPlant = plants && plants.length > 0 ? plants[0] : null;
                                setCreateContactForm(prev => ({
                                  ...prev,
                                  organization_id: org.id,
                                  plant_id: firstPlant ? firstPlant.id : undefined,
                                }));
                                setCreateContactSelectedOrg(org);
                              }).catch(() => {
                                setCreateContactForm(prev => ({ ...prev, organization_id: org.id, plant_id: undefined }));
                                setCreateContactSelectedOrg(org);
                              });
                            }}
                          >
                            <span className="font-medium">{org.name}</span>
                            {(org.industry || org.website || org.code) && (
                              <span className="text-slate-500 text-xs">{[org.code, org.industry, org.website].filter(Boolean).join(' · ')}</span>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                    {canCreateOrg && (
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100 text-indigo-600 font-medium"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNewOrgForm({
                            name: (orgSearchQuery || createContactSelectedOrg?.name || '').trim(),
                            code: '',
                            description: '',
                            website: '',
                            industry: '',
                            organization_size: '',
                          });
                          setShowCreateOrgModal(true);
                          setOrgSuggestions([]);
                          setOrgSearchQuery('');
                        }}
                      >
                        <Plus size={16} />
                        {orgSuggestions.length === 0 ? `Create organization "${(orgSearchQuery || createContactSelectedOrg?.name || '').trim() || 'New'}"` : 'Create new organization'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Domain"
                  placeholder="Select domain"
                  required
                  value={createContactForm.domain_id ?? ''}
                  onChange={(val) => {
                    const v = val ? Number(val) : undefined;
                    setCreateContactForm(prev => ({ ...prev, domain_id: v, region_id: undefined }));
                    if (v) loadRegions(v);
                  }}
                  options={domains.map(d => ({ value: d.id, label: d.name }))}
                  inputSize="sm"
                />
                <Select
                  label="Region"
                  placeholder="— None —"
                  value={createContactForm.region_id ?? ''}
                  onChange={(val) => setCreateContactForm(prev => ({ ...prev, region_id: val ? Number(val) : undefined }))}
                  disabled={!createContactForm.domain_id}
                  options={regions.map(r => ({ value: r.id, label: r.name }))}
                  inputSize="sm"
                />
              </div>
              <div className="space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-200 mt-2">
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 ml-0.5">Plant Location</label>
                {createContactForm.organization_id != null ? (
                  <>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Select
                          options={[
                            { value: '', label: 'None' },
                            ...contactCreatePlants.map(p => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` })),
                          ]}
                          value={createContactForm.plant_id != null ? String(createContactForm.plant_id) : ''}
                          onChange={(val) => setCreateContactForm(prev => ({ ...prev, plant_id: val ? Number(val) : undefined }))}
                          placeholder={contactCreatePlants.length === 0 ? 'No plants yet — add one below' : 'Select plant'}
                          searchable
                          inputSize="sm"
                        />
                      </div>
                      {canCreatePlant && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowAddPlantInContactModal(prev => !prev)} leftIcon={<Plus size={14} />} className="!h-9">Add plant</Button>
                      )}
                    </div>
                    {showAddPlantInContactModal && canCreatePlant && (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 mt-2 shadow-sm">
                        <p className="text-[11px] font-bold text-slate-700 tracking-wider mb-2">New plant for this organization</p>
                        <Input label="Plant name" value={newPlantForm.plant_name} onChange={(e) => setNewPlantForm(prev => ({ ...prev, plant_name: e.target.value }))} placeholder="e.g. Main Plant" required inputSize="sm" />
                        <Input label="Address line 1" value={newPlantForm.address_line1} onChange={(e) => setNewPlantForm(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="Address line 1" inputSize="sm" />
                        <Input label="Address line 2" value={newPlantForm.address_line2} onChange={(e) => setNewPlantForm(prev => ({ ...prev, address_line2: e.target.value }))} placeholder="Address line 2" inputSize="sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input label="City" value={newPlantForm.city} onChange={(e) => setNewPlantForm(prev => ({ ...prev, city: e.target.value }))} placeholder="City" inputSize="sm" />
                          <Input label="State" value={newPlantForm.state} onChange={(e) => setNewPlantForm(prev => ({ ...prev, state: e.target.value }))} placeholder="State" inputSize="sm" />
                          <Input label="Country" value={newPlantForm.country} onChange={(e) => setNewPlantForm(prev => ({ ...prev, country: e.target.value }))} placeholder="Country" inputSize="sm" />
                          <Input label="Postal code" value={newPlantForm.postal_code} onChange={(e) => setNewPlantForm(prev => ({ ...prev, postal_code: e.target.value }))} placeholder="Postal code" inputSize="sm" />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={handleAddPlantInContactModal} disabled={addingPlant || !newPlantForm.plant_name?.trim()}>{addingPlant ? 'Adding...' : 'Add plant'}</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => { setShowAddPlantInContactModal(false); setNewPlantForm({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' }); }}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400 italic font-medium">Select or create an organization above to choose a plant.</p>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setShowCreateContactModal(false)}>Cancel</Button>
                <Button type="button" onClick={handleCreateContact} disabled={creatingContact || !createContactForm.first_name?.trim() || !createContactForm.last_name?.trim() || !(serializePhoneWithCountryCode(createContactForm.contact_phone_code, createContactForm.contact_phone)?.trim()) || createContactForm.domain_id == null}>
                  {creatingContact ? 'Creating...' : 'Create contact & link to lead'}
                </Button>
              </div>
            </div>
          </Modal>
          {/* Nested: Create organization modal */}
          <Modal
            isOpen={showCreateOrgModal}
            onClose={() => { setShowCreateOrgModal(false); setNewOrgForm({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' }); }}
            title="Create organization"
          >
            <div className="space-y-3">
              <Input label="Name" value={newOrgForm.name} onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Organization name" required />
              <Input label="Code" value={newOrgForm.code} onChange={(e) => setNewOrgForm(prev => ({ ...prev, code: e.target.value }))} placeholder="Optional code" />
              <Input label="Website" value={newOrgForm.website} onChange={(e) => setNewOrgForm(prev => ({ ...prev, website: e.target.value }))} placeholder="https://..." />
              <Input label="Industry" value={newOrgForm.industry} onChange={(e) => setNewOrgForm(prev => ({ ...prev, industry: e.target.value }))} placeholder="e.g. IT, Manufacturing" />
              <Select
                label="Size of organization"
                options={COMPANY_SIZES}
                value={newOrgForm.organization_size}
                onChange={(val) => setNewOrgForm(prev => ({ ...prev, organization_size: (val as string) || '' }))}
                placeholder="Select size"
                searchable
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={newOrgForm.description}
                  onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Notes / important details"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateOrgModal(false)}>Cancel</Button>
                <Button type="button" onClick={handleCreateOrganizationInContactModal} disabled={creatingOrg || !newOrgForm.name.trim()}>
                  {creatingOrg ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}


      {isEdit && showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Lead Information"
          contentClassName="max-w-6xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-500 whitespace-nowrap">Basic Information</h4>
                </div>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <Select label="Title" options={NAME_PREFIXES} value={formData.title} onChange={(v) => setFormData({ ...formData, title: (v ?? '') as string })} placeholder="Prefix" inputSize="sm" />
                </div>
                <div className="md:col-span-5">
                  <Input label="First Name" value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="First name" required inputSize="sm" />
                </div>
                <div className="md:col-span-5">
                  <Input label="Last Name" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} placeholder="Last name" required inputSize="sm" />
                </div>

                <div className="md:col-span-6">
                  <Input label="Company" value={formData.company || ''} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Company name" inputSize="sm" />
                </div>
                <div className="md:col-span-6">
                  <Input label="Designation" value={formData.job_title || ''} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} placeholder="e.g. Director" inputSize="sm" />
                </div>
              </div>
            </div>

            {/* Contact & Territory Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-500 whitespace-nowrap">Communication & Territory</h4>
                </div>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                <div className="md:col-span-6">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5 mb-1.5 block">Phone Number</label>
                  <div className="flex gap-2">
                    <Select
                      options={COUNTRY_CODES}
                      value={leadPhoneCountryCode}
                      onChange={(v) => setLeadPhoneCountryCode((v ?? DEFAULT_COUNTRY_CODE) as string)}
                      placeholder="+91"
                      searchable
                      getSearchText={getCountryCodeSearchText}
                      getOptionKey={(o) => o.value}
                      containerClassName="w-32 shrink-0"
                      inputSize="sm"
                      triggerClassName="w-32"
                      clearable={false}
                    />
                    <Input type="text" value={leadPhonePart} onChange={(e) => setLeadPhonePart(e.target.value)} placeholder="Number" containerClassName="flex-1 min-w-0" inputSize="sm" />
                  </div>
                </div>

                <div className="md:col-span-6">
                  <AsyncSelect
                    label="Domain"
                    loadOptions={async (search) => {
                      if (!search && domains.length > 0) return domains.slice(0, 10).map(d => ({ value: d.id, label: d.name }));
                      const res = await marketingAPI.getDomains({ is_active: true, page: 1, page_size: 10, search: search || undefined });
                      return res.items.map((d: { id: number; name: string }) => ({ value: d.id, label: d.name }));
                    }}
                    value={formData.domain_id}
                    onChange={(val) => setFormData({ ...formData, domain_id: val ? Number(val) : undefined, region_id: undefined })}
                    placeholder="Select Domain"
                    required
                    initialOptions={domains.slice(0, 10).map(d => ({ value: d.id, label: d.name }))}
                    inputSize="sm"
                  />
                </div>
                <div className="md:col-span-6">
                  <AsyncSelect
                    label="Region"
                    loadOptions={async (search) => {
                      if (!formData.domain_id) return [];
                      if (!search && regions.length > 0) return regions.slice(0, 10).map(r => ({ value: r.id, label: r.name }));
                      const res = await marketingAPI.getRegions({ domain_id: formData.domain_id, is_active: true, page: 1, page_size: 25, search: search || undefined });
                      return res.items.map(r => ({ value: r.id, label: r.name }));
                    }}
                    value={formData.region_id}
                    onChange={(val) => setFormData({ ...formData, region_id: val ? Number(val) : undefined })}
                    placeholder="Select Region"
                    disabled={!formData.domain_id}
                    initialOptions={regions.slice(0, 10).map(r => ({ value: r.id, label: r.name }))}
                    inputSize="sm"
                  />
                </div>
              </div>
            </div>

            {/* Lead Tracking Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-slate-400" />
                  <h4 className="text-[11px] font-bold tracking-wider text-slate-500 whitespace-nowrap">Lead Information</h4>
                </div>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-4">
                <div className="md:col-span-4">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5 mb-1.5 block">Lead Number</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 tabular-nums">
                    {formData.series?.trim() || '—'}
                  </div>
                </div>
                <div className="md:col-span-8 !space-y-1">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5 mb-1.5 block">Potential Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs z-10">₹</span>
                    <Input inputSize="sm" className="pl-7" type="number" value={formData.potential_value ?? ''} onChange={(e) => setFormData({ ...formData, potential_value: e.target.value ? Number(e.target.value) : undefined })} placeholder="0.00" />
                  </div>
                </div>
                <div className="md:col-span-12">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5 mb-1.5 block">Additional Notes</label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter any additional context..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)} className="text-slate-500 font-bold tracking-widest text-[10px]">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} leftIcon={<Edit2 size={16} />} className="px-6 shadow-lg shadow-indigo-100">
                {isSubmitting ? 'Saving...' : 'Update Lead'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isEdit && (
        <Modal
          isOpen={showMarkWonModal}
          onClose={() => { setShowMarkWonModal(false); setMarkWonClosedValue(''); setMarkWonPO(''); }}
          title="Mark as Won"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => { setShowMarkWonModal(false); setMarkWonClosedValue(''); setMarkWonPO(''); }}>Cancel</Button>
              <Button size="sm" onClick={handleMarkWonSubmit} disabled={!markWonClosedValue.trim() || markWonSubmitting}>
                {markWonSubmitting ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-slate-600 mb-3">Mark this lead as Won. These details will appear in the Lead Inquiry log.</p>
          <div className="space-y-3">
            <Input
              label="Closed value (required)"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 50000"
              value={markWonClosedValue}
              onChange={(e) => setMarkWonClosedValue(e.target.value)}
              containerClassName="max-w-xs"
              inputSize="sm"
            />
            <Input
              label="PO"
              type="text"
              placeholder="Purchase order number"
              value={markWonPO}
              onChange={(e) => setMarkWonPO(e.target.value)}
              containerClassName="max-w-xs"
              inputSize="sm"
            />
          </div>
        </Modal>
      )}

      {isEdit && (
        <Modal
          isOpen={showMarkLostConfirm}
          onClose={() => { setShowMarkLostConfirm(false); setMarkLostReason(''); setMarkLostCompetitor(''); setMarkLostPrice(''); }}
          title="Mark lead as Lost"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => { setShowMarkLostConfirm(false); setMarkLostReason(''); setMarkLostCompetitor(''); setMarkLostPrice(''); }} disabled={markLostSubmitting}>Cancel</Button>
              <Button size="sm" variant="danger" onClick={handleMarkLostConfirm} disabled={markLostReason.trim().length < 100 || markLostSubmitting}>
                {markLostSubmitting ? 'Saving...' : 'Yes, mark as Lost'}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-slate-600 mb-4">Please provide a detailed reason and the two options below. If you don't know competitor or price, use "Not sure".</p>

          <label className="block text-[10px] font-semibold text-slate-500 tracking-tight mb-1">Competitor name (lost to whom)*</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 h-9"
              placeholder="e.g. ABC Corp or click Not sure"
              value={markLostCompetitor}
              onChange={(e) => setMarkLostCompetitor(e.target.value)}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setMarkLostCompetitor('Not sure')} className="shrink-0 h-9">Not sure</Button>
          </div>

          <label className="block text-[10px] font-semibold text-slate-500 tracking-tight mb-1">Lost at (at which price)*</label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 h-9"
              placeholder="e.g. ₹50,000 or click Not sure"
              value={markLostPrice}
              onChange={(e) => setMarkLostPrice(e.target.value)}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setMarkLostPrice('Not sure')} className="shrink-0 h-9">Not sure</Button>
          </div>

          <label className="block text-[10px] font-semibold text-slate-500 tracking-tight mb-1">Reason (required, min 100 characters)</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400"
            placeholder="e.g. Customer chose competitor due to pricing. Budget was cut this quarter. No response after 3 follow-ups."
            value={markLostReason}
            onChange={(e) => setMarkLostReason(e.target.value)}
          />
          <p className={`text-xs mt-1 ${markLostReason.trim().length >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {markLostReason.trim().length}/100 minimum characters
          </p>
        </Modal>
      )}

      <ConfirmModal
        isOpen={deleteActivityId !== null}
        onClose={() => setDeleteActivityId(null)}
        onConfirm={handleConfirmDeleteActivity}
        title="Delete enquiry"
        message="Are you sure you want to delete this enquiry log? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </PageLayout>
  );
};

