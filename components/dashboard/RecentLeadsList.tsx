import React, { useState } from 'react';
import { Inbox, Gem } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DashboardRecentLead, DashboardHighValueLead } from '../../lib/marketing-api';
import { formatINRShort } from '../../lib/region-report';
import { ListCard, ListRow, CardSize } from './ListCard';
import { StatusBadge } from './StatusBadge';

interface RecentLeadsListProps {
  leads: DashboardRecentLead[] | null | undefined;
  /** When given (domain head / super admin), the card gets a "High value" tab next to "Recent". */
  highValueLeads?: DashboardHighValueLead[] | null;
  title?: string;
  size?: CardSize;
}

/** Most recently created leads in scope (status pill keeps the status's own colour), plus an optional tab of leads over ₹50L. */
export const RecentLeadsList: React.FC<RecentLeadsListProps> = ({ leads: leadsProp, highValueLeads, title = 'Recent Leads', size = 'medium' }) => {
  const [tab, setTab] = useState<'recent' | 'high'>('recent');
  const hasTabs = highValueLeads !== undefined;
  const showHigh = hasTabs && tab === 'high';
  const leads = leadsProp || [];
  const highLeads = highValueLeads || [];
  const tabButton = (key: 'recent' | 'high', label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setTab(key)}
      aria-pressed={tab === key}
      className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-colors', tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
    >
      {label}
    </button>
  );
  return (
    <ListCard
      title={hasTabs ? 'Leads' : title}
      subtitle={showHigh ? 'Potential value or a quotation over ₹50L, in your scope' : 'Most recently created, in your scope'}
      headerExtra={hasTabs ? <div className="inline-flex rounded-lg bg-slate-100 p-0.5">{tabButton('recent', 'Recent')}{tabButton('high', 'High value')}</div> : undefined}
      size={size}
      viewAllHref="/leads"
      isEmpty={showHigh ? highLeads.length === 0 : leads.length === 0}
      emptyIcon={showHigh ? <Gem size={20} /> : <Inbox size={20} />}
      emptyMessage={showHigh ? 'None right now' : 'No leads yet'}
      emptyAction={{ label: '+ Add a lead', to: '/leads/new' }}
    >
      {showHigh && highLeads.map((lead) => {
        const name = lead.company || lead.series || `Lead #${lead.id}`;
        return (
          <ListRow
            key={lead.id}
            to={`/leads/${lead.id}/edit`}
            name={name}
            avatarTone="emerald"
            title={name}
            subtitle={[lead.value_source === 'quote' ? 'From quotation' : 'Potential value', lead.status].filter(Boolean).join(' · ')}
            trailing={<span className="text-sm font-bold text-emerald-700 tabular-nums">{formatINRShort(lead.value)}</span>}
          />
        );
      })}
      {!showHigh && leads.map((lead) => {
        const name = lead.company || lead.series || `Lead #${lead.id}`;
        const created = new Date(lead.created_at);
        return (
          <ListRow
            key={lead.id}
            to={`/leads/${lead.id}/edit`}
            name={name}
            title={name}
            // Value sits in the sub-line so the name keeps its room when the card is narrow.
            subtitle={[
              lead.series,
              lead.potential_value != null ? formatINRShort(lead.potential_value) : '',
              Number.isNaN(created.getTime()) ? '' : created.toLocaleDateString('en-GB'),
            ].filter(Boolean).join(' · ')}
            trailing={
              <>
                {lead.status && (
                  <StatusBadge
                    status="info"
                    className="max-w-[7.5rem] truncate"
                    label={lead.status}
                    style={lead.status_color ? { backgroundColor: `${lead.status_color}1a`, color: lead.status_color, borderColor: `${lead.status_color}40` } : undefined}
                  />
                )}
              </>
            }
          />
        );
      })}
    </ListCard>
  );
};
