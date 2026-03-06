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
  const hasViewOrg = useAppSelector(selectHasPermission('marketing.view_organization'));
  const hasViewCustomer = useAppSelector(selectHasPermission('marketing.view_customer'));
  const hasViewContact = useAppSelector(selectHasPermission('marketing.view_contact'));

  const visibleTabs = TABS.filter(tab => {
    switch (tab.permission) {
      case 'marketing.view_organization': return hasViewOrg;
      case 'marketing.view_customer': return hasViewCustomer;
      case 'marketing.view_contact': return hasViewContact;
      default: return true;
    }
  });

  return (
    <div className="space-y-0 w-full">
      {/* Header card: title + tabs — same width as PageLayout content below */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden mb-6">
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Database size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Database</h1>
              <p className="text-sm text-slate-500 mt-0.5">Organizations, customers, and contacts</p>
            </div>
          </div>

          {/* Tab bar: underline style */}
          <nav className="flex gap-0 -mb-px" aria-label="Database sections">
            {visibleTabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={`/database/${tab.path}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 py-3.5 px-1 mr-6 text-sm font-medium border-b-2 transition-colors duration-150',
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  )
                }
              >
                <tab.icon size={17} strokeWidth={2} className="shrink-0 opacity-90" />
                <span>{tab.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Content: list pages render here */}
      <div className="min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
