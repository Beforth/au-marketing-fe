/**
 * Marketing API Service
 */
import { apiClient } from './api';

// HRMS Employee (from HRMS via marketing-api proxy)
export interface HRMSEmployee {
  id: number;
  user_id: number | null;
  username: string | null;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string | null;
  department: string | null;
  designation: string | null;
  is_active: boolean;
}

// Domain Types
export interface Domain {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  head_employee_id?: number;
  head_username?: string;
  head_email?: string;
  created_by_employee_id?: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

// Region Types
export interface Region {
  id: number;
  domain_id: number;
  name: string;
  code: string;
  description?: string;
  head_employee_id?: number;
  head_username?: string;
  is_active: boolean;
  created_by_employee_id?: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
  domain?: Domain;
}

/** Assignment with employee name/email from HRMS (from GET /api/regions/assignments/). */
export interface AssignmentWithEmployee {
  id: number;
  employee_id: number;
  region_id: number;
  role: string;
  is_active: boolean;
  region?: Region;
  employee_name?: string;
  employee_email?: string;
}

// Contact Types — company data from organization_id only (no company_name/website/industry on contact)
export interface Contact {
  id: number;
  title?: string;  // Salutation: Mr., Mrs., Dr., etc.
  first_name?: string;
  last_name?: string;
  contact_person_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_job_title?: string;
  domain_id: number;
  region_id?: number;
  organization_id?: number | null;  // Optional – link contact to an organization
  plant_id?: number | null;         // Optional – link to organization's plant
  is_active: boolean;
  is_converted: boolean;
  converted_to_customer_id?: number;
  series_code?: string;  // Code of numbering series (character, not FK)
  series?: string;  // Generated number from numbering series (e.g. CONT-0001)
  notes?: string;
  source?: string;
  created_by_employee_id: number;
  created_by_username?: string;
  assigned_to_employee_id?: number;
  assigned_to_username?: string;
  created_at: string;
  updated_at: string;
  domain?: Domain;
  region?: Region;
  organization?: Organization | null;  // Populated when API includes it
}

// Customer Types (primary contact via primary_contact_contact_id / primary_contact_contact)
export interface Customer {
  id: number;
  company_name: string;
  /** website, industry, company_size removed; use organization when organization_id set */
  tax_id?: string;
  domain_id: number;
  region_id?: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_active: boolean;
  customer_since?: string;
  converted_from_contact_id?: number;
  organization_id?: number | null;
  plant_id?: number | null;
  primary_contact_contact_id?: number | null;
  series_code?: string;
  series?: string;
  notes?: string;
  created_by_employee_id: number;
  created_by_username?: string;
  account_manager_employee_id?: number;
  account_manager_username?: string;
  created_at: string;
  updated_at: string;
  domain?: Domain;
  region?: Region;
  organization?: Organization | null;  // Populated when API includes it (for industry/website etc.)
  plants?: Plant[];
  primary_contact_contact?: Contact | null;  // Person data for display
}

// Plant Types
// Organization (has plants; customers link to organization + plant)
export interface Organization {
  id: number;
  name: string;
  code?: string;
  description?: string;
  website?: string;
  industry?: string;
  organization_size?: string;  // e.g. "1-10", "51-200"
  is_active: boolean;
  created_by_employee_id?: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: number;
  organization_id?: number;
  contact_id?: number;
  customer_id?: number;
  plant_name: string;
  plant_code?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_active: boolean;
  notes?: string;
  created_by_employee_id?: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

/** Lead status group (e.g. Initialization, Follow, Quotation/Technical) with expected duration and optional follow-up interval */
export interface LeadStatusGroup {
  id: number;
  code: string;
  label: string;
  expected_duration_days?: number | null;  // e.g. 15, 90 (3 months)
  follow_up_interval_days?: number | null;  // create follow-up task every N days for leads in this group
  display_order: number;
  is_active: boolean;
  hex_color?: string | null;  // e.g. "#3b82f6" for badge/UI color
  created_at: string;
  updated_at: string;
}

// Lead status (from DB) – belongs to a LeadStatusGroup
export interface LeadStatusOption {
  id: number;
  code: string;
  label: string;
  group_id?: number | null;
  group?: LeadStatusGroup | null;  // Populated when API includes it
  stage?: string | null;  // Deprecated; use group_id / group
  display_order: number;
  is_active: boolean;
  is_final?: boolean;  // Won/closed – no follow-up reminders
  is_lost?: boolean;   // Lost – no follow-up reminders
  is_hot?: boolean;    // Mark leads in this status as hot cases
  hex_color?: string | null;  // e.g. "#3b82f6" for badge/UI color
  set_when_quotation_added?: boolean;  // Auto-set lead to this status when a quotation is added to any enquiry
  set_when_quote_number_generated?: boolean;  // Auto-set when quote number generated (Generate button) but no quotation file yet
  attachment_required_on_kanban_change?: boolean;  // Require attachment when changing to this status from kanban
  created_at: string;
  updated_at: string;
}

/** "Lead for" option (e.g. Standard Walk-in, Chamber, Project) */
export interface LeadTypeOption {
  id: number;
  code: string;
  label: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Lead through / source channel (e.g. Enq.Through, Regional Head, Website) */
export interface LeadThroughOption {
  id: number;
  code: string;
  label: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Lead Types (person/company from contact or customer; no duplicate fields)
export interface Lead {
  id: number;
  domain_id: number;
  region_id?: number;
  contact_id?: number;
  customer_id?: number;
  plant_id?: number;
  status_id?: number;
  status?: string;
  lead_type_id?: number;
  lead_through_id?: number;
  through_contact_id?: number | null;
  referred_by_customer_id?: number | null;
  potential_value?: number;
  notes?: string;
  closed_value?: number | null;
  closed_at?: string | null;
  series_code?: string;
  series?: string;
  quote_series_code?: string | null;
  quote_number?: string | null;
  next_follow_up_at?: string | null;
  follow_up_reminder_type?: string | null;
  assigned_to_employee_id?: number;
  assigned_to_username?: string;
  referred_by_employee_id?: number | null;
  created_by_employee_id: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
  expected_closing_date?: string;
  domain?: Domain;
  region?: Region;
  contact?: Contact | null;   // Person/company for display
  customer?: Customer;
  through_contact?: Contact | null;  // Person who referred: contact
  referred_by_customer?: Customer | null;  // Person who referred: customer
  plant?: Plant;
  status_option?: LeadStatusOption;
  lead_type_option?: LeadTypeOption;
  lead_through_option?: LeadThroughOption;
  last_activity_date?: string | null;
  /** When lead is in Lost status: reason from "Marked as Lost" activity (e.g. in Orders Lost tab). */
  lost_reason?: string | null;
}

/** Activity attachment: either a quotation (trackable) or a general attachment */
export interface LeadActivityAttachment {
  id: number;
  activity_id: number;
  file_name: string;
  file_path: string;
  is_quotation?: boolean;
  quotation_number?: string | null;
  title?: string | null;
  file_size?: number;
  content_type?: string;
  created_at: string;
}

/** Activity log entry for lead history */
export interface LeadActivity {
  id: number;
  activity_type: string;
  title: string;
  description?: string;
  activity_date: string;
  lead_id?: number;
  contact_person_title?: string;  // Salutation: Mr., Mrs., Dr., etc.
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  from_status_id?: number;
  to_status_id?: number;
  from_status_name?: string;
  to_status_name?: string;
  inquiry_number?: number | null;
  attachments?: LeadActivityAttachment[];
  created_by_employee_id?: number;
  created_by_username?: string;
  created_by_name?: string;
  created_by_email?: string;
  created_at: string;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
  created_by_employee_id?: number;
  created_by_username?: string;
  manager_employee_id?: number;
  manager_username?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadRequest {
  contact_id?: number;  // Required: person/company from Contact or Customer
  customer_id?: number;
  plant_id?: number;
  domain_id: number;
  region_id?: number;
  status_id?: number;
  lead_type_id?: number;
  lead_through_id?: number;
  through_contact_id?: number | null;  // Person who referred: contact
  referred_by_customer_id?: number | null;  // Person who referred: customer
  potential_value?: number;
  notes?: string;
  series_code?: string;
  quote_series_code?: string;
  quote_number?: string;
  assigned_to_employee_id?: number;
  referred_by_employee_id?: number | null;  // Person who referred: employee
  expected_closing_date?: string;
  series?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  closed_value?: number;
  series?: string;
  /** Required (min 100 chars) when moving lead to Lost status. Stored in enquiry log. */
  status_change_reason?: string;
  /** Competitor name (lost to whom); use "Not sure" if unknown. */
  lost_to_competitor?: string;
  /** Price at which lost; use "Not sure" if unknown. */
  lost_at_price?: string;
}

/** Lead display name from contact or customer (person/company data lives there). */
export function leadDisplayName(lead: Lead): string {
  if (lead.contact) {
    const c = lead.contact;
    const name = c.contact_person_name?.trim()
      || [c.first_name, c.last_name].filter(Boolean).join(' ').trim()
      || c.contact_email?.trim();
    if (name) return name;
  }
  if (lead.customer) return lead.customer.company_name || `Customer #${lead.customer_id}`;
  return `Lead #${lead.id}`;
}

/** Lead company name from contact's organization or customer. */
export function leadDisplayCompany(lead: Lead): string {
  if (lead.contact?.organization?.name) return lead.contact.organization.name;
  if (lead.customer?.company_name) return lead.customer.company_name;
  return '';
}

/** Contact company name from linked organization (for display). */
export function contactCompanyName(contact: Contact): string {
  return contact.organization?.name ?? '';
}

/** Lead email from contact or customer primary contact. */
export function leadDisplayEmail(lead: Lead): string {
  if (lead.contact?.contact_email) return lead.contact.contact_email;
  if (lead.customer?.primary_contact_contact?.contact_email) return lead.customer.primary_contact_contact.contact_email;
  return '';
}

/** Primary contact display name for Customer (from linked Contact). */
export function customerPrimaryContactName(customer: Customer): string {
  const c = customer.primary_contact_contact;
  if (!c) return '';
  return c.contact_person_name?.trim()
    || [c.first_name, c.last_name].filter(Boolean).join(' ').trim()
    || c.contact_email?.trim()
    || '';
}

// Order types (orders from won leads; status groups, statuses, inquiry log)
export interface OrderStatusGroup {
  id: number;
  code: string;
  label: string;
  expected_duration_days?: number | null;
  display_order: number;
  is_active: boolean;
  hex_color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusOption {
  id: number;
  code: string;
  label: string;
  group_id?: number | null;
  display_order: number;
  is_active: boolean;
  is_final: boolean;
  attachment_required_on_kanban_change?: boolean;
  hex_color?: string | null;
  group?: OrderStatusGroup | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  lead_id: number;
  status_id?: number | null;
  domain_id: number;
  region_id?: number | null;
  order_value?: number | null;
  expected_delivery_at?: string | null;
  notes?: string | null;
  series_code?: string | null;
  series?: string | null;
  assigned_to_employee_id?: number | null;
  assigned_to_username?: string | null;
  created_by_employee_id: number;
  created_by_username?: string | null;
  created_at: string;
  updated_at: string;
  domain?: Domain | null;
  region?: Region | null;
  status_option?: OrderStatusOption | null;
  status?: string | null;
  lead?: Lead | null;
  last_activity_date?: string | null;
}

export interface OrderActivityAttachment {
  id: number;
  order_activity_id: number;
  file_name: string;
  file_path: string;
  is_quotation?: boolean;
  quotation_number?: string | null;
  title?: string | null;
  file_size?: number | null;
  content_type?: string | null;
  created_at: string;
}

export interface OrderActivity {
  id: number;
  order_id: number;
  activity_type: string;
  title: string;
  description?: string | null;
  activity_date: string;
  contact_person_title?: string | null;
  contact_person_name?: string | null;
  contact_person_email?: string | null;
  contact_person_phone?: string | null;
  from_status_id?: number | null;
  to_status_id?: number | null;
  from_status_name?: string | null;
  to_status_name?: string | null;
  inquiry_number?: number | null;
  attachments?: OrderActivityAttachment[];
  created_by_employee_id?: number | null;
  created_by_username?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at: string;
}

export interface CreateOrderRequest {
  lead_id: number;
  status_id?: number | null;
  domain_id: number;
  region_id?: number | null;
  order_value?: number | null;
  expected_delivery_at?: string | null;
  notes?: string | null;
  series_code?: string | null;
  assigned_to_employee_id?: number | null;
}

export interface UpdateOrderRequest {
  status_id?: number | null;
  region_id?: number | null;
  order_value?: number | null;
  expected_delivery_at?: string | null;
  notes?: string | null;
  assigned_to_employee_id?: number | null;
  status_change_reason?: string;
}

/** Paginated list response (page 1-based, page_size min 10). */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

class MarketingAPIService {
  // Leads
  async getLeads(params?: {
    page?: number;
    page_size?: number;
    no_limit?: boolean;
    status_id?: number;
    /** Filter by assigned-to employee ID(s); multiple allowed */
    assigned_to?: number[];
    /** Only leads created by the current user (generated by me) */
    created_by_me?: boolean;
    /** Include leads in Won or Lost status; when false (default), backend excludes them */
    include_won_lost?: boolean;
    /** Only return leads in Lost status (for Orders Lost tab) */
    lost_only?: boolean;
    domain_id?: number;
    region_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Lead>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.no_limit === true) queryParams.append('no_limit', 'true');
    if (params?.status_id != null) queryParams.append('status_id', params.status_id.toString());
    if (params?.assigned_to?.length) params.assigned_to.forEach((id) => queryParams.append('assigned_to', String(id)));
    if (params?.created_by_me === true) queryParams.append('created_by_me', 'true');
    if (params?.include_won_lost === true) queryParams.append('include_won_lost', 'true');
    if (params?.lost_only === true) queryParams.append('lost_only', 'true');
    if (params?.domain_id != null) queryParams.append('domain_id', params.domain_id.toString());
    if (params?.region_id != null) queryParams.append('region_id', params.region_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.order_by) queryParams.append('order_by', params.order_by);
    if (params?.order_dir) queryParams.append('order_dir', params.order_dir);
    return apiClient.get<PaginatedResponse<Lead>>(`/api/leads/?${queryParams.toString()}`);
  }

