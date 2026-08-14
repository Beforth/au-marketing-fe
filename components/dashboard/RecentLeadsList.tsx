import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import type { DashboardRecentLead } from '../../lib/marketing-api';

const formatCurrency = (value: number) => {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)} K`;
  return `₹${value}`;
};

interface RecentLeadsListProps {
  leads: DashboardRecentLead[] | null | undefined;
  title?: string;
}

export const RecentLeadsList: React.FC<RecentLeadsListProps> = ({ leads: leadsProp, title = 'Recent Leads' }) => {
  const leads = leadsProp || [];
  return (
    <Card title={title} description="Most recently created, in your scope" noPadding>
      {leads.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">No leads yet</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              to={`/leads/${lead.id}/edit`}
              className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-slate-50/80 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{lead.company || lead.series || `Lead #${lead.id}`}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{lead.series || `#${lead.id}`}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {lead.potential_value != null && (
                  <span className="text-sm font-semibold text-slate-700 tabular-nums">{formatCurrency(lead.potential_value)}</span>
                )}
                {lead.status && (
                  <span
                    className="text-[11px] font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: lead.status_color ? `${lead.status_color}1a` : '#eff6ff',
                      color: lead.status_color || '#2563eb',
                    }}
                  >
                    {lead.status}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
};
