import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import type { DashboardHighValueLead } from '../../lib/marketing-api';

const formatCurrency = (value: number | null | undefined) => {
  const v = value ?? 0;
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
};

interface HighValueLeadsListProps {
  leads: DashboardHighValueLead[] | null | undefined;
}

export const HighValueLeadsList: React.FC<HighValueLeadsListProps> = ({ leads: leadsProp }) => {
  const leads = leadsProp || [];
  return (
    <Card title="High Value Leads" description="Potential value or a quotation over ₹50L, in your scope" noPadding>
      {leads.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">None right now</div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}/edit`}
              className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/80 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{lead.company || lead.series || `Lead #${lead.id}`}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lead.value_source === 'quote' ? 'From quotation' : 'Potential value'}
                  {lead.status ? ` · ${lead.status}` : ''}
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-700 tabular-nums shrink-0">{formatCurrency(lead.value)}</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
};
