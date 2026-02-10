
import React, { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable, Column } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Package, AlertTriangle, ArrowRight, Box, Search, RefreshCw, MoreVertical, TrendingDown } from 'lucide-react';
import { useApp } from '../App';
import { PageLayout } from '../components/layout/PageLayout';

interface StockItem {
  sku: string;
  name: string;
  stock: number;
  status: string;
  category: string;
}

const STOCK_DATA: StockItem[] = [
  { sku: 'ERP-001', name: 'Premium ERP License', stock: 120, status: 'In Stock', category: 'Software' },
  { sku: 'CLD-010', name: 'Storage Unit (Basic)', stock: 12, status: 'Low Stock', category: 'Infrastructure' },
  { sku: 'SEC-202', name: 'Encryption Key V2', stock: 450, status: 'In Stock', category: 'Security' },
  { sku: 'SRV-X86', name: 'Baremetal Instance', stock: 0, status: 'Out of Stock', category: 'Infrastructure' },
  { sku: 'API-PRO', name: 'Advanced API Key', stock: 89, status: 'In Stock', category: 'Software' },
  { sku: 'NET-004', name: 'CDN Node (Edge)', stock: 5, status: 'Low Stock', category: 'Infrastructure' },
  { sku: 'LCN-ENT', name: 'Enterprise Seat Pack', stock: 1200, status: 'In Stock', category: 'Software' },
  { sku: 'DB-X1', name: 'Postgres Instance (XL)', stock: 15, status: 'In Stock', category: 'Database' },
  { sku: 'AUTH-V3', name: 'Auth Module V3', stock: 340, status: 'In Stock', category: 'Security' },
];

export const InventoryPage: React.FC = () => {
  const { showToast, globalSearch, setGlobalSearch } = useApp();

  const filteredStock = useMemo(() => {
    return STOCK_DATA.filter(item =>
      item.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(globalSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [globalSearch]);

  const columns: Column<StockItem>[] = [
    {
      key: 'name',
      label: 'Item Details',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-all">
            <Box size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-none">{item.name}</span>
            <span className="text-[9px] font-mono text-slate-400 mt-1">{item.sku}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      cellClassName: 'text-[10px] font-bold text-slate-500'
    },
    {
      key: 'stock',
      label: 'Stock',
      cellClassName: 'text-xs font-black text-slate-900 tabular-nums'
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={
          item.status === 'In Stock' ? 'success' :
            item.status === 'Low Stock' ? 'warning' : 'error'
        } className="text-[9px] py-0 h-5 flex items-center justify-center w-fit">
          {item.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (item) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => { e.stopPropagation(); showToast(`Record: ${item.name}`, 'info'); }}
          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-600"
          leftIcon={<MoreVertical size={14} />}
        />
      )
    }
  ];

  const actions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => showToast('Generating report...', 'info')}
        leftIcon={<RefreshCw size={14} />}
      >
        Report
      </Button>
      <Button
        size="sm"
        className="rounded-full"
        onClick={() => showToast('Opening bulk editor', 'info')}
        leftIcon={<Package size={14} />}
      >
        Update
      </Button>
    </div>
  );

  return (
    <PageLayout
      title="Inventory Management"
      description="Real-time tracking of enterprise assets and resources."
      actions={actions}
    >

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card noPadding>
            <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
              <Input
                variant="white"
                inputSize="sm"
                className="max-w-xs rounded-full shadow-sm"
                placeholder="Search SKU indices..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                icon={<Search size={14} className="text-slate-400" strokeWidth={2.5} />}
              />
            </div>

            <DataTable
              data={filteredStock}
              columns={columns}
              rowKey={(i) => i.sku}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            className="border-amber-200/60 bg-amber-50/10 shadow-amber-900/5 shadow-xl"
            title="Operational Alert"
            description="Procurement threshold detected."
          >
            <div className="space-y-4 py-1">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-amber-200 text-amber-500 flex-shrink-0 shadow-sm animate-pulse">
                  <AlertTriangle size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">Critical Depletion</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                    3 priority SKUs are currently below the safety stock margin.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Urgency</span>
                  <span className="text-amber-600">85%</span>
                </div>
                <div className="h-1.5 w-full bg-amber-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => showToast('Procurement workflow initiated', 'success')}
                rightIcon={<ArrowRight size={12} strokeWidth={3} />}
              >
                Purchase
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
