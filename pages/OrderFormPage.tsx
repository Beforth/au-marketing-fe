/**
 * Order form: create order from lead (/new) or view/edit order and inquiry log (/:id).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { DatePicker } from '../components/ui/DatePicker';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectUser } from '../store/slices/authSlice';
import { marketingAPI, type Order, type OrderStatusOption, type OrderActivity, type OrderActivityAttachment, type Lead, type LeadActivity, type LeadActivityAttachment, type Series, leadDisplayName, leadDisplayCompany } from '../lib/marketing-api';
import { Select } from '../components/ui/Select';
import { ArrowLeft, History, Plus, Edit2, Trash2, Paperclip, Upload, Download, Calendar, FileText, Eye, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { Tooltip } from '../UI/Tooltip';

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
  const [leadFiles, setLeadFiles] = useState<{ att: LeadActivityAttachment; activity: LeadActivity }[]>([]);
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
  const [showAttachments, setShowAttachments] = useState(false);
  const [deleteActivityId, setDeleteActivityId] = useState<number | null>(null);
  const [showDeleteOrderConfirm, setShowDeleteOrderConfirm] = useState(false);
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_lead'));
  const user = useAppSelector(selectUser);

  // Inline edit of an existing log entry
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [editActivityForm, setEditActivityForm] = useState({ activity_type: 'note', title: '', description: '' });
  const [editActivitySubmitting, setEditActivitySubmitting] = useState(false);

  // Add attachments to an existing log entry
  const [addAttachmentActivityId, setAddAttachmentActivityId] = useState<number | null>(null);
  const [addAttachmentFile, setAddAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachmentsForActivityId, setUploadingAttachmentsForActivityId] = useState<number | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);

  const canEditOrDeleteActivity = (a: OrderActivity) =>
    user?.id != null && a.created_by_employee_id != null && user.id === a.created_by_employee_id;

  const ORDER_ACTIVITY_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'note', label: 'Note' },
    { value: 'call', label: 'Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'order_status_change', label: 'Status change' },
  ];
  const orderActivityTypeLabel = (type: string) => ORDER_ACTIVITY_TYPE_OPTIONS.find((o) => o.value === type)?.label || type;

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
      if (o.lead_id) {
        marketingAPI.getLeadActivities(o.lead_id)
          .then((leadActivities) => {
            const files: { att: LeadActivityAttachment; activity: LeadActivity }[] = [];
            for (const activity of leadActivities) {
              for (const att of (activity.attachments || [])) {
                files.push({ att, activity });
              }
            }
            setLeadFiles(files);
          })
          .catch(() => setLeadFiles([]));
      }
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

  const startEditActivity = (a: OrderActivity) => {
    setEditingActivityId(a.id);
    setEditActivityForm({ activity_type: a.activity_type, title: a.title, description: a.description || '' });
  };

  const handleSaveEditActivity = async () => {
    if (!orderId || editingActivityId == null || !editActivityForm.title.trim()) return;
    setEditActivitySubmitting(true);
    try {
      const updated = await marketingAPI.updateOrderActivity(orderId, editingActivityId, {
        activity_type: editActivityForm.activity_type,
        title: editActivityForm.title.trim(),
        description: editActivityForm.description.trim() || undefined,
      });
      setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditingActivityId(null);
      showToast('Inquiry updated', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update inquiry', 'error');
    } finally {
      setEditActivitySubmitting(false);
    }
  };

  const handleUploadAttachmentToActivity = async (activityId: number) => {
    if (!orderId || !addAttachmentFile) return;
    setUploadingAttachmentsForActivityId(activityId);
    try {
      await marketingAPI.uploadOrderActivityAttachments(orderId, activityId, [addAttachmentFile]);
      const acts = await marketingAPI.getOrderActivities(orderId);
      setActivities(acts);
      setAddAttachmentActivityId(null);
      setAddAttachmentFile(null);
      showToast('Attachment added', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Upload failed', 'error');
    } finally {
      setUploadingAttachmentsForActivityId(null);
    }
  };

  const handleDeleteAttachment = async (activityId: number, attachmentId: number) => {
    if (!orderId) return;
    setDeletingAttachmentId(attachmentId);
    try {
      await marketingAPI.deleteOrderActivityAttachment(orderId, activityId, attachmentId);
      setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, attachments: (a.attachments || []).filter((att) => att.id !== attachmentId) } : a)));
      showToast('Removed', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove', 'error');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handleViewLeadFile = async (activityId: number, attachmentId: number) => {
    if (!order?.lead_id) return;
    try {
      const url = await marketingAPI.getLeadActivityAttachmentUrl(order.lead_id, activityId, attachmentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      showToast(err?.message || 'File not found on server', 'error');
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
              {createLeadId !== '' && (() => {
                const selectedLead = wonLeads.find((l) => l.id === createLeadId);
                return selectedLead?.closed_at ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200">
                    <Calendar size={14} className="text-emerald-600 shrink-0" />
                    Won on {new Date(selectedLead.closed_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                ) : null;
              })()}
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
              <button type="button" className="text-blue-600 hover:underline" onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                {lead.series || `#${lead.id}`} – {leadDisplayName(lead)}
              </button>
            ) : '—'}
          </div>
          <div><span className="text-slate-500 block">Status</span>{order.status_option?.label ?? order.status ?? '—'}</div>
          <div><span className="text-slate-500 block">Value</span>{order.order_value != null ? `₹${Number(order.order_value).toLocaleString()}` : '—'}</div>
          <div><span className="text-slate-500 block">Won date</span>{lead?.closed_at ? new Date(lead.closed_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}</div>
          <div><span className="text-slate-500 block">Order created</span>{order.created_at ? new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}</div>
          <div><span className="text-slate-500 block">Expected delivery</span>{order.expected_delivery_at ? new Date(order.expected_delivery_at).toLocaleDateString() : '—'}</div>
          <div><span className="text-slate-500 block">Inquiry log</span>{activities.length} entries{activities.some((x) => (x.attachments?.length ?? 0) > 0) ? ` · ${activities.filter((x) => (x.attachments?.length ?? 0) > 0).length} with attachments` : ''}</div>
          <div className="md:col-span-2"><span className="text-slate-500 block">Notes</span>{order.notes || '—'}</div>
        </div>
        {leadFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-slate-500 block text-sm mb-2">Files from lead (incl. PO uploaded when marked Won)</span>
            <ul className="space-y-1.5">
              {leadFiles.map(({ att, activity }) => (
                <li key={att.id} className="flex items-center justify-between gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <FileText size={14} className="text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">{att.file_name}</div>
                      <div className="text-xs text-slate-400 truncate">{activity.title}</div>
                    </div>
                  </div>
                  {att.media_exists === false ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 border border-red-200 font-semibold text-xs">
                      <AlertTriangle size={12} /> Missing
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleViewLeadFile(activity.id, att.id)}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors"
                    >
                      <Eye size={12} /> Open
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
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

      <Card className="mb-6">
        <form onSubmit={handleAddActivity} className="mb-4">
          <div className="grid grid-cols-1 gap-3 max-w-2xl">
            {/* Row 1: Type | Title | Add log */}
            <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-end">
              <div className="w-32 [&_button]:!h-9 [&_button]:!min-h-0 [&_label]:!text-[10px] [&_label]:!font-semibold">
                <Select
                  label="Type"
                  value={activityForm.activity_type}
                  onChange={(val) => setActivityForm((f) => ({ ...f, activity_type: val as string }))}
                  options={ORDER_ACTIVITY_TYPE_OPTIONS}
                  searchable={false}
                  containerClassName="!space-y-1"
                />
              </div>
              <div className="min-w-0 !space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 tracking-tight block">Title</label>
                <Input
                  value={activityForm.title}
                  onChange={(e) => setActivityForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Called to discuss requirements"
                  required
                  className="h-9 text-xs"
                />
              </div>
              <Button type="submit" size="sm" disabled={activitySubmitting} className="h-9 shrink-0 px-4">
                {activitySubmitting ? 'Adding log...' : 'Add log'}
              </Button>
            </div>

            {/* Notes */}
            <div className="!space-y-1">
              <label className="block text-[10px] font-semibold text-slate-500 tracking-tight">Notes</label>
              <textarea
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                placeholder="e.g. timeline, budget, next steps"
                value={activityForm.description}
                onChange={(e) => setActivityForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Status change: From -> To */}
            {activityForm.activity_type === 'order_status_change' && (
              <div className="grid grid-cols-[auto_auto_auto] gap-3 items-end">
                <div className="w-40 [&_button]:!h-9">
                  <Select
                    label="From"
                    value={activityForm.from_status_id != null ? String(activityForm.from_status_id) : ''}
                    onChange={(val) => setActivityForm((f) => ({ ...f, from_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                    options={[{ value: '', label: '—' }, ...statuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                    searchable={false}
                  />
                </div>
                <span className="text-slate-400 text-sm pb-2">→</span>
                <div className="w-40 [&_button]:!h-9">
                  <Select
                    label="To"
                    value={activityForm.to_status_id != null ? String(activityForm.to_status_id) : ''}
                    onChange={(val) => setActivityForm((f) => ({ ...f, to_status_id: val != null ? parseInt(String(val), 10) : undefined }))}
                    options={[{ value: '', label: '—' }, ...statuses.map((s) => ({ value: String(s.id), label: s.label }))]}
                    searchable={false}
                  />
                </div>
              </div>
            )}

            {/* Attach files toggle */}
            <div className="mt-1">
              <button
                type="button"
                onClick={() => setShowAttachments((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-dashed border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"
              >
                <Paperclip size={12} />
                {showAttachments ? 'Hide files' : 'Attach files'}
              </button>
              {showAttachments && (
                <div className="mt-2 p-2 rounded-lg border border-slate-200 bg-white shadow-sm space-y-2">
                  {activityAttachmentEntries.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-center gap-2">
                      <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0">
                        <Upload size={14} className="text-slate-400" />
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
              )}
            </div>
          </div>
        </form>

        <h3 className="text-base font-bold text-slate-800 mb-2 border-t border-slate-200 pt-4 mt-2 tracking-tight">Enquiry log</h3>
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
              const isEditing = editingActivityId === a.id;
              const canEditDelete = canEditOrDeleteActivity(a);
              return (
                <li key={a.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Select
                          label="Type"
                          value={editActivityForm.activity_type}
                          onChange={(val) => setEditActivityForm((f) => ({ ...f, activity_type: val as string }))}
                          options={ORDER_ACTIVITY_TYPE_OPTIONS}
                        />
                        <Input
                          label="Title"
                          value={editActivityForm.title}
                          onChange={(e) => setEditActivityForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="Title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                        <textarea
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          value={editActivityForm.description}
                          onChange={(e) => setEditActivityForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Description"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEditActivity} disabled={editActivitySubmitting || !editActivityForm.title.trim()}>
                          {editActivitySubmitting ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingActivityId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 flex-wrap">
                          {a.inquiry_number != null && (
                            <>
                              <span className="font-semibold text-slate-600">Inquiry #{a.inquiry_number}</span>
                              <span>·</span>
                            </>
                          )}
                          <span className="font-medium">{orderActivityTypeLabel(a.activity_type)}</span>
                          <span>·</span>
                          {tooltip ? (
                            <Tooltip content={tooltip}>
                              <span className="cursor-help border-b border-dotted border-slate-400">
                                {displayName}
                              </span>
                            </Tooltip>
                          ) : (
                            <span>{displayName}</span>
                          )}
                          <span>·</span>
                          <span>{new Date(a.activity_date).toLocaleString()}</span>
                        </div>
                        {canEditDelete && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Tooltip content="Edit enquiry">
                              <button
                                type="button"
                                onClick={() => startEditActivity(a)}
                                className="p-1.5 rounded text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip content="Delete enquiry">
                              <button
                                type="button"
                                onClick={() => setDeleteActivityId(a.id)}
                                className="p-1.5 rounded text-slate-500 hover:bg-rose-100 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                      <div className="font-medium text-slate-900 text-sm">{a.title}</div>
                      {(a.from_status_name || a.to_status_name) && (
                        <div className="text-xs text-slate-600 mt-1">
                          Status: {a.from_status_name || '—'} → {a.to_status_name || '—'}
                        </div>
                      )}
                      {a.description && <div className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{a.description}</div>}
                      {attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Paperclip size={12} /> Attachments
                          </span>
                          <ul className="mt-1 space-y-1">
                            {attachments.map((att) => (
                              <li key={att.id} className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => orderId && marketingAPI.downloadOrderActivityAttachment(orderId, a.id, att.id, att.file_name)}
                                  className="text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Download size={12} /> {att.title || att.file_name}
                                </button>
                                {canEditDelete && (
                                  <button
                                    type="button"
                                    disabled={deletingAttachmentId === att.id}
                                    onClick={() => handleDeleteAttachment(a.id, att.id)}
                                    className="text-rose-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {canEditDelete && (
                        <div className="mt-2">
                          {addAttachmentActivityId !== a.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAddAttachmentActivityId(a.id);
                                setAddAttachmentFile(null);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 border border-dashed border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"
                            >
                              <Plus size={12} /> Add attachments
                            </button>
                          ) : (
                            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-xs font-semibold text-slate-700">Add attachments</span>
                                <button
                                  type="button"
                                  onClick={() => { setAddAttachmentActivityId(null); setAddAttachmentFile(null); }}
                                  className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 text-xs text-slate-700 hover:bg-slate-100 shrink-0">
                                  <Upload size={12} />
                                  <span className="truncate max-w-[140px]">{addAttachmentFile ? addAttachmentFile.name : 'Choose file'}</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0] ?? null;
                                      setAddAttachmentFile(f);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                                <Button
                                  size="sm"
                                  disabled={uploadingAttachmentsForActivityId === a.id || !addAttachmentFile}
                                  onClick={() => handleUploadAttachmentToActivity(a.id)}
                                >
                                  {uploadingAttachmentsForActivityId === a.id ? 'Uploading…' : 'Upload'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
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
          <CurrencyInput
            allowDecimal
            label="Order value"
            value={editForm.order_value != null ? String(editForm.order_value) : ''}
            onChange={(raw) => setEditForm((f) => ({ ...f, order_value: raw === '' ? undefined : Number(raw) }))}
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
