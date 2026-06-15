import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { marketingAPI, ReportScopeResponse, DashboardTargetStats, ReportSummaryResponse, InquiriesByTypeItem, ExpectedOrderReportItem, ODPlanReportItem, Domain, Region } from '../lib/marketing-api';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectToken, selectEmployee } from '../store/slices/authSlice';
import { getCached, setCache, getCacheKey, clearCache } from '../lib/api-cache';
import { hrmsRBACClient, DSRTask } from '../lib/hrms-rbac';
import { getStoredMarketingScope } from '../lib/marketing-scope';
import { UserCheck, Target, Trophy, XCircle, Calendar, MapPin, FileText, TrendingUp, Users, MessageSquare, Building2, Phone, BarChart3, PieChart, Activity, ClipboardList, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

type DatePreset = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'custom';

const SCOPE_CACHE_KEY = 'reports_scope';
const ALL_ID = -1;

interface EmployeeData {
  targetStats: DashboardTargetStats | null;
  summary: ReportSummaryResponse | null;
  expectedOrderReports: ExpectedOrderReportItem[];
  odPlanReports: ODPlanReportItem[];
  dsrTasks: DSRTask[];
}

function getDateRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (preset) {
    case 'today': {
      const s = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { dateFrom: s, dateTo: s };
    }
    case 'this_week': {
      const dayOfWeek = now.getDay();
      const mon = new Date(now);
      mon.setDate(d - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      return { dateFrom: fmt(mon), dateTo: fmt(sun) };
    }
    case 'this_month': {
      const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const last = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { dateFrom: first, dateTo: last };
    }
    case 'this_quarter': {
      const qStartMonth = Math.floor(m / 3) * 3;
      const qStart = `${y}-${String(qStartMonth + 1).padStart(2, '0')}-01`;
      const qEndMonth = qStartMonth + 2;
      const qLastDay = new Date(y, qEndMonth + 1, 0).getDate();
      const qEnd = `${y}-${String(qEndMonth + 1).padStart(2, '0')}-${String(qLastDay).padStart(2, '0')}`;
      return { dateFrom: qStart, dateTo: qEnd };
    }
    case 'this_year': {
      return { dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` };
    }
    default:
      return { dateFrom: '', dateTo: '' };
  }
}

function getMonthsInRange(from: string, to: string): { year: number; month: number }[] {
  if (!from || !to) {
    const now = new Date();
    return [{ year: now.getFullYear(), month: now.getMonth() + 1 }];
  }
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const months: { year: number; month: number }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months.length > 0 ? months : [{ year: end.getFullYear(), month: end.getMonth() + 1 }];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function mergeSummaries(summaries: ReportSummaryResponse[]): ReportSummaryResponse | null {
  if (summaries.length === 0) return null;
  const merged: ReportSummaryResponse = {
    ...summaries[0],
    employee_id: undefined,
    employee_name: undefined,
    inquiries_count: 0,
    inquiries_by_type: [],
    quotations_sent_count: 0,
    leads_total: 0,
    leads_by_status: [],
    leads_created_count: 0,
    total_contacts: 0,
    total_customers: 0,
  };
  const inquiriesMap = new Map<string, number>();
  const leadsStatusMap = new Map<number, { status_id: number; status_code: string; status_label: string; count: number }>();
  for (const s of summaries) {
    merged.inquiries_count += s.inquiries_count;
    merged.quotations_sent_count += s.quotations_sent_count;
    merged.leads_total += s.leads_total;
    merged.leads_created_count += s.leads_created_count;
    merged.total_contacts += s.total_contacts;
    merged.total_customers += s.total_customers;
    for (const item of s.inquiries_by_type) {
      inquiriesMap.set(item.activity_type, (inquiriesMap.get(item.activity_type) || 0) + item.count);
    }
    for (const item of s.leads_by_status) {
      const existing = leadsStatusMap.get(item.status_id);
      if (existing) {
        existing.count += item.count;
      } else {
        leadsStatusMap.set(item.status_id, { ...item });
      }
    }
  }
  merged.inquiries_by_type = [...inquiriesMap.entries()]
    .map(([activity_type, count]) => ({ activity_type, count }))
    .sort((a, b) => b.count - a.count);
  merged.leads_by_status = [...leadsStatusMap.values()].sort((a, b) => b.count - a.count);
  return merged;
}

const SummaryContent: React.FC<{ loading: boolean; summary: ReportSummaryResponse | null }> = ({ loading, summary }) => {
  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-blue-600 border-t-transparent" />
        <p className="mt-2 text-xs text-slate-500 font-medium">Loading performance summary...</p>
      </div>
    );
  }
  if (!summary) {
    return (
      <div className="py-6 text-center text-slate-400">
        <p className="text-sm">No summary data available.</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <MessageSquare size={18} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{summary.inquiries_count}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Inquiries</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <FileText size={18} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{summary.quotations_sent_count}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quotations</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <BarChart3 size={18} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{summary.leads_total}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <Phone size={18} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{summary.total_contacts}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Contacts</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <Building2 size={18} className="text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{summary.total_customers}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Customers</p>
        </div>
      </div>
      {summary.inquiries_by_type.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Inquiries by type</p>
          <div className="flex flex-wrap gap-2">
            {summary.inquiries_by_type.map(item => (
              <span key={item.activity_type} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                <Activity size={11} /> {item.activity_type}: {item.count}
              </span>
            ))}
          </div>
        </div>
      )}
      {summary.leads_by_status.length > 0 && (
        <div className="border-t border-slate-100 pt-4 mt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Leads by status</p>
          <div className="flex flex-wrap gap-2">
            {summary.leads_by_status.map(item => (
              <span key={item.status_id} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                <PieChart size={11} /> {item.status_label}: {item.count}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export const MyTeamPage: React.FC = () => {
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_myteam'));
  const token = useAppSelector(selectToken);
  const currentEmployee = useAppSelector(selectEmployee);

  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { dateFrom, dateTo } = useMemo(() => {
    if (datePreset === 'custom') return { dateFrom: customFrom, dateTo: customTo };
    return getDateRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const [scope, setScope] = useState<ReportScopeResponse | null>(null);
  const [loadingScope, setLoadingScope] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);

  // Scope filter pills
  type ScopeFilter = { type: 'all' } | { type: 'domain'; domainId: number } | { type: 'region'; regionId: number };
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter | null>(null);

  // Domains and regions for filter pills (fetched separately — not returned by reports scope API)
  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // Filter employees based on active pill
  const filteredEmployees = useMemo(() => {
    if (!scopeFilter || !scope?.employees) return scope?.employees ?? [];
    if (scopeFilter.type === 'all') return scope.employees;
    if (scopeFilter.type === 'domain') return scope.employees.filter(e => e.domain_id === scopeFilter.domainId);
    if (scopeFilter.type === 'region') return scope.employees.filter(e => e.region_id === scopeFilter.regionId);
    return scope.employees;
  }, [scope, scopeFilter]);

  // ── Pill domain/region lists (scoped to user's role, same pattern as DomainsPage) ──
  const pillDomains = useMemo(() => {
    const stored = getStoredMarketingScope();
    if (!stored || stored.role === 'super_admin') return domains;
    if (stored.role === 'domain_head') {
      const allowedIds = stored.domain_id ? [stored.domain_id] : [];
      return domains.filter(d => allowedIds.includes(d.id));
    }
    if (stored.role === 'region_head') {
      const allowedRegionIds = stored.region_ids || (stored.region_id ? [stored.region_id] : []);
      const allowedDomainIds = regions.filter(r => allowedRegionIds.includes(r.id)).map(r => r.domain_id);
      return domains.filter(d => allowedDomainIds.includes(d.id));
    }
    return [];
  }, [domains, regions]);

  const pillRegions = useMemo(() => {
    const stored = getStoredMarketingScope();
    if (!stored || stored.role === 'super_admin') return regions;
    if (stored.role === 'domain_head') {
      const allowedDomainIds = stored.domain_id ? [stored.domain_id] : [];
      return regions.filter(r => allowedDomainIds.includes(r.domain_id));
    }
    if (stored.role === 'region_head') {
      const allowedIds = stored.region_ids || (stored.region_id ? [stored.region_id] : []);
      return regions.filter(r => allowedIds.includes(r.id));
    }
    return [];
  }, [domains, regions]);

  // ── Per-section loading states
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingExpected, setLoadingExpected] = useState(false);
  const [loadingOD, setLoadingOD] = useState(false);
  const [loadingDSR, setLoadingDSR] = useState(false);
  const [loadingEmployeeStats, setLoadingEmployeeStats] = useState(true);

  const [targetStats, setTargetStats] = useState<DashboardTargetStats | null>(null);
  const [summary, setSummary] = useState<ReportSummaryResponse | null>(null);
  const [employeeStats, setEmployeeStats] = useState<Map<number, DashboardTargetStats>>(new Map());
  const [expectedOrderReports, setExpectedOrderReports] = useState<ExpectedOrderReportItem[]>([]);
  const [odPlanReports, setODPlanReports] = useState<ODPlanReportItem[]>([]);
  const [dsrTasks, setDSRTasks] = useState<DSRTask[]>([]);
  const [dsrSpan, setDsrSpan] = useState(2);

  // In-memory employee data cache (key = employeeId)
  const dataCache = useRef<Map<string, EmployeeData>>(new Map());

  // Track current request to discard stale responses
  const currentReqId = useRef(0);

  // ── Scope ──
  const loadScope = useCallback(async () => {
    const cached = getCached<ReportScopeResponse>(SCOPE_CACHE_KEY);
    if (cached) {
      setScope(cached);
      setLoadingScope(false);
      if (cached.employees.length === 1) {
        setSelectedEmployeeId(cached.employees[0].id);
      }
      return;
    }

    setLoadingScope(true);
    try {
      const data = await marketingAPI.getReportsScope();
      setCache(SCOPE_CACHE_KEY, data);
      setScope(data);
      if (data.employees.length === 1) {
        setSelectedEmployeeId(data.employees[0].id);
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to load team scope', 'error');
    } finally {
      setLoadingScope(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (canView) loadScope();
  }, [canView, loadScope]);

  // Load domains/regions for filter pills (not cached — fetched fresh each time)
  useEffect(() => {
    if (!canView) return;
    setLoadingDomains(true);
    setLoadingRegions(true);
    Promise.all([
      marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 }),
      marketingAPI.getRegions({ is_active: true, page: 1, page_size: 100 }),
    ]).then(([domainsRes, regionsRes]) => {
      setDomains(domainsRes.items);
      setRegions(regionsRes.items);
    }).catch(() => {}).finally(() => {
      setLoadingDomains(false);
      setLoadingRegions(false);
    });
  }, [canView]);

  const handleRefreshScope = useCallback(() => {
    clearCache(SCOPE_CACHE_KEY);
    loadScope();
  }, [loadScope]);

  // ── Per-section data loading ──
  const loadSection = useCallback(async <T,>(
    key: string,
    fetchFn: () => Promise<T>,
    setter: (data: T) => void,
    setLoading: (v: boolean) => void,
    reqId: number,
  ) => {
    setLoading(true);
    try {
      const data = await fetchFn();
      if (reqId === currentReqId.current) {
        setter(data);
      }
    } catch (e: any) {
      if (reqId === currentReqId.current) {
        showToast(e?.message || 'Failed to load data', 'error');
      }
    } finally {
      if (reqId === currentReqId.current) {
        setLoading(false);
      }
    }
  }, [showToast]);

  useEffect(() => {
    if (!selectedEmployeeId) {
      setTargetStats(null);
      setSummary(null);
      setEmployeeStats(new Map());
      setExpectedOrderReports([]);
      setODPlanReports([]);
      setDSRTasks([]);
      return;
    }

    const id = selectedEmployeeId;
    const cacheKey = getCacheKey('employee_data', `${id}_${dateFrom}_${dateTo}`);
    const months = getMonthsInRange(dateFrom, dateTo);

    // Check cache first (only for per-employee mode)
    if (id !== ALL_ID) {
      const cached = dataCache.current.get(cacheKey);
      if (cached) {
        setTargetStats(cached.targetStats);
        setSummary(cached.summary);
        setExpectedOrderReports(cached.expectedOrderReports ?? []);
        setODPlanReports(cached.odPlanReports ?? []);
        setDSRTasks(cached.dsrTasks ?? []);
        return;
      }
    }

    currentReqId.current += 1;
    const reqId = currentReqId.current;

    // ── ALL mode: aggregate across all filtered employees ──
    if (id === ALL_ID) {
      setSummary(null);
      setDSRTasks([]);

      loadSection(
        'target',
        () => marketingAPI.getScopeTargetStats({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          domain_id: scopeFilter?.type === 'domain' ? scopeFilter.domainId : undefined,
          region_id: scopeFilter?.type === 'region' ? scopeFilter.regionId : undefined,
        }),
        (data) => setTargetStats(data),
        setLoadingTarget,
        reqId,
      );

      // Expected orders: fetch for all filtered employees
      const empIds = filteredEmployees.map(e => e.id);
      loadSection(
        'expected',
        () => Promise.all(
          empIds.map(eid =>
            Promise.all(
              months.map(m => marketingAPI.listExpectedOrderReports({
                employee_id: eid, year: m.year, month: m.month,
              }))
            )
          )
        ).then(r => r.flat(2)),
        (data) => setExpectedOrderReports(data),
        setLoadingExpected,
        reqId,
      );

      // OD plans: fetch for all filtered employees
      loadSection(
        'od',
        () => Promise.all(
          empIds.map(eid =>
            Promise.all(
              months.map(m => marketingAPI.listODPlanReports({
                employee_id: eid, year: m.year, month: m.month,
              }))
            )
          )
        ).then(r => r.flat(2)),
        (data) => setODPlanReports(data),
        setLoadingOD,
        reqId,
      );

      // Performance summary: fetch per employee and aggregate
      loadSection(
        'summary',
        () => Promise.all(
          empIds.map(eid =>
            marketingAPI.getReportsSummary({
              employee_id: eid,
              date_from: dateFrom || undefined,
              date_to: dateTo || undefined,
            })
          )
        ).then(r => mergeSummaries(r)),
        (data) => setSummary(data),
        setLoadingSummary,
        reqId,
      );

      // Employee breakdown stats: fetch per employee target stats
      loadSection(
        'employeeStats',
        () => Promise.all(
          empIds.map(eid =>
            marketingAPI.getDashboardTargetStats({
              employee_id: eid,
              date_from: dateFrom || undefined,
              date_to: dateTo || undefined,
            }).then(stats => ({ employeeId: eid, stats }))
          )
        ).then(results => {
          const map = new Map<number, DashboardTargetStats>();
          results.forEach(r => map.set(r.employeeId, r.stats));
          return map;
        }),
        (data) => setEmployeeStats(data),
        setLoadingEmployeeStats,
        reqId,
      );
      return;
    }

    // ── Per-employee mode ──
    // ── Target stats ──
    loadSection(
      'target',
      () => marketingAPI.getDashboardTargetStats({
        employee_id: id,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
      (data) => {
        setTargetStats(data);
        cachePartial(cacheKey, { targetStats: data });
      },
      setLoadingTarget,
      reqId,
    );

    // ── Summary ──
    loadSection(
      'summary',
      () => marketingAPI.getReportsSummary({
        employee_id: id,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
      (data) => {
        setSummary(data);
        cachePartial(cacheKey, { summary: data });
      },
      setLoadingSummary,
      reqId,
    );

    // ── Expected orders ──
    loadSection(
      'expected',
      () => Promise.all(
        months.map(m => marketingAPI.listExpectedOrderReports({
          employee_id: id, year: m.year, month: m.month,
        }))
      ).then(r => r.flat()),
      (data) => {
        setExpectedOrderReports(data);
        cachePartial(cacheKey, { expectedOrderReports: data });
      },
      setLoadingExpected,
      reqId,
    );

    // ── OD plans ──
    loadSection(
      'od',
      () => Promise.all(
        months.map(m => marketingAPI.listODPlanReports({
          employee_id: id, year: m.year, month: m.month,
        }))
      ).then(r => r.flat()),
      (data) => {
        setODPlanReports(data);
        cachePartial(cacheKey, { odPlanReports: data });
      },
      setLoadingOD,
      reqId,
    );

    // ── DSR tasks ──
    const empUsername = scope?.employees.find(e => e.id === id)?.username;
    if (token && empUsername) {
      loadSection(
        'dsr',
        () => hrmsRBACClient.getDSR(token, {
          username: empUsername,
          filter_date: dateFrom || undefined,
        }),
        (data) => {
          setDSRTasks(data);
          cachePartial(cacheKey, { dsrTasks: data });
        },
        setLoadingDSR,
        reqId,
      );
    }
  }, [selectedEmployeeId, dateFrom, dateTo, token, scope, loadSection, filteredEmployees]);

  function cachePartial(cacheKey: string, partial: Partial<EmployeeData>) {
    const existing = dataCache.current.get(cacheKey) || {} as EmployeeData;
    dataCache.current.set(cacheKey, { ...existing, ...partial });
  }

  const conversionRatio = useMemo(() => {
    if (!targetStats) return null;
    const total = targetStats.won_leads_count_this_month + targetStats.lost_leads_count_this_month;
    if (total === 0) return null;
    return (targetStats.won_leads_count_this_month / total) * 100;
  }, [targetStats]);

  const targetAchievedPct = useMemo(() => {
    if (!targetStats || targetStats.monthly_target === 0) return null;
    return (targetStats.achieved_this_month / targetStats.monthly_target) * 100;
  }, [targetStats]);

  const targetLabel = useMemo(() => {
    if (datePreset === 'today') return "Today's Target";
    if (datePreset === 'this_week') return "This Week's Target";
    if (datePreset === 'this_month') return "Monthly Target";
    if (datePreset === 'this_quarter') return "Quarterly Target";
    if (datePreset === 'this_year') return "Yearly Target";
    if (datePreset === 'custom' && customFrom && customTo) {
      const f = new Date(customFrom);
      const t = new Date(customTo);
      if (f.getTime() === t.getTime()) return 'Target';
      if (f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear()) return 'Monthly Target';
    }
    return 'Target';
  }, [datePreset, customFrom, customTo]);

  const dateFilterOptions: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom' },
  ];

  const breadcrumbs = [{ label: 'My Team', href: '/my-team' }];

  return (
    <PageLayout
      title="My Team"
      description="View your team members' performance data — targets, leads, expected orders, and outdoor plans."
      breadcrumbs={breadcrumbs}
    >
      {!canView && (
        <Card className="mb-6">
          <p className="text-slate-600">You do not have permission to view this page.</p>
          <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_myteam</p>
        </Card>
      )}

      {canView && (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 ml-0.5">Period</label>
                <div className="flex gap-1.5">
                  {dateFilterOptions.map(opt => (
                    <Button
                      key={opt.value}
                      variant={datePreset === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDatePreset(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
              {datePreset === 'custom' && (
                <>
                  <div className="flex flex-col gap-1">
                    <DatePicker label="From" value={customFrom} onChange={v => setCustomFrom(v || '')} inputSize="sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <DatePicker label="To" value={customTo} onChange={v => setCustomTo(v || '')} inputSize="sm" />
                  </div>
                </>
              )}
            </div>

            {loadingScope ? (
            <div className="flex items-center gap-2.5 py-4 mt-2">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">Loading team scope...</span>
            </div>
          ) : (
              <div className="mt-4 flex flex-wrap items-end gap-4">
                {scope?.can_select_employee && filteredEmployees.length > 0 ? (
                  <div className="flex flex-col gap-1 min-w-[220px]">
                    <Select
                      label="Team member"
                      value={selectedEmployeeId ?? ''}
                      onChange={(val) => setSelectedEmployeeId(val !== undefined && val !== '' ? Number(val) : undefined)}
                      options={[
                        ...(currentEmployee?.id ? [{ value: currentEmployee.id, label: 'My Data' as const }] : []),
                        { value: ALL_ID, label: 'All Team Members (Combined)' },
                        ...filteredEmployees.map(emp => ({ value: emp.id, label: emp.name })),
                      ]}
                      placeholder="Select employee..."
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                    <Users size={16} />
                    <span>You don't have any team members to view.</span>
                  </div>
                )}
                {scope?.role && scope.role !== 'self' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <UserCheck size={13} />
                    {scope.role === 'domain_head' ? 'Domain Head' : scope.role === 'region_head' ? 'Region Head' : scope.role === 'super_admin' ? 'Super Admin' : 'Team Lead'}
                    {selectedEmployeeId === ALL_ID && scope.employees.length > 0 && (
                      <> · {filteredEmployees.length} member{filteredEmployees.length !== 1 ? 's' : ''}</>
                    )}
                  </span>
                )}
              </div>
            )}
            {/* ── Scope filter pills ── */}
             {!loadingScope && scope && !loadingDomains && !loadingRegions && (
              scope.role === 'super_admin' ||
              (scope.role === 'domain_head' && pillDomains.length > 0) ||
              (scope.role === 'region_head' && pillRegions.length > 0)
            ) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => { setScopeFilter({ type: 'all' }); setSelectedEmployeeId(ALL_ID); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                    scopeFilter?.type === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                {(scope.role === 'super_admin' || scope.role === 'domain_head') && pillDomains.map(d => {
                  const isActive = scopeFilter?.type === 'domain' && scopeFilter.domainId === d.id;
                  return (
                    <button
                      key={`domain-${d.id}`}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setScopeFilter(null);
                        } else {
                          setScopeFilter({ type: 'domain', domainId: d.id });
                        }
                        setSelectedEmployeeId(ALL_ID);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
                {(scope.role === 'super_admin' || scope.role === 'region_head') && pillRegions.map(r => {
                  const isActive = scopeFilter?.type === 'region' && scopeFilter.regionId === r.id;
                  return (
                    <button
                      key={`region-${r.id}`}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setScopeFilter(null);
                        } else {
                          setScopeFilter({ type: 'region', regionId: r.id });
                        }
                        setSelectedEmployeeId(ALL_ID);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {r.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleRefreshScope}
                  className="px-2.5 py-1 text-xs font-semibold rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-1"
                  title="Refresh team data"
                >
                  <RefreshCw size={12} />
                  Sync
                </button>
              </div>
            )}
          </Card>

          {!selectedEmployeeId && scope?.can_select_employee !== false && (
            <Card className="py-12">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <UserCheck size={48} strokeWidth={1.2} />
                <p className="text-sm font-medium">Select a team member to view their data</p>
              </div>
            </Card>
          )}

          {selectedEmployeeId === ALL_ID && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card noPadding>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                    <Target size={14} /> {targetLabel}
                  </div>
                  {loadingTarget ? (
                    <div className="py-2 flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : targetStats ? (
                    <>
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(targetStats.monthly_target)}</p>
                      {targetStats.monthly_target > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((targetStats.achieved_this_month / targetStats.monthly_target) * 100, 100)}%` }} />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{Math.round((targetStats.achieved_this_month / targetStats.monthly_target) * 100)}% achieved</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xl font-bold text-slate-400">—</p>
                  )}
                </div>
              </Card>
              <Card noPadding>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                    <TrendingUp size={14} /> Achieved
                  </div>
                  {loadingTarget ? (
                    <div className="py-2 flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : targetStats ? (
                    <>
                      <p className="text-xl font-bold text-emerald-600">{formatCurrency(targetStats.achieved_this_month)}</p>
                      <p className="text-[11px] text-slate-500 mt-1">vs target of {formatCurrency(targetStats.monthly_target)}</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-slate-400">—</p>
                  )}
                </div>
              </Card>
              <Card noPadding>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                    <Trophy size={14} /> Won
                  </div>
                  {loadingTarget ? (
                    <div className="py-2 flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-emerald-600">{targetStats?.won_leads_count_this_month ?? '—'}</p>
                  )}
                </div>
              </Card>
              <Card noPadding>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                    <XCircle size={14} /> Lost
                  </div>
                  {loadingTarget ? (
                    <div className="py-2 flex items-center justify-center">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-rose-500">{targetStats?.lost_leads_count_this_month ?? '—'}</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {selectedEmployeeId === ALL_ID && (
            <>
              {/* ── Expected Orders + OD Plans (aggregate) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card title="Expected Orders" description="Leads expected to close across all team members.">
                  {loadingExpected ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-xs text-slate-500 font-medium">Loading expected orders...</p>
                    </div>
                  ) : expectedOrderReports.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                      <Calendar size={28} />
                      <p className="text-sm">No expected order reports.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expectedOrderReports.map(r => {
                        const won = r.leads.filter(l => l.lead_is_final && !l.lead_is_lost).length;
                        const lost = r.leads.filter(l => l.lead_is_lost).length;
                        const expected = r.leads.filter(l => !l.lead_is_final && !l.lead_is_lost).length;
                        return (
                          <div key={r.id} className="border border-slate-200 rounded-lg p-3">
                            <div className="font-medium text-slate-800 text-sm">
                              {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{r.leads.length} lead{r.leads.length !== 1 ? 's' : ''}</div>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {won > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Won: {won}</span>}
                              {lost > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Lost: {lost}</span>}
                              {expected > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Expected: {expected}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card title="Outdoor (OD) Plans" description="Visit and travel plans across all team members.">
                  {loadingOD ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-xs text-slate-500 font-medium">Loading outdoor plans...</p>
                    </div>
                  ) : odPlanReports.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                      <MapPin size={28} />
                      <p className="text-sm">No OD plans.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {odPlanReports.map(r => {
                        const visits = r.entries.filter(e => e.entry_type === 'visit' || e.entry_type === 'field_visit').length;
                        const meetings = r.entries.filter(e => e.entry_type === 'meeting').length;
                        const other = r.entries.length - visits - meetings;
                        return (
                          <div key={r.id} className="border border-slate-200 rounded-lg p-3">
                            <div className="font-medium text-slate-800 text-sm">
                              {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{r.entries.length} entr{r.entries.length !== 1 ? 'ies' : 'y'}</div>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {visits > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full"><MapPin size={11} /> Visits: {visits}</span>}
                              {meetings > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full"><Users size={11} /> Meetings: {meetings}</span>}
                              {other > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"><Activity size={11} /> Other: {other}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* ── Team breakdown table ── */}
              {filteredEmployees.length > 0 && (
                <Card className="mb-6" title="Team Breakdown" description="Per-employee performance for the selected filter.">
                  {loadingEmployeeStats ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-xs text-slate-500 font-medium">Loading team breakdown...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="py-2 pr-4">Employee</th>
                            <th className="py-2 pr-4">Target</th>
                            <th className="py-2 pr-4">Achieved</th>
                            <th className="py-2 pr-4">%</th>
                            <th className="py-2 pr-4">Won</th>
                            <th className="py-2 pr-2">Lost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEmployees.map(emp => {
                            const st = employeeStats.get(emp.id);
                            const target = st?.monthly_target ?? 0;
                            const achieved = st?.achieved_this_month ?? 0;
                            const pct = target > 0 ? Math.round((achieved / target) * 100) : null;
                            return (
                              <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="py-2 pr-4 font-medium text-slate-800">{emp.name}</td>
                                <td className="py-2 pr-4 text-slate-900">{formatCurrency(target)}</td>
                                <td className="py-2 pr-4 text-emerald-600">{formatCurrency(achieved)}</td>
                                <td className="py-2 pr-4">
                                  {pct !== null ? (
                                    <span className={`text-xs font-semibold ${pct >= 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-500'}`}>
                                      {pct}%
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2 pr-4 text-emerald-600">{st?.won_leads_count_this_month ?? 0}</td>
                                <td className="py-2 pr-2 text-rose-500">{st?.lost_leads_count_this_month ?? 0}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}

              {/* ── DSR (not available in aggregate) ── */}
              <Card className="mb-6">
                <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                  <ClipboardList size={28} />
                  <p className="text-sm">Select a specific employee to view their DSR tasks.</p>
                </div>
              </Card>

              {/* ── Summary (aggregate) ── */}
              <Card title="Performance Summary" description="Aggregated metrics for the selected filter and period.">
                <SummaryContent loading={loadingSummary} summary={summary} />
              </Card>
            </>
          )}

          {selectedEmployeeId && selectedEmployeeId !== ALL_ID && (
            <>
              {/* ── KPI cards load independently ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card noPadding>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                      <Target size={14} /> Target
                    </div>
                    {loadingTarget ? (
                      <div className="py-2 flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-slate-900">
                          {targetStats ? formatCurrency(targetStats.monthly_target) : '—'}
                        </p>
                        {targetAchievedPct !== null && (
                          <div className="mt-2">
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(targetAchievedPct, 100)}%` }} />
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">{Math.round(targetAchievedPct)}% achieved</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>

                <Card noPadding>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                      <TrendingUp size={14} /> Achieved
                    </div>
                    {loadingTarget ? (
                      <div className="py-2 flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-emerald-600">
                          {targetStats ? formatCurrency(targetStats.achieved_this_month) : '—'}
                        </p>
                        {targetStats && (
                          <p className="text-[11px] text-slate-500 mt-1">vs target of {formatCurrency(targetStats.monthly_target)}</p>
                        )}
                      </>
                    )}
                  </div>
                </Card>

                <Card noPadding>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                      <Trophy size={14} /> Won
                    </div>
                    {loadingTarget ? (
                      <div className="py-2 flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-emerald-600">
                          {targetStats?.won_leads_count_this_month ?? '—'}
                        </p>
                        {conversionRatio !== null && (
                          <p className="text-[11px] text-emerald-600 mt-1">{Math.round(conversionRatio)}% conversion rate</p>
                        )}
                      </>
                    )}
                  </div>
                </Card>

                <Card noPadding>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
                      <XCircle size={14} /> Lost
                    </div>
                    {loadingTarget ? (
                      <div className="py-2 flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-rose-500">
                        {targetStats?.lost_leads_count_this_month ?? '—'}
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/* ── Expected Orders + OD Plans (load independently) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card title="Expected Orders" description="Leads expected to close in the selected period.">
                  {loadingExpected ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-xs text-slate-500 font-medium">Loading expected orders...</p>
                    </div>
                  ) : expectedOrderReports.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                      <Calendar size={28} />
                      <p className="text-sm">No expected order reports.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expectedOrderReports.map(r => {
                        const won = r.leads.filter(l => l.lead_is_final && !l.lead_is_lost).length;
                        const lost = r.leads.filter(l => l.lead_is_lost).length;
                        const expected = r.leads.filter(l => !l.lead_is_final && !l.lead_is_lost).length;
                        return (
                          <div key={r.id} className="border border-slate-200 rounded-lg p-3">
                            <div className="font-medium text-slate-800 text-sm">
                              {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{r.leads.length} lead{r.leads.length !== 1 ? 's' : ''}</div>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {won > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Won: {won}</span>}
                              {lost > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Lost: {lost}</span>}
                              {expected > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Expected: {expected}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card title="Outdoor (OD) Plans" description="Visit and travel plans for the selected period.">
                  {loadingOD ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-xs text-slate-500 font-medium">Loading outdoor plans...</p>
                    </div>
                  ) : odPlanReports.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                      <MapPin size={28} />
                      <p className="text-sm">No OD plans.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {odPlanReports.map(r => {
                        const visits = r.entries.filter(e => e.entry_type === 'visit' || e.entry_type === 'field_visit').length;
                        const meetings = r.entries.filter(e => e.entry_type === 'meeting').length;
                        const other = r.entries.length - visits - meetings;
                        return (
                          <div key={r.id} className="border border-slate-200 rounded-lg p-3">
                            <div className="font-medium text-slate-800 text-sm">
                              {new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{r.entries.length} entr{r.entries.length !== 1 ? 'ies' : 'y'}</div>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {visits > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full"><MapPin size={11} /> Visits: {visits}</span>}
                              {meetings > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full"><Users size={11} /> Meetings: {meetings}</span>}
                              {other > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"><Activity size={11} /> Other: {other}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* ── DSR tasks (loads independently, resizable) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card
                  title="Daily Status Report (DSR)"
                  description="Task updates for the selected period."
                  showHandle
                  onResize={() => setDsrSpan(s => ((s % 2) + 1) as 1 | 2)}
                  className={dsrSpan === 1 ? 'lg:col-span-1' : 'lg:col-span-2'}
                >
                  {loadingDSR ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
                      <p className="text-xs text-slate-500 font-medium">Loading DSR tasks...</p>
                    </div>
                  ) : dsrTasks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
                      <ClipboardList size={28} />
                      <p className="text-sm">No DSR tasks for this period.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dsrTasks.filter(t => t.status === 'pending').length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Clock size={12} /> Pending
                          </p>
                          <div className="space-y-2">
                            {dsrTasks.filter(t => t.status === 'pending').map(task => (
                              <div key={task.id} className="border border-amber-200 bg-amber-50/30 rounded-lg p-3">
                                <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                                {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                                <p className="text-[10px] text-slate-400 mt-1">{task.date}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {dsrTasks.filter(t => t.status === 'completed').length > 0 && (
                        <div className="mt-3">
                          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> Completed
                          </p>
                          <div className="space-y-2">
                            {dsrTasks.filter(t => t.status === 'completed').map(task => (
                              <div key={task.id} className="border border-emerald-200 bg-emerald-50/30 rounded-lg p-3">
                                <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                                {task.description && <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>}
                                <p className="text-[10px] text-slate-400 mt-1">{task.date}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* ── Summary (loads independently) ── */}
              <Card title="Performance Summary" description="Aggregated metrics for the selected period and employee.">
                <SummaryContent loading={loadingSummary} summary={summary} />
              </Card>
            </>
          )}
        </>
      )}
    </PageLayout>
  );
};
