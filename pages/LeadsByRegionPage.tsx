import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronLeft, Download, Search, X } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import {
  marketingAPI, LeadsByRegionResponse, Domain, Region, LeadStatusOption, ReportScopeResponse,
} from '../lib/marketing-api';
import { PERIOD_OPTIONS, PeriodKey, periodLabel, periodRange } from '../lib/period-ranges';
import { formatINRShort, regionReportToCsv } from '../lib/region-report';
import { useApp } from '../App';

/**
 * Reports → Leads by Region: every lead in the period grouped by region, with each region's totals
 * (leads, quotations sent + value, won + value) and filters. Same numbers as the dashboard widget
 * (one API: /api/leads-by-region/, rules in au-marketing-api/app/region_report.py).
 * URL keeps the filters: ?period=quarter|month|year|all|custom&from&to&domain_id&region_id&status_id&owner&q
 */
type Period = PeriodKey | 'custom';

const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export const LeadsByRegionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [params, setParams] = useSearchParams();

  const period = (params.get('period') as Period) || 'quarter';
  const customFrom = params.get('from') || '';
  const customTo = params.get('to') || '';
  const domainId = num(params.get('domain_id'));
  const regionId = num(params.get('region_id'));
  const statusId = num(params.get('status_id'));
  const ownerId = num(params.get('owner'));
  const q = params.get('q') || '';

  const [searchText, setSearchText] = useState(q);
  const [data, setData] = useState<LeadsByRegionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [statuses, setStatuses] = useState<LeadStatusOption[]>([]);
  const [scope, setScope] = useState<ReportScopeResponse | null>(null);

  const setParam = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' ? next.delete(k) : next.set(k, String(v))));
    setParams(next, { replace: true });
  };

  // Filter choices (loaded once).
  useEffect(() => {
    marketingAPI.getDomains({ page_size: 100, is_active: true }).then(r => setDomains(r.items)).catch(() => {});
    marketingAPI.getRegions({ page_size: 100, is_active: true }).then(r => setRegions(r.items)).catch(() => {});
    marketingAPI.getLeadStatuses({ is_active: true }).then(setStatuses).catch(() => {});
    marketingAPI.getReportsScope().then(setScope).catch(() => {});
  }, []);

  // Debounce the search box into the URL.
  useEffect(() => {
    const t = setTimeout(() => { if (searchText !== q) setParam({ q: searchText.trim() || undefined }); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const range = useMemo(
    () => (period === 'custom' ? { date_from: customFrom || undefined, date_to: customTo || undefined } : periodRange(period)),
    [period, customFrom, customTo]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    marketingAPI
      .getLeadsByRegion({
        ...range, domain_id: domainId, region_id: regionId, status_id: statusId,
        assigned_to: ownerId != null ? [ownerId] : undefined, search: q || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // Open everything when there are only a few regions (or one was picked).
        setOpen(new Set(res.regions.length <= 3 ? res.regions.map(r => String(r.region_id)) : []));
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, domainId, regionId, statusId, ownerId, q]);

  const regionOptions = useMemo(
    () => regions.filter(r => domainId == null || r.domain_id === domainId).map(r => ({ value: r.id, label: r.name })),
    [regions, domainId]
  );

  const toggle = (key: string) => setOpen(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const downloadCsv = () => {
    if (!data) return;
    const blob = new Blob([`﻿${regionReportToCsv(data.regions)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-by-region-${range.date_from || 'all'}-${range.date_to || 'time'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded', 'success');
  };

  const hasFilters = domainId != null || regionId != null || statusId != null || ownerId != null || !!q;
  const periodText = period === 'custom'
    ? `${customFrom || '…'} to ${customTo || '…'}`
    : periodLabel(period);

  const th = 'px-3 py-2 text-right font-semibold';
  const td = 'px-3 py-2 text-right tabular-nums';

  return (
    <PageLayout
      title="Leads by Region"
      description="Every lead created, quoted or won in the period, grouped by region. Quotations count once at their latest price, in the period they were first sent; won leads count by Won date with the Won amount."
      breadcrumbs={[{ label: 'Reports', href: '/reports' }, { label: 'Leads by Region', href: '/reports/leads-by-region' }]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/reports')} className="flex items-center gap-1 text-slate-600">
            <ChevronLeft size={16} /> Reports
          </Button>
          <Button variant="outline" onClick={downloadCsv} disabled={!data || data.totals.lead_count === 0} className="flex items-center gap-2">
            <Download size={15} /> Download CSV
          </Button>
        </div>
      }
    >
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <Select
            label="Period"
            value={period}
            onChange={(v) => setParam({ period: (v as string) || 'quarter', from: undefined, to: undefined })}
            options={[...PERIOD_OPTIONS, { value: 'custom', label: 'Custom dates' }]}
            searchable={false}
          />
          <Select
            label="Domain"
            value={domainId ?? ''}
            onChange={(v) => setParam({ domain_id: v === '' || v == null ? undefined : Number(v), region_id: undefined })}
            options={domains.map(d => ({ value: d.id, label: d.name }))}
            placeholder="All domains"
            clearable
          />
          <Select
            label="Region"
            value={regionId ?? ''}
            onChange={(v) => setParam({ region_id: v === '' || v == null ? undefined : Number(v) })}
            options={regionOptions}
            placeholder="All regions"
            clearable
            searchable
          />
          <Select
            label="Status"
            value={statusId ?? ''}
            onChange={(v) => setParam({ status_id: v === '' || v == null ? undefined : Number(v) })}
            options={statuses.map(s => ({ value: s.id, label: s.label }))}
            placeholder="All statuses"
            clearable
          />
          {scope?.can_select_employee ? (
            <Select
              label="Owner"
              value={ownerId ?? ''}
              onChange={(v) => setParam({ owner: v === '' || v == null ? undefined : Number(v) })}
              options={scope.employees.map(e => ({ value: e.id, label: e.name }))}
              placeholder="Everyone"
              clearable
              searchable
            />
          ) : <div className="hidden lg:block" />}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 ml-0.5">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Name, company, lead / quote no."
                className="w-full h-10 pl-8 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-3 [&_label]:block">
            <DatePicker label="From" value={customFrom} onChange={(v) => setParam({ from: v || undefined })} />
            <DatePicker label="To" value={customTo} onChange={(v) => setParam({ to: v || undefined })} />
          </div>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearchText(''); setParam({ domain_id: undefined, region_id: undefined, status_id: undefined, owner: undefined, q: undefined }); }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Grand totals */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: `Leads · ${periodText}`, value: String(data.totals.lead_count) },
            { label: 'Quotations sent', value: String(data.totals.quotation_count) },
            { label: 'Quotation value', value: formatINRShort(data.totals.quotation_value), cls: 'text-blue-700' },
            { label: 'Won leads', value: String(data.totals.won_count) },
            { label: 'Won value', value: formatINRShort(data.totals.won_value), cls: 'text-emerald-700' },
          ].map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{k.label}</p>
              <p className={`text-xl font-bold tabular-nums mt-1 ${k.cls || 'text-slate-900'}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /> Loading…
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-rose-600">{error}</div>
      ) : !data || data.regions.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">No leads match these filters in this period.</div>
      ) : (
        <>
          <div className="flex justify-end gap-3 mb-2 text-xs font-semibold">
            <button type="button" className="text-blue-600 hover:underline" onClick={() => setOpen(new Set(data.regions.map(r => String(r.region_id))))}>Expand all</button>
            <button type="button" className="text-blue-600 hover:underline" onClick={() => setOpen(new Set())}>Collapse all</button>
          </div>
          <div className="space-y-3">
            {data.regions.map((g) => {
              const key = String(g.region_id);
              const isOpen = open.has(key);
              return (
                <div key={key} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="w-full flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 text-left hover:bg-slate-50/80"
                  >
                    <span className="flex items-center gap-2 min-w-[12rem] flex-1">
                      {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                      <span>
                        <span className="font-bold text-slate-900">{g.region_name}</span>
                        {g.domain_name && <span className="ml-2 text-xs text-slate-400">{g.domain_name}</span>}
                      </span>
                    </span>
                    <span className="text-xs text-slate-600"><b className="text-slate-900">{g.lead_count}</b> leads</span>
                    <span className="text-xs text-slate-600"><b className="text-slate-900">{g.quotation_count}</b> quotes · <b className="text-blue-700">{formatINRShort(g.quotation_value)}</b></span>
                    <span className="text-xs text-slate-600"><b className="text-slate-900">{g.won_count}</b> won · <b className="text-emerald-700">{formatINRShort(g.won_value)}</b></span>
                  </button>
                  {isOpen && (
                    <div className="overflow-x-auto border-t border-slate-200">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <th className="px-3 py-2 text-left font-semibold">Lead</th>
                            <th className="px-3 py-2 text-left font-semibold">Status</th>
                            <th className="px-3 py-2 text-left font-semibold">Owner</th>
                            <th className={th}>Quotes sent</th>
                            <th className={th}>Quote value</th>
                            <th className={th}>Won value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {g.leads.map((l) => (
                            <tr key={l.lead_id} className="hover:bg-slate-50/60">
                              <td className="px-3 py-2">
                                <Link to={`/leads/${l.lead_id}/edit`} className="font-semibold text-blue-700 hover:underline">{l.name}</Link>
                                {l.company && <span className="block text-[11px] text-slate-400">{l.company}</span>}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{l.status_label || '—'}</td>
                              <td className="px-3 py-2 text-slate-700">{l.owner_name || '—'}</td>
                              <td className={td}>{l.quotation_count || '—'}</td>
                              <td className={`${td} text-blue-700`}>{l.quotation_value ? formatINRShort(l.quotation_value) : '—'}</td>
                              <td className={`${td} text-emerald-700`}>{l.won ? formatINRShort(l.won_value) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </PageLayout>
  );
};

export default LeadsByRegionPage;
