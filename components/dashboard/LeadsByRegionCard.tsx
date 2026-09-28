import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { marketingAPI, LeadsByRegionResponse } from '../../lib/marketing-api';
import { PERIOD_OPTIONS, PeriodKey, periodLabel, periodRange } from '../../lib/period-ranges';
import { formatINRShort } from '../../lib/region-report';

/**
 * Dashboard "Leads by Region": per region, leads, quotations sent (count + ₹ at latest revision,
 * counted in the period first sent) and won leads (count + Won amount, by Won date). Same numbers as
 * Reports → Leads by Region (one API: /api/leads-by-region/). Rows open that page for the region.
 */
export const LeadsByRegionCard: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodKey>('quarter');
  const [data, setData] = useState<LeadsByRegionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [period]);

  const open = (regionId?: number | null) => {
    const qp = new URLSearchParams({ period });
    if (regionId != null) qp.set('region_id', String(regionId));
    navigate(`/reports/leads-by-region?${qp.toString()}`);
  };

  const th = 'px-3 py-2 text-right font-semibold';
  const td = 'px-3 py-2 text-right tabular-nums';

  return (
    <Card
      title="Leads by Region"
      description={`${periodLabel(period)} · quotations at latest price, counted when first sent · won by Won date`}
      noPadding
      headerAction={
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Period"
        >
          {PERIOD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      }
    >
      {loading ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading…</div>
      ) : error ? (
        <div className="h-40 flex items-center justify-center text-sm text-rose-500">{error}</div>
      ) : !data || data.regions.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">No leads in this period</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-semibold">Region</th>
                <th className={th}>Leads</th>
                <th className={th}>Quotes sent</th>
                <th className={th}>Quote value</th>
                <th className={th}>Won</th>
                <th className={th}>Won value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.regions.map((r) => (
                <tr
                  key={r.region_id ?? 'none'}
                  onClick={() => open(r.region_id)}
                  className="cursor-pointer hover:bg-slate-50/80"
                  title="Open these leads"
                >
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-800">{r.region_name}</span>
                    {r.domain_name && <span className="block text-[10px] text-slate-400">{r.domain_name}</span>}
                  </td>
                  <td className={td}>{r.lead_count}</td>
                  <td className={td}>{r.quotation_count}</td>
                  <td className={`${td} text-blue-700 font-semibold`}>{formatINRShort(r.quotation_value)}</td>
                  <td className={td}>{r.won_count}</td>
                  <td className={`${td} text-emerald-700 font-semibold`}>{formatINRShort(r.won_value)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                <td className="px-3 py-2">Total</td>
                <td className={td}>{data.totals.lead_count}</td>
                <td className={td}>{data.totals.quotation_count}</td>
                <td className={`${td} text-blue-700`}>{formatINRShort(data.totals.quotation_value)}</td>
                <td className={td}>{data.totals.won_count}</td>
                <td className={`${td} text-emerald-700`}>{formatINRShort(data.totals.won_value)}</td>
              </tr>
            </tfoot>
          </table>
          <button
            type="button"
            onClick={() => open()}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 border-t border-slate-100"
          >
            See all leads by region <ArrowRight size={12} />
          </button>
        </div>
      )}
    </Card>
  );
};
