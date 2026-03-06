
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Settings, 
  PieChart, 
  HelpCircle,
  Package,
  FileText,
  Quote,
  UserCircle,
  Globe,
  Hash,
  Building2,
  Database
} from 'lucide-react';
import { NavItem, StatItem, Transaction } from './types';

// Order: Dashboard > Domain > Leads > Quotation > Orders > Database (Orgs/Customers/Contacts) > Reports, then rest
// Permission codes must match HRMS /api/rbac/user/info/
// marketing.view_database = show if user has any of view_organization, view_customer, view_contact (handled in Sidebar)
export const SIDEBAR_LINKS: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/', permission: undefined },
  { title: 'Domains', icon: Globe, href: '/domains', permission: 'rbac.view_domain_tab' },
  { title: 'Leads', icon: Users, href: '/leads', permission: 'marketing.view_lead' },
  { title: 'Quotations', icon: Quote, href: '/quotations', permission: 'marketing.view_lead' },
  { title: 'Orders', icon: Package, href: '/orders', permission: 'marketing.view_lead' },
  { title: 'Database', icon: Database, href: '/database', permission: 'marketing.view_database' },
  { title: 'Reports', icon: PieChart, href: '/reports', permission: 'marketing.view_report' },
  // { title: 'Employees', icon: Users, href: '/employees', permission: 'marketing.view_domain' },
  { title: 'Invoices', icon: FileText, href: '/invoices', permission: 'marketing.admin' },
  { title: 'Numbering Series', icon: Hash, href: '/numbering-series', permission: 'marketing.admin' },
];

/** localStorage key for the default lead number series (assign from Leads page "Number series" button). */
export const DEFAULT_LEAD_SERIES_STORAGE_KEY = 'marketing_default_lead_series_code';

export const SECONDARY_LINKS: NavItem[] = [
  { title: 'Settings', icon: Settings, href: '/settings' },
  { title: 'Support', icon: HelpCircle, href: '/support' },
];

// Dashboard stats are now loaded dynamically in DashboardPage (marketing API)
export const DASHBOARD_STATS: StatItem[] = [];

export const RECENT_TRANSACTIONS: Transaction[] = [
  { id: '1', customer: 'Liam Johnson', email: 'liam@example.com', amount: '$250.00', status: 'Completed', date: '2023-06-23' },
  { id: '2', customer: 'Olivia Smith', email: 'olivia@example.com', amount: '$150.00', status: 'Pending', date: '2023-06-24' },
  { id: '3', customer: 'Noah Williams', email: 'noah@example.com', amount: '$350.00', status: 'Completed', date: '2023-06-25' },
  { id: '4', customer: 'Emma Brown', email: 'emma@example.com', amount: '$450.00', status: 'Canceled', date: '2023-06-26' },
  { id: '5', customer: 'James Wilson', email: 'james@example.com', amount: '$550.00', status: 'Completed', date: '2023-06-27' },
];

export const CHART_DATA = [
  { name: 'Jan', revenue: 4000, target: 2400 },
  { name: 'Feb', revenue: 3000, target: 1398 },
  { name: 'Mar', revenue: 2000, target: 9800 },
  { name: 'Apr', revenue: 2780, target: 3908 },
  { name: 'May', revenue: 1890, target: 4800 },
  { name: 'Jun', revenue: 2390, target: 3800 },
  { name: 'Jul', revenue: 3490, target: 4300 },
];

// Name title/salutation options (displayed before person name everywhere)
export const NAME_PREFIXES: { value: string; label: string }[] = [
  { value: '', label: '—' },
  { value: 'Mr.', label: 'Mr.' },
  { value: 'Mrs.', label: 'Mrs.' },
  { value: 'Ms.', label: 'Ms.' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Dr.', label: 'Dr.' },
  { value: 'Prof.', label: 'Prof.' },
  { value: 'Eng.', label: 'Eng.' },
  { value: 'Sir', label: 'Sir' },
  { value: 'Madam', label: 'Madam' },
];

// Country calling codes with flags (from country-list-with-dial-code-and-flag)
export { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText } from './lib/country-codes';
