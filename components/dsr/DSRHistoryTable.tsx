import React from 'react';
import { Check, Pencil, PhoneCall, Trash2, X } from 'lucide-react';
import type { DSRTask, DSRType, ExpenseReport } from '../../lib/hrms-rbac';
import { EXPENSE_AMOUNT_FIELDS } from '../../lib/hrms-rbac';
import { DSRStatusBadge } from './DSRStatusBadge';
import { formatTimeRange, hoursToWords } from '../../lib/dsr-helpers';

/**
 * History tables, laid out per docs/DSR_MODULE_INTEGRATION.md §9.4:
 * two-tier header for Indoor ("Calling Details", 6 cols) and Outdoor ("Contact Details", 4 cols),
 * flat header for Expense. Actions: Approve / Reject / Delete, plus Edit (our addition — HRMS has
 * none, guide note E; kept so a pending report can be corrected).
 */

export interface RowActions<T> {
  canApprove: (row: T) => boolean;
  canEdit: (row: T) => boolean;
  canDelete: (row: T) => boolean;
  onApprove: (row: T) => void;
  onReject: (row: T) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}

const th = 'px-3 py-2.5 border-r border-slate-200';
const subTh = 'px-3 py-1.5 border-r border-slate-200';
const td = 'px-3 py-2.5 border-r border-slate-100 align-top';
const dash = <span className="text-slate-300">—</span>;
const show = (v: unknown) => (v == null || v === '' ? dash : String(v));

/** dd/mm/yyyy like HRMS. "YYYY-MM-DD" is read as a local date (no timezone shift). */
const formatDate = (d?: string | null) => {
  if (!d) return dash;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB');
};

/** Employee cell like HRMS: full name, then employee code (or "Staff") small underneath. */
const EmployeeCell: React.FC<{ name: string; code?: string | null }> = ({ name, code }) => (
  <>
    <span className="font-semibold text-slate-900 block">{name}</span>
    <span className="text-slate-400 text-[10px]">{code || 'Staff'}</span>
  </>
);

function ActionsCell<T>({ row, actions }: { row: T; actions: RowActions<T> }) {
  const approve = actions.canApprove(row);
  const edit = actions.canEdit(row);
  const del = actions.canDelete(row);
  if (!approve && !edit && !del) return dash;
  return (
    <div className="inline-flex items-center gap-1">
      {approve && (
        <>
          <button type="button" onClick={() => actions.onApprove(row)} title="Approve Report"
            className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"><Check size={16} /></button>
          <button type="button" onClick={() => actions.onReject(row)} title="Reject Report"
            className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"><X size={16} /></button>
        </>
      )}
      {edit && (
        <button type="button" onClick={() => actions.onEdit(row)} title="Edit Entry"
          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil size={14} /></button>
      )}
      {del && (
        <button type="button" onClick={() => actions.onDelete(row)} title="Delete Entry"
          className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
      )}
    </div>
  );
}

/** Guide §9.4: "09:00 - 17:30" over "(8 hours 30 minutes)", or just "8 hours" without a time range. */
const HoursCell: React.FC<{ row: DSRTask }> = ({ row }) => {
  if (row.hours == null || row.hours === '') return dash;
  const range = formatTimeRange(row.start_time, row.end_time);
  const words = hoursToWords(row.hours);
  if (!range) return <span>{words}</span>;
  return (
    <>
      <span className="block text-xs font-semibold text-slate-900 whitespace-nowrap">{range}</span>
      <span className="text-[10px] text-slate-500 font-normal">({words})</span>
    </>
  );
};

const GroupHeader: React.FC<{ span: number; label: string }> = ({ span, label }) => (
  <th colSpan={span} className="px-3 py-1.5 border-r border-slate-200 text-center bg-blue-50/80 text-blue-800 font-bold border-b border-blue-200/80">
    <span className="inline-flex items-center gap-1.5"><PhoneCall size={14} className="text-blue-600" /> {label}</span>
  </th>
);

const Empty: React.FC<{ cols: number }> = ({ cols }) => (
  <tr><td colSpan={cols} className="px-3 py-10 text-center text-sm text-slate-400">No records found.</td></tr>
);

