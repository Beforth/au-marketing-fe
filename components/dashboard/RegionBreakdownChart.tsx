import React from 'react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Card } from '../ui/Card';
import type { RegionBreakdownItem } from '../../lib/marketing-api';

// Won/Lost are a status pairing (good/critical), not generic categorical identity —
// use the fixed status tokens, distinct from the categorical palette by design.
const STATUS_GOOD = '#0ca30c';
const STATUS_CRITICAL = '#d03b3b';

interface RegionBreakdownChartProps {
  regions: RegionBreakdownItem[] | null | undefined;
}

export const RegionBreakdownChart: React.FC<RegionBreakdownChartProps> = ({ regions }) => {
  const data = regions || [];

  const options: ApexOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, fontFamily: 'inherit' },
    colors: [STATUS_GOOD, STATUS_CRITICAL],
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['#ffffff'] },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 0, xaxis: { lines: { show: false } } },
    xaxis: {
      categories: data.map((r) => r.region_name),
      axisBorder: { color: '#e2e8f0' },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px', colors: '#64748b' } },
    },
    yaxis: { labels: { style: { fontSize: '12px', colors: '#64748b' } }, forceNiceScale: true },
    legend: { position: 'bottom', fontSize: '12px', labels: { colors: '#475569' }, markers: { size: 6 } },
    tooltip: { shared: true, intersect: false },
  };

  const series = [
    { name: 'Won', data: data.map((r) => r.won_count) },
    { name: 'Lost', data: data.map((r) => r.lost_count) },
  ];

  return (
    <Card title="Leads by Region" description="Domain-wide breakdown" contentClassName="p-4">
      {data.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-sm text-slate-400">No region data yet</div>
      ) : (
        <div className="h-[320px]">
          <ReactApexChart options={options} series={series} type="bar" height="100%" />
        </div>
      )}
    </Card>
  );
};
