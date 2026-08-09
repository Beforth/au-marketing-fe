/**
 * Domains Management Page
 * Manage marketing domains (Domestic, Export, etc.)
 * List view: table of domains/regions. Review view: hierarchy of domain heads → region heads → region employees with edit actions.
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Select } from '../components/ui/Select';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { FilterPopover } from '../components/ui/FilterPopover';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Edit, Trash2, Globe, CheckCircle, XCircle, MapPin, ChevronDown, ChevronRight, Filter, X, Users, UserPlus, User } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectUser, selectEmployee } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { marketingAPI, Domain, Region, AssignmentWithEmployee, HRMSEmployee, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, DomainTargetSummaryResponse, MarketingSettingsPayload, ScopeTargetStats, PastQuarterAccess } from '../lib/marketing-api';
import { Target, List, Eye, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { Switch } from '../UI/Switch';
import { getStoredMarketingScope } from '../lib/marketing-scope';
import { Tooltip } from '../UI/Tooltip';



type TargetHierarchyModal =
  | { kind: 'employee'; employee_id: number; employee_name: string; region_id: number; current_amount: number }
  | { kind: 'region'; region_id: number; region_name: string; rolled_up: number; assigned: number | null | undefined }
  | { kind: 'domain'; domain_id: number; domain_name: string; rolled_up: number; assigned: number | null | undefined };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCurrentYearMonth(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const ONE_LAKH = 1_00_000;
const ONE_CRORE = 1_00_00_000;

function formatTargetAmount(amount: number): string {
  if (amount >= ONE_CRORE) return `₹${(amount / ONE_CRORE).toFixed(2)} Cr`;
  if (amount >= ONE_LAKH) return `₹${(amount / ONE_LAKH).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function checkManagementRoleOrQuarterAccess(
  user: any,
  employee: any,
  q: string,
  candidateUserIds: number[],
  pastQuarterAccessList: PastQuarterAccess[]
): boolean {
  if (user?.is_superuser || user?.is_staff || employee?.is_superuser || employee?.is_staff) return true;

  const normalizeRole = (r: string) => r.trim().toLowerCase().replace(/[\s-]+/g, '_');

  const rawRoles: string[] = [];
  if (Array.isArray(user?.roles)) {
    for (const r of user.roles) {
      if (typeof r === 'string') rawRoles.push(normalizeRole(r));
      else if (r && typeof r === 'object') rawRoles.push(normalizeRole(String(r.name || r.code || '')));
    }
  }
  if (user?.primary_role) rawRoles.push(normalizeRole(String(user.primary_role)));
  if (user?.role_name) rawRoles.push(normalizeRole(String(user.role_name)));
  if (typeof user?.role === 'string') rawRoles.push(normalizeRole(user.role));
  if (typeof employee?.role === 'string') rawRoles.push(normalizeRole(employee.role));
  if (Array.isArray(employee?.roles)) {
    for (const r of employee.roles) {
      if (typeof r === 'string') rawRoles.push(normalizeRole(r));
      else if (r && typeof r === 'object') rawRoles.push(normalizeRole(String(r.name || r.code || '')));
    }
  }
  const scopeRole = getStoredMarketingScope()?.role;
  if (scopeRole) rawRoles.push(normalizeRole(String(scopeRole)));

  const managementRoles = ['domain_head', 'domain_coordinator', 'region_head', 'admin', 'super_admin', 'superadmin'];
  if (rawRoles.some(r => managementRoles.includes(r))) {
    return true;
  }

  return pastQuarterAccessList.some(a => {
    if (a.quarter !== q) return false;
    const allowedIds = [
      ...(a.user_ids || []),
      ...((a as any).user_details || []).map((d: any) => d.id),
    ].map(Number);
    return candidateUserIds.some(uid => allowedIds.includes(Number(uid)));
  });
}

const getProgressMessage = (
  pct: number,
  viewMode?: 'monthly' | 'quarterly' | 'yearly'
): { text: string; colorClass: string; bgClass: string; borderClass: string; iconColor: string } => {
  if (pct === 0) {
    return {
      text: "Let's kickstart this period! Every lead counts! 🚀",
      colorClass: "text-slate-700",
      bgClass: "bg-slate-50/50",
      borderClass: "border-slate-100",
      iconColor: "text-slate-400"
    };
  }

  if (viewMode === 'yearly') {
    if (pct < 25) {
      return {
        text: "Off to a good start! Let's target the Q1 milestone! 📈",
        colorClass: "text-amber-700",
        bgClass: "bg-amber-50/50",
        borderClass: "border-amber-100",
        iconColor: "text-amber-500"
      };
    }
    if (pct < 50) {
      return {
        text: "Q1 Milestone unlocked! Keep pushing to reach the halfway Q2 target! ⚡",
        colorClass: "text-blue-700",
        bgClass: "bg-blue-50/50",
        borderClass: "border-blue-100",
        iconColor: "text-blue-500"
      };
    }
    if (pct < 75) {
      return {
        text: "Q2 Milestone unlocked! Over halfway there, keep up the momentum! ✨",
        colorClass: "text-violet-700",
        bgClass: "bg-violet-50/50",
        borderClass: "border-violet-100",
        iconColor: "text-violet-500"
      };
    }
    if (pct < 100) {
      return {
        text: "Q3 Milestone unlocked! Just a final stretch to achieve the yearly goal! 🎯",
        colorClass: "text-teal-700",
        bgClass: "bg-teal-50/50",
        borderClass: "border-teal-100",
        iconColor: "text-teal-500"
      };
    }
    return {
      text: "Full Yearly Target achieved! Outstanding performance! 🏆🎉",
      colorClass: "text-emerald-700",
      bgClass: "bg-emerald-50/50",
      borderClass: "border-emerald-100",
      iconColor: "text-emerald-500"
    };
  }

  if (pct < 25) {
    return {
      text: "Good start! Keep pushing and follow up on active leads! 💪",
      colorClass: "text-amber-700",
      bgClass: "bg-amber-50/50",
      borderClass: "border-amber-100",
      iconColor: "text-amber-500"
    };
  }
  if (pct < 50) {
    return {
      text: "Great progress! Almost halfway to the target! 👍",
      colorClass: "text-blue-700",
      bgClass: "bg-blue-50/50",
      borderClass: "border-blue-100",
      iconColor: "text-blue-500"
    };
  }
  if (pct < 75) {
    return {
      text: "Over halfway there! Excellent momentum, keep it up! ✨",
      colorClass: "text-violet-700",
      bgClass: "bg-violet-50/50",
      borderClass: "border-violet-100",
      iconColor: "text-violet-500"
    };
  }
  if (pct < 100) {
    return {
      text: "So close to the finish line! Just a little more effort! 🎯",
      colorClass: "text-teal-700",
      bgClass: "bg-teal-50/50",
      borderClass: "border-teal-100",
      iconColor: "text-teal-500"
    };
  }
  return {
    text: "Target achieved! Outstanding performance! 🏆🎉",
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50/50",
    borderClass: "border-emerald-100",
    iconColor: "text-emerald-500"
  };
};

const getBarGradient = (pct: number): string => {
  if (pct === 0) return "from-slate-300 to-slate-400";
  if (pct < 25) return "from-sky-500 to-blue-600";
  if (pct < 50) return "from-blue-600 via-blue-500 to-purple-600";
  if (pct < 75) return "from-purple-600 via-fuchsia-500 to-rose-500";
  if (pct < 100) return "from-rose-500 via-orange-500 to-amber-500";
  return "from-emerald-500 via-teal-400 to-yellow-400 animate-pulse";
};

/** Gradient for a single quarter's bar segment: emerald at target, the app's original ≥100% gradient once past it, else the shared whole-bar gradient. */
const getSegmentGradient = (achievedVal: number, targetVal: number, fallbackPct: number): string => {
  if (targetVal > 0 && achievedVal > targetVal) return "from-emerald-500 via-teal-400 to-yellow-400";
  if (targetVal > 0 && achievedVal >= targetVal) return "from-emerald-600 to-emerald-500";
  return getBarGradient(fallbackPct);
};

/** Status/badge for a single quarter: Pending / Active / Missed / Achieved / Overachieved (teal accent, shows the surplus over target; badge glints continuously so it's always noticeable, not just on mount). */
const getQuarterStatus = (achievedVal: number, targetVal: number, state: 'past' | 'active' | 'future') => {
  if (targetVal > 0 && achievedVal > targetVal) {
    return {
      label: `+${formatTargetAmount(achievedVal - targetVal)} over target`,
      dotClass: "bg-teal-500 scale-125 shadow-[0_0_4px_rgba(20,184,166,0.6)]",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200 font-extrabold shadow-sm glint-badge"
    };
  }
  if (targetVal > 0 && achievedVal >= targetVal) {
    return {
      label: "Achieved",
      dotClass: "bg-emerald-500 scale-125 shadow-[0_0_4px_rgba(16,185,129,0.6)]",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold shadow-sm"
    };
  }
  if (state === 'active') {
    return {
      label: "Active",
      dotClass: "bg-blue-500 scale-110 animate-pulse",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200 font-bold shadow-sm"
    };
  }
  if (state === 'past') {
    return {
      label: "Missed",
      dotClass: "bg-rose-400",
      badgeClass: "bg-rose-50 text-rose-600 border-rose-100 font-semibold"
    };
  }
  return {
    label: "Pending",
    dotClass: "bg-slate-300",
    badgeClass: "bg-slate-50 text-slate-400 border-slate-200/50 font-medium"
  };
};

type RoleKey = 'domain_head' | 'domain_coordinator' | 'region_head' | 'region_coordinator' | 'employee';

