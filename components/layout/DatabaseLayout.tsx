/**
 * Database layout: professional tabbed UI for Organizations, Customers, Contacts.
 * Fortify-style: clean header, underlined nav, clear hierarchy.
 */
import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Building2, Users, UserCircle, Database } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectHasPermission } from '../../store/slices/authSlice';
import { cn } from '../../lib/utils';

const TABS = [
  { path: 'organizations', label: 'Organizations', icon: Building2, permission: 'marketing.view_organization' as const },
  { path: 'customers', label: 'Customers', icon: Users, permission: 'marketing.view_customer' as const },
  { path: 'contacts', label: 'Contacts', icon: UserCircle, permission: 'marketing.view_contact' as const },
];

export const DatabaseLayout: React.FC = () => {
  const location = useLocation();
  const hasViewOrganization = useAppSelector(selectHasPermission('marketing.view_organization'));
  const hasViewCustomer = useAppSelector(selectHasPermission('marketing.view_customer'));
  const hasViewContact = useAppSelector(selectHasPermission('marketing.view_contact'));

  // If path is exactly /database or /database/
  if (location.pathname.replace(/\/$/, '') === '/database') {
    if (hasViewOrganization) {
      return <Navigate to="organizations" replace />;
    }
    if (hasViewCustomer) {
      return <Navigate to="customers" replace />;
    }
    if (hasViewContact) {
      return <Navigate to="contacts" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
};
