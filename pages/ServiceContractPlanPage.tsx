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
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { ArrowLeft, CalendarClock, Check, ClipboardList, FileText, MessageSquareWarning, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  marketingAPI,
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

  const [plannedCount, setPlannedCount] = useState(0);
  const [scheduleNote, setScheduleNote] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [generating, setGenerating] = useState(false);

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
        setPlannedCount(p.scheduled_visits_planned);
        setScheduleNote(p.preferred_schedule_note || '');
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

  const createPlan = async () => {
    setSavingPlan(true);
    try {
      const p = await marketingAPI.createServicePlan({
        contract_id: contractId,
        scheduled_visits_planned: plannedCount,
        preferred_schedule_note: scheduleNote.trim() || null,
      });
      setPlan(p);
      showToast('Service plan created', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to create plan', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;
    setSavingPlan(true);
    try {
      const p = await marketingAPI.updateServicePlan(plan.id, {
        scheduled_visits_planned: plannedCount,
        preferred_schedule_note: scheduleNote.trim() || null,
      });
      setPlan(p);
      showToast('Plan updated', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to update plan', 'error');
    } finally {
      setSavingPlan(false);
    }
  };

  const generate = async () => {
    if (!plan) return;
    setGenerating(true);
    try {
      const res = await marketingAPI.generateScheduledVisits(plan.id);
      showToast(res.created > 0 ? `${res.created} blank visit slot(s) added` : 'Nothing to add — count already met', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to add visit slots', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const openAddVisit = (kind: ServiceVisitKind) => {
    setVfKind(kind);
    setVfTitle('');
    setVfPlanned('');
    setVfScheduled('');
    setVfStatus('planned');
    setVfNotes('');
    setVisitModal({ mode: 'add' });
  };

  const openEditVisit = (v: ServiceVisit) => {
    setVfKind(v.kind);
    setVfTitle(v.title || '');
    setVfPlanned(v.planned_date || '');
    setVfScheduled(v.scheduled_date || '');
    setVfStatus(v.status);
    setVfNotes(v.notes || '');
    setVisitModal({ mode: 'edit', visit: v });
  };

  const saveVisit = async () => {
    if (!plan || !visitModal) return;
    setSavingVisit(true);
    try {
      if (visitModal.mode === 'add') {
        await marketingAPI.createServiceVisit({
          plan_id: plan.id,
          kind: vfKind,
          title: vfTitle.trim() || undefined,
          planned_date: vfPlanned || null,
          scheduled_date: vfScheduled || null,
        });
        showToast('Visit added', 'success');
      } else if (visitModal.visit) {
        await marketingAPI.updateServiceVisit(visitModal.visit.id, {
          title: vfTitle.trim() || null,
          planned_date: vfPlanned || null,
          scheduled_date: vfScheduled || null,
          status: vfStatus,
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
  const scheduledCount = visits.filter((v) => v.kind === 'scheduled').length;

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
        <Button variant="outline" size="sm" onClick={() => navigate(`/service/contracts/${contractId}/edit`)} leftIcon={<ArrowLeft size={14} />}>
          Back to contract
        </Button>
      }
    >
      {/* Plan setup */}
      <Card title="Plan" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Number of scheduled visits (for reference)"
            type="number"
            min={0}
            value={String(plannedCount)}
            onChange={(e) => setPlannedCount(Math.max(0, Number(e.target.value) || 0))}
            disabled={!canManage}
          />
          <div className="md:row-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer's preferred service dates</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={scheduleNote}
              onChange={(e) => setScheduleNote(e.target.value)}
              disabled={!canManage}
              placeholder="e.g. First week of every quarter; avoid month-end; contact plant a week ahead"
            />
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-3 mt-4">
            {plan ? (
              <>
                <Button size="sm" onClick={savePlan} isLoading={savingPlan}>Save plan</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={generate}
                  isLoading={generating}
                  leftIcon={<RefreshCw size={14} />}
                  title="Quick-add blank visit slots up to the number above; fill in dates afterwards"
                >
                  Quick-add {plannedCount} blank slot(s) ({scheduledCount} exist)
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={createPlan} isLoading={savingPlan}>Create service plan</Button>
            )}
          </div>
        )}
      </Card>

      {/* Visits */}
      {plan && (
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
              No visits yet. Click “Add scheduled visit” to add each visit with its date.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-2 pr-4">#</th>
                    <th className="text-left pb-2 pr-4">Visit</th>
                    <th className="text-left pb-2 pr-4">Kind</th>
                    <th className="text-left pb-2 pr-4">Planned</th>
                    <th className="text-left pb-2 pr-4">Scheduled</th>
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
                      <td className="py-2 pr-4"><Badge variant={VISIT_STATUS_VARIANT[v.status]}>{v.status}</Badge></td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-8 px-2 text-slate-600"
                              onClick={() => navigate(`/service/visits/${v.id}/work-order`)}
                              leftIcon={<ClipboardList size={14} />}
                            >
                              Work order
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className={`h-8 px-2 ${v.has_report && v.report_status === 'submitted' ? 'text-emerald-600' : 'text-slate-600'}`}
                              onClick={() => navigate(`/service/visits/${v.id}/report`)}
                              leftIcon={<FileText size={14} />}
                            >
                              Report
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-8 px-2 text-slate-600"
                              onClick={() =>
                                navigate(
                                  `/service/complaints/new?visit_id=${v.id}&contract_id=${contractId}` +
                                    (contract?.customer_id ? `&customer_id=${contract.customer_id}` : '') +
                                    (contract?.plant_id ? `&plant_id=${contract.plant_id}` : ''),
                                )
                              }
                              leftIcon={<MessageSquareWarning size={14} />}
                            >
                              Report issue
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-8 px-2 text-slate-600"
                              onClick={() => openEditVisit(v)}
                              leftIcon={<Pencil size={14} />}
                            >
                              Edit
                            </Button>
                            {v.status !== 'done' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="h-8 px-2 text-blue-600"
                                  onClick={() => {
                                    setRescheduleVisit(v);
                                    setNewDate(v.scheduled_date || v.planned_date || '');
                                    setReason('');
                                  }}
                                  leftIcon={<CalendarClock size={14} />}
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="h-8 px-2 text-emerald-600"
                                  onClick={() => complete(v)}
                                  leftIcon={<Check size={14} />}
                                >
                                  Done
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-8 w-8 p-0 text-rose-600"
                              onClick={() => removeVisit(v)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Planned date" type="date" value={vfPlanned} onChange={(e) => setVfPlanned(e.target.value)} />
            <Input label="Scheduled / confirmed date" type="date" value={vfScheduled} onChange={(e) => setVfScheduled(e.target.value)} />
          </div>
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
