import React, { useEffect, useState } from 'react';
import { Shield, KeyRound, Star, AlertCircle, RefreshCw, Lock } from 'lucide-react';
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

const TYPE_FILL: Record<string, string> = {
  admin: 'bg-rose-500', manager: 'bg-amber-500', sales: 'bg-blue-500', crm: 'bg-blue-500', marketing: 'bg-emerald-500', employee: 'bg-slate-400',
};
const getTypeFill = (role_type: string) => TYPE_FILL[Object.keys(TYPE_FILL).find((k) => role_type?.toLowerCase().includes(k)) ?? 'employee'];

function getRoleTypeColor(role_type: string) {
  const key = Object.keys(ROLE_TYPE_COLORS).find(k => role_type?.toLowerCase().includes(k));
  return key ? ROLE_TYPE_COLORS[key] : ROLE_TYPE_COLORS.employee;
}

const LEVEL_TITLE: Record<number, string> = { 1: 'Entry', 2: 'Standard', 3: 'Manager', 4: 'Senior', 5: 'Admin' };
const levelTitle = (level: number) => LEVEL_TITLE[level] ?? `Level ${level}`;

/** Five small steps, filled up to the role's level, so the hierarchy reads at a glance. */
const LevelBar: React.FC<{ level: number; fill: string }> = ({ level, fill }) => (
  <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Level ${level} of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} className={`h-1.5 w-3.5 rounded-full ${n <= level ? fill : 'bg-slate-200'}`} />
    ))}
  </span>
);

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

  // Highest level first; roles inside a level sorted by name.
  const levelGroups = Object.entries(
    roles.reduce<Record<number, MarketingRole[]>>((acc, r) => { (acc[r.level] ||= []).push(r); return acc; }, {}),
  )
    .map(([lvl, list]) => [Number(lvl), [...list].sort((x, y) => x.name.localeCompare(y.name))] as [number, MarketingRole[]])
    .sort((a, b) => b[0] - a[0]);
  const maxPerms = Math.max(1, ...roles.map((r) => r.permission_count ?? 0));

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

      {/* Roles, grouped by level (highest first) */}
      {!loading && !error && roles.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Roles', value: roles.length, tone: 'text-slate-900' },
              { label: 'System roles', value: roles.filter((r) => r.is_system_role).length, tone: 'text-amber-600' },
              { label: 'Custom roles', value: roles.filter((r) => !r.is_system_role).length, tone: 'text-blue-600' },
              { label: 'Highest level', value: `L${Math.max(...roles.map((r) => r.level || 0))}`, tone: 'text-rose-600' },
            ].map((t) => (
              <div key={t.label} className="rounded-xl border border-slate-200/70 bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t.label}</p>
                <p className={`text-2xl font-bold tabular-nums leading-tight ${t.tone}`}>{t.value}</p>
              </div>
            ))}
          </div>

          {levelGroups.map(([level, group]) => (
            <section key={level} className="mb-7" aria-label={`Level ${level} roles`}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">L{level} · {levelTitle(level)}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{group.length}</span>
                <span className="h-px flex-1 bg-slate-200/70" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.map((role) => {
                  const color = getRoleTypeColor(role.role_type ?? '');
                  const fill = getTypeFill(role.role_type ?? '');
                  const perms = role.permission_count ?? 0;
                  return (
                    <div key={role.id} className="group flex flex-col rounded-xl border border-slate-200/70 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <div className="mb-3 flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${color.bg} ${color.border}`}>
                          <Shield size={18} className={color.text} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold tracking-tight text-slate-900" title={role.name}>{role.name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <LevelBar level={role.level} fill={fill} />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">L{role.level}</span>
                          </div>
                        </div>
                        {role.is_system_role && (
                          <Tooltip content="System role">
                            <span className="shrink-0">
                              <Star size={14} className="fill-amber-300 text-amber-400" />
                            </span>
                          </Tooltip>
                        )}
                      </div>

                      <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-[12px] leading-5 text-slate-500">
                        {role.description || <span className="text-slate-300">No description</span>}
                      </p>

                      <div className="mt-auto">
                        <div className="mb-1.5 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 font-medium text-slate-500">
                            <KeyRound size={12} className="text-slate-400" /> Permissions
                          </span>
                          <span className="font-semibold tabular-nums text-slate-800">{perms}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.max(perms > 0 ? 6 : 0, (perms / maxPerms) * 100)}%` }} />
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${color.bg} ${color.text} ${color.border}`}>
                            {role.role_type ?? 'role'}
                          </span>
                          <span className="text-[10px] text-slate-400">{role.is_system_role ? 'System' : 'Custom'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </PageLayout>
  );
};
