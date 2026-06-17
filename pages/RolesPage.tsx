import React, { useEffect, useState } from 'react';
import { Shield, Users, Star, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { hrmsRBACClient, MarketingRole } from '../lib/hrms-rbac';
import { Tooltip } from '../UI/Tooltip';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const ROLE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  admin:     { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  manager:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  sales:     { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200' },
  crm:       { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200' },
  marketing: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  employee:  { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200' },
};

function getRoleTypeColor(role_type: string) {
  const key = Object.keys(ROLE_TYPE_COLORS).find(k => role_type?.toLowerCase().includes(k));
  return key ? ROLE_TYPE_COLORS[key] : ROLE_TYPE_COLORS.employee;
}

function getLevelLabel(level: number): string {
  switch (level) {
    case 1: return 'L1 — Entry';
    case 2: return 'L2 — Standard';
    case 3: return 'L3 — Manager';
    case 4: return 'L4 — Senior';
    case 5: return 'L5 — Admin';
    default: return `L${level}`;
  }
}

export const RolesPage: React.FC = () => {
  const canView = useAppSelector(selectHasPermission('marketing.admin'));
  const [roles, setRoles] = useState<MarketingRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await hrmsRBACClient.getMarketingRoles();
      setRoles(result);
    } catch (e) {
      setError('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchRoles();
    }
  }, [canView]);

  if (!canView) {
    return (
      <PageLayout title="Marketing Roles" breadcrumbs={[{ label: 'Roles', href: '/roles' }]}>
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view marketing roles.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.admin</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const actions = (
    <Button
      variant="outline"
      size="sm"
      onClick={fetchRoles}
      isLoading={loading}
      leftIcon={!loading ? <RefreshCw size={13} /> : undefined}
    >
      Refresh
    </Button>
  );

  return (
    <PageLayout
      title="Marketing Roles"
      breadcrumbs={[{ label: 'Roles', href: '/roles' }]}
      description="RBAC role definitions scoped to Marketing"
      actions={actions}
    >
      {/* Loading */}
      {loading && (
        <div className="py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-4 text-slate-500 font-medium text-sm">Loading marketing roles...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
            <AlertCircle size={22} className="text-rose-500" />
          </div>
          <p className="text-[13px] font-semibold text-slate-700">{error}</p>
          <Button
            size="sm"
            onClick={fetchRoles}
            className="mt-1"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && roles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Lock size={22} className="text-slate-400" />
          </div>
          <p className="text-[13px] font-semibold text-slate-600">No marketing roles found</p>
          <p className="text-[11px] text-slate-400">Roles are managed in the HRMS system.</p>
        </div>
      )}

      {/* Roles Grid */}
      {!loading && !error && roles.length > 0 && (
        <>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
            {roles.length} role{roles.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map(role => {
              const color = getRoleTypeColor(role.role_type ?? '');
              return (
                <div
                  key={role.id}
                  className="bg-white rounded-xl border border-slate-200/60 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  {/* Role Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${color.bg} ${color.border}`}>
                      <Shield size={16} className={color.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-slate-900 truncate tracking-tight">{role.name}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{getLevelLabel(role.level)}</p>
                    </div>
                    {role.is_system_role && (
                      <Tooltip content="System role">
                        <span className="flex-shrink-0">
                          <Star size={13} className="text-amber-400 fill-amber-300" />
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  {/* Description */}
                  {role.description && (
                    <p className="text-[12px] text-slate-500 mb-3 line-clamp-2">{role.description}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${color.bg} ${color.text} ${color.border}`}>
                      {role.role_type ?? 'role'}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Users size={12} className="text-slate-400" />
                      {role.permission_count ?? 0} permissions
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </PageLayout>
  );
};
