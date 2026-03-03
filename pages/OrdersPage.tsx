/**
 * Orders list – orders created from won leads. Kanban (default) and Table view, same as Leads.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable, Column } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Search, Plus, MoreHorizontal, Settings2, LayoutGrid, List, Trash2, ChevronRight, ChevronLeft, FileText } from 'lucide-react';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { PageLayout } from '../components/layout/PageLayout';
import { marketingAPI, type Order, type OrderStatusOption, type OrderStatusGroup, type Lead, leadDisplayName, leadDisplayCompany } from '../lib/marketing-api';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../lib/marketing-api';

type ViewMode = 'kanban' | 'table';
type OrdersTab = 'won' | 'lost';

function getContrastColor(hex: string): string {
  const h = hex.replace(/^#/, '');
  if (h.length !== 6) return '#111';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? '#fff' : '#111';
}

const DEFAULT_STATUS_COLOR = { bg: 'bg-slate-100/50', text: 'text-slate-700' };
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100/50', text: 'text-blue-700' },
  confirmed: { bg: 'bg-emerald-100/50', text: 'text-emerald-700' },
  in_production: { bg: 'bg-amber-100/50', text: 'text-amber-700' },
  shipped: { bg: 'bg-indigo-100/50', text: 'text-indigo-700' },
  delivered: { bg: 'bg-green-100/50', text: 'text-green-700' },
  cancelled: { bg: 'bg-rose-100/50', text: 'text-rose-700' },
};

export const OrdersPage: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const ordersTab: OrdersTab = tabParam === 'lost' ? 'lost' : 'won';
  const setOrdersTab = (tab: OrdersTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'won') next.delete('tab');
      else next.set('tab', tab);
      return next;
    });
  };
  const viewParam = searchParams.get('view');
  const viewMode: ViewMode = viewParam === 'table' || viewParam === 'kanban' ? viewParam : 'kanban';
  const setViewMode = (mode: ViewMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', mode);
      return next;
    });
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [lostLeads, setLostLeads] = useState<Lead[]>([]);
  const [lostLeadsTotal, setLostLeadsTotal] = useState(0);
  const [lostLeadsPage, setLostLeadsPage] = useState(1);
  const [lostLeadsLoading, setLostLeadsLoading] = useState(false);
  const [statuses, setStatuses] = useState<OrderStatusOption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderStatusModal, setShowOrderStatusModal] = useState(false);
  const [orderStatusGroups, setOrderStatusGroups] = useState<OrderStatusGroup[]>([]);
  const [orderStatusesFull, setOrderStatusesFull] = useState<OrderStatusOption[]>([]);
  const [editingGroup, setEditingGroup] = useState<OrderStatusGroup | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ code: '', label: '', expected_duration_days: undefined as number | undefined, display_order: 0, is_active: true, hex_color: '' as string });
  const [savingGroup, setSavingGroup] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<OrderStatusOption | null>(null);
  const [statusForm, setStatusForm] = useState({ code: '', label: '', display_order: 0, group_id: undefined as number | undefined, is_active: true, is_final: false, hex_color: '' });
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleteStatusId, setDeleteStatusId] = useState<number | null>(null);
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_lead'));
  const canDelete = useAppSelector(selectHasPermission('marketing.delete_lead'));
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<number | null | 'none'>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [lostStatusChangePending, setLostStatusChangePending] = useState<{ orderId: number; currentStatusId: number | null; newStatusId: number | null } | null>(null);
  const [lostStatusReason, setLostStatusReason] = useState('');
  const [lostStatusSubmitting, setLostStatusSubmitting] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const didDragRef = React.useRef(false);

  const toggleGroupCollapsed = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const isKanban = viewMode === 'kanban';
      const res = await marketingAPI.getOrders({
        page: isKanban ? 1 : page,
        page_size: isKanban ? 100 : pageSize,
        status_id: isKanban ? undefined : (statusFilter === '' ? undefined : statusFilter),
      });
      setOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load orders', 'error');
      setOrders([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [viewMode, page, pageSize, statusFilter, showToast]);

  const loadLostLeads = useCallback(async () => {
    setLostLeadsLoading(true);
    try {
      const res = await marketingAPI.getLeads({
        page: lostLeadsPage,
        page_size: DEFAULT_PAGE_SIZE,
        lost_only: true,
      });
      setLostLeads(res.items);
      setLostLeadsTotal(res.total);
    } catch (e: any) {
      showToast(e?.message || 'Failed to load lost leads', 'error');
      setLostLeads([]);
      setLostLeadsTotal(0);
    } finally {
      setLostLeadsLoading(false);
    }
  }, [lostLeadsPage, showToast]);

  useEffect(() => {
    if (ordersTab === 'won') loadOrders();
  }, [ordersTab, loadOrders]);

  useEffect(() => {
    if (ordersTab === 'lost') loadLostLeads();
  }, [ordersTab, loadLostLeads]);

  useEffect(() => {
    marketingAPI.getOrderStatuses({ is_active: true }).then((list) => {
      setStatuses(list);
      setOrderStatusesFull(list);
    }).catch(() => setStatuses([]));
  }, []);

  useEffect(() => {
    marketingAPI.getOrderStatusGroups().then(setOrderStatusGroups).catch(() => setOrderStatusGroups([]));
  }, []);

  const openOrderStatusModal = () => {
    setEditingGroup(null);
    setEditingStatus(null);
    setAddingGroup(false);
    setGroupForm({ code: '', label: '', expected_duration_days: undefined, display_order: orderStatusGroups.length, is_active: true, hex_color: '' });
    setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, hex_color: '' });
    setShowOrderStatusModal(true);
    marketingAPI.getOrderStatusGroups().then(setOrderStatusGroups).catch(() => setOrderStatusGroups([]));
    marketingAPI.getOrderStatuses().then((list) => {
      setOrderStatusesFull(list);
      setStatuses(list.filter((s) => s.is_active));
    }).catch(() => setOrderStatusesFull([]));
  };

  const saveOrderGroup = async () => {
    if (!groupForm.label.trim()) {
      showToast('Group label is required', 'error');
      return;
    }
    const code = (groupForm.code || groupForm.label).trim().toLowerCase().replace(/\s+/g, '_');
    setSavingGroup(true);
    try {
      if (editingGroup) {
        await marketingAPI.updateOrderStatusGroup(editingGroup.id, { code, label: groupForm.label.trim(), expected_duration_days: groupForm.expected_duration_days ?? undefined, display_order: groupForm.display_order, is_active: groupForm.is_active, hex_color: groupForm.hex_color?.trim() || undefined });
        showToast('Group updated', 'success');
      } else {
        await marketingAPI.createOrderStatusGroup({ code, label: groupForm.label.trim(), expected_duration_days: groupForm.expected_duration_days ?? undefined, display_order: groupForm.display_order, is_active: groupForm.is_active, hex_color: groupForm.hex_color?.trim() || undefined });
        showToast('Group created', 'success');
      }
      const list = await marketingAPI.getOrderStatusGroups();
      setOrderStatusGroups(list);
      setEditingGroup(null);
      setAddingGroup(false);
      setGroupForm({ code: '', label: '', expected_duration_days: undefined, display_order: list.length, is_active: true, hex_color: '' });
    } catch (e: any) {
      showToast(e?.message || 'Failed to save group', 'error');
    } finally {
      setSavingGroup(false);
    }
  };

  const cancelOrderGroupForm = () => {
    setAddingGroup(false);
    setEditingGroup(null);
    setGroupForm({ code: '', label: '', expected_duration_days: undefined, display_order: orderStatusGroups.length, is_active: true, hex_color: '' });
  };

  const openAddOrderStatusToGroup = (groupId: number) => {
    setEditingStatus(null);
    const statusesInGroup = orderStatusesFull.filter((s) => s.group_id === groupId);
    setStatusForm({ code: '', label: '', display_order: statusesInGroup.length, group_id: groupId, is_active: true, is_final: false, hex_color: '' });
    setShowOrderStatusModal(true);
  };

  const openEditOrderStatus = (s: OrderStatusOption) => {
    setEditingStatus(s);
    setStatusForm({ code: s.code, label: s.label, display_order: s.display_order, group_id: s.group_id ?? undefined, is_active: s.is_active, is_final: s.is_final ?? false, hex_color: s.hex_color ?? '' });
  };

  const saveOrderStatus = async () => {
    if (!statusForm.label.trim()) {
      showToast('Label is required', 'error');
      return;
    }
    const code = (statusForm.code || statusForm.label).trim().toLowerCase().replace(/\s+/g, '_');
    setSavingStatus(true);
    try {
      if (editingStatus) {
        await marketingAPI.updateOrderStatus(editingStatus.id, { code, label: statusForm.label.trim(), display_order: statusForm.display_order, group_id: statusForm.group_id ?? undefined, is_active: statusForm.is_active, is_final: statusForm.is_final, hex_color: statusForm.hex_color?.trim() || undefined });
        showToast('Status updated', 'success');
      } else {
        await marketingAPI.createOrderStatus({ code, label: statusForm.label.trim(), group_id: statusForm.group_id ?? undefined, display_order: statusForm.display_order, is_active: statusForm.is_active, is_final: statusForm.is_final, hex_color: statusForm.hex_color?.trim() || undefined });
        showToast('Status created', 'success');
      }
      const list = await marketingAPI.getOrderStatuses();
      setOrderStatusesFull(list);
      setStatuses(list.filter((s) => s.is_active));
      setEditingStatus(null);
      setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, hex_color: '' });
    } catch (e: any) {
      showToast(e?.message || 'Failed to save status', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const confirmDeleteOrderGroup = async () => {
    if (deleteGroupId == null) return;
    try {
      await marketingAPI.deleteOrderStatusGroup(deleteGroupId);
      showToast('Group deleted', 'success');
      const list = await marketingAPI.getOrderStatusGroups();
      setOrderStatusGroups(list);
      setDeleteGroupId(null);
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete group', 'error');
    }
  };

  const confirmDeleteOrderStatus = async () => {
    if (deleteStatusId == null) return;
    try {
      await marketingAPI.deleteOrderStatus(deleteStatusId);
      showToast('Status deleted', 'success');
      const list = await marketingAPI.getOrderStatuses();
      setOrderStatusesFull(list);
      setStatuses(list.filter((s) => s.is_active));
      setDeleteStatusId(null);
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete status', 'error');
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const confirmDeleteOrder = async () => {
    if (deleteOrderId == null) return;
    try {
      await marketingAPI.deleteOrder(deleteOrderId);
      showToast('Order deleted', 'success');
      setOrders((prev) => prev.filter((o) => o.id !== deleteOrderId));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteOrderId(null);
    } catch (e: any) {
      showToast(e?.message || 'Failed to delete order', 'error');
    }
  };

  const handleOrderDragStart = (e: React.DragEvent, order: Order) => {
    if (!canEdit) return;
    didDragRef.current = false;
    e.dataTransfer.setData('application/json', JSON.stringify({ orderId: order.id, currentStatusId: order.status_id ?? null }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedOrderId(order.id);
  };
  const handleOrderDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverStatusId(null);
    setTimeout(() => { didDragRef.current = false; }, 0);
  };
  const handleColumnDragOver = (e: React.DragEvent, statusId: number | 'none') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatusId(statusId);
  };
  const handleColumnDragLeave = () => {
    setDragOverStatusId(null);
  };

  const isLostOrderStatus = (statusId: number | null): boolean => {
    if (statusId == null) return false;
    const s = statuses.find((x) => x.id === statusId);
    if (!s) return false;
    const text = `${s.code || ''} ${s.label || ''}`.toLowerCase();
    return text.includes('lost');
  };

  const applyOrderStatusChange = async (
    orderId: number,
    currentStatusId: number | null,
    newStatusId: number | null,
    reason?: string
  ) => {
    setUpdatingOrderId(orderId);
    try {
      await marketingAPI.updateOrder(orderId, {
        status_id: newStatusId ?? null,
        status_change_reason: reason?.trim() || undefined,
      });
      showToast('Order status updated', 'success');
      const newOption = newStatusId != null ? statuses.find((s) => s.id === newStatusId) : null;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status_id: newStatusId ?? undefined, status_option: newOption ?? undefined, status: newOption?.code ?? undefined } : o
        )
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingOrderId(null);
      setDraggedOrderId(null);
    }
  };

  const handleColumnDrop = async (e: React.DragEvent, newStatusId: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = true;
    setDragOverStatusId(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    let orderId: number;
    let currentStatusId: number | null;
    try {
      ({ orderId, currentStatusId } = JSON.parse(raw));
    } catch {
      return;
    }
    if (currentStatusId === newStatusId) return;
    if (isLostOrderStatus(newStatusId)) {
      setLostStatusChangePending({ orderId, currentStatusId, newStatusId });
      setLostStatusReason('');
      setDraggedOrderId(null);
      return;
    }
    await applyOrderStatusChange(orderId, currentStatusId, newStatusId);
  };

  const handleConfirmLostStatusChange = async () => {
    if (!lostStatusChangePending) return;
    const reason = lostStatusReason.trim();
    if (reason.length < 100) {
      showToast('Lost reason must be at least 100 characters', 'error');
      return;
    }
    setLostStatusSubmitting(true);
    await applyOrderStatusChange(
      lostStatusChangePending.orderId,
      lostStatusChangePending.currentStatusId,
      lostStatusChangePending.newStatusId,
      reason
    );
    setLostStatusSubmitting(false);
    setLostStatusChangePending(null);
    setLostStatusReason('');
  };

  const displayOrders = searchTerm.trim()
    ? orders.filter((o) => {
        const term = searchTerm.toLowerCase();
        if ((o.series || '').toLowerCase().includes(term)) return true;
        if (o.lead) {
          const name = leadDisplayName(o.lead);
          const company = leadDisplayCompany(o.lead);
          if (name.toLowerCase().includes(term) || company.toLowerCase().includes(term)) return true;
        }
        return false;
      })
    : orders;

  const ordersByStatus = useMemo(() => {
    const map: Record<string, Order[]> = {};
    statuses.forEach((s) => { map[s.code] = []; });
    map[''] = []; // orders with no status (e.g. null status_id) so they show in "No status" column
    displayOrders.forEach((o) => {
      const code = o.status_option?.code ?? statuses.find((s) => s.id === o.status_id)?.code ?? o.status ?? '';
      const key = code || '';
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [displayOrders, statuses]);

  /** Status groups for kanban: each group has a container with label and its status columns (same as Leads). */
  const statusGroupsForBoard = useMemo(() => {
    const activeStatuses = statuses.filter((s) => s.is_active);
    const order = [...orderStatusGroups.filter((g) => g.is_active).map((g) => g.id), 'none' as const];
    return order.map((groupId): { groupId: number | 'none'; groupLabel: string; statuses: OrderStatusOption[] } => {
      const statusesInGroup = activeStatuses.filter((s) => (s.group_id ?? null) === (groupId === 'none' ? null : groupId));
      const groupLabel = groupId === 'none' ? '— No group —' : orderStatusGroups.find((g) => g.id === groupId)?.label ?? `Group #${groupId}`;
      return { groupId, groupLabel, statuses: statusesInGroup };
    }).filter((block) => block.statuses.length > 0);
  }, [statuses, orderStatusGroups]);

  const columns: Column<Order>[] = [
    {
      key: 'series',
      label: 'Order Ref',
      render: (o) => (
        <span className="text-sm font-medium text-indigo-600">
          {o.series || `#${o.id}`}
        </span>
      ),
    },
    {
      key: 'lead',
      label: 'From Lead',
      render: (o) => {
        const lead = o.lead;
        if (!lead) return '—';
        const name = leadDisplayName(lead);
        return (
          <span className="text-sm text-slate-700">
            {lead.series ? `${lead.series} – ` : ''}{name}
          </span>
        );
      },
    },
    {
      key: 'order_value',
      label: 'Value',
      align: 'right',
      render: (o) => (
        <span className="text-sm font-medium tabular-nums">
          {o.order_value != null ? `₹${Number(o.order_value).toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      key: 'expected_delivery_at',
      label: 'Expected delivery',
      render: (o) => (
        <span className="text-sm text-slate-500">
          {o.expected_delivery_at
            ? new Date(o.expected_delivery_at).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (o) => {
        const opt = o.status_option;
        const label = opt?.label ?? o.status ?? '—';
        const color = opt?.hex_color || '#64748b';
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: color, color: '#fff', border: 'none' }}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (o) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${o.id}`)}>
            <MoreHorizontal size={18} strokeWidth={2.5} />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              onClick={() => setDeleteOrderId(o.id)}
              title="Delete order"
            >
              <Trash2 size={16} strokeWidth={2} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const breadcrumbs = [{ label: 'Orders', href: '/orders' }];
  return (
    <PageLayout
      title="Orders"
      description={ordersTab === 'won' ? 'Orders created from won leads. Manage status and inquiry log per order.' : 'Lost leads and their enquiry logs (including reason for loss).'}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-full border border-slate-200 p-0.5 bg-slate-100/50">
            <button
              type="button"
              onClick={() => setOrdersTab('won')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                ordersTab === 'won' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Won
            </button>
            <button
              type="button"
              onClick={() => setOrdersTab('lost')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                ordersTab === 'lost' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Lost
            </button>
          </div>
          {ordersTab === 'won' && (
            <>
              <div className="flex rounded-full border border-slate-200 p-0.5 bg-slate-100/50">
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid size={16} /> Kanban
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <List size={16} /> Table
                </button>
              </div>
              <Input
                variant="white"
                inputSize="sm"
                className="rounded-full shadow-sm"
                icon={<Search size={14} strokeWidth={2.5} />}
                placeholder="Search by order ref, lead name, company, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                containerClassName="max-w-md"
              />
              {viewMode === 'table' && (
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value === '' ? '' : Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="outline" size="sm" onClick={openOrderStatusModal} leftIcon={<Settings2 size={14} strokeWidth={2.5} />}>
                Manage statuses
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/orders/new')} leftIcon={<Plus size={14} strokeWidth={3} />}>
                New Order (from lead)
              </Button>
            </>
          )}
        </div>

        {ordersTab === 'lost' ? (
          <Card noPadding contentClassName="py-0">
            {lostLeadsLoading ? (
              <div className="py-12 text-center text-slate-500">Loading lost leads...</div>
            ) : lostLeads.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-slate-900 font-semibold">No lost leads</p>
                <p className="text-slate-500 text-sm mt-2">Leads marked as Lost will appear here with their enquiry log and reason.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-slate-600">
                        <th className="px-4 py-3 font-medium">Lead</th>
                        <th className="px-4 py-3 font-medium">Company</th>
                        <th className="px-4 py-3 font-medium">Date lost</th>
                        <th className="px-4 py-3 font-medium">Reason (from enquiry log)</th>
                        <th className="px-4 py-3 font-medium w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lostLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-indigo-600">
                              {lead.series ? `${lead.series} – ` : ''}{leadDisplayName(lead)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{leadDisplayCompany(lead) || '—'}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700 max-w-md">
                            <span className="line-clamp-2" title={lead.lost_reason ?? undefined}>
                              {lead.lost_reason ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                              title="View lead & enquiry log"
                              onClick={() => navigate(`/leads/${lead.id}/edit?view=1`)}
                            >
                              <FileText size={18} strokeWidth={2.5} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-200 px-4 py-3">
                  <Pagination
                    page={lostLeadsPage}
                    pageSize={DEFAULT_PAGE_SIZE}
                    total={lostLeadsTotal}
                    totalPages={Math.max(1, Math.ceil(lostLeadsTotal / DEFAULT_PAGE_SIZE))}
                    onPageChange={setLostLeadsPage}
                    onPageSizeChange={() => {}}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                  />
                </div>
              </>
            )}
          </Card>
        ) : viewMode === 'kanban' ? (
          <>
            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading orders...</div>
            ) : displayOrders.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-slate-900 font-semibold">No orders found</p>
                <p className="text-slate-500 text-sm mt-2">
                  Create an order from a won lead, or adjust filters.
                </p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/orders/new')} leftIcon={<Plus size={14} />}>
                  New Order
                </Button>
              </div>
            ) : statusGroupsForBoard.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No order statuses configured. Use &quot;Manage statuses&quot; to add groups and statuses.
              </div>
            ) : (
              <div className="flex flex-row gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
                {(ordersByStatus['']?.length ?? 0) > 0 && (
                  <div
                    key="no-status"
                    className={`flex flex-shrink-0 flex-col rounded-xl border border-slate-200 overflow-hidden transition-all ${collapsedGroups.has('nogroup') ? 'w-14' : 'p-4'}`}
                    style={{ backgroundColor: 'rgba(241,245,249,0.5)' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapsed('nogroup')}
                      className={`flex items-center gap-2 border-b border-slate-200 pb-2 mb-3 w-full text-left ${collapsedGroups.has('nogroup') ? 'flex-col justify-center py-4 px-1 min-h-[120px]' : 'border-b border-slate-200 pb-2'}`}
                    >
                      {collapsedGroups.has('nogroup') ? (
                        <>
                          <ChevronLeft size={18} className="text-slate-500 rotate-90" />
                          <span className="text-xs font-semibold text-slate-600 leading-none" style={{ writingMode: 'vertical-rl' }}>No status</span>
                          <span className="text-[11px] font-bold text-slate-500 leading-none">{ordersByStatus[''].length}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-slate-700">— No group —</span>
                          <span className="text-xs text-slate-400">(1 status • {ordersByStatus[''].length} orders)</span>
                          <ChevronRight size={16} className="text-slate-400 ml-auto" />
                        </>
                      )}
                    </button>
                    {!collapsedGroups.has('nogroup') && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      <div
                        className={`flex-shrink-0 w-72 h-[calc(100vh-260px)] rounded-xl border-2 overflow-hidden flex flex-col transition-colors ${dragOverStatusId === 'none' ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50'}`}
                        onDragOver={(e) => handleColumnDragOver(e, 'none')}
                        onDragLeave={handleColumnDragLeave}
                        onDrop={(e) => handleColumnDrop(e, null)}
                      >
                        <div className={`flex-shrink-0 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between font-semibold text-sm uppercase tracking-wide ${DEFAULT_STATUS_COLOR.bg} ${DEFAULT_STATUS_COLOR.text}`}>
                          <span>No status</span>
                          <span className="text-xs opacity-80">({ordersByStatus[''].length})</span>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-2 scrollbar-hide">
                          {ordersByStatus[''].map((o) => (
                            <div
                              key={o.id}
                              draggable={canEdit}
                              onDragStart={(e) => handleOrderDragStart(e, o)}
                              onDragEnd={handleOrderDragEnd}
                              onClick={() => canEdit && !didDragRef.current && navigate(`/orders/${o.id}`)}
                              className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-pointer ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedOrderId === o.id ? 'opacity-50' : ''} ${updatingOrderId === o.id ? 'animate-pulse' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="font-medium text-indigo-600 text-sm truncate min-w-0">{o.series || `#${o.id}`}</div>
                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setDeleteOrderId(o.id); }}
                                    className="shrink-0 p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                                    title="Delete order"
                                  >
                                    <Trash2 size={14} strokeWidth={2} />
                                  </button>
                                )}
                              </div>
                              {o.status_option && (
                                <div className="mt-1">
                                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{o.status_option.label}</span>
                                </div>
                              )}
                              {o.lead && (
                                <>
                                  <div className="text-xs text-slate-700 truncate mt-1">
                                    {leadDisplayName(o.lead)}
                                  </div>
                                  {leadDisplayCompany(o.lead) && (
                                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{leadDisplayCompany(o.lead)}</div>
                                  )}
                                </>
                              )}
                              {o.order_value != null && (
                                <div className="text-xs font-medium text-slate-700 mt-1">₹{Number(o.order_value).toLocaleString()}</div>
                              )}
                              {o.expected_delivery_at && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Delivery: {new Date(o.expected_delivery_at).toLocaleDateString(undefined, { dateStyle: 'short' })}
                                </div>
                              )}
                              {o.assigned_to_username && (
                                <div className="text-[10px] text-slate-500 mt-0.5">Assigned: {o.assigned_to_username}</div>
                              )}
                              {o.created_at && (
                                <div className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(o.created_at).toLocaleDateString(undefined, { dateStyle: 'short' })}</div>
                              )}
                              {o.last_activity_date && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Last inquiry: {new Date(o.last_activity_date).toLocaleDateString(undefined, { dateStyle: 'short' })} {new Date(o.last_activity_date).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                                </div>
                              )}
                              {o.notes && (
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={o.notes}>{o.notes}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                )}
                {statusGroupsForBoard.map(({ groupId, groupLabel, statuses: statusesInGroup }) => {
                  const group = groupId !== 'none' ? orderStatusGroups.find((g) => g.id === groupId) : null;
                  const groupBgStyle = group?.hex_color && /^#[0-9A-Fa-f]{6}$/.test(group.hex_color) ? { backgroundColor: `${group.hex_color}18` } : undefined;
                  const collapseKey = groupId === 'none' ? 'nogroup' : `group-${groupId}`;
                  const isCollapsed = collapsedGroups.has(collapseKey);
                  const groupOrderCount = statusesInGroup.reduce((sum, s) => sum + (ordersByStatus[s.code]?.length ?? 0), 0);
                  return (
                  <div
                    key={groupId === 'none' ? 'nogroup' : groupId}
                    className={`flex flex-shrink-0 flex-col rounded-xl border border-slate-200 overflow-hidden transition-all ${isCollapsed ? 'w-14' : 'p-4'}`}
                    style={groupBgStyle ?? { backgroundColor: 'rgba(241,245,249,0.5)' }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapsed(collapseKey)}
                      className={`flex items-center gap-2 w-full text-left ${isCollapsed ? 'flex-col justify-center py-4 px-1 min-h-[120px] border-b-0' : 'mb-3 border-b border-slate-200 pb-2'}`}
                    >
                      {isCollapsed ? (
                        <>
                          <ChevronLeft size={18} className="text-slate-500 rotate-90" />
                          <span className="text-xs font-semibold text-slate-600 leading-none" style={{ writingMode: 'vertical-rl' }}>{groupLabel}</span>
                          <span className="text-[11px] font-bold text-slate-500 leading-none">{groupOrderCount}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-slate-700">{groupLabel}</span>
                          <span className="text-xs text-slate-400">({statusesInGroup.length} status{statusesInGroup.length !== 1 ? 'es' : ''} • {groupOrderCount} orders)</span>
                          <ChevronRight size={16} className="text-slate-400 ml-auto" />
                        </>
                      )}
                    </button>
                    {!isCollapsed && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {statusesInGroup.map((status) => {
                        const columnOrders = ordersByStatus[status.code] || [];
                        const useStatusHex = status.hex_color && /^#[0-9A-Fa-f]{6}$/.test(status.hex_color);
                        const statusColor = !useStatusHex ? (STATUS_COLORS[status.code] || DEFAULT_STATUS_COLOR) : null;
                        return (
                          <div
                            key={status.id}
                            className={`flex-shrink-0 w-72 h-[calc(100vh-260px)] rounded-xl border-2 overflow-hidden flex flex-col transition-colors ${dragOverStatusId === status.id ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50/50'}`}
                            onDragOver={(e) => handleColumnDragOver(e, status.id)}
                            onDragLeave={handleColumnDragLeave}
                            onDrop={(e) => handleColumnDrop(e, status.id)}
                          >
                            <div
                              className={`flex-shrink-0 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between font-semibold text-sm uppercase tracking-wide ${statusColor ? `${statusColor.bg} ${statusColor.text}` : ''}`}
                              style={useStatusHex ? { backgroundColor: status.hex_color!, color: getContrastColor(status.hex_color!) } : undefined}
                            >
                              <span>{status.label}</span>
                              <span className="text-xs opacity-80">({columnOrders.length})</span>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-2 scrollbar-hide">
                              {columnOrders.map((o) => (
                                <div
                                  key={o.id}
                                  draggable={canEdit}
                                  onDragStart={(e) => handleOrderDragStart(e, o)}
                                  onDragEnd={handleOrderDragEnd}
                                  onClick={() => canEdit && !didDragRef.current && navigate(`/orders/${o.id}`)}
                                  className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-pointer ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedOrderId === o.id ? 'opacity-50' : ''} ${updatingOrderId === o.id ? 'animate-pulse' : ''}`}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="font-medium text-indigo-600 text-sm truncate min-w-0">{o.series || `#${o.id}`}</div>
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setDeleteOrderId(o.id); }}
                                        className="shrink-0 p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600"
                                        title="Delete order"
                                      >
                                        <Trash2 size={14} strokeWidth={2} />
                                      </button>
                                    )}
                                  </div>
                                  {o.status_option && (
                                    <div className="mt-1">
                                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{o.status_option.label}</span>
                                    </div>
                                  )}
                                  {o.lead && (
                                    <>
                                      <div className="text-xs text-slate-700 truncate mt-1">
                                        {leadDisplayName(o.lead)}
                                      </div>
                                      {leadDisplayCompany(o.lead) && (
                                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{leadDisplayCompany(o.lead)}</div>
                                      )}
                                    </>
                                  )}
                                  {o.order_value != null && (
                                    <div className="text-xs font-medium text-slate-700 mt-1">₹{Number(o.order_value).toLocaleString()}</div>
                                  )}
                                  {o.expected_delivery_at && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      Delivery: {new Date(o.expected_delivery_at).toLocaleDateString(undefined, { dateStyle: 'short' })}
                                    </div>
                                  )}
                                  {o.assigned_to_username && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">Assigned: {o.assigned_to_username}</div>
                                  )}
                                  {o.created_at && (
                                    <div className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(o.created_at).toLocaleDateString(undefined, { dateStyle: 'short' })}</div>
                                  )}
                                  {o.last_activity_date && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      Last inquiry: {new Date(o.last_activity_date).toLocaleDateString(undefined, { dateStyle: 'short' })} {new Date(o.last_activity_date).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                                    </div>
                                  )}
                                  {o.notes && (
                                    <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={o.notes}>{o.notes}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <Card noPadding contentClassName="py-0">
            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading orders...</div>
            ) : displayOrders.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-slate-900 font-semibold">No orders found</p>
                <p className="text-slate-500 text-sm mt-2">
                  Create an order from a won lead, or adjust filters.
                </p>
                <Button className="mt-4" size="sm" onClick={() => navigate('/orders/new')} leftIcon={<Plus size={14} />}>
                  New Order
                </Button>
              </div>
            ) : (
              <>
                <DataTable
                  data={displayOrders}
                  columns={columns}
                  rowKey={(o) => String(o.id)}
                  onRowClick={(o) => navigate(`/orders/${o.id}`)}
                />
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
        )}
      </div>

      <Modal
        isOpen={showOrderStatusModal}
        onClose={() => {
          setShowOrderStatusModal(false);
          setEditingGroup(null);
          setEditingStatus(null);
          setAddingGroup(false);
          setGroupForm({ code: '', label: '', expected_duration_days: undefined, display_order: 0, is_active: true, hex_color: '' });
          setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, hex_color: '' });
        }}
        title="Order status groups & statuses"
        contentClassName="max-w-4xl"
      >
        <div className="max-h-[85vh] overflow-y-auto overflow-x-hidden pr-1">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">1. Status groups</h4>
          <p className="text-xs text-slate-500 mb-2">Create groups first, then add statuses to each group.</p>
          <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="px-2 py-1.5">Code</th>
                  <th className="px-2 py-1.5">Label</th>
                  <th className="px-2 py-1.5">Days</th>
                  <th className="px-2 py-1.5">Order</th>
                  <th className="px-2 py-1.5">Active</th>
                  <th className="px-2 py-1.5">Color</th>
                  <th className="px-2 py-1.5">
                    <Button variant="ghost" size="xs" className="text-indigo-600" onClick={() => { setAddingGroup(true); setEditingGroup(null); setGroupForm({ code: '', label: '', expected_duration_days: undefined, display_order: orderStatusGroups.length, is_active: true, hex_color: '' }); }} leftIcon={<Plus size={12} />}>Create group</Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {addingGroup && (
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <td className="px-2 py-1"><input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm font-mono" placeholder="e.g. production" value={groupForm.code} onChange={(e) => setGroupForm((f) => ({ ...f, code: e.target.value }))} /></td>
                    <td className="px-2 py-1"><input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm" placeholder="e.g. Production" value={groupForm.label} onChange={(e) => setGroupForm((f) => ({ ...f, label: e.target.value }))} /></td>
                    <td className="px-2 py-1"><input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm" placeholder="—" value={groupForm.expected_duration_days ?? ''} onChange={(e) => setGroupForm((f) => ({ ...f, expected_duration_days: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 }))} /></td>
                    <td className="px-2 py-1"><input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm" value={groupForm.display_order} onChange={(e) => setGroupForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} /></td>
                    <td className="px-2 py-1"><label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={groupForm.is_active} onChange={(e) => setGroupForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Active</span></label></td>
                    <td className="px-2 py-1"><div className="flex items-center gap-1.5"><input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" value={groupForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(groupForm.hex_color) ? groupForm.hex_color : '#3b82f6'} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} /><input className="h-8 w-20 rounded border border-slate-200 bg-white px-2 text-sm font-mono" placeholder="#3b82f6" value={groupForm.hex_color} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} /></div></td>
                    <td className="px-2 py-1"><div className="flex gap-1"><Button size="xs" onClick={saveOrderGroup} disabled={savingGroup || !groupForm.label?.trim()}>{savingGroup ? '...' : 'Save'}</Button><Button size="xs" variant="outline" onClick={cancelOrderGroupForm}>Cancel</Button></div></td>
                  </tr>
                )}
                {orderStatusGroups.map((g) =>
                  editingGroup?.id === g.id ? (
                    <tr key={g.id} className="bg-amber-50/50 border-b border-slate-200">
                      <td className="px-2 py-1.5"><input className="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono" value={groupForm.code} onChange={(e) => setGroupForm((f) => ({ ...f, code: e.target.value }))} /></td>
                      <td className="px-2 py-1.5"><input className="w-full rounded border border-slate-300 px-2 py-1 text-sm" value={groupForm.label} onChange={(e) => setGroupForm((f) => ({ ...f, label: e.target.value }))} /></td>
                      <td className="px-2 py-1.5"><input type="number" className="w-14 rounded border border-slate-300 px-2 py-1 text-sm" value={groupForm.expected_duration_days ?? ''} onChange={(e) => setGroupForm((f) => ({ ...f, expected_duration_days: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 }))} /></td>
                      <td className="px-2 py-1.5"><input type="number" className="w-14 rounded border border-slate-300 px-2 py-1 text-sm" value={groupForm.display_order} onChange={(e) => setGroupForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} /></td>
                      <td className="px-2 py-1.5"><label className="flex items-center gap-1"><input type="checkbox" checked={groupForm.is_active} onChange={(e) => setGroupForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span className="text-xs">Active</span></label></td>
                      <td className="px-2 py-1.5"><div className="flex items-center gap-1.5"><input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5" value={groupForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(groupForm.hex_color) ? groupForm.hex_color : '#3b82f6'} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} /><input className="w-20 rounded border border-slate-300 px-2 py-1 text-sm font-mono" value={groupForm.hex_color} onChange={(e) => setGroupForm((f) => ({ ...f, hex_color: e.target.value }))} /></div></td>
                      <td className="px-2 py-1.5"><div className="flex gap-1"><Button size="xs" onClick={saveOrderGroup} disabled={savingGroup || !groupForm.label?.trim()}>{savingGroup ? '...' : 'Save'}</Button><Button size="xs" variant="outline" onClick={cancelOrderGroupForm}>Cancel</Button></div></td>
                    </tr>
                  ) : (
                    <tr key={g.id} className="border-b border-slate-100">
                      <td className="px-2 py-1 font-mono text-slate-700">{g.code}</td>
                      <td className="px-2 py-1">{g.label}</td>
                      <td className="px-2 py-1">{g.expected_duration_days ?? '—'}</td>
                      <td className="px-2 py-1">{g.display_order}</td>
                      <td className="px-2 py-1">{g.is_active ? 'Yes' : 'No'}</td>
                      <td className="px-2 py-1">{g.hex_color ? <span className="inline-flex items-center gap-1.5"><span className="inline-block h-5 w-5 rounded border border-slate-300 shrink-0" style={{ backgroundColor: g.hex_color }} /><span className="text-xs font-mono text-slate-600">{g.hex_color}</span></span> : '—'}</td>
                      <td className="px-2 py-1">
                        <Button variant="ghost" size="xs" className="text-indigo-600" onClick={() => openAddOrderStatusToGroup(g.id)} leftIcon={<Plus size={12} />}>Add status</Button>
                        <Button variant="ghost" size="xs" onClick={() => { setEditingGroup(g); setAddingGroup(false); setGroupForm({ code: g.code, label: g.label, expected_duration_days: g.expected_duration_days ?? undefined, display_order: g.display_order, is_active: g.is_active, hex_color: g.hex_color ?? '' }); }}>Edit</Button>
                        <Button variant="ghost" size="xs" className="text-rose-600" onClick={() => setDeleteGroupId(g.id)}>Delete</Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold text-slate-700 mb-1 mt-4">2. Statuses</h4>
          <p className="text-xs text-slate-500 mb-2">Add statuses under each group. &quot;Final&quot; = order completed.</p>
          <div className="border-t border-slate-200 pt-3">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-200">
                <tr className="text-left text-slate-500">
                  <th className="pb-2 pr-2">Code</th>
                  <th className="pb-2 pr-2">Label</th>
                  <th className="pb-2 pr-2">Order</th>
                  <th className="pb-2 pr-2">Active</th>
                  <th className="pb-2 pr-2">Final</th>
                  <th className="pb-2 pr-2">Color</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const byGroup = new Map<number | 'none', OrderStatusOption[]>();
                  orderStatusesFull.forEach((s) => {
                    const key = s.group_id ?? 'none';
                    if (!byGroup.has(key)) byGroup.set(key, []);
                    byGroup.get(key)!.push(s);
                  });
                  const groupOrder = [...orderStatusGroups.filter((g) => g.is_active).map((g) => g.id), 'none' as const];
                  return groupOrder.map((groupId) => {
                    const statusesInGroup = byGroup.get(groupId) ?? [];
                    if (statusesInGroup.length === 0 && groupId === 'none') return null;
                    const groupLabel = groupId === 'none' ? '— No group —' : orderStatusGroups.find((g) => g.id === groupId)?.label ?? `Group #${groupId}`;
                    return (
                      <React.Fragment key={groupId === 'none' ? 'nogroup' : groupId}>
                        <tr className="bg-slate-100/80"><td colSpan={7} className="py-1.5 px-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">{groupLabel}</td></tr>
                        {statusForm.group_id === groupId && !editingStatus && (
                          <tr className="border-b border-slate-100 bg-slate-50/80">
                            <td className="py-2 pr-2"><input className="h-8 w-full max-w-[7rem] rounded border border-slate-200 bg-white px-2 text-sm font-mono" placeholder="Code" value={statusForm.code} onChange={(e) => setStatusForm((f) => ({ ...f, code: e.target.value }))} /></td>
                            <td className="py-2 pr-2"><input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm" placeholder="Label" value={statusForm.label} onChange={(e) => setStatusForm((f) => ({ ...f, label: e.target.value }))} /></td>
                            <td className="py-2 pr-2"><input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm" value={statusForm.display_order} onChange={(e) => setStatusForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} /></td>
                            <td className="py-2 pr-2"><label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={statusForm.is_active} onChange={(e) => setStatusForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Active</span></label></td>
                            <td className="py-2 pr-2"><label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={statusForm.is_final} onChange={(e) => setStatusForm((f) => ({ ...f, is_final: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Final</span></label></td>
                            <td className="py-2 pr-2"><div className="flex items-center gap-1.5"><input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" value={statusForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(statusForm.hex_color) ? statusForm.hex_color : '#3b82f6'} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} /><input className="h-8 w-20 rounded border border-slate-200 bg-white px-2 text-sm font-mono" placeholder="#3b82f6" value={statusForm.hex_color} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} /></div></td>
                            <td className="py-2"><div className="flex gap-1"><Button size="xs" onClick={saveOrderStatus} disabled={savingStatus || !statusForm.label?.trim()}>{savingStatus ? '...' : 'Save'}</Button><Button size="xs" variant="outline" onClick={() => { setEditingStatus(null); setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, hex_color: '' }); }}>Cancel</Button></div></td>
                          </tr>
                        )}
                        {statusesInGroup.length === 0 && statusForm.group_id !== groupId ? (
                          <tr><td colSpan={7} className="py-2 px-2 text-slate-400 text-xs italic">No statuses yet. Click &quot;Add status&quot; next to the group.</td></tr>
                        ) : (
                          statusesInGroup.map((s) =>
                            editingStatus?.id === s.id ? (
                              <tr key={s.id} className="border-b border-slate-100 bg-slate-50/80">
                                <td className="py-2 pr-2"><input className="h-8 w-full max-w-[7rem] rounded border border-slate-200 bg-white px-2 text-sm font-mono" value={statusForm.code} onChange={(e) => setStatusForm((f) => ({ ...f, code: e.target.value }))} /></td>
                                <td className="py-2 pr-2"><input className="h-8 w-full max-w-[8rem] rounded border border-slate-200 bg-white px-2 text-sm" value={statusForm.label} onChange={(e) => setStatusForm((f) => ({ ...f, label: e.target.value }))} /></td>
                                <td className="py-2 pr-2"><input type="number" className="h-8 w-14 rounded border border-slate-200 bg-white px-2 text-sm" value={statusForm.display_order} onChange={(e) => setStatusForm((f) => ({ ...f, display_order: parseInt(e.target.value, 10) || 0 }))} /></td>
                                <td className="py-2 pr-2"><label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={statusForm.is_active} onChange={(e) => setStatusForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Active</span></label></td>
                                <td className="py-2 pr-2"><label className="flex h-8 cursor-pointer items-center gap-1.5 text-sm"><input type="checkbox" checked={statusForm.is_final} onChange={(e) => setStatusForm((f) => ({ ...f, is_final: e.target.checked }))} className="rounded border-slate-300 text-indigo-600" /><span>Final</span></label></td>
                                <td className="py-2 pr-2"><div className="flex items-center gap-1.5"><input type="color" className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5" value={statusForm.hex_color && /^#[0-9A-Fa-f]{6}$/.test(statusForm.hex_color) ? statusForm.hex_color : '#3b82f6'} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} /><input className="h-8 w-20 rounded border border-slate-200 bg-white px-2 text-sm font-mono" value={statusForm.hex_color} onChange={(e) => setStatusForm((f) => ({ ...f, hex_color: e.target.value }))} /></div></td>
                                <td className="py-2"><div className="flex gap-1"><Button size="xs" onClick={saveOrderStatus} disabled={savingStatus || !statusForm.label?.trim()}>{savingStatus ? '...' : 'Save'}</Button><Button size="xs" variant="outline" onClick={() => { setEditingStatus(null); setStatusForm({ code: '', label: '', display_order: 0, group_id: undefined, is_active: true, is_final: false, hex_color: '' }); }}>Cancel</Button></div></td>
                              </tr>
                            ) : (
                              <tr key={s.id} className="border-b border-slate-100">
                                <td className="py-2 pr-2 font-mono text-slate-700">{s.code}</td>
                                <td className="py-2 pr-2">{s.label}</td>
                                <td className="py-2 pr-2">{s.display_order}</td>
                                <td className="py-2 pr-2">{s.is_active ? 'Yes' : 'No'}</td>
                                <td className="py-2 pr-2">{s.is_final ? 'Yes' : '—'}</td>
                                <td className="py-2 pr-2">{s.hex_color ? <span className="inline-flex items-center gap-1.5"><span className="inline-block h-5 w-5 rounded border border-slate-300 shrink-0" style={{ backgroundColor: s.hex_color }} /><span className="text-xs font-mono text-slate-600">{s.hex_color}</span></span> : '—'}</td>
                                <td className="py-2"><Button variant="ghost" size="xs" onClick={() => openEditOrderStatus(s)}>Edit</Button><Button variant="ghost" size="xs" className="text-rose-600" onClick={() => setDeleteStatusId(s.id)}>Delete</Button></td>
                              </tr>
                            )
                          )
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={lostStatusChangePending != null}
        onClose={() => { setLostStatusChangePending(null); setLostStatusReason(''); }}
        title="Mark order as Lost"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLostStatusChangePending(null); setLostStatusReason(''); }}
              disabled={lostStatusSubmitting}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmLostStatusChange} disabled={lostStatusSubmitting || lostStatusReason.trim().length < 100}>
              {lostStatusSubmitting ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Please provide a detailed reason for marking this order as Lost (minimum 100 characters).</p>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[130px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Describe why the order is being marked as lost..."
            value={lostStatusReason}
            onChange={(e) => setLostStatusReason(e.target.value)}
          />
          <p className={`text-xs ${lostStatusReason.trim().length >= 100 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {lostStatusReason.trim().length}/100 minimum characters
          </p>
        </div>
      </Modal>

      <ConfirmModal isOpen={deleteGroupId !== null} onClose={() => setDeleteGroupId(null)} onConfirm={confirmDeleteOrderGroup} title="Delete group?" message="Remove this status group? Statuses in it must be moved or deleted first." confirmLabel="Delete" variant="danger" />
      <ConfirmModal isOpen={deleteStatusId !== null} onClose={() => setDeleteStatusId(null)} onConfirm={confirmDeleteOrderStatus} title="Delete status?" message="Remove this status? Orders using it must be reassigned first." confirmLabel="Delete" variant="danger" />
      <ConfirmModal isOpen={deleteOrderId !== null} onClose={() => setDeleteOrderId(null)} onConfirm={confirmDeleteOrder} title="Delete order?" message="This order will be permanently removed. This action cannot be undone." confirmLabel="Delete" variant="danger" />
    </PageLayout>
  );
};
