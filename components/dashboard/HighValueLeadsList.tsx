import React from 'react';
import { Gem } from 'lucide-react';
import type { DashboardHighValueLead } from '../../lib/marketing-api';
import { formatINRShort } from '../../lib/region-report';
import { ListCard, ListRow, CardSize } from './ListCard';

interface HighValueLeadsListProps {
  leads: DashboardHighValueLead[] | null | undefined;
  size?: CardSize;
}

/** Leads with a potential value or quotation over ₹50L, in scope. */
export const HighValueLeadsList: React.FC<HighValueLeadsListProps> = ({ leads: leadsProp, size = 'medium' }) => {
  const leads = leadsProp || [];
  return (
    <ListCard
      title="High Value Leads"
      subtitle="Potential value or a quotation over ₹50L, in your scope"
      size={size}
      viewAllHref="/leads"
      isEmpty={leads.length === 0}
      emptyIcon={<Gem size={20} />}
      emptyMessage="None right now"
      emptyAction={{ label: 'Open Leads board', to: '/leads' }}
    >
      {leads.map((lead) => {
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
    </ListCard>
  );
};