  async getLead(id: number): Promise<Lead> {
    return apiClient.get<Lead>(`/api/leads/${id}`);
  }

  /** Lead statuses from DB (for filters, kanban, forms, and CRUD) */
  async getLeadStatuses(params?: { is_active?: boolean }): Promise<LeadStatusOption[]> {
    const q = new URLSearchParams();
    if (params?.is_active !== undefined) q.append('is_active', String(params.is_active));
    const query = q.toString();
    return apiClient.get<LeadStatusOption[]>(query ? `/api/leads/statuses/?${query}` : '/api/leads/statuses/');
  }

  async createLeadStatus(data: { code: string; label: string; group_id?: number; stage?: string; display_order?: number; is_active?: boolean; is_final?: boolean; is_lost?: boolean; hex_color?: string; set_when_quotation_added?: boolean; set_when_quote_number_generated?: boolean; attachment_required_on_kanban_change?: boolean; is_hot?: boolean }): Promise<LeadStatusOption> {
    return apiClient.post<LeadStatusOption>('/api/leads/statuses/', data);
  }

  async updateLeadStatus(id: number, data: Partial<{ code: string; label: string; group_id?: number; stage?: string; display_order: number; is_active: boolean; is_final: boolean; is_lost: boolean; hex_color?: string; set_when_quotation_added: boolean; set_when_quote_number_generated: boolean; attachment_required_on_kanban_change: boolean; is_hot: boolean }>): Promise<LeadStatusOption> {
    return apiClient.put<LeadStatusOption>(`/api/leads/statuses/${id}`, data);
  }

