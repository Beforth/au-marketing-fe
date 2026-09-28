import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable, Column } from '../ui/DataTable';
import { SearchInput } from '../ui/SearchInput';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { marketingAPI, AuditLog, AuditLogFilterOptions } from '../../lib/marketing-api';
import { cn } from '../../lib/utils';
import { splitAuditDetails } from '../../lib/audit-details';

/**
 * Settings → Audit Logs.
 * - Search: every word must match (any order); matches a lead's name/company/number too, even when
 *   the entry itself only says "lead #245" (backend resolves it — app/routers/audit_logs.py).
 * - Filters: From / To date, Type, Action, User (choices come from GET /api/audit-logs/filters).
 * - Loads more automatically as you scroll to the bottom (no page buttons).
 */
const PAGE_SIZE = 50;

const humanize = (s: string) => s.split('_').join(' ').replace(/\b\w/g, c => c.toUpperCase());

export const AuditLogsPanel: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [options, setOptions] = useState<AuditLogFilterOptions>({ entity_types: [], actions: [], users: [] });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marketingAPI.getAuditLogFilters().then(setOptions).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

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
      if (id === requestId.current) setLoading(false);
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
    setSearch(''); setDebouncedSearch(''); setFrom(''); setTo(''); setEntityType(''); setAction(''); setEmployeeId('');
  };

  const columns = useMemo<Column<AuditLog>[]>(() => [
    {
      key: 'created_at',
      label: 'Date & Time',
      width: 140,
      render: (log) => (
        <div>
          <div className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase leading-none mb-1">
            {new Date(log.created_at).toLocaleDateString('en-GB')}
          </div>
          <div className="text-xs font-semibold text-slate-700 leading-none">
            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
    {
      key: 'employee_name',
      label: 'User',
      width: 200,
      render: (log) => {
        const name = log.employee_name || 'System';
        return (
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[150px] leading-tight" title={name}>{name}</span>
          </div>
        );
      }
    },
    {
      key: 'action',
      label: 'Action',
      width: 100,
      align: 'center',
      render: (log) => {
        const a = log.action?.toLowerCase() || '';
        const isDanger = a.includes('delete') || a.includes('remove');
        const isSuccess = a.includes('create') || a.includes('add') || a.includes('won') || a.includes('convert');
        return (
          <span className={cn(
            'inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border',
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
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider mt-0.5">
            {log.entity_type ? log.entity_type.split('_').join(' ') : 'System'}
          </span>
          <div className="min-w-0">
            {log.entity_label && (
              <p className="text-xs font-semibold text-slate-800 leading-normal">{log.entity_label}</p>
            )}
            {(() => {
              // "<what happened> — <change>; <change>" → the summary, then the changes as a list.
              const { summary, changes } = splitAuditDetails(log.details);
              return (
                <>
                  <span className="text-xs text-slate-600 font-medium leading-normal break-words whitespace-normal" title={log.details || ''}>
                    {summary || `ID: ${log.entity_id || 'n/a'}`}
                  </span>
                  {changes.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {changes.map((c, i) => (
                        <li key={i} className="text-[11px] text-slate-500 leading-snug break-words pl-2 border-l-2 border-slate-200">{c}</li>
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
  ], []);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-end gap-3">
        <SearchInput
          placeholder="Search user, action, lead name, details… (words in any order)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          containerClassName="w-full sm:w-80 shadow-none"
          inputSize="sm"
        />
        <div className="w-40"><DatePicker label="From" value={from} onChange={v => setFrom(v || '')} inputSize="sm" maxDate={to || undefined} /></div>
        <div className="w-40"><DatePicker label="To" value={to} onChange={v => setTo(v || '')} inputSize="sm" minDate={from || undefined} /></div>
        <div className="w-40">
          <Select label="Type" options={[{ value: '', label: 'All types' }, ...options.entity_types.map(t => ({ value: t, label: humanize(t) }))]}
            value={entityType} onChange={v => setEntityType(v ? String(v) : '')} placeholder="All types" />
        </div>
        <div className="w-36">
          <Select label="Action" options={[{ value: '', label: 'All actions' }, ...options.actions.map(a => ({ value: a, label: humanize(a) }))]}
            value={action} onChange={v => setAction(v ? String(v) : '')} placeholder="All actions" />
        </div>
        <div className="w-48">
          <Select label="User" options={[{ value: '', label: 'All users' }, ...options.users.map(u => ({ value: String(u.id), label: u.name }))]}
            value={employeeId} onChange={v => setEmployeeId(v ? String(v) : '')} placeholder="All users" searchable />
        </div>
        {anyFilter && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
      </div>

      <p className="text-xs text-slate-500">
        {loading && page === 1 ? 'Loading…' : <>Showing <span className="font-semibold text-slate-700">{logs.length}</span> of <span className="font-semibold text-slate-700">{total}</span> entries</>}
      </p>

      <DataTable<AuditLog>
        bordered
        data={logs}
        rowKey={(l) => l.id}
        dense
        isLoading={loading && page === 1}
        columns={columns}
      />

      <div ref={sentinelRef} className="py-4 text-center text-xs text-slate-400">
        {hasMore ? (loading ? 'Loading more…' : 'Scroll for more') : logs.length > 0 ? 'End of log' : null}
      </div>
    </div>
  );
};
