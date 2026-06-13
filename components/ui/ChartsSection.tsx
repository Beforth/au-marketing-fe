
import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { CHART_DATA } from '../../constants';
import { marketingAPI } from '../../lib/marketing-api';
import { cn } from '../../lib/utils';
import type { QuotationStatsResponse } from '../../lib/marketing-api';

const chartColors = {
  target: '#f1f5f9', // slate-100
  achieved: '#3b82f6', // blue-500
  won: '#10b981', // emerald-500
  lost: '#f43f5e', // rose-500
  total: '#94a3b8', // slate-400
  hot: '#f59e0b', // amber-500
  default: ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'],
};

const formatYAxisValue = (value: number) => {
  if (value >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  }
  if (value >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(0)} L`;
  }
  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(0)} K`;
  }
  return String(value);
};

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg shadow-slate-100/80">
        {label && (
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-slate-100">
            {label}
          </p>
        )}
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">{entry.name || entry.dataKey}</span>
              </div>
              <span className="text-xs font-bold text-slate-900">
                {typeof entry.value === 'number' && entry.value < 1000 && entry.value % 1 !== 0 
                  ? entry.value.toFixed(2) 
                  : typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/** Target vs Achieved (₹ lacs) - Vertical Bar */
export const TargetAchievedBarChart: React.FC<{
  target: number;
  achieved: number;
  year: number;
  month: number;
}> = ({ target, achieved, year, month }) => {
  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  const data = [
    { name: 'Target', value: target / 1_00_000, fill: 'url(#targetBarGrad)' },
    { name: 'Achieved', value: achieved / 1_00_000, fill: 'url(#achievedBarGrad)' },
  ];
  return (
    <div className="h-[220px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="targetBarGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="achievedBarGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={75} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} isAnimationActive>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} stroke={entry.name === 'Target' ? '#e2e8f0' : 'none'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Won vs Lost leads this month (donut) */
export const WonLostPieChart: React.FC<{ won: number; lost: number }> = ({ won, lost }) => {
  const [hoveredData, setHoveredData] = React.useState<{ name: string; value: number } | null>(null);
  const data = [
    { name: 'Won', value: won, fill: 'url(#wonPieGrad)' },
    { name: 'Lost', value: lost, fill: 'url(#lostPieGrad)' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs font-medium italic">No performance data available</div>
    );
  }

  const total = won + lost;

  return (
    <div className="h-[220px] w-full relative group">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="wonPieGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="lostPieGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#e11d48" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={5}
            stroke="none"
            onMouseEnter={(_, index) => setHoveredData(data[index])}
            onMouseLeave={() => setHoveredData(null)}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} className="hover:opacity-80 transition-opacity duration-300 pointer-events-auto" />
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
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[50%] overflow-hidden">
        <p className="text-[18px] font-bold text-slate-900 leading-none transition-all duration-200">
          {hoveredData ? hoveredData.value : total}
        </p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 transition-all duration-200 truncate px-1">
          {hoveredData ? hoveredData.name : 'Total'}
        </p>
      </div>
    </div>
  );
};

/** Leads by status (donut) */
export const LeadStatusPieChart: React.FC<{ data: { label: string; count: number }[] }> = ({ data: raw }) => {
  const [hoveredData, setHoveredData] = React.useState<{ name: string; value: number } | null>(null);
  const data = raw
    .filter((d) => d.count > 0)
    .map((d, i) => ({ 
      name: d.label, 
      value: d.count, 
      fill: `url(#statusGrad${i % 6})` 
    }));

  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs font-medium italic">No status data</div>
    );
  }

  const totalCount = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="h-[220px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="statusGrad0" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="statusGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="statusGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#e11d48" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="statusGrad3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="statusGrad4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="statusGrad5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#db2777" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="40%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
            onMouseEnter={(_, index) => setHoveredData(data[index])}
            onMouseLeave={() => setHoveredData(null)}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} className="pointer-events-auto" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            align="center" 
            iconType="circle"
            iconSize={6}
            formatter={(value: string) => {
              const item = data.find(d => d.name === value);
              return `${value} (${item?.value ?? 0})`;
            }}
            wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#64748b', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-[50%] overflow-hidden">
        <p className="text-[18px] font-bold text-slate-900 leading-none transition-all duration-200">
          {hoveredData ? hoveredData.value : totalCount}
        </p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 transition-all duration-200 truncate px-1">
          {hoveredData ? hoveredData.name : 'Leads'}
        </p>
      </div>
    </div>
  );
};

