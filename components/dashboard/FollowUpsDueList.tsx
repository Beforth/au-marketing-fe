import React, { useState } from 'react';
import { CalendarCheck, CalendarClock, ExternalLink, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { marketingAPI, DashboardFollowUp } from '../../lib/marketing-api';
import { useAppSelector } from '../../store/hooks';
import { selectHasPermission } from '../../store/slices/authSlice';
import { useApp } from '../../App';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ListCard, ListRow, RowAction, CardSize } from './ListCard';
import { StatusBadge } from './StatusBadge';

interface FollowUpsDueListProps {
  followUps: DashboardFollowUp[] | null | undefined;
  title?: string;
  size?: CardSize;
  /** Called after a call is logged or a follow-up rescheduled, so the dashboard can reload. */
  onChanged?: () => void;
}

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
};

const pad = (n: number) => String(n).padStart(2, '0');
/** Tomorrow 10:00 as a datetime-local value — the default new follow-up time. */
const tomorrowTen = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
};

/**
 * Leads whose follow-up is due, soonest first. Overdue pulses — it needs action now. People who can
 * edit leads get row actions: Log call (adds a "call" entry to the lead's enquiry log) and
 * Reschedule (sets a new one-time follow-up) — the same API calls the lead page uses.
 */
export const FollowUpsDueList: React.FC<FollowUpsDueListProps> = ({ followUps: followUpsProp, title = 'Follow-ups Due — Act Now', size = 'big', onChanged }) => {
  const followUps = followUpsProp || [];
  const overdue = followUps.filter((f) => f.due_label === 'Overdue').length;
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_lead'));
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [calling, setCalling] = useState<DashboardFollowUp | null>(null);
  const [note, setNote] = useState('');
  const [moving, setMoving] = useState<DashboardFollowUp | null>(null);
  const [nextAt, setNextAt] = useState(tomorrowTen());
  const [saving, setSaving] = useState(false);

  const nameOf = (f: DashboardFollowUp) => f.company || f.series || `Lead #${f.id}`;

  const logCall = async () => {
    if (!calling) return;
    setSaving(true);
    try {
      await marketingAPI.createLeadActivity(calling.id, {
        activity_type: 'call',
        title: 'Follow-up call',
        description: note.trim() || undefined,
      });
      showToast(`Call logged on ${nameOf(calling)}`, 'success');
      setCalling(null);
      setNote('');
      onChanged?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not log the call', 'error');
    } finally {
      setSaving(false);
    }
  };

  const reschedule = async () => {
    if (!moving || !nextAt) return;
    const at = new Date(nextAt);
    if (Number.isNaN(at.getTime())) return;
    setSaving(true);
    try {
      await marketingAPI.scheduleLeadFollowUp(moving.id, { next_follow_up_at: at.toISOString(), follow_up_reminder_type: 'once' });
      showToast(`Follow-up moved to ${when(at.toISOString())}`, 'success');
      setMoving(null);
      onChanged?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not reschedule', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ListCard
        title={title}
        subtitle="Soonest first, in your scope"
        size={size}
        viewAllHref="/leads"
        viewAllLabel="Leads board"
        headerExtra={overdue > 0 ? <StatusBadge status="danger" label={`${overdue} overdue`} pulse /> : undefined}
        isEmpty={followUps.length === 0}
        emptyIcon={<CalendarCheck size={20} />}
        emptyMessage="Nothing due — you're all caught up"
        emptyAction={{ label: 'Open Leads board', to: '/leads' }}
        endNote="That's everything due"
      >
        {followUps.map((f) => {
          const name = nameOf(f);
          const tone = f.due_label === 'Overdue' ? 'danger' : f.due_label === 'Today' ? 'pending' : 'neutral';
          return (
            <ListRow
              key={f.id}
              to={`/leads/${f.id}/edit`}
              name={name}
              avatarTone={tone === 'danger' ? 'rose' : tone === 'pending' ? 'amber' : 'slate'}
              title={name}
              subtitle={[f.series, when(f.next_follow_up_at)].filter(Boolean).join(' · ')}
              trailing={<StatusBadge status={tone} label={f.due_label} pulse={tone === 'danger'} />}
              actions={canEdit ? (
                <>
                  <RowAction label="Log call" tone="emerald" onClick={() => { setNote(''); setCalling(f); }}><Phone size={14} /></RowAction>
                  <RowAction label="Reschedule" onClick={() => { setNextAt(tomorrowTen()); setMoving(f); }}><CalendarClock size={14} /></RowAction>
                  <RowAction label="Open lead" onClick={() => navigate(`/leads/${f.id}/edit`)}><ExternalLink size={14} /></RowAction>
                </>
              ) : undefined}
            />
          );
        })}
      </ListCard>

      <Modal
        isOpen={!!calling}
        onClose={() => setCalling(null)}
        title={`Log call — ${calling ? nameOf(calling) : ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCalling(null)} disabled={saving}>Cancel</Button>
            <Button onClick={logCall} disabled={saving}>{saving ? 'Saving…' : 'Log call'}</Button>
          </div>
        }
      >
        <label className="block text-xs font-semibold text-slate-700 mb-1">What was discussed? (optional)</label>
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Asked for revised price; call back after their review on Friday"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <p className="mt-2 text-xs text-slate-500">Adds a "call" entry to this lead's enquiry log. To change the follow-up date too, use Reschedule.</p>
      </Modal>

      <Modal
        isOpen={!!moving}
        onClose={() => setMoving(null)}
        title={`Reschedule follow-up — ${moving ? nameOf(moving) : ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMoving(null)} disabled={saving}>Cancel</Button>
            <Button onClick={reschedule} disabled={saving || !nextAt}>{saving ? 'Saving…' : 'Reschedule'}</Button>
          </div>
        }
      >
        <label className="block text-xs font-semibold text-slate-700 mb-1">Next follow-up</label>
        <input
          type="datetime-local"
          value={nextAt}
          onChange={(e) => setNextAt(e.target.value)}
          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <p className="mt-2 text-xs text-slate-500">Sets a one-time follow-up (any repeating reminder on this lead is replaced).</p>
      </Modal>
    </>
  );
};
