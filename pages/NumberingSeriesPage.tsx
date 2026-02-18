/**
 * Numbering Series – list and create/edit with pattern builder and preview
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { DataTable } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import {
  marketingAPI,
  Series,
  SeriesCreateInput,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '../lib/marketing-api';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Hash,
  Copy,
  Search,
} from 'lucide-react';

const PLACEHOLDERS = [
  { label: 'Year (4)', value: '{YYYY}' },
  { label: 'Year (2)', value: '{YY}' },
  { label: 'Month', value: '{MM}' },
  { label: 'Day', value: '{DD}' },
  { label: 'Hour', value: '{HH}' },
  { label: 'Minute', value: '{mm}' },
  { label: 'Second', value: '{ss}' },
  { label: 'Counter 4', value: '{0:4}' },
  { label: 'Counter 5', value: '{0:5}' },
  { label: 'Counter 6', value: '{0:6}' },
  { label: 'Sub-series', value: '{S:code}' },
];

/** Client-side preview: replace placeholders with sample values (does not call API). */
function previewPattern(pattern: string, sampleNextValue: number = 1): string {
  const now = new Date();
  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  return pattern.replace(/\{([^}]+)\}/g, (_, key) => {
    const k = key.trim();
    if (k === 'YYYY') return String(now.getFullYear());
    if (k === 'YY') return String(now.getFullYear()).slice(-2);
    if (k === 'MM') return pad(now.getMonth() + 1, 2);
    if (k === 'DD') return pad(now.getDate(), 2);
    if (k === 'HH') return pad(now.getHours(), 2);
    if (k === 'mm') return pad(now.getMinutes(), 2);
    if (k === 'ss') return pad(now.getSeconds(), 2);
    if (k.startsWith('0:')) {
      const w = Math.min(20, Math.max(1, parseInt(k.slice(2), 10) || 4));
      return String(sampleNextValue).padStart(w, '0');
    }
    if (k.toUpperCase().startsWith('S:')) return `[${k.slice(2).trim() || 'code'}]`;
    return `{${key}}`;
  });
}

