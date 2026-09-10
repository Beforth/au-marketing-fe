/**
 * Service module — Stage 4: raise a complaint.
 * Route: /service/complaints/new  (optionally ?visit_id= &customer_id= &plant_id= for engineer-found issues)
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { ArrowLeft } from 'lucide-react';
import {
  marketingAPI,
  Customer,
  Plant,
  ServiceContract,
  ServiceIssueType,
  SERVICE_ISSUE_TYPES,
  ServiceComplaintSource,
} from '../lib/marketing-api';

export const ServiceComplaintFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [params] = useSearchParams();
  const canCreate = useAppSelector(selectHasPermission('service.create_complaint'));

  const source: ServiceComplaintSource = params.get('visit_id') ? 'found_on_visit' : 'customer';
  const visitId = params.get('visit_id') ? Number(params.get('visit_id')) : undefined;

  const [customerId, setCustomerId] = useState<number | undefined>(params.get('customer_id') ? Number(params.get('customer_id')) : undefined);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLabel, setCustomerLabel] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantId, setPlantId] = useState<number | undefined>(params.get('plant_id') ? Number(params.get('plant_id')) : undefined);

  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [contractId, setContractId] = useState<number | undefined>(params.get('contract_id') ? Number(params.get('contract_id')) : undefined);

  const [issueType, setIssueType] = useState<ServiceIssueType | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedHours, setPlannedHours] = useState('');
  const [seriesCode, setSeriesCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!canCreate) {
      showToast('You do not have permission to raise complaints', 'error');
      navigate('/service/complaints');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      navigate(`/service/complaints/${c.id}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to raise complaint', 'error');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const breadcrumbs = [
    { label: 'Service', href: '/service/contracts' },
    { label: 'Complaints', href: '/service/complaints' },
    { label: 'New Complaint' },
  ];

  return (
    <PageLayout
      title={source === 'found_on_visit' ? 'Report an issue found on site' : 'New Complaint'}
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>Back</Button>
      }
    >
      <Card>
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
                  placeholder="Type to search by name, email or phone"
                />
                {showMenu && customerResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCustomerId(c.id);
                          setCustomerLabel(c.company_name);
                          setCustomerQuery('');
                          setShowMenu(false);
                          setPlantId(undefined);
                          setContractId(undefined);
                        }}
                      >
                        {c.company_name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Contract */}
          <div className="max-w-xl">
            <Select
              label="Under which contract? (optional)"
              options={[
                { value: '', label: 'Not under a contract (chargeable)' },
                ...contracts.map((ct) => ({
                  value: String(ct.id),
                  label: `${ct.contract_number || `Contract #${ct.id}`} · ${ct.contract_type}${ct.plant_name ? ` · ${ct.plant_name}` : ''}`,
                })),
              ]}
              value={contractId != null ? String(contractId) : ''}
              onChange={(v) => setContractId(v ? Number(v) : undefined)}
              placeholder={customerId == null ? 'Pick a customer first' : contracts.length ? 'Select contract' : 'This customer has no contracts'}
              searchable
            />
            <p className="text-xs text-slate-400 mt-1">
              Linking a contract shows whether the fix is covered or chargeable, and keeps the complaint in that contract's history.
            </p>
          </div>

          {/* Plant + type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <Select
              label="Plant / site (optional)"
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
            <Select
              label="Issue type"
              options={SERVICE_ISSUE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={issueType}
              onChange={(v) => setIssueType((v as ServiceIssueType) || '')}
              placeholder="Hardware / Software / PLC"
              clearable={false}
            />
          </div>
          <p className="text-xs text-slate-400 max-w-xl -mt-2">
            Software covers installs, reinstalls, licence keys, connecting equipment to a PC. PLC covers PLC faults and modification requests.
          </p>

          <Input label="Short title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Compressor tripping on overload" className="max-w-xl" />

          <div className="max-w-xl">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Describe the problem</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is happening, when it started, any error messages…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
            <Input label="Planned time to resolve (hours, optional)" type="number" min={0} step="0.5" value={plannedHours} onChange={(e) => setPlannedHours(e.target.value)} />
            <Input label="Numbering series code (optional)" value={seriesCode} onChange={(e) => setSeriesCode(e.target.value)} placeholder="e.g. complaint_no" />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => navigate('/service/complaints')}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>
              {source === 'found_on_visit' ? 'Submit for approval' : 'Raise complaint'}
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
};
