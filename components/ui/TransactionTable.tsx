
import React, { useMemo } from 'react';
import { RECENT_TRANSACTIONS } from '../../constants';
import { Badge } from './Badge';
import { DataTable, Column } from './DataTable';
import { Button } from './Button';
import { MoreHorizontal } from 'lucide-react';
import { Transaction } from '../../types';
import { useApp } from '../../App';

const EXTENDED_TRANSACTIONS: Transaction[] = [
  ...RECENT_TRANSACTIONS,
  { id: '6', customer: 'Sophia Lopez', email: 'sophia@example.com', amount: '$1,250.00', status: 'Completed', date: '2023-06-28' },
  { id: '7', customer: 'Ethan Hunt', email: 'ethan@imf.gov', amount: '$8,420.00', status: 'Pending', date: '2023-06-29' },
  { id: '8', customer: 'Mia Wallace', email: 'mia@pulp.com', amount: '$500.00', status: 'Canceled', date: '2023-06-30' },
  { id: '9', customer: 'Tyler Durden', email: 'tyler@fightclub.com', amount: '$0.00', status: 'Completed', date: '2023-07-01' },
  { id: '10', customer: 'Ellen Ripley', email: 'ripley@weyland.com', amount: '$3,100.00', status: 'Completed', date: '2023-07-02' },
];

export const TransactionTable: React.FC = () => {
  const { globalSearch } = useApp();

  const filteredTransactions = useMemo(() => {
    const term = globalSearch.toLowerCase();
    return EXTENDED_TRANSACTIONS.filter(tx =>
      tx.customer.toLowerCase().includes(term) ||
      tx.email.toLowerCase().includes(term) ||
      tx.status.toLowerCase().includes(term)
    );
  }, [globalSearch]);

  const columns: Column<Transaction>[] = [
    {
      key: 'customer',
      label: 'Customer Identity',
      render: (tx) => (
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-900 leading-tight uppercase tracking-tight">{tx.customer}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{tx.email}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (tx) => (
        <Badge variant={
          tx.status === 'Completed' ? 'success' :
            tx.status === 'Pending' ? 'warning' : 'error'
        } className="text-[9px] py-0 h-4 flex items-center justify-center font-black uppercase tracking-tighter">
          {tx.status}
        </Badge>
      )
    },
    {
      key: 'date',
      label: 'Timestamp',
      cellClassName: 'text-[10px] font-bold text-slate-400 tabular-nums'
    },
    {
      key: 'amount',
      label: 'Volume',
      align: 'right',
      cellClassName: 'text-xs font-black text-slate-900 text-right tabular-nums'
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: () => (
        <Button
          variant="ghost"
          size="xs"
          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-600"
          leftIcon={<MoreHorizontal size={14} />}
        />
      )
    }
  ];

  return (
    <div className="min-w-full">
      <DataTable
        data={filteredTransactions}
        columns={columns}
        rowKey={(tx) => tx.id}
      />
    </div>
  );
};
