
import React, { useState, useEffect, useCallback, useId, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../App';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { VersionsModal } from '../components/VersionsModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../components/layout/PageLayout';
import { marketingAPI } from '../lib/marketing-api';
import { ApiError } from '../lib/api';
import { StatItem } from '../types';
import { Lead, DashboardTargetStats, ScopeTargetStats, ReportScopeResponse, HeadDashboardSummaryResponse, PerformerOfMonthResponse, leadDisplayName, leadDisplayCompany, SavedDashboardResponse, AssignableUser, SavedDashboardAssignmentResponse } from '../lib/marketing-api';
import { Modal } from '../components/ui/Modal';
import { Layout as LayoutIcon, Check, RefreshCw, Users, UserCircle, Quote, FileText, ShieldAlert, Target, Trophy, XCircle, ListTodo, CheckSquare, Square, Plus, MessageSquare, Upload, Trash2, UserPlus, Wand2, Edit3, X, Search, Calendar, GripVertical, Maximize2, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
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
  CustomCodeWidget,
  QuotationSubmittedWidget,
  CustomTooltip,
} from '../components/ui/ChartsSection';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const CHART_COLOR_PALETTES = [
  { stroke: '#3b82f6', start: '#3b82f6', end: '#2563eb' }, // blue
  { stroke: '#10b981', start: '#10b981', end: '#059669' }, // emerald
  { stroke: '#f59e0b', start: '#f59e0b', end: '#d97706' }, // amber
  { stroke: '#ef4444', start: '#ef4444', end: '#dc2626' }, // red
  { stroke: '#8b5cf6', start: '#8b5cf6', end: '#7c3aed' }, // violet
  { stroke: '#06b6d4', start: '#06b6d4', end: '#0891b2' }, // cyan
  { stroke: '#f97316', start: '#f97316', end: '#ea580c' }, // orange
];

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

function ensureDefaultWidgets(layout: WidgetConfig[]): WidgetConfig[] {
  const hasPerformer = layout.some(w => w.type === 'performer-of-month');
  if (!hasPerformer) {
    layout = [{ id: 'performer-of-month-def', type: 'performer-of-month', span: 2 }, ...layout];
  }
  return layout;
}

function packLayout(layout: WidgetConfig[]): WidgetConfig[] {
  const remaining = [...layout];
  const result: WidgetConfig[] = [];
  let rowCursor = 0;

  while (remaining.length > 0) {
    if (rowCursor === 0) {
      // Start of a fresh row — take the next item in the user's intended order
      const [item] = remaining.splice(0, 1);
      result.push(item);
      rowCursor = item.span >= 4 ? 0 : item.span;
    } else {
      // Mid-row — scan for the first item that fits in the remaining columns
      const colsLeft = 4 - rowCursor;
      const idx = remaining.findIndex(w => w.span <= colsLeft);

      if (idx !== -1) {
        const [item] = remaining.splice(idx, 1);
        result.push(item);
        rowCursor += item.span;
        if (rowCursor >= 4) rowCursor = 0;
      } else {
        // Nothing fits mid-row — close this row and retry without consuming an item
        rowCursor = 0;
      }
    }
  }

  return result;
}

const WIDGET_TYPE_OPTIONS: { value: DashboardWidgetType; label: string }[] = [
  { value: 'target-card', label: 'Target (this month)' },
  { value: 'leads-by-region', label: 'Leads by region' },
  { value: 'head-summary', label: 'Head summary' },
  { value: 'quotation-submitted-chart', label: 'Quotations submitted (by region)' },
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
  { value: 'table', label: 'Table' },
  { value: 'custom_code', label: 'Custom / code' },
  { value: 'custom_sql', label: 'Custom SQL chart' },
  { value: 'stat', label: 'Stat card' },
  { value: 'performer-of-month', label: 'Performer of the month' },
];

const AI_SCOPE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'employee', label: 'Employee scope' },
  { value: 'region', label: 'Region scope' },
  { value: 'domain', label: 'Domain scope' },
] as const;

// Same activity types as lead page Add log form (quotations, attachments, status change, etc.)
const ACTIVITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
];