/** Region-wise breakdown - Stacked/Grouped Horizontal */
export const RegionBreakdownBarChart: React.FC<{
  data: { region_name: string; total_leads: number; won_count: number; lost_count: number }[];
}> = ({ data }) => {
  const chartData = data.map((r) => ({
    name: r.region_name.length > 10 ? r.region_name.slice(0, 9) + '…' : r.region_name,
    total: r.total_leads,
    won: r.won_count,
    lost: r.lost_count,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-400 text-xs font-medium italic">No region data available</div>
    );
  }

  return (
    <div className="h-[240px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 15, bottom: 5 }} barGap={8}>
          <defs>
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="wonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#fb7185" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
            dy={10}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle" 
            iconSize={6}
            wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#64748b', paddingBottom: '15px' }}
          />
          <Bar dataKey="total" name="Total" fill="url(#totalGrad)" radius={[4, 4, 0, 0]} barSize={22} />
          <Bar dataKey="won" name="Won" fill="url(#wonGrad)" radius={[4, 4, 0, 0]} barSize={22} />
          <Bar dataKey="lost" name="Lost" fill="url(#lostGrad)" radius={[4, 4, 0, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Inquiries vs Quotations (Clean Horizontal Bar) */
export const InquiriesQuotationsBarChart: React.FC<{ inquiries: number; quotations: number }> = ({ inquiries, quotations }) => {
  const data = [
    { name: 'Inquiries', count: inquiries, fill: 'url(#inquiriesGrad)' },
    { name: 'Quotations', count: quotations, fill: 'url(#quotationsGrad)' },
  ];
  return (
    <div className="h-[220px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }} barSize={36} barGap={12}>
          <defs>
            <linearGradient id="inquiriesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="quotationsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
            axisLine={false} 
            tickLine={false} 
            dy={8}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1000} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueChart: React.FC = () => {
  return (
    <div className="h-[300px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={CHART_DATA} margin={{ top: 10, right: 20, left: 15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            dy={12}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            tickFormatter={formatYAxisValue}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SalesTargetChart: React.FC = () => {
  return (
    <div className="h-[300px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={CHART_DATA} margin={{ top: 10, right: 20, left: 15, bottom: 0 }} barGap={8}>
          <defs>
            <linearGradient id="targetChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="achievedChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            dy={12}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            tickFormatter={formatYAxisValue}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#64748b', paddingBottom: '20px' }}
          />
          <Bar dataKey="target" name="Target" fill="url(#targetChartGrad)" radius={[4, 4, 0, 0]} barSize={18} />
          <Bar dataKey="revenue" name="Achieved" fill="url(#achievedChartGrad)" radius={[4, 4, 0, 0]} barSize={18} animationDuration={2000} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


/** Quotations Submitted widget: grouped bar chart by region, with Monthly/Quarterly/Till Date filter. */
export const QuotationSubmittedWidget: React.FC = () => {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'till_date'>('monthly');
  const [data, setData] = useState<QuotationStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await marketingAPI.getQuotationStats(period);
      setData(result);
    } catch (e) {
      console.error('Failed to load quotation stats', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-400">
        <RefreshCw size={20} className="animate-spin" />
      </div>
    );
  }

  if (!data || data.regions.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs font-medium italic">
        No quotation data available
      </div>
    );
  }

  const filterButtons = (
    <div className="flex gap-1 px-2 pt-2 pb-1">
      {(['monthly', 'quarterly', 'till_date'] as const).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg transition-colors',
            period === p
              ? 'bg-blue-100 text-blue-700'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          )}
        >
          {p === 'monthly' ? 'Monthly' : p === 'quarterly' ? 'Quarterly' : 'Till Date'}
        </button>
      ))}
    </div>
  );

  if (data.labels.length === 1) {
    const simple = data.regions.map((r) => ({
      name: r.region_name.length > 14 ? r.region_name.slice(0, 13) + '…' : r.region_name,
      count: r.data[0],
    }));
    return (
      <div>
        {filterButtons}
        <div className="h-[150px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simple} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {simple.map((_, i) => (
                  <Cell key={i} fill={chartColors.default[i % chartColors.default.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  const chartData = data.labels.map((label, i) => ({
    name: label,
    ...Object.fromEntries(data.regions.map((r) => [r.region_name, r.data[i]])),
  }));

  return (
    <div>
      {filterButtons}
      <div className="h-[260px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dy={8}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#64748b', paddingBottom: '10px' }}
            />
            {data.regions.map((r, i) => (
              <Bar key={r.region_name} dataKey={r.region_name} fill={chartColors.default[i % chartColors.default.length]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


export const CustomCodeWidget: React.FC<{ code?: string; title?: string }> = ({ code, title }) => {
  return (
    <div className="p-5">
      {title && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>}
      <pre className="text-[11px] bg-slate-50/50 border border-slate-100 rounded-2xl p-4 overflow-auto max-h-[250px] whitespace-pre-wrap font-mono text-slate-600 leading-relaxed shadow-inner">
        {code?.trim() || 'Add content or system notes in edit mode.'}
      </pre>
    </div>
  );
};