// ─── Schema: single source of truth for every toggle ───────────────────────
const RULE_SCHEMA: { role: RoleKey; field: string; label: string; hint: string; default: boolean }[] = [
  // Domain Head
  { role: 'domain_head', field: 'view_other_domains',           label: 'See other domains',         hint: 'Can view data from domains other than their own.',                               default: false },
  { role: 'domain_head', field: 'view_other_regions',           label: 'See all regions',            hint: 'Can browse every region, not just the ones under their domain.',                  default: false },
  // Domain Coordinator
  { role: 'domain_coordinator', field: 'view_other_domains',    label: 'See other domains',         hint: 'Can see data from other domains, not just the one they\'re assigned to.',         default: false },
  { role: 'domain_coordinator', field: 'view_other_regions',    label: 'See all regions',            hint: 'Can see regions beyond just the ones in their domain.',                           default: true  },
  { role: 'domain_coordinator', field: 'view_region_targets',   label: 'See region targets',         hint: 'Can check how much each region is targeting this period.',                        default: true  },
  { role: 'domain_coordinator', field: 'view_employee_targets', label: 'See employee targets',       hint: 'Can see each salesperson\'s individual target across the domain.',                default: true  },
  // Region Head
  { role: 'region_head', field: 'view_other_regions',           label: 'See other regions',         hint: 'Can peek at sibling regions within the same domain, not just their own.',         default: false },
  { role: 'region_head', field: 'view_domain_head_name',        label: 'See domain head\'s name',   hint: 'Knows who the Domain Head above them is.',                                       default: true  },
  { role: 'region_head', field: 'view_domain_target',           label: 'See domain-level target',   hint: 'Can see the combined target for the whole domain, not just their region.',         default: false },
  // Region Coordinator
  { role: 'region_coordinator', field: 'view_other_regions',    label: 'See other regions',         hint: 'Can view sibling regions, not just the one they\'re assigned to.',                default: false },
  { role: 'region_coordinator', field: 'view_domain_head_name', label: 'See domain head\'s name',   hint: 'Knows who the Domain Head above them is.',                                       default: true  },
  { role: 'region_coordinator', field: 'view_domain_target',    label: 'See domain-level target',   hint: 'Can see the overall domain target, not just their region\'s number.',             default: false },
  { role: 'region_coordinator', field: 'view_employee_targets', label: 'See employee targets',       hint: 'Can see what target each salesperson in their region is chasing.',                default: true  },
  // Employee
  { role: 'employee', field: 'view_own_target',                 label: 'See own target',            hint: 'Can see the sales target that was set for them personally.',                      default: true  },
  { role: 'employee', field: 'view_other_employee_targets',     label: 'See teammates\' targets',   hint: 'Can see what targets other employees in the same region have.',                   default: false },
  { role: 'employee', field: 'view_region_head_name',           label: 'See region head\'s name',   hint: 'Can see who their Region Head is by name.',                                      default: true  },
  { role: 'employee', field: 'view_domain_head_name',           label: 'See domain head\'s name',   hint: 'Can see who the Domain Head above them is.',                                     default: true  },
  { role: 'employee', field: 'view_region_target',              label: 'See region\'s total target', hint: 'Can see the combined target for their whole region.',                            default: false },
];

const ROLE_COLUMNS: { key: RoleKey; label: string; color: 'blue' | 'violet' }[] = [
  { key: 'domain_head',        label: 'Domain Head',        color: 'blue' },
  { key: 'domain_coordinator', label: 'Domain Coordinator', color: 'violet' },
  { key: 'region_head',        label: 'Region Head',        color: 'blue' },
  { key: 'region_coordinator', label: 'Region Coordinator', color: 'violet' },
  { key: 'employee',           label: 'Employee',           color: 'blue' },
];

// Auto-derive DEFAULT_GLOBAL_RULES from the schema so it's always in sync
const DEFAULT_GLOBAL_RULES = ROLE_COLUMNS.reduce((acc, col) => {
  acc[col.key] = RULE_SCHEMA
    .filter(r => r.role === col.key)
    .reduce((fields, r) => { fields[r.field] = r.default; return fields; }, {} as Record<string, boolean>);
  return acc;
}, {} as Record<RoleKey, Record<string, boolean>>);

// Predefined presets
const PRESETS: { id: string; label: string; description: string; color: string; rules: Record<RoleKey, Record<string, boolean>> }[] = [
  {
    id: 'strict',
    label: 'Strict Isolation',
    description: 'Maximum data isolation. Each role sees only their own scope.',
    color: 'rose',
    rules: ROLE_COLUMNS.reduce((acc, col) => {
      acc[col.key] = RULE_SCHEMA
        .filter(r => r.role === col.key)
        .reduce((f, r) => { f[r.field] = r.field === 'view_own_target' ? true : false; return f; }, {} as Record<string, boolean>);
      return acc;
    }, {} as Record<RoleKey, Record<string, boolean>>),
  },
  {
    id: 'balanced',
    label: 'Balanced (Recommended)',
    description: 'Names visible upward; targets isolated. Best for most teams.',
    color: 'blue',
    rules: {
      domain_head:        { view_other_domains: false, view_other_regions: true },
      domain_coordinator: { view_other_domains: false, view_other_regions: true, view_region_targets: true,  view_employee_targets: true  },
      region_head:        { view_other_regions: false, view_domain_head_name: true,  view_domain_target: false },
      region_coordinator: { view_other_regions: false, view_domain_head_name: true,  view_domain_target: false, view_employee_targets: true },
      employee:           { view_own_target: true, view_other_employee_targets: false, view_region_head_name: true,  view_domain_head_name: true,  view_region_target: false },
    },
  },
  {
    id: 'open',
    label: 'Open Team',
    description: 'Transparent targets and names across the hierarchy.',
    color: 'emerald',
    rules: ROLE_COLUMNS.reduce((acc, col) => {
      acc[col.key] = RULE_SCHEMA
        .filter(r => r.role === col.key)
        .reduce((f, r) => { f[r.field] = true; return f; }, {} as Record<string, boolean>);
      return acc;
    }, {} as Record<RoleKey, Record<string, boolean>>),
  },
  {
    id: 'coordinator_focus',
    label: 'Coordinator-Led',
    description: 'Coordinators get broad access; employees stay isolated.',
    color: 'amber',
    rules: {
      domain_head:        { view_other_domains: true,  view_other_regions: true  },
      domain_coordinator: { view_other_domains: false, view_other_regions: true,  view_region_targets: true,  view_employee_targets: true  },
      region_head:        { view_other_regions: false, view_domain_head_name: true,  view_domain_target: true  },
      region_coordinator: { view_other_regions: true,  view_domain_head_name: true,  view_domain_target: true,  view_employee_targets: true  },
      employee:           { view_own_target: true, view_other_employee_targets: false, view_region_head_name: true,  view_domain_head_name: false, view_region_target: false },
    },
  },
];

const areRulesMatching = (rulesA: any, rulesB: any) => {
  if (!rulesA || !rulesB) return false;
  for (const rule of RULE_SCHEMA) {
    const valA = rulesA[rule.role]?.[rule.field] ?? rule.default;
    const valB = rulesB[rule.role]?.[rule.field] ?? rule.default;
    if (valA !== valB) return false;
  }
  return true;
};

const getPresetStyle = (color: string, isActive: boolean, isModified: boolean) => {
  if (isActive) {
    const activeMap: Record<string, string> = {
      rose:    'border-rose-600 bg-rose-50/80 text-rose-800 ring-2 ring-rose-500/20 shadow-sm scale-[1.01]',
      blue:  'border-blue-600 bg-blue-50/80 text-blue-800 ring-2 ring-blue-500/20 shadow-sm scale-[1.01]',
      emerald: 'border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm scale-[1.01]',
      amber:   'border-amber-600 bg-amber-50/80 text-amber-800 ring-2 ring-amber-500/20 shadow-sm scale-[1.01]',
    };
    return activeMap[color] || activeMap.blue;
  }
  
  if (isModified) {
    const modifiedMap: Record<string, string> = {
      rose:    'border-rose-400 border-dashed bg-rose-50/30 text-rose-700 hover:border-rose-500 hover:bg-rose-50/40',
      blue:  'border-blue-400 border-dashed bg-blue-50/30 text-blue-700 hover:border-blue-500 hover:bg-blue-50/40',
      emerald: 'border-emerald-400 border-dashed bg-emerald-50/30 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50/40',
      amber:   'border-amber-400 border-dashed bg-amber-50/30 text-amber-700 hover:border-amber-500 hover:bg-amber-50/40',
    };
    return modifiedMap[color] || modifiedMap.blue;
  }

  // Inactive
  const inactiveMap: Record<string, string> = {
    rose:    'border-rose-200/80 hover:border-rose-400 hover:bg-rose-50/40 text-rose-700 bg-white',
    blue:  'border-blue-200/80 hover:border-blue-400 hover:bg-blue-50/40 text-blue-700 bg-white',
    emerald: 'border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50/40 text-emerald-700 bg-white',
    amber:   'border-amber-200/80 hover:border-amber-400 hover:bg-amber-50/40 text-amber-700 bg-white',
  };
  return inactiveMap[color] || inactiveMap.blue;
};

