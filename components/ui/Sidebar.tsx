
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SIDEBAR_LINKS, SECONDARY_LINKS } from '../../constants';
import { NavItem } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { selectUserDisplayName, selectUserInitials, selectEmployee, selectUser, selectHasPermission } from '../../store/slices/authSlice';
import { Modal } from './Modal';


export const Sidebar: React.FC = () => {
  const [showChangelog, setShowChangelog] = useState(false);
  const userDisplayName = useAppSelector(selectUserDisplayName);
  const userInitials = useAppSelector(selectUserInitials);
  const employee = useAppSelector(selectEmployee);
  const user = useAppSelector(selectUser);
  const appVersion = 'v1.0.0';
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
        <div className="space-y-6 text-sm text-slate-700">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release</p>
            <p className="text-lg font-semibold text-slate-900">{appVersion}</p>
            <p className="text-xs text-slate-500">March 6, 2026</p>
          </div>

          <section className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="text-base font-semibold text-slate-900">Saved Dashboard Management</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Added frontend dashboard assignment flow for selected saved dashboards.</li>
              <li>Introduced <strong>Assign dashboard</strong> modal with assign/remove actions.</li>
              <li>Supports assigning by employee ID and setting <strong>can edit</strong> access.</li>
              <li>Added assignment list view with remove action from the same modal.</li>
              <li>Added strict frontend visibility checks:
                <span className="block text-xs text-slate-500 mt-1">`marketing.create_dashboard` or `marketing.admin` for Save as new.</span>
                <span className="block text-xs text-slate-500">`marketing.assign_dashboard` or `marketing.admin` for Assign.</span>
              </li>
              <li>Blocked customization actions for users without edit rights on selected saved dashboard.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="text-base font-semibold text-slate-900">Dashboard Task Modal UX Improvements</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Redesigned task modal into two clear paths:
                <span className="block text-xs text-slate-500 mt-1">Quick Add Quotation</span>
                <span className="block text-xs text-slate-500">Detailed Add Log</span>
              </li>
              <li>Quick add now supports file-only flow with auto enquiry title <strong>Added quotation</strong>.</li>
              <li>Added quotation series selection and revised quotation toggle in quick flow.</li>
              <li>Updated detailed log behavior:
                <span className="block text-xs text-slate-500 mt-1">If type is `QTN Submitted`, title is auto-set.</span>
                <span className="block text-xs text-slate-500">Validates quotation file before submit when needed.</span>
              </li>
              <li>Reworked attachment rows to improve readability and reduce accidental entry errors.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="text-base font-semibold text-slate-900">Lead Details Enquiry Form Improvements</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Upgraded quick quotation card with clearer layout and guided input sequence.</li>
              <li>Quick quotation now logs activity as <strong>`qtn_submitted`</strong> (previously used generic note type).</li>
              <li>Added quotation series + revised toggle for both quick add and detailed attachment uploads.</li>
              <li>Detailed log now auto-uses title <strong>Added quotation</strong> for `QTN Submitted` type.</li>
              <li>Added validation for `QTN Submitted` to prevent submit without quotation file.</li>
              <li>Improved attachment section labels and structure for better usability.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="text-base font-semibold text-slate-900">Permissions & Documentation</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Updated required permissions documentation to include:
                <span className="block text-xs text-slate-500 mt-1">`marketing.create_dashboard`</span>
                <span className="block text-xs text-slate-500">`marketing.assign_dashboard`</span>
              </li>
              <li>Aligned frontend behavior with backend dashboard permission model.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="text-base font-semibold text-slate-900">Build & Stability</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Resolved intermediate TypeScript/JSX issues introduced during UI refactor.</li>
              <li>Verified production build after each change set.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h4 className="text-base font-semibold text-slate-900">Domain Target Assignment & Hierarchical Sums</h4>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-800">Backend (`marketing-api`)</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Added <strong>GET `/api/dashboard/domain-target-summary`</strong>
                  <span className="block text-xs text-slate-500 mt-1">Query params: `year`, `month`.</span>
                  <span className="block text-xs text-slate-500">Returns hierarchy: domains → regions → employees with target amounts.</span>
                  <span className="block text-xs text-slate-500">Includes `total_target`, per-domain/per-region `total_target`, and per-employee `target_amount`.</span>
                  <span className="block text-xs text-slate-500">Scope: super_admin (all), domain_head (own domain), region_head (own region).</span>
                  <span className="block text-xs text-slate-500">Uses existing `EmployeeMonthlyTarget`; defaults to 8 Lacs when not set.</span>
                </li>
                <li>
                  Added response models:
                  <span className="block text-xs text-slate-500 mt-1">`DomainTargetSummaryResponse`, `DomainTargetSummaryItem`, `RegionTargetSummaryItem`, `EmployeeTargetItem`.</span>
                </li>
                <li>
                  Added helper:
                  <span className="block text-xs text-slate-500 mt-1">`_get_scope_domain_region_ids()` to resolve visible domain/region IDs for the current user.</span>
                </li>
                <li>
                  Unchanged:
                  <span className="block text-xs text-slate-500 mt-1"><strong>PUT `/api/dashboard/target`</strong> remains the write endpoint for employee monthly targets.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-800">Frontend (`marketing-fe`)</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  API client (`lib/marketing-api.ts`)
                  <span className="block text-xs text-slate-500 mt-1">Added types: `DomainTargetSummaryResponse`, `DomainTargetSummaryItem`, `RegionTargetSummaryItem`, `EmployeeTargetItem`.</span>
                  <span className="block text-xs text-slate-500">Added method: `getDomainTargetSummary(year, month)`.</span>
                </li>
                <li>
                  Domains page review view (`pages/DomainsPage.tsx`)
                  <span className="block text-xs text-slate-500 mt-1">Added month/year period selector (defaults to current month/year).</span>
                  <span className="block text-xs text-slate-500">Shows top-level total target from `targetSummary.total_target`.</span>
                  <span className="block text-xs text-slate-500">Domain rows show domain head + domain target (sum of domain regions).</span>
                  <span className="block text-xs text-slate-500">Region rows show region head + region target (sum of region employees).</span>
                  <span className="block text-xs text-slate-500">Employee rows show target + Set target action.</span>
                  <span className="block text-xs text-slate-500">Set target modal saves via `setEmployeeTarget(...)` and refetches summary to refresh region/domain/total sums.</span>
                </li>
                <li>
                  Added helpers:
                  <span className="block text-xs text-slate-500 mt-1">`getEmployeeTarget()`, `getRegionTotal()`, `getDomainTotal()`, `formatTargetAmount()`, `getCurrentYearMonth()`, and `MONTHS`.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">Summary</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Feature enables employee-level target assignment with region/domain/overall total rollups.</li>
                <li>Backend adds read-only hierarchical summary endpoint.</li>
                <li>Write/update flow remains on existing target endpoint.</li>
                <li>Frontend Domains Review now supports period-based target planning and updates.</li>
              </ul>
            </div>
          </section>
        </div>
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
