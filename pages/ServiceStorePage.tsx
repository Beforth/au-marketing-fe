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
import { Package, Paperclip } from 'lucide-react';
import {
  marketingAPI,
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

export const ServiceStorePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('service.view'));
  const canDispatch = useAppSelector(selectHasPermission('service.manage_dispatch'));

  const [rows, setRows] = useState<ServiceWorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState<Record<number, string>>({});
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

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
      description="Approved work orders that still need material — earliest required-by first."
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
                    onClick={() => navigate(`/service/visits/${wo.visit_id}/work-order`)}
                  >
                    {wo.wo_number || `WO #${wo.id}`}
                  </button>
                  <p className="text-xs text-slate-500">
                    {wo.customer_name}{wo.plant_name ? ` · ${wo.plant_name}` : ''}
                    {wo.visit_date ? ` · visit ${wo.visit_date}` : ''}
                  </p>
                </div>
                <Badge variant="outline">{wo.dispatch_summary}</Badge>
              </div>

              <div className="space-y-3">
                {(wo.materials || [])
                  .filter((m) => m.dispatch_status !== 'full')
                  .map((m) => (
                    <div key={m.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-800">
                            {m.item_name} {m.quantity ? <span className="text-slate-500">· {m.quantity}</span> : null}
                          </div>
                          {m.description && <div className="text-xs text-slate-500">{m.description}</div>}
                          <div className={`text-xs mt-1 ${dueClass(m.required_by_date)}`}>
                            Needed by: {m.required_by_date || '—'}
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
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
};
