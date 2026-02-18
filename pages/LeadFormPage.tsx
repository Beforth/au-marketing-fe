/**
 * Lead Form Page
 * Create or edit a lead
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select, SelectOption } from '../components/ui/Select';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectUser, selectEmployee } from '../store/slices/authSlice';
import { marketingAPI, Lead, LeadStatusOption, LeadTypeOption, LeadThroughOption, LeadActivity, LeadActivityAttachment, Domain, Region, Customer, Contact, Plant, Series } from '../lib/marketing-api';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ArrowLeft, ChevronDown, ChevronRight, Globe, User, Building2, FileText, History, Edit2, Trash2, Paperclip, Download, Plus, Upload } from 'lucide-react';

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
  
  type LeadSourceType = 'contact' | 'customer' | 'none';
  const tabParam = searchParams.get('tab');
  const activeTab: 'details' | 'history' = tabParam === 'history' ? 'history' : 'details';
  const setActiveTab = (tab: 'details' | 'history') => {
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
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    from_status_id: undefined as number | undefined,
    to_status_id: undefined as number | undefined,
  });
  type QuotationEntry = { id: string; number: string; file: File | null };
  const [quotationEntries, setQuotationEntries] = useState<QuotationEntry[]>([{ id: crypto.randomUUID(), number: '', file: null }]);
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [addQuotationActivityId, setAddQuotationActivityId] = useState<number | null>(null);
  const [addQuotationRows, setAddQuotationRows] = useState<{ id: string; number: string; file: File | null }[]>([]);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [followUpSaving, setFollowUpSaving] = useState(false);
  const [editActivityForm, setEditActivityForm] = useState({
    activity_type: 'note',
    title: '',
    description: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    from_status_id: undefined as number | undefined,
    to_status_id: undefined as number | undefined,
  });
  const [editActivitySubmitting, setEditActivitySubmitting] = useState(false);
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);
  const [uploadingAttachmentsForActivityId, setUploadingAttachmentsForActivityId] = useState<number | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    source: '',
    domain_id: undefined,
    region_id: undefined,
    contact_id: undefined,
    customer_id: undefined,
    plant_id: undefined,
    status_id: undefined,
    lead_type_id: undefined,
    lead_through_id: undefined,
    potential_value: undefined,
    notes: '',
    series_code: undefined,
    series: undefined,
    assigned_to_employee_id: undefined,
    expected_closing_date: '',
  });
  const [seriesList, setSeriesList] = useState<Series[]>([]);

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
  }, [id, isEdit, canCreate, canEdit]);

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

  const loadActivities = () => {
    if (!isEdit || !id) return;
    setActivitiesLoading(true);
    marketingAPI.getLeadActivities(parseInt(id)).then(setActivities).catch(() => setActivities([])).finally(() => setActivitiesLoading(false));
  };

  useEffect(() => {
    if (isEdit && id && activeTab === 'history') loadActivities();
  }, [isEdit, id, activeTab]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !activityForm.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setActivitySubmitting(true);
    try {
      const created = await marketingAPI.createLeadActivity(parseInt(id), {
        activity_type: activityForm.activity_type,
        title: activityForm.title.trim(),
        description: activityForm.description?.trim() || undefined,
        from_status_id: activityForm.activity_type === 'lead_status_change' ? activityForm.from_status_id : undefined,
        to_status_id: activityForm.activity_type === 'lead_status_change' ? activityForm.to_status_id : undefined,
        contact_person_name: activityForm.activity_type === 'contacted_different_person' ? (activityForm.contact_person_name?.trim() || undefined) : undefined,
        contact_person_email: activityForm.activity_type === 'contacted_different_person' ? (activityForm.contact_person_email?.trim() || undefined) : undefined,
        contact_person_phone: activityForm.activity_type === 'contacted_different_person' ? (activityForm.contact_person_phone?.trim() || undefined) : undefined,
      });
      const toUpload = quotationEntries.filter((e) => e.file && e.number.trim());
      if (toUpload.length > 0) {
        await marketingAPI.uploadLeadActivityAttachments(
          parseInt(id),
          created.id,
          toUpload.map((e) => e.file!),
          toUpload.map((e) => e.number.trim())
        );
      }
      showToast('Log added', 'success');
      setActivityForm({
        activity_type: 'note',
        title: '',
        description: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        from_status_id: undefined,
        to_status_id: undefined,
      });
      setQuotationEntries([{ id: crypto.randomUUID(), number: '', file: null }]);
      loadActivities();
    } catch (err: any) {
      showToast(err.message || 'Failed to add log', 'error');
    } finally {
      setActivitySubmitting(false);
    }
  };

  const canEditOrDeleteActivity = (a: LeadActivity) => user?.id != null && a.created_by_employee_id != null && user.id === a.created_by_employee_id;

  const startEditActivity = (a: LeadActivity) => {
    setEditingActivityId(a.id);
    setEditActivityForm({
      activity_type: a.activity_type,
      title: a.title,
      description: a.description ?? '',
      contact_person_name: a.contact_person_name ?? '',
      contact_person_email: a.contact_person_email ?? '',
      contact_person_phone: a.contact_person_phone ?? '',
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
        contact_person_name: editActivityForm.activity_type === 'contacted_different_person' ? (editActivityForm.contact_person_name?.trim() || undefined) : undefined,
        contact_person_email: editActivityForm.activity_type === 'contacted_different_person' ? (editActivityForm.contact_person_email?.trim() || undefined) : undefined,
        contact_person_phone: editActivityForm.activity_type === 'contacted_different_person' ? (editActivityForm.contact_person_phone?.trim() || undefined) : undefined,
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

  const loadUserAssignments = async (): Promise<{ domain_id: number; region_id: number } | null> => {
    const id = employee?.id ?? user?.id;
    if (!id) return null;
    try {
      const assignments = await marketingAPI.getEmployeeAssignments(id);
      if (assignments?.length) {
        const a = assignments.find((x: any) => x.region && x.is_active) ?? assignments[0];
        if (a?.region) return { domain_id: a.region.domain_id, region_id: a.region.id };
      }
    } catch (_) {}
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
          setFormData(prev => ({ ...prev, domain_id: assigned.domain_id, region_id: assigned.region_id }));
          await loadRegions(assigned.domain_id);
        } else if (domainsData.length > 0) {
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
      
      setFormData({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone || '',
        company: lead.company || '',
        job_title: lead.job_title || '',
        source: lead.source || '',
        domain_id: lead.domain_id,
        region_id: lead.region_id || undefined,
        contact_id: lead.contact_id || undefined,
        customer_id: lead.customer_id || undefined,
        plant_id: lead.plant_id || undefined,
        status_id: lead.status_id ?? undefined,
        lead_type_id: lead.lead_type_id ?? undefined,
        lead_through_id: lead.lead_through_id ?? lead.lead_through_option?.id ?? undefined,
        potential_value: lead.potential_value || undefined,
        notes: lead.notes || '',
        series_code: lead.series_code ?? undefined,
        series: lead.series ?? undefined,
        next_follow_up_at: lead.next_follow_up_at ?? undefined,
        follow_up_reminder_type: lead.follow_up_reminder_type ?? undefined,
        assigned_to_employee_id: lead.assigned_to_employee_id || undefined,
        expected_closing_date: lead.expected_closing_date || '',
      });
      
      setCustomers(customersData);
      if (lead.contact_id) setLeadSourceType('contact');
      else if (lead.customer_id) setLeadSourceType('customer');
      else setLeadSourceType('none');
      
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
    
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.domain_id) {
      showToast('First name, last name, email, and domain are required', 'error');
      return;
    }

    const payload = { ...formData };
    if (leadSourceType === 'contact') {
      (payload as any).customer_id = undefined;
      (payload as any).plant_id = undefined;
    } else if (leadSourceType === 'customer') {
      (payload as any).contact_id = undefined;
      if (!payload.plant_id) (payload as any).plant_id = undefined;
    } else {
      (payload as any).contact_id = undefined;
      (payload as any).customer_id = undefined;
      (payload as any).plant_id = undefined;
    }
    // Omit expected_closing_date when empty so backend receives optional field
    if (!(payload as any).expected_closing_date) {
      (payload as any).expected_closing_date = undefined;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && id) {
        await marketingAPI.updateLead(parseInt(id), payload);
        showToast('Lead updated successfully', 'success');
        // Stay on the same page when updating
      } else {
        await marketingAPI.createLead(payload as any);
        showToast('Lead created successfully', 'success');
        navigate('/leads');
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} lead`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Leads', href: '/leads' },
    { label: isEdit ? 'Edit Lead' : 'Create Lead' },
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
      title={isEdit ? 'Edit Lead' : 'Create Lead'} 
      breadcrumbs={breadcrumbs}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/leads')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Back
        </Button>
      }
    >
      {isEdit && (
        <div className="flex rounded-full border border-slate-200 p-0.5 bg-slate-100/50 mb-4 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileText size={16} /> Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <History size={16} /> Inquiry logs
          </button>
        </div>
      )}

      {(!isEdit || activeTab === 'details') && (
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to Contact or Customer — at top */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">Link to Contact or Customer</h3>
            <p className="text-xs text-slate-500">A lead can be created from an existing contact or from a customer (optionally at a specific plant).</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="leadSource"
                  checked={leadSourceType === 'none'}
                  onChange={() => {
                    setLeadSourceType('none');
                    setFormData(prev => ({ ...prev, contact_id: undefined, customer_id: undefined, plant_id: undefined }));
                    setPlants([]);
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">None (standalone)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="leadSource"
                  checked={leadSourceType === 'contact'}
                  onChange={() => {
                    setLeadSourceType('contact');
                    setFormData(prev => ({ ...prev, customer_id: undefined, plant_id: undefined }));
                    setPlants([]);
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 flex items-center gap-1"><User size={14} /> From Contact</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="leadSource"
                  checked={leadSourceType === 'customer'}
                  onChange={() => {
                    setLeadSourceType('customer');
                    setFormData(prev => ({ ...prev, contact_id: undefined }));
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 flex items-center gap-1"><Building2 size={14} /> From Customer</span>
              </label>
            </div>
            {leadSourceType === 'contact' && (
              <div>
                <AsyncSelect
                  label="Select Contact"
                  loadOptions={async (search) => {
                    const res = await marketingAPI.getContacts({
                      page: 1,
                      page_size: 50,
                      is_converted: false,
                      search: search || undefined,
                    });
                    const list = res.items;
                    return list.map(c => ({
                      value: c.id,
                      label: `${c.contact_person_name || c.company_name || 'Contact'}${c.contact_email ? ` (${c.contact_email})` : ''}`,
                    }));
                  }}
                  value={formData.contact_id}
                  onChange={async (val) => {
                    const contactId = val ? Number(val) : undefined;
                    setFormData(prev => ({ ...prev, contact_id: contactId }));
                    if (!contactId) return;
                    try {
                      const contact = await marketingAPI.getContact(contactId);
                      const name = contact.contact_person_name || '';
                      const parts = name.trim().split(/\s+/);
                      const first = parts[0] || '';
                      const last = parts.slice(1).join(' ') || '';
                      setFormData(prev => ({
                        ...prev,
                        contact_id: contactId,
                        first_name: prev.first_name || first,
                        last_name: prev.last_name || last,
                        email: prev.email || contact.contact_email || '',
                        phone: prev.phone || contact.contact_phone || '',
                        company: prev.company || contact.company_name || '',
                        job_title: prev.job_title || contact.contact_job_title || '',
                        domain_id: contact.domain_id ?? prev.domain_id,
                        region_id: contact.region_id ?? prev.region_id,
                      }));
                      if (contact.domain_id) await loadRegions(contact.domain_id);
                    } catch (err: any) {
                      showToast(err.message || 'Failed to load contact', 'error');
                    }
                  }}
                  placeholder="Search and select contact..."
                  initialOptions={[]}
                />
              </div>
            )}
            {leadSourceType === 'customer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AsyncSelect
                  label="Select Customer"
                  loadOptions={async (search) => {
                    if (!search && customers.length > 0) {
                      return customers.slice(0, 10).map(c => ({ value: c.id, label: c.company_name }));
                    }
                    const filtered = search
                      ? customers.filter(c => c.company_name?.toLowerCase().includes(search.toLowerCase()))
                      : customers;
                    return filtered.slice(0, 10).map(c => ({ value: c.id, label: c.company_name }));
                  }}
                  value={formData.customer_id}
                  onChange={async (val) => {
                    const customerId = val ? Number(val) : undefined;
                    setFormData(prev => ({ ...prev, customer_id: customerId, plant_id: undefined }));
                    if (!customerId) return;
                    try {
                      const customer = await marketingAPI.getCustomer(customerId);
                      const name = customer.primary_contact_name || '';
                      const parts = name.trim().split(/\s+/);
                      const first = parts[0] || '';
                      const last = parts.slice(1).join(' ') || '';
                      setFormData(prev => ({
                        ...prev,
                        customer_id: customerId,
                        company: prev.company || customer.company_name || '',
                        first_name: prev.first_name || first,
                        last_name: prev.last_name || last,
                        email: prev.email || customer.primary_contact_email || '',
                        phone: prev.phone || customer.primary_contact_phone || '',
                        job_title: prev.job_title || customer.primary_contact_job_title || '',
                        domain_id: customer.domain_id ?? prev.domain_id,
                        region_id: customer.region_id ?? prev.region_id,
                      }));
                      if (customer.domain_id) await loadRegions(customer.domain_id);
                    } catch (err: any) {
                      showToast(err.message || 'Failed to load customer', 'error');
                    }
                  }}
                  placeholder="Select Customer"
                  initialOptions={customers.slice(0, 10).map(c => ({ value: c.id, label: c.company_name }))}
                />
                <Select
                  label="Plant (optional)"
                  options={[
                    { value: '', label: '— No specific plant —' },
                    ...plants.map(p => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` })),
                  ]}
                  value={formData.plant_id ? String(formData.plant_id) : ''}
                  onChange={(val) => setFormData({ ...formData, plant_id: val ? Number(val) : undefined })}
                  placeholder="Select plant"
                  disabled={!formData.customer_id}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="First name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Last name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <Input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
              <Input
                type="text"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
              <Input
                type="text"
                value={formData.job_title || ''}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="Job title"
              />
            </div>

            {/* Domain & Region — collapsed by default on create, auto-filled from user assignment */}
            <div className="md:col-span-2 space-y-2">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDomainRegionCollapsed(!domainRegionCollapsed)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Globe size={16} className="text-slate-500" />
                    Domain & Region
                    {formData.domain_id && (
                      <span className="text-slate-500 font-normal">
                        — {domains.find(d => d.id === formData.domain_id)?.name ?? 'Domain'}
                        {formData.region_id && regions.find(r => r.id === formData.region_id)
                          ? ` · ${regions.find(r => r.id === formData.region_id)?.name}`
                          : ''}
                      </span>
                    )}
                  </span>
                  {domainRegionCollapsed ? (
                    <ChevronRight size={18} className="text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-500 shrink-0" />
                  )}
                </button>
                {!domainRegionCollapsed && (
                  <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 bg-white">
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
                    />
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
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Select
                label="Status"
                options={leadStatuses.filter((s) => s.is_active).map((s) => ({ value: String(s.id), label: s.label }))}
                value={formData.status_id ? String(formData.status_id) : (leadStatuses[0] ? String(leadStatuses[0].id) : '')}
                onChange={(val) => setFormData({ ...formData, status_id: val ? Number(val) : undefined })}
                placeholder="Select Status"
                searchable
              />
            </div>

            <div>
              <Select
                label="Lead for (optional)"
                options={[
                  { value: '', label: '— None —' },
                  ...leadTypes.filter((t) => t.is_active).map((t) => ({ value: String(t.id), label: t.label })),
                ]}
                value={formData.lead_type_id != null ? String(formData.lead_type_id) : ''}
                onChange={(val) => setFormData({ ...formData, lead_type_id: val ? Number(val) : undefined })}
                placeholder="e.g. Standard Walk-in, Chamber, Project"
              />
            </div>

            <div>
              <Select
                label="Lead through (optional)"
                options={[
                  { value: '', label: '— None —' },
                  ...leadThroughOptions.filter((t) => t.is_active).map((t) => ({ value: String(t.id), label: t.label })),
                ]}
                value={formData.lead_through_id != null ? String(formData.lead_through_id) : ''}
                onChange={(val) => setFormData({ ...formData, lead_through_id: val ? Number(val) : undefined })}
                placeholder="e.g. Enq.Through, Regional Head, Website"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Potential Value</label>
              <Input
                type="number"
                value={formData.potential_value || ''}
                onChange={(e) => setFormData({ ...formData, potential_value: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Source</label>
              <Input
                type="text"
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Lead source"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Expected Closing Date</label>
              <Input
                type="date"
                value={formData.expected_closing_date || ''}
                onChange={(e) => setFormData({ ...formData, expected_closing_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          {/* Lead number (manual) and/or numbering series (auto) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex flex-col gap-2">
                <label className="block text-sm font-medium text-slate-700">Lead number</label>
                <Input
                  type="text"
                  value={formData.series ?? ''}
                  onChange={(e) => setFormData({ ...formData, series: e.target.value || undefined })}
                  placeholder="e.g. LEAD-001 or your reference"
                />
                <p className="text-xs text-slate-500">Enter a number or reference for this lead. Optional.</p>
              </div>
              <div className="min-w-[200px] flex flex-col gap-2">
                <label className="block text-sm font-medium text-slate-700">Auto number from series</label>
                <Select
                  value={formData.series_code ?? ''}
                  onChange={(val) => setFormData({ ...formData, series_code: (val != null && val !== '') ? String(val) : undefined })}
                  options={[
                    { value: '', label: 'None' },
                    ...seriesList.map((s) => ({ value: String(s.code), label: `${s.name} (${s.code})` })),
                  ]}
                  placeholder="None"
                />
                <p className="text-xs text-slate-500">If selected and Lead number is empty, next number is generated on save.</p>
              </div>
            </div>
          </div>

          {isEdit && id && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-700">Schedule follow-up</h4>
              <p className="text-xs text-slate-500 mb-2">Select repeat type, then the date and time when you want the notification. Custom = only on that date (no repeat). Daily/Weekly/Monthly = first notification on that date, then repeats. No reminders for leads in Won or Lost status.</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-0.5 shrink-0">
                  <label className="text-xs font-medium text-slate-500">Repeat type</label>
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm w-[180px]"
                    value={formData.follow_up_reminder_type === undefined || formData.follow_up_reminder_type === null ? '' : formData.follow_up_reminder_type}
                    onChange={(e) => setFormData({ ...formData, follow_up_reminder_type: e.target.value === '' ? undefined : e.target.value })}
                  >
                    <option value="">No reminder</option>
                    <option value="once">Custom (one time only)</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex flex-col gap-0.5 shrink-0 w-[200px]">
                  <label className="text-xs font-medium text-slate-500">Date & time (required)</label>
                  <Input
                    type="datetime-local"
                    value={formData.next_follow_up_at ? (() => { try { const d = new Date(formData.next_follow_up_at!); const pad = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; } catch { return ''; } })() : ''}
                    onChange={(e) => setFormData({ ...formData, next_follow_up_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={followUpSaving}
                  onClick={async () => {
                    if (!id) return;
                    const reminderType = formData.follow_up_reminder_type ?? undefined;
                    const hasDate = !!formData.next_follow_up_at;
                    if (reminderType && !hasDate) {
                      showToast('Please set the date and time when you want the notification.', 'error');
                      return;
                    }
                    setFollowUpSaving(true);
                    try {
                      await marketingAPI.scheduleLeadFollowUp(parseInt(id), {
                        next_follow_up_at: formData.next_follow_up_at || null,
                        follow_up_reminder_type: reminderType || null,
                      });
                      showToast(hasDate ? 'Follow-up schedule saved' : 'Follow-up schedule cleared', 'success');
                    } catch (e: any) {
                      showToast(e?.message || 'Failed to save follow-up', 'error');
                    } finally {
                      setFollowUpSaving(false);
                    }
                  }}
                >
                  {followUpSaving ? 'Saving...' : 'Save follow-up'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/leads')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Card>
      )}

      {isEdit && activeTab === 'history' && (
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Add log</h3>
          <form onSubmit={handleAddActivity} className="space-y-3 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Type"
                value={activityForm.activity_type}
                onChange={(val) => setActivityForm((f) => ({ ...f, activity_type: val as string }))}
                options={ACTIVITY_TYPE_OPTIONS}
              />
              <Input
                label="Title"
                value={activityForm.title}
                onChange={(e) => setActivityForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={
                  activityForm.activity_type === 'lead_status_change'
                    ? 'e.g. Status changed to Qualified'
                    : activityForm.activity_type === 'lead_type_change'
                    ? 'e.g. Lead type changed to Chamber'
                    : 'e.g. Called to discuss requirements'
                }
                required
              />
            </div>
            {activityForm.activity_type === 'lead_status_change' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <Select
                  label="From status"
                  value={activityForm.from_status_id != null ? String(activityForm.from_status_id) : ''}
                  onChange={(val) => setActivityForm((f) => ({ ...f, from_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                  options={[{ value: '', label: '— Select —' }, ...leadStatuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                />
                <Select
                  label="To status"
                  value={activityForm.to_status_id != null ? String(activityForm.to_status_id) : ''}
                  onChange={(val) => setActivityForm((f) => ({ ...f, to_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                  options={[{ value: '', label: '— Select —' }, ...leadStatuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                />
              </div>
            )}
            {activityForm.activity_type === 'contacted_different_person' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <Input
                  label="Contact person name"
                  value={activityForm.contact_person_name}
                  onChange={(e) => setActivityForm((f) => ({ ...f, contact_person_name: e.target.value }))}
                  placeholder="Name"
                />
                <Input
                  label="Contact person email"
                  value={activityForm.contact_person_email}
                  onChange={(e) => setActivityForm((f) => ({ ...f, contact_person_email: e.target.value }))}
                  placeholder="email@example.com"
                />
                <Input
                  label="Contact person phone"
                  value={activityForm.contact_person_phone}
                  onChange={(e) => setActivityForm((f) => ({ ...f, contact_person_phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Quotations (optional)</label>
                <button
                  type="button"
                  onClick={() =>
                    setQuotationEntries((prev) => [...prev, { id: crypto.randomUUID(), number: '', file: null }])
                  }
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={14} /> Add quotation
                </button>
              </div>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                {quotationEntries.map((row) => (
                  <div key={row.id} className="flex flex-wrap items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0">
                      <Upload size={14} />
                      {row.file ? row.file.name : 'Choose file'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setQuotationEntries((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, file: file || null } : r))
                          );
                        }}
                      />
                    </label>
                    <Input
                      placeholder="Quotation no. (e.g. QTN-001)"
                      value={row.number}
                      onChange={(e) =>
                        setQuotationEntries((prev) =>
                          prev.map((r) => (r.id === row.id ? { ...r, number: e.target.value } : r))
                        )
                      }
                      containerClassName="min-w-[140px] max-w-[180px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuotationEntries((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))
                      }
                      className="p-1.5 rounded text-slate-400 hover:bg-slate-200 hover:text-rose-600"
                      title="Remove row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">What was discussed / notes</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                value={activityForm.description}
                onChange={(e) => setActivityForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Asked about timeline, budget. They need chamber by Q2."
              />
            </div>
            <Button type="submit" size="sm" disabled={activitySubmitting}>
              {activitySubmitting ? 'Adding...' : 'Add log'}
            </Button>
          </form>
          <h3 className="text-sm font-semibold text-slate-800 mb-2 border-t border-slate-200 pt-3">Inquiry logs</h3>
          {activitiesLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-slate-500">No logs yet. Add one above.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => {
                const displayName = a.created_by_name || a.created_by_username || 'Unknown';
                const tooltipParts = [
                  a.created_by_name && `Name: ${a.created_by_name}`,
                  a.created_by_username && `Username: ${a.created_by_username}`,
                  a.created_by_email && `Email: ${a.created_by_email}`,
                ].filter(Boolean);
                const tooltip = tooltipParts.length > 0 ? tooltipParts.join('\n') : undefined;
                const isEditing = editingActivityId === a.id;
                const canEditDelete = canEditOrDeleteActivity(a);
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
                            <Input
                              label="Contact person name"
                              value={editActivityForm.contact_person_name}
                              onChange={(e) => setEditActivityForm((f) => ({ ...f, contact_person_name: e.target.value }))}
                              placeholder="Name"
                            />
                            <Input
                              label="Contact person email"
                              value={editActivityForm.contact_person_email}
                              onChange={(e) => setEditActivityForm((f) => ({ ...f, contact_person_email: e.target.value }))}
                              placeholder="email@example.com"
                            />
                            <Input
                              label="Contact person phone"
                              value={editActivityForm.contact_person_phone}
                              onChange={(e) => setEditActivityForm((f) => ({ ...f, contact_person_phone: e.target.value }))}
                              placeholder="Phone"
                            />
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
                        {(a.attachments?.length ?? 0) > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                              <Paperclip size={12} /> Quotations
                            </span>
                            <ul className="mt-1 space-y-1">
                              {a.attachments!.map((att) => (
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
                                    <Download size={12} /> {att.file_name}
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
                                          showToast('Attachment removed', 'success');
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
                        {canEditDelete && (
                          <div className="mt-2">
                            {addQuotationActivityId !== a.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddQuotationActivityId(a.id);
                                  setAddQuotationRows([{ id: crypto.randomUUID(), number: '', file: null }]);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600"
                              >
                                <Plus size={12} /> Add quotation
                              </button>
                            ) : (
                              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-700">New quotation(s)</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddQuotationActivityId(null);
                                      setAddQuotationRows([]);
                                    }}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {addQuotationRows.map((row) => (
                                  <div key={row.id} className="flex flex-wrap items-center gap-2">
                                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 shrink-0">
                                      <Upload size={12} />
                                      {row.file ? row.file.name : 'Choose file'}
                                      <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          setAddQuotationRows((prev) =>
                                            prev.map((r) => (r.id === row.id ? { ...r, file: file || null } : r))
                                          );
                                        }}
                                      />
                                    </label>
                                    <Input
                                      placeholder="Quotation no. (e.g. QTN-001)"
                                      value={row.number}
                                      onChange={(e) =>
                                        setAddQuotationRows((prev) =>
                                          prev.map((r) => (r.id === row.id ? { ...r, number: e.target.value } : r))
                                        )
                                      }
                                      containerClassName="min-w-[120px] max-w-[160px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAddQuotationRows((prev) =>
                                          prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev
                                        )
                                      }
                                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAddQuotationRows((prev) => [
                                        ...prev,
                                        { id: crypto.randomUUID(), number: '', file: null },
                                      ])
                                    }
                                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                                  >
                                    <Plus size={12} /> Add another
                                  </button>
                                  <Button
                                    size="sm"
                                    disabled={
                                      uploadingAttachmentsForActivityId === a.id ||
                                      addQuotationRows.every((r) => !r.file || !r.number.trim())
                                    }
                                    onClick={async () => {
                                      const toUpload = addQuotationRows.filter((r) => r.file && r.number.trim());
                                      if (!id || toUpload.length === 0) return;
                                      setUploadingAttachmentsForActivityId(a.id);
                                      try {
                                        await marketingAPI.uploadLeadActivityAttachments(
                                          parseInt(id),
                                          a.id,
                                          toUpload.map((r) => r.file!),
                                          toUpload.map((r) => r.number.trim())
                                        );
                                        showToast('Quotation(s) added', 'success');
                                        setAddQuotationActivityId(null);
                                        setAddQuotationRows([]);
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
