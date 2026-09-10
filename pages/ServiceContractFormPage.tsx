/**
 * Service module — Stage 1: Contract create / edit form.
 *
 * Customer field works like the Lead form: type a name to search existing
 * customers, or create a new one inline (needs marketing.create_customer).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { getStoredMarketingScope } from '../lib/marketing-scope';
import { NAME_PREFIXES } from '../constants';
import { ArrowLeft, Plus, X, Building2, UserPlus } from 'lucide-react';
import {
  marketingAPI,
  ServiceContractItem,
  ServiceContractPayload,
  ServiceContractType,
  ServiceContractStatus,
  SERVICE_CONTRACT_TYPES,
  SERVICE_CONTRACT_STATUSES,
  Plant,
  Customer,
  Contact,
  Domain,
  Region,
  customerPrimaryContactName,
} from '../lib/marketing-api';

const emptyItem = (): ServiceContractItem => ({ name: '', coverage: 'included', note: '' });

interface NewCustomerForm {
  company_name: string;
  domain_id?: number;
  region_id?: number;
  contact_title: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string;
  plant_name: string;
  plant_city: string;
  plant_address: string;
}

const emptyNewCustomer = (): NewCustomerForm => ({
  company_name: '',
  domain_id: undefined,
  region_id: undefined,
  contact_title: '',
  contact_first_name: '',
  contact_last_name: '',
  contact_email: '',
  contact_phone: '',
  plant_name: '',
  plant_city: '',
  plant_address: '',
});

export const ServiceContractFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { showToast } = useApp();

  const canCreate = useAppSelector(selectHasPermission('service.create_contract'));
  const canEdit = useAppSelector(selectHasPermission('service.edit_contract'));
  const canCreateCustomer = useAppSelector(selectHasPermission('marketing.create_customer'));
  const canCreateContact = useAppSelector(selectHasPermission('marketing.create_contact'));

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // ── Customer picker / inline creator ──
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [customerLabel, setCustomerLabel] = useState<string>('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [showCustomerMenu, setShowCustomerMenu] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>(emptyNewCustomer());
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantId, setPlantId] = useState<number | undefined>(undefined);

  const [contractType, setContractType] = useState<ServiceContractType | ''>('');
  const [status, setStatus] = useState<ServiceContractStatus>('draft');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [terms, setTerms] = useState('');
  const [allInclusive, setAllInclusive] = useState(false);
  const [additionalChargesNote, setAdditionalChargesNote] = useState('');
  const [notes, setNotes] = useState('');
  const [seriesCode, setSeriesCode] = useState('');
  const [items, setItems] = useState<ServiceContractItem[]>([]);

  useEffect(() => {
    if (isEdit && !canEdit) {
      showToast('You do not have permission to edit service contracts', 'error');
      navigate('/service/contracts');
      return;
    }
    if (!isEdit && !canCreate) {
      showToast('You do not have permission to create service contracts', 'error');
      navigate('/service/contracts');
      return;
    }
    if (isEdit && id) {
      loadContract(Number(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Plants for the selected existing customer
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (customerId == null) {
        setPlants([]);
        return;
      }
      try {
        const pl = await marketingAPI.getPlants({ customer_id: customerId });
        if (!cancelled) setPlants(pl || []);
      } catch {
        if (!cancelled) setPlants([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  // Load domains once we might create a customer
  useEffect(() => {
    if (!creatingCustomer || domains.length > 0) return;
    marketingAPI
      .getDomains({ is_active: true, page: 1, page_size: 100 })
      .then((res) => setDomains(res.items || []))
      .catch(() => setDomains([]));
  }, [creatingCustomer, domains.length]);

  // Load regions for the chosen domain of the new customer
  useEffect(() => {
    if (!newCustomer.domain_id) {
      setRegions([]);
      return;
    }
    marketingAPI
      .getRegions({ domain_id: newCustomer.domain_id, is_active: true, page: 1, page_size: 100 })
      .then((res) => setRegions(res.items || []))
      .catch(() => setRegions([]));
  }, [newCustomer.domain_id]);

  const loadContract = async (contractId: number) => {
    setIsLoading(true);
    try {
      const c = await marketingAPI.getServiceContract(contractId);
      setCustomerId(c.customer_id);
      setCustomerLabel(c.customer_name || `Customer #${c.customer_id}`);
      marketingAPI
        .getCustomer(c.customer_id)
        .then((full) => setCustomerLabel(customerDisplay(full)))
        .catch(() => {});
      setPlantId(c.plant_id ?? undefined);
      setContractType(c.contract_type);
      setStatus(c.status);
      setStartDate(c.start_date || '');
      setEndDate(c.end_date || '');
      setTerms(c.terms || '');
      setAllInclusive(c.all_inclusive_with_charges);
      setAdditionalChargesNote(c.additional_charges_note || '');
      setNotes(c.notes || '');
      setSeriesCode(c.series_code || '');
      setItems((c.items || []).map((it) => ({ name: it.name, coverage: it.coverage, note: it.note || '' })));
    } catch (e: any) {
      showToast(e?.message || 'Failed to load contract', 'error');
      navigate('/service/contracts');
    } finally {
      setIsLoading(false);
    }
  };

  const runCustomerSearch = (q: string) => {
    const term = q.trim();
    if (term.length < 2) {
      setCustomerResults([]);
      setCustomerSearching(false);
      return;
    }
    setCustomerSearching(true);
    marketingAPI
      .searchCustomers(term, 15)
      .then((res) => setCustomerResults(res || []))
      .catch(() => setCustomerResults([]))
      .finally(() => setCustomerSearching(false));
  };

  const onCustomerQueryChange = (v: string) => {
    setCustomerQuery(v);
    setShowCustomerMenu(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => runCustomerSearch(v), 300);
  };

  const customerDisplay = (c: Customer) => {
    const person = customerPrimaryContactName(c);
    return person ? `${c.company_name} — ${person}` : c.company_name;
  };

  const pickCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustomerLabel(customerDisplay(c));
    setCustomerQuery('');
    setCustomerResults([]);
    setShowCustomerMenu(false);
    setCreatingCustomer(false);
    setPlantId(undefined);
  };

  const startCreateCustomer = () => {
    const scope = getStoredMarketingScope();
    setCreatingCustomer(true);
    setCustomerId(undefined);
    setCustomerLabel('');
    setPlants([]);
    setPlantId(undefined);
    setShowCustomerMenu(false);
    setNewCustomer({
      ...emptyNewCustomer(),
      company_name: customerQuery.trim(),
      domain_id: scope?.domain_id,
      region_id: scope?.region_id ?? scope?.region_ids?.[0],
    });
  };

  const clearCustomer = () => {
    setCustomerId(undefined);
    setCustomerLabel('');
    setCreatingCustomer(false);
    setNewCustomer(emptyNewCustomer());
    setPlants([]);
    setPlantId(undefined);
  };

  const updateItem = (idx: number, patch: Partial<ServiceContractItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!contractType) {
      showToast('Please select a contract type', 'error');
      return;
    }

    let effectiveCustomerId = customerId;
    let effectivePlantId = plantId;

    if (!isEdit && creatingCustomer) {
      if (!newCustomer.company_name.trim()) {
        showToast('Enter a company name for the new customer', 'error');
        return;
      }
      if (!newCustomer.domain_id) {
        showToast('Select a domain for the new customer', 'error');
        return;
      }
      if (canCreateContact && !newCustomer.contact_first_name.trim() && !newCustomer.contact_last_name.trim()) {
        showToast('Enter the contact person’s name for the new customer', 'error');
        return;
      }
    } else if (effectiveCustomerId == null) {
      showToast('Please select a customer', 'error');
      return;
    }

    const cleanItems = items
      .map((it) => ({ ...it, name: it.name.trim(), note: (it.note || '').trim() || undefined }))
      .filter((it) => it.name);

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      // 1. Create the customer first if we're in inline-create mode
      if (!isEdit && creatingCustomer) {
        // Always give a new customer at least one site — the company's own location
        // if they didn't name a separate plant.
        const plantName = newCustomer.plant_name.trim() || 'Main site';

        // 1a. Create the contact person, if named and allowed
        let primaryContactId: number | undefined;
        const hasContactName = newCustomer.contact_first_name.trim() || newCustomer.contact_last_name.trim();
        if (canCreateContact && hasContactName) {
          const contact = await marketingAPI.createContact({
            title: newCustomer.contact_title.trim() || undefined,
            first_name: newCustomer.contact_first_name.trim() || undefined,
            last_name: newCustomer.contact_last_name.trim() || undefined,
            contact_email: newCustomer.contact_email.trim() || undefined,
            contact_phone: newCustomer.contact_phone.trim() || undefined,
            domain_id: newCustomer.domain_id,
            region_id: newCustomer.region_id,
          } as Partial<Contact>);
          primaryContactId = contact.id;
        }

        const created = await marketingAPI.createCustomer({
          company_name: newCustomer.company_name.trim(),
          domain_id: newCustomer.domain_id,
          region_id: newCustomer.region_id,
          primary_contact_contact_id: primaryContactId,
          plants: [
            {
              plant_name: plantName,
              city: newCustomer.plant_city.trim() || undefined,
              address_line1: newCustomer.plant_address.trim() || undefined,
              domain_id: newCustomer.domain_id,
              region_id: newCustomer.region_id,
            },
          ],
        } as Partial<Customer>);
        effectiveCustomerId = created.id;
        {
          const pl = await marketingAPI.getPlants({ customer_id: created.id }).catch(() => []);
          effectivePlantId = pl?.[0]?.id;
        }
      }

      const payload: ServiceContractPayload = {
        customer_id: effectiveCustomerId as number,
        plant_id: effectivePlantId ?? null,
        contract_type: contractType,
        status,
        start_date: startDate || null,
        end_date: endDate || null,
        terms: terms.trim() || null,
        all_inclusive_with_charges: allInclusive,
        additional_charges_note: allInclusive ? additionalChargesNote.trim() || null : null,
        notes: notes.trim() || null,
        series_code: seriesCode.trim() || null,
        items: cleanItems,
      };

      if (isEdit && id) {
        await marketingAPI.updateServiceContract(Number(id), payload);
        showToast('Contract updated', 'success');
      } else {
        await marketingAPI.createServiceContract(payload);
        showToast('Contract created', 'success');
      }
      navigate('/service/contracts');
    } catch (e: any) {
      showToast(e?.message || `Failed to ${isEdit ? 'update' : 'create'} contract`, 'error');
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const breadcrumbs = [
    { label: 'Service', href: '/service/contracts' },
    { label: 'Contracts', href: '/service/contracts' },
    { label: isEdit ? 'Edit Contract' : 'New Contract' },
  ];

  if (isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Contract' : 'New Contract'} breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading contract...</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  const showCreateRow =
    canCreateCustomer && !isEdit && customerQuery.trim().length >= 2 && !customerSearching;

  return (
    <PageLayout
      title={isEdit ? 'Edit Contract' : 'New Contract'}
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex gap-2">
          {isEdit && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/service/contracts/${id}/plan`)}>
              Service plan
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/service/contracts')} leftIcon={<ArrowLeft size={14} />}>
            Back
          </Button>
        </div>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Customer</h3>

            {customerId != null ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Building2 size={16} className="text-slate-400" />
                  <span className="font-medium">{customerLabel || `Customer #${customerId}`}</span>
                </div>
                {!isEdit && (
                  <button type="button" onClick={clearCustomer} className="text-sm text-slate-600 hover:text-rose-600">
                    Change
                  </button>
                )}
              </div>
            ) : creatingCustomer ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <UserPlus size={15} /> New customer
                  </p>
                  <button type="button" onClick={clearCustomer} className="text-sm text-slate-600 hover:text-rose-600">
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Company name"
                    value={newCustomer.company_name}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, company_name: e.target.value }))}
                    placeholder="Customer company name"
                  />
                  <div className="hidden md:block" />
                  <Select
                    label="Domain"
                    options={domains.map((d) => ({ value: String(d.id), label: d.name }))}
                    value={newCustomer.domain_id != null ? String(newCustomer.domain_id) : ''}
                    onChange={(val) =>
                      setNewCustomer((p) => ({
                        ...p,
                        domain_id: val ? Number(val) : undefined,
                        region_id: undefined,
                      }))
                    }
                    placeholder="Select domain"
                    searchable
                  />
                  <Select
                    label="Region"
                    options={[{ value: '', label: 'None' }, ...regions.map((r) => ({ value: String(r.id), label: r.name }))]}
                    value={newCustomer.region_id != null ? String(newCustomer.region_id) : ''}
                    onChange={(val) => setNewCustomer((p) => ({ ...p, region_id: val ? Number(val) : undefined }))}
                    placeholder={newCustomer.domain_id ? 'Select region' : 'Select a domain first'}
                    searchable
                  />
                </div>

                {canCreateContact && (
                  <div className="pt-2 border-t border-blue-200/60">
                    <p className="text-xs font-medium text-slate-600 mb-2">Contact person</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex gap-2 items-end">
                        <div className="w-24 shrink-0">
                          <Select
                            label="Title"
                            options={NAME_PREFIXES}
                            value={newCustomer.contact_title}
                            onChange={(v) => setNewCustomer((p) => ({ ...p, contact_title: (v ?? '') as string }))}
                            placeholder="—"
                            searchable={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Input
                            label="First name"
                            value={newCustomer.contact_first_name}
                            onChange={(e) => setNewCustomer((p) => ({ ...p, contact_first_name: e.target.value }))}
                            placeholder="First name"
                          />
                        </div>
                      </div>
                      <Input
                        label="Last name"
                        value={newCustomer.contact_last_name}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, contact_last_name: e.target.value }))}
                        placeholder="Last name"
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={newCustomer.contact_email}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, contact_email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                      <Input
                        label="Phone"
                        type="tel"
                        value={newCustomer.contact_phone}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, contact_phone: e.target.value }))}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-blue-200/60">
                  <p className="text-xs font-medium text-slate-600 mb-2">
                    Plant / site <span className="font-normal text-slate-400">— leave blank and we'll create a "Main site" at the company address</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="Plant name"
                      value={newCustomer.plant_name}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, plant_name: e.target.value }))}
                      placeholder="e.g. Main Plant"
                    />
                    <Input
                      label="City"
                      value={newCustomer.plant_city}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, plant_city: e.target.value }))}
                    />
                    <Input
                      label="Address"
                      value={newCustomer.plant_address}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, plant_address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative max-w-xl">
                <Input
                  label="Find customer"
                  value={customerQuery}
                  onChange={(e) => onCustomerQueryChange(e.target.value)}
                  onFocus={() => customerQuery.trim().length >= 2 && setShowCustomerMenu(true)}
                  onBlur={() => setTimeout(() => setShowCustomerMenu(false), 150)}
                  placeholder="Type a company or contact name (or email / phone)"
                />
                {showCustomerMenu && customerQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                    {customerSearching && (
                      <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>
                    )}
                    {!customerSearching && customerResults.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400">No matching customers.</p>
                    )}
                    {customerResults.map((c) => {
                      const person = customerPrimaryContactName(c);
                      const sub = [person, c.primary_contact_contact?.contact_phone]
                        .filter(Boolean)
                        .join(' · ');
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickCustomer(c);
                          }}
                        >
                          <span className="font-medium text-slate-800">{c.company_name}</span>
                          {sub && <span className="text-xs text-slate-500">{sub}</span>}
                        </button>
                      );
                    })}
                    {showCreateRow && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 border-t border-slate-100 flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          startCreateCustomer();
                        }}
                      >
                        <Plus size={14} />
                        Create “{customerQuery.trim()}” as a new customer
                      </button>
                    )}
                  </div>
                )}
                {!canCreateCustomer && (
                  <p className="text-xs text-slate-400 mt-1">
                    You can only link an existing customer (no permission to create one).
                  </p>
                )}
              </div>
            )}

            {/* Plant selector for an existing customer */}
            {customerId != null && (
              <div className="max-w-xl">
                <Select
                  label="Plant / Site (optional)"
                  options={[
                    { value: '', label: 'None' },
                    ...plants.map((p) => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` })),
                  ]}
                  value={plantId != null ? String(plantId) : ''}
                  onChange={(val) => setPlantId(val ? Number(val) : undefined)}
                  placeholder={plants.length ? 'Select plant' : 'No plants on this customer'}
                  searchable
                />
              </div>
            )}
          </div>

          {/* Contract terms */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-lg font-semibold text-slate-900">Contract</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Type"
                options={SERVICE_CONTRACT_TYPES.map((t) => ({ value: t, label: t }))}
                value={contractType}
                onChange={(val) => setContractType((val as ServiceContractType) || '')}
                placeholder="Select type (AMC / AMC-I / CMC / CMC-I)"
                clearable={false}
              />
              <Select
                label="Status"
                options={SERVICE_CONTRACT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                value={status}
                onChange={(val) => setStatus((val as ServiceContractStatus) || 'draft')}
                clearable={false}
              />
              <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Terms &amp; conditions</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Contract terms, SLAs, scope notes..."
              />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allInclusive}
                  onChange={(e) => setAllInclusive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Everything inclusive, but additional charges are built into the contract
              </label>
              {allInclusive && (
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={additionalChargesNote}
                  onChange={(e) => setAdditionalChargesNote(e.target.value)}
                  placeholder="Describe the additional charges built into this contract"
                />
              )}
            </div>
          </div>

          {/* Coverage lines */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">What's included &amp; what's chargeable</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  e.g. spare parts included; compressor, PLC, HMI, sensors chargeable — unless agreed otherwise for this customer.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setItems((p) => [...p, emptyItem()])}>
                Add line
              </Button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No coverage lines yet.</p>
            ) : (
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 p-2">
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        placeholder="Item, e.g. Compressor"
                        value={it.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                      />
                    </div>
                    <div className="w-40">
                      <Select
                        options={[
                          { value: 'included', label: 'Included' },
                          { value: 'chargeable', label: 'Chargeable' },
                        ]}
                        value={it.coverage}
                        onChange={(val) => updateItem(idx, { coverage: (val as 'included' | 'chargeable') || 'included' })}
                        clearable={false}
                        searchable={false}
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        placeholder="Note (optional), e.g. included by agreement"
                        value={it.note || ''}
                        onChange={(e) => updateItem(idx, { note: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                      className="p-2 text-slate-400 hover:text-rose-600"
                      title="Remove line"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Misc */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Numbering series code (optional)"
                value={seriesCode}
                onChange={(e) => setSeriesCode(e.target.value)}
                placeholder="e.g. service_contract_no"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Internal notes</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes about this contract"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => navigate('/service/contracts')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Contract' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
};