export const DomainsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_domain'));
  const canCreate = useAppSelector(selectHasPermission('marketing.create_domain'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_domain'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_domain'));
  const canViewRegion = useAppSelector(selectHasPermission('marketing.view_region'));
  const canCreateRegion = useAppSelector(selectHasPermission('marketing.create_region'));
  const canEditRegion = useAppSelector(selectHasPermission('marketing.edit_region'));
  const canDeleteRegion = useAppSelector(selectHasPermission('marketing.delete_region'));
  const canAssignEmployeeRegion = useAppSelector(selectHasPermission('marketing.assign_employee_region'));
  const canManageRegionEmployees = canAssignEmployeeRegion || canViewRegion || canView;

  const user = useAppSelector(selectUser);
  const employee = useAppSelector(selectEmployee);
  const isAdmin = useAppSelector(selectHasPermission('marketing.admin')) || user?.is_superuser;

  // Review view: hierarchy data
  const [reviewDomains, setReviewDomains] = useState<Domain[]>([]);
  const [reviewRegions, setReviewRegions] = useState<Region[]>([]);
  const [reviewAssignments, setReviewAssignments] = useState<AssignmentWithEmployee[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [previewRole, setPreviewRole] = useState<'super_admin' | 'domain_head' | 'region_head' | 'employee' | 'supervisor' | null>(null);

  const lastReloadRef = useRef<number>(0);

  interface ActiveScopeType {
    is_super: boolean;
    scope_type: 'super_admin' | 'domain_head' | 'region_head' | 'employee' | 'supervisor' | 'self';
    domain_ids?: number[];
    region_ids?: number[];
    region_domain_id?: number;
    employee_id?: number;
  }

  const activeScope = useMemo<ActiveScopeType>(() => {
    if (previewRole && reviewDomains.length > 0) {
      const firstDomain = reviewDomains[0];
      const firstRegion = reviewRegions.find(r => r.domain_id === firstDomain.id) || reviewRegions[0];
      
      if (previewRole === 'super_admin') {
        return { is_super: true, scope_type: 'super_admin' };
      } else if (previewRole === 'domain_head') {
        const regionIds = reviewRegions.filter(r => r.domain_id === firstDomain.id).map(r => r.id);
        return {
          is_super: false,
          scope_type: 'domain_head',
          domain_ids: [firstDomain.id],
          region_ids: regionIds,
        };
      } else if (previewRole === 'region_head') {
        return {
          is_super: false,
          scope_type: 'region_head',
          region_ids: firstRegion ? [firstRegion.id] : [],
          region_domain_id: firstRegion?.domain_id,
        };
      } else if (previewRole === 'supervisor') {
        return {
          is_super: false,
          scope_type: 'supervisor',
          region_ids: firstRegion ? [firstRegion.id] : [],
          region_domain_id: firstRegion?.domain_id,
        };
      } else if (previewRole === 'employee') {
        const firstAssignment = reviewAssignments.find(a => a.region_id === firstRegion?.id && a.role === 'employee');
        return {
          is_super: false,
          scope_type: 'employee',
          region_ids: firstRegion ? [firstRegion.id] : [],
          region_domain_id: firstRegion?.domain_id,
          employee_id: firstAssignment?.employee_id,
        };
      }
    }
    
    const stored = getStoredMarketingScope();
    if (stored) {
      return {
        is_super: stored.role === 'super_admin',
        scope_type: stored.role,
        domain_ids: stored.domain_id ? [stored.domain_id] : [],
        region_ids: stored.region_ids || (stored.region_id ? [stored.region_id] : []),
      };
    }
    
    return { is_super: true, scope_type: 'super_admin' };
  }, [previewRole, reviewDomains, reviewRegions, reviewAssignments]);

  const filteredDomains = useMemo(() => {
    return reviewDomains.filter(domain => {
      if (activeScope.is_super) return true;
      
      if (activeScope.scope_type === 'domain_head') {
        const assignedDomainIds = activeScope.domain_ids || [];
        return assignedDomainIds.includes(domain.id);
      }
      
      if (activeScope.scope_type === 'region_head' || activeScope.scope_type === 'supervisor' || activeScope.scope_type === 'employee') {
        const domainRegions = reviewRegions.filter(r => r.domain_id === domain.id);
        const assignedRegionIds = activeScope.region_ids || [];
        return domainRegions.some(r => assignedRegionIds.includes(r.id));
      }
      
      return false;
    });
  }, [reviewDomains, reviewRegions, activeScope]);

  const getFilteredRegionsForDomain = (domain: Domain) => {
    const domainRegions = reviewRegions.filter((r) => r.domain_id === domain.id);
    if (activeScope.is_super) return domainRegions;
    
    if (activeScope.scope_type === 'domain_head') {
      const assignedDomainIds = activeScope.domain_ids || [];
      return assignedDomainIds.includes(domain.id) ? domainRegions : [];
    }
    
    if (activeScope.scope_type === 'region_head' || activeScope.scope_type === 'supervisor' || activeScope.scope_type === 'employee') {
      const assignedRegionIds = activeScope.region_ids || [];
      return domainRegions.filter(r => assignedRegionIds.includes(r.id));
    }
    
    return [];
  };

  const getFilteredAssignmentsForRegion = (region: Region) => {
    return reviewAssignments.filter((a) => a.region_id === region.id);
  };

  const isDomainTargetVisible = (domainId: number) => {
    if (activeScope.is_super) return true;
    if (activeScope.scope_type === 'domain_head') return true;
    return false;
  };

  const isRegionTargetVisible = (region: Region) => {
    if (activeScope.is_super) return true;
    if (activeScope.scope_type === 'domain_head') return true;
    if (activeScope.scope_type === 'region_head') return true;
    return false;
  };

  const getDomainHeadDisplayName = (domain: Domain) => {
    return domain.head_username || '—';
  };

  const getRegionHeadDisplayName = (region: Region) => {
    return region.head_username || '—';
  };

  const isEmployeeTargetVisible = (assignment: AssignmentWithEmployee) => {
    if (activeScope.is_super) return true;
    if (activeScope.scope_type === 'domain_head') return true;
    if (activeScope.scope_type === 'region_head') return true;
    if (activeScope.scope_type === 'supervisor') return true;
    
    const realEmployeeId = (previewRole === 'employee' && activeScope.employee_id)
      ? activeScope.employee_id
      : (employee?.id || user?.id);
    return assignment.employee_id === realEmployeeId;
  };

  const showActionButtons = activeScope.is_super || activeScope.scope_type === 'domain_head' || activeScope.scope_type === 'region_head';

  const [deleteDomainId, setDeleteDomainId] = useState<number | null>(null);
  const [deleteRegionId, setDeleteRegionId] = useState<number | null>(null);

  // Modals: set domain head, set region head, add region employee, change role, remove assignment
  const [setDomainHeadDomain, setSetDomainHeadDomain] = useState<Domain | null>(null);
  const [setRegionHeadRegion, setSetRegionHeadRegion] = useState<Region | null>(null);
  const [addEmployeeRegion, setAddEmployeeRegion] = useState<Region | null>(null);
  const [addEmployeeSelected, setAddEmployeeSelected] = useState<HRMSEmployee | null>(null);
  const [addEmployeeRole, setAddEmployeeRole] = useState<'head' | 'employee' | 'supervisor' | 'coordinator'>('employee');
  const [addEmployeeSubmitting, setAddEmployeeSubmitting] = useState(false);
  const addEmployeeCacheRef = useRef<Map<number, HRMSEmployee>>(new Map());
  const [changeRoleAssignment, setChangeRoleAssignment] = useState<AssignmentWithEmployee | null>(null);
  const [removeAssignmentId, setRemoveAssignmentId] = useState<number | null>(null);
  const [headSelectSubmitting, setHeadSelectSubmitting] = useState(false);
  const [domainHeadEmployeeId, setDomainHeadEmployeeId] = useState<number | ''>('');
  const [regionHeadEmployeeId, setRegionHeadEmployeeId] = useState<number | ''>('');
  const [setDomainCoordinatorDomain, setSetDomainCoordinatorDomain] = useState<Domain | null>(null);
  const [domainCoordinatorEmployeeId, setDomainCoordinatorEmployeeId] = useState<number | ''>('');
  const [setRegionCoordinatorRegion, setSetRegionCoordinatorRegion] = useState<Region | null>(null);
  const [regionCoordinatorEmployeeId, setRegionCoordinatorEmployeeId] = useState<number | ''>('');
  const [coordinatorSelectSubmitting, setCoordinatorSelectSubmitting] = useState(false);

  // Target summary (Review view): year/month/quarter and hierarchy with target amounts
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [targetYear, setTargetYear] = useState(() => {
    const { year, month } = getCurrentYearMonth();
    return month >= 4 ? year : year - 1;
  });
  const [targetMonth, setTargetMonth] = useState(() => getCurrentYearMonth().month);
  const [targetQuarter, setTargetQuarter] = useState<number>(() => {
    const currentMonth = getCurrentYearMonth().month;
    if (currentMonth >= 4 && currentMonth <= 6) return 1;
    if (currentMonth >= 7 && currentMonth <= 9) return 2;
    if (currentMonth >= 10 && currentMonth <= 12) return 3;
    return 4;
  });
  const [targetSummary, setTargetSummary] = useState<DomainTargetSummaryResponse | null>(null);
  const [targetSummaryLoading, setTargetSummaryLoading] = useState(false);
  const [targetHierarchyModal, setTargetHierarchyModal] = useState<TargetHierarchyModal | null>(null);
  const [setTargetAmount, setSetTargetAmount] = useState<string>('');
  const [setTargetSubmitting, setSetTargetSubmitting] = useState(false);

  const [scopeStats, setScopeStats] = useState<ScopeTargetStats | null>(null);
  const [scopeStatsLoading, setScopeStatsLoading] = useState(false);
  const [q1Stats, setQ1Stats] = useState<ScopeTargetStats | null>(null);
  const [q2Stats, setQ2Stats] = useState<ScopeTargetStats | null>(null);
  const [q3Stats, setQ3Stats] = useState<ScopeTargetStats | null>(null);
  const [q4Stats, setQ4Stats] = useState<ScopeTargetStats | null>(null);
  const [pastQuarterAccess, setPastQuarterAccess] = useState<{ quarter: string; user_ids: number[] }[]>([]);

  const isLoading = reviewLoading || scopeStatsLoading || targetSummaryLoading;

  useEffect(() => {
    if (!canView) {
      showToast('You do not have permission to view domains', 'error');
    }
  }, [canView]);

  const loadReviewData = async () => {
    setReviewLoading(true);
    try {
      const [domainsRes, regionsRes, assignmentsList] = await Promise.all([
        marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 }),
        marketingAPI.getRegions({ is_active: true, page: 1, page_size: 100 }),
        marketingAPI.getAllAssignments(),
      ]);
      setReviewDomains(domainsRes.items);
      setReviewRegions(regionsRes.items);
      setReviewAssignments(assignmentsList || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load review data', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  const loadDomainTargetSummary = async () => {
    setTargetSummaryLoading(true);
    try {
      const res = await marketingAPI.getDomainTargetSummary(
        targetYear,
        viewMode === 'monthly' ? targetMonth : null,
        viewMode === 'quarterly' ? targetQuarter : null
      );
      setTargetSummary(res);
    } catch (error: any) {
      showToast(error.message || 'Failed to load target summary', 'error');
      setTargetSummary(null);
    } finally {
      setTargetSummaryLoading(false);
    }
  };

  const loadScopeStats = async () => {
    setScopeStatsLoading(true);
    try {
      const q1From = `${targetYear}-04-01`;
      const q1To = `${targetYear}-06-30`;
      
      const q2From = `${targetYear}-07-01`;
      const q2To = `${targetYear}-09-30`;
      
      const q3From = `${targetYear}-10-01`;
      const q3To = `${targetYear}-12-31`;
      
      const q4From = `${targetYear + 1}-01-01`;
      const q4To = `${targetYear + 1}-03-31`;

      const [resQ1, resQ2, resQ3, resQ4] = await Promise.all([
        marketingAPI.getScopeTargetStats({ date_from: q1From, date_to: q1To }),
        marketingAPI.getScopeTargetStats({ date_from: q2From, date_to: q2To }),
        marketingAPI.getScopeTargetStats({ date_from: q3From, date_to: q3To }),
        marketingAPI.getScopeTargetStats({ date_from: q4From, date_to: q4To }),
      ]);

      setQ1Stats(resQ1);
      setQ2Stats(resQ2);
      setQ3Stats(resQ3);
      setQ4Stats(resQ4);

      const combinedTarget = (resQ1?.monthly_target || 0) + (resQ2?.monthly_target || 0) + (resQ3?.monthly_target || 0) + (resQ4?.monthly_target || 0);
      const combinedAchieved = (resQ1?.achieved_this_month || 0) + (resQ2?.achieved_this_month || 0) + (resQ3?.achieved_this_month || 0) + (resQ4?.achieved_this_month || 0);
      const combinedWonLeads = (resQ1?.won_leads_count_this_month || 0) + (resQ2?.won_leads_count_this_month || 0) + (resQ3?.won_leads_count_this_month || 0) + (resQ4?.won_leads_count_this_month || 0);
      const combinedLostLeads = (resQ1?.lost_leads_count_this_month || 0) + (resQ2?.lost_leads_count_this_month || 0) + (resQ3?.lost_leads_count_this_month || 0) + (resQ4?.lost_leads_count_this_month || 0);
      const combinedQuoteVal = (resQ1?.quotation_submitted_value || 0) + (resQ2?.quotation_submitted_value || 0) + (resQ3?.quotation_submitted_value || 0) + (resQ4?.quotation_submitted_value || 0);

      setScopeStats({
        role: resQ1?.role || 'employee',
        scope_label: resQ1?.scope_label || 'My',
        monthly_target: combinedTarget,
        achieved_this_month: combinedAchieved,
        won_leads_count_this_month: combinedWonLeads,
        lost_leads_count_this_month: combinedLostLeads,
        quotation_submitted_value: combinedQuoteVal,
        year: targetYear,
        month: 4,
        employee_count: resQ1?.employee_count || 1,
      });
    } catch (error: any) {
      console.error('Failed to load scope stats:', error);
      setScopeStats(null);
      setQ1Stats(null);
      setQ2Stats(null);
      setQ3Stats(null);
      setQ4Stats(null);
    } finally {
      setScopeStatsLoading(false);
    }
  };

  useEffect(() => {
    const handleSettingsChanged = () => {
      const now = Date.now();
      if (now - lastReloadRef.current < 2000) return;
      lastReloadRef.current = now;
      
      showToast('Visibility settings updated. Reloading data...', 'info');
      loadReviewData();
      loadDomainTargetSummary();
      loadScopeStats();
    };
    
    window.addEventListener('marketing:settings-version-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('marketing:settings-version-changed', handleSettingsChanged);
    };
  }, []);

  useEffect(() => {
    if (canView) {
      loadReviewData();
    }
  }, [canView]);

  useEffect(() => {
    if (canView) {
      loadDomainTargetSummary();
      loadScopeStats();
    }
  }, [canView, targetYear, targetMonth, targetQuarter, viewMode]);

  useEffect(() => {
    if (!canView) return;
    marketingAPI.getMarketingSettings().then((settings) => {
      setPastQuarterAccess(settings?.past_quarter_access || []);
    }).catch((err) => {
      console.error('Failed to load marketing settings:', err);
      setPastQuarterAccess([]);
    });
  }, [canView]);

  const openDeleteDomainConfirm = (id: number) => {
    if (!canDelete) {
      showToast('You do not have permission to delete domains', 'error');
      return;
    }
    setDeleteDomainId(id);
  };

  const handleConfirmDeleteDomain = async () => {
    if (deleteDomainId == null) return;
    try {
      await marketingAPI.deleteDomain(deleteDomainId);
      showToast('Domain deleted successfully', 'success');
      setDeleteDomainId(null);
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete domain', 'error');
    }
  };

  const handleConfirmDeleteRegion = async () => {
    if (deleteRegionId == null) return;
    try {
      await marketingAPI.deleteRegion(deleteRegionId);
      showToast('Region deleted successfully', 'success');
      setDeleteRegionId(null);
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete region', 'error');
    }
  };

  // ——— Review: Set domain head ———
  const handleSetDomainHead = async () => {
    const d = setDomainHeadDomain;
    if (!d || (domainHeadEmployeeId !== '' && !domainHeadEmployeeId)) return;
    setHeadSelectSubmitting(true);
    try {
      if (domainHeadEmployeeId === '') {
        await marketingAPI.updateDomain(d.id, { head_employee_id: undefined, head_username: undefined, head_email: undefined });
        showToast('Domain head cleared', 'success');
      } else {
        const res = await marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' });
        const emp = res.employees.find((e) => e.id === Number(domainHeadEmployeeId));
        const displayName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '' : '';
        await marketingAPI.updateDomain(d.id, {
          head_employee_id: Number(domainHeadEmployeeId),
          head_username: displayName || undefined,
          head_email: emp?.email || undefined,
        });
        showToast(displayName ? `${displayName} set as Domain Head` : 'Domain head updated', 'success');
      }
      setSetDomainHeadDomain(null);
      setDomainHeadEmployeeId('');
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to set domain head', 'error');
    } finally {
      setHeadSelectSubmitting(false);
    }
  };

  // ——— Review: Set domain coordinator ———
  const handleSetDomainCoordinator = async () => {
    const d = setDomainCoordinatorDomain;
    if (!d || (domainCoordinatorEmployeeId !== '' && !domainCoordinatorEmployeeId)) return;
    setCoordinatorSelectSubmitting(true);
    try {
      if (domainCoordinatorEmployeeId === '') {
        await marketingAPI.updateDomain(d.id, { coordinator_employee_id: undefined, coordinator_username: undefined, coordinator_email: undefined });
        showToast('Domain coordinator cleared', 'success');
      } else {
        const res = await marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' });
        const emp = res.employees.find((e) => e.id === Number(domainCoordinatorEmployeeId));
        const displayName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '' : '';
        await marketingAPI.updateDomain(d.id, {
          coordinator_employee_id: Number(domainCoordinatorEmployeeId),
          coordinator_username: displayName || undefined,
          coordinator_email: emp?.email || undefined,
        });
        showToast(displayName ? `${displayName} set as Domain Coordinator` : 'Domain coordinator updated', 'success');
      }
      setSetDomainCoordinatorDomain(null);
      setDomainCoordinatorEmployeeId('');
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to set domain coordinator', 'error');
    } finally {
      setCoordinatorSelectSubmitting(false);
    }
  };

  // ——— Review: Set region coordinator ———
  const handleSetRegionCoordinator = async () => {
    const r = setRegionCoordinatorRegion;
    if (!r || (regionCoordinatorEmployeeId !== '' && !regionCoordinatorEmployeeId)) return;
    setCoordinatorSelectSubmitting(true);
    try {
      if (regionCoordinatorEmployeeId === '') {
        await marketingAPI.updateRegion(r.id, { coordinator_employee_id: undefined, coordinator_username: undefined, coordinator_email: undefined });
        showToast('Region coordinator cleared', 'success');
      } else {
        const res = await marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' });
        const emp = res.employees.find((e) => e.id === Number(regionCoordinatorEmployeeId));
        const displayName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '' : '';
        await marketingAPI.updateRegion(r.id, {
          coordinator_employee_id: Number(regionCoordinatorEmployeeId),
          coordinator_username: displayName || undefined,
          coordinator_email: emp?.email || undefined,
        });
        showToast(displayName ? `${displayName} set as Region Coordinator` : 'Region coordinator updated', 'success');
      }
      setSetRegionCoordinatorRegion(null);
      setRegionCoordinatorEmployeeId('');
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to set region coordinator', 'error');
    } finally {
      setCoordinatorSelectSubmitting(false);
    }
  };

  // ——— Review: Set region head ———
  const handleSetRegionHead = async () => {
    const r = setRegionHeadRegion;
    if (!r || (regionHeadEmployeeId !== '' && !regionHeadEmployeeId)) return;
    setHeadSelectSubmitting(true);
    try {
      if (regionHeadEmployeeId === '') {
        await marketingAPI.updateRegion(r.id, { head_employee_id: undefined, head_username: undefined });
        showToast('Region head cleared', 'success');
      } else {
        const res = await marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' });
        const emp = res.employees.find((e) => e.id === Number(regionHeadEmployeeId));
        const displayName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '' : '';
        await marketingAPI.updateRegion(r.id, {
          head_employee_id: Number(regionHeadEmployeeId),
          head_username: displayName || undefined,
        });
        showToast(displayName ? `${displayName} set as Region Head` : 'Region head updated', 'success');
      }
      setSetRegionHeadRegion(null);
      setRegionHeadEmployeeId('');
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to set region head', 'error');
    } finally {
      setHeadSelectSubmitting(false);
    }
  };

  // ——— Review: Add region employee ———
  const handleAddRegionEmployee = async () => {
    const region = addEmployeeRegion;
    const emp = addEmployeeSelected;
    if (!region || !emp) return;
    setAddEmployeeSubmitting(true);
    try {
      const displayName = [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '';
      await marketingAPI.assignEmployeeToRegion({
        employee_id: emp.id,
        region_id: region.id,
        role: addEmployeeRole,
        employee_name: displayName || undefined,
        employee_email: emp.email || undefined,
      });
      showToast(
        addEmployeeRole === 'head'
          ? `${displayName} set as Region Head`
          : addEmployeeRole === 'supervisor'
            ? `${displayName} assigned as Supervisor`
            : addEmployeeRole === 'coordinator'
              ? `${displayName} assigned as Coordinator`
              : 'Employee assigned to region',
        'success'
      );
      setAddEmployeeRegion(null);
      setAddEmployeeSelected(null);
      setAddEmployeeRole('employee');
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to assign employee', 'error');
    } finally {
      setAddEmployeeSubmitting(false);
    }
  };

  // ——— Review: Change assignment role ———
  const handleChangeAssignmentRole = async (assignmentId: number, newRole: 'head' | 'employee' | 'supervisor' | 'coordinator') => {
    try {
      await marketingAPI.updateEmployeeAssignment(assignmentId, { role: newRole });
      showToast('Role updated', 'success');
      setChangeRoleAssignment(null);
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to update role', 'error');
    }
  };

  // ——— Review: Remove assignment ———
  const handleConfirmRemoveAssignment = async () => {
    if (removeAssignmentId == null) return;
    try {
      await marketingAPI.removeEmployeeFromRegion(removeAssignmentId);
      showToast('Removed from region', 'success');
      setRemoveAssignmentId(null);
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove', 'error');
    }
  };

  const getYearlyMultiplier = () => {
    if (viewMode === 'monthly') return 12;
    if (viewMode === 'quarterly') return 4;
    return 1;
  };

  const getSaveYearMonth = () => {
    if (viewMode === 'monthly') {
      return { year: targetYear, month: targetMonth };
    }
    if (viewMode === 'quarterly') {
      if (targetQuarter === 1) return { year: targetYear, month: 4 };
      if (targetQuarter === 2) return { year: targetYear, month: 7 };
      if (targetQuarter === 3) return { year: targetYear, month: 10 };
      return { year: targetYear + 1, month: 1 };
    }
    return { year: targetYear, month: 4 };
  };

  // ——— Review: Set employee target ———
  const handleSaveHierarchyTarget = async () => {
    const m = targetHierarchyModal;
    if (!m) return;
    const amount = parseFloat(setTargetAmount);
    if (Number.isNaN(amount) || amount < 0) {
      showToast('Enter a valid amount (0 clears an explicit domain/region goal)', 'error');
      return;
    }
    setSetTargetSubmitting(true);
    const { year: saveYear, month: saveMonth } = getSaveYearMonth();
    try {
      if (m.kind === 'employee') {
        await marketingAPI.setEmployeeTarget(m.employee_id, saveYear, saveMonth, amount);
      } else if (m.kind === 'region') {
        await marketingAPI.setRegionTarget(m.region_id, saveYear, saveMonth, amount);
      } else {
        await marketingAPI.setDomainTarget(m.domain_id, saveYear, saveMonth, amount);
      }
      showToast(amount === 0 && m.kind !== 'employee' ? 'Goal cleared' : 'Target updated', 'success');
      setTargetHierarchyModal(null);
      setSetTargetAmount('');
      await Promise.all([loadDomainTargetSummary(), loadScopeStats()]);
    } catch (error: any) {
      showToast(error.message || 'Failed to update target', 'error');
    } finally {
      setSetTargetSubmitting(false);
    }
  };

  // Helper: get employee target from summary by region_id and employee_id
  const getEmployeeTarget = (regionId: number, employeeId: number): number | null => {
    if (!targetSummary) return null;
    for (const d of targetSummary.domains) {
      const region = d.regions.find((r) => r.region_id === regionId);
      if (!region) continue;
      const emp = region.employees.find((e) => e.employee_id === employeeId);
      return emp ? emp.target_amount : null;
    }
    return null;
  };
  const getRegionTargetInfo = (regionId: number): { rolledUp: number; assigned: number | null | undefined } | null => {
    if (!targetSummary) return null;
    for (const d of targetSummary.domains) {
      const region = d.regions.find((r) => r.region_id === regionId);
      if (region) return { rolledUp: region.total_target, assigned: region.assigned_target };
    }
    return null;
  };
  const getDomainTargetInfo = (domainId: number): { rolledUp: number; assigned: number | null | undefined } | null => {
    if (!targetSummary) return null;
    const d = targetSummary.domains.find((x) => x.domain_id === domainId);
    return d ? { rolledUp: d.total_target, assigned: d.assigned_target } : null;
  };

  const openDeleteRegionConfirm = (regionId: number) => {
    if (!canDeleteRegion) {
      showToast('You do not have permission to delete regions', 'error');
      return;
    }
    setDeleteRegionId(regionId);
  };

  if (!canView) {
    return (
      <PageLayout title="Domains" breadcrumbs={[{ label: 'Domains', href: '/domains' }]}>
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view domains.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_domain</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Domains' },
  ];
  const actions = (
    <div className="flex items-center gap-2">
      {canCreate && (
        <Button
          size="sm"
          onClick={() => navigate('/domains/new')}
          leftIcon={<Plus size={14} strokeWidth={3} />}
        >
          Add Domain
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout title="Domains" actions={actions} breadcrumbs={breadcrumbs}>
      <style>{`
        @keyframes glint-sweep {
          0% { transform: translateX(-150%) skewX(-20deg); }
          60%, 100% { transform: translateX(250%) skewX(-20deg); }
        }
        .glint-badge {
          position: relative;
          overflow: hidden;
        }
        .glint-badge::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 35%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
          animation: glint-sweep 2.2s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
      <div className="w-full space-y-4">
        {/* ——— Review: hierarchy (domain heads → region heads → region employees) + target amounts ——— */}
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            View and manage the marketing hierarchy: domain heads, region heads, and region employees. Set employee targets (rolled up to region and domain), and optionally set explicit yearly goals per region or domain. Use 0 on a region/domain goal to clear it.
          </p>

            {/* Target Progress Card */}
            {scopeStats ? (() => {
              const targetVal = scopeStats.monthly_target;
              const achievedVal = scopeStats.achieved_this_month;
              const roleLabel = scopeStats.scope_label;

              const q1Target = q1Stats?.monthly_target ?? (targetVal * 0.25);
              const q1Achieved = q1Stats?.achieved_this_month ?? 0;

              const q2Target = q2Stats?.monthly_target ?? (targetVal * 0.25);
              const q2Achieved = q2Stats?.achieved_this_month ?? 0;

              const q3Target = q3Stats?.monthly_target ?? (targetVal * 0.25);
              const q3Achieved = q3Stats?.achieved_this_month ?? 0;

              const q4Target = q4Stats?.monthly_target ?? (targetVal * 0.25);
              const q4Achieved = q4Stats?.achieved_this_month ?? 0;

              // Determine active quarter states
              let q1State: 'past' | 'active' | 'future' = 'future';
              let q2State: 'past' | 'active' | 'future' = 'future';
              let q3State: 'past' | 'active' | 'future' = 'future';
              let q4State: 'past' | 'active' | 'future' = 'future';

              const currentMonth = getCurrentYearMonth().month;
              if (currentMonth >= 4 && currentMonth <= 6) {
                q1State = 'active';
                q2State = 'future';
                q3State = 'future';
                q4State = 'future';
              } else if (currentMonth >= 7 && currentMonth <= 9) {
                q1State = 'past';
                q2State = 'active';
                q3State = 'future';
                q4State = 'future';
              } else if (currentMonth >= 10 && currentMonth <= 12) {
                q1State = 'past';
                q2State = 'past';
                q3State = 'active';
                q4State = 'future';
              } else {
                // Jan, Feb, Mar
                q1State = 'past';
                q2State = 'past';
                q3State = 'past';
                q4State = 'active';
              }

              // If user not allowed to see past quarter data, hide past quarter fills
              const candidateUserIds = [
                employee?.id,
                (employee as any)?.hrms_employee_id,
                user?.id,
                (user as any)?.employee_id,
                getStoredMarketingScope()?.employee_id,
                getStoredMarketingScope()?.user_id,
              ].filter((id): id is number => typeof id === 'number' && !isNaN(id));
              const hasQuarterAccess = (q: string) => checkManagementRoleOrQuarterAccess(user, employee, q, candidateUserIds, pastQuarterAccess);
              const hideQ = (state: string, q: string) => state === 'past' && !hasQuarterAccess(q);
              const effectiveQ1Achieved = hideQ(q1State, 'Q1') ? 0 : q1Achieved;
              const effectiveQ2Achieved = hideQ(q2State, 'Q2') ? 0 : q2Achieved;
              const effectiveQ3Achieved = hideQ(q3State, 'Q3') ? 0 : q3Achieved;
              const effectiveQ4Achieved = hideQ(q4State, 'Q4') ? 0 : q4Achieved;
              const effectiveAchievedVal = effectiveQ1Achieved + effectiveQ2Achieved + effectiveQ3Achieved + effectiveQ4Achieved;
              const pct = targetVal > 0 ? (effectiveAchievedVal / targetVal) * 100 : 0;

              const q1Info = getQuarterStatus(effectiveQ1Achieved, q1Target, q1State);
              const q2Info = getQuarterStatus(effectiveQ2Achieved, q2Target, q2State);
              const q3Info = getQuarterStatus(effectiveQ3Achieved, q3Target, q3State);
              const q4Info = getQuarterStatus(effectiveQ4Achieved, q4Target, q4State);

              // Build dynamic status message
              const getQuarterlyMessage = () => {
                let completed = 0;
                if (effectiveQ1Achieved >= q1Target && q1Target > 0) completed++;
                if (effectiveQ2Achieved >= q2Target && q2Target > 0) completed++;
                if (effectiveQ3Achieved >= q3Target && q3Target > 0) completed++;
                if (effectiveQ4Achieved >= q4Target && q4Target > 0) completed++;

                let currentQName = 'Q1';
                let currentQAchieved = effectiveQ1Achieved;
                let currentQTarget = q1Target;

                if (q2State === 'active') {
                  currentQName = 'Q2';
                  currentQAchieved = effectiveQ2Achieved;
                  currentQTarget = q2Target;
                } else if (q3State === 'active') {
                  currentQName = 'Q3';
                  currentQAchieved = effectiveQ3Achieved;
                  currentQTarget = q3Target;
                } else if (q4State === 'active') {
                  currentQName = 'Q4';
                  currentQAchieved = effectiveQ4Achieved;
                  currentQTarget = q4Target;
                }

                if (completed === 4) {
                  return {
                    text: `All quarters completed successfully! Grand Slam achieved! 🏆🎉 (Total: ${formatTargetAmount(effectiveAchievedVal)})`,
                    colorClass: "text-emerald-700",
                    iconColor: "text-emerald-500"
                  };
                }

                const currentQPct = currentQTarget > 0 ? (currentQAchieved / currentQTarget) * 100 : 0;
                const statusText = currentQPct >= 100 
                  ? `${currentQName} target achieved! Outstanding!` 
                  : `${currentQName} in progress: ${formatTargetAmount(currentQAchieved)} / ${formatTargetAmount(currentQTarget)} (${currentQPct.toFixed(0)}%)`;

                return {
                  text: `Completed: ${completed}/4 Quarters. Active: ${statusText} ⚡`,
                  colorClass: completed > 0 ? "text-blue-700" : "text-slate-700",
                  iconColor: completed > 0 ? "text-blue-500" : "text-slate-400"
                };
              };

              const activeMsg = getQuarterlyMessage();
              const scopeText = roleLabel === 'All' 
                ? `All Domains Target (FY ${targetYear}-${targetYear + 1})` 
                : roleLabel === 'My' 
                  ? `My Sales Target (FY ${targetYear}-${targetYear + 1})` 
                  : `${roleLabel} Target (FY ${targetYear}-${targetYear + 1})`;

              return (
                <Card className="p-3 border border-slate-150 bg-gradient-to-br from-white to-slate-50/40 shadow-sm transition-all duration-300 hover:shadow-md mb-4">
                  <div>
                    <div className="flex flex-row items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {scopeText}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-slate-900">{formatTargetAmount(effectiveAchievedVal)}</span>
                        <span className="text-sm font-bold text-slate-600">/ {formatTargetAmount(targetVal)}</span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-1.5 border border-slate-200 shadow-inner flex">
                      {/* Q1 Column */}
                      <div className="relative w-1/4 h-full border-r border-slate-200/50 last:border-0 overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ1Achieved, q1Target, pct)
                          )}
                          style={{ width: `${Math.min(100, q1Target > 0 ? (effectiveQ1Achieved / q1Target) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* Q2 Column */}
                      <div className="relative w-1/4 h-full border-r border-slate-200/50 last:border-0 overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ2Achieved, q2Target, pct)
                          )}
                          style={{ width: `${Math.min(100, q2Target > 0 ? (effectiveQ2Achieved / q2Target) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* Q3 Column */}
                      <div className="relative w-1/4 h-full border-r border-slate-200/50 last:border-0 overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ3Achieved, q3Target, pct)
                          )}
                          style={{ width: `${Math.min(100, q3Target > 0 ? (effectiveQ3Achieved / q3Target) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* Q4 Column */}
                      <div className="relative w-1/4 h-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ4Achieved, q4Target, pct)
                          )}
                          style={{ width: `${Math.min(100, q4Target > 0 ? (effectiveQ4Achieved / q4Target) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* 3D Glass Reflection Highlight overlaying the entire container */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-full h-[40%] z-20" />
                      
                      {/* Inner Dividers for quarters (only for Yearly view) */}
                      {viewMode === 'yearly' && (
                        <>
                          <div className={cn(
                            "absolute top-0 bottom-0 left-[25%] w-[1.5px] transition-all duration-300 z-10",
                            q1Achieved >= q1Target && q1Target > 0 ? "bg-white/50 shadow-[0_0_2px_rgba(255,255,255,0.8)]" : "bg-slate-300/40"
                          )} />
                          <div className={cn(
                            "absolute top-0 bottom-0 left-[50%] w-[1.5px] transition-all duration-300 z-10",
                            q2Achieved >= q2Target && q2Target > 0 ? "bg-white/50 shadow-[0_0_2px_rgba(255,255,255,0.8)]" : "bg-slate-300/40"
                          )} />
                          <div className={cn(
                            "absolute top-0 bottom-0 left-[75%] w-[1.5px] transition-all duration-300 z-10",
                            q3Achieved >= q3Target && q3Target > 0 ? "bg-white/50 shadow-[0_0_2px_rgba(255,255,255,0.8)]" : "bg-slate-300/40"
                          )} />
                        </>
                      )}

                      <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-semibold text-white mix-blend-difference z-20">
                        {pct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Quarter Dividers and Labels for Yearly View */}
                    {viewMode === 'yearly' && (
                      <div className="mt-2.5 mb-1 px-0.5 relative h-8">
                        {/* The labels container */}
                        <div className="absolute inset-0 text-[9px] font-bold text-slate-400">
                          {/* Q1 Marker (25%) */}
                          <div key={`q1-${q1Info.label}`} className="absolute left-[25%] -translate-x-1/2 flex flex-col items-center group cursor-help transition-all duration-300">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full mb-1 transition-all duration-300",
                              q1Info.dotClass
                            )} />
                            <span className={cn(
                              "px-1.5 py-0.5 rounded transition-all duration-300 border whitespace-nowrap",
                              q1Info.badgeClass
                            )}>
                              Q1: {formatTargetAmount(q1Target)} ({q1Info.label})
                            </span>
                          </div>

                          {/* Q2 Marker (50%) */}
                          <div key={`q2-${q2Info.label}`} className="absolute left-[50%] -translate-x-1/2 flex flex-col items-center group cursor-help transition-all duration-300">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full mb-1 transition-all duration-300",
                              q2Info.dotClass
                            )} />
                            <span className={cn(
                              "px-1.5 py-0.5 rounded transition-all duration-300 border whitespace-nowrap",
                              q2Info.badgeClass
                            )}>
                              Q2: {formatTargetAmount(q2Target)} ({q2Info.label})
                            </span>
                          </div>

                          {/* Q3 Marker (75%) */}
                          <div key={`q3-${q3Info.label}`} className="absolute left-[75%] -translate-x-1/2 flex flex-col items-center group cursor-help transition-all duration-300">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full mb-1 transition-all duration-300",
                              q3Info.dotClass
                            )} />
                            <span className={cn(
                              "px-1.5 py-0.5 rounded transition-all duration-300 border whitespace-nowrap",
                              q3Info.badgeClass
                            )}>
                              Q3: {formatTargetAmount(q3Target)} ({q3Info.label})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message caption */}
                  <div className={cn("flex items-center gap-1.5 text-[10px] font-bold", activeMsg.colorClass)}>
                    <span className={activeMsg.iconColor}>
                      <Target size={12} />
                    </span>
                    <span>{activeMsg.text}</span>
                  </div>
                </Card>
              );
            })() : null}

            {/* Quotation Submitted Progress Card (4x stretch target) */}
            {scopeStats ? (() => {
              const qTarget = scopeStats.monthly_target;
              const qRoleLabel = scopeStats.scope_label;
              const q1QuoteVal = q1Stats?.quotation_submitted_value ?? 0;
              const q2QuoteVal = q2Stats?.quotation_submitted_value ?? 0;
              const q3QuoteVal = q3Stats?.quotation_submitted_value ?? 0;
              const q4QuoteVal = q4Stats?.quotation_submitted_value ?? 0;
              const totalQuoteVal = q1QuoteVal + q2QuoteVal + q3QuoteVal + q4QuoteVal;

              const qQ1Target = q1Stats?.monthly_target ?? (qTarget * 0.25);
              const qQ2Target = q2Stats?.monthly_target ?? (qTarget * 0.25);
              const qQ3Target = q3Stats?.monthly_target ?? (qTarget * 0.25);
              const qQ4Target = q4Stats?.monthly_target ?? (qTarget * 0.25);

              const quoteTarget = qTarget * 4;

              // Quarter states for quotation card
              let qq1State: 'past' | 'active' | 'future' = 'future';
              let qq2State: 'past' | 'active' | 'future' = 'future';
              let qq3State: 'past' | 'active' | 'future' = 'future';
              let qq4State: 'past' | 'active' | 'future' = 'future';
              const qCurrentMonth = getCurrentYearMonth().month;
              if (qCurrentMonth >= 4 && qCurrentMonth <= 6) {
                qq1State = 'active';
              } else if (qCurrentMonth >= 7 && qCurrentMonth <= 9) {
                qq1State = 'past';
                qq2State = 'active';
              } else if (qCurrentMonth >= 10 && qCurrentMonth <= 12) {
                qq1State = 'past';
                qq2State = 'past';
                qq3State = 'active';
              } else {
                qq1State = 'past';
                qq2State = 'past';
                qq3State = 'past';
                qq4State = 'active';
              }

              const qCandidateUserIds = [
                employee?.id,
                (employee as any)?.hrms_employee_id,
                user?.id,
                (user as any)?.employee_id,
                getStoredMarketingScope()?.employee_id,
                getStoredMarketingScope()?.user_id,
              ].filter((id): id is number => typeof id === 'number' && !isNaN(id));
              const qHasQuarterAccess = (q: string) => checkManagementRoleOrQuarterAccess(user, employee, q, qCandidateUserIds, pastQuarterAccess);
              const hideQ = (state: string, q: string) => state === 'past' && !qHasQuarterAccess(q);
              const effectiveQ1QuoteVal = hideQ(qq1State, 'Q1') ? 0 : q1QuoteVal;
              const effectiveQ2QuoteVal = hideQ(qq2State, 'Q2') ? 0 : q2QuoteVal;
              const effectiveQ3QuoteVal = hideQ(qq3State, 'Q3') ? 0 : q3QuoteVal;
              const effectiveQ4QuoteVal = hideQ(qq4State, 'Q4') ? 0 : q4QuoteVal;
              const effectiveTotalQuoteVal = effectiveQ1QuoteVal + effectiveQ2QuoteVal + effectiveQ3QuoteVal + effectiveQ4QuoteVal;
              const quotePct = quoteTarget > 0 ? (effectiveTotalQuoteVal / quoteTarget) * 100 : 0;

              const qq1Info = getQuarterStatus(effectiveQ1QuoteVal, qQ1Target * 4, qq1State);
              const qq2Info = getQuarterStatus(effectiveQ2QuoteVal, qQ2Target * 4, qq2State);
              const qq3Info = getQuarterStatus(effectiveQ3QuoteVal, qQ3Target * 4, qq3State);
              const qq4Info = getQuarterStatus(effectiveQ4QuoteVal, qQ4Target * 4, qq4State);

              const qScopeText = qRoleLabel === 'All'
                ? `All Domains Quotation (FY ${targetYear}-${targetYear + 1})`
                : qRoleLabel === 'My'
                  ? `My Quotation Target (FY ${targetYear}-${targetYear + 1})`
                  : `${qRoleLabel} Quotation Target (FY ${targetYear}-${targetYear + 1})`;

              return (
                <Card className="p-3 border border-sky-150 bg-gradient-to-br from-sky-50/40 to-white shadow-sm transition-all duration-300 hover:shadow-md mb-4">
                  <div>
                    <div className="flex flex-row items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                          {qScopeText}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-slate-900">{formatTargetAmount(effectiveTotalQuoteVal)}</span>
                        <span className="text-sm font-bold text-slate-600">/ {formatTargetAmount(quoteTarget)}</span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-1.5 border border-slate-200 shadow-inner flex">
                      {/* Q1 Column */}
                      <div className="relative w-1/4 h-full border-r border-slate-200/50 last:border-0 overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ1QuoteVal, qQ1Target * 4, quotePct)
                          )}
                          style={{ width: `${Math.min(100, qQ1Target > 0 ? (effectiveQ1QuoteVal / (qQ1Target * 4)) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* Q2 Column */}
                      <div className="relative w-1/4 h-full border-r border-slate-200/50 last:border-0 overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ2QuoteVal, qQ2Target * 4, quotePct)
                          )}
                          style={{ width: `${Math.min(100, qQ2Target > 0 ? (effectiveQ2QuoteVal / (qQ2Target * 4)) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* Q3 Column */}
                      <div className="relative w-1/4 h-full border-r border-slate-200/50 last:border-0 overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ3QuoteVal, qQ3Target * 4, quotePct)
                          )}
                          style={{ width: `${Math.min(100, qQ3Target > 0 ? (effectiveQ3QuoteVal / (qQ3Target * 4)) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* Q4 Column */}
                      <div className="relative w-1/4 h-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full bg-gradient-to-r transition-all duration-300 ease-out shadow-md",
                            getSegmentGradient(effectiveQ4QuoteVal, qQ4Target * 4, quotePct)
                          )}
                          style={{ width: `${Math.min(100, qQ4Target > 0 ? (effectiveQ4QuoteVal / (qQ4Target * 4)) * 100 : 0)}%` }}
                        />
                      </div>

                      {/* Glass reflection */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-full h-[40%] z-20" />

                      {/* Inner Dividers */}
                      {viewMode === 'yearly' && (
                        <>
                          <div className={cn(
                            "absolute top-0 bottom-0 left-[25%] w-[1.5px] transition-all duration-300 z-10",
                            "bg-sky-300/40"
                          )} />
                          <div className={cn(
                            "absolute top-0 bottom-0 left-[50%] w-[1.5px] transition-all duration-300 z-10",
                            "bg-sky-300/40"
                          )} />
                          <div className={cn(
                            "absolute top-0 bottom-0 left-[75%] w-[1.5px] transition-all duration-300 z-10",
                            "bg-sky-300/40"
                          )} />
                        </>
                      )}

                      <span className="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-semibold text-white mix-blend-difference z-20">
                        {quotePct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Quarter Labels */}
                    {viewMode === 'yearly' && (
                      <div className="mt-2.5 mb-1 px-0.5 relative h-8">
                        <div className="absolute inset-0 text-[9px] font-bold text-sky-400">
                          <div key={`qq1-${qq1Info.label}`} className="absolute left-[25%] -translate-x-1/2 flex flex-col items-center group cursor-help transition-all duration-300">
                            <div className={cn("w-1.5 h-1.5 rounded-full mb-1 transition-all duration-300", qq1Info.dotClass)} />
                            <span className={cn("px-1.5 py-0.5 rounded transition-all duration-300 border whitespace-nowrap", qq1Info.badgeClass)}>
                              Q1: {formatTargetAmount(effectiveQ1QuoteVal)} / {formatTargetAmount(qQ1Target * 4)} ({qq1Info.label})
                            </span>
                          </div>
                          <div key={`qq2-${qq2Info.label}`} className="absolute left-[50%] -translate-x-1/2 flex flex-col items-center group cursor-help transition-all duration-300">
                            <div className={cn("w-1.5 h-1.5 rounded-full mb-1 transition-all duration-300", qq2Info.dotClass)} />
                            <span className={cn("px-1.5 py-0.5 rounded transition-all duration-300 border whitespace-nowrap", qq2Info.badgeClass)}>
                              Q2: {formatTargetAmount(effectiveQ2QuoteVal)} / {formatTargetAmount(qQ2Target * 4)} ({qq2Info.label})
                            </span>
                          </div>
                          <div key={`qq3-${qq3Info.label}`} className="absolute left-[75%] -translate-x-1/2 flex flex-col items-center group cursor-help transition-all duration-300">
                            <div className={cn("w-1.5 h-1.5 rounded-full mb-1 transition-all duration-300", qq3Info.dotClass)} />
                            <span className={cn("px-1.5 py-0.5 rounded transition-all duration-300 border whitespace-nowrap", qq3Info.badgeClass)}>
                              Q3: {formatTargetAmount(effectiveQ3QuoteVal)} / {formatTargetAmount(qQ3Target * 4)} ({qq3Info.label})
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status message */}
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-bold", quotePct > 0 ? "text-sky-700" : "text-slate-700")}>
                      <span className={quotePct > 0 ? "text-sky-500" : "text-slate-400"}>
                        <Target size={12} />
                      </span>
                      <span>
                        {effectiveTotalQuoteVal === 0
                          ? "No quotations submitted yet. Start quoting to track progress!"
                          : `Quotation value: ${formatTargetAmount(effectiveTotalQuoteVal)} / ${formatTargetAmount(quoteTarget)} (${quotePct.toFixed(0)}% of 4x target)`}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })() : null}

            <div className="space-y-2">
              {filteredDomains.length === 0 ? (
                <Card>
                  <div className="text-center py-12 text-slate-600">No domains found. Create a domain first.</div>
                </Card>
              ) : (
                <Card className="p-4">
                  {/* Tree: domain → region → employee */}
                  {filteredDomains.map((domain, domainIdx) => {
                    const domainRegions = getFilteredRegionsForDomain(domain);
                    const domainTargetInfo = getDomainTargetInfo(domain.id);
                    const isCoordinatorVisible = true;

                    return (
                      <div
                        key={domain.id}
                        className={`tree-root ${domainIdx < filteredDomains.length - 1 ? 'mb-8 pb-6 border-b border-slate-100' : ''}`}
                      >
                        {/* Level 0: Domain (root) */}
                        <div className="tree-node flex items-center gap-2 py-2 pr-2 rounded-md hover:bg-slate-50/80 group">
                          <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-300" aria-hidden />
                          <Globe size={18} className="text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{domain.name}</span>
                          {domain.code && <Badge variant="outline" className="text-xs">{domain.code}</Badge>}
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-sm text-slate-600">Head:</span>
                          <span className="text-sm font-medium text-slate-800">{getDomainHeadDisplayName(domain)}</span>
                          {isCoordinatorVisible && (
                            <>
                              <span className="text-slate-400 mx-1">·</span>
                              <span className="text-sm text-slate-600">Coordinator:</span>
                              <span className="text-sm font-medium text-slate-800">{domain.coordinator_username || '—'}</span>
                            </>
                          )}
                          {isDomainTargetVisible(domain.id) && domainTargetInfo != null && (
                            <>
                              <span className="text-slate-400 mx-1">·</span>
                              <span className="text-sm text-slate-600">
                                {domainTargetInfo.assigned != null && domainTargetInfo.assigned > 0 ? (
                                  <>
                                    <span className="font-medium text-slate-700">Goal: </span>
                                    <span className="font-semibold text-blue-700">{formatTargetAmount(domainTargetInfo.assigned)}</span>
                                    {Math.abs(domainTargetInfo.assigned - domainTargetInfo.rolledUp) > 1 && (
                                      <span className="text-slate-500 font-normal"> (team {formatTargetAmount(domainTargetInfo.rolledUp)})</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium text-slate-700">Team target: </span>
                                    <span className="font-semibold text-blue-700">{formatTargetAmount(domainTargetInfo.rolledUp)}</span>
                                  </>
                                )}
                              </span>
                            </>
                          )}
                          <div className="ml-auto flex items-center gap-1 shrink-0">
                            {showActionButtons && canEdit && domainTargetInfo != null && (
                              <Tooltip content="Set domain goal">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    const mult = getYearlyMultiplier();
                                    setTargetHierarchyModal({
                                      kind: 'domain',
                                      domain_id: domain.id,
                                      domain_name: domain.name,
                                      rolled_up: domainTargetInfo.rolledUp,
                                      assigned: domainTargetInfo.assigned,
                                    });
                                    setSetTargetAmount(
                                      String(
                                        Math.round(
                                          (domainTargetInfo.assigned != null && domainTargetInfo.assigned > 0
                                            ? domainTargetInfo.assigned
                                            : domainTargetInfo.rolledUp) * mult
                                        )
                                      )
                                    );
                                  }}
                                >
                                  <Target size={14} />
                                </Button>
                              </Tooltip>
                            )}
                            {showActionButtons && canCreateRegion && (
                              <Tooltip content="Add Region">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => navigate(`/domains/${domain.id}/regions/new`)}
                                >
                                  <MapPin size={14} />
                                </Button>
                              </Tooltip>
                            )}
                            {showActionButtons && canEdit && (
                              <Tooltip content="Edit Domain">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => navigate(`/domains/${domain.id}/edit`)}
                                >
                                  <Edit size={14} />
                                </Button>
                              </Tooltip>
                            )}
                            {showActionButtons && canDelete && (
                              <Tooltip content="Delete Domain">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => openDeleteDomainConfirm(domain.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </Tooltip>
                            )}

                          </div>
                        </div>
                        {/* Level 1: Regions (children of domain) */}
                        <div className="tree-children border-l-2 border-slate-200 ml-2 pl-3">
                          {domainRegions.length === 0 ? (
                            <div className="tree-node flex items-center gap-2 py-1.5 text-slate-500 text-sm italic">
                              <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-200" aria-hidden />
                              No regions
                            </div>
                          ) : (
                            domainRegions.map((region, rIdx) => {
                              const regionAssignments = getFilteredAssignmentsForRegion(region);
                              const isLastRegion = rIdx === domainRegions.length - 1;
                              const regionTargetInfo = getRegionTargetInfo(region.id);
                              const isRegionCoordinatorVisible = activeScope.is_super || activeScope.scope_type === 'domain_head' || activeScope.scope_type === 'region_head' || activeScope.scope_type === 'supervisor';

                              return (
                                <div key={region.id} className={isLastRegion ? '' : 'mb-1'}>
                                  {/* Region row */}
                                  <div className="tree-node flex items-center gap-2 py-2 pr-2 rounded-md hover:bg-slate-50/80 group">
                                    <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-300" aria-hidden />
                                    <MapPin size={16} className="text-emerald-600 shrink-0" />
                                    <span className="font-medium text-slate-800">{region.name}</span>
                                    {region.code && <Badge variant="outline" className="text-xs">{region.code}</Badge>}
                                    <span className="text-slate-400 mx-1">·</span>
                                    <span className="text-sm text-slate-600">Head:</span>
                                    <span className="text-sm font-medium text-slate-800">{getRegionHeadDisplayName(region)}</span>
                                    {isRegionCoordinatorVisible && (
                                      <>
                                        <span className="text-slate-400 mx-1">·</span>
                                        <span className="text-sm text-slate-600">Coordinator:</span>
                                        <span className="text-sm font-medium text-slate-800">{region.coordinator_username || '—'}</span>
                                      </>
                                    )}
                                    {isRegionTargetVisible(region) && regionTargetInfo != null && (
                                      <>
                                        <span className="text-slate-400 mx-1">·</span>
                                        <span className="text-sm text-slate-600">
                                          {regionTargetInfo.assigned != null && regionTargetInfo.assigned > 0 ? (
                                            <>
                                              <span className="font-medium text-slate-700">Goal: </span>
                                              <span className="font-semibold text-emerald-700">{formatTargetAmount(regionTargetInfo.assigned)}</span>
                                              {Math.abs(regionTargetInfo.assigned - regionTargetInfo.rolledUp) > 1 && (
                                                <span className="text-slate-500 font-normal"> (team {formatTargetAmount(regionTargetInfo.rolledUp)})</span>
                                              )}
                                            </>
                                          ) : (
                                            <>
                                              <span className="font-medium text-slate-700">Team target: </span>
                                              <span className="font-semibold text-emerald-700">{formatTargetAmount(regionTargetInfo.rolledUp)}</span>
                                            </>
                                          )}
                                        </span>
                                      </>
                                    )}
                                    <div className="ml-auto flex items-center gap-1 shrink-0">
                                      {showActionButtons && canEditRegion && regionTargetInfo != null && (
                                        <Tooltip content="Set region goal">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                              const mult = getYearlyMultiplier();
                                              setTargetHierarchyModal({
                                                kind: 'region',
                                                region_id: region.id,
                                                region_name: region.name,
                                                rolled_up: regionTargetInfo.rolledUp,
                                                assigned: regionTargetInfo.assigned,
                                              });
                                              setSetTargetAmount(
                                                String(
                                                  Math.round(
                                                    (regionTargetInfo.assigned != null && regionTargetInfo.assigned > 0
                                                      ? regionTargetInfo.assigned
                                                      : regionTargetInfo.rolledUp) * mult
                                                  )
                                                )
                                              );
                                            }}
                                          >
                                            <Target size={14} />
                                          </Button>
                                        </Tooltip>
                                      )}
                                      {showActionButtons && canEditRegion && (
                                        <Tooltip content="Edit Region">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => navigate(`/domains/${domain.id}/regions/${region.id}/edit`)}
                                          >
                                            <Edit size={14} />
                                          </Button>
                                        </Tooltip>
                                      )}
                                      {showActionButtons && canDeleteRegion && (
                                        <Tooltip content="Delete Region">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => openDeleteRegionConfirm(region.id)}
                                          >
                                            <Trash2 size={14} />
                                          </Button>
                                        </Tooltip>
                                      )}

                                      {showActionButtons && canManageRegionEmployees && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            setAddEmployeeRegion(region);
                                            setAddEmployeeSelected(null);
                                            addEmployeeCacheRef.current.clear();
                                            setAddEmployeeRole('employee');
                                          }}
                                          leftIcon={<UserPlus size={12} />}
                                        >
                                          Add
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {/* Level 2: Employees (children of region) */}
                                  <div className="tree-children border-l-2 border-slate-200 ml-2 pl-3">
                                    {regionAssignments.length === 0 ? (
                                      <div className="tree-node flex items-center gap-2 py-1.5 text-slate-500 text-sm italic">
                                        <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-200" aria-hidden />
                                        No employees
                                      </div>
                                    ) : (
                                      regionAssignments.map((a, eIdx) => {
                                        const empTarget = getEmployeeTarget(region.id, a.employee_id);
                                        return (
                                          <div
                                            key={a.id}
                                            className="tree-node flex items-center justify-between gap-2 py-1.5 pr-2 rounded-md hover:bg-slate-50/80 group"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-200" aria-hidden />
                                              <User size={14} className="text-slate-500 shrink-0" />
                                              <span className="text-sm text-slate-800 truncate">
                                                {a.employee_name || a.employee_email || `Employee #${a.employee_id}`}
                                              </span>
                                              {a.role === 'head' && (
                                                <Badge variant="outline" className="text-xs shrink-0">Head</Badge>
                                              )}
                                              {a.role === 'coordinator' && (
                                                <Badge variant="outline" className="text-xs shrink-0 border-sky-200 text-sky-800 bg-sky-50">Coordinator</Badge>
                                              )}
                                              {a.role === 'supervisor' && (
                                                <Badge variant="outline" className="text-xs shrink-0 border-amber-200 text-amber-800 bg-amber-50">Supervisor</Badge>
                                              )}
                                              {empTarget != null && isEmployeeTargetVisible(a) && (
                                                <>
                                                  <span className="text-slate-400 mx-0.5">·</span>
                                                  <span className="text-sm font-medium text-slate-700">{formatTargetAmount(empTarget)}</span>
                                                </>
                                              )}
                                            </div>
                                            {showActionButtons && canManageRegionEmployees && (
                                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Tooltip content="Set target">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600"
                                                    onClick={() => {
                                                      const mult = getYearlyMultiplier();
                                                      setTargetHierarchyModal({
                                                        kind: 'employee',
                                                        employee_id: a.employee_id,
                                                        employee_name: a.employee_name || a.employee_email || `Employee #${a.employee_id}`,
                                                        region_id: region.id,
                                                        current_amount: empTarget ?? 0,
                                                      });
                                                      setSetTargetAmount(String(Math.round((empTarget ?? 0) * mult)));
                                                    }}
                                                  >
                                                    <Target size={12} />
                                                  </Button>
                                                </Tooltip>
                                                <Select
                                                  options={[
                                                    { value: 'employee', label: 'Employee' },
                                                    { value: 'supervisor', label: 'Supervisor' },
                                                    { value: 'coordinator', label: 'Coordinator' },
                                                    { value: 'head', label: 'Head' },
                                                  ]}
                                                  value={a.role}
                                                  onChange={(val) => handleChangeAssignmentRole(a.id, (val as 'head' | 'employee' | 'supervisor' | 'coordinator') || 'employee')}
                                                  searchable={false}
                                                  className="min-w-[100px]"
                                                />
                                                <Tooltip content="Remove from region">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => setRemoveAssignmentId(a.id)}
                                                  >
                                                    <Trash2 size={12} />
                                                  </Button>
                                                </Tooltip>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          </div>
        </div>

      {/* Set employee / region / domain target */}
      <Modal
        isOpen={targetHierarchyModal != null}
        onClose={() => { setTargetHierarchyModal(null); setSetTargetAmount(''); }}
        title={
          targetHierarchyModal?.kind === 'employee'
            ? `Set target: ${targetHierarchyModal.employee_name}`
            : targetHierarchyModal?.kind === 'region'
              ? `Region goal: ${targetHierarchyModal.region_name}`
              : targetHierarchyModal?.kind === 'domain'
                ? `Domain goal: ${targetHierarchyModal.domain_name}`
                : 'Set target'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => { setTargetHierarchyModal(null); setSetTargetAmount(''); }}>Cancel</Button>
            <Button onClick={handleSaveHierarchyTarget} disabled={setTargetSubmitting}>
              {setTargetSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {targetHierarchyModal?.kind === 'employee' && (
              <>Yearly target for Fiscal Year {targetYear}. Amount in ₹ (e.g. 1200000 for 12 Lakhs).</>
            )}
            {targetHierarchyModal?.kind === 'region' && (
              <>
                Optional yearly goal for Fiscal Year {targetYear}. Team sum is{' '}
                <span className="font-medium">{formatTargetAmount(targetHierarchyModal.rolled_up * getYearlyMultiplier())}</span>. Enter{' '}
                <span className="font-medium">0</span> to clear the explicit goal.
              </>
            )}
            {targetHierarchyModal?.kind === 'domain' && (
              <>
                Optional yearly goal for Fiscal Year {targetYear}. Team sum is{' '}
                <span className="font-medium">{formatTargetAmount(targetHierarchyModal.rolled_up * getYearlyMultiplier())}</span>. Enter{' '}
                <span className="font-medium">0</span> to clear the explicit goal.
              </>
            )}
          </p>
          <CurrencyInput
            label="Yearly target amount (₹)"
            value={setTargetAmount}
            onChange={setSetTargetAmount}
            placeholder="e.g. 12,00,000"
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteDomainId != null}
        onClose={() => setDeleteDomainId(null)}
        onConfirm={handleConfirmDeleteDomain}
        title="Delete domain"
        message="Are you sure you want to delete this domain? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
      <ConfirmModal
        isOpen={deleteRegionId != null}
        onClose={() => setDeleteRegionId(null)}
        onConfirm={handleConfirmDeleteRegion}
        title="Delete region"
        message="Are you sure you want to delete this region? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* Set Domain Head */}
      <Modal
        isOpen={setDomainHeadDomain != null}
        onClose={() => { setSetDomainHeadDomain(null); setDomainHeadEmployeeId(''); }}
        title={setDomainHeadDomain ? `Domain Head: ${setDomainHeadDomain.name}` : 'Set Domain Head'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setSetDomainHeadDomain(null); setDomainHeadEmployeeId(''); }}>Cancel</Button>
            <Button onClick={handleSetDomainHead} disabled={headSelectSubmitting}>
              {headSelectSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AsyncSelect
            label="Employee"
            loadOptions={async (search) => {
              const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
              return res.employees.map((e) => ({
                value: e.id,
                label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
              }));
            }}
            value={domainHeadEmployeeId === '' ? undefined : domainHeadEmployeeId}
            onChange={(val) => setDomainHeadEmployeeId(val != null && val !== '' ? Number(val) : '')}
            placeholder="Search and select employee..."
            initialOptions={
              setDomainHeadDomain?.head_employee_id
                ? [{ value: setDomainHeadDomain.head_employee_id, label: setDomainHeadDomain.head_username || `Employee #${setDomainHeadDomain.head_employee_id}` }]
                : []
            }
          />
          <p className="text-xs text-slate-500">Leave empty and Save to clear the domain head.</p>
        </div>
      </Modal>

      {/* Set Domain Coordinator */}
      <Modal
        isOpen={setDomainCoordinatorDomain != null}
        onClose={() => { setSetDomainCoordinatorDomain(null); setDomainCoordinatorEmployeeId(''); }}
        title={setDomainCoordinatorDomain ? `Domain Coordinator: ${setDomainCoordinatorDomain.name}` : 'Set Domain Coordinator'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setSetDomainCoordinatorDomain(null); setDomainCoordinatorEmployeeId(''); }}>Cancel</Button>
            <Button onClick={handleSetDomainCoordinator} disabled={coordinatorSelectSubmitting}>
              {coordinatorSelectSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AsyncSelect
            label="Employee"
            loadOptions={async (search) => {
              const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
              return res.employees.map((e) => ({
                value: e.id,
                label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
              }));
            }}
            value={domainCoordinatorEmployeeId === '' ? undefined : domainCoordinatorEmployeeId}
            onChange={(val) => setDomainCoordinatorEmployeeId(val != null && val !== '' ? Number(val) : '')}
            placeholder="Search and select employee..."
            initialOptions={
              setDomainCoordinatorDomain?.coordinator_employee_id
                ? [{ value: setDomainCoordinatorDomain.coordinator_employee_id, label: setDomainCoordinatorDomain.coordinator_username || `Employee #${setDomainCoordinatorDomain.coordinator_employee_id}` }]
                : []
            }
          />
          <p className="text-xs text-slate-500">Leave empty and Save to clear the domain coordinator.</p>
        </div>
      </Modal>

      {/* Set Region Head */}
      <Modal
        isOpen={setRegionHeadRegion != null}
        onClose={() => { setSetRegionHeadRegion(null); setRegionHeadEmployeeId(''); }}
        title={setRegionHeadRegion ? `Region Head: ${setRegionHeadRegion.name}` : 'Set Region Head'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setSetRegionHeadRegion(null); setRegionHeadEmployeeId(''); }}>Cancel</Button>
            <Button onClick={handleSetRegionHead} disabled={headSelectSubmitting}>
              {headSelectSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AsyncSelect
            label="Employee"
            loadOptions={async (search) => {
              const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
              return res.employees.map((e) => ({
                value: e.id,
                label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
              }));
            }}
            value={regionHeadEmployeeId === '' ? undefined : regionHeadEmployeeId}
            onChange={(val) => setRegionHeadEmployeeId(val != null && val !== '' ? Number(val) : '')}
            placeholder="Search and select employee..."
            initialOptions={
              setRegionHeadRegion?.head_employee_id
                ? [{ value: setRegionHeadRegion.head_employee_id, label: setRegionHeadRegion.head_username || `Employee #${setRegionHeadRegion.head_employee_id}` }]
                : []
            }
          />
          <p className="text-xs text-slate-500">Leave empty and Save to clear the region head.</p>
        </div>
      </Modal>

      {/* Set Region Coordinator */}
      <Modal
        isOpen={setRegionCoordinatorRegion != null}
        onClose={() => { setSetRegionCoordinatorRegion(null); setRegionCoordinatorEmployeeId(''); }}
        title={setRegionCoordinatorRegion ? `Region Coordinator: ${setRegionCoordinatorRegion.name}` : 'Set Region Coordinator'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setSetRegionCoordinatorRegion(null); setRegionCoordinatorEmployeeId(''); }}>Cancel</Button>
            <Button onClick={handleSetRegionCoordinator} disabled={coordinatorSelectSubmitting}>
              {coordinatorSelectSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AsyncSelect
            label="Employee"
            loadOptions={async (search) => {
              const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
              return res.employees.map((e) => ({
                value: e.id,
                label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
              }));
            }}
            value={regionCoordinatorEmployeeId === '' ? undefined : regionCoordinatorEmployeeId}
            onChange={(val) => setRegionCoordinatorEmployeeId(val != null && val !== '' ? Number(val) : '')}
            placeholder="Search and select employee..."
            initialOptions={
              setRegionCoordinatorRegion?.coordinator_employee_id
                ? [{ value: setRegionCoordinatorRegion.coordinator_employee_id, label: setRegionCoordinatorRegion.coordinator_username || `Employee #${setRegionCoordinatorRegion.coordinator_employee_id}` }]
                : []
            }
          />
          <p className="text-xs text-slate-500">Leave empty and Save to clear the region coordinator.</p>
        </div>
      </Modal>

      {/* Add Region Employee */}
      <Modal
        isOpen={addEmployeeRegion != null}
        onClose={() => { setAddEmployeeRegion(null); setAddEmployeeSelected(null); addEmployeeCacheRef.current.clear(); }}
        title={addEmployeeRegion ? `Add employee to ${addEmployeeRegion.name}` : 'Add employee'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setAddEmployeeRegion(null); setAddEmployeeSelected(null); addEmployeeCacheRef.current.clear(); }}>Cancel</Button>
            <Button onClick={handleAddRegionEmployee} disabled={!addEmployeeSelected || addEmployeeSubmitting}>
              {addEmployeeSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!addEmployeeSelected ? (
            <AsyncSelect
              label="Employee"
              loadOptions={async (search) => {
                const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
                res.employees.forEach((e) => addEmployeeCacheRef.current.set(e.id, e));
                return res.employees.map((e) => ({
                  value: e.id,
                  label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
                }));
              }}
              value={undefined}
              onChange={(val) => {
                if (val == null) return;
                const emp = addEmployeeCacheRef.current.get(Number(val));
                if (emp) setAddEmployeeSelected(emp);
              }}
              placeholder="Search and select employee..."
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-800">
                {[addEmployeeSelected.first_name, addEmployeeSelected.last_name].filter(Boolean).join(' ').trim() || addEmployeeSelected.email}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setAddEmployeeSelected(null)}>Change employee</Button>
            </div>
          )}
          <Select
            label="Role"
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'supervisor', label: 'Supervisor (all contacts in region)' },
              { value: 'coordinator', label: 'Coordinator (same access as Region Coordinator)' },
              { value: 'head', label: 'Region Head' },
            ]}
            value={addEmployeeRole}
            onChange={(val) => setAddEmployeeRole((val as 'head' | 'employee' | 'supervisor' | 'coordinator') || 'employee')}
            searchable={false}
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={removeAssignmentId != null}
        onClose={() => setRemoveAssignmentId(null)}
        onConfirm={handleConfirmRemoveAssignment}
        title="Remove from region"
        message="Remove this employee from the region? They will no longer have access."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
    </PageLayout>
  );
};