export const DSRHistoryTable: React.FC<{
  kind: DSRType;
  rows: DSRTask[];
  employeeName: string;
  employeeCode?: string | null;
  actions: RowActions<DSRTask>;
}> = ({ kind, rows, employeeName, employeeCode, actions }) => (
  <table className="w-full text-left border-collapse text-xs">
    <thead>
      <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
        <th rowSpan={2} className={th} style={{ width: '8%' }}>Date</th>
        <th rowSpan={2} className={th} style={{ width: '12%' }}>Employee</th>
        <th rowSpan={2} className={th} style={{ width: '16%' }}>{kind === 'indoor' ? 'Task Details' : 'Visit Details'}</th>
        {kind === 'indoor' && <th rowSpan={2} className={`${th} text-center`} style={{ width: '9%' }}>Hours</th>}
        {kind === 'indoor' ? <GroupHeader span={6} label="Calling Details" /> : <GroupHeader span={4} label="Contact Details" />}
        <th rowSpan={2} className={`${th} text-center`} style={{ width: '10%' }}>Approval Status</th>
        <th rowSpan={2} className="px-2 py-2.5 text-center" style={{ width: '8%' }}>Actions</th>
      </tr>
      <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        <th className={subTh}>Contact Person</th>
        <th className={subTh}>Contact No</th>
        {kind === 'indoor' ? (
          <>
            <th className={subTh}>Mail Id</th>
            <th className={subTh}>Call for</th>
            <th className={subTh}>Remark / Details</th>
          </>
        ) : (
          // The API has no "location/site" field; region is the closest one (see CHANGES.md).
          <th className={subTh}>Location / Site</th>
        )}
        <th className={subTh}>Next Follow-up</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-200/70 bg-white">
      {rows.length === 0 && <Empty cols={kind === 'indoor' ? 12 : 9} />}
      {rows.map(r => (
        <tr key={r.id} className="hover:bg-slate-50/60">
          <td className={`${td} whitespace-nowrap`}>{formatDate(r.date)}</td>
          <td className={td}><EmployeeCell name={employeeName} code={employeeCode} /></td>
          {kind === 'indoor' ? (
            <td className={`${td} text-slate-900`}>
              {(r.department || r.task_type) && (
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {r.department && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">{r.department}</span>}
                  {r.task_type && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">{r.task_type}</span>}
                </div>
              )}
              <span className="font-medium leading-snug">{r.title || dash}</span>
              {/* whitespace-pre-line: DSRs created from lead logs put the log type, notes and contact on separate lines */}
              {r.description && <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line">{r.description}</p>}
            </td>
          ) : (
            <td className={`${td} text-slate-900`}>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                {r.visit_plan && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{r.visit_plan}</span>}
                {r.reason_for_visit && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">{r.reason_for_visit}</span>}
                {r.appointment_status && <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200">{r.appointment_status}</span>}
              </div>
              <span className="font-medium leading-snug">{r.company_name || r.title || dash}</span>
              {r.meeting_output && <p className="text-xs text-slate-600 italic mt-0.5">{r.meeting_output}</p>}
            </td>
          )}
          {kind === 'indoor' && <td className={`${td} text-center`}><HoursCell row={r} /></td>}
          <td className={td}>{show(r.contact_person)}</td>
          <td className={`${td} whitespace-nowrap`}>{show(r.contact_number)}</td>
          {kind === 'indoor' ? (
            <>
              <td className={`${td} break-all`}>{show(r.mail_id)}</td>
              <td className={td}>{show(r.call_for)}</td>
              <td className={td}>{show(r.remarks)}</td>
            </>
          ) : (
            <td className={td}>{show(r.region)}</td>
          )}
          <td className={`${td} whitespace-nowrap`}>{formatDate(r.next_follow_up)}</td>
          <td className={`${td} text-center`}>
            <DSRStatusBadge status={r.status} currentLevel={r.current_level} rejectionReason={r.rejection_reason} />
          </td>
          <td className="px-2 py-2.5 text-center whitespace-nowrap align-top"><ActionsCell row={r} actions={actions} /></td>
        </tr>
      ))}
    </tbody>
  </table>
);

const AMOUNT_HEADERS: Record<typeof EXPENSE_AMOUNT_FIELDS[number], string> = {
  travelling_bus: 'Bus / Train',
  travelling_shared_auto: 'Shared Auto',
  lodging: 'Lodging',
  day_allowance: 'Day Allow.',
  phone: 'Phone',
  material_purchase: 'Material',
  cash_pay_to_other: 'Cash Paid',
};

const rupees = (v: unknown) => {
  const n = Number(v);
  return v == null || v === '' || Number.isNaN(n) ? dash : `₹${n.toLocaleString('en-IN')}`;
};

export const ExpenseHistoryTable: React.FC<{
  rows: ExpenseReport[];
  employeeName: string;
  employeeCode?: string | null;
  actions: RowActions<ExpenseReport>;
}> = ({ rows, employeeName, employeeCode, actions }) => (
  <table className="w-full text-left border-collapse text-xs">
    <thead>
      <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
        <th className={th}>Date</th>
        <th className={th}>Employee</th>
        <th className={th}>Tour Destination</th>
        <th className={th}>Description & Location</th>
        <th className={th}>Company</th>
        {EXPENSE_AMOUNT_FIELDS.map(f => <th key={f} className={`${th} text-right`}>{AMOUNT_HEADERS[f]}</th>)}
        <th className={`${th} text-right`}>Total</th>
        <th className={`${th} text-center`}>Approval Status</th>
        <th className="px-2 py-2.5 text-center">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-200/70 bg-white">
      {rows.length === 0 && <Empty cols={15} />}
      {rows.map(r => (
        <tr key={r.id} className="hover:bg-slate-50/60">
          <td className={`${td} whitespace-nowrap`}>{formatDate(r.date)}</td>
          <td className={td}><EmployeeCell name={employeeName} code={employeeCode} /></td>
          <td className={td}>{show(r.tour_destination)}</td>
          <td className={td}>{show(r.description)}</td>
          <td className={td}>{show(r.company_name)}</td>
          {EXPENSE_AMOUNT_FIELDS.map(f => <td key={f} className={`${td} text-right whitespace-nowrap`}>{rupees(r[f])}</td>)}
          <td className={`${td} text-right font-semibold text-slate-900 whitespace-nowrap`}>{rupees(r.total)}</td>
          <td className={`${td} text-center`}>
            <DSRStatusBadge status={r.status} currentLevel={r.current_level} rejectionReason={r.rejection_reason} />
          </td>
          <td className="px-2 py-2.5 text-center whitespace-nowrap align-top"><ActionsCell row={r} actions={actions} /></td>
        </tr>
      ))}
    </tbody>
  </table>
);
