import React from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card } from '../ui/Card';
import { colorForLabel } from './chartTokens';
import type { DashboardStatusCount } from '../../lib/marketing-api';

interface LeadStatusChartProps {
  data: DashboardStatusCount[] | null | undefined;
  title?: string;
}

export const LeadStatusChart: React.FC<LeadStatusChartProps> = ({ data, title = 'Leads by Status' }) => {
  const chartData = (data || [])
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ ...d, color: d.color || colorForLabel(d.status) }));
  const rowHeight = 34;

  const options: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: chartData.map((d) => d.color),
    plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4, borderRadiusApplication: 'end', distributed: true } },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      offsetX: 6,
      style: { fontSize: '12px', fontWeight: 600, colors: ['#52514e'] },
      background: { enabled: false },
      formatter: (val: number) => String(val),
    },
    legend: { show: false },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 0, yaxis: { lines: { show: false } } },
    xaxis: {
      categories: chartData.map((d) => d.status),
      axisBorder: { color: '#e2e8f0' },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px', colors: '#64748b' } },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#64748b' } } },
    tooltip: { enabled: true },
  };

  const series = [{ name: 'Leads', data: chartData.map((d) => d.count) }];

  return (
    <Card title={title} description="All leads in your scope" contentClassName="p-4">
      {chartData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-sm text-slate-400">No leads yet</div>
      ) : (
        <div className="h-[320px] overflow-y-auto">
          <div style={{ height: Math.max(320, chartData.length * rowHeight + 40) }}>
            <ReactApexChart options={options} series={series} type="bar" height="100%" />
          </div>
        </div>
      )}
    </Card>
  );
};
