import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, SearchX } from 'lucide-react';
import { DataTable, Column } from '../ui/DataTable';
import { SearchInput } from '../ui/SearchInput';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { marketingAPI, AuditLog, AuditLogFilterOptions } from '../../lib/marketing-api';
import { cn } from '../../lib/utils';
import { useRestorableState } from '../../hooks/useListMemory';
import { dayLabel, highlightParts, searchWords, splitAuditDetails, timeLabel, withoutIds } from '../../lib/audit-details';

/**
 * Settings → Audit Logs.
 * - Search: every word must match (any order); matches a lead's name/company/number too, even when
 *   the entry itself only says "lead #245" (backend resolves it — app/routers/audit_logs.py).
 * - Filters: From / To date, Type, Action, User (choices come from GET /api/audit-logs/filters), all on one row.
 * - Matched search words are marked in the rows; database ids ("Enquiry #130") are hidden (the tooltip keeps the raw text).
 * - One Date box (Any time / Today / Last 7 days / Last 30 days / Pick dates → From & To) and a Refresh button beside the entry count; a lead's name opens that lead;
 *   the time shows seconds (12-hour clock throughout).
 * - Search and filters are remembered when you come back with the Back button (a fresh visit starts clean).
 * - Loads more automatically as you scroll to the bottom (no page buttons).
 */
const PAGE_SIZE = 50;

const humanize = (s: string) => s.split('_').join(' ').replace(/\b\w/g, c => c.toUpperCase());
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const rangeFor = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { from: ymd(start), to: ymd(end) };
};
const PRESETS = [{ key: 'today', label: 'Today', days: 1 }, { key: '7', label: 'Last 7 days', days: 7 }, { key: '30', label: 'Last 30 days', days: 30 }];

const Marked: React.FC<{ text: string; words: string[] }> = ({ text, words }) => (
  <>
    {highlightParts(text, words).map((p, i) =>
      p.hit
        ? <mark key={i} className="rounded bg-amber-100 px-0.5 text-slate-900">{p.text}</mark>
        : <React.Fragment key={i}>{p.text}</React.Fragment>
    )}
  </>
);

