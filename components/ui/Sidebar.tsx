
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SIDEBAR_LINKS, SECONDARY_LINKS } from '../../constants';
import { NavItem } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { selectUserDisplayName, selectUserInitials, selectEmployee, selectUser, selectHasPermission } from '../../store/slices/authSlice';
import { Modal } from './Modal';
import { ChangelogContent } from './ChangelogContent';
import { ChevronDown, ShieldCheck, Hash, Users } from 'lucide-react';


export const Sidebar: React.FC = () => {
  const [showChangelog, setShowChangelog] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const userDisplayName = useAppSelector(selectUserDisplayName);
  const userInitials = useAppSelector(selectUserInitials);
  const employee = useAppSelector(selectEmployee);
  const user = useAppSelector(selectUser);
  const appVersion = 'v1.0.2';
  const changelogSeenKey = useMemo(
    () => `marketing_changelog_seen_${appVersion}_${user?.id ?? 'anon'}`,
    [appVersion, user?.id]
  );
  
  // Check each permission (codes must match HRMS; Domains tab uses rbac.view_domain_tab)
  const hasViewDomainTab = useAppSelector(selectHasPermission('rbac.view_domain_tab'));
  const hasViewDomain = useAppSelector(selectHasPermission('marketing.view_domain'));
  const hasViewContact = useAppSelector(selectHasPermission('marketing.view_contact'));
  const hasViewLead = useAppSelector(selectHasPermission('marketing.view_lead'));
  const hasViewCampaign = useAppSelector(selectHasPermission('marketing.view_campaign'));
  const hasViewCustomer = useAppSelector(selectHasPermission('marketing.view_customer'));

  const hasViewOrganization = useAppSelector(selectHasPermission('marketing.view_organization'));
  const hasViewReport = useAppSelector(selectHasPermission('marketing.view_report'));
  const hasAdmin = useAppSelector(selectHasPermission('marketing.admin'));

  // Filter links based on permissions
  const filteredSidebarLinks = useMemo(() => {
    return SIDEBAR_LINKS.filter(link => {
      if (!link.permission) return true;
      switch (link.permission) {
        case 'rbac.view_domain_tab': return hasViewDomainTab;
        case 'marketing.view_domain': return hasViewDomain;
        case 'marketing.view_contact': return hasViewContact;
        case 'marketing.view_lead': return hasViewLead;
        case 'marketing.view_campaign': return hasViewCampaign;
        case 'marketing.view_customer': return hasViewCustomer;
        case 'marketing.view_organization': return hasViewOrganization;
        case 'marketing.view_database': return hasViewOrganization || hasViewCustomer || hasViewContact;
        case 'marketing.view_report': return hasViewReport;
        case 'marketing.admin': return hasAdmin;
        default: return true;
      }
    });
  }, [hasViewDomainTab, hasViewDomain, hasViewContact, hasViewLead, hasViewCampaign, hasViewCustomer, hasViewOrganization, hasViewReport, hasAdmin]);

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

  const closeChangelog = () => {
    try {
      localStorage.setItem(changelogSeenKey, '1');
    } catch {
      // ignore storage failures
    }
    setShowChangelog(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    try {
      const seen = localStorage.getItem(changelogSeenKey);
      if (!seen) setShowChangelog(true);
    } catch {
      setShowChangelog(true);
    }
  }, [user?.id, changelogSeenKey]);

  return (
    <aside className="w-60 h-screen bg-white border-r border-slate-200/60 flex flex-col fixed left-0 top-0 z-30">
      <div className="p-5 flex flex-col h-full">
        <Link
          to="/"
          className="flex items-center gap-2.5 mb-7 px-2 hover:opacity-80 transition-all"
        >
          <img
            src="/aureole-logo.png"
            alt="Aureole"
            className="w-10 h-10 rounded object-contain flex-shrink-0"
          />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            S&amp;M Hub
          </span>
        </Link>
        <div className="px-2 -mt-5 mb-5 flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-slate-500">
            Powered by <span className="font-semibold text-slate-700">BeForth</span>
          </p>
          <button
            type="button"
            onClick={() => setShowChangelog(true)}
            className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-2 py-0.5 hover:bg-indigo-100 transition-colors"
            title="View changelog"
          >
            {appVersion}
          </button>
        </div>

        <nav className="space-y-0.5">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2">Main Menu</p>
          {filteredSidebarLinks.map((item) => (
            <SidebarItem key={item.title} item={item} />
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-0">
          {/* ── Admin Section ── */}
          {hasAdmin && (
            <div className="mb-1">
              <div className="border-t border-slate-100 pt-3 pb-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Admin</p>
              </div>

              {/* Admin toggle button */}
              <button
                type="button"
                onClick={() => setAdminOpen(o => !o)}
                className={`w-full group flex items-center justify-between rounded-lg text-[13px] transition-all duration-200 font-medium px-3 py-2 ${
                  adminOpen
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    size={18}
                    strokeWidth={adminOpen ? 2.2 : 1.8}
                    className={adminOpen ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}
                  />
                  <span className={adminOpen ? 'font-semibold' : ''}>Administration</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown items */}
              {adminOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l-2 border-indigo-100 space-y-0.5">
                  <NavLink
                    to="/numbering-series"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 w-full rounded-lg text-[12.5px] transition-all duration-200 font-medium px-2.5 py-1.5 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Hash
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={isActive ? 'text-indigo-500' : 'text-slate-400'}
                        />
                        Numbering Series
                      </>
                    )}
                  </NavLink>

                  <NavLink
                    to="/roles"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 w-full rounded-lg text-[12.5px] transition-all duration-200 font-medium px-2.5 py-1.5 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Users
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          className={isActive ? 'text-indigo-500' : 'text-slate-400'}
                        />
                        Roles
                      </>
                    )}
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {/* Secondary links (Settings / Support) */}
          <div className={`border-t border-slate-100 pt-3 space-y-0.5 ${hasAdmin ? '' : 'mt-3'}`}>
            {filteredSecondaryLinks.map((item) => (
              <SidebarItem key={item.title} item={item} />
            ))}
          </div>

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

      <Modal
        isOpen={showChangelog}
        onClose={closeChangelog}
        title={`Changelog ${appVersion}`}
        contentClassName="max-w-6xl"
        footer={
          <button
            type="button"
            onClick={closeChangelog}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95 animate-pulse"
          >
            Looks good, close changelog
          </button>
        }
      >
        <ChangelogContent appVersion={appVersion} />
      </Modal>
    </aside>
  );
};

const SidebarItem: React.FC<{ item: NavItem }> = ({ item }) => {
  return (
    <NavLink
      to={item.href}
      end={item.href === '/database' ? false : undefined}
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
