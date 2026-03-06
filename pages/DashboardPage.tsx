
import React, { useState, useEffect, useCallback, useId } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../components/layout/PageLayout';
import { marketingAPI } from '../lib/marketing-api';
import { ApiError } from '../lib/api';
import { StatItem } from '../types';
import { Lead, DashboardTargetStats, ScopeTargetStats, ReportScopeResponse, TaskItem, HeadDashboardSummaryResponse, leadDisplayName, leadDisplayCompany, SavedDashboardResponse } from '../lib/marketing-api';
import { Modal } from '../components/ui/Modal';
import { Download, Layout as LayoutIcon, Check, RefreshCw, Users, UserCircle, Quote, FileText, ShieldAlert, Target, Trophy, XCircle, ListTodo, CheckSquare, Square, Plus, MessageSquare, Upload, Trash2 } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText } from '../constants';
import { serializePhoneWithCountryCode } from '../lib/name-phone-utils';
import { WidgetConfig, WidgetId, DashboardWidgetType } from '../types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TargetAchievedBarChart,
  WonLostPieChart,
  LeadStatusPieChart,
  RegionBreakdownBarChart,
  InquiriesQuotationsBarChart,
  HeatmapWidget,
  CustomCodeWidget,
} from '../components/ui/ChartsSection';

const CHART_COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#059669', '#e11d48', '#f59e0b', '#94a3b8'];

/** Migrate saved layout: ensure each widget has type (from id for legacy). */
function migrateLayout(saved: WidgetConfig[]): WidgetConfig[] {
  if (!Array.isArray(saved)) return [];
  return saved.map((w) => ({
    ...w,
    id: w.id,
    type: w.type ?? (w.id as DashboardWidgetType),
    span: w.span ?? 1,
  }));
}

const WIDGET_TYPE_OPTIONS: { value: DashboardWidgetType; label: string }[] = [
  { value: 'target-card', label: 'Target (this month)' },
  { value: 'leads-by-region', label: 'Leads by region' },
  { value: 'head-summary', label: 'Head summary' },
  { value: 'target-achieved-chart', label: 'Chart: Target vs achieved' },
  { value: 'won-lost-chart', label: 'Chart: Won vs lost' },
  { value: 'leads-by-status-chart', label: 'Chart: Leads by status' },
  { value: 'inquiries-quotations-chart', label: 'Chart: Inquiries & quotations' },
  { value: 'revenue-chart', label: 'Chart: Revenue / overview' },
  { value: 'goal-chart', label: 'Activity / goal' },
  { value: 'activity-table', label: 'Table: Recent leads' },
  { value: 'global-reach', label: 'Quick links' },
  { value: 'bar_chart', label: 'Bar chart' },
  { value: 'pie_chart', label: 'Pie chart' },
  { value: 'area_chart', label: 'Area chart' },
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'table', label: 'Table' },
  { value: 'custom_code', label: 'Custom / code' },
  { value: 'custom_sql', label: 'Custom SQL chart' },
  { value: 'stat', label: 'Stat card' },
];

// Same activity types as lead page Add log form (quotations, attachments, status change, etc.)
const ACTIVITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'lead_status_change', label: 'Status change' },
  { value: 'contacted_different_person', label: 'Contacted different person' },
  { value: 'qtn_submitted', label: 'QTN Submitted' },
  { value: 'qtn_followup', label: 'QTN Followup' },
  { value: 'technical_discussions', label: 'Technical Discussions' },
  { value: 'at_customer_desk', label: 'At Customer Desk' },
  { value: 'order_finalization_ap', label: 'Order Finalization (AP)' },
  { value: 'po_release_ap', label: 'PO Release (AP)' },
  { value: 'po_acknowledge_ap', label: 'PO Acknowledge (AP)' },
  { value: 'wo_prepared', label: 'WO Prepared' },
  { value: 'on_hold_customer_end', label: 'On-Hold (Customer end)' },
  { value: 'requirement_cancelled_customer_end', label: 'Requirement Cancelled (Customer end)' },
  { value: 'order_loss_1', label: '1 - Order Loss' },
  { value: 'order_loss_2', label: '2 - Order Loss' },
  { value: 'order_loss_3', label: '3 - Order Loss' },
];

