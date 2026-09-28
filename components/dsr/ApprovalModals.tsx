import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

/** What the shared Approve / Reject pair is currently pointed at (guide §9.5: one pair per page). */
export interface ApprovalTarget {
  id: number;
  kind: 'dsr' | 'expense';
  employeeName: string;
  date: string;
}

const noun = (kind: ApprovalTarget['kind']) => (kind === 'expense' ? 'Expense Report' : 'Daily Service Report');

const textareaClass =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2';

export const ApproveModal: React.FC<{
  target: ApprovalTarget | null;
  onClose: () => void;
  onConfirm: (comments: string) => Promise<void>;
}> = ({ target, onClose, onConfirm }) => {
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (target) setComments(''); }, [target]);

  const submit = async () => {
    setBusy(true);
    try { await onConfirm(comments.trim()); } finally { setBusy(false); }
  };

  return (
    <Modal
      isOpen={!!target}
      onClose={onClose}
      title={target ? `Approve ${noun(target.kind)}` : ''}
      contentClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy} className="bg-green-600 hover:bg-green-700 text-white">
            {busy ? 'Approving…' : 'Confirm Approval'}
          </Button>
        </div>
      }
    >
      {target && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 flex gap-2">
            <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            Are you sure you want to approve the {noun(target.kind)} for {target.employeeName} ({target.date})?
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Review Comments <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </label>
            <textarea rows={2} value={comments} onChange={e => setComments(e.target.value)} placeholder="Optional comments..."
              className={`${textareaClass} focus:ring-green-500/20 focus:border-green-500`} />
          </div>
        </div>
      )}
    </Modal>
  );
};

export const RejectModal: React.FC<{
  target: ApprovalTarget | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}> = ({ target, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (target) { setReason(''); setError(''); } }, [target]);

  const submit = async () => {
    if (!reason.trim()) {
      setError('A rejection reason is required');
      return;
    }
    setBusy(true);
    try { await onConfirm(reason.trim()); } finally { setBusy(false); }
  };

  return (
    <Modal
      isOpen={!!target}
      onClose={onClose}
      title={target ? `Reject ${noun(target.kind)}` : ''}
      contentClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={busy} className="bg-red-600 hover:bg-red-700 text-white">
            {busy ? 'Rejecting…' : 'Confirm Rejection'}
          </Button>
        </div>
      }
    >
      {target && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 flex gap-2">
            <XCircle size={18} className="text-red-600 shrink-0" />
            Please provide a reason for rejecting the {noun(target.kind)} for {target.employeeName} ({target.date}).
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} value={reason} onChange={e => { setReason(e.target.value); setError(''); }}
              placeholder={`Specify why the ${target.kind === 'expense' ? 'expense report' : 'DSR'} is being rejected...`}
              className={`${textareaClass} focus:ring-red-500/20 focus:border-red-500`} />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        </div>
      )}
    </Modal>
  );
};
