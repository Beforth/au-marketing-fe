/**
 * Order form: create order from lead (/new) or view/edit order and inquiry log (/:id).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DatePicker } from '../components/ui/DatePicker';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { marketingAPI, type Order, type OrderStatusOption, type OrderActivity, type Lead, type Series, leadDisplayName, leadDisplayCompany } from '../lib/marketing-api';
import { Select } from '../components/ui/Select';
import { ArrowLeft, History, Plus, Edit2, Trash2, Paperclip, Upload, Download } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';

export const OrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { showToast } = useApp();
  // Route "orders/new" has no :id param, so use pathname to detect new page
  const isNew = location.pathname.endsWith('/new') || id === 'new';
  const orderId = isNew ? null : (id ? parseInt(id, 10) || null : null);
  const leadIdFromUrl = isNew ? (searchParams.get('lead_id') ? parseInt(searchParams.get('lead_id')!, 10) : null) : null;

  const [order, setOrder] = useState<Order | null>(null);
  const [activities, setActivities] = useState<OrderActivity[]>([]);
  const [statuses, setStatuses] = useState<OrderStatusOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wonLeads, setWonLeads] = useState<Lead[]>([]);
  const [createLeadId, setCreateLeadId] = useState<number | ''>('');
  const [createSeriesCode, setCreateSeriesCode] = useState('');
  const [createSeriesList, setCreateSeriesList] = useState<Series[]>([]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activity_type: 'note',
    title: '',
    description: '',
    from_status_id: undefined as number | undefined,
    to_status_id: undefined as number | undefined,
  });
  const [activityAttachmentEntries, setActivityAttachmentEntries] = useState<{ id: string; file: File | null; title: string }[]>(() => [{ id: crypto.randomUUID(), file: null, title: '' }]);
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);
  const [showDeleteOrderConfirm, setShowDeleteOrderConfirm] = useState(false);
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_lead'));

  const loadOrder = useCallback(async () => {
    if (!orderId || orderId < 1) {
      setLoading(false);
      navigate('/orders');
      return;
    }
    setLoading(true);
    try {
      const o = await marketingAPI.getOrder(orderId);
      setOrder(o);
      setEditForm({
        status_id: o.status_id ?? undefined,
        order_value: o.order_value ?? undefined,
        expected_delivery_at: o.expected_delivery_at ?? undefined,
        notes: o.notes ?? undefined,
      });
      const acts = await marketingAPI.getOrderActivities(orderId);
      setActivities(acts);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load order', 'error');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate, showToast]);

  useEffect(() => {
    if (leadIdFromUrl != null && leadIdFromUrl > 0) {
      setCreateLeadId(leadIdFromUrl);
    }
  }, [leadIdFromUrl]);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      marketingAPI.getSeries({ page: 1, page_size: 100, is_active: true }).then((r) => setCreateSeriesList(r.items ?? [])).catch(() => setCreateSeriesList([]));
      marketingAPI.getOrderStatuses({ is_active: true }).then(setStatuses).catch(() => setStatuses([]));
      marketingAPI.getLeadStatuses({ is_active: true }).then((leadStatuses) => {
        const wonId = leadStatuses.find((s) => s.is_final && !s.is_lost)?.id;
        const loadWon = (items: Lead[]) => {
          if (leadIdFromUrl != null && leadIdFromUrl > 0 && !items.some((l) => l.id === leadIdFromUrl)) {
            marketingAPI.getLead(leadIdFromUrl)
              .then((lead) => setWonLeads([lead, ...items]))
              .catch(() => setWonLeads(items));
          } else {
            setWonLeads(items);
          }
        };
        if (wonId) {
          marketingAPI.getLeads({ status_id: wonId, page_size: 100, include_won_lost: true }).then((r) => loadWon(r.items ?? [])).catch(() => setWonLeads([]));
        } else {
          marketingAPI.getLeads({ page_size: 50 }).then((r) => loadWon(r.items ?? [])).catch(() => setWonLeads([]));
        }
      }).catch(() => setWonLeads([]));
    } else {
      loadOrder();
      marketingAPI.getOrderStatuses({ is_active: true }).then(setStatuses).catch(() => setStatuses([]));
    }
  }, [isNew, loadOrder, location.pathname, leadIdFromUrl]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createLeadId === '') {
      showToast('Select a lead', 'error');
      return;
    }
    const lead = wonLeads.find((l) => l.id === createLeadId);
    if (!lead || !lead.domain_id) {
      showToast('Invalid lead or missing domain', 'error');
      return;
    }
    setCreateSubmitting(true);
    try {
      const created = await marketingAPI.createOrder({
        lead_id: createLeadId as number,
        domain_id: lead.domain_id,
        region_id: lead.region_id ?? undefined,
        order_value: lead.closed_value ?? undefined,
        series_code: createSeriesCode.trim() || undefined,
      });
      showToast('Order created', 'success');
      navigate(`/orders/${created.id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create order', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!orderId || !order) return;
    setSaving(true);
    try {
      const updated = await marketingAPI.updateOrder(orderId, {
        status_id: editForm.status_id,
        order_value: editForm.order_value,
        expected_delivery_at: editForm.expected_delivery_at,
        notes: editForm.notes,
      });
      setOrder(updated);
      setShowEditModal(false);
      showToast('Order updated', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !activityForm.title.trim()) return;
    const toUpload = activityAttachmentEntries.filter((a) => a.file);
    setActivitySubmitting(true);
    try {
      const created = await marketingAPI.createOrderActivity(orderId, {
        activity_type: activityForm.activity_type,
        title: activityForm.title.trim(),
        description: activityForm.description.trim() || undefined,
        from_status_id: activityForm.from_status_id,
        to_status_id: activityForm.to_status_id,
      });
      if (toUpload.length > 0) {
        await marketingAPI.uploadOrderActivityAttachments(orderId, created.id, toUpload.map((a) => a.file!));
      }
      const acts = await marketingAPI.getOrderActivities(orderId);
      setActivities(acts);
      setActivityForm({ activity_type: 'note', title: '', description: '', from_status_id: undefined, to_status_id: undefined });
      setActivityAttachmentEntries([{ id: crypto.randomUUID(), file: null, title: '' }]);
      showToast('Inquiry added' + (toUpload.length > 0 ? ' with attachments' : ''), 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add inquiry', 'error');
    } finally {
      setActivitySubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!orderId) return;
    try {
      await marketingAPI.deleteOrderActivity(orderId, activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setDeleteActivityId(null);
      showToast('Inquiry removed', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete', 'error');
    }
  };

  if (isNew) {
    const breadcrumbs = [{ label: 'Orders', href: '/orders' }, { label: 'New Order', href: '/orders/new' }];
    return (
      <PageLayout title="New Order" description="Create an order from a won lead." breadcrumbs={breadcrumbs}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} leftIcon={<ArrowLeft size={14} />} className="mb-4">
          Back to Orders
        </Button>
        <Card>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead (won)</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={createLeadId}
                onChange={(e) => setCreateLeadId(e.target.value === '' ? '' : Number(e.target.value))}
                required
              >
                <option value="">Select a lead...</option>
                {wonLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.series || `#${l.id}`} – {leadDisplayName(l)}{leadDisplayCompany(l) ? ` (${leadDisplayCompany(l)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Select
              label="Number series for order number"
              options={[
                { value: '', label: 'Use default (from settings)' },
                ...createSeriesList
                  .filter((s) => (s.entity_type ?? '').toLowerCase() === 'order' || s.code === 'order_number' || !s.entity_type)
                  .map((s) => ({ value: s.code, label: `${s.name} (${s.code})` })),
              ]}
              value={createSeriesCode}
              onChange={(val) => setCreateSeriesCode((val != null && val !== '') ? String(val) : '')}
              placeholder="Use default"
            />
            <p className="text-xs text-slate-500 -mt-2">Choose which number series to use for this order. The order number is assigned on save and cannot be changed later.</p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={createSubmitting}>Create Order</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate('/orders')}>Cancel</Button>
            </div>
          </form>
        </Card>
      </PageLayout>
    );
  }

  if (loading || !order) {
    return (
      <PageLayout title="Order" breadcrumbs={[{ label: 'Orders', href: '/orders' }]}>
        <div className="py-12 text-center text-slate-500">Loading...</div>
      </PageLayout>
    );
  }

  const lead = order.lead;
  const breadcrumbs = [
    { label: 'Orders', href: '/orders' },
    { label: order.series || `Order #${order.id}`, href: `/orders/${order.id}` },
  ];

  return (
    <PageLayout title={order.series || `Order #${order.id}`} description="Order detail and inquiry log." breadcrumbs={breadcrumbs}>
      <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} leftIcon={<ArrowLeft size={14} />} className="mb-4">
        Back to Orders
      </Button>

      <Card title="Order" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><span className="text-slate-500 block">Order No.</span><span className="font-medium tabular-nums">{order.series || `#${order.id}`}</span></div>
          <div>
            <span className="text-slate-500 block">From Lead</span>
            {lead ? (
              <button type="button" className="text-indigo-600 hover:underline" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                {lead.series || `#${lead.id}`} – {leadDisplayName(lead)}
              </button>
            ) : '—'}
          </div>
          <div><span className="text-slate-500 block">Status</span>{order.status_option?.label ?? order.status ?? '—'}</div>
          <div><span className="text-slate-500 block">Value</span>{order.order_value != null ? `₹${Number(order.order_value).toLocaleString()}` : '—'}</div>
          <div><span className="text-slate-500 block">Expected delivery</span>{order.expected_delivery_at ? new Date(order.expected_delivery_at).toLocaleDateString() : '—'}</div>
          <div><span className="text-slate-500 block">Inquiry log</span>{activities.length} entries{activities.some((x) => (x.attachments?.length ?? 0) > 0) ? ` · ${activities.filter((x) => (x.attachments?.length ?? 0) > 0).length} with attachments` : ''}</div>
          <div className="md:col-span-2"><span className="text-slate-500 block">Notes</span>{order.notes || '—'}</div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" leftIcon={<Edit2 size={14} />} onClick={() => setShowEditModal(true)}>
            Edit order
          </Button>
          {canDelete && (
            <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50" leftIcon={<Trash2 size={14} />} onClick={() => setShowDeleteOrderConfirm(true)}>
              Delete order
            </Button>
          )}
        </div>
      </Card>

      <Card title="Inquiry log" className="mb-6">
        <form onSubmit={handleAddActivity} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <Input
              label="Title"
              placeholder="e.g. Customer call"
              value={activityForm.title}
              onChange={(e) => setActivityForm((f) => ({ ...f, title: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                value={activityForm.activity_type}
                onChange={(e) => setActivityForm((f) => ({ ...f, activity_type: e.target.value }))}
              >
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="order_status_change">Status change</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Description"
                placeholder="Details (optional)"
                value={activityForm.description || ''}
                onChange={(e) => setActivityForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
              <Paperclip size={12} /> Attachments (optional)
            </p>
            <div className="space-y-2">
              {activityAttachmentEntries.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0">
                    <Upload size={14} />
                    <span className="truncate max-w-[140px]">{row.file ? row.file.name : 'Choose file'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setActivityAttachmentEntries((prev) => prev.map((r) => (r.id === row.id ? { ...r, file: f ?? null } : r)));
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Title (optional)"
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm w-32"
                    value={row.title}
                    onChange={(e) => setActivityAttachmentEntries((prev) => prev.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r)))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-rose-600"
                    onClick={() => setActivityAttachmentEntries((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== row.id) : prev))}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setActivityAttachmentEntries((prev) => [...prev, { id: crypto.randomUUID(), file: null, title: '' }])}
              >
                Add another file
              </Button>
            </div>
          </div>
          <Button type="submit" size="sm" isLoading={activitySubmitting} leftIcon={<Plus size={14} />}>
            Add to log
          </Button>
        </form>
        <ul className="space-y-3">
          {activities.length === 0 ? (
            <li className="text-slate-500 text-sm py-2">No inquiry log entries yet.</li>
          ) : (
            activities.map((a) => {
              const displayName = a.created_by_name || a.created_by_username || '—';
              const tooltipParts = [
                a.created_by_name && `Name: ${a.created_by_name}`,
                a.created_by_username && `Username: ${a.created_by_username}`,
                a.created_by_email && `Email: ${a.created_by_email}`,
              ].filter(Boolean);
              const tooltip = tooltipParts.length > 0 ? tooltipParts.join('\n') : undefined;
              const attachments = a.attachments ?? [];
              return (
                <li key={a.id} className="border border-slate-200 rounded-lg p-4 text-sm bg-white shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900">{a.title}</span>
                      <span className="text-slate-500 ml-2">#{a.inquiry_number ?? a.id}</span>
                      {a.from_status_name || a.to_status_name ? (
                        <span className="text-slate-500 ml-2">
                          {a.from_status_name && a.to_status_name ? `${a.from_status_name} → ${a.to_status_name}` : a.from_status_name || a.to_status_name}
                        </span>
                      ) : null}
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setDeleteActivityId(a.id)} title="Remove">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  {a.description && <p className="text-slate-600 mt-2">{a.description}</p>}
                  {attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                        <Paperclip size={12} /> Attachments
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {attachments.map((att) => (
                          <li key={att.id}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800"
                              onClick={() => orderId && marketingAPI.downloadOrderActivityAttachment(orderId, a.id, att.id, att.file_name)}
                            >
                              <Download size={12} />
                              {att.title || att.file_name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-slate-400 text-xs mt-2">
                    {new Date(a.activity_date).toLocaleString()}
                    {' · '}
                    <span className="cursor-help border-b border-dotted border-slate-400" title={tooltip}>
                      {displayName}
                    </span>
                  </p>
                </li>
              );
            })
          )}
        </ul>
      </Card>

      <ConfirmModal
        isOpen={deleteActivityId !== null}
        onClose={() => setDeleteActivityId(null)}
        onConfirm={() => { if (deleteActivityId != null) void handleDeleteActivity(deleteActivityId); }}
        title="Delete inquiry?"
        message="This action cannot be undone."
      />

      {canDelete && (
        <ConfirmModal
          isOpen={showDeleteOrderConfirm}
          onClose={() => setShowDeleteOrderConfirm(false)}
          onConfirm={async () => {
            if (!orderId) return;
            try {
              await marketingAPI.deleteOrder(orderId);
              showToast('Order deleted', 'success');
              navigate('/orders');
            } catch (e: any) {
              showToast(e?.message || 'Failed to delete order', 'error');
            } finally {
              setShowDeleteOrderConfirm(false);
            }
          }}
          title="Delete order?"
          message="This order will be permanently removed. This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
        />
      )}

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit order">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={editForm.status_id ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, status_id: e.target.value === '' ? undefined : Number(e.target.value) }))}
            >
              <option value="">—</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <Input
            label="Order value"
            type="number"
            value={editForm.order_value ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, order_value: e.target.value === '' ? undefined : Number(e.target.value) }))}
          />
          <DatePicker
            label="Expected delivery (date)"
            value={editForm.expected_delivery_at ? new Date(editForm.expected_delivery_at).toISOString().slice(0, 10) : ''}
            onChange={(v) => setEditForm((f) => ({ ...f, expected_delivery_at: v ? new Date(v).toISOString() : undefined }))}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              value={editForm.notes ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit} isLoading={saving}>Save</Button>
            <Button variant="outline" size="sm" onClick={() => setShowEditModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
};
