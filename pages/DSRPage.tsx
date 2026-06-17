
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { marketingAPI, Lead, Order } from '../lib/marketing-api';
import { hrmsRBACClient, DSRTask } from '../lib/hrms-rbac';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectToken } from '../store/slices/authSlice';
import { ClipboardList, CheckCircle2, Clock, Users, Package, RefreshCw, Calendar, ArrowRight, FileText } from 'lucide-react';

type DatePreset = 'today' | 'this_week' | 'this_month' | 'custom';

function getDateRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (preset) {
    case 'today': {
      const s = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { dateFrom: s, dateTo: s };
    }
    case 'this_week': {
      const dayOfWeek = now.getDay();
      const mon = new Date(now);
      mon.setDate(d - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      return { dateFrom: fmt(mon), dateTo: fmt(sun) };
    }
    case 'this_month': {
      const first = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const last = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { dateFrom: first, dateTo: last };
    }
    default:
      return { dateFrom: '', dateTo: '' };
  }
}

export const DSRPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const token = useAppSelector(selectToken);

  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const { dateFrom, dateTo } = useMemo(() => {
    if (datePreset === 'custom') return { dateFrom: customFrom, dateTo: customTo };
    return getDateRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const [dsrTasks, setLocalDSR] = useState<DSRTask[]>([]);
  const [loadingDSR, setLoadingDSR] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchDSR = useCallback(async () => {
    if (!token) return;
    setLoadingDSR(true);
    try {
      const tasks = await hrmsRBACClient.getDSR(token, { filter_date: dateFrom || undefined });
      setLocalDSR(tasks);
    } catch {
      showToast('Failed to load DSR', 'error');
    } finally {
      setLoadingDSR(false);
    }
  }, [token, dateFrom, showToast]);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoadingLeads(true);
    try {
      const result = await marketingAPI.getLeads({ page: 1, page_size: 10, date_from: dateFrom || undefined, date_to: dateTo || undefined, order_by: '-created_at' });
      setLeads(result.items);
    } catch {
      showToast('Failed to load leads', 'error');
    } finally {
      setLoadingLeads(false);
    }
  }, [token, dateFrom, dateTo, showToast]);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoadingOrders(true);
    try {
      const result = await marketingAPI.getOrders({ page: 1, page_size: 10, date_from: dateFrom || undefined, date_to: dateTo || undefined });
      setOrders(result.items);
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  }, [token, dateFrom, dateTo, showToast]);

  useEffect(() => {
    fetchDSR();
    fetchLeads();
    fetchOrders();
  }, [fetchDSR, fetchLeads, fetchOrders]);

  const filteredDSR = useMemo(() => {
    if (statusFilter === 'all') return dsrTasks;
    return dsrTasks.filter(t => t.status === statusFilter);
  }, [dsrTasks, statusFilter]);

  const pendingTasks = filteredDSR.filter(t => t.status === 'pending');
  const completedTasks = filteredDSR.filter(t => t.status === 'completed');

  const dateFilterOptions: { value: DatePreset; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'custom', label: 'Custom' },
  ];

  const breadcrumbs = [{ label: 'DSR', href: '/dsr' }];

  return (
    <PageLayout
      title="Daily Status Reports"
      description="View DSR tasks, recent leads, and orders."
      breadcrumbs={breadcrumbs}
    >
      {/* ── Filters ── */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 ml-0.5">Period</label>
            <div className="flex gap-1.5">
              {dateFilterOptions.map(opt => (
                <Button
                  key={opt.value}
                  variant={datePreset === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDatePreset(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          {datePreset === 'custom' && (
            <>
              <div className="flex flex-col gap-1">
                <DatePicker label="From" value={customFrom} onChange={v => setCustomFrom(v || '')} inputSize="sm" />
              </div>
              <div className="flex flex-col gap-1">
                <DatePicker label="To" value={customTo} onChange={v => setCustomTo(v || '')} inputSize="sm" />
              </div>
            </>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700 ml-0.5">Status</label>
            <div className="flex gap-1.5">
              {(['all', 'pending', 'completed'] as const).map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s === 'pending' ? 'Pending' : 'Completed'}
                </Button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { fetchDSR(); fetchLeads(); fetchOrders(); }}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>
      </Card>

      {/* ── KPI count cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card noPadding className="min-h-0">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <ClipboardList size={18} className="text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total</p>
              {loadingDSR ? (
                <p className="text-base font-bold text-slate-300">—</p>
              ) : (
                <p className="text-base font-bold text-slate-900">{dsrTasks.length}</p>
              )}
            </div>
          </div>
        </Card>
        <Card noPadding className="min-h-0">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <Clock size={18} className="text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
              {loadingDSR ? (
                <p className="text-base font-bold text-slate-300">—</p>
              ) : (
                <p className="text-base font-bold text-amber-500">{pendingTasks.length}</p>
              )}
            </div>
          </div>
        </Card>
        <Card noPadding className="min-h-0">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
              {loadingDSR ? (
                <p className="text-base font-bold text-slate-300">—</p>
              ) : (
                <p className="text-base font-bold text-emerald-600">{completedTasks.length}</p>
              )}
            </div>
          </div>
        </Card>
        <Card noPadding className="min-h-0">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <FileText size={18} className="text-blue-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Leads</p>
              {loadingLeads ? (
                <p className="text-base font-bold text-slate-300">—</p>
              ) : (
                <p className="text-base font-bold text-blue-600">{leads.length}</p>
              )}
            </div>
          </div>
        </Card>
        <Card noPadding className="min-h-0">
          <div className="px-3 py-2.5 flex items-center gap-3">
            <Package size={18} className="text-purple-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Orders</p>
              {loadingOrders ? (
                <p className="text-base font-bold text-slate-300">—</p>
              ) : (
                <p className="text-base font-bold text-purple-600">{orders.length}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── DSR Tasks ── */}
      <Card title="DSR Tasks" description={`${filteredDSR.length} task${filteredDSR.length !== 1 ? 's' : ''} in selected period.`} className="mb-6">
        {loadingDSR ? (
          <div className="flex items-center gap-2 py-8 text-slate-500 justify-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading…
          </div>
        ) : filteredDSR.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
            <ClipboardList size={32} />
            <p className="text-sm">No DSR tasks for this period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTasks.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2">Pending ({pendingTasks.length})</p>
                <div className="space-y-2">
                  {pendingTasks.map(task => (
                    <div key={task.id} className="border border-slate-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={11} /> {task.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {completedTasks.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Completed ({completedTasks.length})</p>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <div key={task.id} className="border border-slate-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-slate-800 line-through decoration-slate-300">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-400 mt-1 line-through decoration-slate-200">{task.description}</p>}
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={11} /> {task.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Leads + Orders (inquiry logs) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Inquiry Log — Leads" description="Leads created or updated in the selected period.">
          {loadingLeads ? (
            <div className="flex items-center gap-2 py-8 text-slate-500 justify-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading leads…
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
              <Users size={28} />
              <p className="text-sm">No leads in this period.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}/edit`)}
                  className="border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-200 hover:bg-blue-50/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {lead.series && <span className="text-xs font-mono text-blue-600 mr-1">{lead.series}</span>}
                        {lead.contact?.contact_person_name || lead.contact?.first_name || `Lead #${lead.id}`}
                      </p>
                      {lead.created_at && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.status_option && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {lead.status_option.label}
                        </span>
                      )}
                      <ArrowRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                  {lead.assigned_to_username && (
                    <p className="text-[10px] text-slate-500 mt-1">Assigned: {lead.assigned_to_username}</p>
                  )}
                </div>
              ))}
              <button
                onClick={() => navigate('/leads')}
                className="w-full py-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors text-center uppercase tracking-wider"
              >
                View All Leads →
              </button>
            </div>
          )}
        </Card>

        <Card title="Inquiry Log — Orders" description="Recent orders from won leads.">
          {loadingOrders ? (
            <div className="flex items-center gap-2 py-8 text-slate-500 justify-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
              <Package size={28} />
              <p className="text-sm">No orders found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-blue-200 hover:bg-blue-50/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {order.series && <span className="text-xs font-mono text-purple-600 mr-1">{order.series}</span>}
                        {order.lead?.contact?.contact_person_name || `Order #${order.id}`}
                      </p>
                      {order.created_at && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {order.status_option && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {order.status_option.label}
                        </span>
                      )}
                      <ArrowRight size={14} className="text-slate-300" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {order.assigned_to_username && (
                      <p className="text-[10px] text-slate-500">Assigned: {order.assigned_to_username}</p>
                    )}
                    {order.order_value != null && order.order_value > 0 && (
                      <p className="text-[10px] font-bold text-emerald-600">₹{order.order_value.toLocaleString('en-IN')}</p>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/orders')}
                className="w-full py-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors text-center uppercase tracking-wider"
              >
                View All Orders →
              </button>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};

export default DSRPage;
