import React from 'react';
import { Inbox } from 'lucide-react';
import type { DashboardRecentLead } from '../../lib/marketing-api';
import { formatINRShort } from '../../lib/region-report';
import { ListCard, ListRow, CardSize } from './ListCard';
import { StatusBadge } from './StatusBadge';

interface RecentLeadsListProps {
  leads: DashboardRecentLead[] | null | undefined;
  title?: string;
  size?: CardSize;
}

/** Most recently created leads in scope. Status pill keeps the status's own colour. */
export const RecentLeadsList: React.FC<RecentLeadsListProps> = ({ leads: leadsProp, title = 'Recent Leads', size = 'medium' }) => {
  const leads = leadsProp || [];
  return (
    <ListCard
      title={title}
      subtitle="Most recently created, in your scope"
      size={size}
      viewAllHref="/leads"
      isEmpty={leads.length === 0}
      emptyIcon={<Inbox size={20} />}
      emptyMessage="No leads yet"
      emptyAction={{ label: '+ Add a lead', to: '/leads/new' }}
    >
      {leads.map((lead) => {
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
