/**
 * Domains Management Page
 * Manage marketing domains (Domestic, Export, etc.)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FilterPopover } from '../components/ui/FilterPopover';
import { Search, Plus, Edit, Trash2, Globe, CheckCircle, XCircle, MapPin, ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { marketingAPI, Domain, Region, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

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
      if (selectedDomain) {
        await loadRegionsForDomain(selectedDomain.id);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to delete region', 'error');
    }
  };

  const filteredDomains = domains;

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  if (!canView) {
    return (
      <PageLayout title="Domains">
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

  const actions = canCreate ? (
    <Button
      size="sm"
      onClick={() => navigate('/domains/new')}
      leftIcon={<Plus size={14} strokeWidth={3} />}
    >
      Add Domain
    </Button>
  ) : null;

  return (
    <PageLayout title="Domains" actions={actions} breadcrumbs={breadcrumbs}>
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
    </PageLayout>
  );
};
