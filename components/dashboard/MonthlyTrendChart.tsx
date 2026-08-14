import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { CHART_CHROME, axisTick, tooltipStyle } from './chartTokens';
import type { DashboardMonthPoint } from '../../lib/marketing-api';

const BRAND_BLUE = '#2563eb';

const formatCurrency = (value: number) => {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)} K`;
  return `₹${value}`;
};

interface MonthlyTrendChartProps {
  data: DashboardMonthPoint[] | null | undefined;
  title?: string;
  description?: string;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data, title = 'Won Value — Last 6 Months', description }) => {
  return (
    <Card title={title} description={description}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke={CHART_CHROME.gridline} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: CHART_CHROME.mutedText }} axisLine={{ stroke: CHART_CHROME.baseline }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} tickFormatter={formatCurrency} width={56} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: CHART_CHROME.baseline, strokeWidth: 1 }}
              formatter={(value: number) => [formatCurrency(value), 'Won value']}
            />
            <Area type="monotone" dataKey="won_value" stroke={BRAND_BLUE} strokeWidth={2} fill={BRAND_BLUE} fillOpacity={0.1} dot={{ r: 4, fill: BRAND_BLUE, stroke: '#ffffff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
