/**
 * Service module — the "raise a complaint" form fields, shared between the
 * full-page form (ServiceComplaintFormPage) and the inline modal opened from
 * the Complaints kanban board. Keeping this in one place means both entry
 * points can't drift apart the way the Won-flow entry points already have.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useApp } from '../../App';
import { useAppSelector } from '../../store/hooks';
import { selectHasPermission } from '../../store/slices/authSlice';
import { useIssueTypes } from './useIssueTypes';
import { SeriesSelect } from './SeriesSelect';
import {
  marketingAPI,
  Customer,
  Plant,
  ServiceContract,
  ServiceComplaint,
  ServiceIssueType,
  ServiceComplaintSource,
  customerPrimaryContactName,
  customerDisambiguator,
} from '../../lib/marketing-api';

const fmtDay = (d?: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null;

/** One line that tells one contract from another: "AMC-0012 · AMC · 1 Apr 2026 – 31 Mar 2027 · Kalinganagar Plant · Active" */
const contractLabel = (ct: ServiceContract) => {
  const period = ct.start_date || ct.end_date ? `${fmtDay(ct.start_date) || '…'} – ${fmtDay(ct.end_date) || '…'}` : null;
  const status = ct.status.charAt(0).toUpperCase() + ct.status.slice(1);
  return [ct.contract_number || `Contract #${ct.id}`, ct.contract_type, period, ct.plant_name, status].filter(Boolean).join(' · ');
};

/** Active contracts first (soonest to end first), then the rest */
const CONTRACT_RANK: Record<string, number> = { active: 0, draft: 1, expired: 2, cancelled: 3 };
const sortContracts = (list: ServiceContract[]) =>
  [...list].sort(
    (a, b) =>
      (CONTRACT_RANK[a.status] ?? 9) - (CONTRACT_RANK[b.status] ?? 9) ||
      (a.end_date || '9999-12-31').localeCompare(b.end_date || '9999-12-31') ||
      a.id - b.id,
  );

const SectionHeading: React.FC<{ n: number; title: string; optional?: boolean }> = ({ n, title, optional }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 text-slate-500">{n}</span>
    <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
    {optional && <span className="text-xs text-slate-400">optional</span>}
  </div>
);

interface ServiceComplaintFormFieldsProps {
  source: ServiceComplaintSource;
  visitId?: number;
  initialCustomerId?: number;
  initialPlantId?: number;
  initialContractId?: number;
  onCreated: (complaint: ServiceComplaint) => void;
  onCancel: () => void;
}

