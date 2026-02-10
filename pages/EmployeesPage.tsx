/**
 * Employees Page - Marketing team (assigned users only)
 * Lists users assigned to regions with role; button to assign new user.
 */
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DataTable, Column } from '../components/ui/DataTable';
import { Users, MapPin, UserPlus, Trash2, Search, Globe } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { marketingAPI, HRMSEmployee, AssignmentWithEmployee, Domain, Region, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

export type RegionAssignment = AssignmentWithEmployee;

interface DomainHeadRole {
  domain_id: number;
  domain_name: string;
}

interface AssignedUserRow {
  employee_id: number;
  name: string;
  email: string;
  assignments: RegionAssignment[];
  domainHeads: DomainHeadRole[];
}

export const EmployeesPage: React.FC = () => {
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_domain'));
  const canAssignEmployeeRegion = useAppSelector(selectHasPermission('marketing.assign_employee_region'));

  const [assignments, setAssignments] = useState<RegionAssignment[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Assign new user modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignEmployee, setAssignEmployee] = useState<HRMSEmployee | null>(null);
  const [assignRegionId, setAssignRegionId] = useState<number | undefined>(undefined);
  const [assignDomainId, setAssignDomainId] = useState<number | undefined>(undefined);
  const [assignRole, setAssignRole] = useState<'head' | 'employee' | 'domain_head'>('employee');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [employeeAssignments, setEmployeeAssignments] = useState<RegionAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [regionsCache, setRegionsCache] = useState<{ id: number; name: string; code?: string; domain_id?: number }[]>([]);
  const [removeAssignmentId, setRemoveAssignmentId] = useState<number | null>(null);
  const [removeDomainHeadId, setRemoveDomainHeadId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (!canView) return;
    loadData();
  }, [canView]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, domainsRes] = await Promise.all([
        marketingAPI.getAllAssignments(),
        marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 }),
      ]);
      setAssignments(list || []);
      setDomains(domainsRes?.items ?? []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load marketing team', 'error');
      setAssignments([]);
      setDomains([]);
    } finally {
      setIsLoading(false);
    }
  };

  const rows: AssignedUserRow[] = React.useMemo(() => {
    const byEmployee = new Map<
      number,
      { name: string; email: string; assignments: RegionAssignment[]; domainHeads: DomainHeadRole[] }
    >();
    assignments.forEach((a) => {
      if (!byEmployee.has(a.employee_id)) {
        byEmployee.set(a.employee_id, {
          name: a.employee_name ?? `Employee #${a.employee_id}`,
          email: a.employee_email ?? '',
          assignments: [],
          domainHeads: [],
        });
      }
      byEmployee.get(a.employee_id)!.assignments.push(a);
      const cur = byEmployee.get(a.employee_id)!;
      if (a.employee_name) cur.name = a.employee_name;
      if (a.employee_email) cur.email = a.employee_email;
    });
    domains.forEach((d) => {
      if (d.head_employee_id == null) return;
      const eid = d.head_employee_id;
      if (!byEmployee.has(eid)) {
        byEmployee.set(eid, {
          name: d.head_username ?? `Employee #${eid}`,
          email: d.head_email ?? '',
          assignments: [],
          domainHeads: [],
        });
      }
      const cur = byEmployee.get(eid)!;
      if (d.head_email) cur.email = d.head_email;
      cur.domainHeads.push({ domain_id: d.id, domain_name: d.name });
    });
    let result: AssignedUserRow[] = Array.from(byEmployee.entries()).map(([employee_id, data]) => ({
      employee_id,
      name: data.name,
      email: data.email,
      assignments: data.assignments,
      domainHeads: data.domainHeads,
    }));
    if (debouncedSearchTerm.trim()) {
      const q = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments, domains, debouncedSearchTerm]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Keep page in range when totalPages shrinks (e.g. after search)
  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(totalPages);
  }, [totalPages, page]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const openAssignModal = (emp?: HRMSEmployee) => {
    setAssignEmployee(emp ?? null);
    setAssignRegionId(undefined);
    setAssignDomainId(undefined);
    setAssignRole('employee');
    setEmployeeAssignments([]);
    setAssignmentsLoading(!!emp);
    if (emp) {
      marketingAPI.getEmployeeAssignments(emp.id).then((list) => {
        setEmployeeAssignments((list || []).filter((a: RegionAssignment) => a.is_active));
      }).catch(() => {}).finally(() => setAssignmentsLoading(false));
    }
    if (regionsCache.length === 0) {
      marketingAPI.getRegions({ page: 1, page_size: 100 }).then((r) => setRegionsCache(r.items)).catch(() => {});
    }
    setAssignModalOpen(true);
  };

  const refreshAssignmentsForModal = async () => {
    if (!assignEmployee) return;
    try {
      const list = await marketingAPI.getEmployeeAssignments(assignEmployee.id);
      setEmployeeAssignments((list || []).filter((a: RegionAssignment) => a.is_active));
    } catch {}
  };

  const handleAssign = async () => {
    if (!assignEmployee) return;
    const displayName = [assignEmployee.first_name, assignEmployee.last_name].filter(Boolean).join(' ').trim() || assignEmployee.email || '';
    if (assignRole === 'domain_head') {
      if (assignDomainId == null) {
        showToast('Please select a domain', 'error');
        return;
      }
      setAssignSubmitting(true);
      try {
        await marketingAPI.updateDomain(assignDomainId, {
          head_employee_id: assignEmployee.id,
          head_username: displayName || undefined,
          head_email: assignEmployee.email || undefined,
        });
        showToast(`${displayName} set as Domain Head`, 'success');
        setAssignDomainId(undefined);
        await loadData();
      } catch (error: any) {
        showToast(error.message || 'Failed to set domain head', 'error');
      } finally {
        setAssignSubmitting(false);
      }
      return;
    }
    if (assignRegionId == null) {
      showToast('Please select a region', 'error');
      return;
    }
    setAssignSubmitting(true);
    try {
      await marketingAPI.assignEmployeeToRegion({
        employee_id: assignEmployee.id,
        region_id: assignRegionId,
        role: assignRole as 'head' | 'employee',
        employee_name: displayName || undefined,
        employee_email: assignEmployee.email || undefined,
      });
      showToast(
        assignRole === 'head'
          ? `${displayName} set as Region Head`
          : 'Assigned to region',
        'success'
      );
      setAssignRegionId(undefined);
      await refreshAssignmentsForModal();
      await loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to assign to region', 'error');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const openRemoveAssignmentConfirm = (assignmentId: number) => {
    setRemoveAssignmentId(assignmentId);
  };

  const handleConfirmRemoveAssignment = async () => {
    if (removeAssignmentId == null) return;
    try {
      await marketingAPI.removeEmployeeFromRegion(removeAssignmentId);
      showToast('Assignment removed', 'success');
      await refreshAssignmentsForModal();
      await loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove assignment', 'error');
    }
  };

  const openRemoveDomainHeadConfirm = (domainId: number) => {
    setRemoveDomainHeadId(domainId);
  };

  const handleConfirmRemoveDomainHead = async () => {
    if (removeDomainHeadId == null) return;
    try {
      await marketingAPI.updateDomain(removeDomainHeadId, {
        head_employee_id: null,
        head_username: null,
        head_email: null,
      });
      showToast('Domain head removed', 'success');
      await loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to remove domain head', 'error');
    }
  };

  if (!canView) {
    return (
      <PageLayout title="Employees">
        <Card>
          <div className="text-center py-12">
            <p className="text-slate-600">You do not have permission to view employees.</p>
            <p className="text-sm text-slate-500 mt-2">Required permission: marketing.view_domain</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const breadcrumbs = [{ label: 'Employees' }];

  return (
    <PageLayout title="Employees" breadcrumbs={breadcrumbs}>
      <p className="text-sm text-slate-500 -mt-2 mb-4">
        Marketing team: users assigned to domains/regions. Assign new users to give them access.
      </p>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <Input
          variant="white"
          inputSize="sm"
          className="rounded-full shadow-sm"
          icon={<Search size={14} strokeWidth={2.5} />}
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="max-w-md"
        />
        {canAssignEmployeeRegion && (
          <Button
            size="sm"
            onClick={() => openAssignModal()}
            leftIcon={<UserPlus size={14} strokeWidth={3} />}
          >
            Assign new user
          </Button>
        )}
      </div>

      <Card noPadding contentClassName="py-6 px-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <p className="mt-4 text-slate-600">Loading marketing team...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No assigned users yet</p>
            {canAssignEmployeeRegion && (
              <Button className="mt-4" onClick={() => openAssignModal()} leftIcon={<UserPlus size={16} />}>
                Assign new user
              </Button>
            )}
          </div>
        ) : (
          <>
          <DataTable<AssignedUserRow>
            data={paginatedRows}
            rowKey={(r) => r.employee_id}
            className="border-none"
            columns={[
              { key: 'name', label: 'Name', render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
              { key: 'email', label: 'Email', render: (row) => <span className="text-slate-600">{row.email || '–'}</span> },
              {
                key: 'assignments',
                label: 'Assignments (Region · Role)',
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    {row.domainHeads.map((dh) => (
                      <Badge key={`dh-${dh.domain_id}`} variant="outline" className="text-xs">
                        <Globe size={10} className="mr-1" />
                        Domain Head · {dh.domain_name}
                      </Badge>
                    ))}
                    {row.assignments.map((a) => (
                      <Badge key={a.id} variant="outline" className="text-xs">
                        <MapPin size={10} className="mr-1" />
                        {a.region?.name ?? `Region #${a.region_id}`}
                        {a.role === 'head' && <span className="ml-1 font-medium">· Region Head</span>}
                      </Badge>
                    ))}
                  </div>
                ),
              },
              ...(canAssignEmployeeRegion
                ? [{
                    key: 'actions',
                    label: '',
                    sortable: false,
                    align: 'right' as const,
                    render: (row) => (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAssignModal({
                            id: row.employee_id,
                            first_name: row.name.split(' ')[0] || '',
                            last_name: row.name.split(' ').slice(1).join(' ') || '',
                            email: row.email,
                            user_id: null,
                            username: null,
                            employee_id: null,
                            department: null,
                            designation: null,
                            is_active: true,
                          } as HRMSEmployee);
                        }}
                      >
                        Manage
                      </Button>
                    ),
                  } as Column<AssignedUserRow>]
                : []),
            ]}
          />
          <div className="border-t border-slate-200 px-4 py-3">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={totalRows}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
          </>
        )}
      </Card>

      <Modal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignEmployee(null);
          setAssignRegionId(undefined);
          setAssignDomainId(undefined);
        }}
        title={assignEmployee ? `Assign ${assignEmployee.first_name} ${assignEmployee.last_name}` : 'Assign new user to marketing team'}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleAssign}
              disabled={
                !assignEmployee ||
                assignSubmitting ||
                (assignRole === 'domain_head' && assignDomainId == null) ||
                ((assignRole === 'head' || assignRole === 'employee') && assignRegionId == null)
              }
            >
              {assignSubmitting ? 'Saving...' : assignRole === 'domain_head' ? 'Set as Domain Head' : 'Assign to region'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {!assignEmployee ? (
            <AsyncSelect
              label="Employee"
              loadOptions={async (search) => {
                const res = await marketingAPI.getEmployees({
                  page: 1,
                  page_size: 30,
                  search: search || undefined,
                  status: 'active',
                });
                return res.employees.map((e) => ({
                  value: e.id,
                  label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || e.email || `#${e.id}`,
                }));
              }}
              value={undefined}
              onChange={(val) => {
                if (!val) return;
                marketingAPI.getEmployees({ page: 1, page_size: 500, status: 'active' }).then((res) => {
                  const emp = res.employees.find((e) => e.id === Number(val));
                  if (emp) {
                    setAssignEmployee(emp);
                    setAssignmentsLoading(true);
                    marketingAPI.getEmployeeAssignments(emp.id).then((list) => {
                      setEmployeeAssignments((list || []).filter((a: RegionAssignment) => a.is_active));
                    }).catch(() => {}).finally(() => setAssignmentsLoading(false));
                  }
                });
              }}
              placeholder="Search and select employee..."
            />
          ) : (
            <p className="text-sm text-slate-600">
              <strong>{assignEmployee.first_name} {assignEmployee.last_name}</strong>
              {assignEmployee.email && ` (${assignEmployee.email})`}
            </p>
          )}
          {assignEmployee && (
            <>
              <p className="text-sm text-slate-600">
                Choose role, then select a <strong>domain</strong> or <strong>region</strong> as needed.
              </p>
              <Select
                label="Role"
                options={[
                  { value: 'employee', label: 'Employee' },
                  { value: 'head', label: 'Region Head' },
                  { value: 'domain_head', label: 'Domain Head' },
                ]}
                value={assignRole}
                onChange={(val) => {
                  const role = (val as 'head' | 'employee' | 'domain_head') || 'employee';
                  setAssignRole(role);
                  setAssignRegionId(undefined);
                  setAssignDomainId(undefined);
                }}
                placeholder="Select role"
                searchable={false}
              />
              {assignRole === 'domain_head' ? (
                <>
                  <AsyncSelect
                    label="Domain"
                    loadOptions={async (search) => {
                      const list = domains.length > 0 ? domains : (await marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 })).items;
                      const filtered = search
                        ? list.filter(
                            (d) =>
                              d.name?.toLowerCase().includes(search.toLowerCase()) ||
                              (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
                          )
                        : list;
                      return filtered.slice(0, 30).map((d) => ({ value: d.id, label: d.name }));
                    }}
                    value={assignDomainId}
                    onChange={(val) => setAssignDomainId(val ? Number(val) : undefined)}
                    placeholder="Select domain..."
                    initialOptions={domains.slice(0, 15).map((d) => ({ value: d.id, label: d.name }))}
                  />
                  {assignEmployee && domains.filter((d) => d.head_employee_id === assignEmployee.id).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">Current domain heads</h4>
                      <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {domains.filter((d) => d.head_employee_id === assignEmployee.id).map((d) => (
                          <li key={d.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                            <span className="text-slate-800 flex items-center gap-2">
                              <Globe size={14} className="text-slate-500" />
                              {d.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openRemoveDomainHeadConfirm(d.id)}
                              leftIcon={<Trash2 size={12} />}
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <AsyncSelect
                  label="Region"
                  loadOptions={async (search) => {
                    let list: Region[];
                    if (regionsCache.length > 0) list = regionsCache;
                    else {
                      const res = await marketingAPI.getRegions({ page: 1, page_size: 100 });
                      list = res.items;
                      setRegionsCache(list);
                    }
                    const filtered = search
                      ? list.filter(
                          (r) =>
                            r.name?.toLowerCase().includes(search.toLowerCase()) ||
                            (r.code && r.code.toLowerCase().includes(search.toLowerCase()))
                      )
                    : list;
                    return filtered.slice(0, 30).map((r) => ({ value: r.id, label: `${r.name}${r.code ? ` (${r.code})` : ''}` }));
                  }}
                  value={assignRegionId}
                  onChange={(val) => setAssignRegionId(val ? Number(val) : undefined)}
                  placeholder="Search and select region..."
                  initialOptions={regionsCache.slice(0, 15).map((r) => ({ value: r.id, label: `${r.name}${r.code ? ` (${r.code})` : ''}` }))}
                />
              )}
              {assignRole !== 'domain_head' && employeeAssignments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Current region assignments</h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {employeeAssignments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                        <span className="text-slate-800">
                          {a.region?.name || `Region #${a.region_id}`}
                          {a.role === 'head' && (
                            <Badge variant="outline" className="ml-2 text-xs">Region Head</Badge>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openRemoveAssignmentConfirm(a.id)}
                          leftIcon={<Trash2 size={12} />}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {assignmentsLoading && (
                <div className="text-center py-4 text-sm text-slate-500">Loading assignments...</div>
              )}
            </>
          )}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={removeAssignmentId != null}
        onClose={() => setRemoveAssignmentId(null)}
        onConfirm={handleConfirmRemoveAssignment}
        title="Remove region assignment"
        message="Remove this region assignment? The user will no longer have access to this region."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
      <ConfirmModal
        isOpen={removeDomainHeadId != null}
        onClose={() => setRemoveDomainHeadId(null)}
        onConfirm={handleConfirmRemoveDomainHead}
        title="Remove Domain Head"
        message="Remove this employee as Domain Head? They will no longer be the head of this domain."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
      />
    </PageLayout>
  );
};
