/**
 * HRMS RBAC API Client
 */
import { API_CONFIG } from './api';

/**
 * HRMS serves profile pictures via Django's ImageField, whose `.url` is a path
 * relative to HRMS's own origin (e.g. "/media/employee_profiles/x.jpg") — not an
 * absolute URL. Resolve it against HRMS's origin so `<img>` tags in this app (which
 * runs on a different origin/port) don't try to load it from their own origin instead.
 */
export function resolveHrmsMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  try {
    const origin = new URL(API_CONFIG.HRMS_RBAC_URL).origin;
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch {
    return path;
  }
}

export interface HRMSUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  /** Absolute URL, from HRMS's UserProfile.profile_picture. */
  profile_picture?: string | null;
}

export interface HRMSEmployee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  department: string | null;
  designation: string | null;
  is_active: boolean;
  /** Absolute URL, from HRMS's Employee.profile_picture. */
  profile_picture?: string | null;
}

export interface HRMSRole {
  id: number;
  name: string;
  role_type: string;
  level: number;
  is_primary: boolean;
}

export interface MarketingRole {
  id: number;
  name: string;
  role_type: string;
  level: number;
  description: string;
  is_system_role: boolean;
  permission_count: number;
  permissions?: string[];
}

export interface HRMSPermission {
  id: number;
  name: string;
  code: string;
  category: string;
  level: number;
  description: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: HRMSUser;
  employee?: HRMSEmployee;
  roles?: HRMSRole[];
  permissions?: HRMSPermission[];
  error?: string;
}

/**
 * Response from POST /api/rbac/sso/validate/ — called by our /sso doorway page
 * when the Intranet portal (or another app's switcher) redirects a user here with
 * a one-time SSO token in the URL.
 *
 * NOTE: `token` is what our whole app runs on (every Marketing API + HRMS call
 * sends `Authorization: Token <token>`). The SSO doc's sample response does NOT
 * include it yet — HRMS must add it (same `Token.objects.get_or_create` the
 * normal /login/ endpoint already does). Until then `loginWithSSO` fails with a
 * clear message.
 */
export interface SSOValidateResponse {
  valid: boolean;
  token?: string;
  user?: HRMSUser;
  employee?: HRMSEmployee;
  /** SSO endpoint returns role rows keyed as role__id / role__name / role__role_type. */
  roles?: Array<Record<string, unknown>>;
  permissions?: string[];
  detail?: string;
}

export interface PermissionCheckResponse {
  success: boolean;
  has_permission: boolean;
  permission?: HRMSPermission;
  error?: string;
}

/** Response from GET /api/rbac/permissions/ – all permissions created in HRMS (codes only) */
export interface AllPermissionsResponse {
  success: boolean;
  total: number;
  permissions: string[];
}

/** DSR status values from HRMS (DSR guide §5). `pending`/`completed` are legacy. */
export type DSRStatus = 'pending_approval' | 'approved' | 'rejected' | 'pending' | 'completed' | 'draft';
export type DSRType = 'indoor' | 'outdoor';

