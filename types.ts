
// Fixed: Added React import to resolve 'Cannot find namespace React' errors
import React from 'react';

export interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  permission?: string; // Optional permission code required to see this item
}

export interface StatItem {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}

export interface Transaction {
  id: string;
  customer: string;
  email: string;
  amount: string;
  status: 'Completed' | 'Pending' | 'Canceled';
  date: string;
}

export interface AppNotification {
  id: string | number;
  title: string;
  message: string;
  time?: string;
  type: 'order' | 'system' | 'inventory' | 'customer' | 'follow_up' | 'new_inquiry';
  read: boolean;
  link?: string;
}

export type WidgetId = 'revenue-chart' | 'goal-chart' | 'activity-table' | 'global-reach';

export interface WidgetConfig {
  id: WidgetId;
  span: 1 | 2 | 3;
}
