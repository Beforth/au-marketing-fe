
import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable, Column } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { useApp } from '../App';
import { Modal } from '../components/ui/Modal';
import { PageLayout } from '../components/layout/PageLayout';

interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  status: string;
  date: string;
}

const INITIAL_ORDERS: Order[] = [
  { id: '#ORD-7231', customer: 'Sarah Jenkins', product: 'Premium ERP Suite', amount: '$1,200.00', status: 'Processing', date: 'Oct 12, 2023' },
  { id: '#ORD-7232', customer: 'Michael Chen', product: 'Cloud Storage 1TB', amount: '$599.00', status: 'Shipped', date: 'Oct 13, 2023' },
  { id: '#ORD-7233', customer: 'Alisha Varma', product: 'Security Bundle', amount: '$850.00', status: 'Delivered', date: 'Oct 14, 2023' },
  { id: '#ORD-7234', customer: 'Robert Fox', product: 'Support Plan Pro', amount: '$2,100.00', status: 'Canceled', date: 'Oct 15, 2023' },
  { id: '#ORD-7235', customer: 'Emma Watson', product: 'API Access Key', amount: '$150.00', status: 'Delivered', date: 'Oct 15, 2023' },
  { id: '#ORD-7236', customer: 'David Bowie', product: 'Integration Kit', amount: '$420.00', status: 'Delivered', date: 'Oct 16, 2023' },
  { id: '#ORD-7237', customer: 'Global Tech Corp', product: 'Enterprise License', amount: '$45,000.00', status: 'Delivered', date: 'Oct 20, 2023' },
  { id: '#ORD-7238', customer: 'Cyberdyne Systems', product: 'AI Core Module', amount: '$82,500.00', status: 'Processing', date: 'Oct 21, 2023' },
  { id: '#ORD-7239', customer: 'Wayne Enterprises', product: 'Security Suite', amount: '$12,400.00', status: 'Shipped', date: 'Oct 22, 2023' },
  { id: '#ORD-7240', customer: 'Stark Industries', product: 'Power Grid OS', amount: '$250,000.00', status: 'Processing', date: 'Oct 23, 2023' },
];

export const OrdersPage: React.FC = () => {
  const { showToast, globalSearch, setGlobalSearch, orders: demoOrders } = useApp();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const allOrders = useMemo(() => [...INITIAL_ORDERS, ...demoOrders], [demoOrders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order =>
      order.customer.toLowerCase().includes(globalSearch.toLowerCase()) ||
      order.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
      order.product.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [globalSearch, allOrders]);

  const handleDownload = () => {
    setIsDownloading(true);
    showToast('Exporting order manifest...', 'info');
    setTimeout(() => {
      setIsDownloading(false);
      showToast('Order manifest downloaded successfully', 'success');
    }, 1500);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Processing new order entry...', 'info');
    setTimeout(() => {
      setIsCreateOpen(false);
      showToast('Order created successfully', 'success');
    }, 1000);
  };

  const columns: Column<Order>[] = [
    {
      key: 'id',
      label: 'Order Reference',
      cellClassName: 'text-[13px] font-bold text-[var(--primary)] tracking-tight'
    },
    {
      key: 'customer',
      label: 'Client Name',
      cellClassName: 'text-sm font-bold text-slate-900'
    },
    {
      key: 'product',
      label: 'Product Module',
      cellClassName: 'text-[12px] font-bold text-slate-500'
    },
    {
      key: 'date',
      label: 'Transaction Date',
      cellClassName: 'text-[11px] font-bold text-slate-400'
    },
    {
      key: 'amount',
      label: 'Gross Value',
      align: 'right',
      cellClassName: 'text-sm font-black text-slate-900 tabular-nums'
    },
    {
      key: 'status',
      label: 'Fulfillment',
      align: 'center',
      render: (order) => (
        <Badge variant={
          order.status === 'Delivered' ? 'success' :
            order.status === 'Processing' ? 'warning' :
              order.status === 'Shipped' ? 'default' : 'error'
        } className="text-[10px] font-black tracking-widest uppercase h-6 px-3 flex items-center justify-center w-fit mx-auto">
          {order.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (order) => (
        <button onClick={(e) => { e.stopPropagation(); showToast(`Opening details for ${order.id}`, 'info'); }} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all text-slate-300 hover:text-slate-900 active:scale-90">
          <MoreHorizontal size={18} strokeWidth={2.5} />
        </button>
      )
    }
  ];

  const actions = (
    <>
      <Button
        variant="outline"
        onClick={handleDownload}
        isLoading={isDownloading}
        leftIcon={!isDownloading && <Download size={18} />}
        title="Download CSV"
      />
      <Button
        size="sm"
        onClick={() => setIsCreateOpen(true)}
        leftIcon={<Plus size={14} strokeWidth={3} />}
      >
        Generate New Order
      </Button>
    </>
  );

  return (
    <PageLayout
      title="Order Management"
      description="Track and fulfill your enterprise orders with real-time accuracy."
      actions={actions}
    >

      <Card noPadding className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-white">
          <Input
            variant="white"
            inputSize="sm"
            className="max-w-md rounded-full shadow-sm"
            placeholder="Search orders..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            icon={<Search size={14} className="text-slate-400" strokeWidth={2.5} />}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => showToast('Advanced filtering options enabled', 'info')}
              leftIcon={<Filter size={14} strokeWidth={2.5} />}
            >
              Filters
            </Button>
          </div>
        </div>

        <DataTable
          data={filteredOrders}
          columns={columns}
          rowKey={(o) => o.id}
          onRowClick={(o) => showToast(`Opening record ${o.id}`, 'info')}
        />

        <div className="p-5 border-t border-slate-100 flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
          <p>Displaying {filteredOrders.length} active records</p>
          <div className="flex gap-2">
            <Button variant="outline" size="xs" disabled>Prev</Button>
            <Button variant="outline" size="xs">Next</Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Initialize New Transaction"
      >
        <form className="space-y-5" onSubmit={handleCreateOrder}>
          <Input
            label="Client Identity"
            required
            placeholder="Legal business name"
          />
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Asset Allocation</label>
            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all">
              <option value="">Select a product...</option>
              <option value="erp">Premium ERP Suite</option>
              <option value="cloud">Cloud Storage 1TB</option>
              <option value="security">Security Bundle</option>
            </select>
          </div>
          <div className="pt-6 flex justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit">Create Record</Button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  );
};
