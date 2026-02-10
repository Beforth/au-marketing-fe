
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
  Hash
} from 'lucide-react';
import { NavItem, StatItem, Transaction } from './types';

// Marketing module navigation links – permission codes must match HRMS /api/rbac/user/info/ response
export const SIDEBAR_LINKS: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/', permission: undefined },
  { title: 'Employees', icon: Users, href: '/employees', permission: 'marketing.view_domain' },
  { title: 'Domains', icon: Globe, href: '/domains', permission: 'marketing.view_domain' },
  { title: 'Contacts', icon: UserCircle, href: '/contacts', permission: 'marketing.view_contact' },
  { title: 'Leads', icon: Users, href: '/leads', permission: 'marketing.lead.view' },
  { title: 'Quotations', icon: Quote, href: '/quotations', permission: 'marketing.lead.view' },
  // { title: 'Campaigns', icon: ShoppingBag, href: '/campaigns', permission: 'marketing.campaign.view' },
  { title: 'Customers', icon: Users, href: '/customers', permission: 'marketing.customer.view' },
  { title: 'Reports', icon: PieChart, href: '/reports', permission: 'marketing.reports.view' },
  { title: 'Invoices', icon: FileText, href: '/invoices', permission: 'marketing.view_invoice' },
  { title: 'Numbering Series', icon: Hash, href: '/numbering-series', permission: 'marketing.series.view' },
];

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
