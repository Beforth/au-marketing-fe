/**
 * Service module — Stage 3: the store's material worklist (Steps 4 & 5).
 * Sidebar "Store / Dispatch". Route: /service/store
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { Package, Paperclip, Truck, X } from 'lucide-react';
import {
  marketingAPI,
  workOrderPath,
  ServiceWorkOrder,
  ServiceDispatchStatus,
  WorkOrderMaterial,
} from '../lib/marketing-api';

const DISPATCH_OPTIONS = [
  { value: 'not_dispatched', label: 'Not sent yet' },
  { value: 'partial', label: 'Partly sent' },
  { value: 'full', label: 'Fully sent' },
];

const dueClass = (d?: string | null) => {
  if (!d) return 'text-slate-500';
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'text-rose-600 font-semibold';
  if (days <= 1) return 'text-amber-600 font-semibold';
  return 'text-slate-600';
};

const daysFromToday = (d?: string | null): number | null => {
  if (!d) return null;
  const t = new Date(d + 'T00:00:00').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / 86400000);
};

/** "Due in 2 days" / "Due today" / "Overdue by 1 day" tag for a part's needed-by date */
const dueTag = (d?: string | null): { text: string; className: string } | null => {
  const n = daysFromToday(d);
  if (n === null) return null;
  if (n < 0) return { text: `Overdue by ${-n} day${n === -1 ? '' : 's'}`, className: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (n === 0) return { text: 'Due today', className: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (n <= 2) return { text: `Due in ${n} day${n === 1 ? '' : 's'}`, className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { text: `Due in ${n} days`, className: 'bg-slate-50 text-slate-600 border-slate-200' };
};

/** Countdown to the visit; the store is reminded at 30 / 15 / 7 days before, so colour the same steps */
const visitTag = (d?: string | null): { text: string; className: string } | null => {
  const n = daysFromToday(d);
  if (n === null || n < 0) return null;
  const text = n === 0 ? 'Visit today' : n === 1 ? 'Visit tomorrow' : `Visit in ${n} days`;
  if (n <= 7) return { text, className: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (n <= 15) return { text, className: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (n <= 30) return { text, className: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { text, className: 'bg-slate-50 text-slate-600 border-slate-200' };
};

export const ServiceStorePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));
  const canDispatch = useAppSelector(selectHasPermission('service.manage_dispatch'));

  const [rows, setRows] = useState<ServiceWorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState<Record<number, string>>({});
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  // "Record shipment" form (a part can be sent several times)
  const emptyShip = { sent_on: new Date().toISOString().slice(0, 10), quantity_sent: '', docket_no: '', transporter: '', note: '', completes_part: false };
  const [shipFor, setShipFor] = useState<number | null>(null);
  const [ship, setShip] = useState(emptyShip);
  const [savingShip, setSavingShip] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setRows(await marketingAPI.getStoreMaterialQueue());
    } catch (e: any) {
      showToast(e?.message || 'Failed to load the store queue', 'error');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    load();
  }, [canView, load]);

  const setDispatch = async (m: WorkOrderMaterial, statusVal: ServiceDispatchStatus) => {
    if (!m.id) return;
    try {
      await marketingAPI.setMaterialDispatch(m.id, statusVal, noteDraft[m.id] ?? m.dispatched_note ?? undefined);
      showToast('Dispatch status updated', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to update dispatch', 'error');
    }
  };

  const recordShipment = async (m: WorkOrderMaterial) => {
    if (!m.id) return;
    setSavingShip(true);
    try {
      await marketingAPI.addMaterialDispatch(m.id, {
        sent_on: ship.sent_on || null,
        quantity_sent: ship.quantity_sent.trim() || null,
        docket_no: ship.docket_no.trim() || null,
        transporter: ship.transporter.trim() || null,
        note: ship.note.trim() || null,
        completes_part: ship.completes_part,
      });
      showToast('Shipment recorded', 'success');
      setShipFor(null);
      setShip(emptyShip);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to record shipment', 'error');
    } finally {
      setSavingShip(false);
    }
  };

  const removeShipment = async (m: WorkOrderMaterial, dispatchId: number) => {
    if (!m.id || !window.confirm('Remove this shipment record?')) return;
    try {
      await marketingAPI.deleteMaterialDispatch(m.id, dispatchId);
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to remove', 'error');
    }
  };

  const uploadProof = async (m: WorkOrderMaterial, files: FileList | null) => {
    if (!m.id || !files || files.length === 0) return;
    try {
      await marketingAPI.uploadMaterialProof(m.id, Array.from(files));
      showToast('Proof attached', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to upload proof', 'error');
    }
  };

  const breadcrumbs = [{ label: 'Service', href: '/service/contracts' }, { label: 'Store / Dispatch' }];

  if (!canView) {
    return (
      <PageLayout title="Store / Dispatch" breadcrumbs={breadcrumbs}>
        <Card><p className="text-slate-600">You do not have permission to view this.</p></Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Store / Dispatch"
      description="Approved work orders that still need material — earliest needed-by first. You are reminded 30, 15 and 7 days before each visit."
      breadcrumbs={breadcrumbs}
    >
      {isLoading ? (
        <Card><div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></Card>
      ) : rows.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold">Nothing to dispatch</p>
            <p className="text-slate-500 text-sm mt-2">Approved work orders with pending material show up here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((wo) => (
            <Card key={wo.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <button
                    className="font-semibold text-slate-900 hover:text-blue-700"
                    onClick={() => navigate(workOrderPath(wo))}
                  >
                    {wo.wo_number || `WO #${wo.id}`}
                  </button>
                  <p className="text-xs text-slate-500">
                    {wo.customer_name}{wo.plant_name ? ` · ${wo.plant_name}` : ''}
                    {wo.visit_date ? ` · visit ${wo.visit_date}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const t = visitTag(wo.visit_date);
                    return t ? <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${t.className}`}>{t.text}</span> : null;
                  })()}
                  <Badge variant="outline">{wo.dispatch_summary}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {(wo.materials || [])
                  .filter((m) => m.dispatch_status !== 'full')
                  // contract-level work order: group the parts by the visit they are for, soonest visit first
                  .sort((a, b) => (a.visit_date || '9999-12-31').localeCompare(b.visit_date || '9999-12-31') || (a.visit_id ?? 0) - (b.visit_id ?? 0))
                  .map((m, i, arr) => (
                    <React.Fragment key={m.id}>
                    {!wo.visit_id && (i === 0 || arr[i - 1].visit_id !== m.visit_id) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-sm font-semibold text-slate-800">
                          {m.visit_id ? `${m.visit_title || 'Visit'}${m.visit_date ? ` · ${m.visit_date}` : ''}` : 'Whole year / not tied to a visit'}
                        </span>
                        {(() => {
                          const t = m.visit_id ? visitTag(m.visit_date) : null;
                          return t ? <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${t.className}`}>{t.text}</span> : null;
                        })()}
                      </div>
                    )}
                    <div className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-800">
                            {m.item_name}{m.customer_item_name ? <span className="text-slate-500"> ({m.customer_item_name})</span> : null} {m.quantity ? <span className="text-slate-500">· {m.quantity}{m.unit && m.unit !== 'other' ? ` ${m.unit}` : ''}</span> : null}
                          </div>
                          {m.description && <div className="text-xs text-slate-500">{m.description}</div>}
                          <div className={`text-xs mt-1 flex flex-wrap items-center gap-2 ${dueClass(m.required_by_date)}`}>
                            <span>Needed at site by: {m.required_by_date || '—'}</span>
                            {(() => {
                              const t = dueTag(m.required_by_date);
                              return t ? <span className={`inline-flex items-center rounded border px-1.5 py-px text-[11px] font-semibold ${t.className}`}>{t.text}</span> : null;
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-44">
                            <Select
                              options={DISPATCH_OPTIONS}
                              value={m.dispatch_status || 'not_dispatched'}
                              onChange={(v) => canDispatch && setDispatch(m, (v as ServiceDispatchStatus) || 'not_dispatched')}
                              searchable={false}
                              clearable={false}
                              disabled={!canDispatch}
                            />
                          </div>
                          {canDispatch && (
                            <>
                              <input
                                ref={(el) => {
                                  fileInputs.current[m.id!] = el;
                                }}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => uploadProof(m, e.target.files)}
                              />
                              <Button
                                size="xs"
                                variant="ghost"
                                className="h-9"
                                leftIcon={<Paperclip size={14} />}
                                onClick={() => fileInputs.current[m.id!]?.click()}
                              >
                                Proof
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {canDispatch && (
                        <input
                          className="w-full mt-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                          placeholder="What was actually sent (optional note)"
                          value={noteDraft[m.id!] ?? m.dispatched_note ?? ''}
                          onChange={(e) => setNoteDraft((p) => ({ ...p, [m.id!]: e.target.value }))}
                        />
                      )}
                      {/* Shipments so far — a part can be sent several times */}
                      {(m.dispatches?.length ?? 0) > 0 && (
                        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sent so far</p>
                          {m.dispatches!.map((d) => (
                            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                              <span>
                                <span className="font-medium text-slate-800">{d.sent_on}</span>
                                {d.quantity_sent ? ` · ${d.quantity_sent}` : ''}
                                {d.docket_no ? ` · Docket ${d.docket_no}` : ''}
                                {d.transporter ? ` (${d.transporter})` : ''}
                                {d.note ? ` — ${d.note}` : ''}
                              </span>
                              {canDispatch && (
                                <button type="button" className="text-slate-400 hover:text-rose-600" title="Remove this record" onClick={() => removeShipment(m, d.id)}>
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {canDispatch && shipFor !== m.id && (
                        <Button size="xs" variant="outline" className="mt-2" leftIcon={<Truck size={14} />}
                          onClick={() => { setShip(emptyShip); setShipFor(m.id!); }}>
                          Record a shipment
                        </Button>
                      )}
                      {canDispatch && shipFor === m.id && (
                        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="text-xs text-slate-600">Sent on
                              <input type="date" className="mt-0.5 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white" value={ship.sent_on} onChange={(e) => setShip((p) => ({ ...p, sent_on: e.target.value }))} />
                            </label>
                            <label className="text-xs text-slate-600">Quantity sent
                              <input className="mt-0.5 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white" placeholder="e.g. 2 nos" value={ship.quantity_sent} onChange={(e) => setShip((p) => ({ ...p, quantity_sent: e.target.value }))} />
                            </label>
                            <label className="text-xs text-slate-600">Docket / consignment no.
                              <input className="mt-0.5 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white" value={ship.docket_no} onChange={(e) => setShip((p) => ({ ...p, docket_no: e.target.value }))} />
                            </label>
                            <label className="text-xs text-slate-600">Courier / transporter
                              <input className="mt-0.5 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white" value={ship.transporter} onChange={(e) => setShip((p) => ({ ...p, transporter: e.target.value }))} />
                            </label>
                          </div>
                          <input className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white" placeholder="Note (optional)" value={ship.note} onChange={(e) => setShip((p) => ({ ...p, note: e.target.value }))} />
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={ship.completes_part} onChange={(e) => setShip((p) => ({ ...p, completes_part: e.target.checked }))} />
                            This shipment completes the part (mark as Fully sent)
                          </label>
                          <div className="flex gap-2">
                            <Button size="xs" onClick={() => recordShipment(m)} isLoading={savingShip}>Save shipment</Button>
                            <Button size="xs" variant="ghost" onClick={() => setShipFor(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                      {(m.attachments?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {m.attachments!.map((a) => (
                            <button
                              key={a.id}
                              className="text-xs text-blue-600 underline"
                              onClick={() => marketingAPI.downloadMaterialProof(m.id!, a.id, a.file_name)}
                            >
                              {a.file_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    </React.Fragment>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
};
