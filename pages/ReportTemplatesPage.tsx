import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { PageLayout } from '../components/layout/PageLayout';
import {
  marketingAPI,
  leadDisplayName,
  ReportTemplateResponse,
  ReportSection,
  ReportTemplateAssignmentResponse,
  AssignableUser,
  ReportTemplateEntityParams,
} from '../lib/marketing-api';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import {
  FileText,
  Plus,
  RefreshCw,
  UserPlus,
  Trash2,
  Edit3,
  Wand2,
} from 'lucide-react';

const AI_SCOPE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'employee', label: 'Employee scope' },
  { value: 'region', label: 'Region scope' },
  { value: 'domain', label: 'Domain scope' },
] as const;

export const ReportTemplatesPage: React.FC = () => {
  const { showToast } = useApp();
  const canViewLead = useAppSelector(selectHasPermission('marketing.view_lead'));
  const canCreateDashboard = useAppSelector(selectHasPermission('marketing.create_dashboard')) || useAppSelector(selectHasPermission('marketing.admin'));
  const canAssignDashboard = useAppSelector(selectHasPermission('marketing.assign_dashboard')) || useAppSelector(selectHasPermission('marketing.admin'));

  const [templates, setTemplates] = useState<ReportTemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [templateDetail, setTemplateDetail] = useState<ReportTemplateResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [entityFilters, setEntityFilters] = useState<Record<string, number | number[] | string>>({});
  const [entityOptions, setEntityOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [entityOptionsLoading, setEntityOptionsLoading] = useState<Record<string, boolean>>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignments, setAssignments] = useState<ReportTemplateAssignmentResponse[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [assignableLoading, setAssignableLoading] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState<string>('');
  const [assignCanEdit, setAssignCanEdit] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionSql, setSectionSql] = useState('SELECT id, name FROM leads LIMIT 100');
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [saveSectionsSubmitting, setSaveSectionsSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiScopeMode, setAiScopeMode] = useState<'auto' | 'employee' | 'region' | 'domain'>('auto');

  const loadTemplates = useCallback(async () => {
    if (!canViewLead) return;
    setLoading(true);
    try {
      const list = await marketingAPI.getReportTemplates();
      setTemplates(list);
      if (list.length > 0 && selectedId === null) setSelectedId(list[0].id);
      else if (list.length > 0 && !list.some((t) => t.id === selectedId)) setSelectedId(list[0].id);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load report templates', 'error');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [canViewLead, selectedId, showToast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const buildReportParams = useCallback((): ReportTemplateEntityParams => {
    const p: ReportTemplateEntityParams = {};
    if (dateFrom?.trim()) p.date_from = dateFrom.trim();
    if (dateTo?.trim()) p.date_to = dateTo.trim();
    const singleKeys = ['lead_id', 'domain_id', 'region_id', 'employee_id', 'contact_id', 'customer_id', 'organization_id', 'plant_id'] as const;
    const multiKeys = ['lead_ids', 'domain_ids', 'region_ids', 'contact_ids', 'customer_ids', 'organization_ids', 'plant_ids'] as const;
    for (const key of singleKeys) {
      const v = entityFilters[key];
      if (typeof v === 'number') (p as Record<string, number>)[key] = v;
    }
    for (const key of multiKeys) {
      const v = entityFilters[key];
      if (Array.isArray(v) && v.length) (p as Record<string, string>)[key] = v.join(',');
      else if (typeof v === 'string' && v.trim()) (p as Record<string, string>)[key] = v.trim();
    }
    return p;
  }, [dateFrom, dateTo, entityFilters]);

  const loadDetail = useCallback(async () => {
    if (selectedId == null) {
      setTemplateDetail(null);
      return;
    }
    setDetailLoading(true);
    try {
      const params = buildReportParams();
      const t = await marketingAPI.getReportTemplate(selectedId, Object.keys(params).length ? params : undefined);
      setTemplateDetail(t);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load report', 'error');
      setTemplateDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId, buildReportParams, showToast]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setEntityFilters((prev) => {
      const allowed = new Set(templateDetail?.placeholders ?? []);
      if (allowed.size === 0) return prev;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!allowed.has(k)) delete next[k];
      }
      return next;
    });
  }, [selectedId, (templateDetail?.placeholders ?? []).join(',')]);

  const placeholders = templateDetail?.placeholders ?? [];

  const placeholderLabel = (key: string): string => {
    const labels: Record<string, string> = {
      lead_id: 'Lead', lead_ids: 'Leads',
      domain_id: 'Domain', domain_ids: 'Domains',
      region_id: 'Region', region_ids: 'Regions',
      employee_id: 'Employee',
      contact_id: 'Contact', contact_ids: 'Contacts',
      customer_id: 'Customer', customer_ids: 'Customers',
      organization_id: 'Organization', organization_ids: 'Organizations',
      plant_id: 'Plant', plant_ids: 'Plants',
    };
    return labels[key] ?? key.replace(/_/g, ' ');
  };

  const isMultiPlaceholder = (key: string): boolean => key.endsWith('_ids');
  useEffect(() => {
    if (placeholders.length === 0) return;
    const load = async () => {
      const keys = placeholders.filter((k) => !entityOptions[k]?.length && !entityOptionsLoading[k]);
      for (const key of keys) {
        setEntityOptionsLoading((prev) => ({ ...prev, [key]: true }));
        try {
          if (key === 'lead_id' || key === 'lead_ids') {
            const res = await marketingAPI.getLeads({ page: 1, page_size: 150 });
            const items = res.items ?? [];
            setEntityOptions((prev) => ({ ...prev, [key]: items.map((l) => ({ value: String(l.id), label: (l.series ? `${l.series} – ${leadDisplayName(l)}` : leadDisplayName(l)) || `Lead #${l.id}` })) }));
          } else if (key === 'domain_id' || key === 'domain_ids') {
            const res = await marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 });
            const items = res.items ?? [];
            setEntityOptions((prev) => ({ ...prev, [key]: items.map((d) => ({ value: String(d.id), label: d.name })) }));
          } else if (key === 'region_id' || key === 'region_ids') {
            const res = await marketingAPI.getRegions({ is_active: true, page: 1, page_size: 200 });
            const items = res.items ?? [];
            setEntityOptions((prev) => ({ ...prev, [key]: items.map((r) => ({ value: String(r.id), label: r.name })) }));
          } else if (key === 'employee_id') {
            const users = await marketingAPI.getReportTemplateAssignableUsers();
            setEntityOptions((prev) => ({ ...prev, [key]: users.map((u) => ({ value: String(u.id), label: u.name })) }));
          } else if (key === 'contact_id' || key === 'contact_ids') {
            const res = await marketingAPI.getContacts({ page: 1, page_size: 150 });
            const items = res.items ?? [];
            setEntityOptions((prev) => ({ ...prev, [key]: items.map((c) => ({ value: String(c.id), label: (c.contact_person_name ?? c.contact_email ?? `Contact #${c.id}`).trim() || `Contact #${c.id}` })) }));
          } else if (key === 'customer_id' || key === 'customer_ids') {
            const res = await marketingAPI.getCustomers({ page: 1, page_size: 150 });
            const items = res.items ?? [];
            setEntityOptions((prev) => ({ ...prev, [key]: items.map((c) => ({ value: String(c.id), label: (c.company_name ?? `Customer #${c.id}`).trim() })) }));
          } else if (key === 'organization_id' || key === 'organization_ids') {
            const res = await marketingAPI.getOrganizations({ is_active: true, page: 1, page_size: 100 });
            const items = res.items ?? [];
            setEntityOptions((prev) => ({ ...prev, [key]: items.map((o) => ({ value: String(o.id), label: o.name })) }));
          } else if (key === 'plant_id' || key === 'plant_ids') {
            const plants = await marketingAPI.getPlants();
            setEntityOptions((prev) => ({ ...prev, [key]: plants.map((p) => ({ value: String(p.id), label: p.plant_name || `Plant #${p.id}` })) }));
          }
        } catch {
          setEntityOptions((prev) => ({ ...prev, [key]: [] }));
        } finally {
          setEntityOptionsLoading((prev) => ({ ...prev, [key]: false }));
        }
      }
    };
    load();
  }, [placeholders.join(',')]);

  const loadAssignments = useCallback(async () => {
    if (selectedId == null || !showAssignModal) return;
    try {
      const rows = await marketingAPI.getReportTemplateAssignments(selectedId);
      setAssignments(rows);
    } catch {
      setAssignments([]);
    }
  }, [selectedId, showAssignModal]);

  useEffect(() => {
    if (showAssignModal) {
      loadAssignments();
      setAssignableLoading(true);
      marketingAPI.getReportTemplateAssignableUsers()
        .then(setAssignableUsers)
        .catch(() => setAssignableUsers([]))
        .finally(() => setAssignableLoading(false));
    }
  }, [showAssignModal, loadAssignments]);

  const sections = (templateDetail?.config?.sections ?? []) as ReportSection[];
  const sectionData = templateDetail?.section_data ?? {};

  const handleCreateTemplate = async () => {
    if (!createName.trim()) return;
    setCreateSubmitting(true);
    try {
      const created = await marketingAPI.createReportTemplate({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        config: { sections: [] },
      });
      setTemplates((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setShowCreateModal(false);
      setCreateName('');
      setCreateDescription('');
      showToast('Report template created. Add sections (SQL) and assign to employees.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create template', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAddOrEditSection = () => {
    if (!templateDetail || !sectionSql.trim()) return;
    const newSection: ReportSection = {
      id: editSectionId || `section-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: sectionTitle.trim() || undefined,
      sql: sectionSql.trim(),
      display_order: sections.length,
    };
    const newSections = editSectionId
      ? sections.map((s) => (s.id === editSectionId ? newSection : s))
      : [...sections, newSection];
    setSaveSectionsSubmitting(true);
    marketingAPI
      .updateReportTemplate(templateDetail.id, { config: { sections: newSections } })
      .then((updated) => {
        setTemplateDetail(updated);
        setShowAddSectionModal(false);
        setEditSectionId(null);
        setSectionTitle('');
        setSectionSql('SELECT id, name FROM leads LIMIT 100');
        showToast(editSectionId ? 'Section updated' : 'Section added');
      })
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to save section', 'error'))
      .finally(() => setSaveSectionsSubmitting(false));
  };

  const openEditSection = (sec: ReportSection) => {
    setEditSectionId(sec.id);
    setSectionTitle(sec.title ?? '');
    setSectionSql(sec.sql);
    setShowAddSectionModal(true);
  };

  const removeSection = (sectionId: string) => {
    if (!templateDetail) return;
    const newSections = sections.filter((s) => s.id !== sectionId);
    setSaveSectionsSubmitting(true);
    marketingAPI
      .updateReportTemplate(templateDetail.id, { config: { sections: newSections } })
      .then((updated) => {
        setTemplateDetail(updated);
        showToast('Section removed');
      })
      .catch((e) => showToast(e instanceof Error ? e.message : 'Failed to remove section', 'error'))
      .finally(() => setSaveSectionsSubmitting(false));
  };

  const handleGenerateSectionWithAI = async () => {
    if (!aiPrompt.trim()) {
      showToast('Describe the report section for AI generation', 'error');
      return;
    }
    setAiGenerating(true);
    try {
      const schema = await marketingAPI.getSchema();
      const ai = await marketingAPI.generateWidgetWithAI({
        prompt: aiPrompt.trim(),
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        schema: (schema.tables || []).map((t) => ({
          name: t.name,
          columns: (t.columns || []).map((c) => ({ name: c.name, type: c.type })),
        })),
        scope_mode: aiScopeMode,
        preferred_chart: 'table',
      });
      setSectionTitle(ai.title || sectionTitle);
      setSectionSql(ai.sql || sectionSql);
      showToast('AI generated SQL. Review and add section.');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to generate with AI', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAssign = async () => {
    if (selectedId == null || !assignEmployeeId.trim()) return;
    const eid = parseInt(assignEmployeeId, 10);
    if (Number.isNaN(eid)) return;
    setAssigning(true);
    try {
      await marketingAPI.assignReportTemplate(selectedId, { assignee_employee_id: eid, can_edit: assignCanEdit });
      showToast('Template assigned');
      setAssignEmployeeId('');
      setAssignCanEdit(false);
      loadAssignments();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to assign', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedId);

  return (
    <PageLayout
      title="Report templates"
      description="Create templates with SQL-based sections (lists, totals, MIS). Assign to employees."
      breadcrumbs={[{ label: 'Report templates' }]}
    >
      {!canViewLead ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-slate-700">
          You don&apos;t have permission to view report templates.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              label="Template"
              value={selectedId != null ? String(selectedId) : ''}
              onChange={(v) => setSelectedId(v ? parseInt(String(v), 10) : null)}
              options={templates.map((t) => ({ value: String(t.id), label: t.name }))}
              placeholder="Select template"
            />
            <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={loadDetail}>
              Refresh
            </Button>
            {canCreateDashboard && (
              <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowCreateModal(true)}>
                New template
              </Button>
            )}
            {canAssignDashboard && selectedId != null && (
              <Button size="sm" variant="outline" leftIcon={<UserPlus size={14} />} onClick={() => setShowAssignModal(true)}>
                Assign
              </Button>
            )}
          </div>

          {placeholders.length > 0 && (
            <Card title="Report parameters" description="Filter by entity and dates per section. Optional.">
              <div className="flex flex-wrap items-end gap-3">
                {placeholders.map((key) => {
                  if (key === 'date_from') {
                    return (
                      <div key={key} className="min-w-[160px] max-w-[220px]">
                        <Input
                          label="From"
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                    );
                  }
                  if (key === 'date_to') {
                    return (
                      <div key={key} className="min-w-[160px] max-w-[220px]">
                        <Input
                          label="To"
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>
                    );
                  }
                  const multi = isMultiPlaceholder(key);
                  const options = entityOptions[key] ?? [];
                  const loading = entityOptionsLoading[key];
                  return (
                    <div key={key} className="min-w-[160px] max-w-[220px]">
                      {multi ? (
                        <Input
                          label={placeholderLabel(key)}
                          value={typeof entityFilters[key] === 'string' ? entityFilters[key] : ''}
                          onChange={(e) => setEntityFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder="e.g. 1,2,3"
                        />
                      ) : (
                        <Select
                          label={placeholderLabel(key)}
                          value={typeof entityFilters[key] === 'number' ? String(entityFilters[key]) : ''}
                          onChange={(v) => setEntityFilters((prev) => ({ ...prev, [key]: v ? parseInt(String(v), 10) : '' }))}
                          options={[{ value: '', label: '— Any —' }, ...options]}
                          placeholder={loading ? 'Loading...' : 'Select'}
                          searchable={options.length > 10}
                          disabled={loading}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {selectedTemplate && (
            <Card title={selectedTemplate.name} description={selectedTemplate.description ?? undefined}>
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={20} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  {templateDetail?.can_edit && (
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Plus size={14} />}
                        onClick={() => {
                          setEditSectionId(null);
                          setSectionTitle('');
                          setSectionSql('SELECT id, name FROM leads LIMIT 100');
                          setShowAddSectionModal(true);
                        }}
                      >
                        Add section
                      </Button>
                      <p className="text-xs text-slate-500">
                        Sections run SQL (placeholders: {'{{employee_id}}'}, {'{{date_from}}'}, {'{{date_to}}'}; or {'{{lead_id}}'}, {'{{domain_id}}'}, {'{{lead_ids}}'}, etc. for entity filters).{' '}
                        <Link to="/schema" className="text-indigo-600 hover:underline">Schema</Link>
                      </p>
                    </div>
                  )}
                  {sections.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">
                      No sections yet. Add sections with SQL to show lists and calculations (e.g. MIS). Then assign this template to employees.
                    </p>
                  ) : (
                    sections
                      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                      .map((sec) => {
                        const data = sectionData[sec.id];
                        const rows = (data?.data ?? []) as Record<string, unknown>[];
                        const err = data?.error;
                        return (
                          <div key={sec.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                              <h3 className="text-sm font-semibold text-slate-800">{sec.title || 'Section'}</h3>
                              {templateDetail?.can_edit && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditSection(sec)}
                                    className="p-1.5 rounded text-slate-500 hover:bg-slate-200"
                                    aria-label="Edit section"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeSection(sec.id)}
                                    className="p-1.5 rounded text-slate-500 hover:bg-rose-100 hover:text-rose-600"
                                    aria-label="Remove section"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="overflow-x-auto">
                              {err ? (
                                <p className="p-3 text-sm text-rose-600">{err}</p>
                              ) : rows.length === 0 ? (
                                <p className="p-3 text-sm text-slate-500">No data</p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                      {Object.keys(rows[0]).map((k) => (
                                        <th key={k} className="text-left px-3 py-2 font-medium text-slate-700">{k}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rows.map((row, i) => (
                                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                                        {Object.entries(row).map(([k, v]) => (
                                          <td key={k} className="px-3 py-2 text-slate-800">
                                            {v != null ? String(v) : '—'}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Create template modal */}
      {showCreateModal && (
        <Modal
          isOpen
          onClose={() => { setShowCreateModal(false); setCreateName(''); setCreateDescription(''); }}
          title="New report template"
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. MIS Report"
            />
            <Input
              label="Description (optional)"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Brief description"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowCreateModal(false); setCreateName(''); setCreateDescription(''); }}>Cancel</Button>
              <Button size="sm" onClick={handleCreateTemplate} disabled={!createName.trim() || createSubmitting}>
                {createSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit section modal */}
      {showAddSectionModal && (
        <Modal
          isOpen
          onClose={() => { setShowAddSectionModal(false); setEditSectionId(null); setSectionTitle(''); setSectionSql('SELECT id, name FROM leads LIMIT 100'); setAiPrompt(''); setAiScopeMode('auto'); }}
          title={editSectionId ? 'Edit section' : 'Add section'}
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800">
                <Wand2 size={14} />
                <p className="text-xs font-semibold">AI section generator</p>
              </div>
              <textarea
                className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the report section you need. Example: list leads by status with count for my scope this month."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select
                  label="Scope mode"
                  value={aiScopeMode}
                  onChange={(v) => setAiScopeMode((v ?? 'auto') as 'auto' | 'employee' | 'region' | 'domain')}
                  options={AI_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  searchable={false}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    leftIcon={<Wand2 size={14} />}
                    disabled={aiGenerating || !aiPrompt.trim()}
                    onClick={handleGenerateSectionWithAI}
                  >
                    {aiGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
              </div>
            </div>
            <Input
              label="Title"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="e.g. Lead summary"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SQL (SELECT only)</label>
              <p className="text-xs text-slate-500 mb-1">
                Use {'{{employee_id}}'}, {'{{date_from}}'}, {'{{date_to}}'} for scope — write date placeholders without quotes (e.g. created_at &gt;= {'{{date_from}}'}). For entity-wise data use {'{{lead_id}}'}, {'{{domain_id}}'}, etc. <Link to="/schema" className="text-indigo-600 hover:underline">Schema</Link>
              </p>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono min-h-[120px]"
                value={sectionSql}
                onChange={(e) => setSectionSql(e.target.value)}
                placeholder="SELECT ..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAddSectionModal(false); setEditSectionId(null); setAiPrompt(''); }}>Cancel</Button>
              <Button size="sm" onClick={handleAddOrEditSection} disabled={!sectionSql.trim() || saveSectionsSubmitting}>
                {saveSectionsSubmitting ? 'Saving...' : editSectionId ? 'Save' : 'Add section'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign modal */}
      {showAssignModal && selectedTemplate && (
        <Modal
          isOpen
          onClose={() => setShowAssignModal(false)}
          title="Assign report template"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Assign <span className="font-semibold text-slate-800">{selectedTemplate.name}</span> to a user in marketing.
            </p>
            <div className="flex flex-wrap gap-2">
              <Select
                label="Employee"
                value={assignEmployeeId}
                onChange={(val: string | number | undefined) => setAssignEmployeeId(val !== undefined && val !== null ? String(val) : '')}
                options={assignableUsers.map((u) => ({ value: String(u.id), label: u.name }))}
                placeholder="Select employee"
                searchable
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={assignCanEdit} onChange={(e) => setAssignCanEdit(e.target.checked)} />
                <span className="text-sm text-slate-700">Can edit template</span>
              </label>
              <Button size="sm" onClick={handleAssign} disabled={!assignEmployeeId.trim() || assigning || assignableLoading}>
                {assigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
            {assignments.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Assigned to</p>
                <ul className="space-y-1">
                  {assignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-50">
                      <span className="text-sm text-slate-800">
                        {assignableUsers.find((u) => u.id === a.assignee_employee_id)?.name ?? `Employee #${a.assignee_employee_id}`}
                        {a.can_edit && <span className="text-xs text-slate-500 ml-1">(can edit)</span>}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={async () => {
                          try {
                            await marketingAPI.deleteReportTemplateAssignment(selectedTemplate.id, a.id);
                            setAssignments((prev) => prev.filter((x) => x.id !== a.id));
                            showToast('Assignment removed');
                          } catch (e) {
                            showToast(e instanceof Error ? e.message : 'Failed to remove', 'error');
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No assignments yet.</p>
            )}
          </div>
        </Modal>
      )}
    </PageLayout>
  );
};
