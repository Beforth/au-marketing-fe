/**
 * Authentication utility functions
 * Direct localStorage checks for route guards
 */

export const checkAuthFromStorage = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('auth_user_data');
  
  // Check if both token and user data exist
  if (token && userData) {
    try {
      const parsed = JSON.parse(userData);
      // Verify we have at least user or employee data
      if (parsed.user || parsed.employee) {
        return true;
      }
    } catch (e) {
      // Invalid JSON, clear it
      localStorage.removeItem('auth_user_data');
      localStorage.removeItem('auth_token');
      return false;
    }
  }
  
  return false;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user_data');
  localStorage.removeItem('auth_login_time');
};
