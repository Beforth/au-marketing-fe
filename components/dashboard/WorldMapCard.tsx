import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { marketingAPI, WorldMapResponse } from '../../lib/marketing-api';
import { cn } from '../../lib/utils';
import { CardShell } from './ListCard';
import type { MapMetric } from './WorldMapPanel';

// The map's country shapes are a big chunk of data: only the dashboards that show this card download it.
const WorldMapPanel = React.lazy(() => import('./WorldMapPanel'));

const METRICS: { value: MapMetric; label: string }[] = [
  { value: 'leads', label: 'Leads' },
  { value: 'won', label: 'Won value' },
  { value: 'pipeline', label: 'Open pipeline' },
];

const Pills: React.FC<{ options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; label: string }> = ({ options, value, onChange, label }) => (
  <div className="inline-flex rounded-full bg-slate-100 p-0.5" role="tablist" aria-label={label}>
    {options.map((o) => (
      <button
        key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
        className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors', value === o.value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
      >{o.label}</button>
    ))}
  </div>
);

/**
 * "Leads around the world" — domain heads and super admins only (the API refuses everyone else, and a 403 simply
 * hides the card). Domestic leads count as India; for an Export domain each region is a country.
 */
export const WorldMapCard: React.FC = () => {
  const [data, setData] = useState<WorldMapResponse | null>(null);
  const [hidden, setHidden] = useState(false);
  const [failed, setFailed] = useState(false);
  const [domain, setDomain] = useState('all');
  const [metric, setMetric] = useState<MapMetric>('leads');

  useEffect(() => {
    let cancelled = false;
    marketingAPI.getWorldMap()
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e: { status?: number }) => { if (!cancelled) (e?.status === 403 ? setHidden(true) : setFailed(true)); });
    return () => { cancelled = true; };
  }, []);

  const domains = useMemo(() => {
    const seen = new Map<number, string>();
    (data?.rows ?? []).forEach((r) => seen.set(r.domain_id, r.domain_name));
    return [...seen].map(([id, name]) => ({ value: String(id), label: name }));
  }, [data]);
  const rows = useMemo(() => (data?.rows ?? []).filter((r) => domain === 'all' || String(r.domain_id) === domain), [data, domain]);

  if (hidden) return null;
  return (
    <CardShell
      title="Leads around the world"
      subtitle={`Darker = more · hover a country for its leads · Domestic counts as India${data && data.no_region_count > 0 ? ` · ${data.no_region_count} lead${data.no_region_count === 1 ? ' has' : 's have'} no region` : ''}`}
      headerExtra={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {domains.length > 1 && <Pills label="Domain" value={domain} onChange={setDomain} options={[{ value: 'all', label: 'All' }, ...domains]} />}
          <Pills label="Measure" value={metric} onChange={(v) => setMetric(v as MapMetric)} options={METRICS} />
        </div>
      }
      bodyClassName="p-4"
    >
      {failed ? (
        <p className="py-10 text-center text-sm text-rose-500">Could not load the map.</p>
      ) : !data ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading the map…</p>
      ) : data.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-400"><Globe2 size={22} /><p className="text-sm">No leads with a region yet.</p></div>
      ) : (
        <Suspense fallback={<p className="py-10 text-center text-sm text-slate-400">Loading the map…</p>}>
          <WorldMapPanel rows={rows} metric={metric} />
        </Suspense>
      )}
    </CardShell>
  );
};
