import React from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card } from '../ui/Card';
import { SEQUENTIAL_BLUE_ORDINAL } from './chartTokens';
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

  const options: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: data.map((d) => d.color),
    plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end', distributed: true } },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      offsetX: 6,
      style: { fontSize: '12px', fontWeight: 600, colors: ['#52514e'] },
      background: { enabled: false },
      formatter: (val: number) => formatCurrency(Number(val)),
    },
    legend: { show: false },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 0, yaxis: { lines: { show: false } } },
    xaxis: {
      categories: data.map((d) => d.name),
      axisBorder: { color: '#e2e8f0' },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px', colors: '#64748b' }, formatter: (v: string) => formatCurrency(Number(v)) },
    },
    yaxis: { labels: { style: { fontSize: '12px', colors: '#475569' } } },
    tooltip: { y: { formatter: (v: number) => formatCurrency(v) } },
  };

  const series = [{ name: 'Value', data: data.map((d) => d.value) }];

  return (
    <Card title="Revenue Pipeline" description="Widest to narrowest: everything active, what's committed, what's actually won" contentClassName="p-4">
      <div className="h-[320px]">
        <ReactApexChart options={options} series={series} type="bar" height="100%" />
      </div>
    </Card>
  );
};
