import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { marketingAPI, Lead, leadDisplayName, leadDisplayCompany } from '../lib/marketing-api';
import { formatINRShort } from '../lib/region-report';
import { useApp } from '../App';
import { getSubmissionDeadline } from '../lib/deadline-utils';
import { AlertCircle, ArrowLeft, Calendar, Check, Search } from 'lucide-react';

const daysAgo = (iso?: string | null): number | null => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null);
const shortDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null);
const agoText = (d: number) => (d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`);

export const ExpectedOrderNewPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [plannedIds, setPlannedIds] = useState<Set<number>>(new Set());   // already in this month's plan
  const [statusFilter, setStatusFilter] = useState('');
  const [closingSoon, setClosingSoon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nextMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  })();

  const deadline = getSubmissionDeadline();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketingAPI.getLeads({
        page: 1,
        page_size: 100,
        no_limit: true,
        is_hot: true,
        search: search.trim() || undefined,
      });
      setLeads(res.items);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to load leads', 'error');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    marketingAPI.getPlannedLeadIds(nextMonth.year, nextMonth.month).then((ids) => setPlannedIds(new Set(ids))).catch(() => setPlannedIds(new Set()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusOptions = useMemo(() => [...new Set(leads.map((l) => l.status_option?.label).filter(Boolean) as string[])], [leads]);
  const visibleLeads = useMemo(() => leads.filter((l) => {
    if (statusFilter && l.status_option?.label !== statusFilter) return false;
    if (closingSoon) {
      const d = l.expected_closing_date ? (new Date(l.expected_closing_date).getTime() - Date.now()) / 86400000 : null;
      if (d === null || d > 30) return false;
    }
    return true;
  }), [leads, statusFilter, closingSoon]);
  const selectable = useMemo(() => visibleLeads.filter((l) => !plannedIds.has(l.id)), [visibleLeads, plannedIds]);
  const selectedLeads = useMemo(() => leads.filter((l) => selectedIds.has(l.id)), [leads, selectedIds]);
  const selectedPotential = selectedLeads.reduce((a, l) => a + (Number(l.potential_value) || 0), 0);

  const toggleLead = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectable.length > 0 && selectable.every((l) => selectedIds.has(l.id))) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectable.map((l) => l.id)));
  };

  const handleSubmit = async () => {
    if (deadline.isPast) {
      showToast(deadline.message, 'error');
      return;
    }
    if (selectedIds.size === 0 || selectedLeads.length === 0) {
      showToast('Select at least one lead', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await marketingAPI.createExpectedOrderReport({
        year: nextMonth.year,
        month: nextMonth.month,
        lead_ids: Array.from(selectedIds),
      });
      showToast('Added to your expected order', 'success');
      navigate('/reports');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'MIS', href: '/reports' },
    { label: 'Create expected order', href: '/reports/expected-order/new' },
  ];

  return (
    <PageLayout
      title="Create expected order (next month)"
      description="Pick the leads you expect to close next month. A lead you already added is greyed out, and you can't add it twice. Only hot leads are shown."
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/reports')}>
          Back
        </Button>
      }
    >
      <div className={`mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${deadline.isPast ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
        <AlertCircle size={16} className="shrink-0" />
        <span>{deadline.message}</span>
      </div>
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar size={18} />
            <span className="font-medium">
              {new Date(nextMonth.year, nextMonth.month - 1).toLocaleString('default', { month: 'long' })} {nextMonth.year} ({String(nextMonth.month).padStart(2, '0')}/{nextMonth.year})
            </span>
          </div>
          <div className="flex-1 min-w-[200px] max-w-[280px]">
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              inputSize="sm"
              containerClassName="!space-y-0"
              icon={<Search size={14} className="text-slate-400" />}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-slate-500">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <p className="py-8 text-slate-500">No leads found. Add leads first or adjust the search.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="w-52">
                <Select
                  options={statusOptions.map((st) => ({ value: st, label: st }))}
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v !== undefined && v !== '' ? String(v) : '')}
                  placeholder="All stages"
                  searchable={false}
                  clearable
                  inputSize="sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={closingSoon} onChange={(e) => setClosingSoon(e.target.checked)} className="rounded border-slate-300 text-blue-600" />
                Closing within 30 days
              </label>
              <div className="flex-1" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectable.length > 0 && selectable.every((l) => selectedIds.has(l.id))} onChange={toggleAll} className="rounded border-slate-300 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Select all ({selectable.length})</span>
              </label>
            </div>

            {visibleLeads.length === 0 && <p className="py-8 text-center text-slate-500">No leads match these filters.</p>}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {visibleLeads.map((lead) => {
                const planned = plannedIds.has(lead.id);
                const selected = selectedIds.has(lead.id);
                const closing = lead.expected_closing_date;
                const closeDays = closing ? Math.ceil((new Date(closing).getTime() - Date.now()) / 86400000) : null;
                const last = daysAgo(lead.last_activity_date);
                const follow = shortDate(lead.next_follow_up_at);
                const sub = [lead.plant?.plant_name, lead.region?.name, lead.lead_type_option?.label].filter(Boolean).join(' · ');
                const color = lead.status_option?.hex_color || '#64748b';
                return (
                  <div
                    key={lead.id}
                    role="button"
                    tabIndex={planned ? -1 : 0}
                    onClick={() => !planned && toggleLead(lead.id)}
                    onKeyDown={(e) => { if (!planned && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleLead(lead.id); } }}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      planned ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : selected ? 'border-blue-500 bg-blue-50 cursor-pointer' : 'border-slate-200 bg-white hover:bg-slate-50 cursor-pointer'}`}
                  >
                    <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${planned ? 'border-emerald-400 bg-emerald-100 text-emerald-600' : selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                      {(planned || selected) && <Check size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold text-slate-900">{leadDisplayName(lead) || `Lead #${lead.id}`}</span>
                        <span className="text-slate-600">{leadDisplayCompany(lead) || ''}</span>
                        {lead.series && <span className="text-xs text-slate-400">{lead.series}</span>}
                      </div>
                      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5 text-xs text-slate-500">
                        {closing && (
                          <span className={closeDays !== null && closeDays < 0 ? 'text-rose-600 font-semibold' : ''}>
                            Closing {shortDate(closing)}{closeDays !== null && closeDays < 0 ? ' · overdue' : closeDays !== null && closeDays <= 14 ? ` · in ${closeDays} day${closeDays === 1 ? '' : 's'}` : ''}
                          </span>
                        )}
                        {last !== null && <span className={last >= 14 ? 'text-amber-600 font-semibold' : ''}>Last activity {agoText(last)}</span>}
                        {last === null && <span className="text-amber-600">No activity yet</span>}
                        {follow && <span>Follow-up {follow}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${color}22`, color }}>{lead.status_option?.label ?? '—'}</span>
                      {lead.potential_value ? <div className="text-sm font-semibold text-slate-800 mt-1">{formatINRShort(Number(lead.potential_value))}</div> : null}
                      {lead.quote_value ? <div className="text-[11px] text-slate-500">Quoted {formatINRShort(Number(lead.quote_value))}</div> : null}
                      {planned && <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">In next month's plan</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 -mx-1 mt-4 flex flex-wrap items-center gap-3 bg-white border-t border-slate-200 px-1 pt-3">
              <Button
                size="sm"
                leftIcon={submitting ? <div className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" /> : <Check size={14} />}
                disabled={selectedIds.size === 0 || submitting || deadline.isPast}
                onClick={handleSubmit}
              >
                {submitting ? 'Adding…' : `Add ${selectedIds.size} lead${selectedIds.size === 1 ? '' : 's'} to expected order`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                Cancel
              </Button>
              <span className="text-sm text-slate-500">
                {selectedIds.size} selected{selectedPotential > 0 ? ` · ${formatINRShort(selectedPotential)} total potential` : ''}
                {plannedIds.size > 0 ? ` · ${plannedIds.size} already in your plan` : ''}
              </span>
            </div>
          </>
        )}
      </Card>
    </PageLayout>
  );
};
