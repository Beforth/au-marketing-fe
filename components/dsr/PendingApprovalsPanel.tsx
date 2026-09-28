import React, { useMemo, useState } from 'react';
import { Check, CheckCircle2, Search, X } from 'lucide-react';
import type { PendingDSR, PendingExpense } from '../../lib/hrms-rbac';
import { hrmsRBACClient } from '../../lib/hrms-rbac';
import { matchesSearch } from '../../lib/dsr-helpers';
import { ApproveModal, RejectModal, ApprovalTarget } from './ApprovalModals';
import { useApp } from '../../App';

/**
 * DSR History → "Pending My Approval" (guide §9.7): Indoor DSR, Outdoor DSR and Expense Report that
 * are waiting on the current user's decision, together in ONE table sorted by date, with a Type badge.
 * Search only (everything here is already pending + assigned to me). Approve/Reject reuse the shared
 * modals; no Delete here. Empty state "You're all caught up!". An actioned row disappears.
 */
type Kind = 'indoor' | 'outdoor' | 'expense';

interface Row {
  key: string;
  id: number;
  kind: Kind;
  date: string;
  employee: string;
  details: string;
  sub?: string;
  level?: number | null;
}

const TYPE_BADGE: Record<Kind, { label: string; cls: string }> = {
  indoor: { label: 'Indoor DSR', cls: 'bg-green-50 text-green-700 border-green-200' },
  outdoor: { label: 'Outdoor DSR', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  expense: { label: 'Expense Report', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
};

/** dd/mm/yyyy like HRMS. */
const formatDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB');
};

export function pendingCount(p: { dsr: PendingDSR[]; expense: PendingExpense[] } | null): number {
  return p ? p.dsr.length + p.expense.length : 0;
}

export const PendingApprovalsPanel: React.FC<{
  token: string;
  pending: { dsr: PendingDSR[]; expense: PendingExpense[] };
  loading: boolean;
  /** An item was approved/rejected — reload the queue (and badges). */
  onChanged: () => void;
}> = ({ token, pending, loading, onChanged }) => {
  const { showToast } = useApp();
  const [q, setQ] = useState('');
  const [approveTarget, setApproveTarget] = useState<ApprovalTarget | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalTarget | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const rows = useMemo<Row[]>(() => {
    const dsr: Row[] = pending.dsr.map(d => ({
      key: `dsr-${d.id}`,
      id: d.id,
      kind: d.dsr_type === 'outdoor' ? 'outdoor' : 'indoor',
      date: d.date,
      employee: d.employee?.name || '—',
      details: d.title || d.task_detail || `DSR #${d.id}`,
      // task_detail can carry a "[Completed … late — was due …]" note for To-Do-generated DSRs.
      sub: d.task_detail && d.task_detail !== d.title ? d.task_detail : undefined,
      level: d.current_level,
    }));
    const exp: Row[] = pending.expense.map(e => ({
      key: `exp-${e.id}`,
      id: e.id,
      kind: 'expense',
      date: e.date,
      employee: e.employee?.name || '—',
      details: e.tour_destination || `Expense #${e.id}`,
      sub: e.total != null ? `₹${Number(e.total).toLocaleString('en-IN')}` : undefined,
      level: e.current_level,
    }));
    return [...dsr, ...exp]
      .filter(r => !done.has(r.key))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [pending, done]);

  const visible = rows.filter(r => matchesSearch({ a: r.employee, b: r.details, c: r.sub ?? '', d: TYPE_BADGE[r.kind].label }, q));

  const targetFor = (r: Row): ApprovalTarget => ({ id: r.id, kind: r.kind === 'expense' ? 'expense' : 'dsr', employeeName: r.employee, date: formatDate(r.date) });
  const keyOf = (t: ApprovalTarget) => `${t.kind === 'expense' ? 'exp' : 'dsr'}-${t.id}`;

  const confirmApprove = async (comments: string) => {
    if (!approveTarget) return;
    try {
      const res = approveTarget.kind === 'expense'
        ? await hrmsRBACClient.approveExpense(token, approveTarget.id, comments || undefined)
        : await hrmsRBACClient.approveDSR(token, approveTarget.id, comments || undefined);
      showToast(res.message || 'Approved', 'success');
      setDone(prev => new Set(prev).add(keyOf(approveTarget)));
      setApproveTarget(null);
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not approve', 'error');
    }
  };

  const confirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      if (rejectTarget.kind === 'expense') await hrmsRBACClient.rejectExpense(token, rejectTarget.id, reason);
      else await hrmsRBACClient.rejectDSR(token, rejectTarget.id, reason);
      showToast('Rejected', 'success');
      setDone(prev => new Set(prev).add(keyOf(rejectTarget)));
      setRejectTarget(null);
      onChanged();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not reject', 'error');
    }
  };

  const th = 'px-3 py-2.5 border-r border-slate-200';
  const td = 'px-3 py-2.5 border-r border-slate-100 align-top';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50/80 border-b border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[15rem]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search employee, task, destination..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400" />
        </div>
        <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-800 px-2.5 py-1 text-xs font-semibold">
          {rows.length} waiting on you
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-slate-500 justify-center text-sm">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-1" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <CheckCircle2 size={36} className="text-emerald-500" />
          <p className="text-sm font-semibold text-slate-800">You're all caught up!</p>
          <p className="text-xs text-slate-500">Nothing is waiting for your approval.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <th className={th} style={{ width: '10%' }}>Date</th>
                <th className={th} style={{ width: '15%' }}>Employee</th>
                <th className={th} style={{ width: '12%' }}>Type</th>
                <th className={th}>Details</th>
                <th className={`${th} text-center`} style={{ width: '8%' }}>Level</th>
                <th className="px-2 py-2.5 text-center" style={{ width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {visible.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">No matches.</td></tr>
              )}
              {visible.map(r => (
                <tr key={r.key} className="hover:bg-slate-50/60">
                  <td className={`${td} whitespace-nowrap`}>{formatDate(r.date)}</td>
                  <td className={`${td} font-medium text-slate-800`}>{r.employee}</td>
                  <td className={td}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${TYPE_BADGE[r.kind].cls}`}>
                      {TYPE_BADGE[r.kind].label}
                    </span>
                  </td>
                  <td className={`${td} text-slate-900`}>
                    <span className="font-medium">{r.details}</span>
                    {r.sub && <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line">{r.sub}</p>}
                  </td>
                  <td className={`${td} text-center`}>{r.level ?? '—'}</td>
                  <td className="px-2 py-2.5 text-center whitespace-nowrap align-top">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => setApproveTarget(targetFor(r))} title="Approve"
                        className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"><Check size={16} /></button>
                      <button type="button" onClick={() => setRejectTarget(targetFor(r))} title="Reject"
                        className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"><X size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ApproveModal target={approveTarget} onClose={() => setApproveTarget(null)} onConfirm={confirmApprove} />
      <RejectModal target={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={confirmReject} />
    </div>
  );
};