export const AuditLogsPanel: React.FC = () => {
  const [search, setSearch] = useRestorableState('audit:search', '');
  const [debouncedSearch, setDebouncedSearch] = useRestorableState('audit:debouncedSearch', '');
  const [from, setFrom] = useRestorableState('audit:from', '');
  const [to, setTo] = useRestorableState('audit:to', '');
  const [entityType, setEntityType] = useRestorableState('audit:entityType', '');
  const [action, setAction] = useRestorableState('audit:action', '');
  const [employeeId, setEmployeeId] = useRestorableState('audit:employeeId', '');
  const [customRange, setCustomRange] = useRestorableState('audit:customRange', false);

  const [options, setOptions] = useState<AuditLogFilterOptions>({ entity_types: [], actions: [], users: [] });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const requestId = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    marketingAPI.getAuditLogFilters().then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // "/" jumps to the search box (unless you are already typing somewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    entity_type: entityType || undefined,
    action: action || undefined,
    employee_id: employeeId ? Number(employeeId) : undefined,
    // Inclusive whole days in the user's local time.
    start_date: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    end_date: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined,
  }), [debouncedSearch, entityType, action, employeeId, from, to]);

  const load = useCallback(async (pageToLoad: number) => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await marketingAPI.getAuditLogs({ ...filters, page: pageToLoad, page_size: PAGE_SIZE });
      if (id !== requestId.current) return; // filters changed while this was loading
      setLogs(prev => (pageToLoad === 1 ? res.items || [] : [...prev, ...(res.items || [])]));
      setTotal(res.total || 0);
      setPage(pageToLoad);
    } catch {
      if (id !== requestId.current) return;
      if (pageToLoad === 1) { setLogs([]); setTotal(0); }
    } finally {
      if (id === requestId.current) { setLoading(false); setLoaded(true); }
    }
  }, [filters]);

  // Any filter change → start over from the newest entries.
  useEffect(() => { load(1); }, [load]);

  const hasMore = logs.length < total;

  // Infinite scroll: load the next page when the sentinel below the table comes into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) load(page + 1);
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, load]);

  const anyFilter = !!(search || from || to || entityType || action || employeeId);
  const clearFilters = () => {
    setSearch(''); setDebouncedSearch(''); setFrom(''); setTo(''); setEntityType(''); setAction(''); setEmployeeId(''); setCustomRange(false);
  };

  const words = useMemo(() => searchWords(debouncedSearch), [debouncedSearch]);
  const presetActive = (days: number) => { const r = rangeFor(days); return from === r.from && to === r.to; };
  const activePreset = PRESETS.find(p => presetActive(p.days));
  const rangeValue = customRange || (!activePreset && (from || to)) ? 'custom' : activePreset?.key ?? 'all';
  const pickRange = (v: string) => {
    if (v === 'custom') { setCustomRange(true); return; }
    setCustomRange(false);
    const preset = PRESETS.find(p => p.key === v);
    if (preset) { const r = rangeFor(preset.days); setFrom(r.from); setTo(r.to); } else { setFrom(''); setTo(''); }
  };
  const refresh = () => {
    load(1);
    marketingAPI.getAuditLogFilters().then(setOptions).catch(() => {});
  };

  const columns = useMemo<Column<AuditLog>[]>(() => [
    {
      key: 'created_at',
      label: 'Date & Time',
      width: 140,
      render: (log) => {
        const when = new Date(log.created_at);
        return (
          <div>
            <div className="text-[11px] font-medium text-slate-600 leading-none mb-1">{dayLabel(when)}</div>
            <div className="text-xs font-semibold text-slate-800 leading-none whitespace-nowrap">{timeLabel(when, true)}</div>
          </div>
        );
      }
    },
    {
      key: 'employee_name',
      label: 'User',
      width: 200,
      render: (log) => {
        const name = log.employee_name || 'System';
        return (
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px] leading-tight" title={name}><Marked text={name} words={words} /></span>
          </div>
        );
      }
    },
    {
      key: 'action',
      label: 'Action',
      width: 110,
      align: 'center',
      render: (log) => {
        const a = log.action?.toLowerCase() || '';
        const isDanger = a.includes('delete') || a.includes('remove');
        const isSuccess = a.includes('create') || a.includes('add') || a.includes('won') || a.includes('convert');
        return (
          <span className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border',
            isDanger ? 'bg-rose-50 text-rose-700 border-rose-200'
              : isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
          )}>
            {log.action}
          </span>
        );
      }
    },
    {
      key: 'details',
      label: 'Log Details',
      render: (log) => (
        <div className="flex items-start gap-2 max-w-full">
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-bold uppercase tracking-wider mt-0.5">
            {log.entity_type ? log.entity_type.split('_').join(' ') : 'System'}
          </span>
          <div className="min-w-0">
            {log.entity_label && (
              <p className="text-xs font-semibold text-slate-800 leading-normal">
                {(log.entity_type === 'lead' || log.entity_type === 'quotation') && log.entity_id ? (
                  <Link to={`/leads/${log.entity_id}/edit`} title="Open this lead" className="rounded hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <Marked text={log.entity_label} words={words} />
                  </Link>
                ) : <Marked text={log.entity_label} words={words} />}
              </p>
            )}
            {(() => {
              // "<what happened> — <change>; <change>" → the summary, then the changes as a list.
              const { summary: rawSummary, changes: rawChanges } = splitAuditDetails(log.details);
              const summary = withoutIds(rawSummary);
              const changes = rawChanges.map(withoutIds);
              return (
                <>
                  <span className="text-xs text-slate-600 font-medium leading-normal break-words whitespace-normal" title={log.details || ''}>
                    <Marked text={summary || '—'} words={words} />
                  </span>
                  {changes.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {changes.map((c, i) => (
                        <li key={i} className="text-xs text-slate-600 leading-snug break-words pl-2 border-l-2 border-slate-200"><Marked text={c} words={words} /></li>
                      ))}
                    </ul>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )
    }
  ], [words]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          ref={searchRef}
          aria-label="Search the audit log"
          placeholder="Search user, lead, details…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          containerClassName="w-auto flex-1 min-w-[140px] shadow-none"
          inputSize="sm"
        />
        <div className="w-36">
          <Select
            inputSize="sm"
            searchable={false}
            options={[{ value: 'all', label: 'Any time' }, ...PRESETS.map(p => ({ value: p.key, label: p.label })), { value: 'custom', label: 'Pick dates' }]}
            value={rangeValue} onChange={v => pickRange(String(v ?? 'all'))} placeholder="Any time" />
        </div>
        {rangeValue === 'custom' && (
          <>
            <div className="w-36"><DatePicker value={from} onChange={v => setFrom(v || '')} placeholder="From date" inputSize="sm" maxDate={to || undefined} /></div>
            <div className="w-36"><DatePicker value={to} onChange={v => setTo(v || '')} placeholder="To date" inputSize="sm" minDate={from || undefined} /></div>
          </>
        )}
        <div className="w-32">
          <Select inputSize="sm" options={[{ value: '', label: 'All types' }, ...options.entity_types.map(t => ({ value: t, label: humanize(t) }))]}
            value={entityType} onChange={v => setEntityType(v ? String(v) : '')} placeholder="All types" />
        </div>
        <div className="w-28">
          <Select inputSize="sm" searchable={false} options={[{ value: '', label: 'All actions' }, ...options.actions.map(a => ({ value: a, label: humanize(a) }))]}
            value={action} onChange={v => setAction(v ? String(v) : '')} placeholder="All actions" />
        </div>
        <div className="w-36">
          <Select inputSize="sm" options={[{ value: '', label: 'All users' }, ...options.users.map(u => ({ value: String(u.id), label: u.name }))]}
            value={employeeId} onChange={v => setEmployeeId(v ? String(v) : '')} placeholder="All users" searchable />
        </div>
        {anyFilter && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-600" aria-live="polite">
          {loading && page === 1 ? 'Loading…'
            : debouncedSearch ? <><span className="font-semibold text-slate-800">{total}</span> {total === 1 ? 'result' : 'results'} for “{debouncedSearch}”</>
              : <>Showing <span className="font-semibold text-slate-800">{logs.length}</span> of <span className="font-semibold text-slate-800">{total}</span> entries</>}
          <span className="text-slate-500"> · press <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-[11px]">/</kbd> to search</span>
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" disabled={loading} onClick={refresh} leftIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}>
            Refresh
          </Button>
        </div>
      </div>

      {loaded && !loading && logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <SearchX className="mx-auto text-slate-400" size={28} aria-hidden="true" />
          <p className="mt-2 text-sm font-medium text-slate-800">No entries match</p>
          <p className="text-xs text-slate-600">Try fewer words, or clear the filters.</p>
          {anyFilter && <Button className="mt-3" variant="outline" size="sm" onClick={clearFilters}>Clear</Button>}
        </div>
      ) : (
        <DataTable<AuditLog>
          bordered
          data={logs}
          rowKey={(l) => l.id}
          dense
          isLoading={loading && page === 1}
          columns={columns}
        />
      )}

      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {hasMore ? (loading ? 'Loading more…' : 'Scroll for more') : logs.length > 0 ? 'End of log' : null}
      </div>
    </div>
  );
};
