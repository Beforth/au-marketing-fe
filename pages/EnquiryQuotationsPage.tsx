/**
 * Quotations (enquiry attachments) – search, filter, and sort are done on the API.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { FilterPopover } from '../components/ui/FilterPopover';
import { Badge } from '../components/ui/Badge';
import { marketingAPI, QuotationListItem, QuotationFilterOptions, Domain, Region, Series, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Download, ExternalLink, Eye, AlertTriangle, Upload, SlidersHorizontal } from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { PdfPreviewModal } from '../components/ui/PdfPreviewModal';
import { useApp } from '../App';

type SortField = 'quotation_number' | 'file_name' | 'lead_name' | 'inquiry_number' | 'activity_date';
type SortOrder = 'asc' | 'desc';

const SEARCH_DEBOUNCE_MS = 300;

export const EnquiryQuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canViewLead = useAppSelector(selectHasPermission('marketing.view_lead'));
  const canFilterByDomainRegion = useAppSelector(selectHasPermission('marketing.admin'));
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<QuotationFilterOptions>({ industries: [], quote_series_codes: [] });
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterSeriesCode, setFilterSeriesCode] = useState('');
  const [filterDomainId, setFilterDomainId] = useState<number | ''>('');
  const [filterRegionId, setFilterRegionId] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortField>('quotation_number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reattachingId, setReattachingId] = useState<number | null>(null);
  const reattachInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const loadQuotations = () => {
    setLoading(true);
    marketingAPI
      .getMyQuotations({
        page,
        page_size: pageSize,
        search: searchQuery.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        industry: filterIndustry || undefined,
        quote_series_code: filterSeriesCode || undefined,
        domain_id: canFilterByDomainRegion && filterDomainId !== '' ? filterDomainId : undefined,
        region_id: canFilterByDomainRegion && filterRegionId !== '' ? filterRegionId : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      .then((res) => {
        // Guard against an older/mismatched API response shape (e.g. a backend that
        // hasn't picked up the paginated response yet) so the page can't crash on it.
        setQuotations(Array.isArray(res?.items) ? res.items : []);
        setTotal(res?.total ?? 0);
        setTotalPages(res?.total_pages ?? 0);
        setPage(res?.page ?? 1);
      })
      .catch(() => {
        setQuotations([]);
        setTotal(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  useEffect(() => {
    if (!canViewLead) return;
    marketingAPI.getQuotationFilterOptions().then(setFilterOptions).catch(() => setFilterOptions({ industries: [], quote_series_codes: [] }));
  }, [canViewLead]);

  useEffect(() => {
    if (!canViewLead) return;
    marketingAPI.getSeries({ page: 1, page_size: 100, is_active: true }).then((r) => setSeriesList(r.items)).catch(() => setSeriesList([]));
  }, [canViewLead]);

  useEffect(() => {
    if (!canViewLead || !canFilterByDomainRegion) return;
    marketingAPI.getDomains({ page_size: 100 }).then((res) => setDomains(res.items ?? [])).catch(() => setDomains([]));
  }, [canViewLead, canFilterByDomainRegion]);

  useEffect(() => {
    if (!canFilterByDomainRegion) return;
    marketingAPI
      .getRegions({ page_size: 100, domain_id: filterDomainId === '' ? undefined : filterDomainId })
      .then((res) => setRegions(res.items ?? []))
      .catch(() => setRegions([]));
  }, [canFilterByDomainRegion, filterDomainId]);

  useEffect(() => {
    if (!canViewLead) return;
    loadQuotations();
  }, [canViewLead, page, pageSize, searchQuery, dateFrom, dateTo, filterIndustry, filterSeriesCode, filterDomainId, filterRegionId, sortBy, sortOrder]);

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

  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  const handleDownload = (leadId: number, activityId: number, attachmentId: number, fileName: string) => {
    marketingAPI.downloadLeadActivityAttachment(leadId, activityId, attachmentId, fileName);
  };

  const handleViewFile = async (leadId: number, activityId: number, attachmentId: number, fileName: string) => {
    try {
      const url = await marketingAPI.getLeadActivityAttachmentUrl(leadId, activityId, attachmentId);
      setPreviewFile({ url, name: fileName });
    } catch (err: any) {
      console.error('Preview failed', err);
    }
  };

  const handleReattach = async (q: QuotationListItem, file: File) => {
    if (!file || file.size === 0) {
      showToast('Please select a file', 'error');
      return;
    }
    setReattachingId(q.id);
    try {
      await marketingAPI.reattachLeadActivityAttachment(q.lead_id, q.activity_id, q.id, file);
      showToast('File reattached successfully', 'success');
      loadQuotations();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reattach file', 'error');
    } finally {
      setReattachingId(null);
    }
  };

  const advancedFilterCount = [
    !!(dateFrom || dateTo),
    !!filterIndustry,
    !!filterSeriesCode,
    filterDomainId !== '' || filterRegionId !== '',
  ].filter(Boolean).length;

  const hasActiveFilters = !!searchInput.trim() || advancedFilterCount > 0;

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
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{q.file_name}</span>
          {q.media_exists === false && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle size={10} /> Media Missing
            </span>
          )}
        </div>
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
          {q.media_exists === false ? (
            <>
              <input
                type="file"
                className="hidden"
                ref={(el) => { if (el) reattachInputRefs.current.set(q.id, el); }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleReattach(q, file);
                  e.target.value = '';
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.csv,.txt"
              />
              <Tooltip content="Reattach missing file">
                <Button
                  variant="ghost"
                  size="xs"
                  className="w-8 h-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-transparent transition-colors"
                  disabled={reattachingId === q.id}
                  onClick={() => reattachInputRefs.current.get(q.id)?.click()}
                >
                  {reattachingId === q.id ? (
                    <span className="animate-spin w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full" />
                  ) : (
                    <Upload size={15} strokeWidth={2} />
                  )}
                </Button>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip content="Preview">
                <Button
                  variant="ghost"
                  size="xs"
                  className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent transition-colors"
                  onClick={() => handleViewFile(q.lead_id, q.activity_id, q.id, q.file_name)}
                >
                  <Eye size={15} strokeWidth={2} />
                </Button>
              </Tooltip>
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
            </>
          )}
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5">&nbsp;</label>
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setShowFilterPopover((v) => !v)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <SlidersHorizontal size={14} />
              Filters
              {advancedFilterCount > 0 && (
                <Badge variant="default" className="px-1.5 py-0 text-[10px] leading-4">
                  {advancedFilterCount}
                </Badge>
              )}
            </button>

            <FilterPopover
              isOpen={showFilterPopover}
              onClose={() => setShowFilterPopover(false)}
              triggerRef={filterButtonRef}
              panelClassName="w-[300px] p-3"
              onClear={() => {
                setDateFrom('');
                setDateTo('');
                setFilterIndustry('');
                setFilterSeriesCode('');
                setFilterDomainId('');
                setFilterRegionId('');
              }}
              onApply={() => setShowFilterPopover(false)}
            >
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1 block">Date range</label>
                  <div className="flex items-center gap-1.5">
                    <DatePicker
                      value={dateFrom}
                      onChange={(v) => setDateFrom(v || '')}
                      className="w-full h-8 text-xs"
                      placeholder="From"
                    />
                    <span className="text-slate-300 text-[10px] font-bold uppercase shrink-0">to</span>
                    <DatePicker
                      value={dateTo}
                      onChange={(v) => setDateTo(v || '')}
                      className="w-full h-8 text-xs"
                      placeholder="To"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1 block">Industry</label>
                    <Select
                      options={[
                        { value: '', label: 'All' },
                        ...filterOptions.industries.map((ind) => ({ value: ind, label: ind })),
                      ]}
                      value={filterIndustry}
                      onChange={(val) => setFilterIndustry((val as string) ?? '')}
                      className="w-full"
                      inputSize="sm"
                      searchable={true}
                      clearable={false}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1 block">Series</label>
                    <Select
                      options={[
                        { value: '', label: 'All' },
                        ...seriesList.map((s) => ({ value: s.code, label: `${s.name} (${s.code})` })),
                      ]}
                      value={filterSeriesCode}
                      onChange={(val) => setFilterSeriesCode((val as string) ?? '')}
                      className="w-full"
                      inputSize="sm"
                      searchable={true}
                      clearable={false}
                      dropdownWidth="auto"
                    />
                  </div>
                </div>

                {canFilterByDomainRegion && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1 block">Domain <span className="normal-case font-medium">(admin)</span></label>
                      <Select
                        options={[
                          { value: '', label: 'All' },
                          ...domains.map((d) => ({ value: String(d.id), label: d.name })),
                        ]}
                        value={filterDomainId === '' ? '' : String(filterDomainId)}
                        onChange={(val) => {
                          setFilterDomainId(val === '' ? '' : Number(val));
                          setFilterRegionId('');
                        }}
                        className="w-full"
                        inputSize="sm"
                        searchable={true}
                        clearable={false}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-0.5 mb-1 block">Region <span className="normal-case font-medium">(admin)</span></label>
                      <Select
                        options={[
                          { value: '', label: 'All' },
                          ...regions.map((r) => ({ value: String(r.id), label: r.name })),
                        ]}
                        value={filterRegionId === '' ? '' : String(filterRegionId)}
                        onChange={(val) => setFilterRegionId(val === '' ? '' : Number(val))}
                        className="w-full"
                        inputSize="sm"
                        searchable={true}
                        clearable={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </FilterPopover>
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
                setDateFrom('');
                setDateTo('');
                setFilterIndustry('');
                setFilterSeriesCode('');
                setFilterDomainId('');
                setFilterRegionId('');
              }}
              className="text-xs text-blue-600 hover:underline self-end pb-1"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto self-end pb-1 text-xs text-slate-400 shrink-0">
            {!loading && `${total} quotation${total !== 1 ? 's' : ''}`}
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

        <div className="border-t border-slate-200 px-4 py-3">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        </div>
      </Card>

      <PdfPreviewModal
        isOpen={previewFile != null}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ''}
        fileName={previewFile?.name || ''}
      />
    </PageLayout>
  );
};