export const NumberingSeriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { showToast } = useApp();
  const isNewForm = location.pathname.endsWith('/new');
  const isEditForm = location.pathname.includes('/edit') && id != null;
  const isForm = isNewForm || isEditForm;
  const isEdit = isEditForm;

  // Numbering series uses marketing.admin (current HRMS has no marketing.series.* permissions)
  const canView = useAppSelector(selectHasPermission('marketing.admin'));
  const canCreate = useAppSelector(selectHasPermission('marketing.admin'));
  const canEdit = useAppSelector(selectHasPermission('marketing.admin'));
  const canDelete = useAppSelector(selectHasPermission('marketing.admin'));
  const canGenerate = useAppSelector(selectHasPermission('marketing.admin'));

  const [list, setList] = useState<Series[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [generatedValue, setGeneratedValue] = useState<string | null>(null);

  // Form state (when isForm)
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formEntityType, setFormEntityType] = useState<string>('');
  const [formNextValue, setFormNextValue] = useState(1);
  const [formActive, setFormActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!canView && !isForm) return;
    if (isForm) {
      if (isEdit && id) loadSeriesForEdit();
      else if (isNewForm) resetForm();
      return;
    }
    loadList();
  }, [canView, isForm, isEdit, isNewForm, id, debouncedSearch, filterActive, page, pageSize]);

  const loadList = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getSeries({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        is_active: filterActive !== null ? filterActive : undefined,
      });
      setList(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: any) {
      showToast(e.message || 'Failed to load series', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSeriesForEdit = async () => {
    if (!id || id === 'new') return;
    setFormLoading(true);
    try {
      const s = await marketingAPI.getSeriesById(parseInt(id));
      setFormName(s.name);
      setFormCode(s.code);
      setFormPattern(s.pattern);
      setFormEntityType(s.entity_type ?? '');
      setFormNextValue(s.next_value);
      setFormActive(s.is_active);
    } catch (e: any) {
      showToast(e.message || 'Failed to load series', 'error');
      navigate('/numbering-series');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormPattern('');
    setFormEntityType('');
    setFormNextValue(1);
    setFormActive(true);
  };

  const insertPlaceholder = (value: string) => {
    setFormPattern((p) => p + value);
  };

  const preview = useMemo(
    () => previewPattern(formPattern, formNextValue),
    [formPattern, formNextValue]
  );

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim() || !formPattern.trim()) {
      showToast('Name, code and pattern are required', 'error');
      return;
    }
    setFormSaving(true);
    try {
      if (isEdit && id) {
        await marketingAPI.updateSeries(parseInt(id), {
          name: formName.trim(),
          code: formCode.trim(),
          pattern: formPattern.trim(),
          entity_type: formEntityType || undefined,
          next_value: formNextValue,
          is_active: formActive,
        });
        showToast('Series updated', 'success');
      } else {
        await marketingAPI.createSeries({
          name: formName.trim(),
          code: formCode.trim(),
          pattern: formPattern.trim(),
          entity_type: formEntityType || undefined,
          next_value: formNextValue,
          is_active: formActive,
        });
        showToast('Series created', 'success');
      }
      navigate('/numbering-series');
    } catch (e: any) {
      showToast(e.message || 'Save failed', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await marketingAPI.deleteSeries(deleteId);
      showToast('Series deleted', 'success');
      setDeleteId(null);
      loadList();
    } catch (e: any) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  const handleGenerateNext = async (seriesId: number) => {
    if (!canGenerate) {
      showToast('You do not have permission to generate numbers', 'error');
      return;
    }
    try {
      const res = await marketingAPI.generateNextSeriesNumber(seriesId);
      setGeneratedValue(res.generated_value);
      showToast(`Generated: ${res.generated_value}`, 'success');
      loadList();
    } catch (e: any) {
      showToast(e.message || 'Generate failed', 'error');
    }
  };

  const copyGenerated = () => {
    if (generatedValue) {
      navigator.clipboard.writeText(generatedValue);
      showToast('Copied to clipboard', 'success');
    }
  };

  if (!canView && !isForm) {
    return (
      <PageLayout title="Numbering Series">
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view numbering series.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.admin</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  if (isForm) {
    const canSave = isEdit ? canEdit : canCreate;
    const formBreadcrumbs = [
      { label: 'Numbering Series', href: '/numbering-series' },
      { label: isEdit ? 'Edit Numbering Series' : 'Create Numbering Series' },
    ];

    if (formLoading) {
      return (
        <PageLayout title={isEdit ? 'Edit Numbering Series' : 'Create Numbering Series'} breadcrumbs={formBreadcrumbs}>
          <Card>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-slate-600">Loading series...</p>
            </div>
          </Card>
        </PageLayout>
      );
    }

    return (
      <PageLayout
        title={isEdit ? 'Edit Numbering Series' : 'Create Numbering Series'}
        breadcrumbs={formBreadcrumbs}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/numbering-series')} leftIcon={<ArrowLeft size={14} />}>
            Back
          </Button>
        }
      >
        <Card>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Lead ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Code (unique) <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. lead_id"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Used for (entity type)</label>
              <Select
                value={formEntityType}
                onChange={(val) => setFormEntityType(String(val ?? ''))}
                options={[
                  { value: '', label: 'Generic' },
                  { value: 'contact', label: 'Contact' },
                  { value: 'customer', label: 'Customer' },
                  { value: 'lead', label: 'Lead' },
                  { value: 'enquiry', label: 'Enquiry' },
                ]}
                placeholder="Generic"
              />
              <p className="text-xs text-slate-500 mt-1">
                When set, you can use placeholders like {formEntityType ? `{${formEntityType}.company_name}` : '{customer.company_name}'} in the pattern when generating with context.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pattern <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PLACEHOLDERS.map((ph) => (
                  <button
                    key={ph.value}
                    type="button"
                    onClick={() => insertPlaceholder(ph.value)}
                    className="px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  >
                    {ph.label}
                  </button>
                ))}
              </div>
              <Input
                value={formPattern}
                onChange={(e) => setFormPattern(e.target.value)}
                placeholder="e.g. LEAD-{YYYY}{MM}-{0:4}"
              />
              <p className="text-xs text-slate-500 mt-1">
                Placeholders: YYYY, YY, MM, DD, HH, mm, ss, 0:N (counter), S:code (sub-series).
                With context: customer.id, customer.company_name, customer.domain_code, customer.region_code; contact.*; lead.id, lead.company, lead.domain_code, lead.region_code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Next value</label>
                <Input
                  type="number"
                  min={0}
                  value={formNextValue}
                  onChange={(e) => setFormNextValue(parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="series_is_active"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="series_is_active" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Preview</p>
              <p className="font-mono text-slate-800 break-all">{preview || '—'}</p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => navigate('/numbering-series')}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSave || formSaving}
              >
                {formSaving ? 'Saving...' : isEdit ? 'Update Numbering Series' : 'Create Numbering Series'}
              </Button>
            </div>
          </form>
        </Card>
      </PageLayout>
    );
  }

  const breadcrumbs = [{ label: 'Numbering Series' }];
  const actions = canCreate ? (
    <Button
      size="sm"
      onClick={() => navigate('/numbering-series/new')}
      leftIcon={<Plus size={14} strokeWidth={3} />}
    >
      Add Series
    </Button>
  ) : null;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <PageLayout title="Numbering Series" actions={actions} breadcrumbs={breadcrumbs}>
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            variant="white"
            inputSize="sm"
            className="rounded-full shadow-sm"
            icon={<Search size={14} strokeWidth={2.5} />}
            placeholder="Search name, code, pattern..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            containerClassName="max-w-md"
          />
          <Select
            value={filterActive === null ? '' : String(filterActive)}
            onChange={(val) => setFilterActive(val === '' || val === undefined ? null : String(val) === 'true')}
            options={[
              { value: '', label: 'All' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
            className="w-32"
          />
        </div>

        {generatedValue && (
          <Card className="p-3 flex items-center justify-between bg-indigo-50 border-indigo-200">
            <span className="font-mono text-indigo-900">{generatedValue}</span>
            <Button size="sm" variant="ghost" leftIcon={<Copy size={14} />} onClick={copyGenerated}>
              Copy
            </Button>
          </Card>
        )}

        <div className="mt-4">
          <Card noPadding contentClassName="py-6 px-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-slate-600">Loading numbering series...</p>
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-12">
                <Hash className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No numbering series found</p>
                {canCreate && (
                  <Button size="sm" className="mt-4" onClick={() => navigate('/numbering-series/new')}>
                    Add your first series
                  </Button>
                )}
              </div>
            ) : (
              <>
                <DataTable<Series>
                  data={list}
                  rowKey={(s) => s.id}
                  className="border-none"
                  columns={[
                    {
                      key: 'name',
                      label: 'Name',
                      render: (s) => <div className="font-medium text-slate-900">{s.name}</div>,
                    },
                    {
                      key: 'code',
                      label: 'Code',
                      render: (s) => <span className="font-mono text-sm text-slate-600">{s.code}</span>,
                    },
                    {
                      key: 'entity_type',
                      label: 'Used for',
                      render: (s) => (
                        <span className="text-slate-600 text-sm">
                          {s.entity_type ? s.entity_type.charAt(0).toUpperCase() + s.entity_type.slice(1) : 'Generic'}
                        </span>
                      ),
                    },
                    {
                      key: 'pattern',
                      label: 'Pattern',
                      render: (s) => (
                        <span className="font-mono text-sm text-slate-600 max-w-xs truncate block" title={s.pattern}>
                          {s.pattern}
                        </span>
                      ),
                    },
                    {
                      key: 'next_value',
                      label: 'Next',
                      render: (s) => <span className="text-slate-600">{s.next_value}</span>,
                    },
                    {
                      key: 'last_generated_at',
                      label: 'Last generated',
                      render: (s) => (
                        <span className="text-slate-500 text-sm">
                          {s.last_generated_at ? new Date(s.last_generated_at).toLocaleString() : '—'}
                        </span>
                      ),
                    },
                    {
                      key: 'is_active',
                      label: 'Status',
                      render: (s) =>
                        s.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        ),
                    },
                    {
                      key: 'actions',
                      label: '',
                      sortable: false,
                      align: 'right',
                      render: (s) => (
                        <div className="flex items-center justify-end gap-2">
                          {canGenerate && s.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleGenerateNext(s.id); }}
                              title="Generate next"
                            >
                              <Hash size={14} />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); navigate(`/numbering-series/${s.id}/edit`); }}
                            >
                              <Edit size={14} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }}
                              className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]}
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
              </>
            )}
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete series"
        message="Are you sure you want to delete this numbering series? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </PageLayout>
  );
};
