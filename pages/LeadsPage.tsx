/**
 * Leads Management Page
 * Kanban (default) and Table view, dynamic statuses from API
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FilterPopover } from '../components/ui/FilterPopover';
import { DataTable } from '../components/ui/DataTable';
import { Search, UserPlus, Filter, Edit, Trash2, Eye, X, LayoutGrid, List, Settings2, Plus } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { marketingAPI, Lead, LeadStatusOption, LeadTypeOption, Domain, Region, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';
import { Modal } from '../components/ui/Modal';

type ViewMode = 'kanban' | 'table';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100/50', text: 'text-blue-700' },
  contacted: { bg: 'bg-amber-100/50', text: 'text-amber-700' },
  qualified: { bg: 'bg-emerald-100/50', text: 'text-emerald-700' },
  proposal: { bg: 'bg-indigo-100/50', text: 'text-indigo-700' },
  negotiation: { bg: 'bg-purple-100/50', text: 'text-purple-700' },
  won: { bg: 'bg-green-100/50', text: 'text-green-700' },
  lost: { bg: 'bg-rose-100/50', text: 'text-rose-700' },
};
const DEFAULT_STATUS_COLOR = { bg: 'bg-slate-100/50', text: 'text-slate-700' };

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast, globalSearch, setGlobalSearch } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_lead'));
  const canCreate = useAppSelector(selectHasPermission('marketing.create_lead'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_lead'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_lead'));
  const viewParam = searchParams.get('view');
  const viewMode: ViewMode = viewParam === 'table' || viewParam === 'kanban' ? viewParam : 'kanban';
  const setViewMode = (mode: ViewMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', mode);
      return next;
    });
  };
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusOption[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [tempSelectedStatus, setTempSelectedStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLeadId, setDeleteLeadId] = useState<number | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatusOption | null>(null);
  const [statusForm, setStatusForm] = useState({ code: '', label: '', display_order: 0, is_active: true, is_final: false, is_lost: false });
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleteStatusId, setDeleteStatusId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<number | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [createLeadModalStatusId, setCreateLeadModalStatusId] = useState<number | null>(null);
  const [createLeadForm, setCreateLeadForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    phone: '',
    domain_id: undefined as number | undefined,
    region_id: undefined as number | undefined,
    status_id: undefined as number | undefined,
    lead_type_id: undefined as number | undefined,
    notes: '',
  });
  const [createLeadDomains, setCreateLeadDomains] = useState<Domain[]>([]);
  const [createLeadRegions, setCreateLeadRegions] = useState<Region[]>([]);
  const [createLeadSubmitting, setCreateLeadSubmitting] = useState(false);
  const [leadTypes, setLeadTypes] = useState<LeadTypeOption[]>([]);
  const [showLeadTypeModal, setShowLeadTypeModal] = useState(false);
  const [editingLeadType, setEditingLeadType] = useState<LeadTypeOption | null>(null);
  const [leadTypeForm, setLeadTypeForm] = useState({ code: '', label: '', display_order: 0, is_active: true });
  const [savingLeadType, setSavingLeadType] = useState(false);
  const [deleteLeadTypeId, setDeleteLeadTypeId] = useState<number | null>(null);
  const filterButtonRef = React.useRef<HTMLDivElement>(null);
  const didDragRef = React.useRef(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!canView) {
      showToast('You do not have permission to view leads (marketing.lead.view)', 'error');
      return;
    }
    marketingAPI.getLeadStatuses().then(setLeadStatuses).catch(() => setLeadStatuses([]));
    marketingAPI.getLeadTypes().then(setLeadTypes).catch(() => setLeadTypes([]));
  }, [canView]);

  useEffect(() => {
    if (!canView) return;
    loadLeads();
  }, [canView, debouncedSearchTerm, selectedStatus, page, pageSize, viewMode]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const isKanban = viewMode === 'kanban';
      const res = await marketingAPI.getLeads({
        page: isKanban ? 1 : page,
        page_size: isKanban ? 100 : pageSize,
        status_id: isKanban ? undefined : (selectedStatus !== 'all' ? parseInt(selectedStatus, 10) : undefined),
        search: debouncedSearchTerm || undefined,
      });
      setLeads(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (error) {
      showToast('Failed to load leads', 'error');
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const filteredLeads = leads;
  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    leadStatuses.forEach((s) => { map[s.code] = []; });
    leads.forEach((lead) => {
      const code = lead.status_option?.code ?? leadStatuses.find((s) => s.id === lead.status_id)?.code ?? lead.status ?? 'new';
      if (!map[code]) map[code] = [];
      map[code].push(lead);
    });
    return map;
  }, [leads, leadStatuses]);

  const openDeleteConfirm = (id: number) => {
    if (!canDelete) {
      showToast('You do not have permission to delete leads', 'error');
      return;
    }
    setDeleteLeadId(id);
  };

  const handleConfirmDeleteLead = async () => {
    if (deleteLeadId == null) return;
    try {
      await marketingAPI.deleteLead(deleteLeadId);
      showToast('Lead deleted successfully', 'success');
      loadLeads();
    } catch (error) {
      showToast('Failed to delete lead', 'error');
    }
  };

  const breadcrumbs = [
    { label: 'Leads' },
  ];

  /** Lead has next_follow_up_at set and it's due (past or now) - highlight in table and Kanban */
  const isDueForFollowUp = (lead: Lead) =>
    lead.next_follow_up_at != null && new Date(lead.next_follow_up_at) <= new Date();

  const leadColumns = [
    {
      key: 'first_name',
      label: 'Name',
      sortable: true,
      render: (lead: Lead) => (
        <span className="font-medium text-slate-900">
          {lead.first_name} {lead.last_name}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (lead: Lead) => <span className="text-slate-600">{lead.email}</span>,
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (lead: Lead) => {
        const name = lead.customer?.company_name ?? lead.company;
        return name ? <span className="text-slate-700">{name}</span> : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (lead: Lead) => {
        const code = lead.status ?? lead.status_option?.code ?? '';
        const statusColor = STATUS_COLORS[code] || DEFAULT_STATUS_COLOR;
        const label = leadStatuses.find((s) => s.code === code || s.id === lead.status_id)?.label ?? lead.status_option?.label ?? code;
        return (
          <Badge className={`text-[10px] px-2 h-5 font-semibold uppercase border-none ${statusColor.bg} ${statusColor.text}`}>
            {label}
          </Badge>
        );
      },
    },
    {
      key: 'next_follow_up_at',
      label: 'Next follow-up',
      sortable: true,
      render: (lead: Lead) =>
        lead.next_follow_up_at
          ? <span className="text-slate-600 text-xs">{new Date(lead.next_follow_up_at).toLocaleDateString(undefined, { dateStyle: 'short' })} {new Date(lead.next_follow_up_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
          : '—',
    },
    {
      key: 'last_activity_date',
      label: 'Last inquiry',
      sortable: true,
      render: (lead: Lead) =>
        lead.last_activity_date
          ? <span className="text-slate-600 text-xs">{new Date(lead.last_activity_date).toLocaleDateString(undefined, { dateStyle: 'short' })} {new Date(lead.last_activity_date).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
          : '—',
    },
    {
      key: 'potential_value',
      label: 'Potential Value',
      sortable: true,
      align: 'right' as const,
      render: (lead: Lead) =>
        lead.potential_value != null
          ? <span className="font-medium text-slate-900">${lead.potential_value.toLocaleString()}</span>
          : '—',
    },
    {
      key: 'lead_through',
      label: 'Lead through',
      sortable: true,
      render: (lead: Lead) => (
        <span className="text-slate-600 text-sm">{lead.lead_through_option?.label ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (lead: Lead) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate(`/leads/${lead.id}/edit`)}
              leftIcon={<Edit size={12} />}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => openDeleteConfirm(lead.id)}
              leftIcon={<Trash2 size={12} />}
              className="text-rose-600 hover:text-rose-700"
            >
              Delete
            </Button>
          )}
          <Button
            variant="link"
            size="xs"
            onClick={() => showToast('View lead details coming soon', 'info')}
            rightIcon={<Eye size={12} />}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const openStatusModal = () => {
    setEditingStatus(null);
    setStatusForm({ code: '', label: '', display_order: leadStatuses.length, is_active: true, is_final: false, is_lost: false });
    setShowStatusModal(true);
  };
  const openEditStatus = (s: LeadStatusOption) => {
    setEditingStatus(s);
    setStatusForm({ code: s.code, label: s.label, display_order: s.display_order, is_active: s.is_active, is_final: s.is_final ?? false, is_lost: s.is_lost ?? false });
    setShowStatusModal(true);
  };
  const saveStatus = async () => {
    if (!statusForm.label.trim()) {
      showToast('Label is required', 'error');
      return;
    }
    const code = (statusForm.code || statusForm.label).trim().toLowerCase().replace(/\s+/g, '_');
    if (!code) {
      showToast('Code is required', 'error');
      return;
    }
    setSavingStatus(true);
    try {
      if (editingStatus) {
        await marketingAPI.updateLeadStatus(editingStatus.id, {
          code,
          label: statusForm.label.trim(),
          display_order: statusForm.display_order,
          is_active: statusForm.is_active,
          is_final: statusForm.is_final,
          is_lost: statusForm.is_lost,
        });
        showToast('Status updated', 'success');
      } else {
        await marketingAPI.createLeadStatus({
          code,
          label: statusForm.label.trim(),
          display_order: statusForm.display_order,
          is_active: statusForm.is_active,
          is_final: statusForm.is_final,
          is_lost: statusForm.is_lost,
        });
        showToast('Status created', 'success');
      }
      const list = await marketingAPI.getLeadStatuses();
      setLeadStatuses(list);
      setEditingStatus(null);
      setStatusForm({ code: '', label: '', display_order: list.length, is_active: true, is_final: false, is_lost: false });
    } catch (e: any) {
      showToast(e.message || 'Failed to save status', 'error');
    } finally {
      setSavingStatus(false);
    }
  };
  const handleLeadDragStart = (e: React.DragEvent, lead: Lead) => {
    if (!canEdit) return;
    didDragRef.current = false;
    e.dataTransfer.setData('application/json', JSON.stringify({ leadId: lead.id, currentStatusId: lead.status_id }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(lead.id);
  };
  const handleLeadDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStatusId(null);
    setTimeout(() => { didDragRef.current = false; }, 0);
  };
  const handleColumnDragOver = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatusId(statusId);
  };
  const handleColumnDragLeave = () => {
    setDragOverStatusId(null);
  };
  const handleColumnDrop = async (e: React.DragEvent, newStatusId: number) => {
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = true;
    setDragOverStatusId(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    let leadId: number;
    let currentStatusId: number;
    try {
      ({ leadId, currentStatusId } = JSON.parse(raw));
    } catch {
      return;
    }
    if (currentStatusId === newStatusId) return;
    setUpdatingLeadId(leadId);
    try {
      await marketingAPI.updateLead(leadId, { status_id: newStatusId });
      showToast('Lead status updated', 'success');
      // Optimistic update: move lead in state so it appears in the new column without full refetch
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status_id: newStatusId, status_option: leadStatuses.find((s) => s.id === newStatusId) ?? l.status_option } : l
        )
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update lead status', 'error');
    } finally {
      setUpdatingLeadId(null);
      setDraggedLeadId(null);
    }
  };

  const confirmDeleteStatus = async () => {
    if (deleteStatusId == null) return;
    try {
      await marketingAPI.deleteLeadStatus(deleteStatusId);
      showToast('Status deleted', 'success');
      const list = await marketingAPI.getLeadStatuses();
      setLeadStatuses(list);
      setDeleteStatusId(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete status', 'error');
    }
  };

  const firstActiveStatusId = leadStatuses.find((s) => s.is_active)?.id;

  const openCreateLeadModal = (statusId?: number) => {
    const sid = statusId ?? firstActiveStatusId ?? undefined;
    setCreateLeadModalStatusId(sid ?? null);
    setCreateLeadForm({
      first_name: '',
      last_name: '',
      email: '',
      company: '',
      phone: '',
      domain_id: undefined,
      region_id: undefined,
      status_id: sid,
      lead_type_id: undefined,
      notes: '',
    });
    setShowCreateLeadModal(true);
  };

  const closeCreateLeadModal = () => {
    setShowCreateLeadModal(false);
    setCreateLeadModalStatusId(null);
    setCreateLeadForm({
      first_name: '',
      last_name: '',
      email: '',
      company: '',
      phone: '',
      domain_id: undefined,
      region_id: undefined,
      status_id: undefined,
      lead_type_id: undefined,
      notes: '',
    });
  };

  useEffect(() => {
    if (!showCreateLeadModal) return;
    Promise.all([
      marketingAPI.getDomains({ page: 1, page_size: 100, is_active: true }),
      marketingAPI.getRegions({ page: 1, page_size: 100, is_active: true }),
    ]).then(([domainsRes, regionsRes]) => {
      setCreateLeadDomains(domainsRes.items);
      setCreateLeadRegions(regionsRes.items);
    }).catch(() => {
      showToast('Failed to load domains/regions', 'error');
    });
  }, [showCreateLeadModal]);

  const handleCreateLeadSubmit = async () => {
    if (!createLeadForm.domain_id) {
      showToast('Domain is required', 'error');
      return;
    }
    if (!createLeadForm.first_name?.trim() || !createLeadForm.last_name?.trim() || !createLeadForm.email?.trim()) {
      showToast('First name, last name and email are required', 'error');
      return;
    }
    setCreateLeadSubmitting(true);
    try {
      await marketingAPI.createLead({
        first_name: createLeadForm.first_name.trim(),
        last_name: createLeadForm.last_name.trim(),
        email: createLeadForm.email.trim(),
        company: createLeadForm.company?.trim() || undefined,
        phone: createLeadForm.phone?.trim() || undefined,
        domain_id: createLeadForm.domain_id,
        region_id: createLeadForm.region_id,
        status_id: createLeadForm.status_id ?? createLeadModalStatusId ?? firstActiveStatusId,
        lead_type_id: createLeadForm.lead_type_id,
        notes: createLeadForm.notes?.trim() || undefined,
      });
      showToast('Lead created', 'success');
      closeCreateLeadModal();
      await loadLeads();
    } catch (e: any) {
      showToast(e.message || 'Failed to create lead', 'error');
    } finally {
      setCreateLeadSubmitting(false);
    }
  };

  const openLeadTypeModal = () => {
    setEditingLeadType(null);
    setLeadTypeForm({ code: '', label: '', display_order: leadTypes.length, is_active: true });
    setShowLeadTypeModal(true);
  };
  const openEditLeadType = (t: LeadTypeOption) => {
    setEditingLeadType(t);
    setLeadTypeForm({ code: t.code, label: t.label, display_order: t.display_order, is_active: t.is_active });
    setShowLeadTypeModal(true);
  };
  const saveLeadType = async () => {
    if (!leadTypeForm.label.trim()) {
      showToast('Label is required', 'error');
      return;
    }
    const code = (leadTypeForm.code || leadTypeForm.label).trim().toLowerCase().replace(/\s+/g, '_');
    if (!code) {
      showToast('Code is required', 'error');
      return;
    }
    setSavingLeadType(true);
    try {
      if (editingLeadType) {
        await marketingAPI.updateLeadType(editingLeadType.id, {
          code,
          label: leadTypeForm.label.trim(),
          display_order: leadTypeForm.display_order,
          is_active: leadTypeForm.is_active,
        });
        showToast('Lead type updated', 'success');
      } else {
        await marketingAPI.createLeadType({
          code,
          label: leadTypeForm.label.trim(),
          display_order: leadTypeForm.display_order,
          is_active: leadTypeForm.is_active,
        });
        showToast('Lead type created', 'success');
      }
      const list = await marketingAPI.getLeadTypes();
      setLeadTypes(list);
      setEditingLeadType(null);
      setLeadTypeForm({ code: '', label: '', display_order: list.length, is_active: true });
    } catch (e: any) {
      showToast(e.message || 'Failed to save lead type', 'error');
    } finally {
      setSavingLeadType(false);
    }
  };
  const confirmDeleteLeadType = async () => {
    if (deleteLeadTypeId == null) return;
    try {
      await marketingAPI.deleteLeadType(deleteLeadTypeId);
      showToast('Lead type deleted', 'success');
      const list = await marketingAPI.getLeadTypes();
      setLeadTypes(list);
      setDeleteLeadTypeId(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete lead type', 'error');
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      {(canEdit || canCreate) && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={openStatusModal}
            leftIcon={<Settings2 size={14} />}
          >
            Manage statuses
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={openLeadTypeModal}
            leftIcon={<Settings2 size={14} />}
          >
            Manage lead types
          </Button>
        </>
      )}
      {canCreate && (
        <Button
          size="sm"
          onClick={() => navigate('/leads/new')}
          leftIcon={<UserPlus size={14} strokeWidth={3} />}
        >
          New Lead
        </Button>
      )}
    </div>
  );

  if (!canView) {
    return (
      <PageLayout title="Leads" description="Manage marketing leads" breadcrumbs={breadcrumbs}>
        <div className="text-center py-12">
          <p className="text-slate-600">You do not have permission to view leads. Required: marketing.view_lead</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Leads Management"
      description="Track and manage marketing leads"
      actions={actions}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-full border border-slate-200 p-0.5 bg-slate-100/50">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={16} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List size={16} /> Table
            </button>
          </div>
          <Input
            variant="white"
            inputSize="sm"
            className="rounded-full shadow-sm"
            icon={<Search size={14} strokeWidth={2.5} />}
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="max-w-md"
          />
          {/* {(canEdit || canCreate) && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={openStatusModal}
                leftIcon={<Settings2 size={14} />}
                className="rounded-full"
              >
                Manage statuses
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={openLeadTypeModal}
                leftIcon={<Settings2 size={14} />}
                className="rounded-full"
              >
                Manage lead types
              </Button>
            </div>
          )}
          {viewMode === 'kanban' && canCreate && (
            <Button
              size="sm"
              onClick={() => openCreateLeadModal()}
              leftIcon={<UserPlus size={14} strokeWidth={3} />}
              className="rounded-full"
            >
              New Lead
            </Button>
          )} */}
          {viewMode === 'table' && (
            <div ref={filterButtonRef} className="inline-block">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full" 
                leftIcon={<Filter size={14} />}
                onClick={() => {
                  setTempSelectedStatus(selectedStatus);
                  setShowFilters(!showFilters);
                }}
              >
                Filter Status
              </Button>
            </div>
          )}
          {viewMode === 'table' && selectedStatus !== 'all' && (
            <Badge variant="outline" className="text-xs">
              {leadStatuses.find((s) => String(s.id) === selectedStatus)?.label ?? selectedStatus}
            </Badge>
          )}
          {viewMode === 'table' && selectedStatus !== 'all' && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('all');
                setTempSelectedStatus('all');
              }}
              className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Clear filters"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Filter Popover - table view only */}
        <FilterPopover
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          triggerRef={filterButtonRef}
          onApply={() => {
            setSelectedStatus(tempSelectedStatus);
            setShowFilters(false);
          }}
          onClear={() => {
            setTempSelectedStatus('all');
            setSelectedStatus('all');
            setShowFilters(false);
          }}
        >
          <Select
            label="Status"
            options={[
              { value: 'all', label: 'All Status' },
              ...leadStatuses.filter((s) => s.is_active).map((s) => ({ value: String(s.id), label: s.label })),
            ]}
            value={tempSelectedStatus}
            onChange={(val) => setTempSelectedStatus(val as string)}
            placeholder="Select Status"
            searchable
          />
        </FilterPopover>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            <p className="mt-4 text-sm text-slate-600">Loading leads...</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <>
            {leadStatuses.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-slate-600 text-sm">Loading statuses...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-slate-900 font-black text-sm uppercase tracking-widest">
                  No leads found
                </p>
                {canCreate && (
                  <Button
                    className="mt-4"
                    onClick={() => openCreateLeadModal()}
                    leftIcon={<UserPlus size={14} />}
                  >
                    Create Your First Lead
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
                {leadStatuses.filter((s) => s.is_active).map((status) => {
                  const columnLeads = leadsByStatus[status.code] || [];
                  const statusColor = STATUS_COLORS[status.code] || DEFAULT_STATUS_COLOR;
                  return (
                    <div
                      key={status.id}
                      className={`flex-shrink-0 w-72 h-[calc(100vh-220px)] rounded-xl border-2 overflow-hidden flex flex-col transition-colors ${
                        dragOverStatusId === status.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50'
                      }`}
                      onDragOver={(e) => handleColumnDragOver(e, status.id)}
                      onDragLeave={handleColumnDragLeave}
                      onDrop={(e) => handleColumnDrop(e, status.id)}
                    >
                      <div className={`flex-shrink-0 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between ${statusColor.bg} ${statusColor.text}`}>
                        <span className="font-semibold text-sm uppercase tracking-wide">{status.label}</span>
                        <span className="flex items-center gap-1">
                          <span className="text-xs opacity-80">({columnLeads.length})</span>
                          {canCreate && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openCreateLeadModal(status.id); }}
                              className="p-1 rounded hover:bg-black/10 transition-colors"
                              title={`Add lead to ${status.label}`}
                            >
                              <Plus size={16} strokeWidth={2.5} />
                            </button>
                          )}
                        </span>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-2 scrollbar-hide">
                        {columnLeads.map((lead) => (
                          <div
                            key={lead.id}
                            draggable={canEdit}
                            onDragStart={(e) => handleLeadDragStart(e, lead)}
                            onDragEnd={handleLeadDragEnd}
                            onClick={() => canEdit && !didDragRef.current && navigate(`/leads/${lead.id}/edit`)}
                            className={`rounded-lg border p-3 shadow-sm transition-all hover:shadow-md ${
                              isDueForFollowUp(lead)
                                ? 'bg-amber-50 border-amber-300 hover:bg-amber-100/80'
                                : 'bg-white border-slate-200 hover:shadow-md'
                            } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedLeadId === lead.id ? 'opacity-50' : ''} ${updatingLeadId === lead.id ? 'animate-pulse' : ''}`}
                          >
                            <div className="font-medium text-slate-900 text-sm truncate">
                              {lead.first_name} {lead.last_name}
                            </div>
                            {(lead.customer?.company_name ?? lead.company) && (
                              <div className="text-xs text-slate-500 truncate mt-0.5">{lead.customer?.company_name ?? lead.company}</div>
                            )}
                            <div className="text-xs text-slate-400 truncate mt-0.5">{lead.email}</div>
                            {lead.next_follow_up_at && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                Next follow-up: {new Date(lead.next_follow_up_at).toLocaleDateString(undefined, { dateStyle: 'short' })} {new Date(lead.next_follow_up_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                              </div>
                            )}
                            {lead.last_activity_date && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Last inquiry: {new Date(lead.last_activity_date).toLocaleDateString(undefined, { dateStyle: 'short' })} {new Date(lead.last_activity_date).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                              </div>
                            )}
                            {lead.potential_value != null && (
                              <div className="text-xs font-medium text-slate-700 mt-1.5">
                                ${lead.potential_value.toLocaleString()}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => navigate(`/leads/${lead.id}/edit`)}
                                  className="h-7 px-2 text-xs"
                                >
                                  Edit
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => openDeleteConfirm(lead.id)}
                                  className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {filteredLeads.length > 0 ? (
              <DataTable<Lead>
                data={filteredLeads}
                columns={leadColumns}
                rowKey={(lead) => lead.id}
                onRowClick={canEdit ? (lead) => navigate(`/leads/${lead.id}/edit`) : undefined}
                getRowClassName={(lead) => isDueForFollowUp(lead) ? 'bg-amber-50 hover:bg-amber-100/80 border-l-4 border-l-amber-400' : ''}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              />
            ) : (
              <div className="text-center py-24">
                <p className="text-slate-900 font-black text-sm uppercase tracking-widest">
                  No leads found
                </p>
                {canCreate && (
                  <Button
                    className="mt-4"
                    onClick={() => navigate('/leads/new')}
                    leftIcon={<UserPlus size={14} />}
                  >
                    Create Your First Lead
                  </Button>
                )}
              </div>
            )}
            <div className="mt-3 flex justify-end">
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
      </div>

      <ConfirmModal
        isOpen={deleteLeadId != null}
        onClose={() => setDeleteLeadId(null)}
        onConfirm={handleConfirmDeleteLead}
        title="Delete lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      <Modal
        isOpen={showCreateLeadModal}
        onClose={closeCreateLeadModal}
        title="New Lead"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={closeCreateLeadModal}>Cancel</Button>
            <Button size="sm" onClick={handleCreateLeadSubmit} disabled={createLeadSubmitting}>
              {createLeadSubmitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {createLeadModalStatusId != null && (
            <div className="text-sm text-slate-600">
              Status: <strong>{leadStatuses.find((s) => s.id === createLeadModalStatusId)?.label ?? '—'}</strong>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={createLeadForm.first_name}
              onChange={(e) => setCreateLeadForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="First name"
              required
            />
            <Input
              label="Last name"
              value={createLeadForm.last_name}
              onChange={(e) => setCreateLeadForm((f) => ({ ...f, last_name: e.target.value }))}
              placeholder="Last name"
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={createLeadForm.email}
            onChange={(e) => setCreateLeadForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@example.com"
            required
          />
          <Input
            label="Company"
            value={createLeadForm.company}
            onChange={(e) => setCreateLeadForm((f) => ({ ...f, company: e.target.value }))}
            placeholder="Company"
          />
          <Input
            label="Phone"
            value={createLeadForm.phone}
            onChange={(e) => setCreateLeadForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone"
          />
          <Select
            label="Domain"
            value={createLeadForm.domain_id != null ? String(createLeadForm.domain_id) : ''}
            onChange={(val) => setCreateLeadForm((f) => ({ ...f, domain_id: val != null && val !== '' ? parseInt(String(val), 10) : undefined, region_id: undefined }))}
            options={[
              { value: '', label: 'Select domain' },
              ...createLeadDomains.map((d) => ({ value: String(d.id), label: d.name })),
            ]}
            placeholder="Select domain"
            required
          />
          <Select
            label="Region"
            value={createLeadForm.region_id != null ? String(createLeadForm.region_id) : ''}
            onChange={(val) => setCreateLeadForm((f) => ({ ...f, region_id: val != null && val !== '' ? parseInt(String(val), 10) : undefined }))}
            options={[
              { value: '', label: 'Select region' },
              ...createLeadRegions
                .filter((r) => createLeadForm.domain_id == null || r.domain_id === createLeadForm.domain_id)
                .map((r) => ({ value: String(r.id), label: r.name })),
            ]}
            placeholder="Select region"
          />
          <Select
            label="Lead for (optional)"
            value={createLeadForm.lead_type_id != null ? String(createLeadForm.lead_type_id) : ''}
            onChange={(val) => setCreateLeadForm((f) => ({ ...f, lead_type_id: val != null && val !== '' ? parseInt(String(val), 10) : undefined }))}
            options={[
              { value: '', label: '— None —' },
              ...leadTypes.filter((t) => t.is_active).map((t) => ({ value: String(t.id), label: t.label })),
            ]}
            placeholder="e.g. Standard Walk-in, Chamber, Project"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 ml-0.5">Notes</label>
            <textarea
              value={createLeadForm.notes}
              onChange={(e) => setCreateLeadForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notes"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setEditingStatus(null);
          setStatusForm({ code: '', label: '', display_order: 0, is_active: true, is_final: false, is_lost: false });
        }}
        title="Lead statuses"
        footer={
          (editingStatus || !leadStatuses.length || statusForm.label || statusForm.code) ? (
            <div className="flex justify-between w-full">
              <span />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditingStatus(null); setStatusForm({ code: '', label: '', display_order: leadStatuses.length, is_active: true, is_final: false, is_lost: false }); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveStatus} disabled={savingStatus}>
                  {savingStatus ? 'Saving...' : editingStatus ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="flex items-end gap-2 flex-wrap">
            <Input
              label="Code"
              value={statusForm.code}
              onChange={(e) => setStatusForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="e.g. new"
              containerClassName="flex-1 min-w-[120px]"
            />
            <Input
              label="Label"
              value={statusForm.label}
              onChange={(e) => setStatusForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. New"
              containerClassName="flex-1 min-w-[120px]"
            />
            <Input
              label="Order"
              type="number"
              value={String(statusForm.display_order)}
              onChange={(e) => setStatusForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
              containerClassName="w-20"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={statusForm.is_active}
                onChange={(e) => setStatusForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700" title="Won / closed – no follow-up reminders">
              <input
                type="checkbox"
                checked={statusForm.is_final}
                onChange={(e) => setStatusForm((f) => ({ ...f, is_final: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600"
              />
              Final (Won)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700" title="Lost – no follow-up reminders">
              <input
                type="checkbox"
                checked={statusForm.is_lost}
                onChange={(e) => setStatusForm((f) => ({ ...f, is_lost: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600"
              />
              Lost
            </label>
            {!editingStatus && (
              <Button size="sm" onClick={saveStatus} disabled={savingStatus} leftIcon={<Plus size={14} />}>
                Add status
              </Button>
            )}
            {editingStatus && (
              <Button size="sm" onClick={saveStatus} disabled={savingStatus}>
                Update
              </Button>
            )}
          </div>
          <div className="border-t border-slate-200 pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 pr-2">Code</th>
                  <th className="pb-2 pr-2">Label</th>
                  <th className="pb-2 pr-2">Order</th>
                  <th className="pb-2 pr-2">Active</th>
                  <th className="pb-2 pr-2">Final (Won)</th>
                  <th className="pb-2 pr-2">Lost</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {leadStatuses.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2 pr-2 font-mono text-slate-700">{s.code}</td>
                    <td className="py-2 pr-2">{s.label}</td>
                    <td className="py-2 pr-2">{s.display_order}</td>
                    <td className="py-2 pr-2">{s.is_active ? 'Yes' : 'No'}</td>
                    <td className="py-2 pr-2">{s.is_final ? 'Yes' : '—'}</td>
                    <td className="py-2 pr-2">{s.is_lost ? 'Yes' : '—'}</td>
                    <td className="py-2">
                      {canEdit && (
                        <Button variant="ghost" size="xs" onClick={() => openEditStatus(s)}>Edit</Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="xs" className="text-rose-600" onClick={() => setDeleteStatusId(s.id)}>Delete</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLeadTypeModal}
        onClose={() => {
          setShowLeadTypeModal(false);
          setEditingLeadType(null);
          setLeadTypeForm({ code: '', label: '', display_order: 0, is_active: true });
        }}
        title="Lead types (Lead for)"
        footer={
          (editingLeadType || leadTypeForm.label || leadTypeForm.code) ? (
            <div className="flex justify-between w-full">
              <span />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditingLeadType(null); setLeadTypeForm({ code: '', label: '', display_order: leadTypes.length, is_active: true }); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveLeadType} disabled={savingLeadType}>
                  {savingLeadType ? 'Saving...' : editingLeadType ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="flex items-end gap-2 flex-wrap">
            <Input
              label="Code"
              value={leadTypeForm.code}
              onChange={(e) => setLeadTypeForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="e.g. standard_walkin"
              containerClassName="flex-1 min-w-[120px]"
            />
            <Input
              label="Label"
              value={leadTypeForm.label}
              onChange={(e) => setLeadTypeForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Standard Walk-in"
              containerClassName="flex-1 min-w-[120px]"
            />
            <Input
              label="Order"
              type="number"
              value={String(leadTypeForm.display_order)}
              onChange={(e) => setLeadTypeForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))}
              containerClassName="w-20"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={leadTypeForm.is_active}
                onChange={(e) => setLeadTypeForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600"
              />
              Active
            </label>
            {!editingLeadType && (
              <Button size="sm" onClick={saveLeadType} disabled={savingLeadType} leftIcon={<Plus size={14} />}>
                Add type
              </Button>
            )}
            {editingLeadType && (
              <Button size="sm" onClick={saveLeadType} disabled={savingLeadType}>
                Update
              </Button>
            )}
          </div>
          <div className="border-t border-slate-200 pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 pr-2">Code</th>
                  <th className="pb-2 pr-2">Label</th>
                  <th className="pb-2 pr-2">Order</th>
                  <th className="pb-2 pr-2">Active</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {leadTypes.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-2 pr-2 font-mono text-slate-700">{t.code}</td>
                    <td className="py-2 pr-2">{t.label}</td>
                    <td className="py-2 pr-2">{t.display_order}</td>
                    <td className="py-2 pr-2">{t.is_active ? 'Yes' : 'No'}</td>
                    <td className="py-2">
                      {canEdit && (
                        <Button variant="ghost" size="xs" onClick={() => openEditLeadType(t)}>Edit</Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="xs" className="text-rose-600" onClick={() => setDeleteLeadTypeId(t.id)}>Delete</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteStatusId != null}
        onClose={() => setDeleteStatusId(null)}
        onConfirm={confirmDeleteStatus}
        title="Delete lead status"
        message="Are you sure? Leads using this status must be reassigned first."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={deleteLeadTypeId != null}
        onClose={() => setDeleteLeadTypeId(null)}
        onConfirm={confirmDeleteLeadType}
        title="Delete lead type"
        message="Are you sure? Leads using this type must be reassigned first."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </PageLayout>
  );
};