export const ServiceComplaintFormFields: React.FC<ServiceComplaintFormFieldsProps> = ({
  source,
  visitId,
  initialCustomerId,
  initialPlantId,
  initialContractId,
  onCreated,
  onCancel,
}) => {
  const { showToast } = useApp();

  const [customerId, setCustomerId] = useState<number | undefined>(initialCustomerId);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLabel, setCustomerLabel] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantId, setPlantId] = useState<number | undefined>(initialPlantId);

  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [contractId, setContractId] = useState<number | undefined>(initialContractId);

  const [issueType, setIssueType] = useState<ServiceIssueType | ''>('');
  const { activeTypes, reload: reloadIssueTypes } = useIssueTypes();
  const canAddIssueType = useAppSelector(selectHasPermission('service.manage_complaint'));
  const [addingType, setAddingType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [savingType, setSavingType] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedHours, setPlannedHours] = useState('');
  const [seriesCode, setSeriesCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (customerId == null) {
      setPlants([]);
      setContracts([]);
      return;
    }
    marketingAPI.getPlants({ customer_id: customerId }).then((p) => setPlants(p || [])).catch(() => setPlants([]));
    marketingAPI
      .getServiceContracts({ customer_id: customerId, page_size: 50 })
      .then((res) => setContracts(res.items || []))
      .catch(() => setContracts([]));
    if (!customerLabel) {
      marketingAPI.getCustomer(customerId).then((c) => setCustomerLabel(c.company_name)).catch(() => {});
    }
  }, [customerId, customerLabel]);

  // When a contract is chosen and it names a plant, prefill it
  useEffect(() => {
    if (contractId == null) return;
    const c = contracts.find((x) => x.id === contractId);
    if (c?.plant_id && plantId == null) setPlantId(c.plant_id);
  }, [contractId, contracts, plantId]);

  const onQueryChange = (v: string) => {
    setCustomerQuery(v);
    setShowMenu(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const term = v.trim();
      if (term.length < 2) return setCustomerResults([]);
      marketingAPI.searchCustomers(term, 15).then(setCustomerResults).catch(() => setCustomerResults([]));
    }, 300);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (customerId == null) return showToast('Pick a customer', 'error');
    if (!issueType) return showToast('Pick the issue type', 'error');
    if (!title.trim()) return showToast('Enter a short title', 'error');

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const c = await marketingAPI.createServiceComplaint({
        customer_id: customerId,
        plant_id: plantId ?? null,
        contract_id: contractId ?? null,
        issue_type: issueType,
        title: title.trim(),
        description: description.trim() || null,
        source,
        visit_id: visitId ?? null,
        planned_time_hours: plannedHours ? Number(plannedHours) : null,
        series_code: seriesCode.trim() || null,
      });
      showToast(source === 'found_on_visit' ? 'Issue reported — waiting for coordinator approval' : 'Complaint raised', 'success');
      onCreated(c);
    } catch (err: any) {
      showToast(err?.message || 'Failed to raise complaint', 'error');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {source === 'found_on_visit' && (
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
          This is an issue found during a visit. Once submitted it goes to the coordinator for approval before any work on it starts.
        </p>
      )}

      {/* Customer */}
      <div className="relative max-w-xl">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer</label>
        {customerId != null ? (
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-800">{customerLabel || `Customer #${customerId}`}</span>
            <button type="button" className="text-sm text-slate-500 hover:text-rose-600" onClick={() => { setCustomerId(undefined); setCustomerLabel(''); setPlantId(undefined); setContractId(undefined); }}>
              Change
            </button>
          </div>
        ) : (
          <>
            <Input
              value={customerQuery}
              onChange={(e) => onQueryChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowMenu(false), 150)}
              placeholder="Type a company or contact name, email or phone"
            />
            {showMenu && customerQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                {customerResults.length === 0 && (
                  <p className="px-3 py-2 text-xs text-slate-400">No matching customers.</p>
                )}
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setCustomerId(c.id);
                      setCustomerLabel(customerPrimaryContactName(c) ? `${c.company_name} — ${customerPrimaryContactName(c)}` : c.company_name);
                      setCustomerQuery('');
                      setShowMenu(false);
                      setPlantId(undefined);
                      setContractId(undefined);
                    }}
                  >
                    <span className="font-medium text-slate-800">{c.company_name}</span>
                    {(customerPrimaryContactName(c) || c.primary_contact_contact?.contact_phone) && (
                      <span className="text-xs text-slate-500">
                        {[customerPrimaryContactName(c), c.primary_contact_contact?.contact_phone].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">{customerDisambiguator(c)}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* The problem */}
      <div className="pt-1">
        <SectionHeading n={1} title="The problem" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Issue type"
            options={activeTypes.map((t) => ({ value: t.code, label: t.label }))}
            value={issueType}
            onChange={(v) => setIssueType((v as ServiceIssueType) || '')}
            placeholder="Select the issue type"
            clearable={false}
          />
          <Input label="Short title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Compressor tripping on overload" />
        </div>
        {canAddIssueType && (
          <div className="mt-1.5">
            {!addingType ? (
              <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => setAddingType(true)}>
                + Type not listed? Add a new issue type
              </button>
            ) : (
              <div className="flex items-center gap-2 max-w-md">
                <Input value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} placeholder="New issue type, e.g. Electrical" />
                <Button
                  type="button"
                  size="sm"
                  isLoading={savingType}
                  onClick={async () => {
                    if (!newTypeLabel.trim()) return;
                    setSavingType(true);
                    try {
                      const created = await marketingAPI.createServiceIssueType(newTypeLabel.trim());
                      await reloadIssueTypes();
                      setIssueType(created.code);
                      setNewTypeLabel('');
                      setAddingType(false);
                    } catch (e: any) {
                      showToast(e?.message || 'Failed to add issue type', 'error');
                    } finally {
                      setSavingType(false);
                    }
                  }}
                >
                  Add
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingType(false); setNewTypeLabel(''); }}>Cancel</Button>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-1.5">
          Software covers installs, reinstalls, licence keys, connecting equipment to a PC. PLC covers PLC faults and modification requests.
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Describe the problem</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is happening, when it started, any error messages…"
          />
        </div>

        <div className="max-w-xs mt-4">
          <Input label="Planned time to resolve (hours, optional)" type="number" min={0} step="0.5" value={plannedHours} onChange={(e) => setPlannedHours(e.target.value)} />
        </div>
      </div>

      {/* Coverage & location */}
      <div className="pt-2 border-t border-slate-100">
        <SectionHeading n={2} title="Coverage & location" optional />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              label="Under which contract?"
              options={[
                { value: '', label: 'Not under a contract (chargeable)' },
                ...sortContracts(contracts).map((ct) => ({
                  value: String(ct.id),
                  label: contractLabel(ct),
                })),
              ]}
              value={contractId != null ? String(contractId) : ''}
              onChange={(v) => setContractId(v ? Number(v) : undefined)}
              placeholder={customerId == null ? 'Pick a customer first' : contracts.length ? 'Select contract' : 'This customer has no contracts'}
              searchable
            />
            {(() => {
              // a summary of the contract you picked, so you can be sure it is the right one
              const ct = contracts.find((x) => x.id === contractId);
              if (!ct) {
                return (
                  <p className="text-xs text-slate-400 mt-1.5">
                    Linking a contract shows whether the fix is covered or chargeable, and keeps the complaint in that contract's history.
                  </p>
                );
              }
              const included = (ct.items || []).filter((i) => i.coverage === 'included').map((i) => i.name);
              const chargeable = (ct.items || []).filter((i) => i.coverage === 'chargeable').map((i) => i.name);
              return (
                <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-800">
                    {ct.contract_number || `Contract #${ct.id}`} · {ct.contract_type} · {ct.status}
                  </p>
                  <p>
                    {ct.plant_name ? `${ct.plant_name} · ` : ''}
                    {ct.start_date || ct.end_date ? `${fmtDay(ct.start_date) || '…'} – ${fmtDay(ct.end_date) || '…'}` : 'No dates set'}
                  </p>
                  {included.length > 0 && <p><span className="font-medium text-emerald-700">Included:</span> {included.join(', ')}</p>}
                  {chargeable.length > 0 && <p><span className="font-medium text-amber-700">Chargeable:</span> {chargeable.join(', ')}</p>}
                </div>
              );
            })()}
          </div>
          <Select
            label="Plant / site"
            options={[
              { value: '', label: 'None' },
              ...plants.map((p) => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` })),
            ]}
            value={plantId != null ? String(plantId) : ''}
            onChange={(v) => setPlantId(v ? Number(v) : undefined)}
            placeholder={customerId == null ? 'Pick a customer first' : 'Select site'}
            searchable
            clearable={false}
          />
        </div>
      </div>

      <div className="max-w-xs">
        <SeriesSelect value={seriesCode} onChange={setSeriesCode} />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={submitting}>
          {source === 'found_on_visit' ? 'Submit for approval' : 'Raise complaint'}
        </Button>
      </div>
    </form>
  );
};
