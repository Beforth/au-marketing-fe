/**
 * Service module — Stage 3: the work order.
 * Routes: /service/contracts/:contractId/work-order — the contract's ONE work order for all its visits
 *         /service/visits/:visitId/work-order     — a single-visit work order (complaint visits / older ones)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { selectHasPermission, selectUser } from '../store/slices/authSlice';
import { ArrowLeft, Check, ClipboardCheck, FileText, Info, Lock, Mail, MapPin, Package, Phone, Plus, ScrollText, SquarePen, Trash2, Upload, User, X } from 'lucide-react';
import {
  marketingAPI,
  ServiceWorkOrder,
  ServiceWorkOrderStatus,
  ServiceContract,
  ServiceVisit,
  WorkOrderMaterial,
  WorkOrderPrerequisite,
  WorkOrderFile,
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

const UNIT_OPTIONS = [
  { value: 'nos', label: 'Nos' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
  { value: 'kg', label: 'Kg' },
  { value: 'litre', label: 'Litre' },
  { value: 'metre', label: 'Metre' },
  { value: 'box', label: 'Box' },
  { value: 'other', label: 'Other' },
];
const visitOptionLabel = (v: ServiceVisit) =>
  `${v.title || `Visit ${v.visit_number ?? v.id}`} · ${v.planned_date || v.scheduled_date || 'no date yet'}`;
const emptyMaterial = (): WorkOrderMaterial => ({ item_name: '', quantity: '', description: '', required_by_date: '' });

/** Common things a customer has to have ready — offered as one-tap additions in the checklist */
const PREREQ_SUGGESTIONS = ['Power supply available', 'Clear access to the machine', 'Clear working space', 'Operator on site'];

/** Column layout of the parts rows (name, qty, unit, [visit], needed by, remove) — desktop only; stacks on mobile */
/** Work order files can be uploaded for the visits coming up within this many days; later ones are tucked away */
const UPLOAD_WINDOW_DAYS = 60;

/** "Due in 2 days" / "Due today" / "Overdue by 1 day" for a part that is not fully sent yet */
const dueTagFor = (d?: string | null, status?: string): { text: string; variant: 'error' | 'warning' | 'outline' } | null => {
  if (!d || status === 'full') return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const n = Math.round((new Date(`${d}T00:00:00`).getTime() - today.getTime()) / 86400000);
  if (n < 0) return { text: `Overdue by ${-n} day${n === -1 ? '' : 's'}`, variant: 'error' };
  if (n === 0) return { text: 'Due today', variant: 'error' };
  if (n <= 2) return { text: `Due in ${n} day${n === 1 ? '' : 's'}`, variant: 'warning' };
  return null;
};

const PART_GRID = (withVisit: boolean) =>
  withVisit
    ? 'md:grid-cols-[minmax(0,2.4fr)_5.5rem_7.5rem_minmax(0,1.8fr)_9.5rem_2.5rem]'
    : 'md:grid-cols-[minmax(0,3fr)_6rem_8rem_10rem_2.5rem]';

/**
 * A section. `editing` = its own Card (the app's normal box). Otherwise a headed part of ONE shared box:
 * the same header pattern as Card (title, small grey description) with thin dividers between sections.
 */
