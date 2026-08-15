import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { useRoleDashboardSummary } from './useRoleDashboardSummary';
import { EmployeeDashboard } from './EmployeeDashboard';
import { RegionHeadDashboard } from './RegionHeadDashboard';
import { DomainHeadDashboard } from './DomainHeadDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import type { DashboardRole, RoleDashboardSummary } from '../../lib/marketing-api';
import { cn } from '../../lib/utils';

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

function renderDashboard(role: DashboardRole, data: RoleDashboardSummary) {
  switch (role) {
    case 'super_admin':
      return <SuperAdminDashboard data={data} />;
    case 'domain_head':
      return <DomainHeadDashboard data={data} />;
    case 'region_head':
      return <RegionHeadDashboard data={data} />;
    case 'employee':
    default:
      return <EmployeeDashboard data={data} />;
  }
}

function formatLastUpdated(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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
      </div>
    );
  }

  // Only Super Admin gets the switcher — everyone else just sees their own dashboard.
  const isSuperAdmin = data.dashboard_role === 'super_admin';
  const activeRole = isSuperAdmin ? (previewRole ?? 'super_admin') : data.dashboard_role;

  const lastUpdatedControl = (
    <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
      {lastUpdated && <span>Updated {formatLastUpdated(lastUpdated)}</span>}
      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );

  return (
    <div>
      {isSuperAdmin ? (
        <div className="flex items-center justify-between gap-3 mb-4 px-1 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <LayoutDashboard size={14} />
              Preview:
            </div>
            <div className="inline-flex items-center gap-0.5 p-1 bg-slate-100 rounded-xl">
              {PREVIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreviewRole(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                    activeRole === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {activeRole !== 'super_admin' && (
              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                Previewing the {PREVIEW_OPTIONS.find((o) => o.value === activeRole)?.label} layout with your own (org-wide) data — not that role's actual scoped numbers
              </span>
            )}
          </div>
          {lastUpdatedControl}
        </div>
      ) : (
        <div className="flex items-center justify-end mb-4 px-1">
          {lastUpdatedControl}
        </div>
      )}
      {renderDashboard(activeRole, data)}
    </div>
  );
};

export const RoleDashboardRouter: React.FC = () => {
  if (!DASHBOARD_LIVE) {
    return <div className="text-sm text-slate-400">Dashboard is in development</div>;
  }
  return <RoleDashboardRouterLive />;
};
