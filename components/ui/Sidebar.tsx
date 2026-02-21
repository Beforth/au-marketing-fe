
import React, { useMemo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SIDEBAR_LINKS, SECONDARY_LINKS } from '../../constants';
import { NavItem } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { selectUserDisplayName, selectUserInitials, selectEmployee, selectUser, selectHasPermission } from '../../store/slices/authSlice';


export const Sidebar: React.FC = () => {
  const userDisplayName = useAppSelector(selectUserDisplayName);
  const userInitials = useAppSelector(selectUserInitials);
  const employee = useAppSelector(selectEmployee);
  const user = useAppSelector(selectUser);
  
  // Check each permission (codes must match HRMS current flat codes: marketing.view_*, marketing.edit_*, etc.)
  const hasViewDomain = useAppSelector(selectHasPermission('marketing.view_domain'));
  const hasViewContact = useAppSelector(selectHasPermission('marketing.view_contact'));
  const hasViewLead = useAppSelector(selectHasPermission('marketing.view_lead'));
  const hasViewCampaign = useAppSelector(selectHasPermission('marketing.view_campaign'));
  const hasViewCustomer = useAppSelector(selectHasPermission('marketing.view_customer'));
  const hasAdmin = useAppSelector(selectHasPermission('marketing.admin'));

  // Filter links based on permissions (Reports, Invoices, Numbering Series use marketing.admin)
  const filteredSidebarLinks = useMemo(() => {
    return SIDEBAR_LINKS.filter(link => {
      if (!link.permission) return true;
      switch (link.permission) {
        case 'marketing.view_domain': return hasViewDomain;
        case 'marketing.view_contact': return hasViewContact;
        case 'marketing.view_lead': return hasViewLead;
        case 'marketing.view_campaign': return hasViewCampaign;
        case 'marketing.view_customer': return hasViewCustomer;
        case 'marketing.admin': return hasAdmin;
        default: return true;
      }
    });
  }, [hasViewDomain, hasViewContact, hasViewLead, hasViewCampaign, hasViewCustomer, hasAdmin]);

  // Filter secondary links (Settings and Support don't need permissions for now)
  const filteredSecondaryLinks = SECONDARY_LINKS;
  
  // Get designation or role for subtitle
  const getUserRole = () => {
    if (employee?.designation) {
      return employee.designation;
    }
    if (user?.is_superuser) {
      return 'Administrator';
    }
    return 'User';
  };

  return (
    <aside className="w-60 h-screen bg-white border-r border-slate-200/60 flex flex-col fixed left-0 top-0 z-30">
      <div className="p-5 flex flex-col h-full">
        <Link
          to="/"
          className="flex items-center gap-2.5 mb-7 px-2 hover:opacity-80 transition-all"
        >
          <img
            src="https://www.beforth.in/images/befu.png"
            alt="BeForth"
            className="w-10 h-10 rounded object-contain flex-shrink-0"
          />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            BeForth
          </span>
        </Link>

        <nav className="space-y-0.5">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2">Main Menu</p>
          {filteredSidebarLinks.map((item) => (
            <SidebarItem key={item.title} item={item} />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <nav className="space-y-0.5">
            {filteredSecondaryLinks.map((item) => (
              <SidebarItem key={item.title} item={item} />
            ))}
          </nav>

          <div className="mt-4 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100/80 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200/50">
              <span className="text-indigo-600 font-bold text-xs">
                {userInitials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-slate-900 truncate">
                {userDisplayName}
              </p>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                {getUserRole()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const SidebarItem: React.FC<{ item: NavItem }> = ({ item }) => {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) => `
        group flex items-center justify-between w-full rounded-lg text-[13px] transition-all duration-200 font-medium px-3 py-2
        ${isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <item.icon
              size={18}
              strokeWidth={isActive ? 2.2 : 1.8}
              className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}
            />
            <span className={isActive ? 'font-semibold' : ''}>{item.title}</span>
          </div>
          {item.badge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

