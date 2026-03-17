
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CHART_DATA } from '../../constants';

const chartColors = {
  target: '#f1f5f9', // slate-100
  achieved: '#6366f1', // indigo-500
  won: '#10b981', // emerald-500
  lost: '#f43f5e', // rose-500
  total: '#94a3b8', // slate-400
  hot: '#f59e0b', // amber-500
  default: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'],
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/40 backdrop-blur-md border border-white/20 p-2 rounded-xl shadow-sm min-w-0 pointer-events-none">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-[10px] text-slate-500 font-bold capitalize">{entry.name || entry.dataKey}</span>
            </div>
            <span className="text-[10px] font-black text-slate-800">
              {typeof entry.value === 'number' && entry.value < 1000 && entry.value % 1 !== 0 
                ? entry.value.toFixed(2) 
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
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
    { name: 'Target', value: target / 1_00_000, fill: chartColors.target },
    { name: 'Achieved', value: achieved / 1_00_000, fill: chartColors.achieved },
  ];
  return (
    <div className="h-[220px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
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
    { name: 'Won', value: won, fill: chartColors.won },
    { name: 'Lost', value: lost, fill: chartColors.lost },
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
      fill: chartColors.default[i % chartColors.default.length] 
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
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }} barGap={8}>
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
          <Bar dataKey="total" name="Total" fill={chartColors.total} radius={[4, 4, 0, 0]} barSize={22} />
          <Bar dataKey="won" name="Won" fill={chartColors.won} radius={[4, 4, 0, 0]} barSize={22} />
          <Bar dataKey="lost" name="Lost" fill={chartColors.lost} radius={[4, 4, 0, 0]} barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/** Inquiries vs Quotations (Clean Horizontal Bar) */
export const InquiriesQuotationsBarChart: React.FC<{ inquiries: number; quotations: number }> = ({ inquiries, quotations }) => {
  const data = [
    { name: 'Inquiries', count: inquiries, fill: chartColors.total },
    { name: 'Quotations', count: quotations, fill: chartColors.achieved },
  ];
  return (
    <div className="h-[220px] w-full pt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }} barSize={36} barGap={12}>
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
        <AreaChart data={CHART_DATA} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
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
        <BarChart data={CHART_DATA} margin={{ top: 10, right: 20, left: -15, bottom: 0 }} barGap={8}>
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
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#64748b', paddingBottom: '20px' }}
          />
          <Bar dataKey="target" name="Target" fill="#f1f5f9" radius={[4, 4, 0, 0]} barSize={18} />
          <Bar dataKey="revenue" name="Achieved" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={18} animationDuration={2000} />
        </BarChart>
      </ResponsiveContainer>
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
