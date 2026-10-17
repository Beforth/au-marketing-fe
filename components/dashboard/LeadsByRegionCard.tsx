import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { ArrowRight, MapPin, RotateCw } from 'lucide-react';
import { CARD_HEIGHT, CardSize } from './ListCard';
import { ChartSkeleton } from './Skeleton';
import { CATEGORICAL } from './chartTokens';
import { cn } from '../../lib/utils';
import { marketingAPI, LeadsByRegionResponse } from '../../lib/marketing-api';
import { PERIOD_OPTIONS, PeriodKey, periodLabel, periodRange } from '../../lib/period-ranges';
import { formatINRShort } from '../../lib/region-report';

// Leads = brand blue, Quotes sent = orange, Won = aqua (validated palette slots 1–3).
const SERIES_COLORS = [CATEGORICAL[0], CATEGORICAL[1], CATEGORICAL[2]];

const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Dashboard "Leads by Region": grouped bars of COUNTS per region — leads, quotations sent (each
 * counted once, in the period first sent) and won leads (by Won date). The ₹ quote value and ₹ won
 * value aren't bars (different scale) — they're in the tooltip, a per-region strip under the chart
 * and the totals line. Same API as Reports → Leads by Region (/api/leads-by-region/); clicking a
 * region's bars, name or value chip opens that page filtered to the region.
 */
export const LeadsByRegionCard: React.FC<{ size?: CardSize }> = ({ size = 'medium' }) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodKey>('quarter');
  const [data, setData] = useState<LeadsByRegionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null); // region index under the cursor — lights up its ₹ chip

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    marketingAPI
      .getLeadsByRegion({ ...periodRange(period), include_leads: false })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period, reloadKey]);

  const open = (regionId?: number | null) => {
    const qp = new URLSearchParams({ period });
    if (regionId != null) qp.set('region_id', String(regionId));
    navigate(`/reports/leads-by-region?${qp.toString()}`);
  };

  const regions = data?.regions ?? [];
  const series = [
    { name: 'Leads', data: regions.map((r) => r.lead_count) },
    { name: 'Quotes sent', data: regions.map((r) => r.quotation_count) },
    { name: 'Won', data: regions.map((r) => r.won_count) },
  ];
  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      events: {
        // Clicking any bar of a region opens that region's leads.
        dataPointSelection: (_e, _ctx, cfg) => cfg && open(regions[cfg.dataPointIndex]?.region_id),
        xAxisLabelClick: (_e, _ctx, cfg) => cfg && open(regions[cfg.labelIndex]?.region_id),
        mouseMove: (_e, _ctx, cfg) => { if (cfg && cfg.dataPointIndex >= 0) setHovered(cfg.dataPointIndex); },
        mouseLeave: () => setHovered(null),
      },
    },
    colors: SERIES_COLORS,
    plotOptions: { bar: { columnWidth: regions.length <= 2 ? '28%' : regions.length <= 4 ? '42%' : regions.length <= 6 ? '55%' : '70%', borderRadius: 4, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 0, xaxis: { lines: { show: false } } },
    xaxis: {
      categories: regions.map((r) => r.region_name),
      axisBorder: { color: '#e2e8f0' },
      axisTicks: { show: false },
      labels: { style: { fontSize: '12px', colors: '#64748b' }, trim: true },
    },
    // Headroom above the tallest bar: the pinned tooltip sits in this empty space instead of on top of the bars.
    yaxis: { max: Math.max(4, Math.ceil(Math.max(1, ...series.flatMap((s) => s.data)) * 1.5)), labels: { style: { fontSize: '11px', colors: '#64748b' }, formatter: (v: number) => String(Math.round(v)) }, forceNiceScale: true },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', labels: { colors: '#475569' }, markers: { size: 6 } },
    // Compact tooltip pinned top-left (in the headroom above the bars) so it never covers a bar.
    tooltip: {
      shared: true,
      intersect: false,
      fixed: { enabled: true, position: 'topLeft', offsetX: 8, offsetY: 4 },
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const r = regions[dataPointIndex];
        if (!r) return '';
        const row = (color: string, label: string, text: string) =>
          `<div style="display:flex;align-items:center;gap:6px;white-space:nowrap"><i style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></i><span style="color:#64748b">${label}</span><b style="margin-left:auto;padding-left:10px;color:#0f172a">${text}</b></div>`;
        return `<div style="padding:6px 10px;font-size:11px;line-height:1.5;min-width:150px">`
          + `<div style="font-weight:600;color:#334155;margin-bottom:2px">${escapeHtml(r.region_name)}${r.domain_name ? ` · ${escapeHtml(r.domain_name)}` : ''}</div>`
          + row(SERIES_COLORS[0], 'Leads', String(r.lead_count))
          + row(SERIES_COLORS[1], 'Quotes', `${r.quotation_count} · ${formatINRShort(r.quotation_value)}`)
          + row(SERIES_COLORS[2], 'Won', `${r.won_count} · ${formatINRShort(r.won_value)}`)
          + `</div>`;
      },
    },
    states: { active: { filter: { type: 'none' } } },
  };

  return (
    <div className={cn('flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5', CARD_HEIGHT[size])}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900 truncate">Leads by Region</h3>
          <p className="text-[11px] text-slate-400 truncate">
            {periodLabel(period)} · bars: counts · ₹ quotes at latest price, counted when first sent · won by Won date
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Period"
        >
          {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-rose-500">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              <RotateCw size={12} /> Try again
            </button>
          </div>
        ) : regions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400"><MapPin size={20} /></div>
            <p className="text-sm text-slate-500">No leads in this period</p>
            <button type="button" onClick={() => open()} className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
              Open Leads by Region report <ArrowRight size={12} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 px-3 pt-2 cursor-pointer" data-testid="leads-by-region-chart">
              <ReactApexChart options={options} series={series} type="bar" height="100%" />
            </div>
            {/* ₹ values per region (not drawn as bars — different scale from the counts) */}
            <div className="shrink-0 flex gap-2 overflow-x-auto px-3 pb-2">
              {regions.map((r, i) => (
                <button
                  key={r.region_id ?? 'none'}
                  type="button"
                  onClick={() => open(r.region_id)}
                  className={cn(
                    'shrink-0 min-w-[9rem] flex-1 rounded-lg border px-2.5 py-1.5 text-left hover:border-blue-200 hover:bg-blue-50/40 transition-colors',
                    hovered === i ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-100 bg-slate-50/60'
                  )}
                  title={`Open ${r.region_name}'s leads`}
                >
                  <p className="text-[11px] font-semibold text-slate-700 truncate">{r.region_name}</p>
                  <p className="text-[11px] tabular-nums text-slate-500">
                    Quote <b className="text-orange-600">{formatINRShort(r.quotation_value)}</b> · Won <b className="text-emerald-700">{formatINRShort(r.won_value)}</b>
                  </p>
                </button>
              ))}
            </div>
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
              <span className="tabular-nums">
                Total: <b className="text-slate-900">{data!.totals.lead_count}</b> leads ·{' '}
                <b className="text-slate-900">{data!.totals.quotation_count}</b> quotes (<b className="text-orange-600">{formatINRShort(data!.totals.quotation_value)}</b>) ·{' '}
                <b className="text-slate-900">{data!.totals.won_count}</b> won (<b className="text-emerald-700">{formatINRShort(data!.totals.won_value)}</b>)
              </span>
              <button
                type="button"
                onClick={() => open()}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
              >
                See all leads by region <ArrowRight size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
