/**
 * Auth Slice - Redux state management for authentication
 * Permissions are stored as a list of codes from GET /api/rbac/user/permissions/list/
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { hrmsRBACClient, HRMSUser, HRMSEmployee, HRMSRole, LoginResponse } from '../../lib/hrms-rbac';
import { apiClient } from '../../lib/api';
import { clearStoredAuth } from '../../lib/auth-utils';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: HRMSUser | null;
  employee: HRMSEmployee | null;
  roles: HRMSRole[];
  /** Permission codes from GET /api/rbac/user/permissions/list/ (direct + role) */
  permissions: string[];
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  token: null,
  user: null,
  employee: null,
  roles: [],
  permissions: [],
  error: null,
};

// Load auth state from localStorage; use cached user/permissions. Call RBAC APIs only when cache is missing (e.g. first load after login stored token elsewhere).
export const loadAuthFromStorage = createAsyncThunk(
  'auth/loadFromStorage',
  async () => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUserData = localStorage.getItem('auth_user_data');

    if (!savedToken) return null;

    apiClient.setToken(savedToken);

    if (savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        const permissions = Array.isArray(userData.permissions) ? userData.permissions : [];
        return {
          token: savedToken,
          user: userData.user ?? null,
          employee: userData.employee ?? null,
          roles: userData.roles ?? [],
          permissions,
        };
      } catch {
        clearStoredAuth();
        return null;
      }
    }

    // Token exists but no cached user data – fetch once from HRMS and cache
    try {
      const userInfo = await hrmsRBACClient.getUserInfo(savedToken);
      if (userInfo && userInfo.success) {
        const permList = await hrmsRBACClient.getUserPermissionsList(savedToken);
        const permissionCodes = permList.success ? permList.permissions : [];
        const freshData = {
          user: userInfo.user,
          employee: userInfo.employee,
          roles: userInfo.roles || [],
          permissions: permissionCodes,
        };
        localStorage.setItem('auth_user_data', JSON.stringify(freshData));
        return { token: savedToken, ...freshData };
      }
    } catch {
      // ignore
    }
    clearStoredAuth();
    return null;
  }
);

// Login action; permissions from GET /api/rbac/user/permissions/list/
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) => {
    const response = await hrmsRBACClient.login(username, password);

    if (response.success && response.token) {
      const token = response.token;
      const user = response.user || null;
      const employee = response.employee || null;
      const roles = response.roles || [];

      apiClient.setToken(token);

      const permList = await hrmsRBACClient.getUserPermissionsList(token);
      const permissions = permList.success ? permList.permissions : [];

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user_data', JSON.stringify({
        user,
        employee,
        roles,
        permissions,
      }));
      localStorage.setItem('auth_login_time', Date.now().toString());

      return { token, user, employee, roles, permissions };
    } else {
      throw new Error(response.error || 'Login failed');
    }
  }
);

// Logout action
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token;

    if (token) {
      try {
        await hrmsRBACClient.logout(token);
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }

    // Clear all storage
    clearStoredAuth();
    apiClient.setToken(null);

    return null;
  }
);

// Refresh user info and permission list from GET /api/rbac/user/permissions/list/
export const refreshUserInfo = createAsyncThunk(
  'auth/refreshUserInfo',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token;
    if (!token) return null;
    try {
      const userInfo = await hrmsRBACClient.getUserInfo(token);
      if (userInfo && userInfo.success) {
        const permList = await hrmsRBACClient.getUserPermissionsList(token);
        const permissions = permList.success ? permList.permissions : [];
        const freshData = {
          user: userInfo.user,
          employee: userInfo.employee,
          roles: userInfo.roles || [],
          permissions,
        };
        localStorage.setItem('auth_user_data', JSON.stringify(freshData));
        return { token, ...freshData };
      }
    } catch {
      // Ignore – token may be invalid
    }
    return null;
  }
);

// Check permission action
export const checkPermission = createAsyncThunk(
  'auth/checkPermission',
  async (permissionCode: string, { getState }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token;

    if (!token) {
      return false;
    }

    return await hrmsRBACClient.checkPermission(token, permissionCode);
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      if (action.payload) {
        apiClient.setToken(action.payload);
        localStorage.setItem('auth_token', action.payload);
      } else {
        apiClient.setToken(null);
        localStorage.removeItem('auth_token');
      }
    },
    tokenExpired: (state) => {
      // Clear all auth state when token expires
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.employee = null;
      state.roles = [];
      state.permissions = [];
      state.error = null;
      clearStoredAuth();
      apiClient.setToken(null);
    },
  },
  extraReducers: (builder) => {
    // Load from storage
    builder
      .addCase(loadAuthFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadAuthFromStorage.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.employee = action.payload.employee;
          state.roles = action.payload.roles;
          state.permissions = action.payload.permissions;
        } else {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          state.employee = null;
          state.roles = [];
          state.permissions = [];
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loadAuthFromStorage.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.employee = null;
        state.roles = [];
        state.permissions = [];
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load session';
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.employee = action.payload.employee;
        state.roles = action.payload.roles;
        state.permissions = action.payload.permissions;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.employee = null;
        state.roles = [];
        state.permissions = [];
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.employee = null;
        state.roles = [];
        state.permissions = [];
        state.error = null;
      });

    // Refresh user info (e.g. after HRMS permission change)
    builder
      .addCase(refreshUserInfo.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.employee = action.payload.employee;
          state.roles = action.payload.roles;
          state.permissions = action.payload.permissions;
        }
      });
  },
});

export const { clearError, setToken, tokenExpired } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectEmployee = (state: { auth: AuthState }) => state.auth.employee;
export const selectRoles = (state: { auth: AuthState }) => state.auth.roles;
export const selectPermissions = (state: { auth: AuthState }) => state.auth.permissions;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Helper selectors
export const selectUserDisplayName = (state: { auth: AuthState }) => {
  const { employee, user } = state.auth;
  if (employee) {
    return `${employee.first_name} ${employee.last_name}`.trim();
  }
  if (user) {
    return `${user.first_name} ${user.last_name}`.trim() || user.username;
  }
  return 'User';
};

export const selectUserInitials = (state: { auth: AuthState }) => {
  const { employee, user } = state.auth;
  if (employee) {
    return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  }
  if (user) {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    if (first || last) {
      return `${first}${last}`.toUpperCase();
    }
    return user.username[0].toUpperCase();
  }
  return 'U';
};

export const selectHasPermission = (permissionCode: string) => (state: { auth: AuthState }) => {
  const code = permissionCode?.trim();
  if (!code) return false;
  return state.auth.permissions.includes(code);
};

export const selectHasAnyPermission = (permissionCodes: string[]) => (state: { auth: AuthState }) => {
  return permissionCodes.some(code => state.auth.permissions.includes(code?.trim()));
};

export const selectHasAllPermissions = (permissionCodes: string[]) => (state: { auth: AuthState }) => {
  return permissionCodes.every(code => state.auth.permissions.includes(code?.trim()));
};

export default authSlice.reducer;
