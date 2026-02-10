
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
  Bar
} from 'recharts';
import { CHART_DATA } from '../../constants';

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
