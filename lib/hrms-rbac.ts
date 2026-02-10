/**
 * HRMS RBAC API Client
 */
import { API_CONFIG } from './api';

export interface HRMSUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
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
}

export interface HRMSRole {
  id: number;
  name: string;
  role_type: string;
  level: number;
  is_primary: boolean;
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
