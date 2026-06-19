/**
 * Quotations (enquiry attachments) – search, filter, and sort are done on the API.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { DataTable, Column } from '../components/ui/DataTable';
import { marketingAPI, QuotationListItem, QuotationLeadOption } from '../lib/marketing-api';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Download, ExternalLink } from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';

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

  const hasActiveFilters = !!(searchInput.trim() || filterLeadId !== '' || dateFrom || dateTo);

  const columns: Column<QuotationListItem>[] = [
    {
      key: 'quotation_number',
      label: 'Quotation No.',
      sortable: false,
      render: (q) => (
        <span className="font-semibold text-slate-800">{q.quotation_number || '—'}</span>
      ),
    },
    {
      key: 'file_name',
      label: 'File',
      sortable: false,
      render: (q) => (
        <span className="text-slate-600">{q.file_name}</span>
      ),
    },
    {
      key: 'lead_name',
      label: 'Lead',
      sortable: false,
      render: (q) => (
        <div className="flex items-center flex-wrap gap-1">
          <span className="font-semibold text-slate-800">{q.lead_series || '—'}</span>
          <span className="text-slate-500">({q.lead_name || '—'})</span>
        </div>
      ),
    },
    {
      key: 'activity_date',
      label: 'Date',
      sortable: false,
      render: (q) => (
        <span className="text-slate-600">
          {q.activity_date
            ? new Date(q.activity_date).toLocaleDateString(undefined, { dateStyle: 'short' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'inquiry_number',
      label: 'Inquiry',
      sortable: false,
      render: (q) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-slate-400 font-medium shrink-0">#{q.inquiry_number ?? '—'}</span>
          <Tooltip content={q.activity_title}>
            <span className="text-slate-500 truncate max-w-[150px] inline-block font-medium">
              {q.activity_title}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (q) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Download Quotation">
            <Button
              variant="ghost"
              size="xs"
              className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent transition-colors"
              onClick={() => handleDownload(q.lead_id, q.activity_id, q.id, q.file_name)}
            >
              <Download size={15} strokeWidth={2} />
            </Button>
          </Tooltip>
          <Tooltip content="Open Lead Details">
            <Button
              variant="ghost"
              size="xs"
              className="w-8 h-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-transparent transition-colors"
              onClick={() => navigate(`/leads/${q.lead_id}/edit?tab=enquiry`)}
            >
              <ExternalLink size={15} strokeWidth={2} />
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

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
      <Card noPadding contentClassName="py-0" className="overflow-hidden">
        {/* ── Command bar ─────────────────────────────────────────── */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Search</label>
            <SearchInput
              placeholder="Search quotation no., file..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onClear={() => setSearchInput('')}
              inputSize="sm"
              containerClassName="min-w-[200px] max-w-[280px]"
            />
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Filter by Lead</label>
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

          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">Sort by</label>
            <div className="flex items-center gap-2">
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
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setFilterLeadId('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xs text-blue-600 hover:underline self-end pb-1"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto self-end pb-1 text-xs text-slate-400 shrink-0">
            {!loading && `${quotations.length} quotation${quotations.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <DataTable<QuotationListItem>
          data={quotations}
          columns={columns}
          rowKey={(q) => q.id}
          isLoading={loading}
          bordered={false}
        />
      </Card>
    </PageLayout>
  );
};
