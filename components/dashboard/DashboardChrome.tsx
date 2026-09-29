import React, { createContext, useContext } from 'react';

/**
 * Page-level controls that used to sit in a bar above the dashboard — "Updated … · Refresh" and the
 * Super Admin role-preview switcher. RoleDashboardRouter provides them; DashboardHero shows them
 * inside the banner, so every role dashboard gets them without extra props.
 */
export interface DashboardChrome {
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
  /** Super Admin only: preview another role's layout. */
  preview?: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    /** Shown while previewing someone else's layout. */
    notice?: string;
  };
}

export const DashboardChromeContext = createContext<DashboardChrome | null>(null);
export const useDashboardChrome = () => useContext(DashboardChromeContext);

export function formatLastUpdated(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export const DashboardChromeProvider: React.FC<{ value: DashboardChrome; children: React.ReactNode }> = ({ value, children }) => (
  <DashboardChromeContext.Provider value={value}>{children}</DashboardChromeContext.Provider>
);
