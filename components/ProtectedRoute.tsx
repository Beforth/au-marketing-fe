/**
 * Protected Route Component
 * Redirects to login if not authenticated
 * Checks localStorage for session persistence
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { 
  selectIsAuthenticated, 
  selectAuthLoading,
  selectHasPermission,
  selectHasAnyPermission,
  selectHasAllPermissions
} from '../store/slices/authSlice';
import { checkAuthFromStorage } from '../lib/auth-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requireAnyPermission?: string[];
  requireAllPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requireAnyPermission,
  requireAllPermissions,
}) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const hasPermission = useAppSelector(selectHasPermission(requiredPermission || ''));
  const hasAnyPerm = useAppSelector(requireAnyPermission ? selectHasAnyPermission(requireAnyPermission) : () => true);
  const hasAllPerms = useAppSelector(requireAllPermissions ? selectHasAllPermissions(requireAllPermissions) : () => true);

  // Check localStorage directly while Redux is loading
  const hasStoredAuth = checkAuthFromStorage();

  // Show loading only if we're checking with server
  if (isLoading && hasStoredAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          <p className="mt-4 text-sm text-slate-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and no stored auth, redirect to login
  if (!isAuthenticated && !hasStoredAuth) {
    return <Navigate to="/login" replace />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">
            You don't have permission to access this page. Required: <strong>{requiredPermission}</strong>
          </p>
        </div>
      </div>
    );
  }

  // Check any permission
  if (requireAnyPermission && requireAnyPermission.length > 0) {
    if (!hasAnyPerm) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600">
              You don't have any of the required permissions.
            </p>
          </div>
        </div>
      );
    }
  }

  // Check all permissions
  if (requireAllPermissions && requireAllPermissions.length > 0) {
    if (!hasAllPerms) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600">
              You don't have all the required permissions.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
