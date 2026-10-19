import React, { useMemo } from 'react';
import WorldMap, { worldCountryNames } from './WorldMap';
import { formatINRShort } from '../../lib/region-report';
import type { WorldMapRow } from '../../lib/marketing-api';

export type MapMetric = 'leads' | 'won' | 'pipeline';

/** Spellings people type for a region/country → the map's own country name. Anything else must match the map's list. */
const ALIASES: Record<string, string> = {
  usa: 'United States of America', us: 'United States of America', 'u.s.a.': 'United States of America', 'u.s.': 'United States of America',
  america: 'United States of America', 'united states': 'United States of America',
  uk: 'United Kingdom', 'u.k.': 'United Kingdom', england: 'United Kingdom', 'great britain': 'United Kingdom', britain: 'United Kingdom',
  uae: 'United Arab Emirates', 'u.a.e.': 'United Arab Emirates', dubai: 'United Arab Emirates', 'abu dhabi': 'United Arab Emirates',
  holland: 'Netherlands', 'the netherlands': 'Netherlands', 'czech republic': 'Czechia', 'ivory coast': "Côte d'Ivoire",
  'north macedonia': 'Macedonia', 'bosnia and herzegovina': 'Bosnia and Herz.', 'democratic republic of the congo': 'Dem. Rep. Congo',
  drc: 'Dem. Rep. Congo', 'republic of the congo': 'Congo', 'republic of korea': 'South Korea', korea: 'South Korea',
  'russian federation': 'Russia', burma: 'Myanmar', 'viet nam': 'Vietnam', turkiye: 'Turkey', 'türkiye': 'Turkey', 'east timor': 'Timor-Leste',
  'south sudan': 'S. Sudan', 'equatorial guinea': 'Eq. Guinea', 'swaziland': 'eSwatini', 'eswatini': 'eSwatini',
};

/** Which country on the map a region stands for: Domestic regions are all India; Export regions are named after countries. */
export function countryFor(row: Pick<WorldMapRow, 'is_export' | 'region_name'>, names: string[]): string | null {
  if (!row.is_export) return 'India';
  const key = row.region_name.trim().toLowerCase();
  if (ALIASES[key] && names.includes(ALIASES[key])) return ALIASES[key];
  return names.find((n) => n.toLowerCase() === key) ?? null;
}

/** Sum the rows per country for the chosen metric. `unplaced` = regions whose name isn't a country on the map. */
export function aggregateByCountry(rows: WorldMapRow[], metric: MapMetric, names: string[]) {
  const value = (r: WorldMapRow) => (metric === 'leads' ? r.lead_count : metric === 'won' ? r.won_value : r.pipeline_value);
  const byCountry = new Map<string, { id: string; value: number; leads: number; open: number; won: number }>();
  const unplaced: { name: string; leads: number }[] = [];
  for (const r of rows) {
    const c = countryFor(r, names);
    if (!c) { unplaced.push({ name: r.region_name, leads: r.lead_count }); continue; }
    const cur = byCountry.get(c) ?? { id: c, value: 0, leads: 0, open: 0, won: 0 };
    cur.value += value(r); cur.leads += r.lead_count; cur.open += r.open_count; cur.won += r.won_count;
    byCountry.set(c, cur);
  }
  return { countries: [...byCountry.values()].filter((c) => c.value > 0), unplaced };
}

/** The lazy-loaded half of the widget: the map itself (its country shapes are a big chunk of data). */
const WorldMapPanel: React.FC<{ rows: WorldMapRow[]; metric: MapMetric }> = ({ rows, metric }) => {
  const names = useMemo(() => worldCountryNames(), []);
  const { countries, unplaced } = useMemo(() => aggregateByCountry(rows, metric, names), [rows, metric, names]);
  const fmt = (n: number) => (metric === 'leads' ? n.toLocaleString('en-IN') : formatINRShort(n));
  const label = metric === 'leads' ? 'leads' : metric === 'won' ? 'won' : 'pipeline';
  const data = countries.map((c) => ({
    id: c.id,
    value: c.value,
    label: `${c.id} — ${c.leads} lead${c.leads === 1 ? '' : 's'} · ${c.open} open · ${c.won} won`,
  }));

  return (
    <>
      {data.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-400">No {label} to show for this selection.</p>
      ) : (
        <div className="mx-auto w-full max-w-5xl">
          <WorldMap data={data} projection="flat" marker="bar" format={fmt} color="#2563eb" label={`Leads by country (${label})`} />
        </div>
      )}
      {unplaced.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-400">
          Not on the map (region name is not a country): {unplaced.map((u) => `${u.name} (${u.leads})`).join(', ')}
        </p>
      )}
    </>
  );
};

export default WorldMapPanel;
