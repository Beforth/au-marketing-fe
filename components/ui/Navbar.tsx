
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchInput } from './SearchInput';
import { GlobalSearchResults } from './GlobalSearchResults';
import { Search, Bell, Settings, Command, ShoppingBag, ShieldAlert, Package, MessageSquare, User, ArrowRight, LayoutDashboard, FileText, PieChart, CreditCard, X, LogOut, UserCircle, Users, Globe, Quote, Building2, Database, Ticket, SquarePlus, ClipboardCheck, UserPlus } from 'lucide-react';
import { useApp } from '../../App';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectUserDisplayName, selectEmployee, selectUser, selectHasPermission, selectPermissions } from '../../store/slices/authSlice';
import { getDSRPermissions } from '../../lib/dsr-helpers';
import { resolveHrmsMediaUrl } from '../../lib/hrms-rbac';
import { Tooltip } from '../../UI/Tooltip';
import { PresencePanel } from './PresencePanel';
import { Avatar } from './Avatar';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    globalSearch,
    setGlobalSearch,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead
  } = useApp();
  const userDisplayName = useAppSelector(selectUserDisplayName);
  const employee = useAppSelector(selectEmployee);
  const currentUser = useAppSelector(selectUser);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const permissionCodes = useAppSelector(selectPermissions);
  // HRMS Daily Service Report / Expense "+" menu (docs/DSR_MODULE_INTEGRATION.md)
  const hrmsDsrPerms = useMemo(
    () => getDSRPermissions(permissionCodes, !!currentUser?.is_superuser),
    [permissionCodes, currentUser]
  );
  const addMenuItems = [
    { key: 'dsr', label: 'Add DSR', icon: ClipboardCheck, to: '/daily-service-reports/new', show: hrmsDsrPerms.canCreateIndoor || hrmsDsrPerms.canCreateOutdoor },
    { key: 'assign', label: 'Assign DSR Task', icon: UserPlus, to: '/daily-service-reports/new?tab=assign', show: hrmsDsrPerms.canAssign },
    { key: 'expense', label: 'Add Expense Report', icon: FileText, to: '/daily-service-reports/new?tab=expense', show: hrmsDsrPerms.canCreateExpense },
  ].filter(i => i.show);
  const [showPresence, setShowPresence] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag size={14} className="text-blue-500" />;
      case 'system': return <ShieldAlert size={14} className="text-amber-500" />;
      case 'inventory': return <Package size={14} className="text-rose-500" />;
      case 'customer': return <MessageSquare size={14} className="text-emerald-500" />;
      case 'follow_up': return <MessageSquare size={14} className="text-blue-500" />;
      case 'new_inquiry': return <MessageSquare size={14} className="text-emerald-500" />;
      default: return <Bell size={14} className="text-slate-400" />;
    }
  };

  const handleNotificationClick = (notif: { id: string | number; link?: string; lead_id?: number | null }) => {
    markAsRead(notif.id);
    const url = notif.link || (notif.lead_id != null ? `/leads/${notif.lead_id}/edit` : undefined);
    if (url) {
      navigate(url);
      setShowNotifications(false);
    }
  };

  // Permission checks (Domains tab uses rbac.view_domain_tab)
  const hasViewDomainTab = useAppSelector(selectHasPermission('rbac.view_domain_tab'));
  const hasViewDomain = useAppSelector(selectHasPermission('marketing.view_domain'));
  const hasViewContact = useAppSelector(selectHasPermission('marketing.view_contact'));
  const hasViewLead = useAppSelector(selectHasPermission('marketing.view_lead'));
  const hasViewCampaign = useAppSelector(selectHasPermission('marketing.view_campaign'));
  const hasViewCustomer = useAppSelector(selectHasPermission('marketing.view_customer'));
  const hasViewOrganization = useAppSelector(selectHasPermission('marketing.view_organization'));
  const hasViewReport = useAppSelector(selectHasPermission('marketing.view_report'));
  const hasAdmin = useAppSelector(selectHasPermission('marketing.admin'));
  const canViewPresence = useAppSelector(selectHasPermission('presence.view_users'));

  // Order: Dashboard > Domains > Leads > Quotations > Orders > Organizations > Customers > Contacts > Reports, then rest
  const SEARCHABLE_ITEMS = useMemo(() => {
    const items = [
      { id: 'nav-1', category: 'Pages', title: 'Dashboard', icon: LayoutDashboard, href: '/', permission: undefined },
      { id: 'nav-2', category: 'Pages', title: 'Domains', icon: Globe, href: '/domains', permission: 'marketing.view_domain' },
      { id: 'nav-3', category: 'Pages', title: 'Leads', icon: Users, href: '/leads', permission: 'marketing.view_lead' },
      { id: 'nav-4', category: 'Pages', title: 'Quotations', icon: Quote, href: '/quotations', permission: 'marketing.view_lead' },
      { id: 'nav-5', category: 'Pages', title: 'Orders', icon: Package, href: '/orders', permission: 'marketing.view_lead' },
      { id: 'nav-6', category: 'Pages', title: 'Database', icon: Database, href: '/database', permission: 'marketing.view_database' },
      { id: 'nav-schema', category: 'Pages', title: 'Schema / ER diagram', icon: Database, href: '/schema', permission: 'marketing.view_lead' },
      { id: 'nav-9', category: 'Pages', title: 'Reports', icon: PieChart, href: '/reports', permission: 'marketing.view_report' },
      { id: 'nav-10', category: 'Pages', title: 'Employees', icon: Users, href: '/employees', permission: 'marketing.view_domain' },
    ];

    return items.filter(item => {
      if (!item.permission) return true;
      switch (item.permission) {
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

  const searchResults = useMemo(() => {
    const term = globalSearch.trim().toLowerCase();
    if (!term) return [];
    return SEARCHABLE_ITEMS.filter(item =>
      item.title.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  }, [globalSearch, SEARCHABLE_ITEMS]);

  return (
    <>
      <header className="h-16 sticky top-0 bg-white/5 backdrop-blur-md z-40 ml-60 px-[var(--ui-padding)] flex items-center justify-between relative transition-all duration-300">
      <div className="absolute bottom-0 left-[var(--ui-padding)] right-[var(--ui-padding)] h-px bg-slate-200/50" />
      <div className="flex-1 max-w-lg relative">
        <SearchInput
          ref={searchInputRef}
          placeholder="Search leads, contacts, orders, pages… (⌘K)"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onClear={() => setGlobalSearch('')}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          rightElement={(
            <>
              <Command size={10} />
              <span className="text-[10px] font-bold uppercase">K</span>
            </>
          )}
          className="!h-9 !bg-slate-50/50 !border-slate-200/50 focus:!bg-white focus:!border-blue-500/30 transition-all font-medium"
        />

        {isSearchFocused && globalSearch.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <GlobalSearchResults
              query={globalSearch}
              pages={searchResults}
              onPick={(href) => { navigate(href); setGlobalSearch(''); setIsSearchFocused(false); }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {addMenuItems.length > 0 && (
          <div className="relative" ref={addMenuRef}>
            <Tooltip content="Add Task">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className={`p-2 rounded-xl transition-all active:scale-95 ${showAddMenu ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/70'}`}
                aria-label="Add Task"
                aria-expanded={showAddMenu}
              >
                <SquarePlus size={18} strokeWidth={2} />
              </button>
            </Tooltip>
            {showAddMenu && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 py-2">
                {addMenuItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setShowAddMenu(false); navigate(item.to); }}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <item.icon size={17} strokeWidth={1.75} className="text-slate-400" />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => { setShowAddMenu(false); navigate('/daily-service-reports'); }}
                    className="w-full py-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-2 justify-center"
                  >
                    View my reports <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${showNotifications ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-blue-50/50 border-blue-100 text-blue-600 hover:bg-blue-50'}`}
          >
            <Bell size={16} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className={`text-sm font-semibold ${showNotifications ? 'text-blue-50' : 'text-blue-600'}`}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-semibold text-slate-500">Notifications</span>
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-tight"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={String(notif.id)}
                      onClick={() => handleNotificationClick(notif)}
                      className="px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-3 items-start border-b border-slate-50 last:border-0"
                    >
                      <div className="shrink-0 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[11px] truncate tracking-tight ${notif.read ? 'text-slate-500' : 'text-slate-900 font-bold'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <div className="w-1 h-1 rounded-full bg-blue-600 shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-300">
                    <p className="text-[10px] font-medium uppercase tracking-widest">No updates found</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                <button
                  onClick={() => { navigate('/reports'); setShowNotifications(false); }}
                  className="w-full py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center gap-2 justify-center"
                >
                  Full Activity Log <ArrowRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
        {canViewPresence && (
          <Tooltip content="Who's online">
            <button
              onClick={() => setShowPresence(!showPresence)}
              className={`relative p-2 transition-all rounded-lg ${
                showPresence ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Who's online"
            >
              <Users size={20} strokeWidth={1.5} />
              <span className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          </Tooltip>
        )}
        <Tooltip content="Support & Tickets">
          <button onClick={() => navigate('/support')} className="p-2 text-slate-400 hover:text-blue-600 transition-all rounded-lg hover:bg-blue-50">
            <Ticket size={20} strokeWidth={1.5} />
          </button>
        </Tooltip>
        <button onClick={() => navigate('/settings')} className="p-2 text-slate-400 hover:text-slate-900 transition-all rounded-lg hover:bg-slate-100">
          <Settings size={20} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-2">
            <Avatar
              src={resolveHrmsMediaUrl(employee?.profile_picture || currentUser?.profile_picture)}
              name={userDisplayName}
              className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs border-2 border-white shadow-sm"
            />
            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold text-slate-900">{userDisplayName}</p>
              {employee?.designation && (
                <p className="text-[10px] text-slate-500">{employee.designation}</p>
              )}
            </div>
          </div>
          <button
            onClick={async () => {
              await dispatch(logout());
              navigate('/login');
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
            title="Logout"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
      {canViewPresence && (
        <PresencePanel open={showPresence} onClose={() => setShowPresence(false)} />
      )}
    </>
  );
};

export default Navbar;
