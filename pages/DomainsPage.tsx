/**
 * Domains Management Page
 * Manage marketing domains (Domestic, Export, etc.)
 * List view: table of domains/regions. Review view: hierarchy of domain heads → region heads → region employees with edit actions.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { FilterPopover } from '../components/ui/FilterPopover';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Edit, Trash2, Globe, CheckCircle, XCircle, MapPin, ChevronDown, ChevronRight, Filter, X, Users, UserPlus, User } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { marketingAPI, Domain, Region, AssignmentWithEmployee, HRMSEmployee, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, DomainTargetSummaryResponse } from '../lib/marketing-api';
import { Target, List, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { SegmentToggle } from '../components/ui/SegmentToggle';

type ViewMode = 'list' | 'review';

type TargetHierarchyModal =
  | { kind: 'employee'; employee_id: number; employee_name: string; region_id: number; current_amount: number }
  | { kind: 'region'; region_id: number; region_name: string; rolled_up: number; assigned: number | null | undefined }
  | { kind: 'domain'; domain_id: number; domain_name: string; rolled_up: number; assigned: number | null | undefined };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getCurrentYearMonth(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const ONE_LAKH = 1_00_000;
const ONE_CRORE = 1_00_00_000;

function formatTargetAmount(amount: number): string {
  if (amount >= ONE_CRORE) return `₹${(amount / ONE_CRORE).toFixed(2)} Cr`;
  if (amount >= ONE_LAKH) return `₹${(amount / ONE_LAKH).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const DomainsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_domain'));
  const canCreate = useAppSelector(selectHasPermission('marketing.create_domain'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_domain'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_domain'));
  const canViewRegion = useAppSelector(selectHasPermission('marketing.view_region'));
  const canCreateRegion = useAppSelector(selectHasPermission('marketing.create_region'));
  const canEditRegion = useAppSelector(selectHasPermission('marketing.edit_region'));
  const canDeleteRegion = useAppSelector(selectHasPermission('marketing.delete_region'));
  const canAssignEmployeeRegion = useAppSelector(selectHasPermission('marketing.assign_employee_region'));
  const canManageRegionEmployees = canAssignEmployeeRegion || canViewRegion || canView;

  const [viewMode, setViewMode] = useState<ViewMode>('review');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [tempFilterActive, setTempFilterActive] = useState<boolean | null>(null);
  const [deleteDomainId, setDeleteDomainId] = useState<number | null>(null);
  const [deleteRegionId, setDeleteRegionId] = useState<number | null>(null);
  const filterButtonRef = React.useRef<HTMLDivElement>(null);

  // Review view: hierarchy data
  const [reviewDomains, setReviewDomains] = useState<Domain[]>([]);
  const [reviewRegions, setReviewRegions] = useState<Region[]>([]);
  const [reviewAssignments, setReviewAssignments] = useState<AssignmentWithEmployee[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  // Modals: set domain head, set region head, add region employee, change role, remove assignment
  const [setDomainHeadDomain, setSetDomainHeadDomain] = useState<Domain | null>(null);
  const [setRegionHeadRegion, setSetRegionHeadRegion] = useState<Region | null>(null);
  const [addEmployeeRegion, setAddEmployeeRegion] = useState<Region | null>(null);
  const [addEmployeeSelected, setAddEmployeeSelected] = useState<HRMSEmployee | null>(null);
  const [addEmployeeRole, setAddEmployeeRole] = useState<'head' | 'employee'>('employee');
  const [addEmployeeSubmitting, setAddEmployeeSubmitting] = useState(false);
  const [changeRoleAssignment, setChangeRoleAssignment] = useState<AssignmentWithEmployee | null>(null);
  const [removeAssignmentId, setRemoveAssignmentId] = useState<number | null>(null);
  const [headSelectSubmitting, setHeadSelectSubmitting] = useState(false);
  const [domainHeadEmployeeId, setDomainHeadEmployeeId] = useState<number | ''>('');
  const [regionHeadEmployeeId, setRegionHeadEmployeeId] = useState<number | ''>('');

  // Target summary (Review view): year/month and hierarchy with target amounts
  const [targetYear, setTargetYear] = useState(() => getCurrentYearMonth().year);
  const [targetMonth, setTargetMonth] = useState(() => getCurrentYearMonth().month);
  const [targetSummary, setTargetSummary] = useState<DomainTargetSummaryResponse | null>(null);
  const [targetSummaryLoading, setTargetSummaryLoading] = useState(false);
  const [targetHierarchyModal, setTargetHierarchyModal] = useState<TargetHierarchyModal | null>(null);
  const [setTargetAmount, setSetTargetAmount] = useState<string>('');
  const [setTargetSubmitting, setSetTargetSubmitting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!canView) {
      showToast('You do not have permission to view domains', 'error');
      return;
    }
    loadData();
  }, [canView, debouncedSearchTerm, filterActive, page, pageSize]);

  const loadReviewData = async () => {
    setReviewLoading(true);
    try {
      const [domainsRes, regionsRes, assignmentsList] = await Promise.all([
        marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 }),
        marketingAPI.getRegions({ is_active: true, page: 1, page_size: 100 }),
        marketingAPI.getAllAssignments(),
      ]);
      setReviewDomains(domainsRes.items);
      setReviewRegions(regionsRes.items);
      setReviewAssignments(assignmentsList || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load review data', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (canView && viewMode === 'review') {
      loadReviewData();
    }
  }, [canView, viewMode]);

  const loadDomainTargetSummary = async () => {
    setTargetSummaryLoading(true);
    try {
      const res = await marketingAPI.getDomainTargetSummary(targetYear, targetMonth);
      setTargetSummary(res);
    } catch (error: any) {
      showToast(error.message || 'Failed to load target summary', 'error');
      setTargetSummary(null);
    } finally {
      setTargetSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (canView && viewMode === 'review') {
      loadDomainTargetSummary();
    }
  }, [canView, viewMode, targetYear, targetMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await marketingAPI.getDomains({
        page,
        page_size: pageSize,
        search: debouncedSearchTerm || undefined,
        is_active: filterActive !== null ? filterActive : undefined
      });
      setDomains(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (error: any) {
      showToast(error.message || 'Failed to load domains', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDomainConfirm = (id: number) => {
    if (!canDelete) {
      showToast('You do not have permission to delete domains', 'error');
      return;
    }
    setDeleteDomainId(id);
  };

  const handleConfirmDeleteDomain = async () => {
    if (deleteDomainId == null) return;
    try {
      await marketingAPI.deleteDomain(deleteDomainId);
      showToast('Domain deleted successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete domain', 'error');
    }
  };


  const toggleDomainExpansion = async (domainId: number) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domainId)) {
      newExpanded.delete(domainId);
    } else {
      newExpanded.add(domainId);
      // Load regions for this domain
      await loadRegionsForDomain(domainId);
    }
    setExpandedDomains(newExpanded);
  };

  const loadRegionsForDomain = async (domainId: number) => {
    setIsLoadingRegions(true);
    try {
      const res = await marketingAPI.getRegions({ domain_id: domainId, page: 1, page_size: 100 });
      const regionsData = res.items;
      setRegions(prev => {
        const updated = [...prev];
        regionsData.forEach(region => {
          const index = updated.findIndex(r => r.id === region.id);
          if (index >= 0) {
            updated[index] = region;
          } else {
            updated.push(region);
          }
        });
        return updated;
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to load regions', 'error');
    } finally {
      setIsLoadingRegions(false);
    }
  };


  const openDeleteRegionConfirm = (regionId: number) => {
    if (!canDeleteRegion) {
      showToast('You do not have permission to delete regions', 'error');
      return;
    }
    setDeleteRegionId(regionId);
  };

  const handleConfirmDeleteRegion = async () => {
    if (deleteRegionId == null) return;
    try {
      await marketingAPI.deleteRegion(deleteRegionId);
      showToast('Region deleted successfully', 'success');
      setDeleteRegionId(null);
      if (selectedDomain) {
        await loadRegionsForDomain(selectedDomain.id);
      }
      if (viewMode === 'review') await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete region', 'error');
    }
  };

  // ——— Review: Set domain head ———
  const handleSetDomainHead = async () => {
    const d = setDomainHeadDomain;
    if (!d || (domainHeadEmployeeId !== '' && !domainHeadEmployeeId)) return;
    setHeadSelectSubmitting(true);
    try {
      if (domainHeadEmployeeId === '') {
        await marketingAPI.updateDomain(d.id, { head_employee_id: undefined, head_username: undefined, head_email: undefined });
        showToast('Domain head cleared', 'success');
      } else {
        const res = await marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' });
        const emp = res.employees.find((e) => e.id === Number(domainHeadEmployeeId));
        const displayName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '' : '';
        await marketingAPI.updateDomain(d.id, {
          head_employee_id: Number(domainHeadEmployeeId),
          head_username: displayName || undefined,
          head_email: emp?.email || undefined,
        });
        showToast(displayName ? `${displayName} set as Domain Head` : 'Domain head updated', 'success');
      }
      setSetDomainHeadDomain(null);
      setDomainHeadEmployeeId('');
      await loadReviewData();
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to set domain head', 'error');
    } finally {
      setHeadSelectSubmitting(false);
    }
  };

  // ——— Review: Set region head ———
  const handleSetRegionHead = async () => {
    const r = setRegionHeadRegion;
    if (!r || (regionHeadEmployeeId !== '' && !regionHeadEmployeeId)) return;
    setHeadSelectSubmitting(true);
    try {
      if (regionHeadEmployeeId === '') {
        await marketingAPI.updateRegion(r.id, { head_employee_id: undefined, head_username: undefined });
        showToast('Region head cleared', 'success');
      } else {
        const res = await marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' });
        const emp = res.employees.find((e) => e.id === Number(regionHeadEmployeeId));
        const displayName = emp ? [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '' : '';
        await marketingAPI.updateRegion(r.id, {
          head_employee_id: Number(regionHeadEmployeeId),
          head_username: displayName || undefined,
        });
        showToast(displayName ? `${displayName} set as Region Head` : 'Region head updated', 'success');
      }
      setSetRegionHeadRegion(null);
      setRegionHeadEmployeeId('');
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to set region head', 'error');
    } finally {
      setHeadSelectSubmitting(false);
    }
  };

  // ——— Review: Add region employee ———
  const handleAddRegionEmployee = async () => {
    const region = addEmployeeRegion;
    const emp = addEmployeeSelected;
    if (!region || !emp) return;
    setAddEmployeeSubmitting(true);
    try {
      const displayName = [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.email || '';
      await marketingAPI.assignEmployeeToRegion({
        employee_id: emp.id,
        region_id: region.id,
        role: addEmployeeRole,
        employee_name: displayName || undefined,
        employee_email: emp.email || undefined,
      });
      showToast(addEmployeeRole === 'head' ? `${displayName} set as Region Head` : 'Employee assigned to region', 'success');
      setAddEmployeeRegion(null);
      setAddEmployeeSelected(null);
      setAddEmployeeRole('employee');
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to assign employee', 'error');
    } finally {
      setAddEmployeeSubmitting(false);
    }
  };

  // ——— Review: Change assignment role ———
  const handleChangeAssignmentRole = async (assignmentId: number, newRole: 'head' | 'employee') => {
    try {
      await marketingAPI.updateEmployeeAssignment(assignmentId, { role: newRole });
      showToast('Role updated', 'success');
      setChangeRoleAssignment(null);
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to update role', 'error');
    }
  };

  // ——— Review: Remove assignment ———
  const handleConfirmRemoveAssignment = async () => {
    if (removeAssignmentId == null) return;
    try {
      await marketingAPI.removeEmployeeFromRegion(removeAssignmentId);
      showToast('Removed from region', 'success');
      setRemoveAssignmentId(null);
      await loadReviewData();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove', 'error');
    }
  };

  // ——— Review: Set employee target ———
  const handleSaveHierarchyTarget = async () => {
    const m = targetHierarchyModal;
    if (!m) return;
    const amount = parseFloat(setTargetAmount);
    if (Number.isNaN(amount) || amount < 0) {
      showToast('Enter a valid amount (0 clears an explicit domain/region goal)', 'error');
      return;
    }
    setSetTargetSubmitting(true);
    try {
      if (m.kind === 'employee') {
        await marketingAPI.setEmployeeTarget(m.employee_id, targetYear, targetMonth, amount);
      } else if (m.kind === 'region') {
        await marketingAPI.setRegionTarget(m.region_id, targetYear, targetMonth, amount);
      } else {
        await marketingAPI.setDomainTarget(m.domain_id, targetYear, targetMonth, amount);
      }
      showToast(amount === 0 && m.kind !== 'employee' ? 'Goal cleared' : 'Target updated', 'success');
      setTargetHierarchyModal(null);
      setSetTargetAmount('');
      await loadDomainTargetSummary();
    } catch (error: any) {
      showToast(error.message || 'Failed to update target', 'error');
    } finally {
      setSetTargetSubmitting(false);
    }
  };

  // Helper: get employee target from summary by region_id and employee_id
  const getEmployeeTarget = (regionId: number, employeeId: number): number | null => {
    if (!targetSummary) return null;
    for (const d of targetSummary.domains) {
      const region = d.regions.find((r) => r.region_id === regionId);
      if (!region) continue;
      const emp = region.employees.find((e) => e.employee_id === employeeId);
      return emp ? emp.target_amount : null;
    }
    return null;
  };
  const getRegionTargetInfo = (regionId: number): { rolledUp: number; assigned: number | null | undefined } | null => {
    if (!targetSummary) return null;
    for (const d of targetSummary.domains) {
      const region = d.regions.find((r) => r.region_id === regionId);
      if (region) return { rolledUp: region.total_target, assigned: region.assigned_target };
    }
    return null;
  };
  const getDomainTargetInfo = (domainId: number): { rolledUp: number; assigned: number | null | undefined } | null => {
    if (!targetSummary) return null;
    const d = targetSummary.domains.find((x) => x.domain_id === domainId);
    return d ? { rolledUp: d.total_target, assigned: d.assigned_target } : null;
  };

  const filteredDomains = domains;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  if (!canView) {
    return (
      <PageLayout title="Domains" breadcrumbs={[{ label: 'Domains', href: '/domains' }]}>
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view domains.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_domain</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Domains' },
  ];

  const actions = (
    <div className="flex items-center gap-2">
      <SegmentToggle
        options={[
          { value: 'list', label: 'List', icon: List },
          { value: 'review', label: 'Review', icon: Eye },
        ]}
        value={viewMode}
        onChange={(val) => setViewMode(val as ViewMode)}
      />
      {canCreate && (
        <Button
          size="sm"
          onClick={() => navigate('/domains/new')}
          leftIcon={<Plus size={14} strokeWidth={3} />}
        >
          Add Domain
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout title="Domains" actions={actions} breadcrumbs={breadcrumbs}>
      {viewMode === 'review' ? (
        /* ——— Review: hierarchy (domain heads → region heads → region employees) + target amounts ——— */
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            View and manage the marketing hierarchy: domain heads, region heads, and region employees. Set employee targets (rolled up to region and domain), and optionally set explicit monthly goals per region or domain. Use 0 on a region/domain goal to clear it.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Period:</span>
              <Select
                options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: MONTHS[i] }))}
                value={String(targetMonth)}
                onChange={(val) => val && setTargetMonth(Number(val))}
                searchable={false}
                clearable={false}
                className="min-w-[80px] w-auto"
              />
              <Select
                options={Array.from({ length: 15 }, (_, i) => {
                  const y = new Date().getFullYear() - 2 + i;
                  return { value: String(y), label: String(y) };
                })}
                value={String(targetYear)}
                onChange={(val) => val && setTargetYear(Number(val))}
                searchable={false}
                clearable={false}
                className="min-w-[100px] w-auto"
              />
            </div>
            {targetSummaryLoading && <span className="text-sm text-slate-500">Loading targets…</span>}
            {targetSummary && !targetSummaryLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 border border-indigo-100">
                <Target size={18} className="text-indigo-600 shrink-0" />
                <span className="text-sm font-medium text-indigo-900">Total target:</span>
                <span className="text-lg font-semibold text-indigo-700">{formatTargetAmount(targetSummary.total_target)}</span>
              </div>
            )}
          </div>
          {reviewLoading ? (
            <Card>
              <div className="flex items-center justify-center py-16">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                <span className="ml-3 text-slate-600">Loading hierarchy...</span>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {reviewDomains.length === 0 ? (
                <Card>
                  <div className="text-center py-12 text-slate-600">No domains found. Create a domain first.</div>
                </Card>
              ) : (
                <Card className="p-4">
                  {/* Tree: domain → region → employee */}
                  {reviewDomains.map((domain, domainIdx) => {
                    const domainRegions = reviewRegions.filter((r) => r.domain_id === domain.id);
                    const domainTargetInfo = getDomainTargetInfo(domain.id);
                    return (
                      <div
                        key={domain.id}
                        className={`tree-root ${domainIdx < reviewDomains.length - 1 ? 'mb-8 pb-6 border-b border-slate-100' : ''}`}
                      >
                        {/* Level 0: Domain (root) */}
                        <div className="tree-node flex items-center gap-2 py-2 pr-2 rounded-md hover:bg-slate-50/80 group">
                          <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-300" aria-hidden />
                          <Globe size={18} className="text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{domain.name}</span>
                          {domain.code && <Badge variant="outline" className="text-xs">{domain.code}</Badge>}
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-sm text-slate-600">Head:</span>
                          <span className="text-sm font-medium text-slate-800">{domain.head_username || '—'}</span>
                          {domainTargetInfo != null && (
                            <>
                              <span className="text-slate-400 mx-1">·</span>
                              <span className="text-sm text-slate-600">
                                {domainTargetInfo.assigned != null && domainTargetInfo.assigned > 0 ? (
                                  <>
                                    <span className="font-medium text-slate-700">Goal: </span>
                                    <span className="font-semibold text-indigo-700">{formatTargetAmount(domainTargetInfo.assigned)}</span>
                                    {Math.abs(domainTargetInfo.assigned - domainTargetInfo.rolledUp) > 1 && (
                                      <span className="text-slate-500 font-normal"> (team {formatTargetAmount(domainTargetInfo.rolledUp)})</span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium text-slate-700">Team target: </span>
                                    <span className="font-semibold text-indigo-700">{formatTargetAmount(domainTargetInfo.rolledUp)}</span>
                                  </>
                                )}
                              </span>
                            </>
                          )}
                          <div className="ml-auto flex items-center gap-1 shrink-0">
                            {canEdit && domainTargetInfo != null && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Set domain goal"
                                onClick={() => {
                                  setTargetHierarchyModal({
                                    kind: 'domain',
                                    domain_id: domain.id,
                                    domain_name: domain.name,
                                    rolled_up: domainTargetInfo.rolledUp,
                                    assigned: domainTargetInfo.assigned,
                                  });
                                  setSetTargetAmount(
                                    String(
                                      domainTargetInfo.assigned != null && domainTargetInfo.assigned > 0
                                        ? domainTargetInfo.assigned
                                        : domainTargetInfo.rolledUp
                                    )
                                  );
                                }}
                              >
                                <Target size={14} />
                              </Button>
                            )}
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setSetDomainHeadDomain(domain);
                                  setDomainHeadEmployeeId(domain.head_employee_id ?? '');
                                }}
                              >
                                {domain.head_username ? 'Change' : 'Set'}
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Level 1: Regions (children of domain) */}
                        <div className="tree-children border-l-2 border-slate-200 ml-2 pl-3">
                          {domainRegions.length === 0 ? (
                            <div className="tree-node flex items-center gap-2 py-1.5 text-slate-500 text-sm italic">
                              <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-200" aria-hidden />
                              No regions
                            </div>
                          ) : (
                            domainRegions.map((region, rIdx) => {
                              const regionAssignments = reviewAssignments.filter((a) => a.region_id === region.id);
                              const isLastRegion = rIdx === domainRegions.length - 1;
                              const regionTargetInfo = getRegionTargetInfo(region.id);
                              return (
                                <div key={region.id} className={isLastRegion ? '' : 'mb-1'}>
                                  {/* Region row */}
                                  <div className="tree-node flex items-center gap-2 py-2 pr-2 rounded-md hover:bg-slate-50/80 group">
                                    <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-300" aria-hidden />
                                    <MapPin size={16} className="text-emerald-600 shrink-0" />
                                    <span className="font-medium text-slate-800">{region.name}</span>
                                    {region.code && <Badge variant="outline" className="text-xs">{region.code}</Badge>}
                                    <span className="text-slate-400 mx-1">·</span>
                                    <span className="text-sm text-slate-600">Head:</span>
                                    <span className="text-sm font-medium text-slate-800">{region.head_username || '—'}</span>
                                    {regionTargetInfo != null && (
                                      <>
                                        <span className="text-slate-400 mx-1">·</span>
                                        <span className="text-sm text-slate-600">
                                          {regionTargetInfo.assigned != null && regionTargetInfo.assigned > 0 ? (
                                            <>
                                              <span className="font-medium text-slate-700">Goal: </span>
                                              <span className="font-semibold text-emerald-700">{formatTargetAmount(regionTargetInfo.assigned)}</span>
                                              {Math.abs(regionTargetInfo.assigned - regionTargetInfo.rolledUp) > 1 && (
                                                <span className="text-slate-500 font-normal"> (team {formatTargetAmount(regionTargetInfo.rolledUp)})</span>
                                              )}
                                            </>
                                          ) : (
                                            <>
                                              <span className="font-medium text-slate-700">Team target: </span>
                                              <span className="font-semibold text-emerald-700">{formatTargetAmount(regionTargetInfo.rolledUp)}</span>
                                            </>
                                          )}
                                        </span>
                                      </>
                                    )}
                                    <div className="ml-auto flex items-center gap-1 shrink-0">
                                      {canEditRegion && regionTargetInfo != null && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Set region goal"
                                          onClick={() => {
                                            setTargetHierarchyModal({
                                              kind: 'region',
                                              region_id: region.id,
                                              region_name: region.name,
                                              rolled_up: regionTargetInfo.rolledUp,
                                              assigned: regionTargetInfo.assigned,
                                            });
                                            setSetTargetAmount(
                                              String(
                                                regionTargetInfo.assigned != null && regionTargetInfo.assigned > 0
                                                  ? regionTargetInfo.assigned
                                                  : regionTargetInfo.rolledUp
                                              )
                                            );
                                          }}
                                        >
                                          <Target size={14} />
                                        </Button>
                                      )}
                                      {canEditRegion && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            setSetRegionHeadRegion(region);
                                            setRegionHeadEmployeeId(region.head_employee_id ?? '');
                                          }}
                                        >
                                          {region.head_username ? 'Change' : 'Set'}
                                        </Button>
                                      )}
                                      {canManageRegionEmployees && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            setAddEmployeeRegion(region);
                                            setAddEmployeeSelected(null);
                                            setAddEmployeeRole('employee');
                                          }}
                                          leftIcon={<UserPlus size={12} />}
                                        >
                                          Add
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {/* Level 2: Employees (children of region) */}
                                  <div className="tree-children border-l-2 border-slate-200 ml-2 pl-3">
                                    {regionAssignments.length === 0 ? (
                                      <div className="tree-node flex items-center gap-2 py-1.5 text-slate-500 text-sm italic">
                                        <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-200" aria-hidden />
                                        No employees
                                      </div>
                                    ) : (
                                      regionAssignments.map((a, eIdx) => {
                                        const empTarget = getEmployeeTarget(region.id, a.employee_id);
                                        return (
                                        <div
                                          key={a.id}
                                          className="tree-node flex items-center justify-between gap-2 py-1.5 pr-2 rounded-md hover:bg-slate-50/80 group"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="tree-branch w-4 shrink-0 border-b-2 border-slate-200" aria-hidden />
                                            <User size={14} className="text-slate-500 shrink-0" />
                                            <span className="text-sm text-slate-800 truncate">
                                              {a.employee_name || a.employee_email || `Employee #${a.employee_id}`}
                                            </span>
                                            {a.role === 'head' && (
                                              <Badge variant="outline" className="text-xs shrink-0">Head</Badge>
                                            )}
                                            {empTarget != null && (
                                              <>
                                                <span className="text-slate-400 mx-0.5">·</span>
                                                <span className="text-sm font-medium text-slate-700">{formatTargetAmount(empTarget)}</span>
                                              </>
                                            )}
                                          </div>
                                          {canManageRegionEmployees && (
                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-indigo-600"
                                                onClick={() => {
                                                  setTargetHierarchyModal({
                                                    kind: 'employee',
                                                    employee_id: a.employee_id,
                                                    employee_name: a.employee_name || a.employee_email || `Employee #${a.employee_id}`,
                                                    region_id: region.id,
                                                    current_amount: empTarget ?? 800000,
                                                  });
                                                  setSetTargetAmount(String(empTarget ?? 800000));
                                                }}
                                                title="Set target"
                                              >
                                                <Target size={12} />
                                              </Button>
                                              <Select
                                                options={[
                                                  { value: 'employee', label: 'Employee' },
                                                  { value: 'head', label: 'Head' },
                                                ]}
                                                value={a.role}
                                                onChange={(val) => handleChangeAssignmentRole(a.id, (val as 'head' | 'employee') || 'employee')}
                                                searchable={false}
                                                className="min-w-[100px]"
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => setRemoveAssignmentId(a.id)}
                                              >
                                                <Trash2 size={12} />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          )}
        </div>
      ) : (
      <>
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            variant="white"
            inputSize="sm"
            className="rounded-full shadow-sm"
            icon={<Search size={14} strokeWidth={2.5} />}
            placeholder="Search domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="max-w-md"
          />
          <div ref={filterButtonRef} className="inline-block">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full" 
              leftIcon={<Filter size={14} />}
              onClick={() => {
                setTempFilterActive(filterActive);
                setShowFilters(!showFilters);
              }}
            >
              Filter
            </Button>
          </div>
          {filterActive !== null && (
            <Badge variant="outline" className="text-xs">
              {filterActive ? 'Active' : 'Inactive'}
            </Badge>
          )}
          {filterActive !== null && (
            <button
              type="button"
              onClick={() => {
                setFilterActive(null);
                setTempFilterActive(null);
              }}
              className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Clear filters"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Filter Popover */}
        <FilterPopover
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          triggerRef={filterButtonRef}
          onApply={() => {
            setFilterActive(tempFilterActive);
            setShowFilters(false);
          }}
          onClear={() => {
            setTempFilterActive(null);
            setFilterActive(null);
            setShowFilters(false);
          }}
        >
          <Select
            label="Status"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={tempFilterActive === null ? 'all' : tempFilterActive ? 'active' : 'inactive'}
            onChange={(val) => {
              const value = val === 'all' ? null : val === 'active';
              setTempFilterActive(value);
            }}
            placeholder="Select Status"
            searchable={false}
          />
        </FilterPopover>
      </div>

      <div className="mt-4">
        {/* Domains List */}
        <Card noPadding contentClassName="py-6 px-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-slate-600">Loading domains...</p>
            </div>
          ) : (
            <>
          {filteredDomains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No domains found</p>
              {canCreate && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/domains/new')}
                >
                  <Plus size={16} />
                  Create First Domain
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto relative">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                      <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Name</span>
                    </th>
                    <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                      <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Code</span>
                    </th>
                    <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                      <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Description</span>
                    </th>
                    <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                      <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Status</span>
                    </th>
                    <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                      <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Domain Head</span>
                    </th>
                    <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                      <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Created By</span>
                    </th>
                    <th className="border-b border-slate-200 text-right" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                      <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredDomains.map(domain => {
                    const isExpanded = expandedDomains.has(domain.id);
                    const domainRegions = regions.filter(r => r.domain_id === domain.id);
                    return (
                      <React.Fragment key={domain.id}>
                        <tr className="group transition-all duration-200 hover:bg-slate-50/50">
                          <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleDomainExpansion(domain.id)}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title={isExpanded ? "Collapse regions" : "Expand regions"}
                              >
                                {isExpanded ? (
                                  <ChevronDown size={16} className="text-slate-500" />
                                ) : (
                                  <ChevronRight size={16} className="text-slate-500" />
                                )}
                              </button>
                              <div className="font-medium text-slate-900">{domain.name}</div>
                            </div>
                          </td>
                          <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                            <Badge variant="outline">{domain.code}</Badge>
                          </td>
                          <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium max-w-md" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                            <div className="truncate">
                              {domain.description || <span className="text-slate-400">-</span>}
                            </div>
                          </td>
                          <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                            {domain.is_active ? (
                              <Badge variant="success">
                                <CheckCircle size={12} className="mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <XCircle size={12} className="mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </td>
                          <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                            {domain.head_username || <span className="text-slate-400">-</span>}
                          </td>
                          <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                            {domain.created_by_username || <span className="text-slate-400">-</span>}
                          </td>
                          <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium text-right" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                            <div className="flex items-center justify-end gap-2">
                                              {canCreateRegion && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/domains/${domain.id}/regions/new`)}
                                  title="Add Region"
                                >
                                  <MapPin size={14} />
                                </Button>
                              )}
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/domains/${domain.id}/edit`)}
                                >
                                  <Edit size={14} />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDomainConfirm(domain.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 bg-slate-50">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <MapPin size={16} />
                                    Regions ({domainRegions.length})
                                  </h4>
                                  {canCreateRegion && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/domains/${domain.id}/regions/new`)}
                                    >
                                      <Plus size={14} />
                                      Add Region
                                    </Button>
                                  )}
                                </div>
                                {isLoadingRegions ? (
                                  <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                    <p className="mt-2 text-sm text-slate-600">Loading regions...</p>
                                  </div>
                                ) : domainRegions.length === 0 ? (
                                  <div className="text-center py-6 bg-white rounded-lg border border-slate-200">
                                    <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">No regions found</p>
                                    {canCreateRegion && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => navigate(`/domains/${domain.id}/regions/new`)}
                                      >
                                        <Plus size={14} />
                                        Create First Region
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                    <table className="w-full text-left border-separate border-spacing-0">
                                      <thead>
                                        <tr className="bg-slate-50/50">
                                          <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Name</span>
                                          </th>
                                          <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Code</span>
                                          </th>
                                          <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Description</span>
                                          </th>
                                          <th className="border-b border-slate-200 text-left" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Status</span>
                                          </th>
                                          <th className="border-b border-slate-200 text-right" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                            <span className="text-[11px] uppercase font-black tracking-wider text-slate-500">Actions</span>
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 bg-white">
                                        {domainRegions.map(region => (
                                          <tr key={region.id} className="group transition-all duration-200 hover:bg-slate-50/50">
                                            <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                              <div className="font-medium text-slate-900">{region.name}</div>
                                            </td>
                                            <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                              <Badge variant="outline" className="text-xs">{region.code}</Badge>
                                            </td>
                                            <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium max-w-xs" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                              <div className="truncate">
                                                {region.description || <span className="text-slate-400">-</span>}
                                              </div>
                                            </td>
                                            <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                              {region.is_active ? (
                                                <Badge variant="success" className="text-xs">
                                                  <CheckCircle size={10} className="mr-1" />
                                                  Active
                                                </Badge>
                                              ) : (
                                                <Badge variant="outline" className="text-xs">
                                                  <XCircle size={10} className="mr-1" />
                                                  Inactive
                                                </Badge>
                                              )}
                                            </td>
                                            <td className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium text-right" style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}>
                                              <div className="flex items-center justify-end gap-1">
                                                {canEditRegion && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/domains/${domain.id}/regions/${region.id}/edit`)}
                                                  >
                                                    <Edit size={12} />
                                                  </Button>
                                                )}
                                                {canDeleteRegion && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDeleteRegionConfirm(region.id)}
                                                  >
                                                    <Trash2 size={12} />
                                                  </Button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
      </>
      )}

      {/* Set employee / region / domain target */}
      <Modal
        isOpen={targetHierarchyModal != null}
        onClose={() => { setTargetHierarchyModal(null); setSetTargetAmount(''); }}
        title={
          targetHierarchyModal?.kind === 'employee'
            ? `Set target: ${targetHierarchyModal.employee_name}`
            : targetHierarchyModal?.kind === 'region'
              ? `Region goal: ${targetHierarchyModal.region_name}`
              : targetHierarchyModal?.kind === 'domain'
                ? `Domain goal: ${targetHierarchyModal.domain_name}`
                : 'Set target'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => { setTargetHierarchyModal(null); setSetTargetAmount(''); }}>Cancel</Button>
            <Button onClick={handleSaveHierarchyTarget} disabled={setTargetSubmitting}>
              {setTargetSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {targetHierarchyModal?.kind === 'employee' && (
              <>Target for {MONTHS[targetMonth - 1]} {targetYear}. Amount in ₹ (e.g. 800000 for 8 Lacs).</>
            )}
            {targetHierarchyModal?.kind === 'region' && (
              <>
                Optional goal for {MONTHS[targetMonth - 1]} {targetYear}. Team sum is{' '}
                <span className="font-medium">{formatTargetAmount(targetHierarchyModal.rolled_up)}</span>. Enter{' '}
                <span className="font-medium">0</span> to clear the explicit goal (dashboard still uses employee targets).
              </>
            )}
            {targetHierarchyModal?.kind === 'domain' && (
              <>
                Optional goal for {MONTHS[targetMonth - 1]} {targetYear}. Team sum is{' '}
                <span className="font-medium">{formatTargetAmount(targetHierarchyModal.rolled_up)}</span>. Enter{' '}
                <span className="font-medium">0</span> to clear the explicit goal.
              </>
            )}
          </p>
          <Input
            label="Target amount (₹)"
            type="number"
            min={0}
            step={10000}
            value={setTargetAmount}
            onChange={(e) => setSetTargetAmount(e.target.value)}
            placeholder="e.g. 800000"
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteDomainId != null}
        onClose={() => setDeleteDomainId(null)}
        onConfirm={handleConfirmDeleteDomain}
        title="Delete domain"
        message="Are you sure you want to delete this domain? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
      <ConfirmModal
        isOpen={deleteRegionId != null}
        onClose={() => setDeleteRegionId(null)}
        onConfirm={handleConfirmDeleteRegion}
        title="Delete region"
        message="Are you sure you want to delete this region? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* Set Domain Head */}
      <Modal
        isOpen={setDomainHeadDomain != null}
        onClose={() => { setSetDomainHeadDomain(null); setDomainHeadEmployeeId(''); }}
        title={setDomainHeadDomain ? `Domain Head: ${setDomainHeadDomain.name}` : 'Set Domain Head'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setSetDomainHeadDomain(null); setDomainHeadEmployeeId(''); }}>Cancel</Button>
            <Button onClick={handleSetDomainHead} disabled={headSelectSubmitting}>
              {headSelectSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AsyncSelect
            label="Employee"
            loadOptions={async (search) => {
              const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
              return res.employees.map((e) => ({
                value: e.id,
                label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
              }));
            }}
            value={domainHeadEmployeeId === '' ? undefined : domainHeadEmployeeId}
            onChange={(val) => setDomainHeadEmployeeId(val != null && val !== '' ? Number(val) : '')}
            placeholder="Search and select employee..."
          />
          <p className="text-xs text-slate-500">Leave empty and Save to clear the domain head.</p>
        </div>
      </Modal>

      {/* Set Region Head */}
      <Modal
        isOpen={setRegionHeadRegion != null}
        onClose={() => { setSetRegionHeadRegion(null); setRegionHeadEmployeeId(''); }}
        title={setRegionHeadRegion ? `Region Head: ${setRegionHeadRegion.name}` : 'Set Region Head'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setSetRegionHeadRegion(null); setRegionHeadEmployeeId(''); }}>Cancel</Button>
            <Button onClick={handleSetRegionHead} disabled={headSelectSubmitting}>
              {headSelectSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AsyncSelect
            label="Employee"
            loadOptions={async (search) => {
              const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
              return res.employees.map((e) => ({
                value: e.id,
                label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
              }));
            }}
            value={regionHeadEmployeeId === '' ? undefined : regionHeadEmployeeId}
            onChange={(val) => setRegionHeadEmployeeId(val != null && val !== '' ? Number(val) : '')}
            placeholder="Search and select employee..."
          />
          <p className="text-xs text-slate-500">Leave empty and Save to clear the region head.</p>
        </div>
      </Modal>

      {/* Add Region Employee */}
      <Modal
        isOpen={addEmployeeRegion != null}
        onClose={() => { setAddEmployeeRegion(null); setAddEmployeeSelected(null); }}
        title={addEmployeeRegion ? `Add employee to ${addEmployeeRegion.name}` : 'Add employee'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setAddEmployeeRegion(null); setAddEmployeeSelected(null); }}>Cancel</Button>
            <Button onClick={handleAddRegionEmployee} disabled={!addEmployeeSelected || addEmployeeSubmitting}>
              {addEmployeeSubmitting ? 'Adding...' : 'Add'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!addEmployeeSelected ? (
            <AsyncSelect
              label="Employee"
              loadOptions={async (search) => {
                const res = await marketingAPI.getEmployees({ page: 1, page_size: 30, search: search || undefined, status: 'active' });
                return res.employees.map((e) => ({
                  value: e.id,
                  label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.email || `#${e.id}`,
                }));
              }}
              value={undefined}
              onChange={(val) => {
                if (val == null) return;
                marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' }).then((res) => {
                  const emp = res.employees.find((e) => e.id === Number(val));
                  if (emp) setAddEmployeeSelected(emp);
                });
              }}
              placeholder="Search and select employee..."
            />
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-800">
                {[addEmployeeSelected.first_name, addEmployeeSelected.last_name].filter(Boolean).join(' ').trim() || addEmployeeSelected.email}
              </p>
              <Button variant="ghost" size="sm" onClick={() => setAddEmployeeSelected(null)}>Change employee</Button>
            </div>
          )}
          <Select
            label="Role"
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'head', label: 'Region Head' },
            ]}
            value={addEmployeeRole}
            onChange={(val) => setAddEmployeeRole((val as 'head' | 'employee') || 'employee')}
            searchable={false}
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={removeAssignmentId != null}
        onClose={() => setRemoveAssignmentId(null)}
        onConfirm={handleConfirmRemoveAssignment}
        title="Remove from region"
        message="Remove this employee from the region? They will no longer have access."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
    </PageLayout>
  );
};
