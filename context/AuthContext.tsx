/**
 * Authentication Context for HRMS RBAC Integration
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hrmsRBACClient, HRMSUser, HRMSEmployee, HRMSRole, LoginResponse } from '../lib/hrms-rbac';
import { apiClient } from '../lib/api';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: HRMSUser | null;
  employee: HRMSEmployee | null;
  roles: HRMSRole[];
  /** Permission codes from GET /api/rbac/user/permissions/list/ */
  permissions: string[];
  
  // Auth methods
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkPermission: (permissionCode: string) => Promise<boolean>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
  
  // User info
  getUserDisplayName: () => string;
  getUserInitials: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<HRMSUser | null>(null);
  const [employee, setEmployee] = useState<HRMSEmployee | null>(null);
  const [roles, setRoles] = useState<HRMSRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUserData = localStorage.getItem('auth_user_data');
        
        if (savedToken) {
          setToken(savedToken);
          apiClient.setToken(savedToken);
          
          // Try to load saved user data first (faster)
          if (savedUserData) {
            try {
              const userData = JSON.parse(savedUserData);
              setUser(userData.user);
              setEmployee(userData.employee);
              setRoles(userData.roles || []);
              setPermissions(userData.permissions || []);
              setIsAuthenticated(true);
            } catch (e) {
              console.error('Error parsing saved user data:', e);
            }
          }
          
          // Verify token by getting fresh user info from server
          const userInfo = await hrmsRBACClient.getUserInfo(savedToken);
          if (userInfo && userInfo.success) {
            const permList = await hrmsRBACClient.getUserPermissionsList(savedToken);
            const permissionCodes = permList.success ? permList.permissions : [];
            setUser(userInfo.user);
            setEmployee(userInfo.employee);
            setRoles(userInfo.roles || []);
            setPermissions(permissionCodes);
            setIsAuthenticated(true);
            localStorage.setItem('auth_user_data', JSON.stringify({
              user: userInfo.user,
              employee: userInfo.employee,
              roles: userInfo.roles || [],
              permissions: permissionCodes,
            }));
          } else {
            // Token invalid or expired, clear everything
            clearAuthState();
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    const clearAuthState = () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user_data');
      localStorage.removeItem('auth_login_time');
      setToken(null);
      setUser(null);
      setEmployee(null);
      setRoles([]);
      setPermissions([]);
      setIsAuthenticated(false);
      apiClient.setToken(null);
    };

    // Listen for token expiration events
    const handleTokenExpired = () => {
      clearAuthState();
      setIsLoading(false);
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);

    loadAuthState();

    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await hrmsRBACClient.login(username, password);
      
      if (response.success && response.token) {
        const token = response.token;
        const user = response.user || null;
        const employee = response.employee || null;
        const roles = response.roles || [];
        const permList = await hrmsRBACClient.getUserPermissionsList(token);
        const permissions = permList.success ? permList.permissions : [];
        setToken(token);
        setUser(user);
        setEmployee(employee);
        setRoles(roles);
        setPermissions(permissions);
        setIsAuthenticated(true);
        apiClient.setToken(token);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user_data', JSON.stringify({
          user,
          employee,
          roles,
          permissions,
        }));
        
        // Save login timestamp (optional, for session timeout)
        localStorage.setItem('auth_login_time', Date.now().toString());
      } else {
        // Clear auth state on failed login
        setToken(null);
        setUser(null);
        setEmployee(null);
        setRoles([]);
        setPermissions([]);
        setIsAuthenticated(false);
        apiClient.setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user_data');
        localStorage.removeItem('auth_login_time');
      }
      
      return response;
    } catch (error) {
      setIsAuthenticated(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await hrmsRBACClient.logout(token);
      } catch (error) {
        console.error('Error during logout:', error);
        // Continue with logout even if API call fails
      }
    }
    
    // Clear all auth state
    setToken(null);
    setUser(null);
    setEmployee(null);
    setRoles([]);
    setPermissions([]);
    setIsAuthenticated(false);
    apiClient.setToken(null);
    
    // Clear all session data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user_data');
    localStorage.removeItem('auth_login_time');
  }, [token]);

  const checkPermission = useCallback(async (permissionCode: string): Promise<boolean> => {
    if (!token) return false;
    return await hrmsRBACClient.checkPermission(token, permissionCode);
  }, [token]);

  const hasPermission = useCallback((permissionCode: string): boolean => {
    const code = permissionCode?.trim();
    return code ? permissions.includes(code) : false;
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => hasPermission(code));
  }, [hasPermission]);

  const getUserDisplayName = useCallback((): string => {
    if (employee) {
      return `${employee.first_name} ${employee.last_name}`.trim();
    }
    if (user) {
      return `${user.first_name} ${user.last_name}`.trim() || user.username;
    }
    return 'User';
  }, [user, employee]);

  const getUserInitials = useCallback((): string => {
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
  }, [user, employee]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    token,
    user,
    employee,
    roles,
    permissions,
    login,
    logout,
    checkPermission,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserDisplayName,
    getUserInitials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
