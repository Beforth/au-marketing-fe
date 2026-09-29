import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useRoleDashboardSummary } from './useRoleDashboardSummary';
import { EmployeeDashboard } from './EmployeeDashboard';
import { RegionHeadDashboard } from './RegionHeadDashboard';
import { DomainHeadDashboard } from './DomainHeadDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import type { DashboardRole, RoleDashboardSummary } from '../../lib/marketing-api';
import { DashboardChrome, DashboardChromeProvider } from '../../components/dashboard/DashboardChrome';

// Flip to true when the new role dashboards are ready to go live for everyone.
// While false, every user (including Super Admin) sees the "in development" screen
// below instead — these files are being pushed to production ahead of the feature
// itself being finished, so this keeps it invisible until it's actually ready.
const DASHBOARD_LIVE = true;

const PREVIEW_OPTIONS: { value: DashboardRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'domain_head', label: 'Domain Head' },
  { value: 'region_head', label: 'Region Head' },
  { value: 'employee', label: 'Employee' },
];

function renderDashboard(role: DashboardRole, data: RoleDashboardSummary, onRefresh: () => void) {
  switch (role) {
    case 'super_admin':
      return <SuperAdminDashboard data={data} onRefresh={onRefresh} />;
    case 'domain_head':
      return <DomainHeadDashboard data={data} onRefresh={onRefresh} />;
    case 'region_head':
      return <RegionHeadDashboard data={data} onRefresh={onRefresh} />;
    case 'employee':
    default:
      return <EmployeeDashboard data={data} onRefresh={onRefresh} />;
  }
}

const RoleDashboardRouterLive: React.FC = () => {
  const { data, loading, refreshing, error, lastUpdated, refresh } = useRoleDashboardSummary();
  const [previewRole, setPreviewRole] = useState<DashboardRole | null>(null);
  // Re-render periodically so "X min ago" stays current without needing a fresh fetch.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-slate-400">
        <ShieldAlert size={28} />
        <p className="text-sm font-medium">{error || 'Could not load dashboard'}</p>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300"
        >
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    );
  }

  // Only Super Admin gets the switcher — everyone else just sees their own dashboard.
  const isSuperAdmin = data.dashboard_role === 'super_admin';
  const activeRole = isSuperAdmin ? (previewRole ?? 'super_admin') : data.dashboard_role;

  // "Updated … · Refresh" and the Super Admin preview switcher live inside the banner (DashboardHero).
  const previewLabel = PREVIEW_OPTIONS.find((o) => o.value === activeRole)?.label;
  const chrome: DashboardChrome = {
    lastUpdated,
    refreshing,
    onRefresh: refresh,
    preview: isSuperAdmin
      ? {
          options: PREVIEW_OPTIONS,
          value: activeRole,
          onChange: (v) => setPreviewRole(v as DashboardRole),
          notice: activeRole !== 'super_admin'
            ? `Previewing the ${previewLabel} layout with your own (org-wide) data — not that role's actual scoped numbers`
            : undefined,
        }
      : undefined,
  };

  return (
    <DashboardChromeProvider value={chrome}>
      {renderDashboard(activeRole, data, refresh)}
    </DashboardChromeProvider>
  );
};

export const RoleDashboardRouter: React.FC = () => {
  if (!DASHBOARD_LIVE) {
    return <div className="text-sm text-slate-400">Dashboard is in development</div>;
  }
  return <RoleDashboardRouterLive />;
};
