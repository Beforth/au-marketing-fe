/**
 * Service module — Stage 4: one complaint — details, actions and full history.
 * Route: /service/complaints/:id
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { ArrowLeft, Check, RotateCcw, UserPlus } from 'lucide-react';
import {
  marketingAPI,
  HRMSEmployee,
  ServiceComplaint,
  ServiceComplaintStatus,
  ServiceIssueType,
} from '../lib/marketing-api';

const STATUS_VARIANT: Record<ServiceComplaintStatus, 'outline' | 'warning' | 'success' | 'error'> = {
  pending_approval: 'error',
  open: 'outline',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'outline',
};
const STATUS_LABEL: Record<ServiceComplaintStatus, string> = {
  pending_approval: 'Needs approval',
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};
const ISSUE_LABEL: Record<ServiceIssueType, string> = { hw: 'Hardware (H/W)', sw: 'Software (S/W)', plc: 'PLC' };

const ACTIVITY_TEXT: Record<string, string> = {
  created: 'raised the complaint',
  edited: 'edited the details',
  assigned: 'assigned it',
  reassigned: 'reassigned it',
  status_change: 'changed the status',
  approved: 'approved it',
  reopened: 'reopened it',
  closed: 'closed it',
  comment: 'commented',
};

export const ServiceComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const cid = Number(id);
  const navigate = useNavigate();
  const { showToast } = useApp();

  const canView = useAppSelector(selectHasPermission('service.view'));
  const canManage = useAppSelector(selectHasPermission('service.manage_complaint'));
  const canApprove = useAppSelector(selectHasPermission('service.approve_complaint'));
  const canReopen = useAppSelector(selectHasPermission('service.reopen_complaint'));
  const canClose = useAppSelector(selectHasPermission('service.close_complaint'));

  const [c, setC] = useState<ServiceComplaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');

  // assign modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [empQuery, setEmpQuery] = useState('');
  const [empResults, setEmpResults] = useState<HRMSEmployee[]>([]);

  // reopen / close modals
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenNote, setReopenNote] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const [closeHours, setCloseHours] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setC(await marketingAPI.getServiceComplaint(cid));
    } catch (e: any) {
      showToast(e?.message || 'Failed to load complaint', 'error');
      navigate('/service/complaints');
    } finally {
      setIsLoading(false);
    }
  }, [cid, navigate, showToast]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    load();
  }, [canView, load]);

  const run = async (fn: () => Promise<ServiceComplaint>, okMsg: string) => {
    setBusy(true);
    try {
      setC(await fn());
      showToast(okMsg, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const searchEmployees = (v: string) => {
    setEmpQuery(v);
    const term = v.trim();
    if (term.length < 2) return setEmpResults([]);
    marketingAPI.getEmployees({ search: term, page_size: 15, status: 'active' })
      .then((r) => setEmpResults(r.employees || []))
      .catch(() => setEmpResults([]));
  };

  const doAssign = async (emp: HRMSEmployee) => {
    const uid = emp.user_id ?? emp.id;
    const name = `${emp.first_name} ${emp.last_name}`.trim() || emp.username || `#${uid}`;
    await run(() => marketingAPI.assignServiceComplaint(cid, uid, name), `Assigned to ${name}`);
    setAssignOpen(false);
    setEmpQuery('');
    setEmpResults([]);
    load();
  };

  const timeline = useMemo(() => (c?.activities ?? []).slice().reverse(), [c]);

  const breadcrumbs = [
    { label: 'Service', href: '/service/contracts' },
    { label: 'Complaints', href: '/service/complaints' },
    { label: c?.display_number || `#${cid}` },
  ];

  if (!canView) {
    return <PageLayout title="Complaint" breadcrumbs={breadcrumbs}><Card><p className="text-slate-600">No permission.</p></Card></PageLayout>;
  }
  if (isLoading || !c) {
    return (
      <PageLayout title="Complaint" breadcrumbs={breadcrumbs}>
        <Card><div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`${c.display_number} — ${c.title}`}
      description={`${ISSUE_LABEL[c.issue_type]} · ${c.customer_name || `Customer #${c.customer_id}`}${c.plant_name ? ` · ${c.plant_name}` : ''}`}
      breadcrumbs={breadcrumbs}
      actions={<Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/service/complaints')}>Back</Button>}
    >
      {/* Status + actions */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">Status</span>
          <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
          {c.reopen_count > 0 && <span className="text-xs text-amber-600">reopened ×{c.reopen_count}</span>}
          <div className="flex-1" />

          {canApprove && c.status === 'pending_approval' && (
            <Button size="sm" isLoading={busy} leftIcon={<Check size={14} />} onClick={() => run(() => marketingAPI.approveServiceComplaint(cid), 'Approved')}>
              Approve
            </Button>
          )}
          {canManage && (c.status === 'open' || c.status === 'in_progress') && (
            <>
              {c.status === 'open' && (
                <Button size="sm" variant="outline" isLoading={busy} onClick={() => run(() => marketingAPI.setServiceComplaintStatus(cid, 'in_progress'), 'Work started')}>
                  Start work
                </Button>
              )}
              <Button size="sm" isLoading={busy} onClick={() => run(() => marketingAPI.setServiceComplaintStatus(cid, 'resolved'), 'Marked resolved')}>
                Mark resolved
              </Button>
            </>
          )}
          {canManage && c.status === 'resolved' && (
            <Button size="sm" variant="ghost" isLoading={busy} onClick={() => run(() => marketingAPI.setServiceComplaintStatus(cid, 'in_progress'), 'Back to in progress')}>
              Not fixed — resume
            </Button>
          )}
          {canClose && (c.status === 'resolved' || c.status === 'in_progress') && (
            <Button size="sm" isLoading={busy} onClick={() => { setCloseNote(''); setCloseHours(c.actual_time_hours ? String(c.actual_time_hours) : ''); setCloseOpen(true); }}>
              Close
            </Button>
          )}
          {canReopen && c.status === 'closed' && (
            <Button size="sm" leftIcon={<RotateCcw size={14} />} onClick={() => { setReopenNote(''); setReopenOpen(true); }}>
              Reopen
            </Button>
          )}
        </div>
        {c.status === 'pending_approval' && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            Found during a visit — a coordinator must approve this before any work on it starts.
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: details + timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Problem">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.description || <span className="text-slate-400">No description.</span>}</p>
          </Card>

          <Card title="History">
            <div className="space-y-3">
              {timeline.map((a) => (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-slate-800">
                      <span className="font-medium">{a.created_by_username || 'Someone'}</span> {ACTIVITY_TEXT[a.activity_type] || a.activity_type}
                      {a.from_value && a.to_value && <span className="text-slate-500"> ({a.from_value} → {a.to_value})</span>}
                      {!a.from_value && a.to_value && a.activity_type !== 'created' && <span className="text-slate-500"> → {a.to_value}</span>}
                    </span>
                    {a.note && <div className="text-slate-600 mt-0.5">{a.note}</div>}
                    <div className="text-[11px] text-slate-400 mt-0.5">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
            {canManage && c.status !== 'closed' && (
              <div className="mt-4 flex gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" className="flex-1" />
                <Button
                  size="sm"
                  disabled={!comment.trim() || busy}
                  onClick={async () => {
                    await run(() => marketingAPI.commentServiceComplaint(cid, comment.trim()), 'Comment added');
                    setComment('');
                  }}
                >
                  Post
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right: meta */}
        <div className="space-y-4">
          <Card title="Assigned to">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-800">{c.assignee_username || <span className="text-slate-400">Unassigned</span>}</span>
              {canManage && c.status !== 'closed' && (
                <Button size="xs" variant="outline" leftIcon={<UserPlus size={13} />} onClick={() => setAssignOpen(true)}>
                  {c.assignee_username ? 'Reassign' : 'Assign'}
                </Button>
              )}
            </div>
          </Card>

          <Card title="Time">
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-slate-500">Planned</dt><dd>{c.planned_time_hours != null ? `${c.planned_time_hours} h` : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Actual</dt><dd>{c.actual_time_hours != null ? `${c.actual_time_hours} h` : '—'}</dd></div>
            </dl>
          </Card>

          <Card title="Details">
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd>{ISSUE_LABEL[c.issue_type]}</dd></div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Contract</dt>
                <dd className="text-right">
                  {c.contract_id ? (
                    <button className="text-blue-600 hover:underline" onClick={() => navigate(`/service/contracts/${c.contract_id}/edit`)}>
                      {c.contract_number || `#${c.contract_id}`}{c.contract_type ? ` · ${c.contract_type}` : ''}
                    </button>
                  ) : (
                    <span className="text-slate-500">Not under contract</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between"><dt className="text-slate-500">Source</dt><dd>{c.source === 'found_on_visit' ? 'Found on a visit' : 'Customer'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Raised</dt><dd>{new Date(c.created_at).toLocaleDateString()}</dd></div>
              {c.approved_by_username && <div className="flex justify-between"><dt className="text-slate-500">Approved by</dt><dd>{c.approved_by_username}</dd></div>}
              {c.closed_at && <div className="flex justify-between"><dt className="text-slate-500">Closed</dt><dd>{new Date(c.closed_at).toLocaleDateString()}</dd></div>}
            </dl>
          </Card>
        </div>
      </div>

      {/* Assign modal */}
      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title={c.assignee_username ? 'Reassign complaint' : 'Assign complaint'}>
        <Input value={empQuery} onChange={(e) => searchEmployees(e.target.value)} placeholder="Search employee by name…" autoFocus />
        <div className="mt-2 divide-y divide-slate-100 border border-slate-200 rounded-lg max-h-64 overflow-auto">
          {empResults.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">Type at least 2 characters.</p>
          ) : (
            empResults.map((e) => (
              <button key={e.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => doAssign(e)}>
                <span className="font-medium">{`${e.first_name} ${e.last_name}`.trim() || e.username}</span>
                {e.designation && <span className="text-slate-400 text-xs"> · {e.designation}</span>}
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Reopen modal */}
      <Modal
        isOpen={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reopen complaint"
        footer={
          <>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>Cancel</Button>
            <Button
              disabled={reopenNote.trim().length < 3 || busy}
              onClick={async () => {
                await run(() => marketingAPI.reopenServiceComplaint(cid, reopenNote.trim()), 'Complaint reopened');
                setReopenOpen(false);
                load();
              }}
            >
              Reopen
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 mb-3">The reopened complaint gets an “i” added to its number ({c.display_number} → {c.display_number}i).</p>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Why is it being reopened? <span className="text-rose-500">*</span></label>
        <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} value={reopenNote} onChange={(e) => setReopenNote(e.target.value)} />
      </Modal>

      {/* Close modal */}
      <Modal
        isOpen={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Close complaint"
        footer={
          <>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button
              disabled={busy}
              onClick={async () => {
                await run(() => marketingAPI.closeServiceComplaint(cid, closeNote.trim() || undefined, closeHours ? Number(closeHours) : null), 'Complaint closed');
                setCloseOpen(false);
                load();
              }}
            >
              Close complaint
            </Button>
          </>
        }
      >
        <p className="text-xs text-amber-600 mb-3">Note: once service reports are added (later stage), closing will require the report to be submitted first.</p>
        <Input label="Actual time taken (hours)" type="number" min={0} step="0.5" value={closeHours} onChange={(e) => setCloseHours(e.target.value)} />
        <label className="block text-sm font-medium text-slate-700 mb-1.5 mt-3">Closing note (optional)</label>
        <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
      </Modal>
    </PageLayout>
  );
};
