import React from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card } from '../ui/Card';
import { CATEGORICAL } from './chartTokens';
import type { DashboardLeadSource } from '../../lib/marketing-api';

interface LeadSourceChartProps {
  data: DashboardLeadSource[] | null | undefined;
}

export const LeadSourceChart: React.FC<LeadSourceChartProps> = ({ data }) => {
  const chartData = (data || []).filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);

  const options: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: CATEGORICAL,
    plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4, borderRadiusApplication: 'end', distributed: true } },
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
      categories: chartData.map((d) => d.source),
      axisBorder: { color: '#e2e8f0' },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px', colors: '#64748b' } },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#64748b' } } },
    tooltip: { enabled: true },
  };

  const series = [{ name: 'Leads', data: chartData.map((d) => d.count) }];

  return (
    <Card title="Lead Sources" description="Where leads in your scope are coming from" contentClassName="p-4">
      {chartData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-sm text-slate-400">No source data yet</div>
      ) : (
        <div className="h-[320px]">
          <ReactApexChart options={options} series={series} type="bar" height="100%" />
        </div>
      )}
    </Card>
  );
};