  async deleteLeadStatus(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/statuses/${id}`);
  }

  /** Lead status groups (each group has expected duration in days; statuses belong to a group) */
  async getLeadStatusGroups(params?: { is_active?: boolean }): Promise<LeadStatusGroup[]> {
    const q = new URLSearchParams();
    if (params?.is_active !== undefined) q.append('is_active', String(params.is_active));
    const query = q.toString();
    return apiClient.get<LeadStatusGroup[]>(query ? `/api/leads/status-groups/?${query}` : '/api/leads/status-groups/');
  }

  async createLeadStatusGroup(data: { code: string; label: string; expected_duration_days?: number; follow_up_interval_days?: number; display_order?: number; is_active?: boolean; hex_color?: string }): Promise<LeadStatusGroup> {
    return apiClient.post<LeadStatusGroup>('/api/leads/status-groups/', data);
  }

  async updateLeadStatusGroup(id: number, data: Partial<{ code: string; label: string; expected_duration_days: number; follow_up_interval_days: number; display_order: number; is_active: boolean; hex_color?: string }>): Promise<LeadStatusGroup> {
    return apiClient.put<LeadStatusGroup>(`/api/leads/status-groups/${id}`, data);
  }

  async deleteLeadStatusGroup(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/status-groups/${id}`);
  }

  /** Lead types ("Lead for": Standard Walk-in, Chamber, Project, etc.) */
  async getLeadTypes(params?: { is_active?: boolean }): Promise<LeadTypeOption[]> {
    const q = new URLSearchParams();
    if (params?.is_active !== undefined) q.append('is_active', String(params.is_active));
    const query = q.toString();
    return apiClient.get<LeadTypeOption[]>(query ? `/api/leads/types/?${query}` : '/api/leads/types/');
  }

  async createLeadType(data: { code: string; label: string; display_order?: number; is_active?: boolean }): Promise<LeadTypeOption> {
    return apiClient.post<LeadTypeOption>('/api/leads/types/', data);
  }

  async updateLeadType(id: number, data: Partial<{ code: string; label: string; display_order: number; is_active: boolean }>): Promise<LeadTypeOption> {
    return apiClient.put<LeadTypeOption>(`/api/leads/types/${id}`, data);
  }

  async deleteLeadType(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/types/${id}`);
  }

  /** Lead through options (source/channel: Enq.Through, Regional Head, Website, etc.) */
  async getLeadThroughOptions(params?: { is_active?: boolean }): Promise<LeadThroughOption[]> {
    const q = new URLSearchParams();
    if (params?.is_active !== undefined) q.append('is_active', String(params.is_active));
    const query = q.toString();
    return apiClient.get<LeadThroughOption[]>(query ? `/api/leads/through/?${query}` : '/api/leads/through/');
  }

  /** Lead activity / history logs */
  async getLeadActivities(leadId: number): Promise<LeadActivity[]> {
    return apiClient.get<LeadActivity[]>(`/api/leads/${leadId}/activities/`);
  }

  async createLeadActivity(
    leadId: number,
    data: {
      activity_type: string;
      title: string;
      description?: string;
      activity_date?: string;
      from_status_id?: number;
      to_status_id?: number;
      contact_person_title?: string;
      contact_person_name?: string;
      contact_person_email?: string;
      contact_person_phone?: string;
    }
  ): Promise<LeadActivity> {
    return apiClient.post<LeadActivity>(`/api/leads/${leadId}/activities/`, data);
  }

  /** Upload files as quotations or attachments. If seriesCode is set, first quotation gets number from series (with lead context), rest get base(rev2), base(rev3). */
  async uploadLeadActivityAttachments(
    leadId: number,
    activityId: number,
    files: File[],
    attachmentTypes: ('quotation' | 'attachment')[],
    quotationNumbers?: (string | undefined)[],
    titles?: (string | undefined)[],
    seriesCode?: string,
    isRevised?: boolean
  ): Promise<LeadActivityAttachment[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('attachment_types', JSON.stringify(attachmentTypes));
    if (quotationNumbers && quotationNumbers.length > 0) {
      formData.append('quotation_numbers', JSON.stringify(quotationNumbers));
    }
    if (titles && titles.length > 0) {
      formData.append('titles', JSON.stringify(titles));
    }
    if (seriesCode && seriesCode.trim()) {
      formData.append('series_code', seriesCode.trim());
    }
    if (isRevised) {
      formData.append('is_revised', 'true');
    }
    return apiClient.postFormData<LeadActivityAttachment[]>(
      `/api/leads/${leadId}/activities/${activityId}/attachments`,
      formData
    );
  }

  /** Download an activity attachment file (uses auth; triggers browser save). */
  async downloadLeadActivityAttachment(
    leadId: number,
    activityId: number,
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const blob = await apiClient.getBlob(
      `/api/leads/${leadId}/activities/${activityId}/attachments/${attachmentId}/download`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'attachment';
    a.click();
    URL.revokeObjectURL(url);
  }

  async deleteLeadActivityAttachment(leadId: number, activityId: number, attachmentId: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/${leadId}/activities/${activityId}/attachments/${attachmentId}`);
  }

  async updateLeadActivity(
    leadId: number,
    activityId: number,
    data: {
      activity_type?: string;
      title?: string;
      description?: string;
      activity_date?: string;
      contact_person_title?: string;
      contact_person_name?: string;
      contact_person_email?: string;
      contact_person_phone?: string;
      from_status_id?: number;
      to_status_id?: number;
    }
  ): Promise<LeadActivity> {
    return apiClient.put<LeadActivity>(`/api/leads/${leadId}/activities/${activityId}`, data);
  }

  async deleteLeadActivity(leadId: number, activityId: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/${leadId}/activities/${activityId}`);
  }

  async createLead(data: CreateLeadRequest): Promise<Lead> {
    return apiClient.post<Lead>('/api/leads/', data);
  }

  async updateLead(id: number, data: UpdateLeadRequest): Promise<Lead> {
    return apiClient.put<Lead>(`/api/leads/${id}`, data);
  }

  /** Update lead number series and assign next value (requires marketing.admin). */
  async updateLeadSeries(leadId: number, data: { series_code: string }): Promise<Lead> {
    return apiClient.patch<Lead>(`/api/leads/${leadId}/series`, data);
  }

  async deleteLead(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/${id}`);
  }

  // Orders (from won leads; status groups, statuses, inquiry log like leads)
  async getOrders(params?: {
    page?: number;
    page_size?: number;
    status_id?: number;
    assigned_to?: number;
    lead_id?: number;
  }): Promise<PaginatedResponse<Order>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.status_id != null) queryParams.append('status_id', params.status_id.toString());
    if (params?.assigned_to != null) queryParams.append('assigned_to', params.assigned_to.toString());
    if (params?.lead_id != null) queryParams.append('lead_id', params.lead_id.toString());
    return apiClient.get<PaginatedResponse<Order>>(`/api/orders/?${queryParams.toString()}`);
  }

  async getOrder(id: number): Promise<Order> {
    return apiClient.get<Order>(`/api/orders/${id}`);
  }

  async getOrderStatusGroups(params?: { is_active?: boolean }): Promise<OrderStatusGroup[]> {
    const q = new URLSearchParams();
    if (params?.is_active !== undefined) q.append('is_active', String(params.is_active));
    const query = q.toString();
    return apiClient.get<OrderStatusGroup[]>(query ? `/api/orders/status-groups/?${query}` : '/api/orders/status-groups/');
  }

  async createOrderStatusGroup(data: { code: string; label: string; expected_duration_days?: number; display_order?: number; is_active?: boolean; hex_color?: string }): Promise<OrderStatusGroup> {
    return apiClient.post<OrderStatusGroup>('/api/orders/status-groups/', data);
  }

  async updateOrderStatusGroup(id: number, data: Partial<{ code: string; label: string; expected_duration_days?: number; display_order?: number; is_active?: boolean; hex_color?: string }>): Promise<OrderStatusGroup> {
    return apiClient.put<OrderStatusGroup>(`/api/orders/status-groups/${id}`, data);
  }

  async deleteOrderStatusGroup(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/orders/status-groups/${id}`);
  }

  async getOrderStatuses(params?: { is_active?: boolean }): Promise<OrderStatusOption[]> {
    const q = new URLSearchParams();
    if (params?.is_active !== undefined) q.append('is_active', String(params.is_active));
    const query = q.toString();
    return apiClient.get<OrderStatusOption[]>(query ? `/api/orders/statuses/?${query}` : '/api/orders/statuses/');
  }

  async createOrderStatus(data: { code: string; label: string; group_id?: number; display_order?: number; is_active?: boolean; is_final?: boolean; hex_color?: string; attachment_required_on_kanban_change?: boolean }): Promise<OrderStatusOption> {
    return apiClient.post<OrderStatusOption>('/api/orders/statuses/', data);
  }

  async updateOrderStatus(id: number, data: Partial<{ code: string; label: string; group_id?: number; display_order?: number; is_active?: boolean; is_final?: boolean; hex_color?: string; attachment_required_on_kanban_change: boolean }>): Promise<OrderStatusOption> {
    return apiClient.put<OrderStatusOption>(`/api/orders/statuses/${id}`, data);
  }

  async deleteOrderStatus(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/orders/statuses/${id}`);
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    return apiClient.post<Order>('/api/orders/', data);
  }

