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
import { Search, UserPlus, Filter, Edit, Trash2, Eye, X, LayoutGrid, List, Settings2, Plus, Trophy, XCircle, Calendar, User, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { marketingAPI, Lead, UpdateLeadRequest, LeadStatusOption, LeadStatusGroup, LeadTypeOption, Domain, Region, Contact, Customer, Organization, Series, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, ReportScopeResponse, leadDisplayName, leadDisplayCompany, leadDisplayEmail } from '../lib/marketing-api';
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText } from '../constants';
import { serializeNameWithPrefix, serializePhoneWithCountryCode } from '../lib/name-phone-utils';
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

/** Get initials from employee name (e.g. "John Doe" -> "JD"). */
function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Return white or black for text on the given hex background. */
function getContrastColor(hex: string): string {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return '#111';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? '#fff' : '#111';
}

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
  const [statusForm, setStatusForm] = useState({ code: '', label: '', display_order: 0, group_id: undefined as number | undefined, is_active: true, is_final: false, is_lost: false, hex_color: '', set_when_quotation_added: false, set_when_quote_number_generated: false });
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleteStatusId, setDeleteStatusId] = useState<number | null>(null);
  const [leadStatusGroups, setLeadStatusGroups] = useState<LeadStatusGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<LeadStatusGroup | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ code: '', label: '', expected_duration_days: undefined as number | undefined, follow_up_interval_days: undefined as number | undefined, display_order: 0, is_active: true, hex_color: '' as string });
  const [savingGroup, setSavingGroup] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<number | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [showWonClosedValueModal, setShowWonClosedValueModal] = useState(false);
  const [pendingWonLeadId, setPendingWonLeadId] = useState<number | null>(null);
  const [pendingWonStatusId, setPendingWonStatusId] = useState<number | null>(null);
  const [closedValueInput, setClosedValueInput] = useState('');
  const [wonPoFile, setWonPoFile] = useState<File | null>(null);
  const [leadToMarkLost, setLeadToMarkLost] = useState<number | null>(null);
  const [markLostReason, setMarkLostReason] = useState('');
  const [markLostSubmitting, setMarkLostSubmitting] = useState(false);
  /** When user drags lead to another status: show enquiry popup to fill reason, then update status */
  const [statusChangePending, setStatusChangePending] = useState<{ leadId: number; currentStatusId: number | undefined; newStatusId: number } | null>(null);
  const [statusChangeForm, setStatusChangeForm] = useState({ title: '', description: '' });
  const [statusChangeAttachments, setStatusChangeAttachments] = useState<{ id: string; kind: 'quotation' | 'attachment'; file: File | null; title: string }[]>([{ id: crypto.randomUUID(), kind: 'attachment', file: null, title: '' }]);
  const [statusChangeSubmitting, setStatusChangeSubmitting] = useState(false);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [statusChangeSeriesCode, setStatusChangeSeriesCode] = useState('');
  const [statusChangeGeneratingQuote, setStatusChangeGeneratingQuote] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [createLeadModalStatusId, setCreateLeadModalStatusId] = useState<number | null>(null);
  const [createLeadSearchName, setCreateLeadSearchName] = useState('');
  const [createLeadContactResults, setCreateLeadContactResults] = useState<Contact[]>([]);
  const [createLeadCustomerResults, setCreateLeadCustomerResults] = useState<Customer[]>([]);
  const [createLeadContactId, setCreateLeadContactId] = useState<number | undefined>(undefined);
  const [createLeadCustomerId, setCreateLeadCustomerId] = useState<number | undefined>(undefined);
  const [createLeadInlineContact, setCreateLeadInlineContact] = useState({
    domain_id: undefined as number | undefined,
    region_id: undefined as number | undefined,
    organization_id: undefined as number | undefined,
    plant_id: undefined as number | undefined,
    title: '',
    first_name: '',
    last_name: '',
    contact_email: '',
    contact_phone_code: DEFAULT_COUNTRY_CODE,
    contact_phone: '',
  });
  const [createLeadInlineOrgQuery, setCreateLeadInlineOrgQuery] = useState('');
  const [createLeadInlineOrgSuggestions, setCreateLeadInlineOrgSuggestions] = useState<Organization[]>([]);
  const [createLeadInlinePlants, setCreateLeadInlinePlants] = useState<{ id: number; plant_name: string }[]>([]);
  const createLeadSearchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const createLeadOrgTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createLeadForm, setCreateLeadForm] = useState({
    domain_id: undefined as number | undefined,
    region_id: undefined as number | undefined,
    status_id: undefined as number | undefined,
    lead_type_id: undefined as number | undefined,
    series_code: '' as string,
    notes: '',
  });
  const [createLeadDomains, setCreateLeadDomains] = useState<Domain[]>([]);
  const [createLeadRegions, setCreateLeadRegions] = useState<Region[]>([]);
  const [createLeadSubmitting, setCreateLeadSubmitting] = useState(false);
  const [createLeadGeneratingQuote, setCreateLeadGeneratingQuote] = useState(false);
  const [createLeadGeneratedSeries, setCreateLeadGeneratedSeries] = useState('');
  const canCreateContact = useAppSelector(selectHasPermission('marketing.create_contact'));
  const canCreateOrg = useAppSelector(selectHasPermission('marketing.create_organization'));
  const [leadTypes, setLeadTypes] = useState<LeadTypeOption[]>([]);
  const [showLeadTypeModal, setShowLeadTypeModal] = useState(false);
  const [editingLeadType, setEditingLeadType] = useState<LeadTypeOption | null>(null);
  const [leadTypeForm, setLeadTypeForm] = useState({ code: '', label: '', display_order: 0, is_active: true });
  const [savingLeadType, setSavingLeadType] = useState(false);
  const [deleteLeadTypeId, setDeleteLeadTypeId] = useState<number | null>(null);
  const [reportScope, setReportScope] = useState<ReportScopeResponse | null>(null);
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [selectedAssignedToIds, setSelectedAssignedToIds] = useState<number[]>([]);
  const [createdByMeOnly, setCreatedByMeOnly] = useState(false);
  const [includeWonLost, setIncludeWonLost] = useState(false);
  const [showEmployeeFilterPopover, setShowEmployeeFilterPopover] = useState(false);
  const filterButtonRef = React.useRef<HTMLDivElement>(null);
  const employeeFilterRef = React.useRef<HTMLDivElement>(null);
  const didDragRef = React.useRef(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const isHeadOrAdmin = reportScope?.role !== 'self' && reportScope?.role !== undefined;

  const toggleGroupCollapsed = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
    marketingAPI.getLeadStatusGroups().then(setLeadStatusGroups).catch(() => setLeadStatusGroups([]));
    marketingAPI.getLeadTypes().then(setLeadTypes).catch(() => setLeadTypes([]));
    marketingAPI.getReportsScope().then(setReportScope).catch(() => setReportScope(null));
    marketingAPI.getSeries({ page: 1, page_size: 100, is_active: true }).then((r) => setSeriesList(r.items ?? [])).catch(() => setSeriesList([]));
  }, [canView]);

  useEffect(() => {
    if (!canView) return;
    loadLeads();
  }, [canView, debouncedSearchTerm, selectedStatus, page, pageSize, viewMode, appliedDateFrom, appliedDateTo, selectedAssignedToIds, createdByMeOnly, includeWonLost]);

  useEffect(() => {
    if (includeWonLost) return;
    const wonLostIds = new Set(
      leadStatuses.filter((s) => (s.is_final ?? false) || (s.is_lost ?? false)).map((s) => s.id)
    );
    if (selectedStatus !== 'all' && wonLostIds.has(parseInt(selectedStatus, 10))) {
      setSelectedStatus('all');
      setTempSelectedStatus('all');
    }
  }, [includeWonLost, leadStatuses, selectedStatus]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const isKanban = viewMode === 'kanban';
      const res = await marketingAPI.getLeads({
        page: isKanban ? 1 : page,
        page_size: isKanban ? undefined : pageSize,
        no_limit: isKanban ? true : undefined,
        status_id: isKanban ? undefined : (selectedStatus !== 'all' ? parseInt(selectedStatus, 10) : undefined),
        search: debouncedSearchTerm || undefined,
        date_from: isHeadOrAdmin && appliedDateFrom ? appliedDateFrom : undefined,
        date_to: isHeadOrAdmin && appliedDateTo ? appliedDateTo : undefined,
        assigned_to: selectedAssignedToIds.length > 0 ? selectedAssignedToIds : undefined,
        created_by_me: createdByMeOnly || undefined,
        include_won_lost: includeWonLost || undefined,
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

  const filteredLeads = useMemo(() => leads, [leads]);

  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    leadStatuses.forEach((s) => { map[s.code] = []; });
    filteredLeads.forEach((lead) => {
      const code = lead.status_option?.code ?? leadStatuses.find((s) => s.id === lead.status_id)?.code ?? lead.status ?? 'new';
      if (!map[code]) map[code] = [];
      map[code].push(lead);
    });
    return map;
  }, [filteredLeads, leadStatuses]);

  /** Board: groups in order; Won/Lost block only shown when includeWonLost filter is on */
  const statusGroupsForBoard = useMemo(() => {
    const activeStatuses = leadStatuses.filter((s) => s.is_active);
    const wonLostStatuses = activeStatuses.filter((s) => (s.is_final ?? false) || (s.is_lost ?? false));
    const wonLostIds = new Set(wonLostStatuses.map((s) => s.id));
    const order = [...leadStatusGroups.filter((g) => g.is_active).map((g) => g.id), 'none' as const];
    const mainBlocks = order.map((groupId): { groupId: number | 'none' | 'closed'; groupLabel: string; statuses: LeadStatusOption[] } => {
      const statuses = activeStatuses.filter(
        (s) => (s.group_id ?? null) === (groupId === 'none' ? null : groupId) && !wonLostIds.has(s.id)
      );
      const groupLabel = groupId === 'none' ? '— No group —' : leadStatusGroups.find((g) => g.id === groupId)?.label ?? `Group #${groupId}`;
      return { groupId, groupLabel, statuses };
    }).filter((block) => block.statuses.length > 0);
    if (includeWonLost && wonLostStatuses.length > 0) {
      mainBlocks.push({ groupId: 'closed' as const, groupLabel: 'Won / Lost', statuses: wonLostStatuses });
    }
    return mainBlocks;
  }, [leadStatuses, leadStatusGroups, includeWonLost]);

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
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (lead: Lead) => (
        <span className="font-medium text-slate-900">
          {leadDisplayName(lead)}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (lead: Lead) => <span className="text-slate-600">{leadDisplayEmail(lead) || '—'}</span>,
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (lead: Lead) => {
        const name = leadDisplayCompany(lead);
        return name ? <span className="text-slate-700">{name}</span> : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (lead: Lead) => {
        const code = lead.status ?? lead.status_option?.code ?? '';
        const statusOption = leadStatuses.find((s) => s.code === code || s.id === lead.status_id) ?? lead.status_option;
        const label = statusOption?.label ?? code;
        const hex = statusOption?.hex_color;
        const statusColor = !hex ? (STATUS_COLORS[code] || DEFAULT_STATUS_COLOR) : null;
        if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
          return (
            <span
              className="text-[10px] px-2 h-5 font-semibold uppercase border-none rounded-full inline-flex items-center"
              style={{ backgroundColor: hex, color: getContrastColor(hex) }}
            >
              {label}
            </span>
          );
        }
        return (
          <Badge className={`text-[10px] px-2 h-5 font-semibold uppercase border-none ${statusColor!.bg} ${statusColor!.text}`}>
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
          ? <span className="font-medium text-slate-900">₹{lead.potential_value.toLocaleString()}</span>
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
        <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {canEdit && wonStatusId && lead.status_id !== wonStatusId && !lead.status_option?.is_lost && (
            <Button variant="ghost" size="xs" onClick={() => openMarkAsWonModal(lead.id)} className="text-emerald-600 hover:text-emerald-700" title="Mark as Won">
              <Trophy size={12} className="mr-0.5" /> Won
            </Button>
          )}
          {canEdit && lostStatusId && lead.status_id !== lostStatusId && !lead.status_option?.is_final && (
            <Button variant="ghost" size="xs" onClick={() => setLeadToMarkLost(lead.id)} className="text-rose-600 hover:text-rose-700" title="Mark as Lost">
              <XCircle size={12} className="mr-0.5" /> Lost
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" size="xs" onClick={() => navigate(`/leads/${lead.id}/edit`)} leftIcon={<Edit size={12} />}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="xs" onClick={() => openDeleteConfirm(lead.id)} leftIcon={<Trash2 size={12} />} className="text-rose-600 hover:text-rose-700">
              Delete
            </Button>
          )}
          <Button variant="link" size="xs" onClick={() => navigate(`/leads/${lead.id}/edit`)} rightIcon={<Eye size={12} />}>
            View
          </Button>
        </div>
      ),
    },
  ];

  const openStatusModal = () => {
    setEditingStatus(null);
    setEditingGroup(null);
    setStatusForm({ code: '', label: '', display_order: leadStatuses.length, group_id: undefined, is_active: true, is_final: false, is_lost: false, hex_color: '', set_when_quotation_added: false, set_when_quote_number_generated: false });
    setGroupForm({ code: '', label: '', expected_duration_days: undefined, follow_up_interval_days: undefined, display_order: leadStatusGroups.length, is_active: true, hex_color: '' });
    setShowStatusModal(true);
    marketingAPI.getLeadStatusGroups().then(setLeadStatusGroups).catch(() => setLeadStatusGroups([]));
  };
  const openEditStatus = (s: LeadStatusOption) => {
    setEditingStatus(s);
    setStatusForm({ code: s.code, label: s.label, display_order: s.display_order, group_id: s.group_id ?? undefined, is_active: s.is_active, is_final: s.is_final ?? false, is_lost: s.is_lost ?? false, hex_color: s.hex_color ?? '', set_when_quotation_added: s.set_when_quotation_added ?? false, set_when_quote_number_generated: s.set_when_quote_number_generated ?? false });
    setShowStatusModal(true);
    marketingAPI.getLeadStatusGroups().then(setLeadStatusGroups).catch(() => setLeadStatusGroups([]));
  };
  /** Add a new status under a specific group (create groups first, then add statuses to each group). */
  const openAddStatusToGroup = (groupId: number) => {
    setEditingStatus(null);
    const group = leadStatusGroups.find((g) => g.id === groupId);
    const statusesInGroup = leadStatuses.filter((s) => s.group_id === groupId);
    setStatusForm({
      code: '',
      label: '',
      display_order: statusesInGroup.length,
      group_id: groupId,
      is_active: true,
      is_final: false,
      is_lost: false,
      hex_color: '',
      set_when_quotation_added: false,
      set_when_quote_number_generated: false,
    });
    setShowStatusModal(true);
    marketingAPI.getLeadStatusGroups().then(setLeadStatusGroups).catch(() => setLeadStatusGroups([]));
  };
  const saveGroup = async () => {
    if (!groupForm.label.trim()) {
      showToast('Group label is required', 'error');
      return;
    }
    const code = (groupForm.code || groupForm.label).trim().toLowerCase().replace(/\s+/g, '_');
    setSavingGroup(true);
    try {
      if (editingGroup) {
        await marketingAPI.updateLeadStatusGroup(editingGroup.id, {
          code,
          label: groupForm.label.trim(),
          expected_duration_days: groupForm.expected_duration_days ?? undefined,
          follow_up_interval_days: groupForm.follow_up_interval_days ?? undefined,
          display_order: groupForm.display_order,
          is_active: groupForm.is_active,
          hex_color: groupForm.hex_color?.trim() || undefined,
        });
        showToast('Group updated', 'success');
      } else {
        await marketingAPI.createLeadStatusGroup({
          code,
          label: groupForm.label.trim(),
          expected_duration_days: groupForm.expected_duration_days ?? undefined,
          follow_up_interval_days: groupForm.follow_up_interval_days ?? undefined,
          display_order: groupForm.display_order,
          is_active: groupForm.is_active,
          hex_color: groupForm.hex_color?.trim() || undefined,
        });
        showToast('Group created', 'success');
      }
      const list = await marketingAPI.getLeadStatusGroups();
      setLeadStatusGroups(list);
      setEditingGroup(null);
      setAddingGroup(false);
      setGroupForm({ code: '', label: '', expected_duration_days: undefined, follow_up_interval_days: undefined, display_order: list.length, is_active: true, hex_color: '' });
    } catch (e: any) {
      showToast(e.message || 'Failed to save group', 'error');
    } finally {
      setSavingGroup(false);
    }
  };
  const cancelGroupForm = () => {
    setAddingGroup(false);
    setEditingGroup(null);
    setGroupForm({ code: '', label: '', expected_duration_days: undefined, follow_up_interval_days: undefined, display_order: leadStatusGroups.length, is_active: true, hex_color: '' });
  };
  const confirmDeleteGroup = async () => {
    if (deleteGroupId == null) return;
    try {
      await marketingAPI.deleteLeadStatusGroup(deleteGroupId);
      showToast('Group deleted', 'success');
      const list = await marketingAPI.getLeadStatusGroups();
      setLeadStatusGroups(list);
      setDeleteGroupId(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete group', 'error');
    }
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
          hex_color: statusForm.hex_color?.trim() ? statusForm.hex_color.trim() : undefined,
          set_when_quotation_added: statusForm.set_when_quotation_added,
          set_when_quote_number_generated: statusForm.set_when_quote_number_generated,
        });
        showToast('Status updated', 'success');
      } else {
        await marketingAPI.createLeadStatus({
          code,
          label: statusForm.label.trim(),
          group_id: statusForm.group_id ?? undefined,
          display_order: statusForm.display_order,
          is_active: statusForm.is_active,
          is_final: statusForm.is_final,
          is_lost: statusForm.is_lost,
          hex_color: statusForm.hex_color?.trim() ? statusForm.hex_color.trim() : undefined,
          set_when_quotation_added: statusForm.set_when_quotation_added,
          set_when_quote_number_generated: statusForm.set_when_quote_number_generated,
        });
        showToast('Status created', 'success');
      }
      const list = await marketingAPI.getLeadStatuses();
      setLeadStatuses(list);
      setEditingStatus(null);
      setStatusForm({ code: '', label: '', display_order: list.length, group_id: undefined, is_active: true, is_final: false, is_lost: false, hex_color: '', set_when_quotation_added: false, set_when_quote_number_generated: false });
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
  const newStatusIsWon = (statusId: number) => {
    const s = leadStatuses.find((x) => x.id === statusId);
    return s && s.is_final && !s.is_lost;
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
    if (newStatusIsWon(newStatusId)) {
      setPendingWonLeadId(leadId);
      setPendingWonStatusId(newStatusId);
      setClosedValueInput('');
      setWonPoFile(null);
      setShowWonClosedValueModal(true);
      setDraggedLeadId(null);
      return;
    }
    setStatusChangePending({ leadId, currentStatusId, newStatusId });
    setStatusChangeForm({ title: '', description: '' });
    setStatusChangeAttachments([{ id: crypto.randomUUID(), kind: 'attachment', file: null, title: '' }]);
    setStatusChangeSeriesCode('');
    setDraggedLeadId(null);
  };

  const handleStatusChangeModalSubmit = async () => {
    if (!statusChangePending) return;
    const { leadId, currentStatusId, newStatusId } = statusChangePending;
    const pendingLead = leads.find((l) => l.id === leadId);
    const pendingStatus = leadStatuses.find((s) => s.id === newStatusId);
    if (pendingStatus?.set_when_quote_number_generated && !pendingLead?.series?.trim()) {
      showToast('Generate quotation number before changing to this status', 'error');
      return;
    }
    setStatusChangeSubmitting(true);
    try {
      const fromLabel = leadStatuses.find((s) => s.id === currentStatusId)?.label ?? '—';
      const toLabel = leadStatuses.find((s) => s.id === newStatusId)?.label ?? '—';
      const enteredTitle = statusChangeForm.title.trim();
      const enteredDescription = statusChangeForm.description?.trim() || '';

      // Keep status timeline intact.
      await marketingAPI.createLeadActivity(leadId, {
        activity_type: 'lead_status_change',
        title: enteredTitle || 'Status changed',
        description: enteredDescription || undefined,
        from_status_id: currentStatusId ?? undefined,
        to_status_id: newStatusId,
      });

      // Also add an enquiry note so popup details are visible in enquiry log.
      const enquiry = await marketingAPI.createLeadActivity(leadId, {
        activity_type: 'note',
        title: enteredTitle || `Status changed: ${fromLabel} -> ${toLabel}`,
        description: enteredDescription
          ? `Status: ${fromLabel} -> ${toLabel}\n${enteredDescription}`
          : `Status: ${fromLabel} -> ${toLabel}`,
      });

      const toUpload = statusChangeAttachments.filter((e) => e.file);
      if (toUpload.length > 0) {
        await marketingAPI.uploadLeadActivityAttachments(
          leadId,
          enquiry.id,
          toUpload.map((e) => e.file!),
          toUpload.map((e) => e.kind),
          undefined,
          toUpload.map((e) => (e.kind === 'attachment' ? (e.title.trim() || undefined) : undefined))
        );
      }
      await marketingAPI.updateLead(leadId, { status_id: newStatusId });
      showToast('Status updated and enquiry logged', 'success');
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status_id: newStatusId, status_option: leadStatuses.find((s) => s.id === newStatusId) ?? l.status_option } : l
        )
      );
      setStatusChangePending(null);
      setStatusChangeForm({ title: '', description: '' });
      setStatusChangeAttachments([{ id: crypto.randomUUID(), kind: 'attachment', file: null, title: '' }]);
      setStatusChangeSeriesCode('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lead status', 'error');
    } finally {
      setStatusChangeSubmitting(false);
    }
  };

  const handleStatusChangeGenerateQuote = async () => {
    if (!statusChangePending || !statusChangeSeriesCode.trim()) return;
    const leadId = statusChangePending.leadId;
    setStatusChangeGeneratingQuote(true);
    try {
      const res = await marketingAPI.generateNextSeriesNumberByCode(statusChangeSeriesCode.trim(), { lead_id: leadId });
      const generated = res.generated_value ?? '';
      await marketingAPI.updateLead(leadId, { series_code: statusChangeSeriesCode.trim(), series: generated } as UpdateLeadRequest);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, series_code: statusChangeSeriesCode.trim(), series: generated } : l
        )
      );
      showToast('Quote number generated', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate quote number', 'error');
    } finally {
      setStatusChangeGeneratingQuote(false);
    }
  };

  const handleWonClosedValueSubmit = async () => {
    if (pendingWonLeadId == null || pendingWonStatusId == null || !closedValueInput.trim()) return;
    const value = parseFloat(closedValueInput.replace(/,/g, '').trim());
    if (Number.isNaN(value) || value < 0) {
      showToast('Please enter a valid positive number for closed value', 'error');
      return;
    }
    if (!wonPoFile) {
      showToast('PO file is required to mark lead as Won', 'error');
      return;
    }
    setUpdatingLeadId(pendingWonLeadId);
    try {
      const fromStatusId = leads.find((l) => l.id === pendingWonLeadId)?.status_id;
      const created = await marketingAPI.createLeadActivity(pendingWonLeadId, {
        activity_type: 'lead_status_change',
        title: 'Lead marked as Won',
        description: `Closed value: ₹${value.toLocaleString()}. PO file attached.`,
        from_status_id: fromStatusId ?? undefined,
        to_status_id: pendingWonStatusId,
      });
      await marketingAPI.uploadLeadActivityAttachments(
        pendingWonLeadId,
        created.id,
        [wonPoFile],
        ['attachment'],
        undefined,
        ['PO File']
      );
      await marketingAPI.updateLead(pendingWonLeadId, { status_id: pendingWonStatusId, closed_value: value } as UpdateLeadRequest);
      showToast('Lead marked as Won with closed value and PO file', 'success');
      setLeads((prev) =>
        prev.map((l) =>
          l.id === pendingWonLeadId
            ? { ...l, status_id: pendingWonStatusId, status_option: leadStatuses.find((s) => s.id === pendingWonStatusId) ?? l.status_option, closed_value: value }
            : l
        )
      );
      setShowWonClosedValueModal(false);
      setPendingWonLeadId(null);
      setPendingWonStatusId(null);
      setClosedValueInput('');
      setWonPoFile(null);
      navigate(`/orders/new?lead_id=${pendingWonLeadId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update lead', 'error');
    } finally {
      setUpdatingLeadId(null);
      setShowWonClosedValueModal(false);
      setPendingWonLeadId(null);
      setPendingWonStatusId(null);
      setClosedValueInput('');
      setWonPoFile(null);
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
  const wonStatusId = useMemo(() => leadStatuses.find((s) => s.is_final && !s.is_lost)?.id ?? null, [leadStatuses]);
  const lostStatusId = useMemo(() => leadStatuses.find((s) => s.is_lost)?.id ?? null, [leadStatuses]);

  const openMarkAsWonModal = (leadId: number) => {
    if (!wonStatusId) {
      showToast('No Won status configured. Add a status marked as Final (Won) in Manage statuses.', 'error');
      return;
    }
    setPendingWonLeadId(leadId);
    setPendingWonStatusId(wonStatusId);
    setClosedValueInput('');
    setWonPoFile(null);
    setShowWonClosedValueModal(true);
  };

  const handleMarkAsLostConfirm = async () => {
    if (leadToMarkLost == null || lostStatusId == null || markLostReason.trim().length < 100) return;
    setMarkLostSubmitting(true);
    setUpdatingLeadId(leadToMarkLost);
    try {
      await marketingAPI.updateLead(leadToMarkLost, {
        status_id: lostStatusId ?? undefined,
        status_change_reason: markLostReason.trim(),
      } as UpdateLeadRequest);
      showToast('Lead marked as Lost', 'success');
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadToMarkLost
            ? { ...l, status_id: lostStatusId, status_option: leadStatuses.find((s) => s.id === lostStatusId) ?? l.status_option }
            : l
        )
      );
      setLeadToMarkLost(null);
      setMarkLostReason('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update lead', 'error');
    } finally {
      setUpdatingLeadId(null);
      setMarkLostSubmitting(false);
    }
  };

  const openCreateLeadModal = (statusId?: number) => {
    const sid = statusId ?? firstActiveStatusId ?? undefined;
    const query = sid != null ? `?status_id=${sid}` : '';
    navigate(`/leads/new${query}`);
  };

  const closeCreateLeadModal = () => {
    setShowCreateLeadModal(false);
    setCreateLeadModalStatusId(null);
    setCreateLeadSearchName('');
    setCreateLeadContactResults([]);
    setCreateLeadCustomerResults([]);
    setCreateLeadContactId(undefined);
    setCreateLeadCustomerId(undefined);
    setCreateLeadInlineContact({
      domain_id: undefined,
      region_id: undefined,
      organization_id: undefined,
      plant_id: undefined,
      title: '',
      first_name: '',
      last_name: '',
      contact_email: '',
      contact_phone_code: DEFAULT_COUNTRY_CODE,
      contact_phone: '',
    });
    setCreateLeadInlineOrgQuery('');
    setCreateLeadInlineOrgSuggestions([]);
    setCreateLeadInlinePlants([]);
    setCreateLeadForm({
      domain_id: undefined,
      region_id: undefined,
      status_id: undefined,
      lead_type_id: undefined,
      series_code: '',
      notes: '',
    });
    setCreateLeadGeneratedSeries('');
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

  useEffect(() => {
    if (!showCreateLeadModal || !createLeadInlineContact.domain_id) return;
    marketingAPI.getRegions({ domain_id: createLeadInlineContact.domain_id, is_active: true, page: 1, page_size: 100 })
      .then((res) => setCreateLeadRegions(res.items ?? []))
      .catch(() => setCreateLeadRegions([]));
  }, [showCreateLeadModal, createLeadInlineContact.domain_id]);

  const onCreateLeadSearchNameChange = (value: string) => {
    setCreateLeadSearchName(value);
    if (createLeadContactId != null || createLeadCustomerId != null) return;
    if (createLeadSearchTimeoutRef.current) clearTimeout(createLeadSearchTimeoutRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setCreateLeadContactResults([]);
      setCreateLeadCustomerResults([]);
      return;
    }
    createLeadSearchTimeoutRef.current = setTimeout(() => {
      Promise.all([
        marketingAPI.searchContacts(q, 15),
        marketingAPI.searchCustomers(q, 15),
      ]).then(([contacts, customers]) => {
        setCreateLeadContactResults(contacts || []);
        setCreateLeadCustomerResults(customers || []);
      }).catch(() => {
        setCreateLeadContactResults([]);
        setCreateLeadCustomerResults([]);
      });
    }, 300);
  };

  const hasCreateLeadSearchResults = createLeadContactResults.length > 0 || createLeadCustomerResults.length > 0;
  const showCreateLeadSearchDropdown = (createLeadContactId == null && createLeadCustomerId == null) && createLeadSearchName.trim().length >= 2 && (hasCreateLeadSearchResults || canCreateContact);

  const handleCreateLeadSubmit = async () => {
    let contactId: number | undefined = createLeadContactId;
    let customerId: number | undefined = createLeadCustomerId;
    // Single source of truth: contact must be created in the same domain/region as the lead.
    const selectedLeadDomainId = createLeadForm.domain_id ?? createLeadInlineContact.domain_id;
    const selectedLeadRegionId = createLeadForm.region_id ?? createLeadInlineContact.region_id;
    let domainId = selectedLeadDomainId;
    let regionId = selectedLeadRegionId;

    if (!contactId && !customerId) {
      const typedName = createLeadSearchName.trim();
      const typedParts = typedName.split(/\s+/).filter(Boolean);
      const fallbackFirst = typedParts[0] || '';
      const fallbackLast = typedParts.slice(1).join(' ') || '';
      const resolvedFirstName = createLeadInlineContact.first_name?.trim() || fallbackFirst;
      const resolvedLastName = createLeadInlineContact.last_name?.trim() || fallbackLast;
      const resolvedPhone = serializePhoneWithCountryCode(createLeadInlineContact.contact_phone_code, createLeadInlineContact.contact_phone)?.trim() || '';
      const resolvedEmail = createLeadInlineContact.contact_email?.trim() || '';
      const hasInline = domainId && Boolean(resolvedFirstName || resolvedLastName || resolvedEmail || resolvedPhone);
      if (hasInline && canCreateContact) {
        setCreateLeadSubmitting(true);
        try {
          let resolvedOrganizationId = createLeadInlineContact.organization_id ?? undefined;
          const typedOrgName = createLeadInlineOrgQuery.trim();
          if (!resolvedOrganizationId && typedOrgName.length >= 2) {
            const orgSearch = await marketingAPI.getOrganizations({ page: 1, page_size: 25, search: typedOrgName, is_active: true });
            const exact = (orgSearch.items || []).find((o) => o.name.trim().toLowerCase() === typedOrgName.toLowerCase());
            if (exact) {
              resolvedOrganizationId = exact.id;
            } else if (canCreateOrg) {
              const createdOrg = await marketingAPI.createOrganization({ name: typedOrgName, is_active: true });
              resolvedOrganizationId = createdOrg.id;
            } else {
              showToast('Organization not found. Please select an existing organization.', 'error');
              setCreateLeadSubmitting(false);
              return;
            }
          }
          const contact = await marketingAPI.createContact({
            domain_id: domainId!,
            region_id: regionId ?? undefined,
            organization_id: resolvedOrganizationId,
            plant_id: createLeadInlineContact.plant_id ?? undefined,
            title: createLeadInlineContact.title?.trim() || undefined,
            first_name: resolvedFirstName || undefined,
            last_name: resolvedLastName || undefined,
            contact_email: resolvedEmail || undefined,
            contact_phone: resolvedPhone || undefined,
          });
          if (
            contact.domain_id !== domainId ||
            (contact.region_id ?? undefined) !== (regionId ?? undefined)
          ) {
            showToast('Contact was created with different domain/region than selected in lead form. Lead was not saved.', 'error');
            setCreateLeadSubmitting(false);
            return;
          }
          setCreateLeadInlineContact((prev) => ({ ...prev, organization_id: resolvedOrganizationId }));
          contactId = contact.id;
          // Keep lead and contact aligned on selected scope.
          domainId = selectedLeadDomainId;
          regionId = selectedLeadRegionId;
        } catch (e: any) {
          showToast(e?.message || 'Failed to create contact', 'error');
          setCreateLeadSubmitting(false);
          return;
        }
      } else {
        showToast('Search and select a contact or company, or fill the new contact form below', 'error');
        return;
      }
    } else if (contactId || customerId) {
      domainId = createLeadForm.domain_id ?? domainId;
      regionId = createLeadForm.region_id ?? regionId;
    }

    if (!domainId) {
      showToast('Domain is required', 'error');
      setCreateLeadSubmitting(false);
      return;
    }

    setCreateLeadSubmitting(true);
    try {
      await marketingAPI.createLead({
        contact_id: contactId,
        customer_id: customerId,
        domain_id: domainId,
        region_id: regionId,
        status_id: createLeadForm.status_id ?? createLeadModalStatusId ?? firstActiveStatusId,
        lead_type_id: createLeadForm.lead_type_id,
        series_code: createLeadForm.series_code?.trim() || undefined,
        notes: createLeadForm.notes?.trim() || undefined,
      });
      showToast('Lead created', 'success');
      closeCreateLeadModal();
      await loadLeads();
    } catch (e: any) {
      showToast(e?.message || 'Failed to create lead', 'error');
    } finally {
      setCreateLeadSubmitting(false);
    }
  };

  const handleCreateLeadGenerateQuote = async () => {
    const code = createLeadForm.series_code?.trim();
    if (!code) return;
    setCreateLeadGeneratingQuote(true);
    try {
      const companyContext = createLeadInlineOrgQuery.trim() || createLeadSearchName.trim() || undefined;
      const res = await marketingAPI.generateNextSeriesNumberByCode(code, companyContext ? { lead_context: { company: companyContext } } : undefined);
      const generated = res.generated_value?.trim() || '';
      if (!generated) {
        showToast('Failed to generate quote number', 'error');
        return;
      }
      setCreateLeadGeneratedSeries(generated);
      showToast('Quote number generated', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to generate quote number', 'error');
    } finally {
      setCreateLeadGeneratingQuote(false);
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
            >
              <LayoutGrid size={16} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
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
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-600 hover:text-slate-800">
            <input
              type="checkbox"
              checked={includeWonLost}
              onChange={(e) => setIncludeWonLost(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show Won &amp; Lost</span>
          </label>
          {/* Assigned to: top 5 avatars + plus to multi-select; Only my leads */}
          {reportScope && reportScope.employees.length > 0 && (
            <>
              <div ref={employeeFilterRef} className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-slate-500 hidden sm:inline">Assigned to</span>
                <div className="flex items-center -space-x-2">
                  {(selectedAssignedToIds.length > 0 ? selectedAssignedToIds.slice(0, 5) : []).map((eid) => {
                    const emp = reportScope.employees.find((e) => e.id === eid);
                    return (
                      <div
                        key={eid}
                        className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shadow-sm"
                        title={emp?.name ?? `Employee ${eid}`}
                      >
                        {emp ? getInitials(emp.name) : '?'}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmployeeFilterPopover((v) => !v)}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                  title="Select employees to filter"
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
              <FilterPopover
                isOpen={showEmployeeFilterPopover}
                onClose={() => setShowEmployeeFilterPopover(false)}
                triggerRef={employeeFilterRef}
                onClear={() => setSelectedAssignedToIds([])}
              >
                <div className="p-2 min-w-[200px] max-h-[280px] overflow-y-auto">
                  <p className="text-xs font-medium text-slate-600 mb-2">Filter by assigned employee</p>
                  {reportScope.employees.map((emp) => {
                    const checked = selectedAssignedToIds.includes(emp.id);
                    return (
                      <label key={emp.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-slate-50 rounded px-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedAssignedToIds((prev) =>
                              prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                            );
                          }}
                          className="rounded border-slate-300 text-indigo-600"
                        />
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-medium shrink-0">
                          {getInitials(emp.name)}
                        </span>
                        <span className="text-sm text-slate-800 truncate">{emp.name}</span>
                      </label>
                    );
                  })}
                </div>
              </FilterPopover>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createdByMeOnly}
                  onChange={(e) => setCreatedByMeOnly(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-600">Only my leads</span>
              </label>
            </>
          )}
          {isHeadOrAdmin && viewMode === 'kanban' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar size={16} className="text-slate-500 shrink-0" />
              <input
                type="date"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 bg-white"
                title="From date"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 bg-white"
                title="To date"
              />
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setAppliedDateFrom(dateFromInput);
                  setAppliedDateTo(dateToInput);
                }}
              >
                Apply
              </Button>
              {(appliedDateFrom || appliedDateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFromInput('');
                    setDateToInput('');
                    setAppliedDateFrom('');
                    setAppliedDateTo('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear range
                </button>
              )}
            </div>
          )}
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
            label=""
            options={[
              { value: 'all', label: 'All Status' },
              ...leadStatuses
                .filter((s) => s.is_active && (includeWonLost || !((s.is_final ?? false) || (s.is_lost ?? false))))
                .map((s) => ({ value: String(s.id), label: s.label })),
            ]}
            value={tempSelectedStatus}
            onChange={(val) => setTempSelectedStatus(val as string)}
            placeholder="Select status"
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
              <div className="flex flex-row gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
                {statusGroupsForBoard.map(({ groupId, groupLabel, statuses }) => {
                  const group = groupId !== 'none' ? leadStatusGroups.find((g) => g.id === groupId) : null;
                  const groupBgStyle = group?.hex_color && /^#[0-9A-Fa-f]{6}$/.test(group.hex_color) ? { backgroundColor: `${group.hex_color}18` } : undefined;
                  const collapseKey = groupId === 'none' ? 'nogroup' : `group-${groupId}`;
                  const isCollapsed = collapsedGroups.has(collapseKey);
                  const groupLeadCount = statuses.reduce((sum, s) => sum + (leadsByStatus[s.code]?.length ?? 0), 0);
                  return (
                    <div
                      key={groupId === 'none' ? 'nogroup' : groupId}
                      className={`flex flex-shrink-0 flex-col rounded-xl border border-slate-200 overflow-hidden transition-all ${isCollapsed ? 'w-14' : 'p-4'}`}
                      style={groupBgStyle ?? { backgroundColor: 'rgba(241,245,249,0.5)' }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapsed(collapseKey)}
                        className={`flex items-center gap-2 w-full text-left ${isCollapsed ? 'flex-col justify-center py-4 px-1 min-h-[120px] border-b-0' : 'mb-3 border-b border-slate-200 pb-2'}`}
                      >
                        {isCollapsed ? (
                          <>
                            <ChevronLeft size={18} className="text-slate-500 rotate-90" />
                            <span className="text-xs font-semibold text-slate-600 leading-none" style={{ writingMode: 'vertical-rl' }}>{groupLabel}</span>
                            <span className="text-[11px] font-bold text-slate-500 leading-none">{groupLeadCount}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-semibold text-slate-700">{groupLabel}</span>
                            <span className="text-xs text-slate-400">({statuses.length} status{statuses.length !== 1 ? 'es' : ''} • {groupLeadCount} leads)</span>
                            <ChevronRight size={16} className="text-slate-400 ml-auto" />
                          </>
                        )}
                      </button>
                      {!isCollapsed && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {statuses.map((status) => {
                            const columnLeads = leadsByStatus[status.code] || [];
                            const useStatusHex = status.hex_color && /^#[0-9A-Fa-f]{6}$/.test(status.hex_color);
                            const statusColor = !useStatusHex ? (STATUS_COLORS[status.code] || DEFAULT_STATUS_COLOR) : null;
                            return (
                              <div
                                key={status.id}
                                className={`flex-shrink-0 w-72 h-[calc(100vh-260px)] rounded-xl border-2 overflow-hidden flex flex-col transition-colors ${dragOverStatusId === status.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50'
                                  }`}
                                onDragOver={(e) => handleColumnDragOver(e, status.id)}
                                onDragLeave={handleColumnDragLeave}
                                onDrop={(e) => handleColumnDrop(e, status.id)}
                              >
                                <div
                                  className={`flex-shrink-0 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between ${statusColor ? `${statusColor.bg} ${statusColor.text}` : ''}`}
                                  style={useStatusHex ? { backgroundColor: status.hex_color!, color: getContrastColor(status.hex_color!) } : undefined}
                                >
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
                                      className={`rounded-lg border p-3 shadow-sm transition-all hover:shadow-md ${isDueForFollowUp(lead)
                                        ? 'bg-amber-50 border-amber-300 hover:bg-amber-100/80'
                                        : 'bg-white border-slate-200 hover:shadow-md'
                                        } ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedLeadId === lead.id ? 'opacity-50' : ''} ${updatingLeadId === lead.id ? 'animate-pulse' : ''}`}
                                    >
                                      <div className="font-medium text-slate-900 text-sm truncate">
                                        {leadDisplayName(lead)}
                                      </div>
                                      {leadDisplayCompany(lead) && (
                                        <div className="text-xs text-slate-500 truncate mt-0.5">{leadDisplayCompany(lead)}</div>
                                      )}
                                      <div className="text-xs text-slate-400 truncate mt-0.5">{leadDisplayEmail(lead) || '—'}</div>
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
                                          ₹{lead.potential_value.toLocaleString()}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                        {canEdit && wonStatusId && lead.status_id !== wonStatusId && !lead.status_option?.is_lost && (
                                          <Button
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => openMarkAsWonModal(lead.id)}
                                            className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700"
                                            title="Mark as Won"
                                          >
                                            <Trophy size={12} className="mr-0.5" /> Won
                                          </Button>
                                        )}
                                        {canEdit && lostStatusId && lead.status_id !== lostStatusId && !lead.status_option?.is_final && (
                                          <Button
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => setLeadToMarkLost(lead.id)}
                                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                                            title="Mark as Lost"
                                          >
                                            <XCircle size={12} className="mr-0.5" /> Lost
                                          </Button>
                                        )}
                                        {canDelete && (
                                          <Button
                                            variant="ghost"
                                            size="xs"
                                            onClick={() => openDeleteConfirm(lead.id)}
                                            className="h-7 px-2 text-xs text-slate-500 hover:text-rose-700"
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
        isOpen={leadToMarkLost != null}
        onClose={() => { setLeadToMarkLost(null); setMarkLostReason(''); }}
        title="Mark lead as Lost"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => { setLeadToMarkLost(null); setMarkLostReason(''); }} disabled={markLostSubmitting}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={handleMarkAsLostConfirm} disabled={markLostReason.trim().length < 100 || markLostSubmitting}>
              {markLostSubmitting ? 'Saving...' : 'Yes, mark as Lost'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 mb-3">Please provide a detailed reason for marking this lead as Lost (minimum 100 characters). The reason will be stored in the lead enquiry log.</p>
        <label className="block text-sm font-medium text-slate-700 mb-1">Reason why lost (required, min 100 characters)</label>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[130px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. Customer chose competitor due to pricing. Budget was cut this quarter. No response after 3 follow-ups."
          value={markLostReason}
          onChange={(e) => setMarkLostReason(e.target.value)}
        />
        <p className={`text-xs mt-1 ${markLostReason.trim().length >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
          {markLostReason.trim().length}/100 minimum characters
        </p>
      </Modal>

      <Modal
        isOpen={statusChangePending != null}
        onClose={() => {
          setStatusChangePending(null);
          setStatusChangeForm({ title: '', description: '' });
          setStatusChangeAttachments([{ id: crypto.randomUUID(), kind: 'attachment', file: null, title: '' }]);
          setStatusChangeSeriesCode('');
        }}
        title="Change lead status"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setStatusChangePending(null); setStatusChangeForm({ title: '', description: '' }); setStatusChangeAttachments([{ id: crypto.randomUUID(), kind: 'attachment', file: null, title: '' }]); setStatusChangeSeriesCode(''); }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleStatusChangeModalSubmit} disabled={statusChangeSubmitting}>
              {statusChangeSubmitting ? 'Updating…' : 'Confirm & change status'}
            </Button>
          </div>
        }
      >
        {statusChangePending && (() => {
          const statusChangeLead = leads.find((l) => l.id === statusChangePending.leadId);
          const toStatus = leadStatuses.find((s) => s.id === statusChangePending.newStatusId);
          const requiresQuoteNumber = Boolean(toStatus?.set_when_quote_number_generated);
          const leadHasNoQuoteNumber = requiresQuoteNumber && !statusChangeLead?.series?.trim();
          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-slate-600">You can add an optional log for this status change.</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs font-medium mb-0.5">From status</span>
                  <span className="font-medium text-slate-800">
                    {leadStatuses.find((s) => s.id === statusChangePending.currentStatusId)?.label ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs font-medium mb-0.5">To status</span>
                  <span className="font-medium text-slate-800">
                    {leadStatuses.find((s) => s.id === statusChangePending.newStatusId)?.label ?? '—'}
                  </span>
                </div>
              </div>
              {leadHasNoQuoteNumber && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Quote number not set</label>
                  <p className="text-xs text-slate-600">Select a number series and generate a quote number (or use it directly for the first quotation).</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[180px]">
                      <Select
                        placeholder="Number series"
                        value={statusChangeSeriesCode}
                        onChange={(val) => setStatusChangeSeriesCode(String(val ?? ''))}
                        options={[
                          { value: '', label: '— Select series —' },
                          ...seriesList.map((s) => ({ value: s.code ?? '', label: `${s.name} (${s.code})` })),
                        ]}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!statusChangeSeriesCode.trim() || statusChangeGeneratingQuote}
                      onClick={handleStatusChangeGenerateQuote}
                    >
                      {statusChangeGeneratingQuote ? 'Generating…' : 'Generate quote number'}
                    </Button>
                  </div>
                </div>
              )}
              {statusChangeLead?.series?.trim() && (
                <p className="text-xs text-slate-600">Quote number: <strong>{statusChangeLead.series}</strong></p>
              )}
              <Input
                label="Reason / title (optional)"
                placeholder="e.g. Customer confirmed requirements"
                value={statusChangeForm.title}
                onChange={(e) => setStatusChangeForm((f) => ({ ...f, title: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Additional details..."
                  value={statusChangeForm.description}
                  onChange={(e) => setStatusChangeForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File attachments (optional)</label>
                <p className="text-xs text-slate-500 mb-2">Quotation or general attachment; choose type per file. Same as enquiry log.</p>
                <div className="space-y-2">
                  {statusChangeAttachments.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-center gap-2">
                      <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0">
                        <Upload size={12} />
                        <span className="truncate max-w-[120px]">{row.file ? row.file.name : 'Choose file'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setStatusChangeAttachments((prev) => prev.map((r) => (r.id === row.id ? { ...r, file: file ?? null } : r)));
                          }}
                        />
                      </label>
                      <select
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs w-24"
                        value={row.kind}
                        onChange={(e) => setStatusChangeAttachments((prev) => prev.map((r) => (r.id === row.id ? { ...r, kind: e.target.value as 'quotation' | 'attachment' } : r)))}
                      >
                        <option value="quotation">Quotation</option>
                        <option value="attachment">Attachment</option>
                      </select>
                      {row.kind === 'attachment' && (
                        <input
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs min-w-[100px] flex-1 max-w-[160px]"
                          placeholder="Title"
                          value={row.title}
                          onChange={(e) => setStatusChangeAttachments((prev) => prev.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r)))}
                        />
                      )}
                      {row.kind === 'quotation' && <span className="text-xs text-slate-500">Auto from lead</span>}
                      <button
                        type="button"
                        onClick={() => setStatusChangeAttachments((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))}
                        className="p-1.5 rounded text-slate-400 hover:bg-slate-200 hover:text-rose-600"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    onClick={() => setStatusChangeAttachments((prev) => [...prev, { id: crypto.randomUUID(), kind: 'attachment', file: null, title: '' }])}
                  >
                    <Plus size={12} /> Add file
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal
        isOpen={showWonClosedValueModal}
        onClose={() => {
          setShowWonClosedValueModal(false);
          setPendingWonLeadId(null);
          setPendingWonStatusId(null);
          setClosedValueInput('');
          setWonPoFile(null);
        }}
        title="Closed value (required)"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowWonClosedValueModal(false);
                setPendingWonLeadId(null);
                setPendingWonStatusId(null);
                setClosedValueInput('');
                setWonPoFile(null);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleWonClosedValueSubmit} disabled={!closedValueInput.trim() || !wonPoFile}>
              Submit
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          This status is marked as Won. Enter the actual closed deal value (required).
        </p>
        <Input
          label="Closed value"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 50000"
          value={closedValueInput}
          onChange={(e) => setClosedValueInput(e.target.value)}
          containerClassName="max-w-xs"
        />
        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">PO file (required)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
            className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs"
            onChange={(e) => setWonPoFile(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-slate-500">{wonPoFile ? `Selected: ${wonPoFile.name}` : 'Upload purchase order file to proceed.'}</p>
        </div>
      </Modal>

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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {createLeadModalStatusId != null && (
            <div className="text-sm text-slate-600">
              Status: <strong>{leadStatuses.find((s) => s.id === createLeadModalStatusId)?.label ?? '—'}</strong>
            </div>
          )}
          <p className="text-xs text-slate-500">Type a contact name or company name to search. Select from the list (contacts and customers in your region), or fill the form below to create a new contact.</p>
          <div className="relative">
            <Input
              label="Search by contact name or company name"
              value={createLeadSearchName}
              onChange={(e) => onCreateLeadSearchNameChange(e.target.value)}
              onBlur={() => setTimeout(() => { setCreateLeadContactResults([]); setCreateLeadCustomerResults([]); }, 200)}
              placeholder="Type to search..."
            />
            {showCreateLeadSearchDropdown && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                {createLeadContactResults.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-slate-500 px-3 py-2 border-b border-slate-100 bg-slate-50">Contacts</p>
                    {createLeadContactResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col gap-0.5"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCreateLeadContactId(c.id);
                          setCreateLeadCustomerId(undefined);
                          setCreateLeadSearchName([c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.contact_person_name || c.organization?.name || '');
                          setCreateLeadContactResults([]);
                          setCreateLeadCustomerResults([]);
                          setCreateLeadForm((f) => ({ ...f, domain_id: c.domain_id ?? f.domain_id, region_id: c.region_id ?? f.region_id }));
                        }}
                      >
                        <span className="font-medium text-slate-800">{[c.first_name, c.last_name].filter(Boolean).join(' ') || c.contact_person_name || c.organization?.name || 'Contact'}</span>
                        <span className="text-slate-500 text-xs">{[c.contact_email, c.contact_phone, c.organization?.name].filter(Boolean).join(' · ')}</span>
                      </button>
                    ))}
                  </>
                )}
                {createLeadCustomerResults.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-slate-500 px-3 py-2 border-b border-slate-100 bg-slate-50">Customers</p>
                    {createLeadCustomerResults.map((cust) => (
                      <button
                        key={cust.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col gap-0.5"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCreateLeadCustomerId(cust.id);
                          setCreateLeadContactId(undefined);
                          setCreateLeadSearchName(cust.company_name || '');
                          setCreateLeadContactResults([]);
                          setCreateLeadCustomerResults([]);
                          setCreateLeadForm((f) => ({ ...f, domain_id: cust.domain_id ?? f.domain_id, region_id: cust.region_id ?? f.region_id }));
                        }}
                      >
                        <span className="font-medium text-slate-800">{cust.company_name}</span>
                        {cust.organization?.name && <span className="text-slate-500 text-xs">{cust.organization.name}</span>}
                      </button>
                    ))}
                  </>
                )}
                {!hasCreateLeadSearchResults && createLeadSearchName.trim().length >= 2 && canCreateContact && (
                  <p className="text-xs text-slate-500 px-3 py-2 border-t border-slate-100">No matches. Fill the form below to create a new contact.</p>
                )}
              </div>
            )}
          </div>
          {(createLeadContactId != null || createLeadCustomerId != null) && (
            <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">{createLeadContactId != null ? 'Linked to contact' : 'Linked to customer'}</span>
              <button
                type="button"
                onClick={() => { setCreateLeadContactId(undefined); setCreateLeadCustomerId(undefined); }}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 p-0.5"
                title="Unlink"
              >
                <X size={14} /> Unlink
              </button>
            </div>
          )}
          {createLeadContactId == null && createLeadCustomerId == null && (
            <div className="space-y-3 p-3 bg-slate-50/50 rounded-lg border border-slate-200 border-dashed">
              <h4 className="text-sm font-semibold text-slate-700">Or create new contact</h4>
              <p className="text-xs text-slate-500">Fill below to create a contact and link this lead. Domain and at least name + phone or email are required.</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Domain <span className="text-red-500">*</span></label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={createLeadInlineContact.domain_id ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setCreateLeadInlineContact((prev) => ({ ...prev, domain_id: val, region_id: undefined }));
                      setCreateLeadForm((prev) => ({ ...prev, domain_id: val, region_id: undefined }));
                    }}
                  >
                    <option value="">Select domain</option>
                    {createLeadDomains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={createLeadInlineContact.region_id ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setCreateLeadInlineContact((prev) => ({ ...prev, region_id: val }));
                      setCreateLeadForm((prev) => ({ ...prev, region_id: val }));
                    }}
                    disabled={!createLeadInlineContact.domain_id}
                  >
                    <option value="">— None —</option>
                    {createLeadRegions.filter((r) => !createLeadInlineContact.domain_id || r.domain_id === createLeadInlineContact.domain_id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization (optional)</label>
                  <Input
                    value={createLeadInlineOrgQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCreateLeadInlineOrgQuery(v);
                      setCreateLeadInlineContact((prev) => ({ ...prev, organization_id: undefined, plant_id: undefined }));
                      setCreateLeadInlinePlants([]);
                      if (createLeadOrgTimeoutRef.current) clearTimeout(createLeadOrgTimeoutRef.current);
                      if (v.trim().length < 2) { setCreateLeadInlineOrgSuggestions([]); return; }
                      createLeadOrgTimeoutRef.current = setTimeout(() => {
                        marketingAPI.getOrganizations({ page: 1, page_size: 15, search: v.trim(), is_active: true })
                          .then((res) => setCreateLeadInlineOrgSuggestions(res.items ?? []))
                          .catch(() => setCreateLeadInlineOrgSuggestions([]));
                      }, 300);
                    }}
                    onBlur={() => setTimeout(() => setCreateLeadInlineOrgSuggestions([]), 150)}
                    placeholder="Type to search organization"
                  />
                  {createLeadInlineOrgSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-auto">
                      {createLeadInlineOrgSuggestions.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCreateLeadInlineContact((prev) => ({ ...prev, organization_id: org.id, plant_id: undefined }));
                            setCreateLeadInlineOrgQuery(org.name);
                            setCreateLeadInlineOrgSuggestions([]);
                            marketingAPI.getOrganizationPlants(org.id).then((pl) => setCreateLeadInlinePlants(pl)).catch(() => setCreateLeadInlinePlants([]));
                          }}
                        >
                          {org.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="w-20 shrink-0">
                    <Select label="Title" options={NAME_PREFIXES} value={createLeadInlineContact.title} onChange={(v) => setCreateLeadInlineContact((prev) => ({ ...prev, title: (v ?? '') as string }))} placeholder="—" />
                  </div>
                  <div className="flex-1 min-w-0"><Input label="First name" value={createLeadInlineContact.first_name} onChange={(e) => setCreateLeadInlineContact((prev) => ({ ...prev, first_name: e.target.value }))} placeholder="First name" /></div>
                  <div className="flex-1 min-w-0"><Input label="Last name" value={createLeadInlineContact.last_name} onChange={(e) => setCreateLeadInlineContact((prev) => ({ ...prev, last_name: e.target.value }))} placeholder="Last name" /></div>
                </div>
                <Input label="Email" type="email" value={createLeadInlineContact.contact_email} onChange={(e) => setCreateLeadInlineContact((prev) => ({ ...prev, contact_email: e.target.value }))} placeholder="email@example.com" />
                <div className="flex gap-2 items-end">
                  <div className="w-32 shrink-0">
                    <Select label="Phone code" options={COUNTRY_CODES} value={createLeadInlineContact.contact_phone_code} onChange={(v) => setCreateLeadInlineContact((prev) => ({ ...prev, contact_phone_code: (v ?? DEFAULT_COUNTRY_CODE) as string }))} placeholder="Code" searchable getSearchText={getCountryCodeSearchText} getOptionKey={(o) => o.label} />
                  </div>
                  <div className="flex-1 min-w-0"><Input label="Phone" value={createLeadInlineContact.contact_phone} onChange={(e) => setCreateLeadInlineContact((prev) => ({ ...prev, contact_phone: e.target.value }))} placeholder="Number" /></div>
                </div>
                {createLeadInlineContact.organization_id != null && createLeadInlinePlants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plant</label>
                    <Select
                      options={[{ value: '', label: 'None' }, ...createLeadInlinePlants.map((p) => ({ value: String(p.id), label: (p as { plant_name?: string }).plant_name || `Plant ${p.id}` }))]}
                      value={createLeadInlineContact.plant_id != null ? String(createLeadInlineContact.plant_id) : ''}
                      onChange={(val) => setCreateLeadInlineContact((prev) => ({ ...prev, plant_id: val ? Number(val) : undefined }))}
                      placeholder="Select plant"
                      searchable
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <Select
              value={createLeadForm.status_id != null ? String(createLeadForm.status_id) : (createLeadModalStatusId != null ? String(createLeadModalStatusId) : (firstActiveStatusId != null ? String(firstActiveStatusId) : ''))}
              onChange={(val) => setCreateLeadForm((f) => ({ ...f, status_id: val ? Number(val) : undefined }))}
              options={[{ value: '', label: '— Default —' }, ...leadStatuses.filter((s) => s.is_active).map((s) => ({ value: String(s.id), label: s.label }))]}
              placeholder="Status"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quotation number series</label>
            <Select
              value={createLeadForm.series_code || ''}
              onChange={(val) => {
                setCreateLeadForm((f) => ({ ...f, series_code: (val ?? '') as string }));
                setCreateLeadGeneratedSeries('');
              }}
              options={[
                { value: '', label: '— None —' },
                ...seriesList.map((s) => ({ value: String(s.code), label: `${s.name} (${s.code})` })),
              ]}
              placeholder="Select series"
              searchable
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!createLeadForm.series_code?.trim() || createLeadGeneratingQuote}
                onClick={handleCreateLeadGenerateQuote}
              >
                {createLeadGeneratingQuote ? 'Generating…' : 'Generate quote number'}
              </Button>
              {createLeadGeneratedSeries && (
                <span className="text-xs text-slate-700">Quote number: <strong>{createLeadGeneratedSeries}</strong></span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Select series, then click Generate. Generated quote number will be saved on lead create.</p>
          </div>
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
          setEditingGroup(null);
          setAddingGroup(false);
          setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, is_lost: false, hex_color: '', set_when_quotation_added: false, set_when_quote_number_generated: false });
          setGroupForm({ code: '', label: '', expected_duration_days: undefined, follow_up_interval_days: undefined, display_order: 0, is_active: true, hex_color: '' });
        }}
        title="Lead statuses & groups"
        contentClassName="max-w-6xl"
      >
        <div className="max-h-[85vh] overflow-y-auto overflow-x-hidden pr-1">
          {/* Status groups — inline add/edit in table */}
          <h4 className="text-sm font-semibold text-slate-700 mb-1">1. Status groups</h4>
          <p className="text-xs text-slate-500 mb-2">Click &quot;Create group&quot; to add a row; edit or save inline in the table.</p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="px-2 py-1.5">Code</th>
                  <th className="px-2 py-1.5">Label</th>
                  <th className="px-2 py-1.5" title="Expected duration">Days</th>
                  <th className="px-2 py-1.5" title="Follow-up task every N days">Follow-up</th>
                  <th className="px-2 py-1.5">Order</th>
                  <th className="px-2 py-1.5">Active</th>
                  <th className="px-2 py-1.5">Color</th>
                  <th className="px-2 py-1.5">
                    {canEdit && (
                      <Button variant="ghost" size="xs" className="text-indigo-600" onClick={() => { setAddingGroup(true); setEditingGroup(null); setGroupForm({ code: '', label: '', expected_duration_days: undefined, follow_up_interval_days: undefined, display_order: leadStatusGroups.length, is_active: true, hex_color: '' }); }} leftIcon={<Plus size={12} />}>
                        Create group
                      </Button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {canEdit && addingGroup && (
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <td className="px-2 py-1 align-middle">
                      <input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="e.g. follow_up" value={groupForm.code} onChange={(e) => setGroupForm((f) => ({ ...f, code: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="e.g. Follow-up" value={groupForm.label} onChange={(e) => setGroupForm((f) => ({ ...f, label: e.target.value }))} />
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="—" value={groupForm.expected_duration_days ?? ''} onChange={(e) => setGroupForm((f) => ({ ...f, expected_duration_days: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 }))} />
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="—" title="Task every N days" value={groupForm.follow_up_interval_days ?? ''} onChange={(e) => setGroupForm((f) => ({ ...f, follow_up_interval_days: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 }))} />
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" value={groupForm.display_order} onChange={(e) => setGroupForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} />
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm">
                        <input type="checkbox" checked={groupForm.is_active} onChange={(e) => setGroupForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                        <span>Active</span>
                      </label>
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <div className="flex items-center gap-1.5">
                        <input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" value={groupForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(groupForm.hex_color) ? groupForm.hex_color : '#3b82f6'} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} title="Color" />
                        <input className="h-8 w-20 rounded border border-slate-200 bg-white px-2 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="#3b82f6" value={groupForm.hex_color} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} title="Hex color" />
                      </div>
                    </td>
                    <td className="px-2 py-1 align-middle">
                      <div className="flex gap-1">
                        <Button size="xs" onClick={saveGroup} disabled={savingGroup || !groupForm.label?.trim()}>{savingGroup ? '...' : 'Save'}</Button>
                        <Button size="xs" variant="outline" onClick={cancelGroupForm}>Cancel</Button>
                      </div>
                    </td>
                  </tr>
                )}
                {leadStatusGroups.map((g) =>
                  canEdit && editingGroup?.id === g.id ? (
                    <tr key={g.id} className="bg-amber-50/50 border-b border-slate-200">
                      <td className="px-2 py-1.5">
                        <input className="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono" placeholder="Code" value={groupForm.code} onChange={(e) => setGroupForm((f) => ({ ...f, code: e.target.value }))} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="w-full rounded border border-slate-300 px-2 py-1 text-sm" placeholder="Label" value={groupForm.label} onChange={(e) => setGroupForm((f) => ({ ...f, label: e.target.value }))} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-14 rounded border border-slate-300 px-2 py-1 text-sm" value={groupForm.expected_duration_days ?? ''} onChange={(e) => setGroupForm((f) => ({ ...f, expected_duration_days: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 }))} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-14 rounded border border-slate-300 px-2 py-1 text-sm" title="Follow-up task every N days" value={groupForm.follow_up_interval_days ?? ''} onChange={(e) => setGroupForm((f) => ({ ...f, follow_up_interval_days: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 }))} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-14 rounded border border-slate-300 px-2 py-1 text-sm" value={groupForm.display_order} onChange={(e) => setGroupForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} />
                      </td>
                      <td className="px-2 py-1.5">
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={groupForm.is_active} onChange={(e) => setGroupForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                          <span className="text-xs">Active</span>
                        </label>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5" value={groupForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(groupForm.hex_color) ? groupForm.hex_color : '#3b82f6'} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} title="Color" />
                          <input className="w-20 rounded border border-slate-300 px-2 py-1 text-sm font-mono" placeholder="#3b82f6" value={groupForm.hex_color} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} title="Hex color" />
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <Button size="xs" onClick={saveGroup} disabled={savingGroup || !groupForm.label?.trim()}>{savingGroup ? '...' : 'Save'}</Button>
                          <Button size="xs" variant="outline" onClick={cancelGroupForm}>Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={g.id} className="border-b border-slate-100">
                      <td className="px-2 py-1 font-mono text-slate-700">{g.code}</td>
                      <td className="px-2 py-1 align-middle">{g.label}</td>
                      <td className="px-2 py-1 align-middle">{g.expected_duration_days ?? '—'}</td>
                      <td className="px-2 py-1 align-middle">{g.follow_up_interval_days ?? '—'}</td>
                      <td className="px-2 py-1 align-middle">{g.display_order}</td>
                      <td className="px-2 py-1 align-middle">{g.is_active ? 'Yes' : 'No'}</td>
                      <td className="px-2 py-1 align-middle">
                        {g.hex_color ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-5 w-5 rounded border border-slate-300 shrink-0" style={{ backgroundColor: g.hex_color }} title={g.hex_color} />
                            <span className="text-xs font-mono text-slate-600">{g.hex_color}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-1 align-middle">
                        {canEdit && (
                          <>
                            <Button variant="ghost" size="xs" className="text-indigo-600" onClick={() => openAddStatusToGroup(g.id)} leftIcon={<Plus size={12} />}>Add status</Button>
                            <Button variant="ghost" size="xs" onClick={() => { setEditingGroup(g); setAddingGroup(false); setGroupForm({ code: g.code, label: g.label, expected_duration_days: g.expected_duration_days ?? undefined, follow_up_interval_days: g.follow_up_interval_days ?? undefined, display_order: g.display_order, is_active: g.is_active, hex_color: g.hex_color ?? '' }); }}>Edit</Button>
                            <Button variant="ghost" size="xs" className="text-rose-600" onClick={() => setDeleteGroupId(g.id)}>Delete</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Statuses — inline add/edit in the table below */}
          <h4 className="text-sm font-semibold text-slate-700 mb-1 mt-4">2. Statuses</h4>
          <p className="text-xs text-slate-500 mb-2">Click &quot;Add status&quot; next to a group to add a row; edit or save inline in the table.</p>
          <div className="border-t border-slate-200 pt-3 mt-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-200">
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2 pr-2">Code</th>
                  <th className="pb-2 pr-2">Label</th>
                  <th className="pb-2 pr-2">Order</th>
                  <th className="pb-2 pr-2">Active</th>
                  <th className="pb-2 pr-2">Final (Won)</th>
                  <th className="pb-2 pr-2">Lost</th>
                  <th className="pb-2 pr-2">Color</th>
                  <th className="pb-2 pr-2" title="Auto-set lead to this status when a quotation is added to any enquiry">When quotation added</th>
                  <th className="pb-2 pr-2" title="Auto-set when quote number generated (Generate button) but no quotation file yet">When quote # only</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const byGroup = new Map<number | 'none', LeadStatusOption[]>();
                  leadStatuses.forEach((s) => {
                    const key = s.group_id ?? 'none';
                    if (!byGroup.has(key)) byGroup.set(key, []);
                    byGroup.get(key)!.push(s);
                  });
                  const groupOrder = [...leadStatusGroups.filter((g) => g.is_active).map((g) => g.id), 'none' as const];
                  return groupOrder.map((groupId) => {
                    const statuses = byGroup.get(groupId) ?? [];
                    if (statuses.length === 0 && groupId === 'none') return null;
                    const groupLabel = groupId === 'none' ? '— No group —' : leadStatusGroups.find((g) => g.id === groupId)?.label ?? `Group #${groupId}`;
                    return (
                      <React.Fragment key={groupId === 'none' ? 'nogroup' : groupId}>
                        <tr className="bg-slate-100/80">
                          <td colSpan={10} className="py-1.5 px-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            <div className="flex items-center justify-between">
                              <span>{groupLabel}</span>
                              {groupId !== 'none' && canEdit && (
                                <Button variant="ghost" size="xs" className="text-indigo-600" onClick={() => openAddStatusToGroup(groupId)} leftIcon={<Plus size={12} />}>
                                  Add status
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {canEdit && statusForm.group_id === groupId && !editingStatus && (
                          <tr className="border-b border-slate-100 bg-slate-50/80">
                            <td className="py-2 pr-2 align-middle">
                              <input className="h-8 w-full max-w-[7rem] rounded border border-slate-200 bg-white px-2 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="Code" value={statusForm.code} onChange={(e) => setStatusForm((f) => ({ ...f, code: e.target.value }))} />
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="Label" value={statusForm.label} onChange={(e) => setStatusForm((f) => ({ ...f, label: e.target.value }))} />
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" value={statusForm.display_order} onChange={(e) => setStatusForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} />
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm">
                                <input type="checkbox" checked={statusForm.is_active} onChange={(e) => setStatusForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                                <span>Active</span>
                              </label>
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm" title="Final (Won)">
                                <input type="checkbox" checked={statusForm.is_final} onChange={(e) => setStatusForm((f) => ({ ...f, is_final: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                                <span>Final</span>
                              </label>
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm" title="Lost">
                                <input type="checkbox" checked={statusForm.is_lost} onChange={(e) => setStatusForm((f) => ({ ...f, is_lost: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                                <span>Lost</span>
                              </label>
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <div className="flex items-center gap-1.5">
                                <input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" value={statusForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(statusForm.hex_color) ? statusForm.hex_color : '#3b82f6'} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} title="Color" />
                                <input className="h-8 w-20 rounded border border-slate-200 bg-white px-2 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="#3b82f6" value={statusForm.hex_color} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} title="Hex color" />
                              </div>
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm" title="Auto-set lead to this status when a quotation is added to any enquiry">
                                <input type="checkbox" checked={statusForm.set_when_quotation_added} onChange={(e) => setStatusForm((f) => ({ ...f, set_when_quotation_added: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                                <span>Yes</span>
                              </label>
                            </td>
                            <td className="py-2 pr-2 align-middle">
                              <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm" title="Auto-set when quote number generated but no quotation file yet">
                                <input type="checkbox" checked={statusForm.set_when_quote_number_generated} onChange={(e) => setStatusForm((f) => ({ ...f, set_when_quote_number_generated: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                                <span>Yes</span>
                              </label>
                            </td>
                            <td className="py-2 align-middle">
                              <div className="flex gap-1">
                                <Button size="xs" onClick={saveStatus} disabled={savingStatus || !statusForm.label?.trim()}>{savingStatus ? '...' : 'Save'}</Button>
                                <Button size="xs" variant="outline" onClick={() => { setEditingStatus(null); setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, is_lost: false, hex_color: '', set_when_quotation_added: false, set_when_quote_number_generated: false }); }}>Cancel</Button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {statuses.length === 0 && !(canEdit && statusForm.group_id === groupId && !editingStatus) ? (
                          <tr>
                            <td colSpan={10} className="py-2 px-2 text-slate-400 text-xs italic">No statuses yet. Click &quot;Add status&quot; above.</td>
                          </tr>
                        ) : (
                          statuses.map((s) =>
                            canEdit && editingStatus?.id === s.id ? (
                              <tr key={s.id} className="border-b border-slate-100 bg-slate-50/80">
                                <td className="py-2 pr-2 align-middle">
                                  <input className="h-8 w-full max-w-[7rem] rounded border border-slate-200 bg-white px-2 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="Code" value={statusForm.code} onChange={(e) => setStatusForm((f) => ({ ...f, code: e.target.value }))} />
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="Label" value={statusForm.label} onChange={(e) => setStatusForm((f) => ({ ...f, label: e.target.value }))} />
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" value={statusForm.display_order} onChange={(e) => setStatusForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} />
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={statusForm.is_active} onChange={(e) => setStatusForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Active</span></label>
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={statusForm.is_final} onChange={(e) => setStatusForm((f) => ({ ...f, is_final: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Final</span></label>
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={statusForm.is_lost} onChange={(e) => setStatusForm((f) => ({ ...f, is_lost: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Lost</span></label>
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <div className="flex items-center gap-1.5">
                                    <input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" value={statusForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(statusForm.hex_color) ? statusForm.hex_color : '#3b82f6'} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} title="Color" />
                                    <input className="h-8 w-20 rounded border border-slate-200 bg-white px-2 text-sm font-mono focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200" placeholder="#3b82f6" value={statusForm.hex_color} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} title="Hex color" />
                                  </div>
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm">
                                    <input type="checkbox" checked={statusForm.set_when_quotation_added} onChange={(e) => setStatusForm((f) => ({ ...f, set_when_quotation_added: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                                    <span>Yes</span>
                                  </label>
                                </td>
                                <td className="py-2 pr-2 align-middle">
                                  <label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm">
                                    <input type="checkbox" checked={statusForm.set_when_quote_number_generated} onChange={(e) => setStatusForm((f) => ({ ...f, set_when_quote_number_generated: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" />
                                    <span>Yes</span>
                                  </label>
                                </td>
                                <td className="py-2 align-middle">
                                  <div className="flex gap-1">
                                    <Button size="xs" onClick={saveStatus} disabled={savingStatus || !statusForm.label?.trim()}>{savingStatus ? '...' : 'Save'}</Button>
                                    <Button size="xs" variant="outline" onClick={() => { setEditingStatus(null); setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, is_lost: false, hex_color: '', set_when_quotation_added: false, set_when_quote_number_generated: false }); }}>Cancel</Button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={s.id} className="border-b border-slate-100">
                                <td className="py-2 pr-2 font-mono text-slate-700 align-middle">{s.code}</td>
                                <td className="py-2 pr-2 align-middle">{s.label}</td>
                                <td className="py-2 pr-2 align-middle">{s.display_order}</td>
                                <td className="py-2 pr-2 align-middle">{s.is_active ? 'Yes' : 'No'}</td>
                                <td className="py-2 pr-2 align-middle">{s.is_final ? 'Yes' : '—'}</td>
                                <td className="py-2 pr-2 align-middle">{s.is_lost ? 'Yes' : '—'}</td>
                                <td className="py-2 pr-2 align-middle">
                                  {s.hex_color ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="inline-block h-5 w-5 rounded border border-slate-300 shrink-0" style={{ backgroundColor: s.hex_color }} title={s.hex_color} />
                                      <span className="text-xs font-mono text-slate-600">{s.hex_color}</span>
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="py-2 pr-2 align-middle">{s.set_when_quotation_added ? 'Yes' : '—'}</td>
                                <td className="py-2 pr-2 align-middle">{s.set_when_quote_number_generated ? 'Yes' : '—'}</td>
                                <td className="py-2 align-middle">
                                  {canEdit && <Button variant="ghost" size="xs" onClick={() => openEditStatus(s)}>Edit</Button>}
                                  {canDelete && <Button variant="ghost" size="xs" className="text-rose-600" onClick={() => setDeleteStatusId(s.id)}>Delete</Button>}
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
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
        isOpen={deleteGroupId != null}
        onClose={() => setDeleteGroupId(null)}
        onConfirm={confirmDeleteGroup}
        title="Delete status group"
        message="Are you sure? Statuses in this group will be ungrouped."
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
