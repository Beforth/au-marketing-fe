import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import {
  marketingAPI,
  ReportScopeResponse,
  ExpectedOrderReportItem,
  ODPlanReportItem,
  MISEmployeeResponse,
  MISTeamRow,
  MISPlanStatus,
  MISLeadItem,
} from '../lib/marketing-api';
import { formatINRShort } from '../lib/region-report';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { getCached, setCache } from '../lib/api-cache';
import { downloadCsv } from '../lib/csv-export';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Users,
  X,
  Download,
  Search,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

const SCOPE_CACHE_KEY = 'reports_scope';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const keyOf = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const ENTRY_STYLE: Record<string, { label: string; cls: string }> = {
  visit: { label: 'Visit', cls: 'bg-blue-100 text-blue-700' },
  travel: { label: 'Travel', cls: 'bg-amber-100 text-amber-700' },
  return_home: { label: 'Return', cls: 'bg-slate-200 text-slate-600' },
};

const Spinner: React.FC<{ label: string }> = ({ label }) => (
  <div className="py-10 text-center">
    <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
    <p className="mt-3 text-slate-500 text-sm font-medium">{label}</p>
  </div>
);

/** Plain page section: a heading, a thin rule above it, no box. */
const Section: React.FC<{ title: string; description?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, description, action, className = '', children }) => (
  <section className={`pt-5 mt-6 border-t border-slate-200 ${className}`}>
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: string }> = ({ label, value, sub, accent = 'text-slate-900' }) => (
  <div className="px-5 first:pl-0 py-1">
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    <div className={`text-2xl font-bold mt-0.5 ${accent}`}>{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </div>
);

const visitWhere = (e: ODPlanReportItem['entries'][number]) => e.where_place || e.organization_name || e.contact_name || '';

/** Every OD entry as a row: when, what, where / who (company and plant, contact), notes, planned or unplanned. */
const ODVisitTable: React.FC<{ plan: ODPlanReportItem | null }> = ({ plan }) => {
  const rows = [...(plan?.entries ?? [])].sort((a, b) => a.plan_date.localeCompare(b.plan_date));
  if (rows.length === 0) return null;
  const th = 'py-2 px-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-300 whitespace-nowrap';
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead><tr><th className={th}>Date</th><th className={th}>Type</th><th className={th}>Where / who</th><th className={th}>Notes</th><th className={th} /></tr></thead>
        <tbody>
          {rows.map((e) => {
            const cell = 'py-2 px-2 border-b border-slate-100 align-top';
            const day = new Date(`${e.plan_date.slice(0, 10)}T00:00:00`);
            const companyLine = [e.organization_name, e.plant_name].filter(Boolean).join(' · ');
            return (
              <tr key={e.id}>
                <td className={`${cell} whitespace-nowrap text-slate-700`}>{day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td className={`${cell} whitespace-nowrap`}><span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${(ENTRY_STYLE[e.entry_type] ?? ENTRY_STYLE.visit).cls}`}>{(ENTRY_STYLE[e.entry_type] ?? ENTRY_STYLE.visit).label}</span></td>
                <td className={cell}>
                  <div className="font-medium text-slate-800">{e.where_place || companyLine || e.contact_name || '—'}</div>
                  {e.where_place && companyLine && <div className="text-xs text-slate-500">{companyLine}</div>}
                  {!e.where_place && e.contact_name && companyLine && <div className="text-xs text-slate-500">Contact: {e.contact_name}</div>}
                  {e.where_place && e.contact_name && <div className="text-xs text-slate-500">Contact: {e.contact_name}</div>}
                  {e.travel_time && <div className="text-xs text-slate-500">{e.travel_time}{e.travel_type ? ` · ${e.travel_type}` : ''}</div>}
                </td>
                <td className={`${cell} text-xs text-slate-500 max-w-[220px]`}>{e.notes || ''}</td>
                <td className={`${cell} whitespace-nowrap`}>
                  {e.entry_type === 'visit' && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${e.is_unplanned ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{e.is_unplanned ? 'Unplanned' : 'Planned'}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Month grid with each planned day colour-coded by what is planned (visit / travel / return). */
const ODPlanCalendar: React.FC<{ plan: ODPlanReportItem | null; year: number; month: number }> = ({ plan, year, month }) => {
  const byDay = useMemo(() => {
    const map = new Map<string, ODPlanReportItem['entries']>();
    (plan?.entries ?? []).forEach((e) => {
      const k = e.plan_date.slice(0, 10);
      map.set(k, [...(map.get(k) ?? []), e]);
    });
    return map;
  }, [plan]);

  const first = new Date(year, month - 1, 1);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
        {WEEKDAYS.map((w) => <div key={w} className="text-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const entries = byDay.get(keyOf(year, month, d)) ?? [];
          const main = entries.find((e) => !e.is_unplanned) ?? entries[0];
          const onlyUnplanned = entries.length > 0 && entries.every((e) => e.is_unplanned);
          const style = main ? (onlyUnplanned ? { label: 'Unplanned', cls: 'bg-amber-100 text-amber-800' } : ENTRY_STYLE[main.entry_type] ?? ENTRY_STYLE.visit) : null;
          return (
            <div
              key={i}
              title={entries.map((e) => `${e.is_unplanned ? 'Unplanned visit' : ENTRY_STYLE[e.entry_type]?.label ?? e.entry_type}${visitWhere(e) ? ` — ${visitWhere(e)}` : ''}${e.contact_name ? ` (${e.contact_name})` : ''}`).join('\n')}
              className={`min-h-[52px] rounded-lg border p-1 text-[10px] leading-tight ${style ? `${style.cls} ${onlyUnplanned ? 'border-amber-400 border-dashed' : 'border-transparent'}` : 'border-slate-100 text-slate-300'}`}
            >
              <div className="font-bold text-xs">{d}</div>
              {main && <div className="truncate">{visitWhere(main) || style!.label}</div>}
              {entries.length > 1 && <div className="font-semibold">+{entries.length - 1} more</div>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
        {Object.entries(ENTRY_STYLE).map(([k, v]) => (
          <span key={k}><span className={`inline-block w-2.5 h-2.5 rounded mr-1 align-middle ${v.cls.split(' ')[0]}`} />{v.label}</span>
        ))}
        <span><span className="inline-block w-2.5 h-2.5 rounded mr-1 align-middle bg-amber-100 border border-dashed border-amber-400" />Unplanned visit</span>
      </div>
    </div>
  );
};

type LeadBucket = 'won' | 'lost' | 'expected' | 'carried';
const BUCKET: Record<LeadBucket, { label: string; badge: string; bar: string; border: string }> = {
  won: { label: 'Won', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', border: 'border-l-emerald-500' },
  lost: { label: 'Lost', badge: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500', border: 'border-l-rose-500' },
  expected: { label: 'Expected', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', border: 'border-l-amber-400' },
  carried: { label: 'Carried forward', badge: 'bg-slate-200 text-slate-600', bar: 'bg-slate-400', border: 'border-l-slate-300' },
};

/** One month's expected-order leads (merged if several reports exist), with a won/lost/expected progress bar. */
const ExpectedOrderBlock: React.FC<{ year: number; month: number; reports: ExpectedOrderReportItem[]; onOpenLead: (id: number) => void }> = ({ year, month, reports, onOpenLead }) => {
  const now = new Date();
  const isPast = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
  const leads = useMemo(() => {
    const seen = new Map<number, ExpectedOrderReportItem['leads'][number]>();
    reports.forEach((r) => r.leads.forEach((l) => seen.set(l.lead_id, l)));
    return [...seen.values()];
  }, [reports]);
  const bucketOf = (l: typeof leads[number]): LeadBucket =>
    l.lead_is_lost ? 'lost' : l.lead_is_final ? 'won' : isPast ? 'carried' : 'expected';
  const counts: Record<LeadBucket, number> = { won: 0, lost: 0, expected: 0, carried: 0 };
  leads.forEach((l) => { counts[bucketOf(l)]++; });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-semibold text-slate-800">{MONTHS[month - 1]} {year}</div>
        <div className="text-xs text-slate-500">{leads.length} lead{leads.length !== 1 ? 's' : ''}</div>
      </div>
      {leads.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">No expected order planned for this month.</p>
      ) : (
        <>
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-2">
            {(Object.keys(counts) as LeadBucket[]).map((b) => counts[b] > 0 && (
              <div key={b} className={BUCKET[b].bar} style={{ width: `${(counts[b] / leads.length) * 100}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-slate-600">
            {(Object.keys(counts) as LeadBucket[]).map((b) => counts[b] > 0 && (
              <span key={b}><span className={`inline-block w-2 h-2 rounded-full mr-1 ${BUCKET[b].bar}`} />{counts[b]} {BUCKET[b].label.toLowerCase()}</span>
            ))}
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            {leads.map((l) => {
              const b = bucketOf(l);
              return (
                <div key={l.lead_id} className="flex items-center gap-2 border-b border-slate-100 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {l.lead_series && <span className="text-slate-400 mr-1">{l.lead_series}</span>}
                      {l.lead_name || `Lead #${l.lead_id}`}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{l.company || '—'}{l.lead_status_label ? ` · ${l.lead_status_label}` : ''}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${BUCKET[b].badge}`}>{BUCKET[b].label}</span>
                  <button type="button" className="text-slate-400 hover:text-blue-600" onClick={() => onOpenLead(l.lead_id)} aria-label="Open lead"><ExternalLink size={14} /></button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

const LeadList: React.FC<{ title: string; description: string; items: MISLeadItem[]; tone: 'won' | 'lost'; onOpen: (id: number) => void }> = ({ title, description, items, tone, onOpen }) => (
  <Section title={title} description={description}>
    {items.length === 0 ? (
      <p className="text-sm text-slate-400 py-4">None this month.</p>
    ) : (
      <div className="max-h-72 overflow-y-auto pr-1">
        {items.map((l) => (
          <button key={l.lead_id} type="button" onClick={() => onOpen(l.lead_id)}
            className="w-full text-left flex items-center gap-2 border-b border-slate-100 py-2 hover:bg-slate-50">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tone === 'won' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-800 truncate">
                {l.lead_series && <span className="text-slate-400 mr-1">{l.lead_series}</span>}
                {l.lead_name || `Lead #${l.lead_id}`}
              </div>
              <div className="text-xs text-slate-500 truncate">{l.company || '—'}{l.at ? ` · ${new Date(l.at).toLocaleDateString()}` : ''}</div>
            </div>
            {l.planned != null && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${l.planned ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{l.planned ? 'Planned' : 'Not planned'}</span>}
            {l.value != null && <div className="text-sm font-semibold text-slate-700">{formatINRShort(l.value)}</div>}
          </button>
        ))}
      </div>
    )}
  </Section>
);

// ---------------------------------------------------------------------------
// Team overview (domain heads / region heads / admins)
// ---------------------------------------------------------------------------


type SortKey = 'name' | 'won_value' | 'pct' | 'leads_created' | 'activities' | 'lost_count' | 'last_active';

const PAGE_SIZE = 50;

/** Fill any field an older backend build does not send yet, so the page never crashes on a missing value. */
const TEAM_DEFAULTS: Partial<MISTeamRow> = {
  od_planned_visits: 0, od_unplanned_visits: 0,
  eo_total: 0, eo_won: 0, eo_lost: 0, eo_open: 0, next_od_status: 'pending', next_eo_status: 'pending',
  target: 0, last_active: null, prev_leads_created: 0, prev_activities: 0, prev_won_count: 0, prev_won_value: 0, prev_lost_count: 0,
};
const withTeamDefaults = (r: MISTeamRow): MISTeamRow => ({ ...TEAM_DEFAULTS, ...r });
const daysSince = (iso: string | null): number | null => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null);
const pctOf = (r: MISTeamRow) => (r.target > 0 ? r.won_value / r.target : null);
const isPastMonth = (y: number, m: number) => { const n = new Date(); return y < n.getFullYear() || (y === n.getFullYear() && m < n.getMonth() + 1); };
const isCurrentMonth = (y: number, m: number) => { const n = new Date(); return y === n.getFullYear() && m === n.getMonth() + 1; };
const isNextMonth = (y: number, m: number) => { const n = new Date(); const nx = new Date(n.getFullYear(), n.getMonth() + 1, 1); return y === nx.getFullYear() && m === nx.getMonth() + 1; };
const nextOf = (y: number, m: number) => (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 });

/** MIS is a month-end review read in the next month's first days — so from the 1st to the 10th open on last month. */
const initialMonth = () => {
  const d = new Date();
  const base = d.getDate() <= 10 ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : d;
  return { y: base.getFullYear(), m: base.getMonth() + 1 };
};

/** What needs a head's attention for this person in the month being viewed. */
function attentionFlags(r: MISTeamRow, year: number, month: number): string[] {
  const now = new Date();
  const cur = isCurrentMonth(year, month);
  const past = isPastMonth(year, month);
  const flags: string[] = [];
  if (!r.od_plan_filled) flags.push('No OD plan');
  if (!r.expected_order_filled) flags.push('No expected order');
  if (r.target > 0) {
    if (past && r.won_value < r.target) flags.push('Target missed');
    else if (cur) {
      const elapsed = now.getDate() / new Date(year, month, 0).getDate();
      if (r.won_value < 0.5 * elapsed * r.target) flags.push('Behind target');
    }
  }
  if (cur) {
    const d = daysSince(r.last_active);
    if (d === null) flags.push('No activity yet');
    else if (d >= 5) flags.push(`Quiet ${d} days`);
  }
  if (r.next_od_status === 'late') flags.push('Next OD plan late');
  if (r.next_od_status === 'not_filed') flags.push('Next OD plan not filed');
  if (r.next_eo_status === 'late') flags.push('Next expected order late');
  if (r.next_eo_status === 'not_filed') flags.push('Next expected order not filed');
  return flags;
}

const Delta: React.FC<{ cur: number; prev: number; invert?: boolean }> = ({ cur, prev, invert }) => {
  const diff = cur - prev;
  if (diff === 0) return null;
  const good = invert ? diff < 0 : diff > 0;
  return (
    <span className={`inline-flex items-center ml-1.5 text-[10px] font-semibold ${good ? 'text-emerald-600' : 'text-rose-500'}`} title="Compared with the month before">
      {diff > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{Math.abs(diff)}
    </span>
  );
};

const lastActiveText = (iso: string | null) => {
  const d = daysSince(iso);
  return d === null ? 'Never' : d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
};

const Tick: React.FC<{ on: boolean }> = ({ on }) => (
  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${on ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-500'}`}>{on ? 'Filed' : 'No'}</span>
);

const PLAN_STATUS: Record<MISPlanStatus, { label: string; cls: string }> = {
  on_time: { label: 'On time', cls: 'bg-emerald-100 text-emerald-700' },
  late: { label: 'Late', cls: 'bg-amber-100 text-amber-700' },
  not_filed: { label: 'Not filed', cls: 'bg-rose-100 text-rose-600' },
  pending: { label: 'Not due yet', cls: 'bg-slate-100 text-slate-500' },
};
const PlanChip: React.FC<{ status?: MISPlanStatus }> = ({ status }) => {
  const st = PLAN_STATUS[status ?? 'pending'] ?? PLAN_STATUS.pending;
  return <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded whitespace-nowrap ${st.cls}`}>{st.label}</span>;
};

const TargetBar: React.FC<{ row: MISTeamRow }> = ({ row }) => {
  const pct = pctOf(row);
  if (pct === null) return <span className="text-slate-400">{formatINRShort(row.won_value)} <span className="text-[10px]">· no target</span></span>;
  const p = Math.round(pct * 100);
  return (
    <div className="min-w-[150px]">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-slate-800">{formatINRShort(row.won_value)}</span>
        <span className="text-slate-500">of {formatINRShort(row.target)} · {p}%</span>
      </div>
      <div className="h-1.5 mt-1 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${p >= 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(p, 100)}%` }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Team overview (domain heads / region heads / admins)
// ---------------------------------------------------------------------------

const TeamOverview: React.FC<{
  rows: MISTeamRow[]; year: number; month: number; selectedId?: number; onSelect: (id: number) => void;
  visible: MISTeamRow[]; search: string; setSearch: (v: string) => void;
  onlyAttention: boolean; setOnlyAttention: (v: boolean) => void;
  sortKey: SortKey; sortDesc: boolean; setSort: (k: SortKey) => void; attentionCount: number;
}> = ({ rows, year, month, selectedId, onSelect, visible, search, setSearch, onlyAttention, setOnlyAttention, sortKey, sortDesc, setSort, attentionCount }) => {
  const [limit, setLimit] = useState(PAGE_SIZE);
  useEffect(() => { setLimit(PAGE_SIZE); }, [search, onlyAttention, sortKey, sortDesc, year, month]);

  const sum = (f: (r: MISTeamRow) => number) => rows.reduce((a, r) => a + f(r), 0);
  const targetTotal = sum((r) => r.target);
  const cur = isCurrentMonth(year, month);
  const nx = nextOf(year, month);
  const shown = visible.slice(0, limit);
  const regions = useMemo(() => [...new Set(shown.map((r) => r.region_name || 'No region'))], [shown]);
  const grouped = regions.length > 1;
  const groups = grouped ? regions.map((g) => [g, shown.filter((r) => (r.region_name || 'No region') === g)] as const) : ([['', shown]] as const);
  const cols = cur ? 10 : 9;

  const th = 'sticky top-0 z-10 bg-white py-2 px-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap border-b border-slate-300';
  const Th: React.FC<{ k: SortKey; children: React.ReactNode }> = ({ k, children }) => (
    <th className={`${th} cursor-pointer select-none hover:text-slate-800`} onClick={() => setSort(k)}>
      {children}{sortKey === k && (sortDesc ? <ArrowDown size={10} className="inline ml-1" /> : <ArrowUp size={10} className="inline ml-1" />)}
    </th>
  );

  const exportRows = () =>
    downloadCsv(`mis-team-${year}-${String(month).padStart(2, '0')}.csv`,
      ['Employee', 'Region', 'Won value', 'Target', 'Target %', 'Won leads', 'Leads created', 'Activities', 'Lost', 'Last active',
        `${MONTHS[month - 1]} OD plan`, 'OD planned visits', 'OD unplanned visits', `${MONTHS[month - 1]} expected order`, 'Planned leads won', 'Planned leads lost', 'Planned leads open',
        `${MONTHS[nx.m - 1]} OD plan`, `${MONTHS[nx.m - 1]} expected order`, 'Needs attention'],
      visible.map((r) => [
        r.employee_name, r.region_name, r.won_value, r.target || '', pctOf(r) === null ? '' : `${Math.round(pctOf(r)! * 100)}%`,
        r.won_count, r.leads_created, r.activities, r.lost_count, r.last_active ? new Date(r.last_active).toLocaleDateString() : '',
        r.od_plan_filled ? 'Filed' : 'No', r.od_planned_visits, r.od_unplanned_visits, r.expected_order_filled ? 'Filed' : 'No', r.eo_won, r.eo_lost, r.eo_open,
        PLAN_STATUS[r.next_od_status]?.label, PLAN_STATUS[r.next_eo_status]?.label, attentionFlags(r, year, month).join('; '),
      ]));

  return (
    <div>
      {/* Team totals with change vs the month before */}
      <div className="flex flex-wrap divide-x divide-slate-200 gap-y-3 mb-5">
        <Stat label="Won value" accent="text-emerald-600"
          value={<>{formatINRShort(sum((r) => r.won_value))}<Delta cur={Math.round(sum((r) => r.won_value))} prev={Math.round(sum((r) => r.prev_won_value))} /></>}
          sub={targetTotal > 0 ? `${Math.round((sum((r) => r.won_value) / targetTotal) * 100)}% of ${formatINRShort(targetTotal)} target` : undefined} />
        <Stat label="Won leads" value={<>{sum((r) => r.won_count)}<Delta cur={sum((r) => r.won_count)} prev={sum((r) => r.prev_won_count)} /></>} />
        <Stat label="Leads created" value={<>{sum((r) => r.leads_created)}<Delta cur={sum((r) => r.leads_created)} prev={sum((r) => r.prev_leads_created)} /></>} />
        <Stat label="Activities" value={<>{sum((r) => r.activities)}<Delta cur={sum((r) => r.activities)} prev={sum((r) => r.prev_activities)} /></>} />
        <Stat label="Lost" accent="text-rose-600" value={<>{sum((r) => r.lost_count)}<Delta invert cur={sum((r) => r.lost_count)} prev={sum((r) => r.prev_lost_count)} /></>} />
        <Stat label="Need attention" accent={attentionCount ? 'text-amber-600' : 'text-slate-900'} value={attentionCount} sub={`of ${rows.length} people`} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find employee"
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:border-blue-400" />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={onlyAttention} onChange={(e) => setOnlyAttention(e.target.checked)} />
          Needs attention only
        </label>
        <div className="flex-1" />
        <Button size="sm" variant="outline" leftIcon={<Download size={14} />} onClick={exportRows} disabled={visible.length === 0}>Download Excel</Button>
      </div>

      <div className="overflow-auto max-h-[65vh]">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <Th k="name">Employee</Th>
              <Th k="pct">Won vs target</Th>
              <Th k="leads_created">Leads</Th>
              <Th k="activities">Activities</Th>
              <Th k="lost_count">Lost</Th>
              {cur && <Th k="last_active">Last active</Th>}
              <th className={th}>{MONTHS[month - 1].slice(0, 3)} plan</th>
              <th className={th}>{MONTHS[nx.m - 1].slice(0, 3)} plan filed</th>
              <th className={th}>Attention</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={cols} className="py-8 text-center text-slate-400">No one matches.</td></tr>}
            {groups.map(([g, list]) => (
              <React.Fragment key={g || 'all'}>
                {grouped && (
                  <tr><td colSpan={cols} className="pt-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{g} · {list.length}</td></tr>
                )}
                {list.map((r) => {
                  const flags = attentionFlags(r, year, month);
                  const cell = 'py-2.5 px-3 border-b border-slate-100';
                  return (
                    <tr key={r.employee_id} onClick={() => onSelect(r.employee_id)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/60 ${selectedId === r.employee_id ? 'bg-blue-50' : ''}`}>
                      <td className={`${cell} font-medium text-slate-800 whitespace-nowrap`}>
                        {r.employee_name}
                        <span className="ml-2 text-xs font-normal text-slate-400">{r.won_count} won</span>
                        <Delta cur={r.won_count} prev={r.prev_won_count} />
                      </td>
                      <td className={cell}><TargetBar row={r} /></td>
                      <td className={`${cell} whitespace-nowrap`}>{r.leads_created}<Delta cur={r.leads_created} prev={r.prev_leads_created} /></td>
                      <td className={`${cell} whitespace-nowrap`}>{r.activities}<Delta cur={r.activities} prev={r.prev_activities} /></td>
                      <td className={`${cell} text-rose-600 whitespace-nowrap`}>{r.lost_count}</td>
                      {cur && <td className={`${cell} text-slate-600 whitespace-nowrap`}>{lastActiveText(r.last_active)}</td>}
                      <td className={cell}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap"><span className="w-10">OD</span><Tick on={r.od_plan_filled} />
                            {(r.od_planned_visits > 0 || r.od_unplanned_visits > 0) && (
                              <span title="Visits in the OD plan: planned / not in the plan">{r.od_planned_visits} planned{r.od_unplanned_visits > 0 ? ` · ${r.od_unplanned_visits} unplanned` : ''}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                            <span className="w-10">Orders</span><Tick on={r.expected_order_filled} />
                            {r.eo_total > 0 && (
                              <span title="Leads in this month's expected order: won / lost / still open">
                                {r.eo_won}/{r.eo_total} won{r.eo_open > 0 ? ` · ${r.eo_open} ${isPastMonth(year, month) ? 'carried' : 'open'}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={cell}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap"><span className="w-10">OD</span><PlanChip status={r.next_od_status} /></div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap"><span className="w-10">Orders</span><PlanChip status={r.next_eo_status} /></div>
                        </div>
                      </td>
                      <td className={cell}>
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {flags.map((f) => <span key={f} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 whitespace-nowrap">{f}</span>)}
                          {flags.length === 0 && <span className="text-slate-300">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length > shown.length && (
        <div className="pt-3 text-center">
          <Button size="sm" variant="outline" onClick={() => setLimit(limit + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, visible.length - shown.length)} more ({visible.length - shown.length} left)</Button>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// One person's month (full-page for people without a team, in a side panel for heads)
// ---------------------------------------------------------------------------

type DetailTab = 'summary' | 'plans' | 'wonlost';

interface DetailProps {
  mis: MISEmployeeResponse; year: number; month: number; odPlan: ODPlanReportItem | null; row?: MISTeamRow;
  expectedThis: ExpectedOrderReportItem[]; loadingPlans: boolean;
  canEditOwn: boolean; onOpenLead: (id: number) => void; onEditOd: () => void; onAddUnplanned: () => void;
}

const EmployeeDetail: React.FC<DetailProps> = ({ mis, year, month, odPlan, row, expectedThis, loadingPlans, canEditOwn, onOpenLead, onEditOd, onAddUnplanned }) => {
  const [tab, setTab] = useState<DetailTab>('summary');
  const s: MISEmployeeResponse['summary'] = { ...({ won_from_plan: 0, won_outside_plan: 0, od_planned_visits: 0, od_unplanned_visits: 0 } as Partial<MISEmployeeResponse['summary']>), ...mis.summary };
  const past = isPastMonth(year, month);
  const nx = nextOf(year, month);

  // Leads that were promised for the month but are still open once the month is over = carried forward
  const carried = useMemo(() => {
    if (!past) return [];
    const seen = new Map<number, ExpectedOrderReportItem['leads'][number]>();
    expectedThis.forEach((r) => r.leads.forEach((l) => seen.set(l.lead_id, l)));
    return [...seen.values()].filter((l) => !l.lead_is_final && !l.lead_is_lost);
  }, [expectedThis, past]);

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'plans', label: `Plans${carried.length ? ` · ${carried.length} carried` : ''}` },
    { id: 'wonlost', label: `Won / Lost · ${s.won_count}/${s.lost_count}` },
  ];

  return (
    <>
      <div className="flex gap-1 border-b border-slate-200 mb-5">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-mis-fade">
        {tab === 'summary' && (
          <>
            <div className="flex flex-wrap divide-x divide-slate-200 gap-y-3">
              <Stat label="Leads created" value={s.leads_created} />
              <Stat label="Activities" value={s.activities} sub="calls, meetings, notes" />
              <Stat label="Quotations sent" value={s.quotations_sent} sub={s.quotations_value ? formatINRShort(s.quotations_value) : undefined} />
              <Stat label="Won" value={s.won_count} sub={s.won_value ? formatINRShort(s.won_value) : undefined} accent="text-emerald-600" />
              <Stat label="Lost" value={s.lost_count} accent="text-rose-600" />
              <Stat label="Orders created" value={s.orders_created} sub={s.orders_value ? formatINRShort(s.orders_value) : undefined} />
            </div>

            <Section title="Where the wins came from" description="Won leads that were in this month's expected order, against ones that were not">
              {s.won_count === 0 ? <p className="text-sm text-slate-400">No leads won this month.</p> : (
                <>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 mb-2">
                    <div className="bg-blue-500" style={{ width: `${(s.won_from_plan / s.won_count) * 100}%` }} />
                    <div className="bg-slate-300" style={{ width: `${(s.won_outside_plan / s.won_count) * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-x-6 text-sm text-slate-600">
                    <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" /><strong>{s.won_from_plan}</strong> from the expected order</span>
                    <span><span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-1.5" /><strong>{s.won_outside_plan}</strong> outside the plan</span>
                  </div>
                </>
              )}
            </Section>

            {row && (
              <Section title="Plans" description="Filed on time means before the last day of the month, 8:30 PM">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{MONTHS[month - 1]} (this review)</div>
                    <div className="flex items-center gap-2 mb-1"><span className="w-16 text-slate-500">OD plan</span><Tick on={row.od_plan_filled} /></div>
                    <div className="flex items-center gap-2"><span className="w-16 text-slate-500">Orders</span><Tick on={row.expected_order_filled} />
                      {row.eo_total > 0 && <span className="text-xs text-slate-500">{row.eo_won} won · {row.eo_lost} lost · {row.eo_open} {past ? 'carried' : 'open'}</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{MONTHS[nx.m - 1]} (next plan)</div>
                    <div className="flex items-center gap-2 mb-1"><span className="w-16 text-slate-500">OD plan</span><PlanChip status={row.next_od_status} /></div>
                    <div className="flex items-center gap-2"><span className="w-16 text-slate-500">Orders</span><PlanChip status={row.next_eo_status} /></div>
                  </div>
                </div>
              </Section>
            )}
            <p className="text-xs text-slate-400 mt-6">{s.contacts_added} contact{s.contacts_added !== 1 ? 's' : ''} and {s.customers_added} customer{s.customers_added !== 1 ? 's' : ''} added this month.</p>
          </>
        )}

        {tab === 'plans' && (
          <>
            <Section className="!mt-0 !pt-0 !border-0" title="OD plan"
              description={odPlan ? `${s.od_days_planned} day${s.od_days_planned !== 1 ? 's' : ''} planned in ${MONTHS[month - 1]} · ${s.od_planned_visits} planned visit${s.od_planned_visits !== 1 ? 's' : ''} · ${s.od_unplanned_visits} unplanned` : 'Visit / travel / return plan for the month'}
              action={canEditOwn ? (
                <div className="flex items-center gap-1">
                  {isCurrentMonth(year, month) && <Button size="sm" variant="outline" onClick={onAddUnplanned}>Add unplanned visit</Button>}
                  {(odPlan || isNextMonth(year, month)) && (
                    <Button size="sm" variant="ghost" onClick={onEditOd}>{isNextMonth(year, month) ? (odPlan ? 'View / Edit' : 'Create') : 'View'}</Button>
                  )}
                </div>
              ) : undefined}>
              {loadingPlans ? <Spinner label="Loading plan..." /> : odPlan ? <><ODPlanCalendar plan={odPlan} year={year} month={month} /><ODVisitTable plan={odPlan} /></> : (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-400"><MapPin size={32} /><p className="text-sm">No OD plan for this month.</p></div>
              )}
            </Section>

            <Section title="Expected order" description={`What was promised for ${MONTHS[month - 1]} and how it ended`}>
              {loadingPlans ? <Spinner label="Loading plan..." /> : <ExpectedOrderBlock year={year} month={month} reports={expectedThis} onOpenLead={onOpenLead} />}
            </Section>

            {past && !loadingPlans && (
              <Section title={`Carried forward to ${MONTHS[nx.m - 1]}`} description="Leads promised for this month that are still open (not won, not lost)">
                {carried.length === 0 ? <p className="text-sm text-slate-400">Nothing carried forward.</p> : (
                  <div>
                    {carried.map((l) => (
                      <div key={l.lead_id} className="flex items-center gap-2 border-b border-slate-100 py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-800 truncate">{l.lead_series && <span className="text-slate-400 mr-1">{l.lead_series}</span>}{l.lead_name || `Lead #${l.lead_id}`}</div>
                          <div className="text-xs text-slate-500 truncate">{l.company || '—'}{l.lead_status_label ? ` · ${l.lead_status_label}` : ''}</div>
                        </div>
                        <button type="button" className="text-slate-400 hover:text-blue-600" onClick={() => onOpenLead(l.lead_id)} aria-label="Open lead"><ExternalLink size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}
          </>
        )}

        {tab === 'wonlost' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10">
            <LeadList title="Won" description={`${s.won_count} won${s.won_value ? ` · ${formatINRShort(s.won_value)}` : ''} · ${s.won_from_plan} planned`} items={mis.won_leads} tone="won" onOpen={onOpenLead} />
            <LeadList title="Lost" description={`${s.lost_count} lost`} items={mis.lost_leads} tone="lost" onOpen={onOpenLead} />
          </div>
        )}
      </div>
    </>
  );
};

export const ReportsPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const canViewReport = useAppSelector(selectHasPermission('marketing.view_report'));
  const canCreateReport = useAppSelector(selectHasPermission('marketing.create_report'));

  const init = useMemo(initialMonth, []);
  const [year, setYear] = useState(init.y);
  const [month, setMonth] = useState(init.m);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined); // undefined = myself
  const [panelOpen, setPanelOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const [team, setTeam] = useState<MISTeamRow[]>([]);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDesc, setSortDesc] = useState(false);

  const [mis, setMis] = useState<MISEmployeeResponse | null>(null);
  const [loadingMis, setLoadingMis] = useState(false);
  const [odPlan, setOdPlan] = useState<ODPlanReportItem | null>(null);
  const [expectedThis, setExpectedThis] = useState<ExpectedOrderReportItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const reqId = useRef(0);

  const hasTeam = teamLoaded && team.length > 0;
  const monthState = isPastMonth(year, month) ? 'complete' : isCurrentMonth(year, month) ? 'in progress' : 'upcoming';
  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };
  const openLead = useCallback((id: number) => navigate(`/leads/${id}/edit`), [navigate]);

  // Team overview — the server returns no rows for people without a team
  useEffect(() => {
    if (!canViewReport) return;
    setTeamLoaded(false);
    marketingAPI.getMISTeam(year, month).then((r) => setTeam(r.rows.map(withTeamDefaults))).catch(() => setTeam([])).finally(() => setTeamLoaded(true));
  }, [canViewReport, year, month]);

  // One person's month: needed full-page (no team) or when the side panel is open
  const needDetail = canViewReport && teamLoaded && (!hasTeam || panelOpen);
  useEffect(() => {
    if (!needDetail) return;
    const id = ++reqId.current;
    setMis(null);
    setLoadingMis(true);
    setLoadingPlans(true);
    (async () => {
      try {
        const data = await marketingAPI.getMISForEmployee(year, month, selectedEmployeeId);
        if (id !== reqId.current) return;
        setMis(data);
        setLoadingMis(false);
        const emp = data.employee_id;
        const [od, eoNow] = await Promise.all([
          marketingAPI.listODPlanReports({ year, month, employee_id: emp }).catch(() => []),
          marketingAPI.listExpectedOrderReports({ year, month, employee_id: emp }).catch(() => []),
        ]);
        if (id !== reqId.current) return;
        setOdPlan(od[0] ?? null);
        setExpectedThis(eoNow);
      } catch (e: any) {
        if (id !== reqId.current) return;
        setMis(null);
        showToast(e?.message || 'Failed to load MIS', 'error');
      } finally {
        if (id === reqId.current) { setLoadingMis(false); setLoadingPlans(false); }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needDetail, selectedEmployeeId, year, month]);

  // Table order / filters (kept here so the side panel's previous/next follow the same list)
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = team.filter((r) => (!q || r.employee_name.toLowerCase().includes(q)) && (!onlyAttention || attentionFlags(r, year, month).length > 0));
    const val = (r: MISTeamRow): number | string => {
      switch (sortKey) {
        case 'name': return r.employee_name.toLowerCase();
        case 'won_value': return r.won_value;
        case 'pct': return pctOf(r) ?? -1;
        case 'leads_created': return r.leads_created;
        case 'activities': return r.activities;
        case 'lost_count': return r.lost_count;
        case 'last_active': return r.last_active ? new Date(r.last_active).getTime() : 0;
      }
    };
    return [...list].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * (sortDesc ? -1 : 1));
  }, [team, search, onlyAttention, sortKey, sortDesc, year, month]);
  const setSort = (k: SortKey) => { if (k === sortKey) setSortDesc(!sortDesc); else { setSortKey(k); setSortDesc(k !== 'name'); } };
  const attentionCount = useMemo(() => team.filter((r) => attentionFlags(r, year, month).length > 0).length, [team, year, month]);

  const openPerson = (id: number | undefined) => { window.clearTimeout(closeTimer.current); setClosing(false); setSelectedEmployeeId(id); setPanelOpen(true); };
  const closePanel = useCallback(() => {
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => { setPanelOpen(false); setClosing(false); }, 220);
  }, []);
  const idx = selectedEmployeeId === undefined ? -1 : visible.findIndex((r) => r.employee_id === selectedEmployeeId);
  const step = (d: number) => { const n = visible[idx + d]; if (n) setSelectedEmployeeId(n.employee_id); };

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, closePanel]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const panelName = selectedEmployeeId === undefined ? 'My MIS' : team.find((r) => r.employee_id === selectedEmployeeId)?.employee_name ?? mis?.employee_name ?? '…';
  const detail = mis ? (
    <EmployeeDetail key={mis.employee_id} mis={mis} year={year} month={month} odPlan={odPlan} expectedThis={expectedThis} loadingPlans={loadingPlans}
      row={team.find((r) => r.employee_id === mis.employee_id)} canEditOwn={canCreateReport && selectedEmployeeId === undefined} onOpenLead={openLead}
      onEditOd={() => navigate(`/reports/od-plan?year=${year}&month=${month}`)}
      onAddUnplanned={() => navigate(`/reports/od-plan?year=${year}&month=${month}&unplanned=1`)} />
  ) : null;

  return (
    <PageLayout
      title="MIS"
      description="Month-end review. Read it in the first days of the next month: how the plan went, what was won, and who has filed the next plan."
      breadcrumbs={[{ label: 'MIS', href: '/reports' }]}
    >
      {!canViewReport ? (
        <div className="mb-6">
          <p className="text-slate-600">You do not have permission to view MIS.</p>
          <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_report</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 pb-2">
            {canCreateReport && (
              <>
                <Button size="sm" leftIcon={<MapPin size={14} />} onClick={() => navigate('/reports/od-plan')}>OD plan</Button>
                <Button size="sm" leftIcon={<Calendar size={14} />} onClick={() => navigate('/reports/expected-order/new')}>Expected order</Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => navigate('/reports/leads-by-region')}>Leads by Region</Button>
            {hasTeam && <Button size="sm" variant="outline" onClick={() => openPerson(undefined)}>My MIS</Button>}
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={14} /></Button>
              <div className="min-w-[150px] text-center">
                <div className="text-sm font-semibold text-slate-800 leading-tight">{MONTHS[month - 1]} {year}</div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${monthState === 'complete' ? 'text-emerald-600' : 'text-amber-600'}`}>{monthState}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={14} /></Button>
            </div>
          </div>

          {!teamLoaded ? (
            <Spinner label="Loading MIS..." />
          ) : hasTeam ? (
            <Section className="!mt-2" title="Team overview" description="Click a person to open their month. Arrows show the change against the month before.">
              <TeamOverview rows={team} year={year} month={month} selectedId={panelOpen ? selectedEmployeeId : undefined} onSelect={openPerson}
                visible={visible} search={search} setSearch={setSearch} onlyAttention={onlyAttention} setOnlyAttention={setOnlyAttention}
                sortKey={sortKey} sortDesc={sortDesc} setSort={setSort} attentionCount={attentionCount} />
            </Section>
          ) : loadingMis && !mis ? (
            <Spinner label="Loading MIS..." />
          ) : detail ? (
            <div className="mt-4 animate-mis-fade">
              <h2 className="text-lg font-bold text-slate-900 mb-4">My MIS <span className="text-sm font-normal text-slate-500">{MONTHS[month - 1]} {year}</span></h2>
              {detail}
            </div>
          ) : null}
        </div>
      )}

      {/* Side panel: one person's month, over the team table */}
      {panelOpen && hasTeam && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className={`absolute inset-0 bg-slate-900/30 ${closing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade'}`} onClick={closePanel} />
          <aside className={`relative w-[min(960px,96vw)] h-full bg-white shadow-2xl flex flex-col ${closing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-slate-900 truncate">{panelName}</div>
                <div className="text-xs text-slate-500">{MONTHS[month - 1]} {year} · {monthState}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => step(-1)} disabled={idx <= 0} aria-label="Previous employee"><ChevronLeft size={14} /> Prev</Button>
              <Button size="sm" variant="outline" onClick={() => step(1)} disabled={idx < 0 || idx >= visible.length - 1} aria-label="Next employee">Next <ChevronRight size={14} /></Button>
              <button type="button" onClick={closePanel} className="p-1.5 text-slate-400 hover:text-slate-700" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div key={selectedEmployeeId ?? 'me'} className="animate-mis-fade">
                {loadingMis && !mis ? <Spinner label="Loading MIS..." /> : detail}
              </div>
            </div>
          </aside>
        </div>
      )}
    </PageLayout>
  );
};