  async updateOrder(id: number, data: UpdateOrderRequest): Promise<Order> {
    return apiClient.put<Order>(`/api/orders/${id}`, data);
  }

  async deleteOrder(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/orders/${id}`);
  }

  async getOrderActivities(orderId: number): Promise<OrderActivity[]> {
    return apiClient.get<OrderActivity[]>(`/api/orders/${orderId}/activities/`);
  }

  async createOrderActivity(
    orderId: number,
    data: {
      activity_type: string;
      title: string;
      description?: string;
      activity_date?: string;
      from_status_id?: number;
      to_status_id?: number;
      contact_person_title?: string;
      contact_person_name?: string;
      contact_person_email?: string;
      contact_person_phone?: string;
    }
  ): Promise<OrderActivity> {
    return apiClient.post<OrderActivity>(`/api/orders/${orderId}/activities/`, data);
  }

  async uploadOrderActivityAttachments(
    orderId: number,
    activityId: number,
    files: File[]
  ): Promise<OrderActivityAttachment[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return apiClient.postFormData<OrderActivityAttachment[]>(
      `/api/orders/${orderId}/activities/${activityId}/attachments`,
      formData
    );
  }

  async updateOrderActivity(
    orderId: number,
    activityId: number,
    data: Partial<{
      activity_type: string;
      title: string;
      description: string;
      activity_date: string;
      contact_person_name: string;
      contact_person_email: string;
      contact_person_phone: string;
      from_status_id: number;
      to_status_id: number;
    }>
  ): Promise<OrderActivity> {
    return apiClient.put<OrderActivity>(`/api/orders/${orderId}/activities/${activityId}`, data);
  }

  async deleteOrderActivity(orderId: number, activityId: number): Promise<void> {
    return apiClient.delete<void>(`/api/orders/${orderId}/activities/${activityId}`);
  }

  /** Download an order activity attachment file (uses auth; triggers browser save). */
  async downloadOrderActivityAttachment(
    orderId: number,
    activityId: number,
    attachmentId: number,
    fileName: string
  ): Promise<void> {
    const blob = await apiClient.getBlob(
      `/api/orders/${orderId}/activities/${activityId}/attachments/${attachmentId}/download`
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'attachment';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Campaigns
  async getCampaigns(params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse<Campaign>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.status) queryParams.append('status', params.status);
    return apiClient.get<PaginatedResponse<Campaign>>(`/api/campaigns/?${queryParams.toString()}`);
  }

  async getCampaign(id: number): Promise<Campaign> {
    return apiClient.get<Campaign>(`/api/campaigns/${id}`);
  }

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    return apiClient.post<Campaign>('/api/campaigns/', data);
  }

  async updateCampaign(id: number, data: Partial<Campaign>): Promise<Campaign> {
    return apiClient.put<Campaign>(`/api/campaigns/${id}`, data);
  }

  async deleteCampaign(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/campaigns/${id}`);
  }

  // Domains
  async getDomains(params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Domain>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    return apiClient.get<PaginatedResponse<Domain>>(`/api/domains/?${queryParams.toString()}`);
  }

  async getDomain(id: number): Promise<Domain> {
    return apiClient.get<Domain>(`/api/domains/${id}`);
  }

  async createDomain(data: Partial<Domain>): Promise<Domain> {
    return apiClient.post<Domain>('/api/domains/', data);
  }

  async updateDomain(id: number, data: Partial<Domain>): Promise<Domain> {
    return apiClient.put<Domain>(`/api/domains/${id}`, data);
  }

  async deleteDomain(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/domains/${id}`);
  }

  // HRMS Employees (proxy from HRMS, paginated, filters)
  async getEmployees(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    department_id?: number;
    designation_id?: number;
    status?: 'all' | 'active' | 'inactive';
  }): Promise<{ employees: HRMSEmployee[]; count: number; page: number; page_size: number; total_pages: number }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.department_id != null) queryParams.append('department_id', params.department_id.toString());
    if (params?.designation_id != null) queryParams.append('designation_id', params.designation_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return apiClient.get(query ? `/api/employees/?${query}` : '/api/employees/');
  }

  async getDepartments(): Promise<{ id: number; name: string }[]> {
    return apiClient.get<{ id: number; name: string }[]>('/api/employees/departments/');
  }

  async getDesignations(): Promise<{ id: number; title: string }[]> {
    return apiClient.get<{ id: number; title: string }[]>('/api/employees/designations/');
  }

  // Regions
  async getRegions(params?: {
    page?: number;
    page_size?: number;
    domain_id?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Region>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.domain_id != null) queryParams.append('domain_id', params.domain_id.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.search) queryParams.append('search', params.search);
    return apiClient.get<PaginatedResponse<Region>>(`/api/regions/?${queryParams.toString()}`);
  }

  async getRegion(id: number): Promise<Region> {
    return apiClient.get<Region>(`/api/regions/${id}`);
  }

  async createRegion(data: Partial<Region>): Promise<Region> {
    return apiClient.post<Region>('/api/regions/', data);
  }

  async updateRegion(id: number, data: Partial<Region>): Promise<Region> {
    return apiClient.put<Region>(`/api/regions/${id}`, data);
  }

  async deleteRegion(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/regions/${id}`);
  }

  // Contacts
  async getContacts(params?: {
    page?: number;
    page_size?: number;
    domain_id?: number;
    region_id?: number;
    is_active?: boolean;
    is_converted?: boolean;
    assigned_to?: number;
    search?: string;
  }): Promise<PaginatedResponse<Contact>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.domain_id != null) queryParams.append('domain_id', params.domain_id.toString());
    if (params?.region_id != null) queryParams.append('region_id', params.region_id.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.is_converted !== undefined) queryParams.append('is_converted', params.is_converted.toString());
    if (params?.assigned_to != null) queryParams.append('assigned_to', params.assigned_to.toString());
    if (params?.search) queryParams.append('search', params.search);
    return apiClient.get<PaginatedResponse<Contact>>(`/api/contacts/?${queryParams.toString()}`);
  }

  async getContact(id: number): Promise<Contact> {
    return apiClient.get<Contact>(`/api/contacts/${id}`);
  }

  /** Search contacts by email, phone, name, or company. For lead form: link lead to existing or create new contact. */
  async searchContacts(q: string, limit?: number): Promise<Contact[]> {
    const params = new URLSearchParams({ q: q.trim() });
    if (limit != null) params.append('limit', String(limit));
    return apiClient.get<Contact[]>(`/api/contacts/search?${params.toString()}`);
  }

  async createContact(data: Partial<Contact>): Promise<Contact> {
    return apiClient.post<Contact>('/api/contacts/', data);
  }

  async updateContact(id: number, data: Partial<Contact>): Promise<Contact> {
    return apiClient.put<Contact>(`/api/contacts/${id}`, data);
  }

  async deleteContact(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/contacts/${id}`);
  }

  async convertContactToCustomer(contactId: number): Promise<{ success: boolean; customer_id: number; contact_id: number }> {
    return apiClient.post<{ success: boolean; customer_id: number; contact_id: number }>(`/api/contacts/${contactId}/convert-to-customer`);
  }

  // Customers
  async getCustomers(params?: {
    page?: number;
    page_size?: number;
    domain_id?: number;
    region_id?: number;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Customer>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.domain_id != null) queryParams.append('domain_id', params.domain_id.toString());
    if (params?.region_id != null) queryParams.append('region_id', params.region_id.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    return apiClient.get<PaginatedResponse<Customer>>(`/api/customers/?${queryParams.toString()}`);
  }

  async getCustomer(id: number): Promise<Customer> {
    return apiClient.get<Customer>(`/api/customers/${id}`);
  }

  /** Search customers by primary contact email, phone, or company name. For lead form. */
  async searchCustomers(q: string, limit?: number): Promise<Customer[]> {
    const params = new URLSearchParams({ q: q.trim() });
    if (limit != null) params.append('limit', String(limit));
    return apiClient.get<Customer[]>(`/api/customers/search?${params.toString()}`);
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return apiClient.post<Customer>('/api/customers/', data);
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    return apiClient.put<Customer>(`/api/customers/${id}`, data);
  }

  async deleteCustomer(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/customers/${id}`);
  }

  // Organizations
  async getOrganizations(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedResponse<Organization>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    return apiClient.get<PaginatedResponse<Organization>>(`/api/organizations/?${queryParams.toString()}`);
  }

  async getOrganization(id: number): Promise<Organization> {
    return apiClient.get<Organization>(`/api/organizations/${id}`);
  }

  /** Create organization; optionally pass plants to create in the same request. */
  async createOrganization(data: Partial<Organization> & { plants?: Array<Partial<Plant>> }): Promise<Organization> {
    return apiClient.post<Organization>('/api/organizations/', data);
  }

  async updateOrganization(id: number, data: Partial<Organization>): Promise<Organization> {
    return apiClient.patch<Organization>(`/api/organizations/${id}`, data);
  }

  async deleteOrganization(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/organizations/${id}`);
  }

  async getOrganizationPlants(organizationId: number): Promise<Plant[]> {
    return apiClient.get<Plant[]>(`/api/organizations/${organizationId}/plants`);
  }

  /** Payload for creating a plant under an organization (only these fields are sent). */
  buildCreatePlantPayload(data: Partial<Plant>): {
    plant_name: string;
    plant_code?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    notes?: string;
  } {
    const name = (data.plant_name ?? '').toString().trim();
    const out: ReturnType<typeof marketingAPI.buildCreatePlantPayload> = {
      plant_name: name,
    };
    if (data.plant_code != null && String(data.plant_code).trim()) out.plant_code = String(data.plant_code).trim();
    if (data.address_line1 != null && String(data.address_line1).trim()) out.address_line1 = String(data.address_line1).trim();
    if (data.address_line2 != null && String(data.address_line2).trim()) out.address_line2 = String(data.address_line2).trim();
    if (data.city != null && String(data.city).trim()) out.city = String(data.city).trim();
    if (data.state != null && String(data.state).trim()) out.state = String(data.state).trim();
    if (data.country != null && String(data.country).trim()) out.country = String(data.country).trim();
    if (data.postal_code != null && String(data.postal_code).trim()) out.postal_code = String(data.postal_code).trim();
    if (data.notes != null && String(data.notes).trim()) out.notes = String(data.notes).trim();
    return out;
  }

  async createOrganizationPlant(organizationId: number, data: Partial<Plant>): Promise<Plant> {
    const payload = this.buildCreatePlantPayload(data);
    if (!payload.plant_name) {
      throw new Error('Plant name is required');
    }
    return apiClient.post<Plant>(`/api/organizations/${organizationId}/plants`, payload);
  }

  async updateOrganizationPlant(organizationId: number, plantId: number, data: Partial<Plant>): Promise<Plant> {
    return apiClient.patch<Plant>(`/api/organizations/${organizationId}/plants/${plantId}`, data);
  }

  async deleteOrganizationPlant(organizationId: number, plantId: number): Promise<void> {
    return apiClient.delete<void>(`/api/organizations/${organizationId}/plants/${plantId}`);
  }

  // Plants
  async getPlants(params?: {
    contact_id?: number;
    customer_id?: number;
  }): Promise<Plant[]> {
    const queryParams = new URLSearchParams();
    if (params?.contact_id) queryParams.append('contact_id', params.contact_id.toString());
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id.toString());
    const query = queryParams.toString();
    return apiClient.get<Plant[]>(query ? `/api/plants/?${query}` : '/api/plants/');
  }

  async getPlant(id: number): Promise<Plant> {
    return apiClient.get<Plant>(`/api/plants/${id}`);
  }

  async createPlant(data: Partial<Plant>): Promise<Plant> {
    return apiClient.post<Plant>('/api/plants/', data);
  }

  async updatePlant(id: number, data: Partial<Plant>): Promise<Plant> {
    return apiClient.put<Plant>(`/api/plants/${id}`, data);
  }

  async deletePlant(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/plants/${id}`);
  }

  // Employee Region Assignments
  /** All active assignments with employee_name/employee_email from HRMS (no extra employees call needed). */
  async getAllAssignments(): Promise<AssignmentWithEmployee[]> {
    return apiClient.get<AssignmentWithEmployee[]>('/api/regions/assignments/');
  }

  async getEmployeeAssignments(employeeId: number): Promise<any[]> {
    return apiClient.get<any[]>(`/api/regions/assignments/${employeeId}`);
  }

  async assignEmployeeToRegion(data: {
    employee_id: number;
    region_id: number;
    role: 'head' | 'employee';
    employee_name?: string;
    employee_email?: string;
  }): Promise<any> {
    return apiClient.post<any>('/api/regions/assign-employee', data);
  }

  async updateEmployeeAssignment(
    assignmentId: number,
    data: { role?: 'head' | 'employee'; is_active?: boolean }
  ): Promise<AssignmentWithEmployee> {
    return apiClient.put<AssignmentWithEmployee>(`/api/regions/assignments/${assignmentId}`, data);
  }

  async removeEmployeeFromRegion(assignmentId: number): Promise<void> {
    return apiClient.delete<void>(`/api/regions/assignments/${assignmentId}`);
  }

  // Numbering Series
  async getSeries(params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
    entity_type?: string;
    search?: string;
    order_by?: string;
    order_dir?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Series>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.order_by) queryParams.append('order_by', params.order_by);
    if (params?.order_dir) queryParams.append('order_dir', params.order_dir);
    return apiClient.get<PaginatedResponse<Series>>(`/api/series/?${queryParams.toString()}`);
  }

  async getSeriesById(id: number): Promise<Series> {
    return apiClient.get<Series>(`/api/series/${id}`);
  }

  async createSeries(data: SeriesCreateInput): Promise<Series> {
    return apiClient.post<Series>('/api/series/', data);
  }

  async updateSeries(id: number, data: SeriesUpdateInput): Promise<Series> {
    return apiClient.put<Series>(`/api/series/${id}`, data);
  }

  async deleteSeries(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/series/${id}`);
  }

  async generateNextSeriesNumber(
    seriesId: number,
    context?: { customer_id?: number; contact_id?: number; lead_id?: number }
  ): Promise<SeriesGenerateResponse> {
    return apiClient.post<SeriesGenerateResponse>(`/api/series/${seriesId}/generate-next`, context ?? {});
  }

  /** Generate next value by series code (character field, not FK). Pass lead_id/contact_id/customer_id or lead_context (company) for pattern placeholders like {lead.company}. */
  async generateNextSeriesNumberByCode(
    seriesCode: string,
    context?: {
      customer_id?: number;
      contact_id?: number;
      lead_id?: number;
      lead_context?: { company?: string; company_slug?: string };
    }
  ): Promise<SeriesGenerateResponse> {
    return apiClient.post<SeriesGenerateResponse>('/api/series/generate-next', { series_code: seriesCode, ...context });
  }

  // Profile & Connect Email (uses same API base + auth token)
  async getAuthProfile(): Promise<{ success: boolean; user?: any; employee?: any; roles?: any[] }> {
    return apiClient.get<{ success: boolean; user?: any; employee?: any; roles?: any[] }>('/api/auth/me');
  }

  async getEmailConnection(): Promise<{ connected: boolean; email?: string }> {
    return apiClient.get<{ connected: boolean; email?: string }>('/api/auth/email-connection');
  }

  async getEmailAuthorizeUrl(): Promise<{ url: string }> {
    return apiClient.get<{ url: string }>('/api/auth/email/authorize-url');
  }

  async disconnectEmail(): Promise<{ success: boolean; connected: boolean }> {
    return apiClient.delete<{ success: boolean; connected: boolean }>('/api/auth/email');
  }

  /** List quotations with optional search, lead filter, date range, and sort (API-side). */
  async getMyQuotations(params?: {
    search?: string;
    lead_id?: number;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<QuotationListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.search?.trim()) queryParams.set('search', params.search.trim());
    if (params?.lead_id != null) queryParams.set('lead_id', String(params.lead_id));
    if (params?.date_from?.trim()) queryParams.set('date_from', params.date_from.trim());
    if (params?.date_to?.trim()) queryParams.set('date_to', params.date_to.trim());
    if (params?.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.set('sort_order', params.sort_order);
    const qs = queryParams.toString();
    return apiClient.get<QuotationListItem[]>(`/api/quotations/${qs ? `?${qs}` : ''}`);
  }

  /** Lead options for quotation filter dropdown (leads that have at least one quotation). */
  async getQuotationLeadOptions(): Promise<QuotationLeadOption[]> {
    return apiClient.get<QuotationLeadOption[]>('/api/quotations/lead-options');
  }

  /** Reports: who the current user can run reports for (self, or team if region/domain head) */
  async getReportsScope(): Promise<ReportScopeResponse> {
    return apiClient.get<ReportScopeResponse>('/api/reports/scope');
  }

  /** Reports: summary metrics for selected employee (or self) and optional date range */
  async getReportsSummary(params?: {
    date_from?: string;
    date_to?: string;
    employee_id?: number;
  }): Promise<ReportSummaryResponse> {
    const searchParams = new URLSearchParams();
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    if (params?.employee_id != null) searchParams.set('employee_id', String(params.employee_id));
    const qs = searchParams.toString();
    return apiClient.get<ReportSummaryResponse>(`/api/reports/summary${qs ? `?${qs}` : ''}`);
  }

  /** Expected order report: create (select leads as next month potential clients) */
  async createExpectedOrderReport(data: { year: number; month: number; lead_ids: number[] }): Promise<ExpectedOrderReportItem> {
    return apiClient.post<ExpectedOrderReportItem>('/api/reports/expected-orders', data);
  }

  /** Expected order reports: list (optional year/month/employee_id filter; employee_id respects report scope) */
  async listExpectedOrderReports(params?: { year?: number; month?: number; employee_id?: number }): Promise<ExpectedOrderReportItem[]> {
    const sp = new URLSearchParams();
    if (params?.year != null) sp.set('year', String(params.year));
    if (params?.month != null) sp.set('month', String(params.month));
    if (params?.employee_id != null) sp.set('employee_id', String(params.employee_id));
    const qs = sp.toString();
    return apiClient.get<ExpectedOrderReportItem[]>(`/api/reports/expected-orders${qs ? `?${qs}` : ''}`);
  }

  /** OD plan reports: list (optional year/month/employee_id filter; employee_id respects report scope) */
  async listODPlanReports(params?: { year?: number; month?: number; employee_id?: number }): Promise<ODPlanReportItem[]> {
    const sp = new URLSearchParams();
    if (params?.year != null) sp.set('year', String(params.year));
    if (params?.month != null) sp.set('month', String(params.month));
    if (params?.employee_id != null) sp.set('employee_id', String(params.employee_id));
    const qs = sp.toString();
    return apiClient.get<ODPlanReportItem[]>(`/api/reports/od-plans${qs ? `?${qs}` : ''}`);
  }

  /** OD plan: get one for year-month */
  async getODPlanReport(year: number, month: number): Promise<ODPlanReportItem> {
    return apiClient.get<ODPlanReportItem>(`/api/reports/od-plans/${year}/${month}`);
  }

  /** OD plan: save (create or replace entries for year-month) */
  async saveODPlanReport(year: number, month: number, data: { entries: ODPlanEntryCreate[] }): Promise<ODPlanReportItem> {
    return apiClient.put<ODPlanReportItem>(`/api/reports/od-plans/${year}/${month}`, data);
  }

  /** Dashboard: monthly target vs achieved, won/lost counts (for current user or employee_id if admin/head) */
  async getDashboardTargetStats(params?: { employee_id?: number; date_from?: string; date_to?: string }): Promise<DashboardTargetStats> {
    const sp = new URLSearchParams();
    if (params?.employee_id != null) sp.set('employee_id', String(params.employee_id));
    if (params?.date_from?.trim()) sp.set('date_from', params.date_from.trim());
    if (params?.date_to?.trim()) sp.set('date_to', params.date_to.trim());
    const qs = sp.toString();
    return apiClient.get<DashboardTargetStats>(`/api/dashboard/target-stats${qs ? `?${qs}` : ''}`);
  }

  /** Scope-wide target/achieved for dashboard. For heads returns aggregated team stats. */
  async getScopeTargetStats(params?: { date_from?: string; date_to?: string }): Promise<ScopeTargetStats> {
    const sp = new URLSearchParams();
    if (params?.date_from?.trim()) sp.set('date_from', params.date_from.trim());
    if (params?.date_to?.trim()) sp.set('date_to', params.date_to.trim());
    const qs = sp.toString();
    return apiClient.get<ScopeTargetStats>(`/api/dashboard/scope-target-stats${qs ? `?${qs}` : ''}`);
  }

  /** Domain target summary: hierarchy domain → region → employee with target amounts (for Domains Review page). */
  async getDomainTargetSummary(year: number, month: number): Promise<DomainTargetSummaryResponse> {
    return apiClient.get<DomainTargetSummaryResponse>(`/api/dashboard/domain-target-summary?year=${year}&month=${month}`);
  }

  /** Head dashboard summary for domain_head and super_admin: region split, hot cases, conversion, won vs lost. */
  async getHeadDashboardSummary(params?: { date_from?: string; date_to?: string }): Promise<HeadDashboardSummaryResponse> {
    const sp = new URLSearchParams();
    if (params?.date_from?.trim()) sp.set('date_from', params.date_from.trim());
    if (params?.date_to?.trim()) sp.set('date_to', params.date_to.trim());
    const qs = sp.toString();
    return apiClient.get<HeadDashboardSummaryResponse>(`/api/dashboard/head-summary${qs ? `?${qs}` : ''}`);
  }

  // Saved dashboards (user-created; assignable; widgets with SQL or preset)
  async getSavedDashboards(): Promise<SavedDashboardResponse[]> {
    return apiClient.get<SavedDashboardResponse[]>('/api/saved-dashboards');
  }
  async getSavedDashboard(id: number, params?: { date_from?: string; date_to?: string }): Promise<SavedDashboardResponse> {
    const sp = new URLSearchParams();
    if (params?.date_from?.trim()) sp.set('date_from', params.date_from.trim());
    if (params?.date_to?.trim()) sp.set('date_to', params.date_to.trim());
    const qs = sp.toString();
    return apiClient.get<SavedDashboardResponse>(`/api/saved-dashboards/${id}${qs ? `?${qs}` : ''}`);
  }
  async createSavedDashboard(data: { name: string; description?: string; config?: { layout?: unknown[] } }): Promise<SavedDashboardResponse> {
    return apiClient.post<SavedDashboardResponse>('/api/saved-dashboards', data);
  }
  async updateSavedDashboard(id: number, data: { name?: string; description?: string; config?: { layout?: unknown[] } }): Promise<SavedDashboardResponse> {
    return apiClient.patch<SavedDashboardResponse>(`/api/saved-dashboards/${id}`, data);
  }
  async deleteSavedDashboard(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/saved-dashboards/${id}`);
  }
  async getAssignableUsers(): Promise<AssignableUser[]> {
    return apiClient.get<AssignableUser[]>('/api/saved-dashboards/assignable-users');
  }
  async getSavedDashboardAssignments(dashboardId: number): Promise<SavedDashboardAssignmentResponse[]> {
    return apiClient.get<SavedDashboardAssignmentResponse[]>(`/api/saved-dashboards/${dashboardId}/assignments`);
  }
  async assignSavedDashboard(dashboardId: number, data: { assignee_employee_id: number; can_edit?: boolean }): Promise<SavedDashboardAssignmentResponse> {
    return apiClient.post<SavedDashboardAssignmentResponse>(`/api/saved-dashboards/${dashboardId}/assignments`, data);
  }
  async deleteSavedDashboardAssignment(dashboardId: number, assignmentId: number): Promise<void> {
    return apiClient.delete<void>(`/api/saved-dashboards/${dashboardId}/assignments/${assignmentId}`);
  }

  // Report templates (like dashboards: template + SQL sections, assign to employees)
  async getReportTemplates(): Promise<ReportTemplateResponse[]> {
    return apiClient.get<ReportTemplateResponse[]>('/api/report-templates');
  }
  async getReportTemplate(id: number, params?: ReportTemplateEntityParams): Promise<ReportTemplateResponse> {
    const sp = new URLSearchParams();
    if (params?.date_from?.trim()) sp.set('date_from', params.date_from.trim());
    if (params?.date_to?.trim()) sp.set('date_to', params.date_to.trim());
    if (params?.lead_id != null) sp.set('lead_id', String(params.lead_id));
    if (params?.lead_ids?.trim()) sp.set('lead_ids', params.lead_ids.trim());
    if (params?.domain_id != null) sp.set('domain_id', String(params.domain_id));
    if (params?.domain_ids?.trim()) sp.set('domain_ids', params.domain_ids.trim());
    if (params?.region_id != null) sp.set('region_id', String(params.region_id));
    if (params?.region_ids?.trim()) sp.set('region_ids', params.region_ids.trim());
    if (params?.employee_id != null) sp.set('employee_id', String(params.employee_id));
    if (params?.contact_id != null) sp.set('contact_id', String(params.contact_id));
    if (params?.contact_ids?.trim()) sp.set('contact_ids', params.contact_ids.trim());
    if (params?.customer_id != null) sp.set('customer_id', String(params.customer_id));
    if (params?.customer_ids?.trim()) sp.set('customer_ids', params.customer_ids.trim());
    if (params?.organization_id != null) sp.set('organization_id', String(params.organization_id));
    if (params?.organization_ids?.trim()) sp.set('organization_ids', params.organization_ids.trim());
    if (params?.plant_id != null) sp.set('plant_id', String(params.plant_id));
    if (params?.plant_ids?.trim()) sp.set('plant_ids', params.plant_ids.trim());
    const qs = sp.toString();
    return apiClient.get<ReportTemplateResponse>(`/api/report-templates/${id}${qs ? `?${qs}` : ''}`);
  }
  async createReportTemplate(data: { name: string; description?: string; config?: { sections?: ReportSection[] } }): Promise<ReportTemplateResponse> {
    return apiClient.post<ReportTemplateResponse>('/api/report-templates', data);
  }
  async updateReportTemplate(id: number, data: { name?: string; description?: string; config?: { sections?: ReportSection[] } }): Promise<ReportTemplateResponse> {
    return apiClient.patch<ReportTemplateResponse>(`/api/report-templates/${id}`, data);
  }
  async deleteReportTemplate(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/report-templates/${id}`);
  }
  async getReportTemplateAssignableUsers(): Promise<AssignableUser[]> {
    return apiClient.get<AssignableUser[]>('/api/report-templates/assignable-users');
  }
  async getReportTemplateAssignments(templateId: number): Promise<ReportTemplateAssignmentResponse[]> {
    return apiClient.get<ReportTemplateAssignmentResponse[]>(`/api/report-templates/${templateId}/assignments`);
  }
  async assignReportTemplate(templateId: number, data: { assignee_employee_id: number; can_edit?: boolean }): Promise<ReportTemplateAssignmentResponse> {
    return apiClient.post<ReportTemplateAssignmentResponse>(`/api/report-templates/${templateId}/assignments`, data);
  }
  async deleteReportTemplateAssignment(templateId: number, assignmentId: number): Promise<void> {
    return apiClient.delete<void>(`/api/report-templates/${templateId}/assignments/${assignmentId}`);
  }

  async generateWidgetWithAI(data: {
    prompt: string;
    schema: { name: string; columns: { name: string; type: string }[] }[];
    scope_mode?: 'auto' | 'employee' | 'region' | 'domain';
    preferred_chart?: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card';
    date_from?: string;
    date_to?: string;
  }): Promise<{ title: string; chart_type: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card'; sql: string }> {
    return apiClient.post<{ title: string; chart_type: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card'; sql: string }>(
      '/api/saved-dashboards/ai-generate-widget',
      data
    );
  }
  async previewSqlTemplate(data: {
    sql: string;
    chart_type?: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card';
    schema: { name: string; columns: { name: string; type: string }[] }[];
    date_from?: string;
    date_to?: string;
  }): Promise<{ chart_type: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card'; compiled_sql: string; data: unknown[] }> {
    return apiClient.post<{ chart_type: 'table' | 'bar' | 'line' | 'pie' | 'heatmap' | 'number-card'; compiled_sql: string; data: unknown[] }>(
      '/api/saved-dashboards/preview-sql-template',
      data
    );
  }
  /** Execute widget data source (SQL or preset); returns { data, chart_type } for charts. */
  async executeWidget(body: { chart_type: string; data_source: { kind: string; value?: string }; title?: string }): Promise<{ data: unknown[]; chart_type?: string }> {
    return apiClient.post<{ data: unknown[]; chart_type?: string }>('/api/saved-dashboards/execute-widget', body);
  }

  /** Database schema (tables and columns) for Custom SQL widgets and ER reference. */
  async getSchema(): Promise<SchemaResponse> {
    return apiClient.get<SchemaResponse>('/api/schema');
  }

  /** Set monthly target for an employee (admin/head in scope). Default 8 lacs if not set. */
  async setEmployeeTarget(employee_id: number, year: number, month: number, target_amount: number): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(
      `/api/dashboard/target?employee_id=${employee_id}&year=${year}&month=${month}`,
      { target_amount }
    );
  }

  // Today's tasks (auto from follow-up / status group rule, or manual)
  async getTodayTasks(): Promise<TaskItem[]> {
    return apiClient.get<TaskItem[]>('/api/tasks/today');
  }
  async getTask(taskId: number): Promise<TaskItem> {
    return apiClient.get<TaskItem>(`/api/tasks/${taskId}`);
  }
  async completeTask(taskId: number): Promise<{ id: number; completed_at: string }> {
    return apiClient.patch<{ id: number; completed_at: string }>(`/api/tasks/${taskId}/complete`);
  }
  async createManualTask(data: { title: string; description?: string }): Promise<TaskItem> {
    return apiClient.post<TaskItem>('/api/tasks', data);
  }

  // Notifications
  async getNotifications(unreadOnly = false, limit = 50): Promise<NotificationItem[]> {
    const qs = new URLSearchParams();
    if (unreadOnly) qs.set('unread_only', 'true');
    if (limit !== 50) qs.set('limit', String(limit));
    const s = qs.toString();
    return apiClient.get<NotificationItem[]>(s ? `/api/notifications/?${s}` : '/api/notifications/');
  }
  async getUnreadNotificationCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/api/notifications/unread-count');
  }
  async markNotificationRead(notificationId: number): Promise<NotificationItem> {
    return apiClient.patch<NotificationItem>(`/api/notifications/${notificationId}/read`);
  }
  async markAllNotificationsRead(): Promise<{ ok: boolean }> {
    return apiClient.patch<{ ok: boolean }>('/api/notifications/read-all');
  }
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return apiClient.get<NotificationPreferences>('/api/notifications/preferences');
  }
  async updateNotificationPreferences(data: { times_per_day?: number; preferred_times?: string }): Promise<NotificationPreferences> {
    return apiClient.put<NotificationPreferences>('/api/notifications/preferences', data);
  }
  async registerNotificationDevice(data: { token: string; platform?: 'web' | 'android' | 'ios'; user_agent?: string }): Promise<{ id: number; user_employee_id: number; platform: string; created_at: string; last_seen_at?: string | null }> {
    return apiClient.post('/api/notifications/devices/register', data);
  }
  async unregisterNotificationDevice(data: { token: string; platform?: 'web' | 'android' | 'ios' }): Promise<{ ok: boolean }> {
    return apiClient.post('/api/notifications/devices/unregister', data);
  }
  async scheduleLeadFollowUp(leadId: number, data: { next_follow_up_at?: string | null; follow_up_reminder_type?: string | null; follow_up_time?: string | null }): Promise<Lead> {
    return apiClient.patch<Lead>(`/api/leads/${leadId}/follow-up`, data);
  }
}

export interface QuotationListItem {
  id: number;
  quotation_number: string | null;
  file_name: string;
  activity_id: number;
  inquiry_number: number | null;
  lead_id: number;
  lead_series: string | null;
  lead_name: string;
  activity_title: string;
  activity_date: string | null;
}

export interface QuotationLeadOption {
  lead_id: number;
  lead_series: string | null;
  lead_name: string;
}

// Reports types
export interface ReportableEmployee {
  id: number;
  name: string;
}
export interface ReportScopeResponse {
  can_select_employee: boolean;
  employees: ReportableEmployee[];
  role: 'self' | 'region_head' | 'domain_head' | 'super_admin';
}
export interface InquiriesByTypeItem {
  activity_type: string;
  count: number;
}
export interface LeadsByStatusItem {
  status_id: number;
  status_code: string;
  status_label: string;
  count: number;
}
export interface ReportSummaryResponse {
  date_from?: string | null;
  date_to?: string | null;
  employee_id?: number | null;
  employee_name?: string | null;
  inquiries_count: number;
  inquiries_by_type: InquiriesByTypeItem[];
  quotations_sent_count: number;
  leads_total: number;
  leads_by_status: LeadsByStatusItem[];
  leads_created_count: number;
}

export interface ExpectedOrderReportLeadItem {
  lead_id: number;
  lead_series: string | null;
  lead_name: string | null;
  company: string | null;
}
export interface ExpectedOrderReportItem {
  id: number;
  employee_id: number;
  year: number;
  month: number;
  created_at: string;
  leads: ExpectedOrderReportLeadItem[];
}

export interface ODPlanEntryItem {
  id: number;
  plan_date: string;
  entry_type: string;
  where_place: string | null;
  travel_time: string | null;
  travel_type: string | null;
  contact_id: number | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
}
export interface ODPlanReportItem {
  id: number;
  employee_id: number;
  year: number;
  month: number;
  created_at: string;
  updated_at: string;
  entries: ODPlanEntryItem[];
}
export interface ODPlanEntryCreate {
  plan_date: string;
  entry_type: string;
  where_place?: string | null;
  travel_time?: string | null;
  travel_type?: string | null;
  contact_id?: number | null;
  notes?: string | null;
}

export interface DashboardTargetStats {
  monthly_target: number;
  achieved_this_month: number;
  won_leads_count_this_month: number;
  lost_leads_count_this_month: number;
  year: number;
  month: number;
}

/** Scope-wide target stats for dashboard (employee = own, heads = aggregated team). */
export interface ScopeTargetStats {
  role: 'self' | 'region_head' | 'domain_head' | 'super_admin';
  scope_label: string;
  monthly_target: number;
  achieved_this_month: number;
  won_leads_count_this_month: number;
  lost_leads_count_this_month: number;
  year: number;
  month: number;
  employee_count: number;
}

/** Domain target summary: hierarchy domain → region → employee with target amounts (for Domains Review page). */
export interface EmployeeTargetItem {
  employee_id: number;
  employee_name: string;
  target_amount: number;
}

export interface RegionTargetSummaryItem {
  region_id: number;
  region_name: string;
  region_code?: string | null;
  total_target: number;
  employees: EmployeeTargetItem[];
}

export interface DomainTargetSummaryItem {
  domain_id: number;
  domain_name: string;
  domain_code?: string | null;
  total_target: number;
  regions: RegionTargetSummaryItem[];
}

export interface DomainTargetSummaryResponse {
  year: number;
  month: number;
  total_target: number;
  domains: DomainTargetSummaryItem[];
}

/** Region row for head dashboard (domain_head / super_admin). */
export interface RegionBreakdownItem {
  region_id: number;
  region_name: string;
  domain_name: string;
  total_leads: number;
  won_count: number;
  lost_count: number;
  hot_cases_count: number;
  conversion_ratio_pct: number | null;
}

/** Head dashboard summary: region-wise split, hot cases, total leads, conversion, won vs lost. */
export interface HeadDashboardSummaryResponse {
  role: string;
  region_breakdown: RegionBreakdownItem[];
  hot_cases_count: number;
  total_leads: number;
  conversion_ratio_pct: number | null;
  won_count: number;
  lost_count: number;
  year: number;
  month: number;
}

/** User who can be assigned a dashboard (domain head, region head, or employee in marketing). */
export interface AssignableUser {
  id: number;
  name: string;
  role_hint?: string | null;
}

/** Saved dashboard (user-created; config.layout = widgets). */
export interface SavedDashboardResponse {
  id: number;
  name: string;
  description: string | null;
  config: { layout?: unknown[] } | null;
  widget_data?: Record<string, { data?: unknown[]; chart_type?: string; error?: string }>;
  domain_id: number | null;
  created_by_employee_id: number;
  created_by_username: string | null;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
}

/** Assignment of a saved dashboard to a user (employee). */
export interface SavedDashboardAssignmentResponse {
  id: number;
  dashboard_id: number;
  assignee_employee_id: number;
  can_edit: boolean;
  created_at: string;
}

/** One section in a report template: title + SQL. */
export interface ReportSection {
  id: string;
  title?: string;
  sql: string;
  display_order?: number;
  chart_type?: string;
}

/** Report template (user-created; config.sections = list of SQL sections). */
export interface ReportTemplateResponse {
  id: number;
  name: string;
  description: string | null;
  config: { sections?: ReportSection[] } | null;
  section_data?: Record<string, { data?: unknown[]; error?: string }>;
  domain_id: number | null;
  created_by_employee_id: number;
  created_by_username: string | null;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  /** Placeholder keys used in section SQL (e.g. lead_id, domain_id) for filter dropdowns */
  placeholders?: string[] | null;
}

/** Entity params for report template run (single ID or comma-separated _ids). */
export interface ReportTemplateEntityParams {
  date_from?: string;
  date_to?: string;
  lead_id?: number;
  lead_ids?: string;
  domain_id?: number;
  domain_ids?: string;
  region_id?: number;
  region_ids?: string;
  employee_id?: number;
  contact_id?: number;
  contact_ids?: string;
  customer_id?: number;
  customer_ids?: string;
  organization_id?: number;
  organization_ids?: string;
  plant_id?: number;
  plant_ids?: string;
}

/** Assignment of a report template to a user (employee). */
export interface ReportTemplateAssignmentResponse {
  id: number;
  template_id: number;
  assignee_employee_id: number;
  can_edit: boolean;
  created_at: string;
}

export interface SchemaColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

export interface SchemaForeignKeyInfo {
  constrained_columns: string[];
  referred_table: string;
  referred_columns: string[];
}

export interface SchemaTableInfo {
  name: string;
  columns: SchemaColumnInfo[];
  foreign_keys: SchemaForeignKeyInfo[];
}

export interface SchemaResponse {
  tables: SchemaTableInfo[];
}

export interface TaskItem {
  id: number;
  employee_id: number;
  title: string;
  description: string | null;
  due_date: string;
  source: string;
  lead_id: number | null;
  order_id: number | null;
  lead_status_group_id: number | null;
  completed_at: string | null;
  created_at: string;
  lead_series: string | null;
  lead_name: string | null;
}

// Notifications
export interface NotificationItem {
  id: number;
  user_employee_id: number;
  title: string;
  message: string | null;
  link: string | null;
  notification_type: string | null;
  lead_id: number | null;
  read_at: string | null;
  created_at: string;
}
export interface NotificationPreferences {
  user_employee_id: number;
  times_per_day: number | null;
  preferred_times: string | null;
  updated_at: string;
}

// Numbering Series types
export type SeriesResetPeriod = 'none' | 'day' | 'week' | 'month' | 'year';

export interface Series {
  id: number;
  name: string;
  code: string;
  pattern: string;
  entity_type?: string | null;
  next_value: number;
  reset_period: SeriesResetPeriod;
  last_period_key?: string | null;
  last_generated_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeriesCreateInput {
  name: string;
  code: string;
  pattern: string;
  entity_type?: string | null;
  next_value?: number;
  reset_period?: SeriesResetPeriod;
  is_active?: boolean;
}

export interface SeriesUpdateInput {
  name?: string;
  code?: string;
  pattern?: string;
  entity_type?: string | null;
  next_value?: number;
  reset_period?: SeriesResetPeriod;
  is_active?: boolean;
}

export interface SeriesGenerateResponse {
  series_id: number;
  series_code: string;
  generated_value: string;
}

export const marketingAPI = new MarketingAPIService();
