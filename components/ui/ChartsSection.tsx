
import React from 'react';
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
import { CHART_DATA } from '../../constants';

const chartColors = {
  target: '#e2e8f0',
  achieved: '#4f46e5',
  won: '#059669',
  lost: '#e11d48',
  default: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-slate-600 font-medium capitalize">{entry.dataKey}</span>
            </div>
            <span className="text-xs font-bold text-slate-900">${entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/** Target vs Achieved (₹ lacs) for current month */
export const TargetAchievedBarChart: React.FC<{
  target: number;
  achieved: number;
  year: number;
  month: number;
}> = ({ target, achieved, year, month }) => {
  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  const data = [
    { name: 'Target', value: target / 1_00_000, fill: chartColors.target },
    { name: 'Achieved', value: achieved / 1_00_000, fill: chartColors.achieved },
  ];
  return (
    <div className="h-[220px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 50, bottom: 0 }}>
          <XAxis type="number" unit=" lacs" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={50} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: number) => [`₹${v.toFixed(2)} lacs`, '']} labelFormatter={() => monthLabel} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28} isAnimationActive>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Won vs Lost leads this month (pie) */
export const WonLostPieChart: React.FC<{ won: number; lost: number }> = ({ won, lost }) => {
  const data = [
    { name: 'Won', value: won, fill: chartColors.won },
    { name: 'Lost', value: lost, fill: chartColors.lost },
  ].filter((d) => d.value > 0);
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No won/lost data this month</div>
    );
  }
  return (
    <div className="h-[220px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={2}
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [v, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Leads by status (from sample or scope). Label + count */
export const LeadStatusPieChart: React.FC<{ data: { label: string; count: number }[] }> = ({ data: raw }) => {
  const data = raw
    .filter((d) => d.count > 0)
    .map((d, i) => ({ name: d.label.length > 18 ? d.label.slice(0, 17) + '…' : d.label, value: d.count, fill: chartColors.default[i % chartColors.default.length] }));
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No status data</div>
    );
  }
  return (
    <div className="h-[220px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={1}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => [v, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Region-wise total leads (bar chart) for head dashboard */
export const RegionBreakdownBarChart: React.FC<{
  data: { region_name: string; total_leads: number; won_count: number; lost_count: number }[];
}> = ({ data }) => {
  const chartData = data.map((r) => ({
    name: r.region_name.length > 12 ? r.region_name.slice(0, 11) + '…' : r.region_name,
    total: r.total_leads,
    won: r.won_count,
    lost: r.lost_count,
  }));
  if (chartData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No region data</div>
    );
  }
  return (
    <div className="h-[240px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" name="Total leads" fill="#64748b" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="won" name="Won" fill={chartColors.won} radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="lost" name="Lost" fill={chartColors.lost} radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Inquiries vs Quotations (simple bar) */
export const InquiriesQuotationsBarChart: React.FC<{ inquiries: number; quotations: number }> = ({ inquiries, quotations }) => {
  const data = [
    { name: 'Inquiries', count: inquiries, fill: '#94a3b8' },
    { name: 'Quotations sent', count: quotations, fill: '#4f46e5' },
  ];
  return (
    <div className="h-[220px] w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: number) => [v, '']} />
          <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueChart: React.FC = () => {
  return (
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
            strokeWidth={2.5}
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
    <div className="h-[300px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={12} />
          <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={12} animationDuration={2000} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Simple heatmap widget: matrix of cells (sample data or pass data via props). */
export const HeatmapWidget: React.FC<{
  rows?: string[];
  columns?: string[];
  data?: number[][];
  title?: string;
}> = ({ rows = ['R1', 'R2', 'R3', 'R4'], columns = ['C1', 'C2', 'C3', 'C4', 'C5'], data, title }) => {
  const values = data ?? [
    [10, 20, 30, 40, 50],
    [15, 25, 35, 45, 55],
    [5, 15, 25, 35, 45],
    [20, 30, 40, 50, 60],
  ];
  const flat = values.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat) || 1;
  const intensity = (v: number) => Math.round(((v - min) / (max - min)) * 100);
  return (
    <div className="p-4">
      {title && <p className="text-xs font-semibold text-slate-500 uppercase mb-3">{title}</p>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1.5 text-slate-500 font-medium text-left" />
              {columns.slice(0, values[0]?.length ?? 0).map((c, i) => (
                <th key={i} className="p-1.5 text-slate-500 font-medium text-center">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((row, ri) => (
              <tr key={ri}>
                <td className="p-1.5 text-slate-600 font-medium">{rows[ri] ?? `R${ri + 1}`}</td>
                {row.map((v, ci) => (
                  <td key={ci} className="p-1">
                    <div
                      className="h-8 min-w-[2rem] rounded flex items-center justify-center text-slate-800 font-medium"
                      style={{
                        backgroundColor: `rgba(79, 70, 229, ${0.15 + (intensity(v) / 100) * 0.85})`,
                      }}
                    >
                      {v}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** Custom code / text block widget (display only; code stored in widget config). */
export const CustomCodeWidget: React.FC<{ code?: string; title?: string }> = ({ code, title }) => {
  return (
    <div className="p-4">
      {title && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{title}</p>}
      <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-[200px] whitespace-pre-wrap font-mono text-slate-700">
        {code?.trim() || 'Add code or notes in edit mode.'}
      </pre>
    </div>
  );
}
