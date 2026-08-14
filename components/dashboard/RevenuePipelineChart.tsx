import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card } from '../ui/Card';
import { CHART_CHROME, axisTick, tooltipStyle, SEQUENTIAL_BLUE_ORDINAL } from './chartTokens';
import type { DashboardRevenuePipeline } from '../../lib/marketing-api';

const formatCurrency = (value: number) => {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)} K`;
  return `₹${value}`;
};

interface RevenuePipelineChartProps {
  pipeline: DashboardRevenuePipeline | null | undefined;
}

export const RevenuePipelineChart: React.FC<RevenuePipelineChartProps> = ({ pipeline }) => {
  // A funnel, not nominal categories — Pipeline ⊇ Committed ⊇ Achieved — so one hue,
  // light (widest stage) to dark (narrowest, most complete), not unrelated colors.
  const data = [
    { name: 'Pipeline', value: pipeline?.pipeline ?? 0, color: SEQUENTIAL_BLUE_ORDINAL[0] },
    { name: 'Committed', value: pipeline?.committed ?? 0, color: SEQUENTIAL_BLUE_ORDINAL[1] },
    { name: 'Achieved', value: pipeline?.achieved ?? 0, color: SEQUENTIAL_BLUE_ORDINAL[2] },
  ];

  return (
    <Card title="Revenue Pipeline" description="Widest to narrowest: everything active, what's committed, what's actually won">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="0" horizontal={false} stroke={CHART_CHROME.gridline} />
            <XAxis type="number" tick={axisTick} axisLine={{ stroke: CHART_CHROME.baseline }} tickLine={false} tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: CHART_CHROME.secondaryText }} axisLine={false} tickLine={false} width={80} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
              <LabelList dataKey="value" position="right" formatter={(v: number) => formatCurrency(v)} style={{ fill: CHART_CHROME.secondaryText, fontSize: 12, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
