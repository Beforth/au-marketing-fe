import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { marketingAPI, Lead, leadDisplayName, leadDisplayCompany } from '../lib/marketing-api';
import { useApp } from '../App';
import { ArrowLeft, Calendar, Check, Loader2, Search } from 'lucide-react';

export const ExpectedOrderNewPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const nextMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  })();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marketingAPI.getLeads({
        page: 1,
        page_size: 100,
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

  const toggleLead = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map((l) => l.id)));
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
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
      showToast('Expected order report created', 'success');
      navigate('/reports');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Reports', href: '/reports' },
    { label: 'Create expected order', href: '/reports/expected-order/new' },
  ];

  return (
    <PageLayout
      title="Create expected order (next month)"
      description="Select leads as potential clients for next month. They will appear in your expected order report."
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/reports')}>
          Back
        </Button>
      }
    >
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar size={18} />
            <span className="font-medium">
              For {nextMonth.year} / {String(nextMonth.month).padStart(2, '0')} (next month)
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
            <Loader2 size={20} className="animate-spin" /> Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <p className="py-8 text-slate-500">No leads found. Add leads first or adjust the search.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === leads.length && leads.length > 0}
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm font-medium text-slate-700">Select all ({leads.length})</span>
              </label>
              <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="w-10 py-2 pl-3"></th>
                    <th className="text-left py-2 font-medium text-slate-600">Lead</th>
                    <th className="text-left py-2 font-medium text-slate-600">Company</th>
                    <th className="text-left py-2 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 ${selectedIds.has(lead.id) ? 'bg-indigo-50/50' : ''}`}
                    >
                      <td className="py-2 pl-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleLead(lead.id)}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                      </td>
                      <td className="py-2 font-medium text-slate-900">
                        {leadDisplayName(lead) || `#${lead.id}`}
                        {lead.series && <span className="text-slate-500 ml-1">({lead.series})</span>}
                      </td>
                      <td className="py-2 text-slate-600">{leadDisplayCompany(lead) || '—'}</td>
                      <td className="py-2 text-slate-600">{lead.status_option?.label ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button
                size="sm"
                leftIcon={submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                disabled={selectedIds.size === 0 || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Creating…' : `Create report with ${selectedIds.size} lead(s)`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Card>
    </PageLayout>
  );
};
