import React, { useState } from 'react';
import { RefreshCw, ShieldAlert, LayoutDashboard, Construction } from 'lucide-react';
import { useRoleDashboardSummary } from './useRoleDashboardSummary';
import { EmployeeDashboard } from './EmployeeDashboard';
import { RegionHeadDashboard } from './RegionHeadDashboard';
import { DomainHeadDashboard } from './DomainHeadDashboard';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import type { DashboardRole } from '../../lib/marketing-api';
import { cn } from '../../lib/utils';

// Flip to true when the new role dashboards are ready to go live for everyone.
// While false, every user (including Super Admin) sees the "in development" screen
// below instead — these files are being pushed to production ahead of the feature
// itself being finished, so this keeps it invisible until it's actually ready.
const DASHBOARD_LIVE = false;

const PREVIEW_OPTIONS: { value: DashboardRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'domain_head', label: 'Domain Head' },
  { value: 'region_head', label: 'Region Head' },
  { value: 'employee', label: 'Employee' },
];

function renderDashboard(role: DashboardRole, data: Parameters<typeof EmployeeDashboard>[0]['data']) {
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

const DashboardInDevelopment: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-6">
    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
      <Construction size={26} />
    </div>
    <div>
      <h2 className="text-lg font-bold text-slate-900">Dashboard is in development</h2>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">
        We're actively rebuilding this page. It'll be back shortly — thanks for your patience.
      </p>
    </div>
  </div>
);

const RoleDashboardRouterLive: React.FC = () => {
  const { data, loading, error } = useRoleDashboardSummary();
  const [previewRole, setPreviewRole] = useState<DashboardRole | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-slate-400">
        <RefreshCw size={24} className="animate-spin" />
        <p className="text-sm font-medium">Loading your dashboard…</p>
      </div>
    );
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

  return (
    <div>
      {isSuperAdmin && (
        <div className="flex items-center gap-3 mb-4 px-1">
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
      )}
      {renderDashboard(activeRole, data)}
    </div>
  );
};

export const RoleDashboardRouter: React.FC = () => {
  if (!DASHBOARD_LIVE) {
    return <DashboardInDevelopment />;
  }
  return <RoleDashboardRouterLive />;
};
