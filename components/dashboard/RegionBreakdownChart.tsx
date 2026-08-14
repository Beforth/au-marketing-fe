import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { CHART_CHROME, axisTick, tooltipStyle } from './chartTokens';
import type { RegionBreakdownItem } from '../../lib/marketing-api';

// Won/Lost are a status pairing (good/critical), not generic categorical identity —
// use the fixed status tokens, distinct from the categorical palette by design.
const STATUS_GOOD = '#0ca30c';
const STATUS_CRITICAL = '#d03b3b';

interface RegionBreakdownChartProps {
  regions: RegionBreakdownItem[] | null | undefined;
}

export const RegionBreakdownChart: React.FC<RegionBreakdownChartProps> = ({ regions }) => {
  const data = (regions || []).map((r) => ({ name: r.region_name, Won: r.won_count, Lost: r.lost_count }));

  return (
    <Card title="Leads by Region" description="Domain-wide breakdown">
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">No region data yet</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke={CHART_CHROME.gridline} />
              <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: CHART_CHROME.baseline }} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: CHART_CHROME.secondaryText }} />
              <Bar dataKey="Won" stackId="a" fill={STATUS_GOOD} radius={[0, 0, 0, 0]} maxBarSize={24} stroke="#ffffff" strokeWidth={2} />
              <Bar dataKey="Lost" stackId="a" fill={STATUS_CRITICAL} radius={[4, 4, 0, 0]} maxBarSize={24} stroke="#ffffff" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
