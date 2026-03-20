/**
 * Database layout: professional tabbed UI for Organizations, Customers, Contacts.
 * Fortify-style: clean header, underlined nav, clear hierarchy.
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
  return (
    <div className="w-full">
      <Outlet />
    </div>
  );
};
