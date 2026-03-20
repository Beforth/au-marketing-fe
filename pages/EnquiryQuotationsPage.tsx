/**
 * Quotations (enquiry attachments) – search, filter, and sort are done on the API.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { marketingAPI, QuotationListItem, QuotationLeadOption } from '../lib/marketing-api';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Download, ExternalLink, Loader2, Search } from 'lucide-react';

type SortField = 'quotation_number' | 'file_name' | 'lead_name' | 'inquiry_number' | 'activity_date';
type SortOrder = 'asc' | 'desc';

const SEARCH_DEBOUNCE_MS = 300;

export const EnquiryQuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const canViewLead = useAppSelector(selectHasPermission('marketing.view_lead'));
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [leadOptions, setLeadOptions] = useState<QuotationLeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterLeadId, setFilterLeadId] = useState<number | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('quotation_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!canViewLead) return;
    marketingAPI.getQuotationLeadOptions().then(setLeadOptions).catch(() => setLeadOptions([]));
  }, [canViewLead]);

  useEffect(() => {
    if (!canViewLead) return;
    setLoading(true);
    marketingAPI
      .getMyQuotations({
        search: searchQuery.trim() || undefined,
        lead_id: filterLeadId === '' ? undefined : filterLeadId,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      .then(setQuotations)
      .catch(() => setQuotations([]))
      .finally(() => setLoading(false));
  }, [canViewLead, searchQuery, filterLeadId, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const handleDownload = (leadId: number, activityId: number, attachmentId: number, fileName: string) => {
    marketingAPI.downloadLeadActivityAttachment(leadId, activityId, attachmentId, fileName);
  };

  if (!canViewLead) {
    return (
      <PageLayout title="Quotations" description="Quotations uploaded in enquiry logs." breadcrumbs={[{ label: 'Quotations', href: '/quotations' }]}>
        <p className="text-sm text-slate-500">You do not have permission to view quotations.</p>
      </PageLayout>
    );
  }

  const breadcrumbs = [{ label: 'Quotations', href: '/quotations' }];
  return (
    <PageLayout
      title="Quotations"
      description="Quotations you uploaded in enquiry logs. Each row shows the lead and inquiry it belongs to."
      breadcrumbs={breadcrumbs}
    >
      <Card>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : quotations.length === 0 ? (
          <p className="py-8 text-sm text-slate-500">No quotations yet. Add quotations in a lead’s History tab (enquiry log).</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="min-w-[200px] max-w-[280px]">
                <Input
                  placeholder="Search quotation no., file, lead, inquiry…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  inputSize="sm"
                  containerClassName="!space-y-0"
                  icon={<Search size={14} className="text-slate-400" />}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Lead</label>
                <Select
                  options={[
                    { value: '', label: 'All leads' },
                    ...leadOptions.map((opt) => ({
                      value: String(opt.lead_id),
                      label: [opt.lead_series, opt.lead_name].filter(Boolean).join(' – ') || `Lead #${opt.lead_id}`,
                    })),
                  ]}
                  value={filterLeadId === '' ? '' : String(filterLeadId)}
                  onChange={(val) => setFilterLeadId(val === '' ? '' : Number(val))}
                  className="min-w-[180px]"
                  searchable={true}
                  clearable={false}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Sort by</label>
                <Select
                  options={[
                    { value: 'quotation_number', label: 'Quotation no.' },
                    { value: 'file_name', label: 'File name' },
                    { value: 'lead_name', label: 'Lead' },
                    { value: 'inquiry_number', label: 'Inquiry #' },
                    { value: 'activity_date', label: 'Date' },
                  ]}
                  value={sortBy}
                  onChange={(val) => setSortBy((val as SortField) ?? 'quotation_number')}
                  className="min-w-[130px]"
                  searchable={false}
                  clearable={false}
                />
                <Select
                  options={[
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' },
                  ]}
                  value={sortOrder}
                  onChange={(val) => setSortOrder((val as SortOrder) ?? 'asc')}
                  className="min-w-[120px]"
                  searchable={false}
                  clearable={false}
                />
              </div>
              {(searchInput.trim() || filterLeadId !== '' || dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setFilterLeadId('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Showing {quotations.length} quotation{quotations.length !== 1 ? 's' : ''}.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 pr-4 font-semibold text-slate-700">Quotation no.</th>
                  <th className="pb-2 pr-4 font-semibold text-slate-700">File</th>
                  <th className="pb-2 pr-4 font-semibold text-slate-700">Lead</th>
                  <th className="pb-2 pr-4 font-semibold text-slate-700">Date</th>
                  <th className="pb-2 pr-4 font-semibold text-slate-700">Inquiry</th>
                  <th className="pb-2 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
                <tbody>
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {searchQuery.trim() || filterLeadId !== '' || dateFrom || dateTo ? 'No quotations match the current filters.' : 'No quotations yet. Add quotations in a lead\'s History tab (enquiry log).'}
                      </td>
                    </tr>
                  ) : (
                    quotations.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{q.quotation_number || '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{q.file_name}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-slate-700">{q.lead_series || '—'}</span>
                      <span className="text-slate-500 ml-1">({q.lead_name || '—'})</span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {q.activity_date ? new Date(q.activity_date).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-slate-700">#{q.inquiry_number ?? '—'}</span>
                      <span className="text-slate-500 ml-1 truncate max-w-[120px] inline-block" title={q.activity_title}>
                        {q.activity_title}
                      </span>
                    </td>
                    <td className="py-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(q.lead_id, q.activity_id, q.id, q.file_name)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                      >
                        <Download size={14} /> Download
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/leads/${q.lead_id}/edit?tab=enquiry`)}
                        className="inline-flex items-center gap-1 text-slate-600 hover:underline"
                        title="Open lead enquiry"
                      >
                        <ExternalLink size={14} /> Lead
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
    </PageLayout>
  );
};
