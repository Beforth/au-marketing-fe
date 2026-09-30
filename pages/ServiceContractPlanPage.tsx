/**
 * Service module — Stage 2: the service plan & visits for one contract.
 * Route: /service/contracts/:id/plan
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EngineerPicker, EngineerValue } from '../components/service/EngineerPicker';
import { PageLayout } from '../components/layout/PageLayout';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { ArrowLeft, CalendarClock, Check, ClipboardList, FileText, MessageSquareWarning, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  marketingAPI,
  visitWorkOrderPath,
  ServiceContract,
  ServicePlan,
  ServiceVisit,
  ServiceVisitKind,
  ServiceVisitStatus,
  SERVICE_VISIT_STATUSES,
} from '../lib/marketing-api';

const VISIT_STATUS_VARIANT: Record<ServiceVisitStatus, 'success' | 'warning' | 'outline' | 'error'> = {
  planned: 'outline',
  scheduled: 'warning',
  done: 'success',
  cancelled: 'error',
};

const fmtDate = (d?: string | null) => (d ? d : '—');

type VisitModalState = { mode: 'add' | 'edit'; visit?: ServiceVisit };

export const ServiceContractPlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contractId = Number(id);
  const navigate = useNavigate();
  const { showToast } = useApp();

  const canView = useAppSelector(selectHasPermission('service.view'));
  const canManage = useAppSelector(selectHasPermission('service.manage_visit'));

  const [isLoading, setIsLoading] = useState(true);
  const [contract, setContract] = useState<ServiceContract | null>(null);
  const [plan, setPlan] = useState<ServicePlan | null>(null);


  // reschedule modal
  const [rescheduleVisit, setRescheduleVisit] = useState<ServiceVisit | null>(null);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [savingReschedule, setSavingReschedule] = useState(false);

  // add / edit visit modal
  const [visitModal, setVisitModal] = useState<VisitModalState | null>(null);
  const [vfKind, setVfKind] = useState<ServiceVisitKind>('scheduled');
  const [vfTitle, setVfTitle] = useState('');
  const [vfPlanned, setVfPlanned] = useState('');
  const [vfScheduled, setVfScheduled] = useState('');
  const [vfStatus, setVfStatus] = useState<ServiceVisitStatus>('planned');
  const [vfNotes, setVfNotes] = useState('');
  const [vfEngineer, setVfEngineer] = useState<EngineerValue>({ id: null, name: null });
  const [savingVisit, setSavingVisit] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [c, p] = await Promise.all([
        marketingAPI.getServiceContract(contractId),
        marketingAPI.getServicePlanForContract(contractId),
      ]);
      setContract(c);
      setPlan(p);
      if (p) {
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to load service plan', 'error');
      navigate('/service/contracts');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, navigate, showToast]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    load();
  }, [canView, load]);

  // The plan is created automatically the first time it is needed (first visit added, or dates note saved),
  // so nobody has to "create a service plan" or type a visit count first.
  const ensurePlan = async (): Promise<ServicePlan> => {
    if (plan) return plan;
    const p = await marketingAPI.createServicePlan({
      contract_id: contractId,
      scheduled_visits_planned: 0,
      preferred_schedule_note: null,
    });
    setPlan(p);
    return p;
  };

  const openAddVisit = (kind: ServiceVisitKind) => {
    setVfKind(kind);
    setVfTitle('');
    setVfPlanned('');
    setVfScheduled('');
    setVfStatus('planned');
    setVfNotes('');
    setVfEngineer({ id: null, name: null });
    setVisitModal({ mode: 'add' });
  };

  const openEditVisit = (v: ServiceVisit) => {
    setVfKind(v.kind);
    setVfTitle(v.title || '');
    setVfPlanned(v.planned_date || '');
    setVfScheduled(v.scheduled_date || '');
    setVfStatus(v.status);
    setVfNotes(v.notes || '');
    setVfEngineer({ id: v.assigned_engineer_employee_id ?? null, name: v.assigned_engineer_username ?? null });
    setVisitModal({ mode: 'edit', visit: v });
  };

  const saveVisit = async () => {
    if (!visitModal) return;
    setSavingVisit(true);
    try {
      if (visitModal.mode === 'add') {
        const activePlan = await ensurePlan();
        await marketingAPI.createServiceVisit({
          plan_id: activePlan.id,
          kind: vfKind,
          title: vfTitle.trim() || undefined,
          planned_date: vfPlanned || null,
          scheduled_date: vfScheduled || null,
          assigned_engineer_employee_id: vfEngineer.id,
          assigned_engineer_username: vfEngineer.name,
        });
        if (vfKind === 'scheduled') {
          // keep the plan's visit count in step with the visits actually added
          const n = (activePlan.visits ?? []).filter((v) => v.kind === 'scheduled').length + 1;
          await marketingAPI.updateServicePlan(activePlan.id, { scheduled_visits_planned: n }).catch(() => undefined);
        }
        showToast('Visit added', 'success');
      } else if (visitModal.visit) {
        await marketingAPI.updateServiceVisit(visitModal.visit.id, {
          title: vfTitle.trim() || null,
          planned_date: vfPlanned || null,
          scheduled_date: vfScheduled || null,
          status: vfStatus,
          assigned_engineer_employee_id: vfEngineer.id,
          assigned_engineer_username: vfEngineer.name,
          notes: vfNotes.trim() || null,
        });
        showToast('Visit updated', 'success');
      }
      setVisitModal(null);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to save visit', 'error');
    } finally {
      setSavingVisit(false);
    }
  };

  const doReschedule = async () => {
    if (!rescheduleVisit) return;
    if (!newDate) {
      showToast('Pick a new date', 'error');
      return;
    }
    if (reason.trim().length < 3) {
      showToast('A reason is required to reschedule', 'error');
      return;
    }
    setSavingReschedule(true);
    try {
      await marketingAPI.rescheduleServiceVisit(rescheduleVisit.id, newDate, reason.trim());
      showToast('Visit rescheduled', 'success');
      setRescheduleVisit(null);
      setNewDate('');
      setReason('');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to reschedule', 'error');
    } finally {
      setSavingReschedule(false);
    }
  };

  const complete = async (v: ServiceVisit) => {
    try {
      await marketingAPI.completeServiceVisit(v.id);
      showToast('Visit marked done', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to complete visit', 'error');
    }
  };

  const removeVisit = async (v: ServiceVisit) => {
    if (!window.confirm(`Delete "${v.title || `visit #${v.id}`}"?`)) return;
    try {
      await marketingAPI.deleteServiceVisit(v.id);
      showToast('Visit deleted', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete visit', 'error');
    }
  };

  const breadcrumbs = [
    { label: 'Service', href: '/service/contracts' },
    { label: 'Contracts', href: '/service/contracts' },
    { label: contract?.contract_number || `Contract #${contractId}`, href: `/service/contracts/${contractId}/edit` },
    { label: 'Service Plan' },
  ];

  if (!canView) {
    return (
      <PageLayout title="Service Plan" breadcrumbs={breadcrumbs}>
        <Card><p className="text-slate-600">You do not have permission to view service plans.</p></Card>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Service Plan" breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading…</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const visits = plan?.visits ?? [];

  return (
    <PageLayout
      title="Service Plan"
      description={
        contract
          ? `${contract.contract_type} · ${contract.customer_name || `Customer #${contract.customer_id}`}${contract.plant_name ? ` · ${contract.plant_name}` : ''}`
          : undefined
      }
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate(`/service/contracts/${contractId}/work-order`)} leftIcon={<ClipboardList size={14} />}>
            Work order
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/service/contracts/${contractId}/edit`)} leftIcon={<ArrowLeft size={14} />}>
            Back to contract
          </Button>
        </div>
      }
    >
      {/* Older free-text note about the customer's preferred dates (dates are now entered on each visit) */}
      {plan?.preferred_schedule_note && (
        <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Earlier note on customer's preferred dates:</span> {plan.preferred_schedule_note}
        </p>
      )}

      {/* Visits */}
      <Card title={`Visits (${visits.length})`}>
          {canManage && (
            <div className="flex flex-wrap gap-2 mb-3">
              <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => openAddVisit('scheduled')}>
                Add scheduled visit
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => openAddVisit('unscheduled')}>
                Add unscheduled visit
              </Button>
            </div>
          )}
          {visits.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No visits yet. Click “Add scheduled visit” to add the first one — add more one by one as needed.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-2 pr-4">#</th>
                    <th className="text-left pb-2 pr-4">Visit</th>
                    <th className="text-left pb-2 pr-4">Kind</th>
                    <th className="text-left pb-2 pr-4">Customer's date</th>
                    <th className="text-left pb-2 pr-4">Our date</th>
                    <th className="text-left pb-2 pr-4">Engineer</th>
                    <th className="text-left pb-2 pr-4">Status</th>
                    <th className="text-right pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visits.map((v) => (
                    <tr key={v.id} className={v.status === 'done' ? 'bg-emerald-50/40' : undefined}>
                      <td className="py-2 pr-4 text-slate-500">{v.visit_number ?? '—'}</td>
                      <td className="py-2 pr-4 font-medium text-slate-800">
                        {v.title || `Visit ${v.visit_number ?? v.id}`}
                        {v.reschedules.length > 0 && (
                          <span
                            className="ml-2 text-[11px] text-amber-600"
                            title={v.reschedules.map((r) => `${r.from_date || '?'} → ${r.to_date || '?'}: ${r.reason}`).join('\n')}
                          >
                            rescheduled ×{v.reschedules.length}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4"><Badge variant="outline">{v.kind}</Badge></td>
                      <td className="py-2 pr-4 text-slate-600">{fmtDate(v.planned_date)}</td>
                      <td className="py-2 pr-4 text-slate-600">{fmtDate(v.scheduled_date)}</td>
                      <td className="py-2 pr-4 text-slate-600">{v.assigned_engineer_username || <span className="text-slate-400">—</span>}</td>
                      <td className="py-2 pr-4"><Badge variant={VISIT_STATUS_VARIANT[v.status]}>{v.status}</Badge></td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {canManage && (
                          <div className="inline-flex items-center gap-1">
                            {v.status !== 'done' && (
                              <Button
                                variant="ghost"
                                size="xs"
                                className="h-8 px-2 text-emerald-600"
                                onClick={() => complete(v)}
                                leftIcon={<Check size={14} />}
                                title="Next step: mark the visit done once the engineer has been on site"
                              >
                                Mark done
                              </Button>
                            )}
                            {v.status === 'done' && !(v.has_report && v.report_status === 'submitted') ? (
                              <Button
                                variant="outline"
                                size="xs"
                                className="h-8 px-2 normal-case tracking-normal font-medium text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                onClick={() => navigate(`/service/visits/${v.id}/report`)}
                                leftIcon={<FileText size={14} />}
                                title="Next step: the visit is done — fill in the visit report"
                              >
                                Fill visit report
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="xs"
                                className={`h-8 px-2 ${v.has_report && v.report_status === 'submitted' ? 'text-emerald-600' : 'text-slate-600'}`}
                                onClick={() => navigate(`/service/visits/${v.id}/report`)}
                                leftIcon={<FileText size={14} />}
                              >
                                Visit report
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-8 px-2 text-slate-600"
                              onClick={() => navigate(visitWorkOrderPath(v))}
                              leftIcon={<ClipboardList size={14} />}
                            >
                              Work order
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                  title="More actions"
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="end" sideOffset={6} className="w-48 p-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/service/complaints/new?visit_id=${v.id}&contract_id=${contractId}` +
                                        (contract?.customer_id ? `&customer_id=${contract.customer_id}` : '') +
                                        (contract?.plant_id ? `&plant_id=${contract.plant_id}` : ''),
                                    )
                                  }
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left"
                                >
                                  <MessageSquareWarning size={14} className="text-slate-400" />
                                  Report issue
                                </button>
                                {v.status !== 'done' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRescheduleVisit(v);
                                      setNewDate(v.planned_date || v.scheduled_date || '');
                                      setReason('');
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left"
                                  >
                                    <CalendarClock size={14} className="text-slate-400" />
                                    Reschedule
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEditVisit(v)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left"
                                >
                                  <Pencil size={14} className="text-slate-400" />
                                  Edit
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  type="button"
                                  onClick={() => removeVisit(v)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Card>

      {/* Add / edit visit modal */}
      <Modal
        isOpen={visitModal != null}
        onClose={() => setVisitModal(null)}
        title={visitModal?.mode === 'edit' ? 'Edit visit' : vfKind === 'scheduled' ? 'Add scheduled visit' : 'Add unscheduled visit'}
        footer={
          <>
            <Button variant="outline" onClick={() => setVisitModal(null)}>Cancel</Button>
            <Button onClick={saveVisit} isLoading={savingVisit}>{visitModal?.mode === 'edit' ? 'Save' : 'Add visit'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {visitModal?.mode === 'add' && (
            <Select
              label="Kind"
              options={[
                { value: 'scheduled', label: 'Scheduled (part of the plan)' },
                { value: 'unscheduled', label: 'Unscheduled (extra visit)' },
              ]}
              value={vfKind}
              onChange={(val) => setVfKind((val as ServiceVisitKind) || 'scheduled')}
              clearable={false}
              searchable={false}
            />
          )}
          <Input label="Title (optional)" value={vfTitle} onChange={(e) => setVfTitle(e.target.value)} placeholder="e.g. Q2 preventive visit" />
          <Input label="Our visit date" type="date" value={vfScheduled} onChange={(e) => setVfScheduled(e.target.value)} />
          <Input label="Customer's preferred date (optional)" type="date" value={vfPlanned} onChange={(e) => setVfPlanned(e.target.value)} />
          <p className="text-xs text-slate-400 -mt-1">
            If the customer's date is filled in, it takes priority — reminders, the visit list and the work order's “needed by” dates all follow it.
          </p>
          <EngineerPicker value={vfEngineer} onChange={setVfEngineer} />
          <p className="text-xs text-slate-400 -mt-1">The engineer gets the visit reminders and is counted for this visit in the reports.</p>
          {visitModal?.mode === 'edit' && (
            <>
              <Select
                label="Status"
                options={SERVICE_VISIT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                value={vfStatus}
                onChange={(val) => setVfStatus((val as ServiceVisitStatus) || 'planned')}
                clearable={false}
                searchable={false}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={vfNotes}
                  onChange={(e) => setVfNotes(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-400">
                Changing a date here doesn't record a reason. To move a confirmed visit with a logged reason, use “Reschedule”.
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* Reschedule modal */}
      <Modal
        isOpen={rescheduleVisit != null}
        onClose={() => setRescheduleVisit(null)}
        title={`Reschedule — ${rescheduleVisit?.title || ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setRescheduleVisit(null)}>Cancel</Button>
            <Button onClick={doReschedule} isLoading={savingReschedule}>Reschedule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="New date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason for rescheduling <span className="text-rose-500">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is the visit being moved? (customer request, engineer availability, etc.)"
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