const Sec: React.FC<{
  editing?: boolean;
  title?: string;
  count?: string | number | null;
  hint?: string;
  children: React.ReactNode;
}> = ({ editing, title, count, hint, children }) =>
  editing ? (
    <Card title={title && count != null ? `${title} (${count})` : title} description={hint} className="mb-4">{children}</Card>
  ) : (
    <section>
      {title && (
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-slate-50 min-h-[56px]">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">{title}</h3>
            {hint && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{hint}</p>}
          </div>
          {count != null && <Badge variant="outline">{count}</Badge>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );

export const ServiceWorkOrderPage: React.FC = () => {
  const { visitId: visitIdStr, contractId: contractIdStr } = useParams<{ visitId: string; contractId: string }>();
  const visitId = Number(visitIdStr);
  const contractId = Number(contractIdStr);
  const isContractMode = !!contractIdStr;
  const navigate = useNavigate();
  const { showToast } = useApp();

  const canView = useAppSelector(selectHasPermission('service.view'));
  const canManage = useAppSelector(selectHasPermission('service.manage_work_order'));
  const canApprove = useAppSelector(selectHasPermission('service.approve_work_order'));
  const canViewCustomer = useAppSelector(selectHasPermission('marketing.view_customer'));
  const currentUser = useAppSelector(selectUser);
  // the department list is fetched from HRMS through the API; it needs this permission (or the older marketing.view_domain)
  const canViewDepartments =
    useAppSelector(selectHasPermission('service.view_departments')) || useAppSelector(selectHasPermission('marketing.view_domain'));

  const [isLoading, setIsLoading] = useState(true);
  const [wo, setWo] = useState<ServiceWorkOrder | null>(null);
  // contract mode: the contract and its visits (so each part can say which visit it is for)
  const [contract, setContract] = useState<ServiceContract | null>(null);
  const [planVisits, setPlanVisits] = useState<ServiceVisit[]>([]);

  // editable draft
  const [leadTime, setLeadTime] = useState(3);
  const [notes, setNotes] = useState('');
  // department this work order is sent to (from HRMS)
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<{ id: number; name: string; head_name?: string | null }[]>([]);
  const [materials, setMaterials] = useState<WorkOrderMaterial[]>([]);
  const [prereqs, setPrereqs] = useState<WorkOrderPrerequisite[]>([]);
  const [saving, setSaving] = useState(false);
  // A saved work order opens in a read-only view (everything in boxes); Edit switches to the form. A new one starts in the form.
  const [editing, setEditing] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  // sending a work order back (reason required)
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [sendBackReason, setSendBackReason] = useState('');
  // which action is asking "why?": chain send-back, or (no approval chain) reopen / back to Prepared
  const [reasonKind, setReasonKind] = useState<'send_back' | 'reopen' | 'prepared'>('send_back');
  const askReason = (kind: 'send_back' | 'reopen' | 'prepared') => { setReasonKind(kind); setSendBackReason(''); setSendBackOpen(true); };
  const [newPrereq, setNewPrereq] = useState('');
  const [busy, setBusy] = useState(false);

  const syncDraft = (w: ServiceWorkOrder | null) => {
    setLeadTime(w?.material_lead_time_days ?? 3);
    setNotes(w?.notes || '');
    setSelectedDepts(w?.departments ?? []);
    setMaterials((w?.materials ?? []).map((m) => ({ ...m })));
    setPrereqs((w?.prerequisites ?? []).map((p) => ({ ...p })));
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isContractMode) {
        const [w, c, plan] = await Promise.all([
          marketingAPI.getWorkOrderForContract(contractId),
          marketingAPI.getServiceContract(contractId),
          marketingAPI.getServicePlanForContract(contractId).catch(() => null),
        ]);
        setContract(c);
        setPlanVisits(plan?.visits ?? []);
        setWo(w);
        syncDraft(w);
      } else {
        const w = await marketingAPI.getWorkOrderForVisit(visitId);
        setWo(w);
        syncDraft(w);
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to load work order', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [visitId, contractId, isContractMode, showToast]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    load();
  }, [canView, load]);

  useEffect(() => {
    if (!canView || !canViewDepartments) return;
    marketingAPI.getDepartments().then((d) => setDepartments(d || [])).catch(() => setDepartments([]));
  }, [canView, canViewDepartments]);

  const cleanMaterials = (): WorkOrderMaterial[] =>
    materials
      .filter((m) => m.item_name.trim())
      .map((m, i) => ({
        id: m.id,
        item_name: m.item_name.trim(),
        visit_id: isContractMode ? m.visit_id ?? null : undefined,
        quantity: m.quantity?.trim() || null,
        unit: m.unit || null,
        unit_note: m.unit === 'other' ? m.unit_note?.trim() || null : null,
        description: m.description?.trim() || null,
        required_by_date: m.required_by_date?.trim() ? m.required_by_date : null,
        display_order: i,
      }));

  const deptPayload = () => ({ departments: selectedDepts });

  const addPrereq = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (prereqs.some((x) => x.text.trim().toLowerCase() === t.toLowerCase())) {
      showToast('That item is already on the list', 'error');
      return;
    }
    setPrereqs((p) => [...p, { text: t }]);
    setNewPrereq('');
  };

  const cleanPrereqs = (): WorkOrderPrerequisite[] =>
    prereqs.filter((p) => p.text.trim()).map((p, i) => ({ text: p.text.trim(), display_order: i }));

  const createWo = async () => {
    setSaving(true);
    try {
      const w = await marketingAPI.createServiceWorkOrder({
        ...(isContractMode ? { contract_id: contractId } : { visit_id: visitId }),
        material_lead_time_days: leadTime,
        ...deptPayload(),
        notes: notes.trim() || null,
        materials: cleanMaterials(),
        prerequisites: cleanPrereqs(),
      });
      setWo(w);
      syncDraft(w);
      setEditing(false);
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
        ...deptPayload(),
        notes: notes.trim() || null,
        materials: cleanMaterials(),
        prerequisites: cleanPrereqs(),
      });
      setWo(w);
      syncDraft(w);
      setEditing(false);
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

  // The client's work order file(s): PDF / Excel / Word, several per visit
  const uploadFiles = async (key: string, visitIdForFiles: number | null, list: FileList | null) => {
    if (!wo || !list || list.length === 0) return;
    setUploadingKey(key);
    try {
      // one file per visit: a new upload replaces the visit's old one
      const created = await marketingAPI.uploadWorkOrderFiles(wo.id, [list[0]], visitIdForFiles);
      const sameSlot = (f: WorkOrderFile) => (isContractMode ? (f.visit_id ?? null) === (visitIdForFiles ?? null) : true);
      setWo((w) => (w ? { ...w, files: [...(w.files ?? []).filter((f) => !sameSlot(f)), ...created] } : w));
      const sharedWith = (wo.departments ?? []).map((d) => d.name).join(', ');
      showToast(`File uploaded${sharedWith ? ` and shared with ${sharedWith}` : ''}`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Upload failed', 'error');
    } finally {
      setUploadingKey(null);
      const el = fileInputs.current[key];
      if (el) el.value = '';
    }
  };

  const removeFile = async (f: WorkOrderFile) => {
    if (!wo || !window.confirm(`Remove ${f.file_name}?`)) return;
    try {
      await marketingAPI.deleteWorkOrderFile(wo.id, f.id);
      setWo((w) => (w ? { ...w, files: (w.files ?? []).filter((x) => x.id !== f.id) } : w));
    } catch (e: any) {
      showToast(e?.message || 'Failed to remove', 'error');
    }
  };

  const fmtSize = (n?: number | null) => (n == null ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

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
  const isEditing = !wo || editing;
  const cancelEdit = () => {
    syncDraft(wo);
    setEditing(false);
  };

  return (
    <PageLayout
      title={wo ? `Work Order ${wo.wo_number || `#${wo.id}`}` : 'New Work Order'}
      description={wo ? `${wo.contract_number || ''} · ${wo.customer_name || ''}${wo.plant_name ? ` · ${wo.plant_name}` : ''}` : isContractMode ? `for contract ${contract?.contract_number || `#${contractId}`} — one work order for all its visits` : `for visit #${visitId}`}
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
          {canManage && wo && !editing && (
            <Button size="sm" onClick={() => setEditing(true)} leftIcon={<SquarePen size={14} />}>
              Edit
            </Button>
          )}
          {canManage && wo && editing && (
            <>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveWo} isLoading={saving}>
                Save work order
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* Customer details (also reachable from the customer's page, which lists its work orders) */}
      {wo && (
        <Sec
          editing
          title="Customer"
          hint={wo.visit_id ? 'Single-visit work order' : 'One work order for all the contract\'s visits'}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company</p>
              {wo.customer_id && canViewCustomer ? (
                <button type="button" className="text-sm font-semibold text-blue-600 hover:underline text-left" onClick={() => navigate(`/customers/${wo.customer_id}/edit`)}>
                  {wo.customer_name || `Customer #${wo.customer_id}`}
                </button>
              ) : (
                <p className="text-sm font-semibold text-slate-800">{wo.customer_name || '—'}</p>
              )}
              {wo.contract_number && <p className="text-xs text-slate-500 mt-0.5">Contract {wo.contract_number}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact person</p>
              <p className="text-sm font-semibold text-slate-800">{wo.customer_contact_name || '—'}</p>
              {wo.customer_contact_phone && (
                <p className="text-xs text-slate-500 mt-0.5"><a href={`tel:${wo.customer_contact_phone}`} className="hover:text-blue-600">{wo.customer_contact_phone}</a></p>
              )}
              {wo.customer_contact_email && (
                <p className="text-xs text-slate-500 truncate"><a href={`mailto:${wo.customer_contact_email}`} className="hover:text-blue-600">{wo.customer_contact_email}</a></p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Plant / site</p>
              <p className="text-sm font-semibold text-slate-800">{wo.plant_name || '—'}</p>
              {wo.plant_address && <p className="text-xs text-slate-500 mt-0.5">{wo.plant_address}</p>}
            </div>
          </div>
        </Sec>
      )}

      {/* Status stepper */}
      {wo && (
        <Sec editing>
          {(wo.approval_chain ?? []).length > 0 ? (() => {
            // ---- approval flow from the HRMS approval template (category "service_work_order")
            const chain = wo.approval_chain ?? [];
            const cur = wo.current_level ?? 0;
            const isApproved = wo.status === 'approved';
            const me = (currentUser?.username || '').toLowerCase();
            const stepNow = !isApproved ? chain[cur] : undefined;
            const iAmCurrent = !!stepNow && (stepNow.approver_username || '').toLowerCase() === me;
            const iAmAnyApprover = chain.some((x) => (x.approver_username || '').toLowerCase() === me);
            const isSuper = !!currentUser?.is_superuser;
            const canApproveNow = !isApproved && (iAmCurrent || isSuper);
            const canSendBack = isApproved ? iAmAnyApprover || isSuper : iAmCurrent || isSuper;
            const nodes = [
              { key: 'prep', label: 'Prepared', sub: wo.prepared_by_username || wo.created_by_username, done: true, current: false },
              ...chain.map((x, i) => ({
                key: `l${x.level}`,
                label: `Level ${x.level}`,
                sub: x.approver_name || x.approver_username,
                done: i < cur || isApproved,
                current: !isApproved && i === cur,
              })),
              { key: 'done', label: 'Approved', sub: isApproved ? wo.approved_by_username : null, done: isApproved, current: false },
            ];
            return (
              <>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-4">
                  <span className="text-sm text-slate-500">This work order is</span>
                  <Badge variant={STATUS_VARIANT[wo.status]}>{STATUS_LABEL[wo.status]}</Badge>
                  {wo.approval_template_name && <span className="text-xs text-slate-400">· approval flow: {wo.approval_template_name}</span>}
                  {wo.revision > 0 && <span className="text-xs text-amber-600">· edited {wo.revision}× after approval</span>}
                  {(wo.times_reopened ?? 0) > 0 && <Badge variant="warning">Reopened {wo.times_reopened}×</Badge>}
                </div>

                {wo.rejection_reason && wo.status === 'prepared' && (
                  <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <span className="font-semibold">Sent back:</span> {wo.rejection_reason}
                  </div>
                )}

                <div className="flex items-start">
                  {nodes.map((n, i) => (
                    <React.Fragment key={n.key}>
                      {i > 0 && <div className={`flex-1 h-0.5 mt-3.5 ${n.done || n.current ? 'bg-blue-500' : 'bg-slate-200'}`} />}
                      <div className="flex flex-col items-center text-center w-32 shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${n.done ? 'bg-blue-500 text-white' : n.current ? 'bg-white text-blue-600 ring-2 ring-blue-500' : 'bg-slate-100 text-slate-400'}`}>
                          {n.done ? <Check size={14} /> : i + 1}
                        </div>
                        <div className={`mt-1.5 text-sm font-semibold ${n.done || n.current ? 'text-slate-800' : 'text-slate-400'}`}>{n.label}</div>
                        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{n.sub || ''}</div>
                        {n.current && <div className="text-[11px] text-blue-600 font-medium mt-0.5">waiting</div>}
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    {isApproved
                      ? '✓ Approved. The parts now appear on the Store / Dispatch screen.'
                      : `→ Waiting for ${stepNow?.approver_name || stepNow?.approver_username || 'the approver'} (level ${cur + 1} of ${chain.length}).${iAmCurrent ? ' That is you.' : ''}`}
                  </p>
                  <div className="flex gap-2">
                    {canManage && wo.status === 'prepared' && (
                      <Button size="sm" variant="outline" isLoading={busy} onClick={() => runAction(() => marketingAPI.workOrderSubmit(wo.id), 'Approver notified')}>
                        Send for approval
                      </Button>
                    )}
                    {canSendBack && (
                      <Button size="sm" variant="ghost" onClick={() => askReason('send_back')}>
                        {isApproved ? 'Send back for changes' : 'Send back'}
                      </Button>
                    )}
                    {canApproveNow && (
                      <Button size="sm" isLoading={busy} onClick={() => runAction(() => marketingAPI.workOrderApprove(wo.id), cur + 1 >= chain.length ? 'Approved' : `Level ${cur + 1} approved`)}>
                        Approve (level {cur + 1} of {chain.length})
                      </Button>
                    )}
                  </div>
                </div>

                {(wo.approvals ?? []).length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</p>
                    {(wo.approvals ?? []).map((h) => (
                      <p key={h.id} className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{h.by_username || '—'}</span>{' '}
                        {h.action === 'approved' ? `approved level ${h.level}` : h.action === 'reopened' ? `reopened it${h.note ? `: “${h.note}”` : ''}` : `sent it back${h.note ? `: “${h.note}”` : ''}`}
                        <span className="text-slate-400"> · {new Date(h.created_at).toLocaleString()}</span>
                      </p>
                    ))}
                  </div>
                )}
              </>
            );
          })() : (() => {
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
                  {(wo.times_reopened ?? 0) > 0 && <Badge variant="warning">Reopened {wo.times_reopened}×</Badge>}
                  </div>

                  {wo.rejection_reason && wo.status !== 'approved' && (
                    <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">Reopened:</span> {wo.rejection_reason}
                    </div>
                  )}
  
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
                        <Button size="sm" variant="ghost" onClick={() => askReason('prepared')}>
                          Back to Prepared
                        </Button>
                      )}
                      {canApprove && wo.status === 'checked' && (
                        <Button size="sm" isLoading={busy} onClick={() => runAction(() => marketingAPI.workOrderApprove(wo.id), 'Approved')}>
                          Approve
                        </Button>
                      )}
                      {canApprove && wo.status === 'approved' && (
                        <Button size="sm" variant="ghost" onClick={() => askReason('reopen')}>
                          Reopen for changes
                        </Button>
                      )}
                    </div>
                  </div>

                  {(wo.approvals ?? []).length > 0 && (
                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</p>
                      {(wo.approvals ?? []).map((h) => (
                        <p key={h.id} className="text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{h.by_username || '—'}</span>{' '}
                          {h.action === 'reopened' ? 'reopened it' : 'sent it back'}{h.note ? `: “${h.note}”` : ''}
                          <span className="text-slate-400"> · {new Date(h.created_at).toLocaleString()}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
        </Sec>
      )}

      {/* Work order files */}
      {wo && (
        <Sec
          editing
          title="Work order files"
          hint="Upload the client's work order (PDF or Excel) for each visit — one file per visit"
        >
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysTo = (d?: string | null): number | null =>
              d ? Math.round((new Date(`${d}T00:00:00`).getTime() - today.getTime()) / 86400000) : null;
            const fmtDay = (d?: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null);

            type Block = { key: string; label: string; sub?: string | null; visit: number | null; date?: string | null; days: number | null; finished: boolean };
            const filesOf = (b: Block) => (wo.files ?? []).filter((f) => (isContractMode ? (f.visit_id ?? null) === b.visit : true));
            const GRID = 'grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,2fr)_9rem] gap-x-5 gap-y-1';

            // "in 12 days" / "in about 5 months" / "in about 2 years" — and the same for the past
            const span = (n: number) => {
              const d = Math.abs(n);
              const txt = d <= 60 ? `${d} day${d === 1 ? '' : 's'}` : d < 730 ? `about ${Math.round(d / 30)} months` : `about ${Math.round(d / 365)} years`;
              return n < 0 ? `${txt} ago` : `in ${txt}`;
            };

            // the visit date, in words (and how urgent it is while the file is missing)
            const timing = (b: Block): { text: string; note?: string; cls: string } => {
              if (b.finished) return { text: 'Visit done', cls: 'text-slate-400' };
              if (b.days === null) return { text: 'No date set yet', cls: 'text-slate-400' };
              if (b.days < 0) return { text: `${span(b.days).replace(' ago', '')} overdue`, note: 'Visit not marked done', cls: 'text-rose-600 font-semibold' };
              const missing = filesOf(b).length === 0;
              const cls = missing && b.days <= 7 ? 'text-rose-600 font-semibold' : missing && b.days <= 30 ? 'text-amber-600 font-semibold' : 'text-slate-500';
              return { text: b.days === 0 ? 'Today' : b.days === 1 ? 'Tomorrow' : span(b.days), cls };
            };

            const renderRow = (b: Block, opts: { isNext?: boolean; isVisit?: boolean } = {}) => {
              const f = filesOf(b)[0];
              const isVisit = opts.isVisit !== false;
              const t = timing(b);
              const isOpen = !b.finished && (!isVisit || b.days === null || b.days <= UPLOAD_WINDOW_DAYS);
              const opensOn = (() => {
                if (!b.date) return null;
                const d = new Date(`${b.date}T00:00:00`);
                d.setDate(d.getDate() - UPLOAD_WINDOW_DAYS);
                return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
              })();
              return (
                <div key={b.key} className={`${GRID} py-4 first:pt-0 last:pb-0 items-center`}>
                  {/* Visit */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 flex flex-wrap items-center gap-2">
                      {b.label}
                      {opts.isNext && <Badge variant="default">Next visit</Badge>}
                    </p>
                    {b.sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{b.sub}</p>}
                  </div>
                  {/* Visit date */}
                  <div>
                    {isVisit ? (
                      <>
                        <p className="text-sm font-medium text-slate-700">{fmtDay(b.date) || '—'}</p>
                        <p className={`text-xs mt-0.5 ${t.cls}`}>{t.text}</p>
                        {t.note && <p className="text-[11px] text-slate-400 mt-0.5">{t.note}</p>}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">Not tied to a visit</p>
                    )}
                  </div>
                  {/* The file */}
                  <div className="min-w-0">
                    {f ? (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <button type="button" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline text-left max-w-full"
                            onClick={() => marketingAPI.downloadWorkOrderFile(wo.id, f.id, f.file_name)} title="Open / download">
                            <FileText size={14} className="shrink-0" /> <span className="truncate">{f.file_name}</span>
                          </button>
                          <p className="text-[11px] text-slate-400 mt-0.5">{fmtSize(f.file_size)}{f.uploaded_by_username ? ` · uploaded by ${f.uploaded_by_username}` : ''}</p>
                        </div>
                        {canManage && (
                          <button type="button" className="text-slate-400 hover:text-rose-600 shrink-0 mt-0.5" title="Remove this file" onClick={() => removeFile(f)}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : isVisit ? (
                      <Badge variant="warning">No file yet</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  {/* Action: the upload opens when the visit is within UPLOAD_WINDOW_DAYS */}
                  <div className="md:text-right">
                    {!canManage ? null : b.finished ? (
                      <span className="text-xs text-slate-400">Visit done</span>
                    ) : !isOpen ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium" title={`Uploading opens ${UPLOAD_WINDOW_DAYS / 30} months before the visit`}>
                        <Lock size={12} /> Opens {opensOn || 'closer to the visit'}
                      </span>
                    ) : (
                      <>
                        <input
                          ref={(el) => { fileInputs.current[b.key] = el; }}
                          type="file"
                          accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => uploadFiles(b.key, b.visit, e.target.files)}
                        />
                        <Button size="xs" variant={f ? 'outline' : 'primary'} leftIcon={<Upload size={14} />} isLoading={uploadingKey === b.key}
                          onClick={() => fileInputs.current[b.key]?.click()}>
                          {f ? 'Replace file' : 'Upload file'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            };

            // column titles
            const header = (
              <div className={`${GRID} hidden md:grid pb-2 mb-3 border-b border-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider`}>
                <div>Visit</div>
                <div>Visit date</div>
                <div>Work order file</div>
                <div />
              </div>
            );

            const sharedWith = (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shared with</span>
                {(wo.departments ?? []).length > 0 ? (
                  (wo.departments ?? []).map((d) => (
                    <span key={d.id} title={d.head_name ? `${d.head_name} (head) is notified when a file is uploaded` : undefined} className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {d.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No department yet — choose departments in Edit</span>
                )}
              </div>
            );

            if (!isContractMode) {
              const single: Block = { key: 'single', label: 'This visit', sub: wo.visit_title || null, visit: wo.visit_id ?? null, date: wo.visit_date, days: daysTo(wo.visit_date), finished: false };
              return (
                <>
                  <div className="mb-4">{sharedWith}</div>
                  {header}
                  {renderRow(single)}
                </>
              );
            }

            // contract work order: every visit is listed (soonest first, finished last); upload opens when a visit is close
            const all: Block[] = [...planVisits]
              .map((v) => ({
                key: `v${v.id}`,
                label: `${v.kind === 'unscheduled' ? 'Extra visit' : 'Visit'} ${v.visit_number ?? v.id}`,
                sub: v.title && v.title.trim() ? v.title : null,
                visit: v.id,
                date: v.planned_date || v.scheduled_date,
                days: daysTo(v.planned_date || v.scheduled_date),
                finished: v.status === 'done' || v.status === 'cancelled',
              }))
              .sort((x, y) => Number(x.finished) - Number(y.finished) || (x.date || '9999-12-31').localeCompare(y.date || '9999-12-31'));
            const active = all.filter((b) => !b.finished);
            const nextIdx = all.findIndex((b) => !b.finished && b.days !== null && b.days >= 0);
            const haveFile = active.filter((b) => filesOf(b).length > 0).length;
            const general: Block = { key: 'general', label: 'Other documents', visit: null, days: null, finished: false };
            const hasGeneral = filesOf(general).length > 0;
            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 mb-4">
                  <p className="text-sm text-slate-600">
                    {all.length > 0 ? (
                      <>Work order file uploaded for <span className="font-semibold text-slate-800">{haveFile} of {active.length}</span> visit{active.length === 1 ? '' : 's'}</>
                    ) : (
                      'No visits yet — add visits on the Service Plan page.'
                    )}
                  </p>
                  {sharedWith}
                </div>

                {header}
                <div className="divide-y divide-slate-100">
                  {all.map((b, i) => renderRow(b, { isNext: i === nextIdx }))}
                  {hasGeneral && renderRow(general, { isVisit: false })}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-4">
                  Uploading opens {UPLOAD_WINDOW_DAYS / 30} months before a visit. You are reminded 30, 15 and 7 days before a visit until its file is uploaded.
                </p>
              </>
            );
          })()}
        </Sec>
      )}

      {/* Read-only view: Details, Parts and the customer checklist share ONE box (thin dividing lines); in edit mode they are separate cards */}
      <div
        className={isEditing ? '' : 'mb-4 bg-white border border-slate-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)] divide-y divide-slate-100 overflow-hidden'}
        style={isEditing ? undefined : { borderRadius: '1.25rem' }}
      >
      {/* Departments (one or several) — edit mode */}
      {isEditing && (
      <Sec editing title="Send to departments" hint="Each department sees this work order, and its files, under “My department”">
        <div className="max-w-xl">
          {selectedDepts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedDepts.map((d) => (
                <span key={d.id} title={d.head_name ? `Head: ${d.head_name}` : undefined} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 pl-3 pr-2 py-1 text-sm font-medium text-blue-700">
                  {d.name}
                  {!readOnly && (
                    <button type="button" className="text-blue-400 hover:text-rose-600" title={`Remove ${d.name}`}
                      onClick={() => setSelectedDepts((p) => p.filter((x) => x.id !== d.id))}>
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          {!readOnly && canViewDepartments && (
            <Select
              options={departments.filter((d) => !selectedDepts.some((x) => x.id === d.id)).map((d) => ({ value: String(d.id), label: d.name }))}
              value=""
              onChange={(v) => {
                const d = departments.find((x) => String(x.id) === String(v));
                if (d) setSelectedDepts((p) => [...p, { id: d.id, name: d.name }]);
              }}
              placeholder={departments.length ? (selectedDepts.length ? 'Add another department…' : 'Select a department…') : 'Loading departments…'}
              searchable
              clearable={false}
            />
          )}
          {(readOnly || !canViewDepartments) && selectedDepts.length === 0 && (
            <p className="text-sm text-slate-400">{canViewDepartments ? 'No department selected.' : 'No department selected (you need the “view departments” permission to choose one).'}</p>
          )}
          <p className="text-xs text-slate-400 mt-1.5">Each chosen department sees this work order under “My department” in the Work Orders list.</p>
          {selectedDepts.some((d) => d.head_name) && (
            <p className="text-xs text-slate-500 mt-1">Work-order-file reminders go to the department head(s): {selectedDepts.filter((d) => d.head_name).map((d) => `${d.head_name} (${d.name})`).join(', ')}.</p>
          )}
        </div>
      </Sec>
      )}

      {/* Details (read-only view of departments, store lead time and notes) */}
      {!isEditing && (
      <Sec editing={isEditing} title="Details" hint="Who it goes to, and store timing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sent to departments</p>
            {selectedDepts.length === 0 ? (
              <p className="text-slate-400">—</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedDepts.map((d) => (
                  <span key={d.id} title={d.head_name ? `Head: ${d.head_name}` : undefined} className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {d.name}
                  </span>
                ))}
              </div>
            )}
            {selectedDepts.some((d) => d.head_name) && (
              <p className="text-xs text-slate-500 mt-1">Heads: {selectedDepts.filter((d) => d.head_name).map((d) => d.head_name).join(', ')}</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Store lead time</p>
            <p className="text-sm font-semibold text-slate-800">{leadTime} day{leadTime === 1 ? '' : 's'} before each visit</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
            <p className="text-slate-700 whitespace-pre-wrap">{notes.trim() || <span className="text-slate-400">—</span>}</p>
          </div>
        </div>
      </Sec>
      )}

      {/* Materials — edit mode */}
      {isEditing && (
      <Sec
        editing
        title="Parts &amp; materials needed"
        hint={isContractMode ? 'What the engineer needs, and for which visit — the store gets these ready' : 'What the engineer needs for this visit — the store gets these ready'}
      >
        {/* Store lead time */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-24">
              <Input
                type="number"
                min={0}
                value={String(leadTime)}
                onChange={(e) => setLeadTime(Math.max(0, Number(e.target.value) || 0))}
                disabled={readOnly}
                aria-label="Days the store needs to get parts ready"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">days for the store to get parts ready</p>
              <p className="text-[11px] text-slate-400 font-medium">Parts must reach the customer this many days before the visit</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium max-w-xs">
            A part's “Needed by” fills in as its visit's date minus this. You can type your own date on any part.
          </p>
        </div>

        {materials.length === 0 ? (
          <div className="py-6 text-center">
            <Package size={28} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No parts added yet</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Add the parts and materials the engineer needs. The store will get them ready.
            </p>
            {!readOnly && (
              <Button size="sm" className="mt-4" leftIcon={<Plus size={14} />} onClick={() => setMaterials((m) => [...m, emptyMaterial()])}>
                Add a part
              </Button>
            )}
          </div>
        ) : (
          <div>
            {/* Column labels (desktop) */}
            <div className={`hidden md:grid gap-3 pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-600 uppercase tracking-wider ${PART_GRID(isContractMode)}`}>
              <div>Part / material</div>
              <div>Qty</div>
              <div>Unit</div>
              {isContractMode && <div>For visit</div>}
              <div>Needed by</div>
              <div />
            </div>

            <div className="divide-y divide-slate-100">
              {materials.map((m, idx) => (
                <div key={m.id ?? `new-${idx}`} className="py-3">
                  <div className={`grid grid-cols-1 gap-2 md:gap-3 md:items-start ${PART_GRID(isContractMode)}`}>
                    <div>
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Part / material</span>
                      <Input placeholder="e.g. Compressor filter" value={m.item_name} disabled={readOnly}
                        onChange={(e) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, item_name: e.target.value } : x)))} />
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qty</span>
                      <Input placeholder="Qty" value={m.quantity || ''} disabled={readOnly}
                        onChange={(e) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))} />
                    </div>
                    <div>
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</span>
                      <Select
                        options={UNIT_OPTIONS}
                        value={m.unit || ''}
                        placeholder="Unit"
                        disabled={readOnly}
                        searchable={false}
                        onChange={(val) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, unit: (val as string) || null } : x)))}
                      />
                    </div>
                    {isContractMode && (
                      <div>
                        <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">For visit</span>
                        <Select
                          options={[{ value: '', label: 'Whole year' }, ...planVisits.map((v) => ({ value: String(v.id), label: visitOptionLabel(v) }))]}
                          value={m.visit_id != null ? String(m.visit_id) : ''}
                          placeholder="For visit"
                          disabled={readOnly}
                          searchable={false}
                          clearable={false}
                          onChange={(val) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, visit_id: val ? Number(val) : null } : x)))}
                        />
                      </div>
                    )}
                    <div>
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-widest">Needed by</span>
                      <Input type="date" label="" value={m.required_by_date || ''} disabled={readOnly}
                        onChange={(e) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, required_by_date: e.target.value } : x)))} />
                    </div>
                    <div className="flex items-center justify-end h-10">
                      {!readOnly && (
                        <button type="button" className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Remove this part"
                          onClick={() => setMaterials((p) => p.filter((_, i) => i !== idx))}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Extra details for this part */}
                  {(m.unit === 'other' || m.id || m.customer_item_name || (m.dispatches?.length ?? 0) > 0 || m.dispatched_note || (m.attachments?.length ?? 0) > 0) && (
                    <div className="mt-2 space-y-1.5">
                      {m.unit === 'other' && (
                        <div className="max-w-md">
                          <Input placeholder="“Other” unit — what is it?" value={m.unit_note || ''} disabled={readOnly}
                            onChange={(e) => setMaterials((p) => p.map((x, i) => (i === idx ? { ...x, unit_note: e.target.value } : x)))} />
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {m.id && (
                          <Badge variant={m.dispatch_status === 'full' ? 'success' : m.dispatch_status === 'partial' ? 'warning' : 'outline'}>
                            {DISPATCH_LABEL[m.dispatch_status || 'not_dispatched']}
                          </Badge>
                        )}
                        {m.customer_item_name && (
                          <span>Customer calls this: <span className="font-semibold text-slate-700">{m.customer_item_name}</span></span>
                        )}
                        {m.dispatched_note && (
                          <span>Dispatched: {m.dispatched_note}{m.dispatched_by_username ? ` — ${m.dispatched_by_username}` : ''}</span>
                        )}
                        {(m.attachments?.length ?? 0) > 0 && m.id && m.attachments!.map((a) => (
                          <button key={a.id} type="button" className="text-blue-600 hover:underline"
                            onClick={() => marketingAPI.downloadMaterialProof(m.id!, a.id, a.file_name)}>
                            {a.file_name}
                          </button>
                        ))}
                      </div>
                      {(m.dispatches?.length ?? 0) > 0 && (
                        <div className="space-y-0.5">
                          {m.dispatches!.map((d) => (
                            <p key={d.id} className="text-xs text-slate-500">
                              Sent {d.sent_on}{d.quantity_sent ? ` · ${d.quantity_sent}` : ''}{d.docket_no ? ` · Docket ${d.docket_no}` : ''}{d.transporter ? ` (${d.transporter})` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && (
              <div className="pt-3 border-t border-slate-100">
                <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => setMaterials((m) => [...m, emptyMaterial()])}>
                  Add another part
                </Button>
              </div>
            )}
          </div>
        )}
      </Sec>
      )}

      {!isEditing && (
        <Sec editing={isEditing} title="Parts &amp; materials needed" count={materials.length} hint={wo?.dispatch_summary ? `${wo.dispatch_summary} — ${isContractMode ? 'for each visit' : 'for this visit'}` : isContractMode ? 'What to send, and for which visit' : 'What the engineer needs for this visit'}>
          {materials.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">No parts added.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-2 pr-4">Part / material</th>
                    {isContractMode && <th className="text-left pb-2 pr-4">For visit</th>}
                    <th className="text-left pb-2 pr-4">Qty</th>
                    <th className="text-left pb-2 pr-4">Needed by</th>
                    <th className="text-left pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {materials.map((m, idx) => (
                    <tr key={m.id ?? `v-${idx}`} className="align-top">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-slate-800">{m.item_name}</div>
                        {m.customer_item_name && <div className="text-xs text-slate-500">Customer calls this: {m.customer_item_name}</div>}
                        {m.description && <div className="text-xs text-slate-500">{m.description}</div>}
                      </td>
                      {isContractMode && (
                        <td className="py-2.5 pr-4 text-slate-600">
                          {m.visit_id ? `${m.visit_title || 'Visit'}${m.visit_date ? ` · ${m.visit_date}` : ''}` : <span className="text-slate-400">Whole year</span>}
                        </td>
                      )}
                      <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap">
                        {[m.quantity, m.unit && m.unit !== 'other' ? m.unit : m.unit === 'other' ? m.unit_note : null].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap">
                        <div>{m.required_by_date || '—'}</div>
                        {(() => {
                          const t = dueTagFor(m.required_by_date, m.dispatch_status);
                          return t ? <Badge variant={t.variant} className="mt-1 text-[11px]">{t.text}</Badge> : null;
                        })()}
                      </td>
                      <td className="py-2.5 pr-4">
                        {m.id ? (
                          <>
                            <Badge variant={m.dispatch_status === 'full' ? 'success' : m.dispatch_status === 'partial' ? 'warning' : 'outline'}>
                              {DISPATCH_LABEL[m.dispatch_status || 'not_dispatched']}
                            </Badge>
                            {(m.dispatches ?? []).map((d) => (
                              <div key={d.id} className="text-xs text-slate-500 mt-0.5">
                                Sent {d.sent_on}{d.quantity_sent ? ` · ${d.quantity_sent}` : ''}{d.docket_no ? ` · Docket ${d.docket_no}` : ''}{d.transporter ? ` (${d.transporter})` : ''}
                              </div>
                            ))}
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Sec>
      )}

      {/* Prerequisites (what the customer must have ready) */}
      <Sec editing={isEditing} title="What the customer must have ready before the visit" count={prereqs.length ? `${prereqs.filter((x) => x.is_done).length}/${prereqs.length} ready` : null} hint={isEditing ? 'Power, access, space… what the customer has to arrange' : 'Power, access, space… tick each once the customer confirms'}>
        {isEditing && (
          <p className="text-xs text-slate-500 mb-3">
            Add everything the customer needs to arrange. Save the work order to keep the list, then tick each item as the customer confirms it's ready.
          </p>
        )}

        {wo?.prerequisites_sent_at && (
          <p className="text-xs font-medium text-emerald-600 mb-3">
            ✓ Sent to the customer on {new Date(wo.prerequisites_sent_at).toLocaleDateString()}
          </p>
        )}

        {prereqs.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
            Nothing added yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {prereqs.map((p, idx) => {
              const saved = !!p.id;
              return (
                <div key={p.id ?? `new-${idx}`} className={`flex items-center gap-3 px-3 ${isEditing ? 'py-2' : 'py-2.5'} ${p.is_done ? 'bg-emerald-50/30' : 'bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={!!p.is_done}
                    disabled={readOnly || !saved}
                    title={saved ? 'Tick once the customer confirms this is ready' : 'Save the work order first'}
                    onChange={() => saved && togglePrereq(p)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40 shrink-0"
                  />
                  {isEditing && !saved ? (
                    <div className="flex-1 min-w-0">
                      <Input
                        placeholder="e.g. Power supply available at the machine"
                        value={p.text}
                        onChange={(e) => setPrereqs((prev) => prev.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))}
                      />
                    </div>
                  ) : (
                    <span className={`flex-1 min-w-0 text-sm ${p.is_done ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{p.text}</span>
                  )}
                  {!saved && <Badge variant="warning">Not saved</Badge>}
                  {p.is_done && p.confirmed_by_username && (
                    <span className="text-[11px] font-medium text-emerald-700 whitespace-nowrap">Confirmed · {p.confirmed_by_username}</span>
                  )}
                  {!readOnly && isEditing && (
                    <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0" title="Remove this item"
                      onClick={() => setPrereqs((prev) => prev.filter((_, i) => i !== idx))}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick add (edit mode): type + Enter, or tap a common item */}
        {!readOnly && isEditing && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Add an item and press Enter…"
                  value={newPrereq}
                  onChange={(e) => setNewPrereq(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPrereq(newPrereq);
                    }
                  }}
                />
              </div>
              <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => addPrereq(newPrereq)} disabled={!newPrereq.trim()}>
                Add
              </Button>
            </div>
            {PREREQ_SUGGESTIONS.filter((t) => !prereqs.some((x) => x.text.trim().toLowerCase() === t.toLowerCase())).length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Common</span>
                {PREREQ_SUGGESTIONS.filter((t) => !prereqs.some((x) => x.text.trim().toLowerCase() === t.toLowerCase())).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addPrereq(t)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <Plus size={11} /> {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </Sec>
      </div>

      {!isEditing && wo && (
        <div className="-mt-4 mb-4 px-1 text-[11px] text-slate-400 font-medium flex flex-wrap gap-x-4">
          <span>Prepared by {wo.prepared_by_username || wo.created_by_username || '—'} on {new Date(wo.created_at).toLocaleDateString()}</span>
          <span>Last updated {new Date(wo.updated_at).toLocaleDateString()}</span>
          {wo.revision > 0 && <span>Revision {wo.revision}</span>}
        </div>
      )}

      {/* Notes — edit mode (the read-only view shows them in Details) */}
      {isEditing && (
      <Sec editing title="Notes">
        <textarea
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={notes}
          disabled={readOnly}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Sec>
      )}

      {/* Why? — asked before a work order is sent back / reopened */}
      <Modal
        isOpen={sendBackOpen}
        onClose={() => setSendBackOpen(false)}
        title={reasonKind === 'reopen' ? 'Reopen the work order' : reasonKind === 'prepared' ? 'Send back to Prepared' : 'Send the work order back'}
      >
        <p className="text-sm text-slate-600 mb-3">
          {reasonKind === 'send_back'
            ? 'It goes back to whoever prepared it, and approvals start again from level 1. Say what needs to change.'
            : reasonKind === 'reopen'
            ? 'The work order goes back to Checked so it can be changed. Why are you reopening it?'
            : 'The work order goes back to Prepared so it can be corrected. Why are you sending it back?'}
        </p>
        <textarea
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={sendBackReason}
          onChange={(e) => setSendBackReason(e.target.value)}
          placeholder="e.g. Quantity of part 2 is wrong"
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setSendBackOpen(false)}>Cancel</Button>
          <Button
            isLoading={busy}
            disabled={!sendBackReason.trim()}
            onClick={async () => {
              if (!wo) return;
              const reason = sendBackReason.trim();
              if (reasonKind === 'reopen') await runAction(() => marketingAPI.workOrderReopen(wo.id, reason), 'Reopened to Checked');
              else if (reasonKind === 'prepared') await runAction(() => marketingAPI.workOrderMarkPrepared(wo.id, reason), 'Sent back to Prepared');
              else await runAction(() => marketingAPI.workOrderSendBack(wo.id, reason), 'Sent back');
              setSendBackOpen(false);
            }}
          >
            {reasonKind === 'reopen' ? 'Reopen' : 'Send back'}
          </Button>
        </div>
      </Modal>

      {/* Sticky save bar */}
      {canManage && isEditing && (
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
