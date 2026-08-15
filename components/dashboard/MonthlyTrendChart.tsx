import React from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexAxisChartSeries, ApexOptions } from 'apexcharts';
import { Card } from '../ui/Card';
import type { DashboardMonthPoint } from '../../lib/marketing-api';

const BRAND_BLUE = '#2563eb';
const TARGET_AMBER = '#f59e0b';

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

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data, title = 'Won Value vs Target — Last 6 Months', description }) => {
  const points = data || [];
  const hasTarget = points.some((p) => (p.target_value ?? 0) > 0);

  const options: ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit', animations: { enabled: true } },
    colors: hasTarget ? [BRAND_BLUE, TARGET_AMBER] : [BRAND_BLUE],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: hasTarget ? [2, 2] : 2, dashArray: hasTarget ? [0, 6] : undefined },
    fill: {
      type: hasTarget ? ['gradient', 'solid'] : 'gradient',
      colors: hasTarget ? [BRAND_BLUE, TARGET_AMBER] : undefined,
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] },
    },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 0, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } }, padding: { left: 8, right: 8 } },
    xaxis: {
      categories: points.map((p) => p.label),
      axisBorder: { color: '#e2e8f0' },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px', colors: '#64748b' } },
    },
    yaxis: {
      labels: { formatter: (v: number) => formatCurrency(v), style: { fontSize: '12px', colors: '#64748b' } },
    },
    tooltip: {
      y: { formatter: (v: number) => formatCurrency(v) },
    },
    markers: {
      size: hasTarget ? [4, 3] : 4,
      colors: hasTarget ? [BRAND_BLUE, TARGET_AMBER] : [BRAND_BLUE],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 6 },
    },
    legend: {
      show: hasTarget,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontFamily: 'inherit',
      labels: { colors: '#64748b' },
      markers: { size: 6 },
    },
  };

  const series: ApexAxisChartSeries = [
    { name: 'Won value', data: points.map((p) => p.won_value) },
    ...(hasTarget
      ? [{ name: 'Target', type: 'line' as const, data: points.map((p) => { const t = p.target_value ?? 0; return t > 0 ? t : null; }) }]
      : []),
  ];

  return (
    <Card title={title} description={description} contentClassName="p-4">
      <div className="h-[320px]">
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">No data yet</div>
        ) : (
          <ReactApexChart options={options} series={series} type="area" height="100%" />
        )}
      </div>
    </Card>
  );
};
