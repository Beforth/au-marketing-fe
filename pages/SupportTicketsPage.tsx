import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { marketingAPI, SupportTicket } from '../lib/marketing-api';
import {
  Bug,
  Lightbulb,
  ExternalLink,
  Ticket,
  Loader2,
  Send,
} from 'lucide-react';

const CRM_TICKETS_URL = 'https://crm.beforth.in/products/4/tickets/';

export const SupportTicketsPage: React.FC = () => {
  const { showToast } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const [ticketType, setTicketType] = useState<'bug' | 'feature'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await marketingAPI.getTickets();
      setTickets(res.tickets ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await marketingAPI.createTicket({
        title: title.trim(),
        description: description.trim() || undefined,
        ticket_type: ticketType,
      });
      if (res.crm_synced) {
        showToast('Ticket submitted successfully', 'success');
      } else {
        showToast(`Ticket saved, but couldn't reach the CRM (${res.crm_sync_error || 'unknown error'}). Our team will follow up manually.`, 'error');
      }
      setTitle('');
      setDescription('');
      await loadTickets();
    } catch (e: any) {
      showToast(e?.message || 'Failed to create ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="Support & Tickets"
      breadcrumbs={[{ label: 'Support & Tickets', href: '/support' }]}
    >
      {/* Inline create ticket form */}
      <Card className="!min-h-0 mb-6">
        <div className="space-y-5">
          <Select
            label="Type"
            options={[
              { value: 'bug', label: 'Report a Bug' },
              { value: 'feature', label: 'Request a Feature' },
            ]}
            value={ticketType}
            onChange={(v) => v && setTicketType(v as 'bug' | 'feature')}
            placeholder="Select type…"
            clearable={false}
          />

          <Input
            label="Title"
            placeholder={ticketType === 'bug' ? 'e.g. Login button not working on mobile' : 'e.g. Dark mode support'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 ml-0.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-600 transition-all placeholder:text-slate-400 min-h-[100px] resize-y"
              placeholder={
                ticketType === 'bug'
                  ? 'Steps to reproduce:\n1. Go to ...\n2. Click on ...\n3. See error\n\nExpected: ...'
                  : 'Describe your idea. What problem does it solve? How should it work?'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || submitting}
              isLoading={submitting}
              rightIcon={!submitting ? <Send size={14} /> : undefined}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Ticket History */}
      <Card title="My Tickets">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
              <Ticket size={28} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">No tickets yet</p>
              <p className="text-xs text-slate-400 mt-1">Submit a ticket above and it will show up here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Title</th>
                  <th className="text-left pb-3 pr-4">Type</th>
                  <th className="text-left pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      {t.ticket_id ? (
                        <a
                          href={`${CRM_TICKETS_URL}${t.ticket_id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                        >
                          #{t.ticket_id}
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">{t.title}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        t.ticket_type === 'bug' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {t.ticket_type === 'bug' ? <Bug size={10} /> : <Lightbulb size={10} />}
                        {t.ticket_type === 'bug' ? 'Bug' : 'Feature'}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500 whitespace-nowrap">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
};