/** Displays backend-rendered SQL widget data (frontend does not execute SQL). */
function CustomSqlWidgetContent({
  code,
  chartType,
  data,
  error,
  span = 1,
  title = '',
}: {
  code?: string;
  chartType?: string;
  data?: unknown[];
  error?: string | null;
  span?: number;
  title?: string;
}) {
  const gradientId = useId();
  const navigate = useNavigate();
  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; value: number } | null>(null);
  const rowsData = Array.isArray(data) ? data : [];

  if (!code?.trim()) {
    return <p className="text-sm text-slate-500 p-4">Add SQL in edit mode. Use scope placeholders like <code>{'{{employee_id}}'}</code> or <code>{'{{domain_id}}'}</code>.</p>;
  }
  if (error) {
    return <p className="text-sm text-rose-600 p-4">{error}</p>;
  }
  if (rowsData.length === 0) {
    return <p className="text-sm text-slate-500 p-4">No rows returned.</p>;
  }
  const rows = rowsData as Record<string, unknown>[];
  const allKeys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const keys = allKeys.length > 0 ? allKeys : Object.keys(rows[0] || {});

  const cellValue = (row: Record<string, unknown>, k: string) => {
    const v = row[k];
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string' && v.trim() === '') return '—';
    return String(v);
  };

  const getCardIcon = (titleStr: string) => {
    const t = titleStr.toLowerCase();
    if (t.includes('revenue') || t.includes('achieved') || t.includes('sales') || t.includes('value')) {
      return <Trophy size={18} className="text-emerald-600 shrink-0" />;
    }
    if (t.includes('conversion') || t.includes('rate') || t.includes('pct') || t.includes('ratio')) {
      return <RefreshCw size={18} className="text-blue-600 shrink-0" />;
    }
    if (t.includes('hot') || t.includes('alert') || t.includes('cases') || t.includes('urgent')) {
      return <ShieldAlert size={18} className="text-amber-600 shrink-0" />;
    }
    if (t.includes('won') || t.includes('deals')) {
      return <Check size={18} className="text-violet-600 shrink-0" />;
    }
    if (t.includes('leads') || t.includes('count') || t.includes('team') || t.includes('size')) {
      return <Users size={18} className="text-blue-600 shrink-0" />;
    }
    return <FileText size={18} className="text-slate-600 shrink-0" />;
  };

  const idKey = keys.find((k) => k.toLowerCase() === 'id' || k.toLowerCase() === 'lead_id');
  const labelCandidates = ['label', 'name', 'category', 'x', 'month', 'week_of', 'day', 'rep', 'metric', 'region', 'source', 'date', 'stage', 'week', 'status'];
  const labelKey = keys.find((k) => labelCandidates.includes(k.toLowerCase())) ?? keys.filter(k => k !== idKey)[0] ?? keys[0];

  // Identify numeric series columns
  const valueKeys = keys.filter((k) => {
    if (k === labelKey || k === idKey) return false;
    return rows.some((row) => {
      const v = row[k];
      if (v === null || v === undefined) return false;
      if (typeof v === 'number') return true;
      if (typeof v === 'string') {
        const cleaned = v.replace(/[%$,]/g, '').trim();
        return !isNaN(Number(cleaned)) && cleaned !== '';
      }
      return false;
    });
  });
  const finalValueKeys = valueKeys.length > 0 ? valueKeys : keys.filter((k) => k !== labelKey && k !== idKey);

  const isNumberCard = chartType === 'number-card';
  const isChart = chartType && chartType !== 'table' && !isNumberCard && ['bar', 'line', 'pie', 'area'].includes(chartType);

  if (isNumberCard) {
    const primary = rows[0];
    const valueCandidates = ['value', 'count', 'total', 'amount', 'sum', 'y'];
    const valueKey = keys.find((k) => valueCandidates.includes(k.toLowerCase())) ?? keys.find((k) => typeof primary[k] === 'number') ?? keys[0];
    const rawLabel = labelKey && labelKey !== valueKey ? cellValue(primary, labelKey) : undefined;
    const labelText = rawLabel && rawLabel !== '—' ? rawLabel : (labelKey !== valueKey ? labelKey : undefined);
    const valueText = cellValue(primary, valueKey);

    let cardColorClasses = "bg-gradient-to-br from-blue-50/40 to-blue-100/10 border border-blue-100/60";
    let valueColorClass = "text-blue-800";
    const tText = labelText ? labelText.toLowerCase() : '';
    if (tText.includes('revenue') || tText.includes('achieved') || tText.includes('sales') || tText.includes('value')) {
      cardColorClasses = "bg-gradient-to-br from-emerald-50/40 to-emerald-100/10 border border-emerald-100/60 hover:from-emerald-50/60 hover:to-emerald-100/20";
      valueColorClass = "text-emerald-800";
    } else if (tText.includes('conversion') || tText.includes('rate') || tText.includes('pct') || tText.includes('ratio')) {
      cardColorClasses = "bg-gradient-to-br from-blue-50/40 to-blue-100/10 border border-blue-100/60 hover:from-blue-50/60 hover:to-blue-100/20";
      valueColorClass = "text-blue-800";
    } else if (tText.includes('hot') || tText.includes('alert') || tText.includes('cases') || tText.includes('urgent')) {
      cardColorClasses = "bg-gradient-to-br from-amber-50/40 to-amber-100/10 border border-amber-100/60 hover:from-amber-50/60 hover:to-amber-100/20";
      valueColorClass = "text-amber-800";
    } else if (tText.includes('won') || tText.includes('deals')) {
      cardColorClasses = "bg-gradient-to-br from-violet-50/40 to-violet-100/10 border border-violet-100/60 hover:from-violet-50/60 hover:to-violet-100/20";
      valueColorClass = "text-violet-800";
    } else if (tText.includes('leads') || tText.includes('count') || tText.includes('team') || tText.includes('size')) {
      cardColorClasses = "bg-gradient-to-br from-blue-50/40 to-blue-100/10 border border-blue-100/60 hover:from-blue-50/60 hover:to-blue-100/20";
      valueColorClass = "text-blue-800";
    } else {
      cardColorClasses = "bg-gradient-to-br from-slate-50/40 to-slate-100/10 border border-slate-200/60 hover:from-slate-50/60 hover:to-slate-100/20";
      valueColorClass = "text-slate-800";
    }

    return (
      <div className={cn(
        "flex items-center gap-2.5 w-full p-3 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        cardColorClasses
      )}>
        {getCardIcon(labelText || '')}
        <div className="min-w-0">
          {labelText && <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{labelText}</p>}
          <p className={cn("text-xl font-black mt-0.5", valueColorClass)}>{valueText}</p>
          {rows.length > 1 && (
            <p className="text-[9px] text-slate-400">{`First of ${rows.length} records`}</p>
          )}
        </div>
      </div>
    );
  }

  // Check if this is the Top Performing Sales Representatives leaderboard
  const isTopRepsList = title.toLowerCase().includes('top performing sales representatives') || title.toLowerCase().includes('top reps');

  if (isTopRepsList) {
    return (
      <div className="flex flex-col gap-3 p-1">
        {rows.slice(0, 5).map((row, index) => {
          const rank = index + 1;
          const rep = String(row.representative || row.Representative || 'Unknown');
          const region = String(row.region || row.Region || 'All');
          const revenue = String(row.revenue || row.Revenue || '0');
          const won = String(row.won || row.Won || '0');

          // Initials for avatar
          const initials = rep
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border border-slate-200 transition-all duration-200",
                rank === 1 && "border-blue-200"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank badge */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    rank === 1
                      ? "bg-blue-50 text-blue-600"
                      : rank === 2
                      ? "bg-slate-100 text-slate-600"
                      : rank === 3
                      ? "bg-slate-100 text-slate-600"
                      : "bg-slate-50 text-slate-500"
                  )}
                >
                  {rank === 1 ? <Trophy className="w-3.5 h-3.5" /> : rank}
                </div>

                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border",
                  rank === 1 ? "bg-blue-50 text-blue-600 border-blue-200" :
                  "bg-slate-50 text-slate-600 border-slate-200"
                )}>
                  {initials}
                </div>

                {/* Name & Region */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{rep}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {region}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">₹{revenue}</p>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1">
                  <Check className="w-3 h-3" />
                  {won} won
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (isChart) {
    const chartData = rows.map((row) => {
      const item: Record<string, unknown> = {
        name: String(row[labelKey] ?? '—').slice(0, span === 1 ? 24 : 50)
      };
      finalValueKeys.forEach((vk) => {
        const rawVal = row[vk];
        let val = 0;
        if (typeof rawVal === 'number') {
          val = rawVal;
        } else if (typeof rawVal === 'string') {
          const cleaned = rawVal.replace(/[%$,]/g, '').trim();
          val = Number(cleaned) || 0;
        }
        item[vk] = val;
      });
      return item;
    }).filter((d) => {
      if (chartType === 'bar' || chartType === 'line' || chartType === 'area') return true;
      return finalValueKeys.some((vk) => Number(d[vk]) !== 0);
    });

    if (chartData.length === 0) {
      return <p className="text-sm text-slate-500 p-4">No data to chart (need label + value columns).</p>;
    }

    const isCurrency = finalValueKeys.some((k) => {
      const l = k.toLowerCase();
      return l.includes('revenue') || l.includes('achieved') || l.includes('potential') || l.includes('sales') || l.includes('value') || l.includes('cost') || l.includes('target') || l.includes('price') || l.includes('amount');
    });

    const formatYAxis = (v: number) => {
      if (v >= 1_00_00_000) {
        const crVal = v / 1_00_00_000;
        return `${isCurrency ? '₹' : ''}${crVal % 1 === 0 ? crVal.toFixed(0) : crVal.toFixed(1)} Cr`;
      }
      if (v >= 1_00_000) {
        const lVal = (v / 1_00_00_000) * 100;
        return `${isCurrency ? '₹' : ''}${lVal % 1 === 0 ? lVal.toFixed(0) : lVal.toFixed(1)} L`;
      }
      if (v >= 1_000) {
        const kVal = v / 1_000;
        return `${isCurrency ? '₹' : ''}${kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)} K`;
      }
      return String(v);
    };

    const commonChartProps = { margin: { top: 10, right: 10, left: 15, bottom: 5 } as const };

    // Filter out value keys where all values are 0 (e.g. total_amount when no data)
    const activeValueKeys = finalValueKeys.filter((vk) =>
      chartData.some((d) => Number(d[vk]) !== 0)
    );
    const displayValueKeys = activeValueKeys.length > 0 ? activeValueKeys : finalValueKeys;

    if (chartType === 'pie') {
      const valueKey = displayValueKeys[0] || 'value';
      const pieData = chartData.map((d, i) => ({
        name: String(d.name),
        value: Number(d[valueKey]) || 0,
        fill: CHART_COLORS[i % CHART_COLORS.length]
      }));

      const totalValue = pieData.reduce((sum, d) => sum + d.value, 0);

      return (
        <div className="w-full relative" style={{ height: span === 1 ? 195 : 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={span === 1 ? 45 : 55}
                outerRadius={span === 1 ? 65 : 85}
                paddingAngle={3}
                stroke="none"
                onMouseEnter={(_, index) => setHoveredSlice(pieData[index])}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity duration-200 cursor-pointer pointer-events-auto" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                align="center" 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className={`absolute top-[37%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[45%] overflow-hidden transition-opacity duration-200 ${hoveredSlice ? 'opacity-0' : 'opacity-100'}`}>
            <p className={`font-black text-slate-900 leading-none transition-all duration-200 ${span === 1 ? 'text-base' : 'text-xl'}`}>
              {hoveredSlice ? hoveredSlice.value.toLocaleString() : totalValue.toLocaleString()}
            </p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 transition-all duration-200 truncate px-1">
              {hoveredSlice ? hoveredSlice.name : 'Total'}
            </p>
          </div>
        </div>
      );
    }

    if (chartType === 'bar') {
      return (
        <div className="h-full w-full pt-2 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} {...commonChartProps}>
              <defs>
                {displayValueKeys.map((vk, i) => {
                  const palette = CHART_COLOR_PALETTES[i % CHART_COLOR_PALETTES.length];
                  return (
                    <linearGradient key={vk} id={`barGrad-${vk}-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.start} stopOpacity={1} />
                      <stop offset="100%" stopColor={palette.end} stopOpacity={0.65} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: span === 1 ? 8 : 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: span === 1 ? 8 : 10 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              {displayValueKeys.map((vk, i) => (
                <Bar
                  key={vk}
                  dataKey={vk}
                  name={vk.replace(/_/g, ' ')}
                  fill={`url(#barGrad-${vk}-${gradientId})`}
                  radius={[4, 4, 0, 0]}
                  barSize={span === 1 ? 16 : 24}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chartType === 'line' || chartType === 'area') {
      return (
        <div className="h-full w-full pt-2 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} {...commonChartProps}>
              <defs>
                {displayValueKeys.map((vk, i) => {
                  const palette = CHART_COLOR_PALETTES[i % CHART_COLOR_PALETTES.length];
                  return (
                    <linearGradient key={vk} id={`areaGrad-${vk}-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.start} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={palette.end} stopOpacity={0.02} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: span === 1 ? 8 : 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: span === 1 ? 8 : 10 }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              {displayValueKeys.map((vk, i) => {
                const palette = CHART_COLOR_PALETTES[i % CHART_COLOR_PALETTES.length];
                return (
                  <Area
                    key={vk}
                    type="monotone"
                    dataKey={vk}
                    name={vk.replace(/_/g, ' ')}
                    stroke={palette.stroke}
                    fill={`url(#areaGrad-${vk}-${gradientId})`}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }
  }

  // Render Table. Check if it's a short 2-column key-value list (e.g. Metric Summary) and render as KPI grid instead
  const hasMetricValueKeys = keys.length === 2 &&
    keys.some(k => k.toLowerCase() === 'metric' || k.toLowerCase() === 'label') &&
    keys.some(k => k.toLowerCase() === 'value');
  const isShortKeyValue = hasMetricValueKeys && rows.length <= 6;

  if (isShortKeyValue) {
    const mKey = keys.find(k => k.toLowerCase() === 'metric' || k.toLowerCase() === 'label')!;
    const vKey = keys.find(k => k.toLowerCase() === 'value')!;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
        {rows.map((row, i) => {
          const label = String(row[mKey] ?? '');
          const val = String(row[vKey] ?? '');

          let accentClass = "border-l-blue-500 bg-gradient-to-br from-blue-50/40 to-blue-100/10 hover:from-blue-50/60 hover:to-blue-100/20 border-blue-100/60";
          let iconBg = "bg-blue-50 text-blue-600 border border-blue-100/85";
          const lLower = label.toLowerCase();
          if (lLower.includes('achieved') || lLower.includes('won') || lLower.includes('revenue') || lLower.includes('sales') || lLower.includes('value')) {
            accentClass = "border-l-emerald-500 bg-gradient-to-br from-emerald-50/40 to-emerald-100/10 hover:from-emerald-50/60 hover:to-emerald-100/20 border-emerald-100/60";
            iconBg = "bg-emerald-50 text-emerald-600 border border-emerald-100/85";
          } else if (lLower.includes('open') || lLower.includes('leads') || lLower.includes('count') || lLower.includes('size') || lLower.includes('team')) {
            accentClass = "border-l-blue-500 bg-gradient-to-br from-blue-50/40 to-blue-100/10 hover:from-blue-50/60 hover:to-blue-100/20 border-blue-100/60";
            iconBg = "bg-blue-50 text-blue-600 border border-blue-100/85";
          } else if (lLower.includes('age') || lLower.includes('hot') || lLower.includes('urgent') || lLower.includes('days') || lLower.includes('left')) {
            accentClass = "border-l-amber-500 bg-gradient-to-br from-amber-50/40 to-amber-100/10 hover:from-amber-50/60 hover:to-amber-100/20 border-amber-100/60";
            iconBg = "bg-amber-50 text-amber-600 border border-amber-100/85";
          } else if (lLower.includes('lost')) {
            accentClass = "border-l-rose-500 bg-gradient-to-br from-rose-50/40 to-rose-100/10 hover:from-rose-50/60 hover:to-rose-100/20 border-rose-100/60";
            iconBg = "bg-rose-50 text-rose-600 border border-rose-100/85";
          } else {
            accentClass = "border-l-slate-400 bg-gradient-to-br from-slate-50/40 to-slate-100/10 hover:from-slate-50/60 hover:to-slate-100/20 border-slate-200/60";
            iconBg = "bg-slate-100 text-slate-600 border border-slate-200/85";
          }

          return (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between rounded-2xl border border-slate-100 border-l-4 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                accentClass
              )}
            >
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">{val}</p>
              </div>
        <div className={cn("p-2.5 rounded-xl shrink-0", iconBg)}>
                {getCardIcon(label)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const renderCell = (val: unknown) => {
    if (val === null || val === undefined) return <span className="text-slate-400">—</span>;
    const str = String(val).trim();
    if (str === '') return <span className="text-slate-400">—</span>;

    const upper = str.toUpperCase();
    if (['URGENT', 'CRITICAL', 'HOT'].includes(upper)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          {str}
        </span>
      );
    }
    if (['TODAY', 'PENDING', 'FOLLOWUP', 'WARNING'].includes(upper)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
          {str}
        </span>
      );
    }
    if (['SUCCESS', 'WON', 'COMPLETED', 'ACTIVE', 'DOMESTIC'].includes(upper)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
          {str}
        </span>
      );
    }
    if (['LOST', 'CANCELLED', 'INACTIVE', 'EXPORT'].includes(upper)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
          {str}
        </span>
      );
    }

    if (typeof val === 'number') {
      return <span className="font-bold text-slate-800">{val.toLocaleString()}</span>;
    }
    if (!isNaN(Number(str)) && str !== '') {
      return <span className="font-bold text-slate-800">{Number(str).toLocaleString()}</span>;
    }

    return <span className="text-slate-700 font-medium">{str}</span>;
  };

  const handleRowClick = (row: Record<string, unknown>) => {
    const id = row[idKey!];
    if (id) {
      navigate(`/leads/${id}/edit`);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200/80">
            {keys.filter(k => k !== idKey).map((k) => (
              <th key={k} className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">
                {k.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.slice(0, 100).map((row, i) => (
            <tr
              key={i}
              className={cn(
                "hover:bg-slate-50/80 transition-colors duration-150",
                idKey ? "cursor-pointer" : ""
              )}
              onClick={() => idKey && handleRowClick(row)}
            >
              {keys.filter(k => k !== idKey).map((k) => (
                <td key={k} className="px-4 py-2.5 text-slate-600">
                  {renderCell(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rowsData.length > 100 && (
        <p className="text-[10px] text-slate-400 p-2 text-center border-t border-slate-100 bg-slate-50/30">
          Showing first 100 of {rowsData.length} rows.
        </p>
      )}
    </div>
  );
}

export const DashboardPage: React.FC = () => {
  const { showToast } = useApp();
  const showToastRef = useRef(showToast);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const canViewReport = useAppSelector(selectHasPermission('marketing.view_report'));
  const canCreateDashboard = useAppSelector(selectHasPermission('marketing.create_dashboard')) || useAppSelector(selectHasPermission('marketing.admin'));
  const canAssignDashboard = useAppSelector(selectHasPermission('marketing.assign_dashboard')) || useAppSelector(selectHasPermission('marketing.admin'));
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
  const [performerData, setPerformerData] = useState<PerformerOfMonthResponse | null>(null);
  const [performerLoading, setPerformerLoading] = useState(false);
  const [quickQuotationSubmitting, setQuickQuotationSubmitting] = useState(false);
  const [quickQuotationValue, setQuickQuotationValue] = useState('');

  const [layout, setLayout] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard-layout');
      const parsed = saved ? (JSON.parse(saved) as WidgetConfig[]) : [];
      return packLayout(ensureDefaultWidgets(migrateLayout(parsed)));
    } catch (e) {
      return packLayout(ensureDefaultWidgets([]));
    }
  });

  const [savedDashboards, setSavedDashboards] = useState<SavedDashboardResponse[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<number | null>(null);
  const [dashboardDateFrom, setDashboardDateFrom] = useState('');
  const [dashboardDateTo, setDashboardDateTo] = useState('');
  const [savedDashboardsLoading, setSavedDashboardsLoading] = useState(false);
  const [showCreateDashboardModal, setShowCreateDashboardModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [createDashboardName, setCreateDashboardName] = useState('');
  const [createDashboardSubmitting, setCreateDashboardSubmitting] = useState(false);
  const [showAssignDashboardModal, setShowAssignDashboardModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);
const [settingsDeleting, setSettingsDeleting] = useState<number | null>(null);
  const [savedDashboardAssignments, setSavedDashboardAssignments] = useState<SavedDashboardAssignmentResponse[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assigningDashboard, setAssigningDashboard] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignCanEdit, setAssignCanEdit] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [assignableUsersLoading, setAssignableUsersLoading] = useState(false);
  const [assignType, setAssignType] = useState<'person' | 'role'>('person');
  const [assignRole, setAssignRole] = useState('employee');

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedCount, setDraggedCount] = useState(1);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);
  const [addWidgetType, setAddWidgetType] = useState<DashboardWidgetType>('target-card');
  const [addWidgetTitle, setAddWidgetTitle] = useState('');
  const [addWidgetCode, setAddWidgetCode] = useState('');
  const [addWidgetChartType, setAddWidgetChartType] = useState<string>('table');
  const [addWidgetTimeGroup, setAddWidgetTimeGroup] = useState<string>('month');
  // const [aiPrompt, setAiPrompt] = useState('');
  // const [aiScopeMode, setAiScopeMode] = useState<'auto' | 'employee' | 'region' | 'domain'>('auto');
  // const [aiGenerating, setAiGenerating] = useState(false);
  const aiPrompt = '';
  const aiScopeMode = 'auto';
  const aiGenerating = false;
  const [sqlPreviewData, setSqlPreviewData] = useState<unknown[]>([]);
  const [sqlPreviewChartType, setSqlPreviewChartType] = useState<string>('table');
  const [sqlPreviewError, setSqlPreviewError] = useState<string | null>(null);
  const [sqlPreviewCompiledSql, setSqlPreviewCompiledSql] = useState('');
  const [sqlPreviewLoading, setSqlPreviewLoading] = useState(false);
  const [sqlWidgetData, setSqlWidgetData] = useState<Record<string, { data?: unknown[]; chart_type?: string; error?: string }>>({});
  const lastPersistedLayoutRef = useRef<string>('');
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const loadDashboard = useCallback(async () => {
    if (permissionDenied) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [leadsRes, contactsRes, customersRes, summary, statuses, targetStatsRes, scopeStatsRes, scopeRes] = await Promise.all([
        marketingAPI.getLeads({ page: 1, page_size: 10, date_from: dashboardDateFrom || undefined, date_to: dashboardDateTo || undefined }),
        marketingAPI.getContacts({ page: 1, page_size: 10 }),
        marketingAPI.getCustomers({ page: 1, page_size: 10 }),
        canViewReport ? marketingAPI.getReportsSummary({ date_from: dashboardDateFrom || undefined, date_to: dashboardDateTo || undefined }).catch(() => null) : Promise.resolve(null),
        marketingAPI.getLeadStatuses({ is_active: true }).catch(() => []),
        marketingAPI.getDashboardTargetStats({ date_from: dashboardDateFrom || undefined, date_to: dashboardDateTo || undefined }).catch(() => null),
        marketingAPI.getScopeTargetStats({ date_from: dashboardDateFrom || undefined, date_to: dashboardDateTo || undefined }).catch(() => null),
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
        showToastRef.current('You don\'t have permission to view this dashboard', 'error');
      } else {
        showToastRef.current('Failed to load dashboard data', 'error');
      }
      setStats([]);
      setRecentLeads([]);
      setReportSummary(null);
      setTargetStats(null);
    } finally {
      setLoading(false);
    }
  }, [permissionDenied, canViewReport, dashboardDateFrom, dashboardDateTo]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const isHeadRole = reportScope?.role === 'domain_head' || reportScope?.role === 'super_admin' || reportScope?.is_domain_coordinator === true;

  useEffect(() => {
    if (permissionDenied || loading || !reportScope) return;
    if (isHeadRole) {
      setHeadSummaryLoading(true);
      marketingAPI.getHeadDashboardSummary({ date_from: dashboardDateFrom || undefined, date_to: dashboardDateTo || undefined })
        .then(setHeadSummary)
        .catch(() => setHeadSummary(null))
        .finally(() => setHeadSummaryLoading(false));
    } else {
      setHeadSummary(null);
    }
  }, [permissionDenied, loading, reportScope, isHeadRole, dashboardDateFrom, dashboardDateTo]);

  const loadPerformer = useCallback(async () => {
    setPerformerLoading(true);
    try {
      const data = await marketingAPI.getPerformerOfMonth();
      setPerformerData(data);
    } catch {
      setPerformerData(null);
    } finally {
      setPerformerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissionDenied || loading) return;
    loadPerformer();
  }, [permissionDenied, loading, loadPerformer]);

  useEffect(() => {
    if (permissionDenied) return;
    setSavedDashboardsLoading(true);
    marketingAPI.getSavedDashboards()
      .then(setSavedDashboards)
      .catch(() => setSavedDashboards([]))
      .finally(() => setSavedDashboardsLoading(false));
  }, [permissionDenied]);

  useEffect(() => {
    if (savedDashboards.length === 0) {
      setSelectedDashboardId(null);
      return;
    }
    setSelectedDashboardId((prev) => {
      if (prev != null && savedDashboards.some((d) => d.id === prev)) return prev;
      const lastId = localStorage.getItem('lastDashboardId');
      if (lastId && savedDashboards.some((d) => d.id === parseInt(lastId, 10))) return parseInt(lastId, 10);
      return savedDashboards[0].id;
    });
  }, [savedDashboards]);

  useEffect(() => {
    if (selectedDashboardId == null) {
      setSqlWidgetData({});
      return;
    }
    marketingAPI.getSavedDashboard(selectedDashboardId, {
      date_from: dashboardDateFrom || undefined,
      date_to: dashboardDateTo || undefined,
    }).then((res) => {
      const layoutFromApi = Array.isArray(res.config?.layout) ? (res.config?.layout as WidgetConfig[]) : [];
      const nextLayout = ensureDefaultWidgets(migrateLayout(layoutFromApi));
      setLayout(nextLayout);
      lastPersistedLayoutRef.current = JSON.stringify(nextLayout);
      setSqlWidgetData(res.widget_data ?? {});
      if (selectedDashboardId != null) localStorage.setItem('lastDashboardId', String(selectedDashboardId));
    }).catch((e: unknown) => {
      setSqlWidgetData({});
      const msg = e instanceof Error ? e.message : 'Failed to load selected dashboard';
      showToastRef.current(msg, 'error');
    });
  }, [selectedDashboardId, dashboardDateFrom, dashboardDateTo]);

  const toggleResize = (id: string) => {
    setLayout(prev => packLayout(prev.map(w => {
      if (w.id === id) {
        const nextSpan = (w.span % 4) + 1 as 1 | 2 | 3 | 4;
        return { ...w, span: nextSpan };
      }
      return w;
    })));
  };

  const removeWidget = (id: string) => {
    setLayout(prev => prev.filter(w => w.id !== id));
  };

  const openEditWidget = (config: WidgetConfig) => {
    setEditingWidgetId(config.id);
    setAddWidgetType((config.type ?? config.id) as DashboardWidgetType);
    setAddWidgetTitle(config.title ?? '');
    setAddWidgetCode(config.code ?? '');
    setAddWidgetChartType(config.chart_type ?? 'table');
    setAddWidgetTimeGroup((config as any).time_group ?? 'month');
    setSqlPreviewData([]);
    setSqlPreviewError(null);
    setSqlPreviewCompiledSql('');
    setShowAddWidgetModal(true);
  };

  const closeWidgetModal = () => {
    setShowAddWidgetModal(false);
    setEditingWidgetId(null);
    setAddWidgetTitle('');
    setAddWidgetCode('');
    setAddWidgetChartType('table');
    setAddWidgetTimeGroup('month');
    setAddWidgetType('target-card');
    // setAiPrompt('');
    // setAiScopeMode('auto');
    setSqlPreviewData([]);
    setSqlPreviewError(null);
    setSqlPreviewLoading(false);
    setSqlPreviewChartType('table');
    setSqlPreviewCompiledSql('');
  };

  const addWidget = () => {
    if (editingWidgetId) {
      setLayout(prev => prev.map((w) => {
        if (w.id !== editingWidgetId) return w;
        return {
          ...w,
          type: addWidgetType,
          title: addWidgetTitle.trim() || undefined,
          code: addWidgetType === 'custom_code' || addWidgetType === 'custom_sql' ? addWidgetCode.trim() || undefined : undefined,
          chart_type: addWidgetType === 'custom_sql' ? (addWidgetChartType || 'table') : undefined,
          time_group: addWidgetType === 'custom_sql' && (addWidgetCode.includes('{{time_group}}')) ? (addWidgetTimeGroup || 'month') : undefined,
        };
      }));
      closeWidgetModal();
      return;
    }
    const id = `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const widget: WidgetConfig & { time_group?: string } = {
      id,
      type: addWidgetType,
      span: 1,
      title: addWidgetTitle.trim() || undefined,
      code: addWidgetType === 'custom_code' || addWidgetType === 'custom_sql' ? addWidgetCode.trim() || undefined : undefined,
      chart_type: addWidgetType === 'custom_sql' ? (addWidgetChartType || 'table') : undefined,
      time_group: addWidgetType === 'custom_sql' && (addWidgetCode.includes('{{time_group}}')) ? (addWidgetTimeGroup || 'month') : undefined,
    };
    setLayout(prev => packLayout([...prev, widget]));
    closeWidgetModal();
  };

  const runSqlPreview = useCallback(async (sqlText?: string, chartTypeText?: string) => {
    const sql = (sqlText ?? addWidgetCode).trim();
    if (!sql) {
      setSqlPreviewError('Enter SQL to preview');
      setSqlPreviewData([]);
      return;
    }
    setSqlPreviewLoading(true);
    setSqlPreviewError(null);
    try {
      const schema = await marketingAPI.getSchema();
        const preview = await marketingAPI.previewSqlTemplate({
          sql,
        chart_type: (chartTypeText ?? addWidgetChartType) as 'table' | 'bar' | 'line' | 'pie' | 'number-card',
        date_from: dashboardDateFrom || undefined,
        date_to: dashboardDateTo || undefined,
        schema: (schema.tables || []).map((t) => ({
          name: t.name,
          columns: (t.columns || []).map((c) => ({ name: c.name, type: c.type })),
        })),
      });
      setSqlPreviewData(Array.isArray(preview.data) ? preview.data : []);
      setSqlPreviewChartType(preview.chart_type || (chartTypeText ?? addWidgetChartType) || 'table');
      setSqlPreviewCompiledSql(preview.compiled_sql || '');
      setSqlPreviewError(null);
    } catch (e: unknown) {
      setSqlPreviewData([]);
      const msg = e instanceof Error ? e.message : 'Failed to preview SQL';
      setSqlPreviewError(msg);
      showToast(msg, 'error');
    } finally {
      setSqlPreviewLoading(false);
    }
  }, [addWidgetCode, addWidgetChartType, dashboardDateFrom, dashboardDateTo, showToast]);

  // const handleGenerateWidgetWithAI = async () => {
  //   if (!aiPrompt.trim()) {
  //     showToast('Enter report context for AI generation', 'error');
  //     return;
  //   }
  //   setAiGenerating(true);
  //   try {
  //     const schema = await marketingAPI.getSchema();
  //     const ai = await marketingAPI.generateWidgetWithAI({
  //       prompt: aiPrompt.trim(),
  //       date_from: dashboardDateFrom || undefined,
  //       date_to: dashboardDateTo || undefined,
  //       schema: (schema.tables || []).map((t) => ({
  //         name: t.name,
  //         columns: (t.columns || []).map((c) => ({ name: c.name, type: c.type })),
  //       })),
  //       scope_mode: aiScopeMode,
  //       preferred_chart: addWidgetType === 'custom_sql' ? (addWidgetChartType as 'table' | 'bar' | 'line' | 'pie' | 'number-card') : undefined,
  //     });
  //     setAddWidgetType('custom_sql');
  //     setAddWidgetTitle(ai.title || addWidgetTitle);
  //     setAddWidgetCode(ai.sql || '');
  //     setAddWidgetChartType(ai.chart_type || 'table');
  //     await runSqlPreview(ai.sql || '', ai.chart_type || 'table');
  //     showToast('AI generated widget SQL. Review and add.');
  //   } catch (e: unknown) {
  //     showToast(e instanceof Error ? e.message : 'Failed to generate widget with AI', 'error');
  //   } finally {
  //     setAiGenerating(false);
  //   }
  // };

  const handleDragStart = (index: number) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDragOverIndex = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => setDraggedOverIndex(null);

  const handleDrop = (index: number) => {
    setDraggedOverIndex(null);
    if (draggedIndex === null) return;
    const newOrder = [...layout];
    const items = newOrder.splice(draggedIndex, draggedCount);
    const insertAt = index > draggedIndex ? index - draggedCount : index;
    newOrder.splice(insertAt, 0, ...items);
    setLayout(packLayout(newOrder));
    setDraggedIndex(null);
  };

  const renderWidget = (config: WidgetConfig) => {
    const widgetType = (config.type ?? config.id) as string;
    const commonProps = {
      isDraggable: isEditMode,
      showHandle: isEditMode,
      onDragStart: () => handleDragStart(layout.indexOf(config)),
      onDragOver: (e: React.DragEvent) => handleDragOverIndex(e, layout.indexOf(config)),
      onDragLeave: handleDragLeave,
      onDrop: () => handleDrop(layout.indexOf(config)),
      onResize: () => toggleResize(config.id),
      className: `min-w-0 ${isEditMode ? 'ring-2 ring-dashed ring-slate-200' : ''} ${draggedOverIndex === layout.indexOf(config) ? 'ring-blue-300' : ''}`,
      headerAction: isEditMode ? (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openEditWidget(config); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Edit widget"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeWidget(config.id); }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            aria-label="Remove widget"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : undefined,
    };

    switch (widgetType) {

      case 'leads-by-region':
        if (!isHeadRole || !headSummary?.region_breakdown.length) {
          return (
            <Card key={config.id} {...commonProps} title="Leads by region" description="Total, won, lost per region">
              <p className="text-sm text-slate-500 p-4 italic">Available for domain head and admin.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title="Leads by region" description="Total, won, lost per region" contentClassName="px-2 pb-2 pt-0">
            <RegionBreakdownBarChart data={headSummary.region_breakdown} />
          </Card>
        );
      case 'target-card': {
        const s = scopeTargetStats ?? targetStats;
        if (s == null) {
          return (
            <Card key={config.id} {...commonProps} title={`${scopeLabel} target this month`} description="Target and achieved in scope.">
              <p className="text-sm text-slate-500 p-4 italic">No target data available.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id}
            {...commonProps}
            title={scopeLabel === 'My' ? "This month's target" : `${scopeLabel} target this month`}
            description={scopeLabel === 'My'
              ? 'Achieved = sum of closed value from won leads this month (assigned to you or generated by you). Target can be set by admin in domain tree.'
              : `Achieved = sum of closed value from won leads this month in your ${scopeLabel.toLowerCase()} scope (${scopeTargetStats?.employee_count ?? 1} team member(s)).`}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 shadow-sm shrink-0">
                  <Target size={20} className="text-blue-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm mb-1.5">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Achieved this month</span>
                    <span className="font-black text-slate-900 text-sm whitespace-nowrap">₹{(s.achieved_this_month / 1_00_000).toFixed(2)} Lacs</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" 
                      style={{ width: `${Math.min(100, (s.monthly_target ? (s.achieved_this_month / s.monthly_target) * 100 : 0)).toFixed(1)}%` }} 
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1.5">Target: ₹{(s.monthly_target / 1_00_000).toFixed(2)} Lacs for {new Date(s.year, s.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-emerald-50/40 to-emerald-100/10 border border-emerald-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <Trophy size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Won leads (this month)</p>
                    <p className="text-xl font-black text-emerald-800 mt-0.5">{s.won_leads_count_this_month}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-rose-50/40 to-rose-100/10 border border-rose-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <XCircle size={18} className="text-rose-600 shrink-0" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Lost leads (this month)</p>
                    <p className="text-xl font-black text-rose-800 mt-0.5">{s.lost_leads_count_this_month}</p>
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
            <Card key={config.id} {...commonProps} title="Head summary" description="Region-wise split and key metrics.">
              <p className="text-sm text-slate-500 p-4">Available for domain head and admin.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title="Head summary" description={headSummary ? `Region-wise split and key metrics for ${new Date(headSummary.year, headSummary.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}.` : 'Region-wise split and key metrics.'}>
            {headSummaryLoading ? (
              <div className="p-6 flex items-center justify-center text-slate-500"><RefreshCw size={24} className="animate-spin" /></div>
            ) : headSummary ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-slate-50/40 to-slate-100/10 border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total leads</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{headSummary.total_leads}</p>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-amber-50/40 to-amber-100/10 border border-amber-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hot cases</p>
                    <p className="text-xl font-black text-amber-800 mt-1">{headSummary.hot_cases_count}</p>
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-blue-50/40 to-blue-100/10 border border-blue-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conversion ratio</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{headSummary.conversion_ratio_pct != null ? `${headSummary.conversion_ratio_pct}%` : '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-50/40 to-emerald-100/10 border border-emerald-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Won</p>
                      <p className="text-lg font-black text-emerald-800 mt-0.5">{headSummary.won_count}</p>
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-br from-rose-50/40 to-rose-100/10 border border-rose-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-rose-600">Lost</p>
                      <p className="text-lg font-black text-rose-800 mt-0.5">{headSummary.lost_count}</p>
                    </div>
                  </div>
                </div>

                {headSummary.region_breakdown.length > 0 && (
                  <div className="border border-slate-200/60 rounded-xl overflow-hidden shadow-xs bg-white">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3 bg-slate-50/50 border-b border-slate-100">Region-wise split</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200/80">
                            <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Region</th>
                            <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Domain</th>
                            <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Total</th>
                            <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Won</th>
                            <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Lost</th>
                            <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Hot</th>
                            <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Conv.%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {headSummary.region_breakdown.map((r) => (
                            <tr key={r.region_id} className="hover:bg-slate-50/80 transition-colors duration-150">
                              <td className="px-4 py-2.5 font-bold text-slate-800">{r.region_name}</td>
                              <td className="px-4 py-2.5 text-slate-600">{r.domain_name}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{r.total_leads}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">{r.won_count}</td>
                              <td className="px-4 py-2.5 text-right text-rose-600 font-bold">{r.lost_count}</td>
                              <td className="px-4 py-2.5 text-right text-amber-600 font-bold">{r.hot_cases_count}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{r.conversion_ratio_pct != null ? `${r.conversion_ratio_pct}%` : '—'}</td>
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
      case 'quotation-submitted-chart':
        if (!isHeadRole) {
          return (
            <Card key={config.id} {...commonProps} title="Quotations submitted" description="By region">
              <p className="text-sm text-slate-500 p-4 italic">Available for domain head and admin.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title="Quotations submitted" description="By region" contentClassName="px-2 pb-2 pt-0">
            <QuotationSubmittedWidget />
          </Card>
        );
      case 'target-achieved-chart': {
        const s = scopeTargetStats ?? targetStats;
        if (s == null) {
          return (
            <Card key={config.id} {...commonProps} title="Target vs achieved" description="Target and achieved this month.">
              <p className="text-sm text-slate-500 p-4 italic">No target data available.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title="Target vs achieved" description={`${scopeLabel} scope — ${new Date(s.year, s.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}`} contentClassName="px-2 pb-4 pt-0">
            <TargetAchievedBarChart target={s.monthly_target} achieved={s.achieved_this_month} year={s.year} month={s.month} />
          </Card>
        );
      }
      case 'won-lost-chart': {
        const s = scopeTargetStats ?? targetStats;
        if (s == null) {
          return (
            <Card key={config.id} {...commonProps} title="Won vs lost (this month)" description="Closed leads in scope.">
              <p className="text-sm text-slate-500 p-4">No data this month.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title="Won vs lost" description="This month performance" contentClassName="p-1">
            <WonLostPieChart won={s.won_leads_count_this_month} lost={s.lost_leads_count_this_month} />
          </Card>
        );
      }
      case 'leads-by-status-chart': {
        const filteredStatuses = leadStatusCounts.filter(d => d.count > 0);
        if (filteredStatuses.length === 0) {
          return (
            <Card key={config.id} {...commonProps} title="Leads by status" description="From recent leads in scope.">
              <p className="text-sm text-slate-500 p-4">No lead status data yet.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title="Leads by status" description="Current pipeline" contentClassName="p-1">
            <div className="h-full w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredStatuses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {filteredStatuses.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        );
      }
      case 'inquiries-quotations-chart':
        if (reportSummary == null || !canViewReport) {
          return (
            <Card key={config.id} {...commonProps} title="Inquiries & quotations" description={`${scopeLabel} scope`}>
              <p className="text-sm text-slate-500 p-4">No report data or permission.</p>
            </Card>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title="Inquiries & quotations" description={`${scopeLabel} scope`} contentClassName="px-2 pb-4 pt-0">
            <InquiriesQuotationsBarChart inquiries={reportSummary.inquiries_count} quotations={reportSummary.quotations_sent_count} />
          </Card>
        );
      case 'revenue-chart':
        return (
          <Card key={config.id} {...commonProps} title={`${scopeLabel} leads overview`} description={`Total leads and activity in scope.`}>
            <div className="p-4 space-y-4">
              {reportSummary != null && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gradient-to-br from-slate-50/40 to-slate-100/10 border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 p-3.5 rounded-xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{scopeLabel} leads (assigned)</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{reportSummary.leads_total}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50/40 to-blue-100/10 border border-blue-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 p-3.5 rounded-xl">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{scopeLabel} inquiries</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{reportSummary.inquiries_count}</p>
                  </div>
                </div>
              )}
              {leadStatusCounts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Recent leads by status</p>
                  {leadStatusCounts.map(({ label, count }) => (
                    <div key={label} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100/60 hover:bg-slate-50/50 px-1 rounded transition-colors duration-150">
                      <span className="text-slate-600 font-semibold">{label}</span>
                      <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      case 'goal-chart':
        return (
          <Card key={config.id} {...commonProps} title={`${scopeLabel} activity`} description={`Inquiries and quotations in scope.`}>
            <div className="p-4 space-y-4">
              {reportSummary != null ? (
                <>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-slate-50/40 to-slate-100/10 border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                          <FileText size={14} />
                        </div>
                        <span className="text-slate-600 text-xs font-semibold">Inquiries logged</span>
                      </div>
                      <span className="font-black text-slate-900 text-sm">{reportSummary.inquiries_count}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-blue-50/40 to-blue-100/10 border border-blue-100/60 shadow-sm transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                          <Quote size={14} />
                        </div>
                        <span className="text-slate-600 text-xs font-semibold">Quotations sent</span>
                      </div>
                      <span className="font-black text-blue-900 text-sm">{reportSummary.quotations_sent_count}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate('/reports')}>
                    View reports
                  </Button>
                </>
              ) : (
                <p className="text-slate-500 text-sm p-4 italic">No report data. Go to Reports for details.</p>
              )}
            </div>
          </Card>
        );
      case 'activity-table':
        return (
          <Card key={config.id} {...commonProps} title={scopeLabel === 'My' ? 'Recent leads' : `Recent leads (${scopeLabel})`} description="Latest leads in scope (click to edit)." noPadding maxHeight="none">
            <div className="overflow-x-auto">
              {recentLeads.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm italic">No leads yet.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50">
                      <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Name</th>
                      <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Company</th>
                      <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                      <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Next follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}/edit`)}
                        className="hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer"
                      >
                        <td className="px-4 py-2.5 font-bold text-slate-800">{leadDisplayName(lead)}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-medium">{leadDisplayCompany(lead) || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{lead.status_option?.label ?? '—'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 font-semibold">
                          {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="p-2 border-t border-slate-100 bg-slate-50/30">
                <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-700">
                  View all leads →
                </Button>
              </div>
            </div>
          </Card>
        );
      case 'global-reach':
      case 'quick_links':
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Quick links'} description="Marketing module.">
            <div className="p-4 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start font-black text-xs uppercase tracking-wider hover:bg-slate-50" onClick={() => navigate('/leads')} leftIcon={<Users size={14} />}>
                Leads
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start font-black text-xs uppercase tracking-wider hover:bg-slate-50" onClick={() => navigate('/contacts')} leftIcon={<UserCircle size={14} />}>
                Contacts
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start font-black text-xs uppercase tracking-wider hover:bg-slate-50" onClick={() => navigate('/customers')} leftIcon={<Users size={14} />}>
                Customers
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start font-black text-xs uppercase tracking-wider hover:bg-slate-50" onClick={() => navigate('/quotations')} leftIcon={<Quote size={14} />}>
                Quotations
              </Button>
              {canViewReport && (
                <Button variant="ghost" size="sm" className="w-full justify-start font-black text-xs uppercase tracking-wider hover:bg-slate-50" onClick={() => navigate('/reports')} leftIcon={<FileText size={14} />}>
                  Reports
                </Button>
              )}
            </div>
          </Card>
        );
      case 'custom_code':
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Custom / code'} description="Your code or notes">
            <CustomCodeWidget code={config.code} title={config.title} />
          </Card>
        );
      case 'stat':
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Stat'} description="Summary metric">
            <div className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 shadow-sm shrink-0">
                <Target size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Metric</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{reportSummary?.leads_total ?? '—'}</p>
              </div>
            </div>
          </Card>
        );
      case 'bar_chart':
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Bar chart'} description="Report data" contentClassName="px-2 pb-4 pt-0">
            {reportSummary != null ? (
              <InquiriesQuotationsBarChart inquiries={reportSummary.inquiries_count} quotations={reportSummary.quotations_sent_count} />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs italic p-4">No report data available.</div>
            )}
          </Card>
        );
      case 'pie_chart':
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Pie chart'} description="Distribution" contentClassName="p-1">
            {leadStatusCounts.length > 0 ? (
              <LeadStatusPieChart data={leadStatusCounts} />
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs italic p-4">No data available.</div>
            )}
          </Card>
        );
      case 'area_chart':
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Area chart'} description="Trend">
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs italic p-4">Area chart placeholder. Connect data source to customize.</div>
          </Card>
        );
      case 'table':
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Table'} description="Data table" noPadding>
            <div className="overflow-x-auto">
              {recentLeads.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm italic">No leads yet.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50">
                      <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Name</th>
                      <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Company</th>
                      <th className="px-4 py-2.5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLeads.slice(0, 5).map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{leadDisplayName(lead)}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-medium">{leadDisplayCompany(lead) || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">{lead.status_option?.label ?? '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        );
      case 'custom_sql': {
        const widgetRuntime = sqlWidgetData[config.id];
        const gridClass = `min-w-0 ${isEditMode ? 'ring-2 ring-dashed ring-slate-200' : ''} ${draggedOverIndex === layout.indexOf(config) ? 'ring-blue-300' : ''}`;
        if ((widgetRuntime?.chart_type || config.chart_type) === 'number-card') {
          const data = Array.isArray(widgetRuntime?.data) ? widgetRuntime.data : [];
          const row = data[0] as Record<string, unknown> | undefined;
          const keys = row ? Object.keys(row) : [];
          const labelCandidates = ['metric', 'label', 'name', 'title'];
          const labelKey = keys.find((k) => labelCandidates.includes(k.toLowerCase()));
          const valueKey = keys.find((k) => k.toLowerCase() === 'value') ?? keys.find((k) => k !== labelKey);
          const labelText = labelKey && row ? String(row[labelKey] ?? '') : '';
          const valueText = valueKey && row ? String(row[valueKey] ?? '—') : '—';
          const hasData = row && valueText !== '—';
          const hasDetail = row && keys.some(k => k.toLowerCase() === 'won');
          const detailWon = hasDetail ? String(row[keys.find(k => k.toLowerCase() === 'won')!] ?? '—') : '';
          const detailLost = hasDetail ? String(row[keys.find(k => k.toLowerCase() === 'lost')!] ?? '0') : '';
          const detailTotal = hasDetail ? String(row[keys.find(k => k.toLowerCase() === 'total')!] ?? '—') : '';
          const titleStr = config.title || labelText || 'Metric';
          const t = titleStr.toLowerCase();
          let accentColor = 'from-slate-100/60 to-slate-50 border-slate-300';
          let iconColor = 'text-slate-600';
          let valueColor = 'text-slate-800';
          let IconComponent = Users;
          if (t.includes('team') || t.includes('size') || t.includes('member')) {
            accentColor = 'from-blue-100/60 to-blue-50 border-blue-200';
            iconColor = 'text-blue-600';
            valueColor = 'text-blue-700';
            IconComponent = Users;
          } else if (t.includes('achieved') || t.includes('revenue')) {
            accentColor = 'from-emerald-100/60 to-emerald-50 border-emerald-200';
            iconColor = 'text-emerald-600';
            valueColor = 'text-emerald-700';
            IconComponent = Trophy;
          } else if (t.includes('won') || t.includes('deals')) {
            accentColor = 'from-violet-100/60 to-violet-50 border-violet-200';
            iconColor = 'text-violet-600';
            valueColor = 'text-violet-700';
            IconComponent = Check;
          } else if (t.includes('open') || t.includes('lead')) {
            accentColor = 'from-blue-100/60 to-blue-50 border-blue-200';
            iconColor = 'text-blue-600';
            valueColor = 'text-blue-700';
            IconComponent = Quote;
          } else if (t.includes('conversion') || t.includes('rate')) {
            accentColor = 'from-blue-100/60 to-blue-50 border-blue-200';
            iconColor = 'text-blue-600';
            valueColor = 'text-blue-700';
            IconComponent = Target;
          } else if (t.includes('hot') || t.includes('case')) {
            accentColor = 'from-amber-100/60 to-amber-50 border-amber-200';
            iconColor = 'text-amber-600';
            valueColor = 'text-amber-700';
            IconComponent = ShieldAlert;
          } else if (t.includes('day') || t.includes('target') || t.includes('monthly')) {
            accentColor = 'from-violet-100/60 to-violet-50 border-violet-200';
            iconColor = 'text-violet-600';
            valueColor = 'text-violet-700';
            IconComponent = Target;
          }
          return (
            <div
              key={config.id}
              className={`${gridClass} group relative h-full`}
              draggable={isEditMode}
              onDragStart={() => isEditMode && handleDragStart(layout.indexOf(config))}
              onDragOver={(e) => handleDragOverIndex(e, layout.indexOf(config))}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(layout.indexOf(config))}
              style={{ borderRadius: '1.25rem' }}
            >
              <div className={`flex items-center gap-2.5 p-3 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 bg-gradient-to-br ${accentColor}`}>
                <IconComponent size={18} className={`${iconColor} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 truncate">{titleStr}</p>
                  <p className={`text-xl font-black mt-0.5 ${hasData ? valueColor : 'text-slate-300'}`}>{hasData ? valueText : '—'}</p>
                  <p className="text-[9px] text-slate-400">
                    {hasData ? (
                      t.includes('team') ? 'Active members' :
                      t.includes('achieved') ? 'Won this month' :
                      t.includes('open') ? 'In scope' :
                      (t.includes('conversion') && hasDetail) ? `${detailWon} won · ${detailLost} lost · ${detailTotal} closed` :
                      t.includes('conversion') ? 'Closed deals' :
                      t.includes('hot') ? 'Requires action' :
                      t.includes('day') ? 'Remaining' :
                      t.includes('target') || t.includes('monthly') ? 'Monthly goal' :
                      'Current value'
                    ) : (
                      widgetRuntime?.error ? 'Error loading' :
                      data.length === 0 && !widgetRuntime?.data ? 'Loading…' :
                      'No data'
                    )}
                  </p>
                </div>
              </div>
              {isEditMode && (
                <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 bg-white/90 border border-slate-200 shadow-sm rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-1 cursor-move text-slate-400 hover:text-slate-600" title="Drag to reorder">
                    <GripVertical size={14} />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleResize(config.id); }}
                    className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                    title="Toggle size"
                  >
                    <Maximize2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openEditWidget(config); }}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeWidget(config.id); }}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        }
        return (
          <Card key={config.id} {...commonProps} title={config.title || 'Custom SQL'}>
            <CustomSqlWidgetContent
              code={config.code}
              chartType={widgetRuntime?.chart_type || config.chart_type || 'table'}
              data={widgetRuntime?.data}
              error={widgetRuntime?.error || null}
              span={config.span || 1}
              title={config.title || 'Custom SQL'}
            />
          </Card>
        );
      }
      case 'performer-of-month': {
        const topPerformer = performerData?.performers[0];
        const perfGridClass = `min-w-0 ${isEditMode ? 'ring-2 ring-dashed ring-slate-200' : ''} ${draggedOverIndex === layout.indexOf(config) ? 'ring-blue-300' : ''}`;
        return (
          <div
            key={config.id}
            className={`${perfGridClass} group relative h-full`}
            draggable={isEditMode}
            onDragStart={() => isEditMode && handleDragStart(layout.indexOf(config))}
            onDragOver={(e) => handleDragOverIndex(e, layout.indexOf(config))}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(layout.indexOf(config))}
            style={{ borderRadius: '1.25rem' }}
          >
            {performerLoading ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/50">
                <RefreshCw size={16} className="animate-spin text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 truncate">Top Performer</p>
                  <p className="text-xl font-black text-slate-300 mt-0.5">—</p>
                  <p className="text-[9px] text-slate-400">Loading…</p>
                </div>
              </div>
            ) : topPerformer ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 bg-gradient-to-br from-amber-100/60 to-amber-50 border border-amber-200">
                <Trophy size={18} className="text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 truncate">Top Performer</p>
                  <p className="text-xl font-black text-amber-700 mt-0.5 truncate">{topPerformer.employee_name}</p>
                  <p className="text-[9px] text-slate-400">{topPerformer.achievement_pct}% · {topPerformer.won_count} won</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/50">
                <Trophy size={18} className="text-slate-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 truncate">Top Performer</p>
                  <p className="text-xl font-black text-slate-300 mt-0.5">—</p>
                  <p className="text-[9px] text-slate-400">No data</p>
                </div>
              </div>
            )}
            {isEditMode && (
              <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 bg-white/90 border border-slate-200 shadow-sm rounded-md p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1 cursor-move text-slate-400 hover:text-slate-600" title="Drag to reorder">
                  <GripVertical size={14} />
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleResize(config.id); }}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                  title="Toggle size"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeWidget(config.id); }}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const handleSaveLayout = async () => {
    if (selectedDashboardId == null) {
      showToast('No dashboard selected', 'error');
      return;
    }
    const selectedSavedDashboard = selectedDashboardId != null ? savedDashboards.find((d) => d.id === selectedDashboardId) ?? null : null;
    const canEditSelectedDashboard = !!selectedSavedDashboard && (!!selectedSavedDashboard.can_edit || canCreateDashboard);
    if (!canEditSelectedDashboard) {
      showToast('You do not have permission to edit this dashboard', 'error');
      return;
    }
    try {
      await marketingAPI.updateSavedDashboard(selectedDashboardId, { config: { layout } });
      lastPersistedLayoutRef.current = JSON.stringify(layout);
      showToast('Dashboard saved to backend', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save dashboard', 'error');
      return;
    }
    setIsEditMode(false);
  };

  const selectedSavedDashboard = selectedDashboardId != null ? savedDashboards.find((d) => d.id === selectedDashboardId) ?? null : null;
  const canEditSelectedDashboard = !!selectedSavedDashboard && (!!selectedSavedDashboard.can_edit || canCreateDashboard);
  const canCustomizeDashboard = canEditSelectedDashboard;

  useEffect(() => {
    if (selectedDashboardId == null) return;
    if (!canEditSelectedDashboard) return;

    const serialized = JSON.stringify(layout);
    if (serialized === lastPersistedLayoutRef.current) return;

    const timer = window.setTimeout(async () => {
      try {
        await marketingAPI.updateSavedDashboard(selectedDashboardId, { config: { layout } });
        lastPersistedLayoutRef.current = serialized;
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'Failed to auto-save dashboard', 'error');
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [layout, selectedDashboardId, canEditSelectedDashboard, showToast]);

  const loadDashboardAssignments = useCallback(async () => {
    if (!selectedDashboardId || !canAssignDashboard) {
      setSavedDashboardAssignments([]);
      return;
    }
    setAssignmentsLoading(true);
    try {
      const rows = await marketingAPI.getSavedDashboardAssignments(selectedDashboardId);
      setSavedDashboardAssignments(rows);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to load assignments', 'error');
      setSavedDashboardAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [selectedDashboardId, canAssignDashboard, showToast]);

  useEffect(() => {
    if (showAssignDashboardModal) {
      loadDashboardAssignments();
      setAssignableUsersLoading(true);
      marketingAPI.getAssignableUsers()
        .then(setAssignableUsers)
        .catch(() => setAssignableUsers([]))
        .finally(() => setAssignableUsersLoading(false));
    }
  }, [showAssignDashboardModal, loadDashboardAssignments]);

  const headerActions = (
    <div className="flex items-center gap-2.5">
      <button
        onClick={loadDashboard}
        disabled={loading || permissionDenied}
        className="p-1.5 text-slate-300 hover:text-blue-500 transition-all active:rotate-180 duration-500"
        title="Refresh"
      >
        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
      </button>

      <Button
        variant={isEditMode ? 'primary' : 'outline'}
        size="sm"
        onClick={() => {
          if (!canCustomizeDashboard) {
            showToast('No permission', 'error');
            return;
          }
          if (isEditMode) handleSaveLayout();
          else setIsEditMode(true);
        }}
        disabled={!canCustomizeDashboard}
        leftIcon={isEditMode ? <Check size={14} /> : <LayoutIcon size={14} />}
        className={cn(
          "h-8 font-medium px-4 transition-all duration-300 rounded-xl text-[11px]",
          isEditMode ? "bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-500/20 text-white" : "bg-white border-slate-100 shadow-sm"
        )}
      >
        {isEditMode ? 'Save Layout' : 'Edit Layout'}
      </Button>

      <button
        onClick={() => setShowChangelog(true)}
        className="text-[10px] font-medium text-slate-400 hover:text-blue-600 transition-colors cursor-pointer ml-1"
        title="View changelog"
      >
        v1.0.9
      </button>
    </div>
  );

  const commandToolbar = (
    <div className="flex flex-wrap items-center gap-4 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 w-full">
      {/* Dashboard Selection (Clean & Integrated) */}
      <div className="flex flex-1 min-w-[200px] items-center pl-4 pr-1 border-r border-slate-100 group">
        <Search size={14} className="text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
        <Select
          isCombobox={true}
          containerClassName="flex-1 !space-y-0"
          triggerClassName="!border-none !shadow-none !bg-transparent text-[11px] h-9 font-medium !ring-0 focus:!ring-0 cursor-pointer w-full"
          placeholder="Search dashboards..."
          value={selectedDashboardId != null ? String(selectedDashboardId) : ''}
          onChange={(v) => setSelectedDashboardId(v ? parseInt(String(v), 10) : null)}
          options={savedDashboards.map((d) => ({ value: String(d.id), label: d.name }))}
        />
      </div>

      {/* Date Range Picker (Widened for visibility) */}
      <div className="flex items-center gap-2 px-4 h-9">
        <DatePicker
          value={dashboardDateFrom}
          onChange={(v) => setDashboardDateFrom(v || '')}
          className="w-[140px]"
          placeholder="From"
        />
        <span className="text-slate-300 flex items-center">—</span>
        <DatePicker
          value={dashboardDateTo}
          onChange={(v) => setDashboardDateTo(v || '')}
          className="w-[140px]"
          placeholder="To"
        />
      </div>

      {/* Visual Separator | */}
      <div className="text-slate-200 font-light mx-2 text-xl self-center hidden sm:block">|</div>

      {/* Final Action Buttons */}
      <div className="flex items-center gap-3 pr-2 ml-auto">
        {canCreateDashboard && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateDashboardModal(true)}
            leftIcon={<Plus size={16} />}
            className="h-9 px-6 font-medium rounded-xl shadow-lg shadow-blue-500/10 text-xs"
          >
            New Dashboard
          </Button>
        )}
          {canAssignDashboard && selectedDashboardId != null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignDashboardModal(true)}
              className="h-9 px-6 border-slate-100 bg-slate-50 font-medium hover:bg-slate-100 transition-all rounded-xl text-slate-700 text-xs"
            >
              Assign
            </Button>
          )}
          {reportScope?.role === 'super_admin' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <Settings size={16} />
            </Button>
          )}
        </div>
      </div>
    );

  const dashboardRole = reportScope?.role ?? 'self';
  const dashboardTitle =
    dashboardRole === 'super_admin' ? 'Marketing overview' :
    dashboardRole === 'domain_head' ? 'Domain dashboard' :
    dashboardRole === 'region_head' ? 'Region dashboard' : 'Dashboard';
  const dashboardDescription = 'Track campaigns & performance';
  const scopeLabel = scopeTargetStats?.scope_label ?? 'My';

  const breadcrumbs = [{ label: dashboardTitle }];
  return (
    <PageLayout
      title={dashboardTitle}
      description={dashboardDescription}
      actions={headerActions}
      breadcrumbs={breadcrumbs}
    >
      {commandToolbar}
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
                disabled={!canCustomizeDashboard}
              >
                Add widget
              </Button>
            </div>

            {layout.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-200/60 bg-white/40 backdrop-blur-sm p-16 text-center shadow-sm relative overflow-hidden group/empty">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent opacity-0 group-hover/empty:opacity-100 transition-opacity duration-700" />
                <div className="relative z-10">
                  <div className="mx-auto h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                    <LayoutIcon className="h-10 w-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Your Workspace is Empty</h3>
                  <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto font-medium leading-relaxed">Customize your command center by adding graphs, key metrics, or live data tables from the widget gallery.</p>
                  <Button size="lg" variant="primary" leftIcon={<Plus size={18} />} onClick={() => setShowAddWidgetModal(true)} disabled={!canCustomizeDashboard} className="shadow-xl shadow-blue-500/20 px-8 rounded-2xl h-11">
                    Initialize Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                {layout.map((config) => (
                  <div key={config.id} className={`col-span-${config.span ?? 1} min-w-0`}>
                    {renderWidget(config as any)}
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

          <VersionsModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
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
                        lastPersistedLayoutRef.current = JSON.stringify(layout);
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

          {showAssignDashboardModal && (
            <Modal
              isOpen
              onClose={() => {
                setShowAssignDashboardModal(false);
                setAssignEmployeeId('');
                setAssignCanEdit(false);
                setAssignType('person');
              }}
              title="Assign dashboard"
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Assign <span className="font-semibold text-slate-800">{selectedSavedDashboard?.name ?? 'dashboard'}</span> to a user or role in marketing.</p>
                
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                  <button
                    type="button"
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                      assignType === 'person' ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                    )}
                    onClick={() => setAssignType('person')}
                  >
                    Person
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                      assignType === 'role' ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
                    )}
                    onClick={() => setAssignType('role')}
                  >
                    Role
                  </button>
                </div>

                {assignType === 'person' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="User"
                      placeholder={assignableUsersLoading ? 'Loading users...' : 'Select user'}
                      value={assignEmployeeId}
                      onChange={(v) => setAssignEmployeeId(v != null ? String(v) : '')}
                      options={[
                        { value: '', label: 'Select user' },
                        ...assignableUsers.map((u) => ({ value: String(u.id), label: u.name })),
                      ]}
                      searchable
                      disabled={assignableUsersLoading}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700 mt-6 sm:mt-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={assignCanEdit}
                        onChange={(e) => setAssignCanEdit(e.target.checked)}
                      />
                      Allow editing
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Role"
                      placeholder="Select role"
                      value={assignRole}
                      onChange={(v) => setAssignRole(v != null ? String(v) : 'employee')}
                      options={[
                        { value: 'super_admin', label: 'Super Admin' },
                        { value: 'domain_head', label: 'Domain Head' },
                        { value: 'region_head', label: 'Region Head' },
                        { value: 'supervisor', label: 'Supervisor' },
                        { value: 'employee', label: 'Employee' },
                      ]}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700 mt-6 sm:mt-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={assignCanEdit}
                        onChange={(e) => setAssignCanEdit(e.target.checked)}
                      />
                      Allow editing
                    </label>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={assigningDashboard || (assignType === 'person' ? (!assignEmployeeId.trim() || assignableUsersLoading) : !assignRole)}
                    onClick={async () => {
                      if (!selectedDashboardId) return;
                      setAssigningDashboard(true);
                      try {
                        if (assignType === 'person') {
                          const employeeId = parseInt(assignEmployeeId, 10);
                          if (!Number.isFinite(employeeId) || employeeId <= 0) {
                            showToast('Select a user', 'error');
                            setAssigningDashboard(false);
                            return;
                          }
                          await marketingAPI.assignSavedDashboard(selectedDashboardId, {
                            assignee_employee_id: employeeId,
                            can_edit: assignCanEdit,
                          });
                        } else {
                          await marketingAPI.assignSavedDashboard(selectedDashboardId, {
                            role: assignRole,
                            can_edit: assignCanEdit,
                          });
                        }
                        showToast('Dashboard assignment updated', 'success');
                        setAssignEmployeeId('');
                        setAssignCanEdit(false);
                        await loadDashboardAssignments();
                      } catch (e: unknown) {
                        showToast(e instanceof Error ? e.message : 'Failed to assign dashboard', 'error');
                      } finally {
                        setAssigningDashboard(false);
                      }
                    }}
                  >
                    {assigningDashboard ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Current assignments</p>
                  {assignmentsLoading ? (
                    <div className="text-sm text-slate-500 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Loading...</div>
                  ) : savedDashboardAssignments.length === 0 ? (
                    <p className="text-sm text-slate-500">No assignments yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {savedDashboardAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5">
                          <div>
                            <p className="text-sm text-slate-800">
                              {assignment.role
                                ? `Role: ${assignment.role.replace('_', ' ').toUpperCase()}`
                                : assignableUsers.find((u) => u.id === assignment.assignee_employee_id)?.name ?? `Employee #${assignment.assignee_employee_id}`}
                            </p>
                            <p className="text-xs text-slate-500">{assignment.can_edit ? 'Can edit' : 'View only'}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!selectedDashboardId) return;
                              try {
                                await marketingAPI.deleteSavedDashboardAssignment(selectedDashboardId, assignment.id);
                                showToast('Assignment removed', 'success');
                                setSavedDashboardAssignments((prev) => prev.filter((row) => row.id !== assignment.id));
                              } catch (e: unknown) {
                                showToast(e instanceof Error ? e.message : 'Failed to remove assignment', 'error');
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Modal>
          )}

          {/* Settings modal — super admin only */}
          {showSettingsModal && (
            <Modal
              isOpen
              onClose={() => setShowSettingsModal(false)}
              title="Dashboard Settings"
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Manage all dashboards. <span className="font-semibold text-rose-600">Deletion is irreversible.</span></p>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {savedDashboards.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{d.name}</p>
                        <p className="text-xs text-slate-500">ID: {d.id}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {savedDashboards.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs"
                            disabled={settingsDeleting === d.id}
                            onClick={async () => {
                              if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
                              setSettingsDeleting(d.id);
                              try {
                                await marketingAPI.deleteSavedDashboard(d.id);
                                setSavedDashboards((prev) => prev.filter((x) => x.id !== d.id));
                                if (selectedDashboardId === d.id) {
                                  const remaining = savedDashboards.filter((x) => x.id !== d.id);
                                  setSelectedDashboardId(remaining.length > 0 ? remaining[0].id : null);
                                }
                                showToast(`"${d.name}" deleted`, 'success');
                              } catch (e: unknown) {
                                showToast(e instanceof Error ? e.message : 'Failed to delete dashboard', 'error');
                              } finally {
                                setSettingsDeleting(null);
                              }
                            }}
                          >
                            {settingsDeleting === d.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        )}
                        {savedDashboards.length <= 1 && (
                          <span className="text-xs text-slate-400 italic">Last dashboard — can't delete</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Modal>
          )}

          {/* Add widget modal */}
          {showAddWidgetModal && (
            <Modal
              isOpen
              onClose={closeWidgetModal}
              title={editingWidgetId ? 'Edit widget' : 'Add widget'}
            >
              <div className="space-y-4">
                {/*
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Wand2 size={14} />
                    <p className="text-xs font-semibold">AI widget generator</p>
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the report you need. Example: show monthly quotations by region for my scope."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      label="Scope mode"
                      value={aiScopeMode}
                      onChange={(v) => setAiScopeMode((v ?? 'auto') as 'auto' | 'employee' | 'region' | 'domain')}
                      options={AI_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                      searchable={false}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        leftIcon={<Wand2 size={14} />}
                        disabled={aiGenerating || !aiPrompt.trim()}
                        onClick={handleGenerateWidgetWithAI}
                      >
                        {aiGenerating ? 'Generating...' : 'Generate with AI'}
                      </Button>
                    </div>
                  </div>
                </div>
                */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Widget type</label>
                  <Select
                    value={addWidgetType}
                    onChange={(v) => {
                      const newType = (v ?? 'target-card') as DashboardWidgetType;
                      setAddWidgetType(newType);
                      setSqlPreviewData([]);
                      setSqlPreviewError(null);
                      setSqlPreviewCompiledSql('');
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
                          <Link to="/schema" className="text-blue-600 hover:underline">View tables &amp; columns (ER diagram)</Link>
                        </p>
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2">
                          <p className="font-medium text-slate-700 mb-1">How to create a SQL widget</p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            <li>Choose <strong>Custom SQL chart</strong> as widget type.</li>
                            <li>Optionally set a <strong>Title</strong> for the card.</li>
                            <li>Write a <strong>SELECT</strong> query below with scope placeholders like <code>{'{{employee_id}}'}</code> or <code>{'{{domain_id}}'}</code>.</li>
                            <li>For date filtering from dashboard header, use <code>{'{{date_from}}'}</code> and <code>{'{{date_to}}'}</code>.</li>
                            <li>Use <Link to="/schema" className="text-blue-600 hover:underline">Schema / ER diagram</Link> to see table and column names.</li>
                            <li>Pick <strong>Chart / display</strong> (Table, Bar, Line, Pie, Heatmap, or Number card).</li>
                            <li>Click <strong>Add widget</strong>. Data is loaded from the backend when the dashboard is viewed.</li>
                          </ol>
                          <p className="mt-1.5 text-slate-500">Example: <code className="bg-slate-200 px-1 rounded">SELECT status, count(*) AS total FROM leads WHERE assigned_to_employee_id = {'{{employee_id}}'} AND DATE(created_at) BETWEEN {'{{date_from}}'} AND {'{{date_to}}'} GROUP BY status</code></p>
                        </div>
                      </>
                    )}
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addWidgetCode}
                      onChange={(e) => { setAddWidgetCode(e.target.value); setSqlPreviewError(null); }}
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
                        { value: 'number-card', label: 'Number card' },
                      ]}
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Time grouping (for DATE_TRUNC)</label>
                      <Select
                        value={addWidgetTimeGroup}
                        onChange={(v) => setAddWidgetTimeGroup(String(v ?? 'month'))}
                        options={[
                          { value: 'day', label: 'Day' },
                          { value: 'week', label: 'Week' },
                          { value: 'month', label: 'Month' },
                        ]}
                      />
                      <p className="text-xs text-slate-400 mt-1">Used when SQL contains {'{{time_group}}'} — replaces the interval in DATE_TRUNC.</p>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={sqlPreviewLoading || !addWidgetCode.trim()}
                        onClick={() => runSqlPreview()}
                      >
                        {sqlPreviewLoading ? 'Previewing...' : 'Preview'}
                      </Button>
                    </div>
                    {(sqlPreviewLoading || sqlPreviewError || sqlPreviewData.length > 0) && (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white">
                        {sqlPreviewLoading ? (
                          <div className="p-3 text-sm text-slate-500 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Loading preview...</div>
                        ) : (
                          <>
                            {sqlPreviewCompiledSql && (
                              <div className="border-b border-slate-200 p-2">
                                <p className="text-[11px] font-semibold text-slate-600 mb-1">Compiled SQL (current user scope)</p>
                                <pre className="text-[10px] whitespace-pre-wrap break-words text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">{sqlPreviewCompiledSql}</pre>
                              </div>
                            )}
                            <CustomSqlWidgetContent
                              code={addWidgetCode}
                              chartType={sqlPreviewChartType || addWidgetChartType}
                              data={sqlPreviewData}
                              error={sqlPreviewError}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={closeWidgetModal}>Cancel</Button>
                  <Button size="sm" onClick={addWidget}>{editingWidgetId ? 'Save' : 'Add widget'}</Button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </PageLayout>
  );
};