export interface DSRTask {
  id: number;
  date: string;
  title: string;
  description?: string;
  status: DSRStatus;
  dsr_type?: DSRType;
  current_level?: number | null;
  rejection_reason?: string | null;
  // Indoor
  department?: string;
  task_type?: string;
  hours?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  call_for?: string;
  // Outdoor
  company_name?: string;
  reason_for_visit?: string;
  region?: string;
  visit_plan?: string;
  appointment_status?: string;
  visit_status?: string;
  visited_date?: string | null;
  meeting_output?: string;
  next_action_needed?: string;
  mail_status?: string;
  // Shared
  contact_person?: string;
  contact_number?: string;
  mail_id?: string;
  remarks?: string;
  next_follow_up?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

/** Body for POST /dsr/create/ and /dsr/<id>/update/ (guide §3.2/§3.3). Never includes `status`. */
export interface DSRInput {
  dsr_type: DSRType;
  /** Create only: file the report under this employee (username or emp_id). Needs dsr.view_all. */
  username?: string;
  date: string;
  title?: string;
  description?: string;
  department?: string;
  task_type?: string;
  hours?: number;
  start_time?: string;
  end_time?: string;
  call_for?: string;
  company_name?: string;
  reason_for_visit?: string;
  region?: string;
  visit_plan?: string;
  appointment_status?: string;
  visit_status?: string;
  visited_date?: string;
  meeting_output?: string;
  next_action_needed?: string;
  mail_status?: string;
  contact_person?: string;
  contact_number?: string;
  mail_id?: string;
  remarks?: string;
  next_follow_up?: string;
}

/** The 7 expense amount fields (guide §8.2). Server sums them into `total`. */
export const EXPENSE_AMOUNT_FIELDS = [
  'travelling_bus',
  'travelling_shared_auto',
  'lodging',
  'day_allowance',
  'phone',
  'material_purchase',
  'cash_pay_to_other',
] as const;
export type ExpenseAmountField = typeof EXPENSE_AMOUNT_FIELDS[number];

export interface ExpenseReport extends Partial<Record<ExpenseAmountField, number | string>> {
  id: number;
  date: string;
  tour_destination?: string;
  description?: string;
  company_name?: string;
  total: number | string;
  status: DSRStatus;
  current_level?: number | null;
  rejection_reason?: string | null;
  created_at?: string;
}

/** Response from the DSR / Expense approve and reject endpoints (guide §3.5, §3.6, §8.3). */
export interface ApprovalResult {
  success?: boolean;
  message?: string;
  status?: DSRStatus;
  current_level?: number | null;
  current_approver?: unknown;
  rejection_reason?: string;
}

/** Who a pending report belongs to (pending-approval endpoints, guide §3.7 / §8.3). */
export interface PendingEmployee {
  id: number;
  name: string;
  employee_id?: string;
}

/** A DSR waiting on the current user's decision (GET /dsr/pending-approval/). */
export interface PendingDSR {
  id: number;
  dsr_type?: DSRType;
  date: string;
  employee?: PendingEmployee | null;
  title?: string;
  /** May end with "[Completed N late — was due …]" for DSRs generated from a late To-Do (guide §9.3). */
  task_detail?: string;
  current_level?: number | null;
  created_at?: string;
}

/** An expense report waiting on the current user's decision (GET /expense/pending-approval/). */
export interface PendingExpense {
  id: number;
  date: string;
  employee?: PendingEmployee | null;
  tour_destination?: string;
  total?: number | string;
  current_level?: number | null;
  created_at?: string;
}

/** HRMS To-Do task (ToDoItem, guide §9.3 "REST API for ToDoItem"). Field set is defensive — only id is guaranteed. */
export interface TodoTask {
  id: number;
  title?: string;
  description?: string | null;
  status?: 'pending' | 'completed' | string;
  due_at?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  is_overdue?: boolean;
  /** Words like "2 days 3 hours", or null when on time / still pending. */
  overdue_by?: string | null;
  assigned_by?: { id?: number; name?: string; username?: string } | string | number | null;
  assigned_by_name?: string | null;
  employee?: { id?: number; name?: string; username?: string } | null;
  created_at?: string;
  completed_at?: string | null;
  dsr_id?: number | null;
}

export interface TodoCreateInput {
  title: string;
  description?: string;
  /** HRMS employee ids; omit to create for yourself. Assigning to others needs dsr.assign_task. */
  employee_ids?: number[];
  due_date?: string;
  due_time?: string;
}

/** Body for POST /expense/create/ and /expense/<id>/update/. Never includes `total` or `status`. */
export interface ExpenseInput extends Partial<Record<ExpenseAmountField, number>> {
  date: string;
  tour_destination?: string;
  description?: string;
  company_name?: string;
}

export interface DSRResponse {
  success: boolean;
  employee?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  reports: DSRTask[];
  count: number;
  error?: string;
}

class HRMSRBACClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.HRMS_RBAC_URL;
  }

  /**
   * Login with HRMS credentials
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Validate a one-time SSO token from the Intranet portal redirect.
   * POST /api/rbac/sso/validate/  { token, user_id }
   */
  async validateSSO(ssoToken: string, userId: number): Promise<SSOValidateResponse> {
    try {
      const response = await fetch(`${this.baseURL}/sso/validate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ token: ssoToken, user_id: userId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.valid) {
        return {
          valid: false,
          detail: data.detail || `HTTP ${response.status}`,
        };
      }

      return data as SSOValidateResponse;
    } catch (error) {
      return {
        valid: false,
        detail: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Check if user has permission
   */
  async checkPermission(
    token: string,
    permissionCode: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/check-permission/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ permission: permissionCode }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return false;
      }

      return data.has_permission || false;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkMultiplePermissions(
    token: string,
    permissionCodes: string[]
  ): Promise<Record<string, boolean>> {
    try {
      const response = await fetch(`${this.baseURL}/check-permissions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ permissions: permissionCodes }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return permissionCodes.reduce((acc, code) => ({ ...acc, [code]: false }), {});
      }

      return data.permissions || {};
    } catch (error) {
      console.error('Multiple permission check error:', error);
      return permissionCodes.reduce((acc, code) => ({ ...acc, [code]: false }), {});
    }
  }

  /**
   * Get all permissions created in HRMS.
   * GET /api/rbac/permissions/ – returns { success, total, permissions: string[] }
   */
  async getAllPermissions(): Promise<AllPermissionsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/permissions/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, total: 0, permissions: [] };
      }
      return {
        success: true,
        total: data.total ?? (data.permissions?.length ?? 0),
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
      };
    } catch (error) {
      console.error('Get all permissions error:', error);
      return { success: false, total: 0, permissions: [] };
    }
  }

  /**
   * Get current user's granted permission codes (direct + role) in a single list.
   * GET /api/rbac/user/permissions/list/ – use this for permission checking.
   * Returns: { success, total, permissions: string[] }
   */
  async getUserPermissionsList(token: string): Promise<AllPermissionsResponse> {
    try {
      const response = await fetch(`${this.baseURL}/user/permissions/list/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        return { success: false, total: 0, permissions: [] };
      }
      return {
        success: true,
        total: data.total ?? (data.permissions?.length ?? 0),
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
      };
    } catch (error) {
      console.error('Get user permissions list error:', error);
      return { success: false, total: 0, permissions: [] };
    }
  }

  /**
   * Get user info
   */
  async getUserInfo(token: string): Promise<any> {
    try {
      // Correct endpoint: /api/rbac/user/info/ (with forward slash, not hyphen)
      const response = await fetch(`${this.baseURL}/user/info/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  /**
   * Get all available roles in the system (public endpoint, no auth required).
   * GET /api/rbac/roles/
   * Optionally filters to marketing-only roles (roles with any marketing.* permissions).
   */
  async getMarketingRoles(): Promise<MarketingRole[]> {
    try {
      const response = await fetch(`${this.baseURL}/roles/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok || !data.success) return [];
      const roles: MarketingRole[] = Array.isArray(data.roles) ? data.roles : [];
      // Filter to roles that have at least one marketing.* permission, or
      // whose name/type hints they are marketing-related (fallback if permissions array not returned).
      const marketingRoles = roles.filter(role => {
        if (Array.isArray(role.permissions)) {
          return role.permissions.some(p => p.startsWith('marketing.'));
        }
        // Fallback: include roles whose name or role_type contains 'marketing'
        const lc = (role.name + ' ' + role.role_type).toLowerCase();
        return lc.includes('marketing') || lc.includes('sales') || lc.includes('crm');
      });
      // If no marketing-specific roles found via filter, return all (avoids empty state in demo)
      return marketingRoles.length > 0 ? marketingRoles : roles;
    } catch (error) {
      console.error('Get marketing roles error:', error);
      return [];
    }
  }

  /**
   * Get DSR reports for a user (guide §3.1).
   * GET /api/rbac/dsr/ – without username, returns the authenticated user's reports.
   */
  async getDSR(
    token: string,
    params?: { username?: string; date?: string; filter_date?: string; status?: DSRStatus; type?: DSRType }
  ): Promise<DSRTask[]> {
    try {
      const query = new URLSearchParams();
      if (params?.username) query.set('username', params.username);
      if (params?.date) query.set('date', params.date);
      if (params?.filter_date) query.set('filter_date', params.filter_date);
      if (params?.status) query.set('status', params.status);
      if (params?.type) query.set('type', params.type);
      const qs = query.toString();
      const url = `${this.baseURL}/dsr/${qs ? '?' + qs : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) return [];
      return Array.isArray(data.reports) ? data.reports : [];
    } catch (error) {
      console.error('DSR fetch error:', error);
      return [];
    }
  }

  /**
   * POST a JSON body to an HRMS DSR/Expense mutation endpoint.
   * Throws Error(server message) on failure so callers can toast it.
   */
  private async postMutation(token: string, path: string, body?: object): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data: Record<string, unknown> = {};
    try {
      data = await response.json();
    } catch {
      // non-JSON error page (e.g. a 500 from bad input, guide §6)
    }
    if (!response.ok || data.success === false) {
      const msg = (data.error || data.detail || data.message) as string | undefined;
      throw new Error(msg || `HTTP ${response.status}`);
    }
    return data;
  }

  /** POST /api/rbac/dsr/create/ (guide §3.2). */
  async createDSR(token: string, input: DSRInput): Promise<{ id: number }> {
    const { status: _s, ...body } = input as DSRInput & { status?: unknown };
    const data = await this.postMutation(token, '/dsr/create/', body);
    return { id: Number(data.dsr_id ?? data.id) };
  }

  /** POST /api/rbac/dsr/<id>/update/ (guide §3.3). Only pending reports; status is never sent. */
  async updateDSR(token: string, id: number, input: Partial<DSRInput>): Promise<void> {
    const { status: _s, ...body } = input as Partial<DSRInput> & { status?: unknown };
    await this.postMutation(token, `/dsr/${id}/update/`, body);
  }

  /** POST /api/rbac/dsr/<id>/delete/ (guide §3.4). Also deletes approval history on the server. */
  async deleteDSR(token: string, id: number): Promise<void> {
    await this.postMutation(token, `/dsr/${id}/delete/`);
  }

  /**
   * POST /api/rbac/dsr/<id>/approve/ (guide §3.5). Advances to the next approval level,
   * or marks the report fully approved if there is none. 400 if not pending_approval.
   */
  async approveDSR(token: string, id: number, comments?: string): Promise<ApprovalResult> {
    return await this.postMutation(token, `/dsr/${id}/approve/`, comments ? { comments } : {}) as ApprovalResult;
  }

  /** POST /api/rbac/dsr/<id>/reject/ (guide §3.6). */
  async rejectDSR(token: string, id: number, rejectionReason: string): Promise<ApprovalResult> {
    return await this.postMutation(token, `/dsr/${id}/reject/`, { rejection_reason: rejectionReason }) as ApprovalResult;
  }

  /** POST /api/rbac/expense/<id>/approve/ (guide §8.3). */
  async approveExpense(token: string, id: number, comments?: string): Promise<ApprovalResult> {
    return await this.postMutation(token, `/expense/${id}/approve/`, comments ? { comments } : {}) as ApprovalResult;
  }

  /** POST /api/rbac/expense/<id>/reject/ (guide §8.3). */
  async rejectExpense(token: string, id: number, rejectionReason: string): Promise<ApprovalResult> {
    return await this.postMutation(token, `/expense/${id}/reject/`, { rejection_reason: rejectionReason }) as ApprovalResult;
  }

  /** GET helper for list endpoints; returns null on any failure so callers can fall back to empty. */
  private async getJson(token: string, path: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'GET',
        headers: { 'Authorization': `Token ${token}`, 'Accept': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok || data.success === false) return null;
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Everything waiting on the current user's approval, across all employees (guide §3.7 / §8.3,
   * GET /dsr/pending-approval/ + /expense/pending-approval/). No permission needed — HRMS only
   * returns reports the user is the resolved approver for, so each one can be approved/rejected.
   * Empty lists on failure (e.g. HRMS not updated yet), so non-approvers simply see nothing.
   */
  async getPendingApprovals(token: string): Promise<{ dsr: PendingDSR[]; expense: PendingExpense[] }> {
    const [d, e] = await Promise.all([
      this.getJson(token, '/dsr/pending-approval/'),
      this.getJson(token, '/expense/pending-approval/'),
    ]);
    return {
      dsr: Array.isArray(d?.pending) ? (d!.pending as PendingDSR[]) : [],
      expense: Array.isArray(e?.pending) ? (e!.pending as PendingExpense[]) : [],
    };
  }

  /** GET /api/rbac/todo/ — a user's To-Do tasks (default: yourself). Others need dsr.assign_task / view_all. */
  async getTodos(
    token: string,
    params?: { username?: string; employee_id?: number; status?: 'pending' | 'completed'; date?: string }
  ): Promise<TodoTask[]> {
    const q = new URLSearchParams();
    if (params?.username) q.set('username', params.username);
    if (params?.employee_id != null) q.set('employee_id', String(params.employee_id));
    if (params?.status) q.set('status', params.status);
    if (params?.date) q.set('date', params.date);
    const qs = q.toString();
    const data = await this.getJson(token, `/todo/${qs ? '?' + qs : ''}`);
    const rows = data?.tasks ?? data?.todos ?? data?.items;
    return Array.isArray(rows) ? (rows as TodoTask[]) : [];
  }

  /** POST /api/rbac/todo/create/ — one independent task per employee; each gets a notification. */
  async createTodo(token: string, input: TodoCreateInput): Promise<{ count: number; tasks: TodoTask[]; message?: string }> {
    const data = await this.postMutation(token, '/todo/create/', input);
    return {
      count: Number(data.count ?? (Array.isArray(data.tasks) ? data.tasks.length : 0)),
      tasks: (Array.isArray(data.tasks) ? data.tasks : []) as TodoTask[],
      message: data.message as string | undefined,
    };
  }

  /** POST /api/rbac/todo/<id>/update/ — pending tasks only; owner or assigner. due_date '' clears the deadline. */
  async updateTodo(token: string, id: number, patch: Partial<Pick<TodoCreateInput, 'title' | 'description' | 'due_date' | 'due_time'>>): Promise<void> {
    await this.postMutation(token, `/todo/${id}/update/`, patch);
  }

  /** POST /api/rbac/todo/<id>/delete/ — owner or assigner; doesn't delete a DSR already generated. */
  async deleteTodo(token: string, id: number): Promise<void> {
    await this.postMutation(token, `/todo/${id}/delete/`);
  }

  /** POST /api/rbac/todo/<id>/complete/ — only the task's own employee; auto-creates the DSR. */
  async completeTodo(token: string, id: number): Promise<{ dsr_id: number | null }> {
    const data = await this.postMutation(token, `/todo/${id}/complete/`);
    return { dsr_id: data.dsr_id != null ? Number(data.dsr_id) : null };
  }

  /** GET /api/rbac/expense/ (guide §8.3). Returns [] on failure, like getDSR. */
  async getExpenses(
    token: string,
    params?: { username?: string; date?: string; filter_date?: string; status?: DSRStatus }
  ): Promise<ExpenseReport[]> {
    try {
      const query = new URLSearchParams();
      if (params?.username) query.set('username', params.username);
      if (params?.date) query.set('date', params.date);
      if (params?.filter_date) query.set('filter_date', params.filter_date);
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      const response = await fetch(`${this.baseURL}/expense/${qs ? '?' + qs : ''}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) return [];
      // Guide doesn't pin the array key; accept the likely names.
      const rows = data.expenses ?? data.reports ?? data.vouchers;
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error('Expense fetch error:', error);
      return [];
    }
  }

  /** POST /api/rbac/expense/create/ (guide §8.3). `total` is computed server-side and never sent. */
  async createExpense(token: string, input: ExpenseInput): Promise<{ id: number }> {
    const { total: _t, status: _s, ...body } = input as ExpenseInput & { total?: unknown; status?: unknown };
    const data = await this.postMutation(token, '/expense/create/', body);
    return { id: Number(data.expense_id ?? data.id) };
  }

  /** POST /api/rbac/expense/<id>/update/ (guide §8.3). Only pending_approval reports. */
  async updateExpense(token: string, id: number, input: Partial<ExpenseInput>): Promise<void> {
    const { total: _t, status: _s, ...body } = input as Partial<ExpenseInput> & { total?: unknown; status?: unknown };
    await this.postMutation(token, `/expense/${id}/update/`, body);
  }

  /** POST /api/rbac/expense/<id>/delete/ (guide §8.3). */
  async deleteExpense(token: string, id: number): Promise<void> {
    await this.postMutation(token, `/expense/${id}/delete/`);
  }

  /**
   * Logout
   */
  async logout(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
}

export const hrmsRBACClient = new HRMSRBACClient();
