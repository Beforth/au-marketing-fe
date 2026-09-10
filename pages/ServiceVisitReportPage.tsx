/**
 * Service module — Stage 5: everything about a visit after the engineer's been.
 * Route: /service/visits/:visitId/report
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { ArrowLeft, FileText, Paperclip, Plus, Trash2 } from 'lucide-react';
import { marketingAPI, VisitReportBundle, ServiceCalibrationKind } from '../lib/marketing-api';

const VISIT_TYPE_OPTS = [
  { value: 'normal', label: 'Normal service visit' },
  { value: 'fitting_only', label: 'Fitting-only (sent just to fit a part)' },
  { value: 'migration', label: 'Machine migration' },
];
const EMAIL_HINT = 'Email sending isn’t set up yet — the outcome is recorded here.';

const SectionHeading: React.FC<{ n: number; title: string; optional?: boolean; done?: boolean }> = ({ n, title, optional, done }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
    <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
    {optional && <span className="text-xs text-slate-400">optional</span>}
  </div>
);

export const ServiceVisitReportPage: React.FC = () => {
  const { visitId: vid } = useParams<{ visitId: string }>();
  const visitId = Number(vid);
  const navigate = useNavigate();
  const { showToast } = useApp();

  const canView = useAppSelector(selectHasPermission('service.view'));
  const canVisit = useAppSelector(selectHasPermission('service.manage_visit'));
  const canReport = useAppSelector(selectHasPermission('service.manage_report'));

  const [b, setB] = useState<VisitReportBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [vt, setVt] = useState('normal');
  const [fittingPart, setFittingPart] = useState('');
  const [migMake, setMigMake] = useState('');
  const [migMaterial, setMigMaterial] = useState<'' | 'yes' | 'no'>('');
  const [migDepts, setMigDepts] = useState('');
  const [engNotes, setEngNotes] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);

  const [calOpen, setCalOpen] = useState(false);
  const [calKind, setCalKind] = useState<ServiceCalibrationKind>('wl');
  const [calHours, setCalHours] = useState('');
  const [calComp, setCalComp] = useState('');
  const [calNotes, setCalNotes] = useState('');

  const [poOpen, setPoOpen] = useState(false);
  const [poReq, setPoReq] = useState('');
  const [poActual, setPoActual] = useState('');
  const [poCharge, setPoCharge] = useState('');

  const [summary, setSummary] = useState('');
  const [imported, setImported] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await marketingAPI.getVisitReportBundle(visitId);
      setB(data);
      setVt(data.visit.visit_type || 'normal');
      setFittingPart(data.visit.fitting_part || '');
      setMigMake(data.visit.migration_machine_make || '');
      setMigMaterial(data.visit.migration_material_sent == null ? '' : data.visit.migration_material_sent ? 'yes' : 'no');
      setMigDepts(data.visit.migration_departments || '');
      setEngNotes(data.visit.engineer_notes || '');
      setSummary(data.report?.summary || '');
      setImported(data.report?.imported_data || '');
    } catch (e: any) {
      showToast(e?.message || 'Failed to load', 'error');
      navigate('/service/visits');
    } finally {
      setIsLoading(false);
    }
  }, [visitId, navigate, showToast]);

  useEffect(() => {
    if (!canView) {
      setIsLoading(false);
      return;
    }
    load();
  }, [canView, load]);

  const wrap = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      showToast(ok, 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Action failed', 'error');
    }
  };

  const saveVisitType = async () => {
    setSavingVisit(true);
    try {
      await marketingAPI.updateServiceVisit(visitId, {
        visit_type: vt as any,
        fitting_part: vt === 'fitting_only' ? fittingPart.trim() || null : null,
        migration_machine_make: vt === 'migration' ? migMake.trim() || null : null,
        migration_material_sent: vt === 'migration' && migMaterial ? migMaterial === 'yes' : null,
        migration_departments: vt === 'migration' ? migDepts.trim() || null : null,
        engineer_notes: engNotes.trim() || null,
      } as any);
      showToast('Visit details saved', 'success');
      await load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to save', 'error');
    } finally {
      setSavingVisit(false);
    }
  };

  const report = b?.report;
  const reportSubmitted = report?.status === 'submitted';
  const reportState = reportSubmitted ? 'submitted' : report ? 'draft' : 'not_started';

  const breadcrumbs = [
    { label: 'Service', href: '/service/contracts' },
    { label: 'Service Plan', href: '/service/visits' },
    { label: b?.visit.title || `Visit #${visitId}` },
    { label: 'Visit report' },
  ];

  if (!canView) {
    return <PageLayout title="Visit report" breadcrumbs={breadcrumbs}><Card><p className="text-slate-600">No permission.</p></Card></PageLayout>;
  }
  if (isLoading || !b) {
    return (
      <PageLayout title="Visit report" breadcrumbs={breadcrumbs}>
        <Card><div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Visit report"
      description={`${b.visit.customer_name || ''}${b.visit.plant_name ? ` · ${b.visit.plant_name}` : ''}${b.visit.scheduled_date ? ` · ${b.visit.scheduled_date}` : ''}`}
      breadcrumbs={breadcrumbs}
      actions={<Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>Back</Button>}
    >
      {/* Status strip */}
      <div className={`rounded-xl border px-4 py-3 mb-4 flex flex-wrap items-center gap-3 ${
        reportSubmitted ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/50'
      }`}>
        <FileText size={18} className={reportSubmitted ? 'text-emerald-600' : 'text-amber-600'} />
        <div className="text-sm">
          <span className="font-semibold text-slate-800">
            {reportState === 'submitted' && 'Service report submitted'}
            {reportState === 'draft' && 'Service report is a draft'}
            {reportState === 'not_started' && 'Service report not started'}
          </span>
          <span className="text-slate-500">
            {reportState === 'submitted' && ` · by ${report?.submitted_by_username || '—'}${report?.submitted_at ? ` on ${new Date(report.submitted_at).toLocaleDateString()}` : ''}`}
            {reportState !== 'submitted' && ' · required before any complaint on this visit can be closed'}
          </span>
        </div>
      </div>

      {/* 1. The visit */}
      <Card className="mb-4">
        <SectionHeading n={1} title="What was done on the visit" done={vt !== 'normal' || !!engNotes.trim()} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Visit type" options={VISIT_TYPE_OPTS} value={vt} onChange={(v) => setVt(String(v ?? 'normal'))} clearable={false} disabled={!canVisit} />
          {vt === 'fitting_only' && (
            <Input label="Which part was fitted?" value={fittingPart} onChange={(e) => setFittingPart(e.target.value)} disabled={!canVisit} />
          )}
        </div>
        {vt === 'migration' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <Input label="Machine MAKE (being migrated)" value={migMake} onChange={(e) => setMigMake(e.target.value)} disabled={!canVisit} />
            <Select
              label="Required material sent?"
              options={[{ value: '', label: '—' }, { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
              value={migMaterial}
              onChange={(v) => setMigMaterial((v as any) || '')}
              disabled={!canVisit}
              searchable={false}
            />
            <Input label="Departments involved" value={migDepts} onChange={(e) => setMigDepts(e.target.value)} placeholder="Production, QA, Stores…" disabled={!canVisit} />
          </div>
        )}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">What the engineer did</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={engNotes}
            onChange={(e) => setEngNotes(e.target.value)}
            disabled={!canVisit}
            placeholder="Work carried out, findings, parts used…"
          />
        </div>
        {canVisit && (
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={saveVisitType} isLoading={savingVisit}>Save</Button>
          </div>
        )}
      </Card>

      {/* 2. Calibration */}
      <Card className="mb-4">
        <SectionHeading n={2} title="Calibration / validation" optional done={b.calibrations.length > 0} />
        {b.calibrations.length === 0 ? (
          <p className="text-sm text-slate-400 mb-2">Nothing recorded — add one if the visit involved calibration or validation.</p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg mb-3">
            {b.calibrations.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{c.kind === 'wl' ? 'With Load' : 'Without Load'}</Badge>
                  <span className="text-slate-700">
                    {c.duration_hours != null ? `${c.duration_hours} h` : '—'} · {c.compressor_count != null ? `${c.compressor_count} compressor(s)` : '— compressors'}
                  </span>
                  {c.notes && <span className="text-slate-500">· {c.notes}</span>}
                </div>
                {canVisit && (
                  <button className="text-slate-400 hover:text-rose-600" onClick={() => wrap(() => marketingAPI.deleteCalibration(c.id!), 'Removed')}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {canVisit && (
          <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => { setCalKind('wl'); setCalHours(''); setCalComp(''); setCalNotes(''); setCalOpen(true); }}>
            Add calibration
          </Button>
        )}
      </Card>

      {/* 3. PO difference */}
      <Card className="mb-4">
        <SectionHeading n={3} title="PO difference" optional done={b.po_variances.length > 0} />
        <p className="text-sm text-slate-400 mb-3">Only if the customer's PO said one thing but the site needed another. The extra charge counts only once the customer accepts.</p>
        {b.po_variances.length > 0 && (
          <div className="space-y-2 mb-3">
            {b.po_variances.map((p) => (
              <div key={p.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  <div><span className="text-slate-500">PO says: </span>{p.po_requirement}</div>
                  <div><span className="text-slate-500">Actually needed: </span>{p.actual_requirement}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  {p.additional_charge != null && (
                    <Badge variant={p.charge_applies ? 'success' : 'outline'}>
                      Extra charge {p.additional_charge}{p.charge_applies ? ' — applies' : ' — pending'}
                    </Badge>
                  )}
                  <Badge variant={p.customer_response === 'accepted' ? 'success' : p.customer_response === 'rejected' ? 'error' : 'warning'}>
                    Customer: {p.customer_response}
                  </Badge>
                  <div className="flex-1" />
                  {canVisit && p.customer_response === 'pending' && (
                    <>
                      <Button size="xs" variant="outline" onClick={() => wrap(() => marketingAPI.recordPOVarianceResponse(p.id, 'accepted'), 'Recorded: accepted')}>Accepted</Button>
                      <Button size="xs" variant="outline" onClick={() => wrap(() => marketingAPI.recordPOVarianceResponse(p.id, 'rejected'), 'Recorded: rejected')}>Rejected</Button>
                    </>
                  )}
                  {canReport && <Button size="xs" variant="ghost" disabled title={EMAIL_HINT}>Email customer (soon)</Button>}
                  {canVisit && (
                    <button className="text-slate-400 hover:text-rose-600" onClick={() => wrap(() => marketingAPI.deletePOVariance(p.id), 'Removed')}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {canVisit && (
          <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => { setPoReq(''); setPoActual(''); setPoCharge(''); setPoOpen(true); }}>
            Add a PO difference
          </Button>
        )}
      </Card>

      {/* 4. Attachments */}
      <Card className="mb-4">
        <SectionHeading n={4} title="Photos & documents" optional done={b.attachments.length > 0} />
        {b.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {b.attachments.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
                <Paperclip size={12} className="text-slate-400" />
                <button className="text-blue-600 hover:underline" onClick={() => marketingAPI.downloadVisitAttachment(visitId, a.id, a.file_name)}>{a.file_name}</button>
                {canVisit && (
                  <button className="text-slate-400 hover:text-rose-600" onClick={() => wrap(() => marketingAPI.deleteVisitAttachment(visitId, a.id), 'Removed')}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {canVisit && (
          <>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => {
              const files = e.target.files;
              if (files && files.length) wrap(() => marketingAPI.uploadVisitAttachments(visitId, Array.from(files)), 'Files uploaded');
            }} />
            <Button size="sm" variant="outline" leftIcon={<Paperclip size={14} />} onClick={() => fileRef.current?.click()}>Upload files</Button>
          </>
        )}
      </Card>

      {/* 5. Service report — the deliverable */}
      <Card className="mb-4 border-blue-200 ring-1 ring-blue-100">
        <SectionHeading n={5} title="Service report" done={reportSubmitted} />
        <p className="text-sm text-slate-500 mb-3">
          {reportSubmitted
            ? `Submitted by ${report?.submitted_by_username} on ${report?.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : ''}.`
            : 'Required for every visit. Write a summary, then submit.'}
        </p>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Summary <span className="text-rose-500">*</span></label>
        <textarea
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={!canReport || reportSubmitted}
          placeholder="What was done, findings, recommendations…"
        />
        <details className="mt-3">
          <summary className="text-sm text-slate-600 cursor-pointer">Customer machine-software data (optional)</summary>
          <textarea
            className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={imported}
            onChange={(e) => setImported(e.target.value)}
            disabled={!canReport || reportSubmitted}
            placeholder="Paste tracking data exported from the customer's software…"
          />
        </details>

        {canReport && !reportSubmitted && (
          <div className="flex flex-wrap justify-end gap-2 mt-4">
            <Button size="sm" variant="outline" isLoading={savingReport} onClick={async () => {
              setSavingReport(true);
              try {
                await marketingAPI.saveServiceReport(visitId, { summary: summary.trim() || null, imported_data: imported.trim() || null });
                showToast('Draft saved', 'success');
                await load();
              } catch (e: any) { showToast(e?.message || 'Failed to save', 'error'); }
              finally { setSavingReport(false); }
            }}>Save draft</Button>
            <Button size="sm" disabled={!summary.trim()} onClick={async () => {
              try { await marketingAPI.saveServiceReport(visitId, { summary: summary.trim(), imported_data: imported.trim() || null }); } catch { /* submit will surface it */ }
              wrap(() => marketingAPI.submitServiceReport(visitId), 'Report submitted');
            }}>Submit report</Button>
          </div>
        )}
        {reportSubmitted && (
          <div className="flex flex-wrap justify-end gap-2 mt-4">
            <Button size="sm" variant="outline" disabled title={EMAIL_HINT}>
              {report?.sent_to_accounts_at ? 'Sent to Accounts ✓' : 'Send to Accounts (soon)'}
            </Button>
            <Button size="sm" variant="outline" disabled title={EMAIL_HINT}>
              {report?.feedback_email_sent_at ? 'Feedback email sent ✓' : 'Send feedback email (soon)'}
            </Button>
          </div>
        )}
      </Card>

      {/* Calibration modal */}
      <Modal
        isOpen={calOpen}
        onClose={() => setCalOpen(false)}
        title="Add calibration / validation"
        footer={
          <>
            <Button variant="outline" onClick={() => setCalOpen(false)}>Cancel</Button>
            <Button onClick={() => wrap(
              () => marketingAPI.addCalibration(visitId, {
                kind: calKind,
                duration_hours: calHours ? Number(calHours) : null,
                compressor_count: calComp ? Number(calComp) : null,
                notes: calNotes.trim() || null,
              }).then(() => setCalOpen(false)),
              'Calibration added',
            )}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Load"
            options={[{ value: 'wl', label: 'With Load (WL)' }, { value: 'wol', label: 'Without Load (WOL)' }]}
            value={calKind}
            onChange={(v) => setCalKind((v as ServiceCalibrationKind) || 'wl')}
            clearable={false}
            searchable={false}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duration (hours)" type="number" min={0} step="0.5" value={calHours} onChange={(e) => setCalHours(e.target.value)} />
            <Input label="Number of compressors" type="number" min={0} value={calComp} onChange={(e) => setCalComp(e.target.value)} />
          </div>
          <Input label="Notes (optional)" value={calNotes} onChange={(e) => setCalNotes(e.target.value)} />
        </div>
      </Modal>

      {/* PO difference modal */}
      <Modal
        isOpen={poOpen}
        onClose={() => setPoOpen(false)}
        title="Add a PO difference"
        footer={
          <>
            <Button variant="outline" onClick={() => setPoOpen(false)}>Cancel</Button>
            <Button
              disabled={!poReq.trim() || !poActual.trim()}
              onClick={() => wrap(
                () => marketingAPI.addPOVariance(visitId, {
                  po_requirement: poReq.trim(),
                  actual_requirement: poActual.trim(),
                  additional_charge: poCharge ? Number(poCharge) : null,
                }).then(() => setPoOpen(false)),
                'PO difference recorded',
              )}
            >Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">What the PO says</label>
            <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} value={poReq} onChange={(e) => setPoReq(e.target.value)} placeholder="e.g. 24h validation + 1h calibration" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">What was actually needed</label>
            <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={2} value={poActual} onChange={(e) => setPoActual(e.target.value)} placeholder="e.g. 36h validation" />
          </div>
          <Input label="Extra charge (optional)" type="number" min={0} value={poCharge} onChange={(e) => setPoCharge(e.target.value)} />
        </div>
      </Modal>
    </PageLayout>
  );
};
