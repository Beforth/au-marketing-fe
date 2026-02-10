
import React, { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { DataTable, Column } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Briefcase, TrendingUp, Search, Download } from 'lucide-react';
import { useApp } from '../App';
import { PageLayout } from '../components/layout/PageLayout';

interface LedgerEntry {
  label: string;
  amount: string;
  date: string;
  status: string;
}

const LEDGER_DATA: LedgerEntry[] = [
  { label: 'Cloud Hosting Sub', amount: '-$1,200.00', date: 'Oct 15, 2023', status: 'Paid' },
  { label: 'Client Retention Bonus', amount: '+$5,400.00', date: 'Oct 14, 2023', status: 'Hold' },
  { label: 'Payroll - Dept A', amount: '-$22,500.00', date: 'Oct 12, 2023', status: 'Paid' },
  { label: 'Maintenance Fee', amount: '-$450.00', date: 'Oct 10, 2023', status: 'Paid' },
  { label: 'Global Licensing', amount: '+$12,000.00', date: 'Oct 09, 2023', status: 'Pending' },
  { label: 'Hardware Procurement', amount: '-$8,200.00', date: 'Oct 08, 2023', status: 'Paid' },
  { label: 'Service Contract #A2', amount: '+$3,100.00', date: 'Oct 07, 2023', status: 'Paid' },
  { label: 'Marketing Retainer', amount: '-$2,500.00', date: 'Oct 05, 2023', status: 'Paid' },
  { label: 'Consultancy Retainer', amount: '+$1,800.00', date: 'Oct 04, 2023', status: 'Pending' },
  { label: 'Azure Dynamics (Monthly)', amount: '-$450.00', date: 'Oct 02, 2023', status: 'Paid' },
];

export const FinancialsPage: React.FC = () => {
  const { showToast, globalSearch, setGlobalSearch } = useApp();

  const handleDownload = () => {
    showToast('Generating fiscal year-end report...', 'info');
    setTimeout(() => showToast('Report generated successfully', 'success'), 1500);
  };

  const filteredLedger = useMemo(() => {
    return LEDGER_DATA.filter(item =>
      item.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
      item.status.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [globalSearch]);

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'label',
      label: 'Description',
      cellClassName: 'text-[11px] font-black text-slate-800 tracking-tight'
    },
    {
      key: 'date',
      label: 'Date',
      cellClassName: 'text-[9px] text-slate-400 font-bold uppercase tracking-widest'
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.status}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (item) => {
        const isPositive = item.amount.startsWith('+');
        return (
          <span className={`text-[11px] font-black tabular-nums ${isPositive ? 'text-emerald-600' : 'text-slate-900'}`}>
            {item.amount}
          </span>
        );
      }
    }
  ];

  const actions = (
    <Button
      onClick={handleDownload}
      size="sm"
      leftIcon={<Download size={14} strokeWidth={3} />}
    >
      Download Report
    </Button>
  );

  return (
    <PageLayout
      title="Financial Reporting"
      description="Real-time fiscal monitoring and revenue forecasting modules."
      actions={actions}
    >

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card onClick={() => showToast('Detailing Net Profit...', 'info')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <Badge variant="outline" className="text-slate-400 font-black uppercase tracking-widest text-[8px] py-0 border-slate-100">OCT 2023</Badge>
          </div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider leading-none mb-1">Net Profit</p>
          <h3 className="text-xl font-black text-slate-900 tabular-nums">$142,402.00</h3>
          <div className="flex items-center gap-1 mt-3 text-emerald-600 text-[9px] font-black uppercase">
            <ArrowUpRight size={12} strokeWidth={3} />
            <span>+12.5% vs LW</span>
          </div>
        </Card>

        <Card onClick={() => showToast('Detailing Op. Expenses...', 'info')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-rose-600" />
            </div>
            <Badge variant="success" className="font-black text-[8px] px-1 py-0 uppercase border-emerald-100 bg-emerald-50">Target Met</Badge>
          </div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider leading-none mb-1">Op. Expenses</p>
          <h3 className="text-xl font-black text-slate-900 tabular-nums">$45,210.00</h3>
          <div className="flex items-center gap-1 mt-3 text-rose-500 text-[9px] font-black uppercase">
            <ArrowDownRight size={12} strokeWidth={3} />
            <span>-2.1% efficiency</span>
          </div>
        </Card>

        <Card onClick={() => showToast('Detailing Credit Risk...', 'info')}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <CreditCard size={16} className="text-amber-600" />
            </div>
            <TrendingUp size={14} className="text-slate-300" />
          </div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-wider leading-none mb-1">Credit Risk</p>
          <h3 className="text-xl font-black text-slate-900 tabular-nums">$12,000.45</h3>
          <div className="mt-4">
            <div className="w-full bg-slate-50 rounded-full h-1 overflow-hidden">
              <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: '45%' }}></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <Card title="Revenue Stream" description="Q4 Predictive analysis vs Actual performance.">
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full border-2 border-[var(--primary)] border-dashed bg-transparent"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Predicted</span>
            </div>
          </div>
          <div className="h-[140px] flex items-end gap-1.5 px-2 relative group">
            <div className="absolute inset-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-slate-200 w-full h-px"></div>
              <div className="border-t border-slate-200 w-full h-px"></div>
              <div className="border-t border-slate-200 w-full h-px"></div>
            </div>
            {[
              { a: 65, p: 70 },
              { a: 45, p: 50 },
              { a: 95, p: 90 },
              { a: 75, p: 80 },
              { a: 55, p: 65 },
              { a: 85, p: 85 },
              { a: 0, p: 100 }
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group/bar">
                {d.p > 0 && (
                  <div
                    className="absolute bottom-6 w-full border-t-2 border-indigo-200 border-dashed z-0 opacity-40 group-hover/bar:opacity-100 transition-opacity"
                    style={{ bottom: `calc(${d.p}% + 24px)` }}
                  />
                )}
                <div
                  className={`w-full ${d.a === 0 ? 'bg-slate-100' : 'bg-[var(--primary)]/30 group-hover/bar:bg-[var(--primary)]'} rounded-sm transition-all duration-300 cursor-pointer z-10`}
                  style={{ height: d.a > 0 ? `${d.a}%` : '4px' }}
                ></div>
                <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter mt-1">W{i + 1}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card noPadding title="Ledger Highlights" description="Latest verified system entries.">
          <div className="px-5 py-3 border-b border-slate-100 bg-white">
            <Input
              variant="white"
              inputSize="sm"
              className="max-w-xs rounded-full shadow-sm"
              placeholder="Filter ledger entries..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onClear={() => setGlobalSearch('')}
              icon={<Search size={14} className="text-slate-400" strokeWidth={2.5} />}
            />
          </div>
          <DataTable
            data={filteredLedger}
            columns={columns}
            rowKey={(item) => item.label + item.date}
            className="border-none"
          />
        </Card>
      </div>
    </PageLayout>
  );
};
