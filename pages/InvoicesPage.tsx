
import React, { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable, Column } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { FileText, MoreHorizontal, Search, Plus, Filter } from 'lucide-react';
import { useApp } from '../App';
import { PageLayout } from '../components/layout/PageLayout';

interface Invoice {
  id: string;
  customer: string;
  amount: string;
  date: string;
  status: string;
}

const INVOICES: Invoice[] = [
  { id: 'INV-2023-001', customer: 'TechFlow Inc.', amount: '$12,400.00', date: 'Oct 12, 2023', status: 'Paid' },
  { id: 'INV-2023-002', customer: 'Rome Logistics', amount: '$4,200.00', date: 'Oct 15, 2023', status: 'Pending' },
  { id: 'INV-2023-003', customer: 'Global Traders', amount: '$8,900.00', date: 'Oct 08, 2023', status: 'Overdue' },
  { id: 'INV-2023-004', customer: 'Studio Hub', amount: '$1,200.00', date: 'Oct 18, 2023', status: 'Draft' },
  { id: 'INV-2023-005', customer: 'Umbrella Ops', amount: '$24,000.00', date: 'Oct 20, 2023', status: 'Pending' },
  { id: 'INV-2023-006', customer: 'Hooli Corp', amount: '$56,000.00', date: 'Oct 22, 2023', status: 'Paid' },
  { id: 'INV-2023-007', customer: 'Pied Piper', amount: '$1,500.00', date: 'Oct 23, 2023', status: 'Paid' },
  { id: 'INV-2023-008', customer: 'Initech', amount: '$3,400.00', date: 'Oct 24, 2023', status: 'Overdue' },
  { id: 'INV-2023-009', customer: 'Tyrell Corp', amount: '$94,000.00', date: 'Oct 25, 2023', status: 'Pending' },
  { id: 'INV-2023-010', customer: 'Weyland-Yutani', amount: '$312,000.00', date: 'Oct 26, 2023', status: 'Paid' },
];

export const InvoicesPage: React.FC = () => {
  const { showToast, globalSearch, setGlobalSearch } = useApp();

  const filteredInvoices = useMemo(() => {
    return INVOICES.filter(inv =>
      inv.id.toLowerCase().includes(globalSearch.toLowerCase()) ||
      inv.customer.toLowerCase().includes(globalSearch.toLowerCase()) ||
      inv.status.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [globalSearch]);

  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      label: 'Invoice ID',
      render: (inv) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
            <FileText size={14} className="text-slate-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 leading-none">{inv.id}</span>
        </div>
      )
    },
    { key: 'customer', label: 'Customer', cellClassName: 'text-sm font-semibold text-slate-600' },
    { key: 'date', label: 'Issued Date', cellClassName: 'text-xs font-medium text-slate-500' },
    { key: 'amount', label: 'Amount', align: 'right', cellClassName: 'text-sm font-black text-slate-900 tabular-nums' },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (inv) => (
        <Badge variant={
          inv.status === 'Paid' ? 'success' :
            inv.status === 'Pending' ? 'warning' :
              inv.status === 'Overdue' ? 'error' : 'default'
        } className="text-[10px] py-0">
          {inv.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (inv) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => showToast(`Previewing ${inv.id}`, 'info')}
          className="text-slate-400 hover:text-indigo-600"
          leftIcon={<MoreHorizontal size={14} />}
        />
      )
    }
  ];

  const actions = (
    <Button
      onClick={() => showToast('Invoice generator launched', 'info')}
      leftIcon={<Plus size={16} />}
      className="rounded-full"
    >
      New Invoice
    </Button>
  );

  return (
    <PageLayout
      title="Billing & Invoices"
      description="Issue and manage enterprise billing documents."
      actions={actions}
    >

      <Card noPadding className="overflow-hidden">
        <div className="p-4 flex flex-wrap gap-4 items-center justify-between bg-white border-b border-slate-100">
          <Input
            variant="white"
            inputSize="sm"
            className="max-w-xs rounded-full shadow-sm"
            placeholder="Search billing..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            icon={<Search size={14} className="text-slate-400" strokeWidth={2.5} />}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => showToast('Filter menu applied', 'info')}
              leftIcon={<Filter size={14} />}
            >
              Filter
            </Button>
          </div>
        </div>

        <DataTable
          data={filteredInvoices}
          columns={columns}
          rowKey={(i) => i.id}
        />
      </Card>
    </PageLayout>
  );
};
