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

// Contact Types
export interface Contact {
  id: number;
  company_name: string;
  website?: string;
  industry?: string;
  contact_person_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_job_title?: string;
  domain_id: number;
  region_id?: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
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
}

// Customer Types
export interface Customer {
  id: number;
  company_name: string;
  website?: string;
  industry?: string;
  company_size?: string;
  tax_id?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  primary_contact_job_title?: string;
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
  series_code?: string;  // Code of numbering series (character, not FK)
  series?: string;  // Generated number from numbering series (e.g. CUST-0001)
  notes?: string;
  created_by_employee_id: number;
  created_by_username?: string;
  account_manager_employee_id?: number;
  account_manager_username?: string;
  created_at: string;
  updated_at: string;
  domain?: Domain;
  region?: Region;
  plants?: Plant[];
}

// Plant Types
export interface Plant {
  id: number;
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
  contact_person_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_job_title?: string;
  is_active: boolean;
  notes?: string;
  created_by_employee_id?: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
}

// Lead status (from DB)
export interface LeadStatusOption {
  id: number;
  code: string;
  label: string;
  display_order: number;
  is_active: boolean;
  is_final?: boolean;  // Won/closed – no follow-up reminders
  is_lost?: boolean;    // Lost – no follow-up reminders
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

// Lead Types (Updated)
export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  source?: string;
  domain_id: number;
  region_id?: number;
  contact_id?: number;
  customer_id?: number;
  plant_id?: number;
  status_id?: number;
  status?: string;  // status_option.code from API
  lead_type_id?: number;
  lead_through_id?: number;
  potential_value?: number;
  notes?: string;
  series_code?: string;  // Code of numbering series "map" (character field, not FK)
  series?: string;  // Generated number from numbering series (e.g. LEAD-0001)
  next_follow_up_at?: string | null;
  follow_up_reminder_type?: string | null;  // once | daily | weekly | monthly
  assigned_to_employee_id?: number;
  assigned_to_username?: string;
  created_by_employee_id: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
  expected_closing_date?: string;
  domain?: Domain;
  region?: Region;
  customer?: Customer;
  plant?: Plant;
  status_option?: LeadStatusOption;
  lead_type_option?: LeadTypeOption;
  lead_through_option?: LeadThroughOption;
  last_activity_date?: string | null;  // latest activity (inquiry) date on lead, from list API
}

/** Activity attachment (e.g. quotation file) */
export interface LeadActivityAttachment {
  id: number;
  activity_id: number;
  file_name: string;
  file_path: string;
  quotation_number?: string | null;
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
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  source?: string;
  domain_id: number;
  region_id?: number;
  contact_id?: number;
  customer_id?: number;
  plant_id?: number;
  status_id?: number;
  lead_type_id?: number;
  lead_through_id?: number;
  potential_value?: number;
  notes?: string;
  series_code?: string;
  assigned_to_employee_id?: number;
  expected_closing_date?: string;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {}

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
    status_id?: number;
    assigned_to?: number;
    domain_id?: number;
    region_id?: number;
    search?: string;
  }): Promise<PaginatedResponse<Lead>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.status_id != null) queryParams.append('status_id', params.status_id.toString());
    if (params?.assigned_to != null) queryParams.append('assigned_to', params.assigned_to.toString());
    if (params?.domain_id != null) queryParams.append('domain_id', params.domain_id.toString());
    if (params?.region_id != null) queryParams.append('region_id', params.region_id.toString());
    if (params?.search) queryParams.append('search', params.search);
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

  async createLeadStatus(data: { code: string; label: string; display_order?: number; is_active?: boolean; is_final?: boolean; is_lost?: boolean }): Promise<LeadStatusOption> {
    return apiClient.post<LeadStatusOption>('/api/leads/statuses/', data);
  }

  async updateLeadStatus(id: number, data: Partial<{ code: string; label: string; display_order: number; is_active: boolean; is_final: boolean; is_lost: boolean }>): Promise<LeadStatusOption> {
    return apiClient.put<LeadStatusOption>(`/api/leads/statuses/${id}`, data);
  }

  async deleteLeadStatus(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/statuses/${id}`);
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
      contact_person_name?: string;
      contact_person_email?: string;
      contact_person_phone?: string;
    }
  ): Promise<LeadActivity> {
    return apiClient.post<LeadActivity>(`/api/leads/${leadId}/activities/`, data);
  }

  /** Upload one or more quotation/attachment files for an activity. */
  async uploadLeadActivityAttachments(
    leadId: number,
    activityId: number,
    files: File[],
    quotationNumbers?: string[]
  ): Promise<LeadActivityAttachment[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    if (quotationNumbers?.length) {
      formData.append('quotation_numbers', JSON.stringify(quotationNumbers));
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

  async deleteLead(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/leads/${id}`);
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

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return apiClient.post<Customer>('/api/customers/', data);
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    return apiClient.put<Customer>(`/api/customers/${id}`, data);
  }

  async deleteCustomer(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/customers/${id}`);
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
  }): Promise<PaginatedResponse<Series>> {
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(params?.page ?? 1));
    queryParams.append('page_size', String(params?.page_size ?? DEFAULT_PAGE_SIZE));
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
    if (params?.search) queryParams.append('search', params.search);
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

  /** Generate next value by series code (character field, not FK). Pass lead_id/contact_id/customer_id to use entity fields in pattern. */
  async generateNextSeriesNumberByCode(
    seriesCode: string,
    context?: { customer_id?: number; contact_id?: number; lead_id?: number }
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

  /** List quotations (enquiry attachments) created by the current user, with lead and inquiry info */
  async getMyQuotations(): Promise<QuotationListItem[]> {
    return apiClient.get<QuotationListItem[]>('/api/quotations/');
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
  async scheduleLeadFollowUp(leadId: number, data: { next_follow_up_at?: string | null; follow_up_reminder_type?: string | null }): Promise<Lead> {
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
}

// Reports types
export interface ReportableEmployee {
  id: number;
  name: string;
}
export interface ReportScopeResponse {
  can_select_employee: boolean;
  employees: ReportableEmployee[];
  role: 'self' | 'region_head' | 'domain_head';
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
export interface Series {
  id: number;
  name: string;
  code: string;
  pattern: string;
  entity_type?: string | null;
  next_value: number;
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
  is_active?: boolean;
}

export interface SeriesUpdateInput {
  name?: string;
  code?: string;
  pattern?: string;
  entity_type?: string | null;
  next_value?: number;
  is_active?: boolean;
}

export interface SeriesGenerateResponse {
  series_id: number;
  series_code: string;
  generated_value: string;
}

export const marketingAPI = new MarketingAPIService();
