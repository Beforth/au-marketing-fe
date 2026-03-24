
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
  lead_id?: number | null;
}

/** Legacy widget ids (for backward compat when loading saved layouts). */
export type WidgetId =
  | 'leads-by-region'
  | 'target-card'
  | 'head-summary'
  | 'target-achieved-chart'
  | 'won-lost-chart'
  | 'leads-by-status-chart'
  | 'inquiries-quotations-chart'
  | 'revenue-chart'
  | 'goal-chart'
  | 'activity-table'
  | 'global-reach'
  | string;

/** Widget types you can add from "Add widget" (code = type identifier). */
export type DashboardWidgetType =
  | 'stat'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'table'
  | 'custom_code'
  | 'quick_links'
  | 'leads-by-region'
  | 'target-card'
  | 'head-summary'
  | 'target-achieved-chart'
  | 'won-lost-chart'
  | 'leads-by-status-chart'
  | 'inquiries-quotations-chart'
  | 'revenue-chart'
  | 'goal-chart'
  | 'activity-table'
  | 'global-reach'
  | 'custom_sql';

export interface WidgetConfig {
  id: string;
  type?: DashboardWidgetType;
  span: 1 | 2 | 3;
  title?: string;
  /** Optional code or config (e.g. for custom_code widget, or SQL for custom_sql). */
  code?: string;
  /** Chart type for custom_sql: line | bar | pie | number-card | card | table | area */
  chart_type?: string;
}
