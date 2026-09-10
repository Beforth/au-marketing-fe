/**
 * Service module — Stage 3: the work order for one visit.
 * Route: /service/visits/:visitId/work-order
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { ArrowLeft, Check, Plus, Send, Trash2, X } from 'lucide-react';
import {
  marketingAPI,
  ServiceWorkOrder,
  ServiceWorkOrderStatus,
  WorkOrderMaterial,
  WorkOrderPrerequisite,
} from '../lib/marketing-api';

const STATUS_STEPS: ServiceWorkOrderStatus[] = ['prepared', 'checked', 'approved'];

const STATUS_VARIANT: Record<ServiceWorkOrderStatus, 'outline' | 'warning' | 'success'> = {
  prepared: 'outline',
  checked: 'warning',
  approved: 'success',
};

const DISPATCH_LABEL: Record<string, string> = {
  not_dispatched: 'Not sent yet',
  partial: 'Partly sent',
  full: 'Fully sent',
};

const STATUS_LABEL: Record<ServiceWorkOrderStatus, string> = {
  prepared: 'Prepared',
  checked: 'Checked',
  approved: 'Approved',
};

const emptyMaterial = (): WorkOrderMaterial => ({ item_name: '', quantity: '', description: '', required_by_date: '' });

export const ServiceWorkOrderPage: React.FC = () => {
  const { visitId: visitIdStr } = useParams<{ visitId: string }>();
  const visitId = Number(visitIdStr);
  const navigate = useNavigate();
  const { showToast } = useApp();

  const canView = useAppSelector(selectHasPermission('service.view'));
  const canManage = useAppSelector(selectHasPermission('service.manage_work_order'));
  const canApprove = useAppSelector(selectHasPermission('service.approve_work_order'));

  const [isLoading, setIsLoading] = useState(true);
  const [wo, setWo] = useState<ServiceWorkOrder | null>(null);

  // editable draft
  const [leadTime, setLeadTime] = useState(3);
  const [notes, setNotes] = useState('');
  const [materials, setMaterials] = useState<WorkOrderMaterial[]>([]);
  const [prereqs, setPrereqs] = useState<WorkOrderPrerequisite[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const syncDraft = (w: ServiceWorkOrder | null) => {
    setLeadTime(w?.material_lead_time_days ?? 3);
    setNotes(w?.notes || '');
    setMaterials((w?.materials ?? []).map((m) => ({ ...m })));
    setPrereqs((w?.prerequisites ?? []).map((p) => ({ ...p })));
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const w = await marketingAPI.getWorkOrderForVisit(visitId);
      setWo(w);
      syncDraft(w);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load work order', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [visitId, showToast]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    load();
  }, [canView, load]);

  const cleanMaterials = (): WorkOrderMaterial[] =>
    materials
      .filter((m) => m.item_name.trim())
      .map((m, i) => ({
        item_name: m.item_name.trim(),
        quantity: m.quantity?.trim() || null,
        description: m.description?.trim() || null,
        required_by_date: m.required_by_date?.trim() ? m.required_by_date : null,
        display_order: i,
      }));

  const cleanPrereqs = (): WorkOrderPrerequisite[] =>
    prereqs.filter((p) => p.text.trim()).map((p, i) => ({ text: p.text.trim(), display_order: i }));

  const createWo = async () => {
    setSaving(true);
    try {
      const w = await marketingAPI.createServiceWorkOrder({
        visit_id: visitId,
        material_lead_time_days: leadTime,
        notes: notes.trim() || null,
        materials: cleanMaterials(),
        prerequisites: cleanPrereqs(),
      });
      setWo(w);
      syncDraft(w);
      showToast('Work order created (Prepared)', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to create work order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveWo = async () => {
    if (!wo) return;
    setSaving(true);
    try {
      const w = await marketingAPI.updateServiceWorkOrder(wo.id, {
        material_lead_time_days: leadTime,
        notes: notes.trim() || null,
        materials: cleanMaterials(),
        prerequisites: cleanPrereqs(),
      });
      setWo(w);
      syncDraft(w);
      showToast('Work order saved', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (fn: () => Promise<ServiceWorkOrder>, okMsg: string) => {
    setBusy(true);
    try {
      const w = await fn();
      setWo(w);
      syncDraft(w);
      showToast(okMsg, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeWo = async () => {
    if (!wo || !window.confirm('Delete this work order?')) return;
    try {
      await marketingAPI.deleteServiceWorkOrder(wo.id);
      showToast('Work order deleted', 'success');
      setWo(null);
      syncDraft(null);
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete', 'error');
    }
  };

  const togglePrereq = async (p: WorkOrderPrerequisite) => {
    if (!p.id) return;
    try {
      const updated = await marketingAPI.confirmPrerequisite(p.id, !p.is_done);
      setPrereqs((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
      setWo((w) => (w ? { ...w, prerequisites: w.prerequisites.map((x) => (x.id === p.id ? { ...x, ...updated } : x)) } : w));
    } catch (e: any) {
      showToast(e?.message || 'Failed to update checklist', 'error');
    }
  };

  const breadcrumbs = [
    { label: 'Service', href: '/service/contracts' },
    { label: 'Work Orders', href: '/service/work-orders' },
    { label: wo?.wo_number || (wo ? `WO #${wo.id}` : 'New work order') },
  ];

  if (!canView) {
    return (
      <PageLayout title="Work Order" breadcrumbs={breadcrumbs}>
        <Card><p className="text-slate-600">You do not have permission to view work orders.</p></Card>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout title="Work Order" breadcrumbs={breadcrumbs}>
        <Card><div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></Card>
      </PageLayout>
    );
  }

  const readOnly = !canManage;
  const isApproved = wo?.status === 'approved';

  return (
    <PageLayout
      title={wo ? `Work Order ${wo.wo_number || `#${wo.id}`}` : 'New Work Order'}
      description={wo ? `${wo.contract_number || ''} · ${wo.customer_name || ''}${wo.plant_name ? ` · ${wo.plant_name}` : ''}` : `for visit #${visitId}`}
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
            Back
          </Button>
          {canManage && !wo && (
            <Button size="sm" onClick={createWo} isLoading={saving} leftIcon={<Check size={14} />}>
              Create work order
            </Button>
          )}
          {canManage && wo && (
            <Button size="sm" onClick={saveWo} isLoading={saving}>
              Save work order
            </Button>
          )}
        </div>
      }
    >
      {/* Status stepper */}
      {wo && (
        <Card className="mb-4">
          {(() => {
            const currentIdx = STATUS_STEPS.indexOf(wo.status);
            const steps = [
              { key: 'prepared', label: 'Prepared', by: wo.prepared_by_username, at: wo.prepared_at, blurb: 'Details and part list drafted' },
              { key: 'checked', label: 'Checked', by: wo.checked_by_username, at: wo.checked_at, blurb: 'Reviewed by the coordinator' },
              { key: 'approved', label: 'Approved', by: wo.approved_by_username, at: wo.approved_at, blurb: 'Signed off by the manager — store can send parts' },
            ];
            return (
              <>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-sm text-slate-500">This work order is</span>
                  <Badge variant={STATUS_VARIANT[wo.status]}>{STATUS_LABEL[wo.status]}</Badge>
                  {wo.revision > 0 && <span className="text-xs text-amber-600">· edited {wo.revision}× after approval</span>}
                </div>

                <div className="flex items-start">
                  {steps.map((step, i) => {
                    const done = i < currentIdx;
                    const current = i === currentIdx;
                    return (
                      <React.Fragment key={step.key}>
                        {i > 0 && (
                          <div className={`flex-1 h-0.5 mt-3.5 ${i <= currentIdx ? 'bg-blue-500' : 'bg-slate-200'}`} />
                        )}
                        <div className="flex flex-col items-center text-center w-32 shrink-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              done
                                ? 'bg-blue-500 text-white'
                                : current
                                ? 'bg-white text-blue-600 ring-2 ring-blue-500'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {done ? <Check size={14} /> : i + 1}
                          </div>
                          <div className={`mt-1.5 text-sm font-semibold ${done || current ? 'text-slate-800' : 'text-slate-400'}`}>
                            {step.label}
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{step.blurb}</div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {step.by
                              ? `${step.by}${step.at ? ` · ${new Date(step.at).toLocaleDateString()}` : ''}`
                              : current
                              ? 'waiting'
                              : ''}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* What happens next + action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    {wo.status === 'prepared' && '→ Next: the coordinator reviews it and marks it Checked.'}
                    {wo.status === 'checked' && '→ Next: the manager approves it.'}
                    {wo.status === 'approved' && '✓ Approved. The parts now appear on the Store / Dispatch screen.'}
                  </p>
                  <div className="flex gap-2">
                    {canManage && wo.status === 'prepared' && (
                      <Button size="sm" isLoading={busy} onClick={() => runAction(() => marketingAPI.workOrderMarkChecked(wo.id), 'Marked Checked')}>
                        Mark Checked
                      </Button>
                    )}
                    {canManage && wo.status === 'checked' && (
                      <Button size="sm" variant="ghost" isLoading={busy} onClick={() => runAction(() => marketingAPI.workOrderMarkPrepared(wo.id), 'Sent back to Prepared')}>
                        Back to Prepared
                      </Button>
                    )}
                    {canApprove && wo.status === 'checked' && (
                      <Button size="sm" isLoading={busy} onClick={() => runAction(() => marketingAPI.workOrderApprove(wo.id), 'Approved')}>
                        Approve
                      </Button>
                    )}
                    {canApprove && wo.status === 'approved' && (
                      <Button size="sm" variant="ghost" isLoading={busy} onClick={() => runAction(() => marketingAPI.workOrderReopen(wo.id), 'Reopened to Checked')}>
                        Reopen for changes
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </Card>
      )}

      {/* Materials */}
      <Card title="Parts &amp; materials needed" className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Days the store needs to get parts ready"
            type="number"
            min={0}
            value={String(leadTime)}
            onChange={(e) => setLeadTime(Math.max(0, Number(e.target.value) || 0))}
            disabled={readOnly}
          />
        </div>
        <p className="text-xs text-slate-400 -mt-2 mb-3">
          Each part's “needed by” date starts at the visit date minus this many days. You can change any date below.
        </p>
        {materials.length === 0 && (
          <p className="text-sm text-slate-400 py-2">No parts added yet.</p>
        )}
        {materials.length > 0 && (
          <div className="space-y-2">
            {materials.map((m, idx) => (
              <div key={m.id ?? `new-${idx}`} className="rounded-lg border border-slate-200 p-2">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="flex-1 min-w-[140px]">
                    <Input placeholder="Part / material name" value={m.item_name} disabled={readOnly}
                      onChange={(e) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, item_name: e.target.value } : x)))} />
                  </div>
                  <div className="w-28">
                    <Input placeholder="Qty" value={m.quantity || ''} disabled={readOnly}
                      onChange={(e) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))} />
                  </div>
                  <div className="w-40">
                    <Input type="date" label="" value={m.required_by_date || ''} disabled={readOnly}
                      onChange={(e) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, required_by_date: e.target.value } : x)))} />
                  </div>
                  {m.id && (
                    <Badge variant={m.dispatch_status === 'full' ? 'success' : m.dispatch_status === 'partial' ? 'warning' : 'outline'}>
                      {DISPATCH_LABEL[m.dispatch_status || 'not_dispatched']}
                    </Badge>
                  )}
                  {!readOnly && (
                    <button type="button" className="p-2 text-slate-400 hover:text-rose-600" onClick={() => setMaterials((p) => p.filter((_, i) => i !== idx))}>
                      <X size={16} />
                    </button>
                  )}
                </div>
                {m.dispatched_note && (
                  <p className="text-xs text-slate-500 mt-1">Dispatched: {m.dispatched_note}{m.dispatched_by_username ? ` — ${m.dispatched_by_username}` : ''}</p>
                )}
                {(m.attachments?.length ?? 0) > 0 && m.id && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {m.attachments!.map((a) => (
                      <button key={a.id} type="button" className="text-xs text-blue-600 underline"
                        onClick={() => marketingAPI.downloadMaterialProof(m.id!, a.id, a.file_name)}>
                        {a.file_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!readOnly && (
          <Button size="sm" variant="outline" className="mt-3" leftIcon={<Plus size={14} />} onClick={() => setMaterials((m) => [...m, emptyMaterial()])}>
            Add a part
          </Button>
        )}
      </Card>

      {/* Prerequisites */}
      <Card title="What the customer must have ready before the visit" className="mb-4">
        <p className="text-sm text-slate-500 mb-3">
          List everything the customer needs to arrange (power, access, clear space, operator on site…). Save the work
          order to keep new items, then send the list to the customer. Tick each box once they confirm it's ready.
        </p>

        {wo?.prerequisites_sent_at && (
          <p className="text-xs font-medium text-emerald-600 mb-3">
            ✓ Sent to the customer on {new Date(wo.prerequisites_sent_at).toLocaleDateString()}
          </p>
        )}

        {prereqs.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
            Nothing added yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {prereqs.map((p, idx) => {
              const saved = !!p.id;
              return (
                <div key={p.id ?? `new-${idx}`} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={!!p.is_done}
                    disabled={readOnly || !saved}
                    title={saved ? 'Tick once the customer confirms this is ready' : 'Save the work order first'}
                    onChange={() => saved && togglePrereq(p)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                  />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none disabled:text-slate-500"
                    placeholder="e.g. Power supply available at the machine"
                    value={p.text}
                    disabled={readOnly || saved}
                    onChange={(e) => setPrereqs((prev) => prev.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))}
                  />
                  {!saved && <span className="text-[11px] text-amber-600 whitespace-nowrap">not saved</span>}
                  {p.is_done && p.confirmed_by_username && (
                    <span className="text-[11px] text-emerald-600 whitespace-nowrap">confirmed · {p.confirmed_by_username}</span>
                  )}
                  {!readOnly && !saved && (
                    <button type="button" className="text-slate-400 hover:text-rose-600" onClick={() => setPrereqs((prev) => prev.filter((_, i) => i !== idx))}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {!readOnly && (
            <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => setPrereqs((p) => [...p, { text: '' }])}>
              Add item
            </Button>
          )}
          {canManage && wo && wo.prerequisites.length > 0 && (
            <Button
              size="sm"
              leftIcon={<Send size={14} />}
              isLoading={busy}
              onClick={() => runAction(() => marketingAPI.workOrderSendPrerequisites(wo.id), 'Marked as sent to customer')}
            >
              {wo.prerequisites_sent_at ? 'Send the list again' : 'Send list to customer'}
            </Button>
          )}
        </div>
      </Card>

      {/* Notes */}
      <Card title="Notes" className="mb-4">
        <textarea
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={notes}
          disabled={readOnly}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      {/* Sticky save bar */}
      {canManage && (
        <div className="sticky bottom-4 z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
            <p className="text-xs text-slate-500">
              {wo
                ? 'Parts and checklist items are only stored when you click Save.'
                : 'Add the parts and checklist, then create the work order to save everything.'}
            </p>
            <div className="flex gap-3">
              {wo && (
                <Button variant="outline" className="text-rose-600" onClick={removeWo} leftIcon={<Trash2 size={14} />}>
                  Delete
                </Button>
              )}
              {wo ? (
                <Button onClick={saveWo} isLoading={saving}>
                  {isApproved ? 'Save changes' : 'Save work order'}
                </Button>
              ) : (
                <Button onClick={createWo} isLoading={saving} leftIcon={<Check size={14} />}>
                  Create work order
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