/** Fetches and displays result of execute-widget (SQL or preset). */
function CustomSqlWidgetContent({
  code,
  chartType,
  onError,
}: {
  code?: string;
  chartType?: string;
  onError: (msg: string) => void;
}) {
  const gradientId = useId();
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(!!code);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code?.trim()) {
      setLoading(false);
      setData([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    marketingAPI
      .executeWidget({
        chart_type: chartType || 'table',
        data_source: { kind: 'sql', value: code.trim() },
      })
      .then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
      })
      .catch((e) => {
        const msg = e?.message || 'Failed to run SQL';
        setError(msg);
        onError(msg);
      })
      .finally(() => setLoading(false));
  }, [code, chartType, onError]);

  if (!code?.trim()) {
    return <p className="text-sm text-slate-500 p-4">Add SQL in edit mode (SELECT only). Save dashboard to backend to run.</p>;
  }
  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-rose-600 p-4">{error}</p>;
  }
  if (data.length === 0) {
    return <p className="text-sm text-slate-500 p-4">No rows returned.</p>;
  }
  const rows = data as Record<string, unknown>[];
  const allKeys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const keys = allKeys.length > 0 ? allKeys : Object.keys(rows[0] || {});

  const isChart = chartType && chartType !== 'table' && ['bar', 'line', 'pie', 'heatmap'].includes(chartType);

  if (isChart) {
    const labelCandidates = ['label', 'name', 'category', 'x'];
    const valueCandidates = ['value', 'count', 'total', 'y'];
    const labelKey = keys.find((k) => labelCandidates.includes(k.toLowerCase())) ?? keys[0];
    const valueKey = keys.find((k) => valueCandidates.includes(k.toLowerCase())) ?? keys.find((k) => k !== labelKey && (typeof rows[0]?.[k] === 'number' || typeof rows[0]?.[k] === 'string')) ?? keys[1] ?? keys[0];
    const chartData = rows.map((row) => ({
      name: String(row[labelKey] ?? '—').slice(0, 30),
      value: Number(row[valueKey]) || 0,
    })).filter((d) => d.value !== 0 || chartType === 'bar' || chartType === 'line');

    if (chartType === 'heatmap') {
      const rowKey = keys[0];
      const colKey = keys[1];
      const valKey = keys[2] ?? keys[1];
      const rowVals = Array.from(new Set(rows.map((r) => String(r[rowKey] ?? ''))));
      const colVals = Array.from(new Set(rows.map((r) => String(r[colKey] ?? ''))));
      const matrix: number[][] = rowVals.map(() => colVals.map(() => 0));
      rows.forEach((r) => {
        const ri = rowVals.indexOf(String(r[rowKey] ?? ''));
        const ci = colVals.indexOf(String(r[colKey] ?? ''));
        if (ri >= 0 && ci >= 0) matrix[ri][ci] = Number(r[valKey]) || 0;
      });
      return (
        <div className="h-[260px] w-full p-2">
          <HeatmapWidget rows={rowVals} columns={colVals} data={matrix} />
        </div>
      );
    }

    if (chartData.length === 0) {
      return <p className="text-sm text-slate-500 p-4">No data to chart (need label + value columns).</p>;
    }

    const commonChartProps = { margin: { top: 5, right: 10, left: -10, bottom: 5 } as const };

    if (chartType === 'pie') {
      const withColors = chartData.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] }));
      return (
        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={withColors} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} label={({ name, value }) => `${name}: ${value}`}>
                {withColors.map((_, i) => (
                  <Cell key={i} fill={withColors[i].fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chartType === 'bar') {
      return (
        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} {...commonChartProps}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [v, valueKey]} />
              <Bar dataKey="value" name={valueKey} fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chartType === 'line') {
      return (
        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} {...commonChartProps}>
              <defs>
                <linearGradient id={`customSqlArea-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [v, valueKey]} />
              <Area type="monotone" dataKey="value" name={valueKey} stroke="#4f46e5" fill={`url(#customSqlArea-${gradientId})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }
  }

  const cellValue = (row: Record<string, unknown>, k: string) => {
    const v = row[k];
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string' && v.trim() === '') return '—';
    return String(v);
  };
  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full text-left text-xs border border-slate-200">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {keys.map((k) => (
              <th key={k} className="px-2 py-1.5 font-semibold text-slate-600">{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b border-slate-100">
              {keys.map((k) => (
                <td key={k} className="px-2 py-1.5 text-slate-800">{cellValue(row || {}, k)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && <p className="text-xs text-slate-500 mt-1">Showing first 100 of {data.length} rows.</p>}
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const canViewReport = useAppSelector(selectHasPermission('marketing.view_report'));
  const [isExporting, setIsExporting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [reportSummary, setReportSummary] = useState<{ inquiries_count: number; quotations_sent_count: number; leads_total: number } | null>(null);
  const [leadStatusCounts, setLeadStatusCounts] = useState<{ label: string; count: number }[]>([]);
  const [targetStats, setTargetStats] = useState<DashboardTargetStats | null>(null);
  const [scopeTargetStats, setScopeTargetStats] = useState<ScopeTargetStats | null>(null);
  const [reportScope, setReportScope] = useState<ReportScopeResponse | null>(null);
  const [headSummary, setHeadSummary] = useState<HeadDashboardSummaryResponse | null>(null);
  const [headSummaryLoading, setHeadSummaryLoading] = useState(false);
  const [todayTasks, setTodayTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [manualTaskTitle, setManualTaskTitle] = useState('');
  const [manualTaskDescription, setManualTaskDescription] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    activity_type: 'call',
    title: '',
    description: '',
    from_status_id: undefined as number | undefined,
    to_status_id: undefined as number | undefined,
    contact_person_name_prefix: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone_code: DEFAULT_COUNTRY_CODE,
    contact_person_phone: '',
  });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [manualTaskSubmitting, setManualTaskSubmitting] = useState(false);
  const [taskModalLeadStatuses, setTaskModalLeadStatuses] = useState<{ id: number; label: string }[]>([]);
  const [taskModalSeriesList, setTaskModalSeriesList] = useState<{ code: string; name: string }[]>([]);
  type AttachmentEntry = { id: string; kind: 'quotation' | 'attachment'; file: File | null; quotationNumber: string; title: string };
  const [taskModalAttachments, setTaskModalAttachments] = useState<AttachmentEntry[]>([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]);
  const [taskModalQuotationSeriesCode, setTaskModalQuotationSeriesCode] = useState('');
  const [taskModalQuotationIsRevised, setTaskModalQuotationIsRevised] = useState(false);

  const [layout, setLayout] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard-layout');
      const parsed = saved ? (JSON.parse(saved) as WidgetConfig[]) : [];
      return migrateLayout(parsed);
    } catch (e) {
      return [];
    }
  });

  const [savedDashboards, setSavedDashboards] = useState<SavedDashboardResponse[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [savedDashboardsLoading, setSavedDashboardsLoading] = useState(false);
  const [showCreateDashboardModal, setShowCreateDashboardModal] = useState(false);
  const [createDashboardName, setCreateDashboardName] = useState('');
  const [createDashboardSubmitting, setCreateDashboardSubmitting] = useState(false);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [addWidgetType, setAddWidgetType] = useState<DashboardWidgetType>('target-card');
  const [addWidgetTitle, setAddWidgetTitle] = useState('');
  const [addWidgetCode, setAddWidgetCode] = useState('');
  const [addWidgetChartType, setAddWidgetChartType] = useState<string>('table');

  const loadDashboard = useCallback(async () => {
    if (permissionDenied) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [leadsRes, contactsRes, customersRes, summary, statuses, targetStatsRes, scopeStatsRes, scopeRes] = await Promise.all([
        marketingAPI.getLeads({ page: 1, page_size: 10 }),
        marketingAPI.getContacts({ page: 1, page_size: 10 }),
        marketingAPI.getCustomers({ page: 1, page_size: 10 }),
        canViewReport ? marketingAPI.getReportsSummary().catch(() => null) : Promise.resolve(null),
        marketingAPI.getLeadStatuses({ is_active: true }).catch(() => []),
        marketingAPI.getDashboardTargetStats().catch(() => null),
        marketingAPI.getScopeTargetStats().catch(() => null),
        marketingAPI.getReportsScope().catch(() => null),
      ]);

      const leadsTotal = leadsRes.total;
      const contactsTotal = contactsRes.total;
      const customersTotal = customersRes.total;

      setRecentLeads(leadsRes.items);
      setReportSummary(summary ? { inquiries_count: summary.inquiries_count, quotations_sent_count: summary.quotations_sent_count, leads_total: summary.leads_total } : null);
      setTargetStats(targetStatsRes ?? null);
      setScopeTargetStats(scopeStatsRes ?? null);
      setReportScope(scopeRes ?? null);

      const scopeLabelForStats = scopeStatsRes?.scope_label ?? 'My';
      const statCards: StatItem[] = [
        { label: 'Leads', value: String(leadsTotal), change: 'Total in system', trend: 'neutral', icon: Users },
        { label: 'Contacts', value: String(contactsTotal), change: 'Total in system', trend: 'neutral', icon: UserCircle },
        { label: 'Customers', value: String(customersTotal), change: 'Total in system', trend: 'neutral', icon: Users },
        {
          label: scopeLabelForStats === 'My' ? 'My quotations sent' : `${scopeLabelForStats} quotations sent`,
          value: summary ? String(summary.quotations_sent_count) : '—',
          change: summary ? `${summary.inquiries_count} inquiries` : '—',
          trend: 'neutral',
          icon: Quote,
        },
      ];
      setStats(statCards);

      if (statuses.length && leadsRes.items.length) {
        const byStatus: Record<string, number> = {};
        statuses.forEach((s: { id: number; label: string }) => { byStatus[s.label] = 0; });
        leadsRes.items.forEach((l: Lead) => {
          const label = l.status_option?.label ?? statuses.find((s: { id: number }) => s.id === l.status_id)?.label ?? '—';
          byStatus[label] = (byStatus[label] ?? 0) + 1;
        });
        setLeadStatusCounts(Object.entries(byStatus).map(([label, count]) => ({ label, count })));
      } else {
        setLeadStatusCounts([]);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setPermissionDenied(true);
        showToast('You don\'t have permission to view this dashboard', 'error');
      } else {
        showToast('Failed to load dashboard data', 'error');
      }
      setStats([]);
      setRecentLeads([]);
      setReportSummary(null);
      setTargetStats(null);
    } finally {
      setLoading(false);
    }
  }, [showToast, permissionDenied, canViewReport]);

  const loadTasks = useCallback(async () => {
    if (permissionDenied) return;
    setTasksLoading(true);
    try {
      const list = await marketingAPI.getTodayTasks();
      setTodayTasks(list);
    } catch {
      setTodayTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [permissionDenied]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const isHeadRole = reportScope?.role === 'domain_head' || reportScope?.role === 'super_admin';

  useEffect(() => {
    if (permissionDenied || loading || !reportScope) return;
    if (isHeadRole) {
      setHeadSummaryLoading(true);
      marketingAPI.getHeadDashboardSummary()
        .then(setHeadSummary)
        .catch(() => setHeadSummary(null))
        .finally(() => setHeadSummaryLoading(false));
    } else {
      setHeadSummary(null);
    }
  }, [permissionDenied, loading, reportScope, isHeadRole]);

  useEffect(() => {
    if (!permissionDenied && !loading && reportScope && !isHeadRole) loadTasks();
  }, [permissionDenied, loading, reportScope, isHeadRole, loadTasks]);

  useEffect(() => {
    if (selectedDashboardId == null) {
      localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    }
  }, [layout, selectedDashboardId]);

  useEffect(() => {
    if (permissionDenied) return;
    setSavedDashboardsLoading(true);
    marketingAPI.getSavedDashboards()
      .then(setSavedDashboards)
      .catch(() => setSavedDashboards([]))
      .finally(() => setSavedDashboardsLoading(false));
  }, [permissionDenied]);

  useEffect(() => {
    if (selectedDashboardId == null) return;
    const d = savedDashboards.find((x) => x.id === selectedDashboardId);
    if (d?.config?.layout && Array.isArray(d.config.layout)) {
      setLayout(migrateLayout(d.config.layout as WidgetConfig[]));
    } else {
      marketingAPI.getSavedDashboard(selectedDashboardId).then((res) => {
        if (res.config?.layout && Array.isArray(res.config.layout)) {
          setLayout(migrateLayout(res.config.layout as WidgetConfig[]));
        }
      }).catch(() => setSavedDashboards((prev) => prev.filter((x) => x.id !== selectedDashboardId)));
    }
  }, [selectedDashboardId]);

  useEffect(() => {
    if (selectedTask?.lead_id) {
      marketingAPI.getLeadStatuses({ is_active: true }).then((list) =>
        setTaskModalLeadStatuses(list.map((s: { id: number; label: string }) => ({ id: s.id, label: s.label })))
      ).catch(() => setTaskModalLeadStatuses([]));
      marketingAPI.getSeries({ page: 1, page_size: 100, is_active: true }).then((r) => {
        const list = r.items.map((s: { code: string; name: string }) => ({ code: s.code, name: s.name }));
        setTaskModalSeriesList(list);
        // Default to first series so quotation numbers use the number series (not QTN-1, QTN-2)
        if (list.length > 0) setTaskModalQuotationSeriesCode(list[0].code);
      }).catch(() => setTaskModalSeriesList([]));
    } else {
      setTaskModalLeadStatuses([]);
      setTaskModalSeriesList([]);
    }
  }, [selectedTask?.lead_id]);

  const toggleResize = (id: string) => {
    setLayout(prev => prev.map(w => {
      if (w.id === id) {
        const nextSpan = (w.span % 3) + 1 as 1 | 2 | 3;
        return { ...w, span: nextSpan };
      }
      return w;
    }));
  };

  const removeWidget = (id: string) => {
    setLayout(prev => prev.filter(w => w.id !== id));
  };

  const addWidget = () => {
    const id = `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const widget: WidgetConfig = {
      id,
      type: addWidgetType,
      span: 1,
      title: addWidgetTitle.trim() || undefined,
      code: addWidgetType === 'custom_code' || addWidgetType === 'custom_sql' ? addWidgetCode.trim() || undefined : undefined,
      chart_type: addWidgetType === 'custom_sql' ? (addWidgetChartType || 'table') : undefined,
    };
    setLayout(prev => [...prev, widget]);
    setShowAddWidgetModal(false);
    setAddWidgetTitle('');
    setAddWidgetCode('');
    setAddWidgetChartType('table');
    setAddWidgetType('target-card');
  };

  const handleDragStart = (index: number) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return;
    const newOrder = [...layout];
    const itemToMove = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, itemToMove);
    setLayout(newOrder);
    setDraggedIndex(null);
  };

  const renderWidget = (config: WidgetConfig) => {
    const widgetType = (config.type ?? config.id) as string;
    const commonProps = {
      key: config.id,
      isDraggable: isEditMode,
      showHandle: isEditMode,
      onDragStart: () => handleDragStart(layout.indexOf(config)),
      onDragOver: handleDragOver,
      onDrop: () => handleDrop(layout.indexOf(config)),
      onResize: () => toggleResize(config.id),
      className: `${config.span === 1 ? 'col-span-1' : config.span === 2 ? 'col-span-2' : 'col-span-3'} ${isEditMode ? 'ring-2 ring-dashed ring-slate-200' : ''}`,
      headerAction: isEditMode ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); removeWidget(config.id); }}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          aria-label="Remove widget"
        >
          <Trash2 size={14} />
        </button>
      ) : undefined,
    };

    switch (widgetType) {
      case 'leads-by-region':
        if (!isHeadRole || !headSummary?.region_breakdown.length) {
          return (
            <Card {...commonProps} title="Leads by region" description="Total, won, lost per region">
              <p className="text-sm text-slate-500 p-4">Available for domain head and admin.</p>
            </Card>
          );
        }
        return (
          <Card {...commonProps} title="Leads by region" description="Total, won, lost per region">
            <RegionBreakdownBarChart data={headSummary.region_breakdown} />
          </Card>
        );
      case 'target-card': {
        const s = scopeTargetStats ?? targetStats;
        if (s == null) {
          return (
            <Card {...commonProps} title={`${scopeLabel} target this month`} description="Target and achieved in scope.">
              <p className="text-sm text-slate-500 p-4">No target data available.</p>
            </Card>
          );
        }
        return (
          <Card
            key={config.id}
            {...commonProps}
            title={scopeLabel === 'My' ? "This month's target" : `${scopeLabel} target this month`}
            description={scopeLabel === 'My'
              ? 'Achieved = sum of closed value from won leads this month (assigned to you or generated by you). Target can be set by admin in domain tree; default ₹8 lacs.'
              : `Achieved = sum of closed value from won leads this month in your ${scopeLabel.toLowerCase()} scope (${scopeTargetStats?.employee_count ?? 1} team member(s)).`}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Target size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Achieved this month</span>
                    <span className="font-semibold text-slate-900">₹{(s.achieved_this_month / 1_00_000).toFixed(2)} lacs</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (s.monthly_target ? (s.achieved_this_month / s.monthly_target) * 100 : 0)).toFixed(1)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Target: ₹{(s.monthly_target / 1_00_000).toFixed(2)} lacs for {new Date(s.year, s.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50">
                  <Trophy size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Won leads (this month)</p>
                    <p className="text-lg font-bold text-emerald-800">{s.won_leads_count_this_month}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50">
                  <XCircle size={18} className="text-rose-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Lost leads (this month)</p>
                    <p className="text-lg font-bold text-rose-800">{s.lost_leads_count_this_month}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      }
      case 'head-summary':
        if (!isHeadRole) {
          return (
            <Card {...commonProps} title="Head summary" description="Region-wise split and key metrics.">
              <p className="text-sm text-slate-500 p-4">Available for domain head and admin.</p>
            </Card>
          );
        }
        return (
          <Card {...commonProps} title="Head summary" description={headSummary ? `Region-wise split and key metrics for ${new Date(headSummary.year, headSummary.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.` : 'Region-wise split and key metrics.'}>
            {headSummaryLoading ? (
              <div className="p-6 flex items-center justify-center text-slate-500"><RefreshCw size={24} className="animate-spin" /></div>
            ) : headSummary ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500">Total leads</p>
                    <p className="text-xl font-bold text-slate-900">{headSummary.total_leads}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <p className="text-xs font-medium text-slate-500">Hot cases</p>
                    <p className="text-xl font-bold text-amber-800">{headSummary.hot_cases_count}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500">Conversion ratio</p>
                    <p className="text-xl font-bold text-slate-900">{headSummary.conversion_ratio_pct != null ? `${headSummary.conversion_ratio_pct}%` : '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg flex gap-2">
                    <div className="flex-1 p-2 rounded bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] font-medium text-slate-500">Won</p>
                      <p className="text-lg font-bold text-emerald-800">{headSummary.won_count}</p>
                    </div>
                    <div className="flex-1 p-2 rounded bg-rose-50 border border-rose-100">
                      <p className="text-[10px] font-medium text-slate-500">Lost</p>
                      <p className="text-lg font-bold text-rose-800">{headSummary.lost_count}</p>
                    </div>
                  </div>
                </div>
                {headSummary.region_breakdown.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <p className="text-xs font-medium text-slate-600 px-3 py-2 bg-slate-50 border-b border-slate-200">Region-wise split</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-medium text-slate-600">
                            <th className="px-3 py-2">Region</th>
                            <th className="px-3 py-2">Domain</th>
                            <th className="px-3 py-2 text-right">Total</th>
                            <th className="px-3 py-2 text-right">Won</th>
                            <th className="px-3 py-2 text-right">Lost</th>
                            <th className="px-3 py-2 text-right">Hot</th>
                            <th className="px-3 py-2 text-right">Conv.%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {headSummary.region_breakdown.map((r) => (
                            <tr key={r.region_id} className="border-t border-slate-100 hover:bg-slate-50/50">
                              <td className="px-3 py-2 font-medium text-slate-900">{r.region_name}</td>
                              <td className="px-3 py-2 text-slate-600">{r.domain_name}</td>
                              <td className="px-3 py-2 text-right">{r.total_leads}</td>
                              <td className="px-3 py-2 text-right text-emerald-700">{r.won_count}</td>
                              <td className="px-3 py-2 text-right text-rose-700">{r.lost_count}</td>
                              <td className="px-3 py-2 text-right text-amber-700">{r.hot_cases_count}</td>
                              <td className="px-3 py-2 text-right">{r.conversion_ratio_pct != null ? `${r.conversion_ratio_pct}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 p-4">No summary data available.</p>
            )}
          </Card>
        );
      case 'target-achieved-chart': {
        const s = scopeTargetStats ?? targetStats;
        if (s == null) {
          return (
            <Card {...commonProps} title="Target vs achieved" description="Target and achieved this month.">
              <p className="text-sm text-slate-500 p-4">No target data available.</p>
            </Card>
          );
        }
        return (
          <Card {...commonProps} title="Target vs achieved" description={`${scopeLabel} — ${new Date(s.year, s.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`}>
            <TargetAchievedBarChart target={s.monthly_target} achieved={s.achieved_this_month} year={s.year} month={s.month} />
          </Card>
        );
      }
      case 'won-lost-chart': {
        const s = scopeTargetStats ?? targetStats;
        if (s == null) {
          return (
            <Card {...commonProps} title="Won vs lost (this month)" description="Closed leads in scope.">
              <p className="text-sm text-slate-500 p-4">No data this month.</p>
            </Card>
          );
        }
        return (
          <Card {...commonProps} title="Won vs lost (this month)" description="Closed leads in scope">
            <WonLostPieChart won={s.won_leads_count_this_month} lost={s.lost_leads_count_this_month} />
          </Card>
        );
      }
      case 'leads-by-status-chart':
        if (leadStatusCounts.length === 0) {
          return (
            <Card {...commonProps} title="Leads by status" description="From recent leads in scope.">
              <p className="text-sm text-slate-500 p-4">No lead status data yet.</p>
            </Card>
          );
        }
        return (
          <Card {...commonProps} title="Leads by status" description="From recent leads in scope">
            <LeadStatusPieChart data={leadStatusCounts} />
          </Card>
        );
      case 'inquiries-quotations-chart':
        if (reportSummary == null || !canViewReport) {
          return (
            <Card {...commonProps} title="Inquiries & quotations" description={`${scopeLabel} scope`}>
              <p className="text-sm text-slate-500 p-4">No report data or permission.</p>
            </Card>
          );
        }
        return (
          <Card {...commonProps} title="Inquiries & quotations" description={`${scopeLabel} scope`}>
            <InquiriesQuotationsBarChart inquiries={reportSummary.inquiries_count} quotations={reportSummary.quotations_sent_count} />
          </Card>
        );
      case 'revenue-chart':
        return (
          <Card {...commonProps} title={`${scopeLabel} leads overview`} description={`Total leads and activity in scope.`}>
            <div className="p-4 space-y-4">
              {reportSummary != null && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs font-medium uppercase">{scopeLabel} leads (assigned)</p>
                    <p className="text-xl font-bold text-slate-900">{reportSummary.leads_total}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-slate-500 text-xs font-medium uppercase">{scopeLabel} inquiries</p>
                    <p className="text-xl font-bold text-slate-900">{reportSummary.inquiries_count}</p>
                  </div>
                </div>
              )}
              {leadStatusCounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Recent leads by status (this page)</p>
                  {leadStatusCounts.map(({ label, count }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-700">{label}</span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      case 'goal-chart':
        return (
          <Card {...commonProps} title={`${scopeLabel} activity`} description={`Inquiries and quotations in scope.`}>
            <div className="p-4 space-y-4">
              {reportSummary != null ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">Inquiries logged</span>
                    <span className="font-bold text-slate-900">{reportSummary.inquiries_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm">Quotations sent</span>
                    <span className="font-bold text-slate-900">{reportSummary.quotations_sent_count}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate('/reports')}>
                    View reports
                  </Button>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No report data. Go to Reports for details.</p>
              )}
            </div>
          </Card>
        );
      case 'activity-table':
        return (
          <Card {...commonProps} title={scopeLabel === 'My' ? 'Recent leads' : `Recent leads (${scopeLabel})`} description="Latest leads in scope (click to edit)." noPadding maxHeight="none">
            <div className="overflow-x-auto">
              {recentLeads.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No leads yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 py-2 font-semibold text-slate-600">Name</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Company</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Next follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}/edit`)}
                        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-4 py-2 font-medium text-slate-900">{leadDisplayName(lead)}</td>
                        <td className="px-4 py-2 text-slate-600">{leadDisplayCompany(lead) || '—'}</td>
                        <td className="px-4 py-2 text-slate-600">{lead.status_option?.label ?? '—'}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="p-2 border-t border-slate-100">
                <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="text-xs">
                  View all leads →
                </Button>
              </div>
            </div>
          </Card>
        );
      case 'global-reach':
      case 'quick_links':
        return (
          <Card {...commonProps} title={config.title || 'Quick links'} description="Marketing module.">
            <div className="p-4 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/leads')} leftIcon={<Users size={14} />}>
                Leads
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/contacts')} leftIcon={<UserCircle size={14} />}>
                Contacts
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/customers')} leftIcon={<Users size={14} />}>
                Customers
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/quotations')} leftIcon={<Quote size={14} />}>
                Quotations
              </Button>
              {canViewReport && (
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/reports')} leftIcon={<FileText size={14} />}>
                  Reports
                </Button>
              )}
            </div>
          </Card>
        );
      case 'heatmap':
        return (
          <Card {...commonProps} title={config.title || 'Heatmap'} description="Matrix view">
            <HeatmapWidget title={config.title} />
          </Card>
        );
      case 'custom_code':
        return (
          <Card {...commonProps} title={config.title || 'Custom / code'} description="Your code or notes">
            <CustomCodeWidget code={config.code} title={config.title} />
          </Card>
        );
      case 'stat':
        return (
          <Card {...commonProps} title={config.title || 'Stat'} description="Summary metric">
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Target size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Metric</p>
                <p className="text-2xl font-bold text-slate-900">{reportSummary?.leads_total ?? '—'}</p>
              </div>
            </div>
          </Card>
        );
      case 'bar_chart':
        return (
          <Card {...commonProps} title={config.title || 'Bar chart'} description="Chart">
            {reportSummary != null ? (
              <InquiriesQuotationsBarChart inquiries={reportSummary.inquiries_count} quotations={reportSummary.quotations_sent_count} />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm p-4">No data. Add report permission or data.</div>
            )}
          </Card>
        );
      case 'pie_chart':
        return (
          <Card {...commonProps} title={config.title || 'Pie chart'} description="Distribution">
            {leadStatusCounts.length > 0 ? (
              <LeadStatusPieChart data={leadStatusCounts} />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm p-4">No lead status data yet.</div>
            )}
          </Card>
        );
      case 'area_chart':
        return (
          <Card {...commonProps} title={config.title || 'Area chart'} description="Trend">
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm p-4">Area chart placeholder. Connect data source to customize.</div>
          </Card>
        );
      case 'table':
        return (
          <Card {...commonProps} title={config.title || 'Table'} description="Data table" noPadding>
            <div className="overflow-x-auto">
              {recentLeads.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No leads yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 py-2 font-semibold text-slate-600">Name</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Company</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.slice(0, 5).map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                        <td className="px-4 py-2 font-medium text-slate-900">{leadDisplayName(lead)}</td>
                        <td className="px-4 py-2 text-slate-600">{leadDisplayCompany(lead) || '—'}</td>
                        <td className="px-4 py-2 text-slate-600">{lead.status_option?.label ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        );
      case 'custom_sql':
        return (
          <Card {...commonProps} title={config.title || 'Custom SQL'} description="Run your SQL (SELECT only); data from backend.">
            <CustomSqlWidgetContent
              code={config.code}
              chartType={config.chart_type || 'table'}
              onError={(msg) => showToast(msg, 'error')}
            />
          </Card>
        );
      default:
        return null;
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast('Export not implemented for dashboard', 'info');
    }, 500);
  };

  const handleSaveLayout = async () => {
    if (selectedDashboardId != null) {
      try {
        await marketingAPI.updateSavedDashboard(selectedDashboardId, { config: { layout } });
        showToast('Dashboard saved to backend', 'success');
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'Failed to save dashboard', 'error');
        return;
      }
    } else {
      showToast('Dashboard layout saved (local)', 'success');
    }
    setIsEditMode(false);
  };

  const actions = (
    <>
      <Select
        className="min-w-[180px]"
        placeholder="Dashboard"
        value={selectedDashboardId != null ? String(selectedDashboardId) : ''}
        onChange={(v) => setSelectedDashboardId(v ? parseInt(String(v), 10) : null)}
        options={[
          { value: '', label: 'Local (this device)' },
          ...savedDashboards.map((d) => ({ value: String(d.id), label: d.name })),
        ]}
      />
      <Button variant="outline" size="sm" onClick={() => setShowCreateDashboardModal(true)}>
        Save as new
      </Button>
      <Button variant="outline" size="sm" onClick={loadDashboard} disabled={loading || permissionDenied} leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}>
        Refresh
      </Button>
      <Button
        variant={isEditMode ? 'primary' : 'outline'}
        size="sm"
        title="Drag to reorder; save to backend when a saved dashboard is selected"
        onClick={() => {
          if (isEditMode) handleSaveLayout();
          else setIsEditMode(true);
        }}
        leftIcon={isEditMode ? <Check size={14} /> : <LayoutIcon size={14} />}
      >
        {isEditMode ? 'Save layout' : 'Customize widget order'}
      </Button>
      <Button size="sm" onClick={handleExport} isLoading={isExporting} leftIcon={<Download size={14} />}>
        Export
      </Button>
    </>
  );

  const dashboardRole = reportScope?.role ?? 'self';
  const dashboardTitle =
    dashboardRole === 'super_admin' ? 'Marketing overview' :
    dashboardRole === 'domain_head' ? 'Domain dashboard' :
    dashboardRole === 'region_head' ? 'Region dashboard' : 'Dashboard';
  const dashboardDescription =
    dashboardRole === 'super_admin' ? 'All domains — leads and team activity.' :
    dashboardRole === 'domain_head' ? 'Domain leads and team activity.' :
    dashboardRole === 'region_head' ? 'Region leads and team activity.' : 'Your leads, contacts, and activity.';
  const scopeLabel = scopeTargetStats?.scope_label ?? 'My';

  const breadcrumbs = [{ label: dashboardTitle }];
  return (
    <PageLayout
      title={dashboardTitle}
      description={dashboardDescription}
      actions={actions}
      breadcrumbs={breadcrumbs}
    >
      {permissionDenied ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg border border-amber-200 bg-amber-50">
          <ShieldAlert className="w-12 h-12 text-amber-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">You don&apos;t have permission</h3>
          <p className="text-sm text-slate-600 text-center max-w-md">
            You don&apos;t have permission to view this dashboard. Contact your administrator if you need access.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <>
        <div className="flex gap-6">
          {/* Main content - left */}
          <div className="flex-1 min-w-0">
          {/* Dashboard: empty by default; add widgets and reorder via "Customize widget order" */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                Dashboard
                {isEditMode && <span className="ml-2 text-xs font-normal text-slate-500">— drag to reorder, click ✕ to remove</span>}
              </h2>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowAddWidgetModal(true)}
              >
                Add widget
              </Button>
            </div>
            {layout.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                <LayoutIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-base font-semibold text-slate-700 mb-1">No widgets yet</h3>
                <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">Add cards, graphs, heatmaps, tables, or custom code. Your layout is saved and you can reorder anytime.</p>
                <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddWidgetModal(true)}>
                  Add widget
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 transition-all duration-300" style={{ gap: 'var(--ui-gap)' }}>
                {layout.map((config) => (
                  <div key={config.id} className="contents">
                    {renderWidget(config)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's tasks - visible on small/medium (below content); hidden for admin/domain head */}
          {!isHeadRole && (
          <div className="lg:hidden mt-6">
            <Card title="Today's tasks" description="Auto (follow-up) or manual. Tap to open; add enquiry to complete.">
              {tasksLoading ? (
                <div className="p-4 flex items-center justify-center text-slate-500"><RefreshCw size={20} className="animate-spin" /></div>
              ) : todayTasks.length === 0 ? (
                <p className="text-xs text-slate-500 p-3">No tasks for today.</p>
              ) : (
                <div className="space-y-1 max-h-[280px] overflow-y-auto">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer ${task.completed_at ? 'bg-slate-50' : 'bg-white border-slate-200'}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <button type="button" className="shrink-0 mt-0.5" onClick={async (e) => { e.stopPropagation(); if (task.completed_at) return; try { await marketingAPI.completeTask(task.id); setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed_at: new Date().toISOString() } : t)); showToast('Task marked complete'); } catch { showToast('Failed to complete task', 'error'); } }}>
                        {task.completed_at ? <CheckSquare size={18} className="text-emerald-600" /> : <Square size={18} />}
                      </button>
                      <p className={`text-xs flex-1 truncate ${task.completed_at ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{task.title}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 mt-2">
                <Button variant="outline" size="sm" className="w-full" leftIcon={<Plus size={14} />} onClick={() => { setShowAddTask(true); setManualTaskTitle(''); setManualTaskDescription(''); }}>Add task</Button>
              </div>
            </Card>
          </div>
          )}
          </div>

          {/* Today's tasks - right column (desktop); hidden for admin/domain head */}
          {!isHeadRole && (
          <div className="w-80 flex-shrink-0 hidden lg:block" style={{ minHeight: '80vh' }}>
            <Card
              className="sticky top-4 h-[80vh] flex flex-col"
              title="Today's tasks"
              description="Auto (follow-up) or manual. Click to open; add enquiry to complete."
            >
              <div className="flex-1 min-h-0 flex flex-col p-0">
                {tasksLoading ? (
                  <div className="p-4 flex items-center justify-center text-slate-500">
                    <RefreshCw size={20} className="animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                      {todayTasks.length === 0 ? (
                        <p className="text-xs text-slate-500 p-3">No tasks for today.</p>
                      ) : (
                        todayTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              task.completed_at ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                            }`}
                            onClick={() => setSelectedTask(task)}
                          >
                            <button
                              type="button"
                              className="shrink-0 mt-0.5 text-slate-400 hover:text-indigo-600"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (task.completed_at) return;
                                try {
                                  await marketingAPI.completeTask(task.id);
                                  setTodayTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed_at: new Date().toISOString() } : t));
                                  showToast('Task marked complete');
                                } catch {
                                  showToast('Failed to complete task', 'error');
                                }
                              }}
                              aria-label={task.completed_at ? 'Completed' : 'Mark complete'}
                            >
                              {task.completed_at ? (
                                <CheckSquare size={18} className="text-emerald-600" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${task.completed_at ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                {task.title}
                              </p>
                              {task.lead_name && (
                                <p className="text-[10px] text-slate-500 truncate">{task.lead_series || task.lead_name}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-center"
                        leftIcon={<Plus size={14} />}
                        onClick={() => { setShowAddTask(true); setManualTaskTitle(''); setManualTaskDescription(''); }}
                      >
                        Add task
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
          )}
        </div>

          {/* Task detail modal: description + inline add enquiry (completes task) or mark complete */}
          {selectedTask && (
          <Modal
            isOpen={!!selectedTask}
            onClose={() => {
              setSelectedTask(null);
              setEnquiryForm({ activity_type: 'call', title: '', description: '', from_status_id: undefined, to_status_id: undefined, contact_person_name_prefix: '', contact_person_name: '', contact_person_email: '', contact_person_phone_code: DEFAULT_COUNTRY_CODE, contact_person_phone: '' });
              setTaskModalAttachments([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]);
              setTaskModalQuotationSeriesCode('');
              setTaskModalQuotationIsRevised(false);
            }}
            title={selectedTask.title}
          >
            <div className="space-y-4">
              {selectedTask.description && (
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedTask.description}</p>
              )}
              {selectedTask.lead_id != null && !selectedTask.completed_at && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-3 max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-700">Add enquiry log (same as lead page) — then task is done</p>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedTask(null); navigate(`/leads/${selectedTask.lead_id}/edit`); }}>Open lead →</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Select
                      label="Type"
                      options={ACTIVITY_TYPE_OPTIONS}
                      value={enquiryForm.activity_type}
                      onChange={(v) => setEnquiryForm(f => ({ ...f, activity_type: (v ?? 'call') as string }))}
                      searchable={false}
                    />
                    <Input label="Title *" value={enquiryForm.title} onChange={(e) => setEnquiryForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Follow-up call" />
                  </div>
                  {enquiryForm.activity_type === 'lead_status_change' && (
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-100 border border-slate-200">
                      <Select label="From status" options={[{ value: '', label: '—' }, ...taskModalLeadStatuses.map(s => ({ value: String(s.id), label: s.label }))]} value={enquiryForm.from_status_id != null ? String(enquiryForm.from_status_id) : ''} onChange={(v) => setEnquiryForm(f => ({ ...f, from_status_id: v != null ? parseInt(String(v), 10) : undefined }))} searchable={false} />
                      <Select label="To status" options={[{ value: '', label: '—' }, ...taskModalLeadStatuses.map(s => ({ value: String(s.id), label: s.label }))]} value={enquiryForm.to_status_id != null ? String(enquiryForm.to_status_id) : ''} onChange={(v) => setEnquiryForm(f => ({ ...f, to_status_id: v != null ? parseInt(String(v), 10) : undefined }))} searchable={false} />
                    </div>
                  )}
                  {enquiryForm.activity_type === 'contacted_different_person' && (
                    <div className="grid grid-cols-1 gap-2 p-2 rounded-lg bg-slate-100 border border-slate-200">
                      <div className="flex gap-2 items-end">
                        <div className="w-24 shrink-0"><Select label="Title" options={NAME_PREFIXES} value={enquiryForm.contact_person_name_prefix} onChange={(v) => setEnquiryForm(f => ({ ...f, contact_person_name_prefix: (v ?? '') as string }))} searchable={false} /></div>
                        <div className="flex-1"><Input label="Contact person name" value={enquiryForm.contact_person_name} onChange={(e) => setEnquiryForm(f => ({ ...f, contact_person_name: e.target.value }))} placeholder="Name" /></div>
                      </div>
                      <Input label="Contact person email" value={enquiryForm.contact_person_email} onChange={(e) => setEnquiryForm(f => ({ ...f, contact_person_email: e.target.value }))} placeholder="email@example.com" />
                      <div className="flex gap-2 items-end">
                        <div className="w-28 shrink-0"><Select label="Phone code" options={COUNTRY_CODES} value={enquiryForm.contact_person_phone_code} onChange={(v) => setEnquiryForm(f => ({ ...f, contact_person_phone_code: (v ?? '') as string }))} searchable getSearchText={getCountryCodeSearchText} /></div>
                        <div className="flex-1"><Input label="Phone" value={enquiryForm.contact_person_phone} onChange={(e) => setEnquiryForm(f => ({ ...f, contact_person_phone: e.target.value }))} placeholder="Number" /></div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">File attachments (optional)</label>
                    <p className="text-[10px] text-slate-500 mb-1">Quotation or general attachment; choose type per file.</p>
                    <div className="space-y-2">
                      {taskModalAttachments.map((row) => (
                        <div key={row.id} className="flex flex-wrap items-center gap-2">
                          <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0">
                            <Upload size={12} /><span className="truncate max-w-[100px]">{row.file ? row.file.name : 'Choose file'}</span>
                            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; setTaskModalAttachments(prev => prev.map(r => r.id === row.id ? { ...r, file: file || null } : r)); }} />
                          </label>
                          <select className="rounded border border-slate-200 px-2 py-1 text-xs w-24" value={row.kind} onChange={(e) => setTaskModalAttachments(prev => prev.map(r => r.id === row.id ? { ...r, kind: e.target.value as 'quotation' | 'attachment' } : r))}>
                            <option value="quotation">Quotation</option>
                            <option value="attachment">Attachment</option>
                          </select>
                          {row.kind === 'quotation' ? (
                            <span className="text-xs text-slate-500">Auto from lead</span>
                          ) : (
                            <input className="rounded border border-slate-200 px-2 py-1 text-xs min-w-[100px] flex-1 max-w-[140px]" placeholder="Title" value={row.title} onChange={(e) => setTaskModalAttachments(prev => prev.map(r => r.id === row.id ? { ...r, title: e.target.value } : r))} />
                          )}
                          <button type="button" onClick={() => setTaskModalAttachments(prev => prev.length > 1 ? prev.filter(r => r.id !== row.id) : prev)} className="p-1.5 rounded text-slate-400 hover:bg-slate-200 hover:text-rose-600"><Trash2 size={14} /></button>
                        </div>
                      ))}
                      <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1" onClick={() => setTaskModalAttachments(prev => [...prev, { id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }])}><Plus size={12} /> Add file</button>
                    </div>
                    {taskModalAttachments.some(e => e.kind === 'quotation') && (
                      <p className="mt-1 text-xs text-slate-500">Quotation numbers are generated from the lead; further ones get rev2, rev3 automatically.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">What was discussed / notes</label>
                    <textarea className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm min-h-[60px]" placeholder="e.g. Asked about timeline, budget." value={enquiryForm.description} onChange={(e) => setEnquiryForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <Button
                    size="sm"
                    leftIcon={<MessageSquare size={14} />}
                    disabled={!enquiryForm.title.trim() || enquirySubmitting}
                    onClick={async () => {
                      if (!enquiryForm.title.trim() || !selectedTask.lead_id) return;
                      setEnquirySubmitting(true);
                      try {
                        const created = await marketingAPI.createLeadActivity(selectedTask.lead_id, {
                          activity_type: enquiryForm.activity_type,
                          title: enquiryForm.title.trim(),
                          description: enquiryForm.description?.trim() || undefined,
                          activity_date: new Date().toISOString(),
                          from_status_id: enquiryForm.activity_type === 'lead_status_change' ? enquiryForm.from_status_id : undefined,
                          to_status_id: enquiryForm.activity_type === 'lead_status_change' ? enquiryForm.to_status_id : undefined,
                          contact_person_title: enquiryForm.activity_type === 'contacted_different_person' ? (enquiryForm.contact_person_name_prefix?.trim() || undefined) : undefined,
                          contact_person_name: enquiryForm.activity_type === 'contacted_different_person' ? enquiryForm.contact_person_name?.trim() || undefined : undefined,
                          contact_person_email: enquiryForm.activity_type === 'contacted_different_person' ? enquiryForm.contact_person_email?.trim() || undefined : undefined,
                          contact_person_phone: enquiryForm.activity_type === 'contacted_different_person' ? (serializePhoneWithCountryCode(enquiryForm.contact_person_phone_code, enquiryForm.contact_person_phone)?.trim() || undefined) : undefined,
                        });
                        const toUpload = taskModalAttachments.filter(e => e.file);
                        if (toUpload.length > 0) {
                          await marketingAPI.uploadLeadActivityAttachments(selectedTask.lead_id, created.id, toUpload.map(e => e.file!), toUpload.map(e => e.kind), undefined, toUpload.map(e => e.kind === 'attachment' ? (e.title.trim() || undefined) : undefined));
                        }
                        await marketingAPI.completeTask(selectedTask.id);
                        setTodayTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, completed_at: new Date().toISOString() } : t));
                        setSelectedTask(null);
                        setEnquiryForm({ activity_type: 'call', title: '', description: '', from_status_id: undefined, to_status_id: undefined, contact_person_name_prefix: '', contact_person_name: '', contact_person_email: '', contact_person_phone_code: DEFAULT_COUNTRY_CODE, contact_person_phone: '' });
                        setTaskModalAttachments([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]);
                        showToast('Enquiry added and task completed');
                      } catch (err: unknown) {
                        showToast(err instanceof Error ? err.message : 'Failed to add enquiry', 'error');
                      } finally {
                        setEnquirySubmitting(false);
                      }
                    }}
                  >
                    {enquirySubmitting ? 'Adding...' : 'Add enquiry & complete task'}
                  </Button>
                </div>
              )}
              {selectedTask.lead_id != null && selectedTask.completed_at && (
                <p className="text-xs text-slate-500">Lead: {selectedTask.lead_series || selectedTask.lead_name || `#${selectedTask.lead_id}`}</p>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedTask(null); setEnquiryForm({ activity_type: 'call', title: '', description: '', from_status_id: undefined, to_status_id: undefined, contact_person_name_prefix: '', contact_person_name: '', contact_person_email: '', contact_person_phone_code: DEFAULT_COUNTRY_CODE, contact_person_phone: '' }); setTaskModalAttachments([{ id: crypto.randomUUID(), kind: 'attachment', file: null, quotationNumber: '', title: '' }]); }}>Close</Button>
                {!selectedTask.completed_at && (
                  <Button
                    size="sm"
                    leftIcon={<CheckSquare size={14} />}
                    onClick={async () => {
                      try {
                        await marketingAPI.completeTask(selectedTask.id);
                        setTodayTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, completed_at: new Date().toISOString() } : t));
                        setSelectedTask(prev => prev ? { ...prev, completed_at: new Date().toISOString() } : null);
                        showToast('Task marked complete');
                      } catch {
                        showToast('Failed to complete task', 'error');
                      }
                    }}
                  >
                    Mark complete
                  </Button>
                )}
              </div>
            </div>
          </Modal>
          )}

          {/* Add manual task modal */}
          {showAddTask && (
          <Modal isOpen onClose={() => setShowAddTask(false)} title="Add task">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Call back client X"
                  value={manualTaskTitle}
                  onChange={(e) => setManualTaskTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Discuss pricing, send revised quote by Friday."
                  value={manualTaskDescription}
                  onChange={(e) => setManualTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setShowAddTask(false)}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={manualTaskSubmitting}
                  onClick={async () => {
                    if (!manualTaskTitle.trim()) { showToast('Enter a title', 'error'); return; }
                    setManualTaskSubmitting(true);
                    try {
                      const created = await marketingAPI.createManualTask({
                        title: manualTaskTitle.trim(),
                        description: manualTaskDescription.trim() || undefined,
                      });
                      setTodayTasks(prev => [created, ...prev]);
                      setShowAddTask(false);
                      setManualTaskTitle('');
                      setManualTaskDescription('');
                      showToast('Task added');
                    } catch (err: unknown) {
                      showToast(err instanceof Error ? err.message : 'Failed to add task', 'error');
                    } finally {
                      setManualTaskSubmitting(false);
                    }
                  }}
                >
                  {manualTaskSubmitting ? 'Adding...' : 'Add task'}
                </Button>
              </div>
            </div>
          </Modal>
          )}

          {/* Create saved dashboard modal */}
          {showCreateDashboardModal && (
            <Modal
              isOpen
              onClose={() => { setShowCreateDashboardModal(false); setCreateDashboardName(''); }}
              title="Save as new dashboard"
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Save the current layout and widgets to the backend. You can then assign this dashboard to users (requires marketing.assign_dashboard in HRMS).</p>
                <Input
                  label="Dashboard name"
                  value={createDashboardName}
                  onChange={(e) => setCreateDashboardName(e.target.value)}
                  placeholder="e.g. Sales overview"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowCreateDashboardModal(false); setCreateDashboardName(''); }}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={!createDashboardName.trim() || createDashboardSubmitting}
                    onClick={async () => {
                      if (!createDashboardName.trim()) return;
                      setCreateDashboardSubmitting(true);
                      try {
                        const created = await marketingAPI.createSavedDashboard({
                          name: createDashboardName.trim(),
                          config: { layout },
                        });
                        setSavedDashboards((prev) => [created, ...prev]);
                        setSelectedDashboardId(created.id);
                        setShowCreateDashboardModal(false);
                        setCreateDashboardName('');
                        showToast('Dashboard created. You can assign it to users from HRMS permissions (marketing.assign_dashboard).');
                      } catch (e: unknown) {
                        showToast(e instanceof Error ? e.message : 'Failed to create dashboard', 'error');
                      } finally {
                        setCreateDashboardSubmitting(false);
                      }
                    }}
                  >
                    {createDashboardSubmitting ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Add widget modal */}
          {showAddWidgetModal && (
            <Modal
              isOpen
              onClose={() => { setShowAddWidgetModal(false); setAddWidgetTitle(''); setAddWidgetCode(''); setAddWidgetChartType('table'); setAddWidgetType('target-card'); }}
              title="Add widget"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Widget type</label>
                  <Select
                    value={addWidgetType}
                    onChange={(v) => {
                      const newType = (v ?? 'target-card') as DashboardWidgetType;
                      setAddWidgetType(newType);
                      if (newType === 'custom_sql' && !addWidgetCode.trim()) {
                        setAddWidgetCode('SELECT column1, column2 FROM table_name LIMIT 100');
                      }
                    }}
                    options={WIDGET_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    placeholder="Select type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title (optional)</label>
                  <Input
                    value={addWidgetTitle}
                    onChange={(e) => setAddWidgetTitle(e.target.value)}
                    placeholder="e.g. My chart"
                  />
                </div>
                {(addWidgetType === 'custom_code' || addWidgetType === 'custom_sql') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {addWidgetType === 'custom_sql' ? 'SQL (SELECT only)' : 'Code / notes'}
                    </label>
                    {addWidgetType === 'custom_sql' && (
                      <>
                        <p className="text-xs text-slate-500 mb-1">
                          <Link to="/schema" className="text-indigo-600 hover:underline">View tables &amp; columns (ER diagram)</Link>
                        </p>
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2">
                          <p className="font-medium text-slate-700 mb-1">How to create a SQL widget</p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            <li>Choose <strong>Custom SQL chart</strong> as widget type.</li>
                            <li>Optionally set a <strong>Title</strong> for the card.</li>
                            <li>Write a <strong>SELECT</strong> query below (only SELECT is allowed; no INSERT/UPDATE/DELETE).</li>
                            <li>Use <Link to="/schema" className="text-indigo-600 hover:underline">Schema / ER diagram</Link> to see table and column names.</li>
                            <li>Pick <strong>Chart / display</strong> (Table, Bar, Line, Pie, or Heatmap).</li>
                            <li>Click <strong>Add widget</strong>. Data is loaded from the backend when the dashboard is viewed.</li>
                          </ol>
                          <p className="mt-1.5 text-slate-500">Example: <code className="bg-slate-200 px-1 rounded">SELECT id, series FROM leads LIMIT 100</code></p>
                        </div>
                      </>
                    )}
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={addWidgetCode}
                      onChange={(e) => setAddWidgetCode(e.target.value)}
                      placeholder={addWidgetType === 'custom_sql' ? 'e.g. SELECT id, series FROM leads LIMIT 100' : 'Paste code or notes to display in the widget...'}
                    />
                  </div>
                )}
                {addWidgetType === 'custom_sql' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Chart / display</label>
                    <Select
                      value={addWidgetChartType}
                      onChange={(v) => setAddWidgetChartType(String(v ?? 'table'))}
                      options={[
                        { value: 'table', label: 'Table' },
                        { value: 'bar', label: 'Bar chart' },
                        { value: 'line', label: 'Line chart' },
                        { value: 'pie', label: 'Pie chart' },
                        { value: 'heatmap', label: 'Heatmap' },
                      ]}
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { setShowAddWidgetModal(false); setAddWidgetTitle(''); setAddWidgetCode(''); setAddWidgetChartType('table'); }}>Cancel</Button>
                  <Button size="sm" onClick={addWidget}>Add widget</Button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </PageLayout>
  );
};

