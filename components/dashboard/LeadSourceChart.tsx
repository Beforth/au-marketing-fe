import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';
import { CHART_CHROME, axisTick, tooltipStyle, CATEGORICAL } from './chartTokens';
import type { DashboardLeadSource } from '../../lib/marketing-api';

interface LeadSourceChartProps {
  data: DashboardLeadSource[] | null | undefined;
}

export const LeadSourceChart: React.FC<LeadSourceChartProps> = ({ data }) => {
  const chartData = (data || []).filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
  const rowHeight = 34;

  return (
    <Card title="Lead Sources" description="Where leads in your scope are coming from">
      {chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-slate-400">No source data yet</div>
      ) : (
        <div style={{ height: Math.max(160, chartData.length * rowHeight + 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 4 }} barCategoryGap={6}>
              <CartesianGrid strokeDasharray="0" horizontal={false} stroke={CHART_CHROME.gridline} />
              <XAxis type="number" tick={axisTick} axisLine={{ stroke: CHART_CHROME.baseline }} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="source" tick={axisTick} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {chartData.map((entry, i) => (
                  <Cell key={entry.source} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
                <LabelList dataKey="count" position="right" style={{ fill: CHART_CHROME.secondaryText, fontSize: 12, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
