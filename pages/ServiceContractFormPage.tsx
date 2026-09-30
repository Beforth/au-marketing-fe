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
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText, INDIAN_STATES, INDUSTRY_OPTIONS } from '../constants';
import { SearchSuggestion } from '../components/ui/SearchSuggestion';
import { SeriesSelect } from '../components/service/SeriesSelect';
import { serializePhoneWithCountryCode, parsePhoneWithCountryCode } from '../lib/name-phone-utils';
import { ArrowLeft, Plus, X, Building2, Factory, User as UserIcon, UserPlus } from 'lucide-react';
import {
  marketingAPI,
  ServiceContractItem,
  ServiceContractPartAlias,
  ServiceContractPayload,
  ServiceContractType,
  ServiceContractStatus,
  SERVICE_CONTRACT_TYPES,
  SERVICE_CONTRACT_STATUSES,
  Plant,
  Organization,
  Customer,
  Contact,
  Domain,
  Region,
  customerPrimaryContactName,
  customerDisambiguator,
} from '../lib/marketing-api';

const emptyAlias = (): ServiceContractPartAlias => ({ our_name: '', customer_name: '' });
const emptyItem = (): ServiceContractItem => ({ name: '', coverage: 'included', note: '' });

const ORGANIZATION_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

// New customer = contact person -> company (organization) -> plant, same order as the Lead form.
interface NewCustomerForm {
  contact_title: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone_code: string;
  contact_phone: string;
  contact_email: string;
  contact_job_title: string;
  // Only used when a NEW organization is created (an existing one is picked via selectedOrg)
  org_code: string;
  org_website: string;
  org_industry: string;
  org_size: string;
  domain_id?: number;
  region_id?: number;
}

interface NewPlantForm {
  plant_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
}

const emptyNewCustomer = (): NewCustomerForm => ({
  contact_title: '',
  contact_first_name: '',
  contact_last_name: '',
  contact_phone_code: DEFAULT_COUNTRY_CODE,
  contact_phone: '',
  contact_email: '',
  contact_job_title: '',
  org_code: '',
  org_website: '',
  org_industry: '',
  org_size: '',
  domain_id: undefined,
  region_id: undefined,
});

const emptyNewPlant = (): NewPlantForm => ({
  plant_name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
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
  const canCreateOrg = useAppSelector(selectHasPermission('marketing.create_organization'));
  const canCreatePlant = useAppSelector(selectHasPermission('marketing.create_plant'));

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

  // Company (organization) + plant for a NEW customer
  const [orgQuery, setOrgQuery] = useState('');
  const [orgSuggestions, setOrgSuggestions] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgPlants, setOrgPlants] = useState<Plant[]>([]);
  const [newCustPlantId, setNewCustPlantId] = useState<number | undefined>(undefined);
  const [addingNewPlant, setAddingNewPlant] = useState(false);
  const [newPlant, setNewPlant] = useState<NewPlantForm>(emptyNewPlant());
  const orgSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // "Did you mean an existing contact?" — typing a name looks for contacts that already exist
  type NameSuggestion = { kind: 'contact'; contact: Contact } | { kind: 'customer'; customer: Customer };
  const [contactSuggestions, setContactSuggestions] = useState<NameSuggestion[]>([]);
  const [linkedContact, setLinkedContact] = useState<Contact | null>(null);
  const contactSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Organization of the picked EXISTING customer, so its (organization) plants can be offered too
  const [addingPlantExisting, setAddingPlantExisting] = useState(false);
  const [existingNewPlant, setExistingNewPlant] = useState<NewPlantForm>(emptyNewPlant());
  const [savingPlantExisting, setSavingPlantExisting] = useState(false);
  const [customerOrgId, setCustomerOrgId] = useState<number | undefined>(undefined);

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
  const [contractNumber, setContractNumber] = useState('');  // the contract's existing number (edit mode) — never changed
  const [items, setItems] = useState<ServiceContractItem[]>([]);
  const [aliases, setAliases] = useState<ServiceContractPartAlias[]>([]);

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
        const own = await marketingAPI.getPlants({ customer_id: customerId }).catch(() => [] as Plant[]);
        // Customers linked to an organization keep their plants on the organization
        const orgLevel = customerOrgId ? await marketingAPI.getOrganizationPlants(customerOrgId).catch(() => [] as Plant[]) : [];
        const seen = new Set<number>();
        const merged = [...(own || []), ...(orgLevel || [])].filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
        if (!cancelled) setPlants(merged);
      } catch {
        if (!cancelled) setPlants([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, customerOrgId]);

  // A new contract opens straight on the contact -> organization -> plant form (like the Lead form).
  // Users without permission to create customers keep the plain "Find customer" search.
  useEffect(() => {
    if (!isEdit && canCreateCustomer && !creatingCustomer && customerId == null) startCreateCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, canCreateCustomer, creatingCustomer, customerId]);

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
        .then((full) => {
          setCustomerLabel(customerDisplay(full));
          setCustomerOrgId(full.organization_id ?? undefined);
        })
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
      setContractNumber(c.contract_number || '');
      setItems((c.items || []).map((it) => ({ name: it.name, coverage: it.coverage, note: it.note || '' })));
      setAliases((c.part_aliases || []).map((a) => ({ our_name: a.our_name, customer_name: a.customer_name })));
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
    setContactSuggestions([]);
    setCustomerId(c.id);
    setCustomerOrgId(c.organization_id ?? undefined);
    setCustomerLabel(customerDisplay(c));
    setCustomerQuery('');
    setCustomerResults([]);
    setShowCustomerMenu(false);
    setCreatingCustomer(false);
    setPlantId(undefined);
  };

  const setContactName = (field: 'contact_first_name' | 'contact_last_name', value: string) => {
    const next = { ...newCustomer, [field]: value };
    setNewCustomer(next);
    if (contactSearchTimeoutRef.current) clearTimeout(contactSearchTimeoutRef.current);
    const q = [next.contact_first_name, next.contact_last_name].filter(Boolean).join(' ').trim();
    if (q.length < 2) {
      setContactSuggestions([]);
      return;
    }
    contactSearchTimeoutRef.current = setTimeout(() => {
      Promise.all([
        marketingAPI.searchContacts(q, 6).catch(() => [] as Contact[]),
        marketingAPI.searchCustomers(q, 6).catch(() => [] as Customer[]),
      ]).then(([contacts, customers]) =>
        setContactSuggestions([
          ...(contacts || []).map((contact): NameSuggestion => ({ kind: 'contact', contact })),
          ...(customers || []).map((customer): NameSuggestion => ({ kind: 'customer', customer })),
        ])
      );
    }, 300);
  };

  const contactDisplayName = (c: Contact) =>
    [c.title, c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.contact_person_name || '';

  // Use an existing contact instead of creating a duplicate; bring its company and plant along
  const pickExistingContact = (c: Contact) => {
    // This person already became a customer (like Leads: one contact = one customer) — connect to that customer, don't make another
    if (c.is_converted && c.converted_to_customer_id) {
      setContactSuggestions([]);
      marketingAPI
        .getCustomer(c.converted_to_customer_id)
        .then((cust) => {
          pickCustomer(cust);
          showToast(`${contactDisplayName(c)} is already a customer — connected to it`, 'success');
        })
        .catch(() => showToast('Could not load that customer', 'error'));
      return;
    }
    const { code, number } = parsePhoneWithCountryCode(c.contact_phone);
    setLinkedContact(c);
    setContactSuggestions([]);
    setNewCustomer((p) => ({
      ...p,
      contact_title: c.title || '',
      contact_first_name: c.first_name || '',
      contact_last_name: c.last_name || '',
      contact_phone_code: code || DEFAULT_COUNTRY_CODE,
      contact_phone: number,
      contact_email: c.contact_email || '',
      contact_job_title: c.contact_job_title || '',
      domain_id: c.domain_id ?? p.domain_id,
      region_id: c.region_id ?? p.region_id,
    }));
    if (c.organization_id && c.organization) {
      setSelectedOrg(c.organization);
      setOrgQuery(c.organization.name);
      setOrgSuggestions([]);
      setAddingNewPlant(false);
      marketingAPI
        .getOrganizationPlants(c.organization_id)
        .then((pl) => {
          setOrgPlants(pl || []);
          if (c.plant_id && (pl || []).some((x) => x.id === c.plant_id)) setNewCustPlantId(c.plant_id ?? undefined);
          else if (pl?.length === 1) setNewCustPlantId(pl[0].id);
        })
        .catch(() => setOrgPlants([]));
    }
    showToast('Existing contact linked', 'success');
  };

  // Add a plant to the already-chosen customer (on its organization if it has one)
  const saveExistingCustomerPlant = async () => {
    if (customerId == null) return;
    if (!existingNewPlant.plant_name.trim()) {
      showToast('Enter a name for the new plant', 'error');
      return;
    }
    setSavingPlantExisting(true);
    try {
      const payload = {
        plant_name: existingNewPlant.plant_name.trim(),
        address_line1: existingNewPlant.address_line1.trim() || undefined,
        address_line2: existingNewPlant.address_line2.trim() || undefined,
        city: existingNewPlant.city.trim() || undefined,
        state: existingNewPlant.state.trim() || undefined,
        postal_code: existingNewPlant.postal_code.trim() || undefined,
      };
      const created = customerOrgId
        ? await marketingAPI.createOrganizationPlant(customerOrgId, payload)
        : await marketingAPI.createPlant({ ...payload, customer_id: customerId } as Partial<Plant>);
      setPlants((prev) => [...prev, created]);
      setPlantId(created.id);
      setAddingPlantExisting(false);
      setExistingNewPlant(emptyNewPlant());
      showToast('Plant added', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to add plant', 'error');
    } finally {
      setSavingPlantExisting(false);
    }
  };

  const unlinkContact = () => {
    setLinkedContact(null);
    setNewCustomer((p) => ({
      ...p,
      contact_title: '',
      contact_first_name: '',
      contact_last_name: '',
      contact_phone_code: DEFAULT_COUNTRY_CODE,
      contact_phone: '',
      contact_email: '',
      contact_job_title: '',
    }));
  };

  const resetOrgAndPlant = (orgName = '') => {
    setLinkedContact(null);
    setContactSuggestions([]);
    setOrgQuery(orgName);
    setOrgSuggestions([]);
    setSelectedOrg(null);
    setOrgPlants([]);
    setNewCustPlantId(undefined);
    setAddingNewPlant(false);
    setNewPlant(emptyNewPlant());
  };

  const onOrgQueryChange = (v: string) => {
    setOrgQuery(v);
    setSelectedOrg(null);
    setOrgPlants([]);
    setNewCustPlantId(undefined);
    setAddingNewPlant(false);
    if (orgSearchTimeoutRef.current) clearTimeout(orgSearchTimeoutRef.current);
    const term = v.trim();
    if (term.length < 2) {
      setOrgSuggestions([]);
      return;
    }
    orgSearchTimeoutRef.current = setTimeout(() => {
      marketingAPI
        .getOrganizations({ page: 1, page_size: 15, search: term, is_active: true })
        .then((res) => setOrgSuggestions(res?.items || []))
        .catch(() => setOrgSuggestions([]));
    }, 300);
  };

  const pickOrganization = (org: Organization) => {
    setSelectedOrg(org);
    setOrgQuery(org.name);
    setOrgSuggestions([]);
    setAddingNewPlant(false);
    setNewCustPlantId(undefined);
    marketingAPI
      .getOrganizationPlants(org.id)
      .then((pl) => {
        setOrgPlants(pl || []);
        if (pl?.length === 1) setNewCustPlantId(pl[0].id);
      })
      .catch(() => setOrgPlants([]));
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
      domain_id: scope?.domain_id,
      region_id: scope?.region_id ?? scope?.region_ids?.[0],
    });
    resetOrgAndPlant(customerQuery.trim());
  };

  const clearCustomer = () => {
    setCustomerId(undefined);
    setCustomerOrgId(undefined);
    setCustomerLabel('');
    setCreatingCustomer(false);
    setNewCustomer(emptyNewCustomer());
    resetOrgAndPlant();
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
      if (canCreateContact && !linkedContact && !newCustomer.contact_first_name.trim() && !newCustomer.contact_last_name.trim()) {
        showToast('Enter the contact person’s name for the new customer', 'error');
        return;
      }
      if (!selectedOrg && !orgQuery.trim()) {
        showToast('Select or enter the company (organization) for the new customer', 'error');
        return;
      }
      if (!selectedOrg && !canCreateOrg) {
        showToast('You can only link an existing organization — pick one from the list', 'error');
        return;
      }
      const creatingPlant = !selectedOrg || addingNewPlant;
      if (creatingPlant) {
        if (!newPlant.plant_name.trim()) {
          showToast(selectedOrg ? 'Enter a name for the new plant' : 'Plant name is required when creating a new organization', 'error');
          return;
        }
        if (selectedOrg && !canCreatePlant) {
          showToast('You do not have permission to add plants — pick an existing one', 'error');
          return;
        }
      } else if (!newCustPlantId) {
        showToast('Select a plant for the new customer', 'error');
        return;
      }
      if (!newCustomer.domain_id) {
        showToast('Select a domain for the new customer', 'error');
        return;
      }
    } else if (effectiveCustomerId == null) {
      showToast('Please select a customer', 'error');
      return;
    } else if (effectivePlantId == null) {
      showToast('Select or add a plant for this contract', 'error');
      return;
    }

    const cleanItems = items
      .map((it) => ({ ...it, name: it.name.trim(), note: (it.note || '').trim() || undefined }))
      .filter((it) => it.name);

    const cleanAliases = aliases
      .map((a) => ({ our_name: a.our_name.trim(), customer_name: a.customer_name.trim() }))
      .filter((a) => a.our_name && a.customer_name);

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      // 1. Create the customer first if we're in inline-create mode
      if (!isEdit && creatingCustomer) {
        const plantPayload = {
          plant_name: newPlant.plant_name.trim(),
          address_line1: newPlant.address_line1.trim() || undefined,
          address_line2: newPlant.address_line2.trim() || undefined,
          city: newPlant.city.trim() || undefined,
          state: newPlant.state.trim() || undefined,
          postal_code: newPlant.postal_code.trim() || undefined,
          domain_id: newCustomer.domain_id,
          region_id: newCustomer.region_id,
        };

        // 1a. Company (organization) + plant — link existing or create new
        let org = selectedOrg;
        let plantIdForCustomer: number | undefined = newCustPlantId;
        if (!org) {
          org = await marketingAPI.createOrganization({
            name: orgQuery.trim(),
            code: newCustomer.org_code.trim() || undefined,
            website: newCustomer.org_website.trim() || undefined,
            industry: newCustomer.org_industry.trim() || undefined,
            organization_size: newCustomer.org_size.trim() || undefined,
            is_active: true,
            plants: [plantPayload],
          });
          // Remember it so a retry after a later failure re-uses it instead of creating a duplicate
          setSelectedOrg(org);
          const pl = await marketingAPI.getOrganizationPlants(org.id).catch(() => [] as Plant[]);
          setOrgPlants(pl || []);
          plantIdForCustomer = pl?.[0]?.id;
          setNewCustPlantId(plantIdForCustomer);
          setAddingNewPlant(false);
        } else if (addingNewPlant) {
          const created = await marketingAPI.createOrganizationPlant(org.id, plantPayload);
          plantIdForCustomer = created.id;
          setOrgPlants((prev) => [...prev, created]);
          setNewCustPlantId(created.id);
          setAddingNewPlant(false);
        }

        // 1b. Contact person, if named and allowed
        let primaryContactId: number | undefined;
        const hasContactName = newCustomer.contact_first_name.trim() || newCustomer.contact_last_name.trim();
        if (linkedContact) {
          // Re-use the existing contact. Only if it had no company yet do we attach the one chosen here.
          primaryContactId = linkedContact.id;
          if (!linkedContact.organization_id) {
            await marketingAPI
              .updateContact(linkedContact.id, { organization_id: org.id, plant_id: plantIdForCustomer } as Partial<Contact>)
              .catch(() => undefined);
          }
        } else if (canCreateContact && hasContactName) {
          const contact = await marketingAPI.createContact({
            title: newCustomer.contact_title.trim() || undefined,
            first_name: newCustomer.contact_first_name.trim() || undefined,
            last_name: newCustomer.contact_last_name.trim() || undefined,
            contact_job_title: newCustomer.contact_job_title.trim() || undefined,
            contact_email: newCustomer.contact_email.trim() || undefined,
            contact_phone:
              serializePhoneWithCountryCode(newCustomer.contact_phone_code, newCustomer.contact_phone)?.trim() || undefined,
            organization_id: org.id,
            plant_id: plantIdForCustomer,
            domain_id: newCustomer.domain_id,
            region_id: newCustomer.region_id,
          } as Partial<Contact>);
          primaryContactId = contact.id;
        }

        const created = await marketingAPI.createCustomer({
          company_name: org.name,
          organization_id: org.id,
          plant_id: plantIdForCustomer,
          domain_id: newCustomer.domain_id,
          region_id: newCustomer.region_id,
          primary_contact_contact_id: primaryContactId,
          // marks the contact as converted (same as Leads), so the next contract for this person finds this customer
          converted_from_contact_id: primaryContactId,
        } as Partial<Customer>);
        effectiveCustomerId = created.id;
        effectivePlantId = plantIdForCustomer;
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
        part_aliases: cleanAliases,
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
              <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <UserPlus size={15} /> New customer
                  </p>
                  <button type="button" onClick={clearCustomer} className="text-sm text-slate-600 hover:text-rose-600">
                    Clear form
                  </button>
                </div>

                {/* 1. Primary contact */}
                {canCreateContact && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight border-l-2 border-blue-500/30 pl-3">
                      <UserIcon size={18} /> Primary contact
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Who is the main contact for this customer?</p>
                    {linkedContact && (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        <span>
                          Using existing contact <span className="font-semibold">{contactDisplayName(linkedContact)}</span>
                          {linkedContact.organization?.name ? ` · ${linkedContact.organization.name}` : ' · no organization yet'}
                        </span>
                        <button type="button" onClick={unlinkContact} className="text-xs font-medium text-emerald-700 hover:text-rose-600 underline">
                          Not this person — unlink
                        </button>
                      </div>
                    )}
                    <div className="rounded-lg border border-slate-200 bg-white p-5">
                      <div className="grid grid-cols-12 gap-x-4 gap-y-4">
                        <div className="col-span-12 lg:col-span-2">
                          <Select
                            label="Title"
                            options={NAME_PREFIXES}
                            value={newCustomer.contact_title}
                            onChange={(v) => setNewCustomer((p) => ({ ...p, contact_title: (v ?? '') as string }))}
                            placeholder="—"
                            searchable={false}
                            inputSize="md"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-6 lg:col-span-5">
                          <Input
                            label="First name"
                            value={newCustomer.contact_first_name}
                            disabled={!!linkedContact}
                            onChange={(e) => setContactName('contact_first_name', e.target.value)}
                            placeholder="First name"
                            className="h-10"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-6 lg:col-span-5 relative">
                          <Input
                            label="Last name"
                            value={newCustomer.contact_last_name}
                            disabled={!!linkedContact}
                            onChange={(e) => setContactName('contact_last_name', e.target.value)}
                            placeholder="Last name"
                            className="h-10"
                          />
                          {!linkedContact && (
                            <SearchSuggestion
                              items={contactSuggestions}
                              onSelect={(it) => (it.kind === 'contact' ? pickExistingContact(it.contact) : pickCustomer(it.customer))}
                              title="Did you mean an existing contact or customer?"
                              renderItem={(it) =>
                                it.kind === 'contact'
                                  ? {
                                      id: `contact-${it.contact.id}`,
                                      title: contactDisplayName(it.contact),
                                      subtitle: it.contact.organization?.name || 'No Organization',
                                      rightText: it.contact.contact_phone || undefined,
                                    }
                                  : {
                                      id: `customer-${it.customer.id}`,
                                      title: it.customer.company_name,
                                      subtitle: `${customerPrimaryContactName(it.customer) ? `${customerPrimaryContactName(it.customer)} · ` : ''}${customerDisambiguator(it.customer)}`,
                                    }
                              }
                            />
                          )}
                        </div>

                        <div className="col-span-12 md:col-span-4 lg:col-span-3">
                          <Select
                            label="Country Code"
                            options={COUNTRY_CODES}
                            value={newCustomer.contact_phone_code}
                            onChange={(v) => setNewCustomer((p) => ({ ...p, contact_phone_code: (v ?? '') as string }))}
                            placeholder="Code"
                            searchable
                            getSearchText={getCountryCodeSearchText}
                            inputSize="md"
                            clearable={false}
                          />
                        </div>
                        <div className="col-span-12 md:col-span-8 lg:col-span-9">
                          <Input
                            label="Phone number"
                            type="tel"
                            value={newCustomer.contact_phone}
                            disabled={!!linkedContact}
                            onChange={(e) => setNewCustomer((p) => ({ ...p, contact_phone: e.target.value }))}
                            placeholder="Number"
                            className="h-10"
                          />
                        </div>

                        <div className="col-span-12 md:col-span-6">
                          <Input
                            label="Email address"
                            type="email"
                            value={newCustomer.contact_email}
                            disabled={!!linkedContact}
                            onChange={(e) => setNewCustomer((p) => ({ ...p, contact_email: e.target.value }))}
                            placeholder="email@example.com"
                            className="h-10"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-6">
                          <Input
                            label="Designation / Job title"
                            value={newCustomer.contact_job_title}
                            disabled={!!linkedContact}
                            onChange={(e) => setNewCustomer((p) => ({ ...p, contact_job_title: e.target.value }))}
                            placeholder="e.g. Director"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Company / organization */}
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight border-l-2 border-blue-500/30 pl-3">
                    <Building2 size={18} /> Organization
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Link the company or add a new one.</p>
                  <div className="relative">
                    <Input
                      label="Company / Organization name"
                      value={orgQuery}
                      onChange={(e) => onOrgQueryChange(e.target.value)}
                      onBlur={() => setTimeout(() => setOrgSuggestions([]), 150)}
                      placeholder="Type to search and link existing organization..."
                      rightElement={
                        selectedOrg ? (
                          <button type="button" onClick={() => { setOrgQuery(''); onOrgQueryChange(''); }} className="p-1.5 text-slate-400 hover:text-rose-600" title="Clear">
                            <X size={16} />
                          </button>
                        ) : undefined
                      }
                    />
                    <SearchSuggestion
                      items={orgSuggestions}
                      onSelect={pickOrganization}
                      title="Existing organizations"
                      icon={Building2}
                      renderItem={(o) => ({ id: o.id, title: o.name, subtitle: o.industry || undefined })}
                    />
                  </div>
                  {selectedOrg && (
                    <p className="text-xs text-emerald-700">Linked to existing organization “{selectedOrg.name}”.</p>
                  )}
                  {!selectedOrg && orgQuery.trim().length >= 2 && (
                    <>
                      {canCreateOrg ? (
                        <p className="text-xs text-slate-500">No match picked — a new organization “{orgQuery.trim()}” will be created on save.</p>
                      ) : (
                        <p className="text-xs text-amber-700">You can only link an existing organization — pick one from the list.</p>
                      )}
                      {canCreateOrg && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input label="Code" value={newCustomer.org_code} onChange={(e) => setNewCustomer((p) => ({ ...p, org_code: e.target.value }))} placeholder="Optional code" />
                          <Input label="Website" value={newCustomer.org_website} onChange={(e) => setNewCustomer((p) => ({ ...p, org_website: e.target.value }))} placeholder="https://..." />
                          <Select label="Industry" options={INDUSTRY_OPTIONS} value={newCustomer.org_industry} onChange={(v) => setNewCustomer((p) => ({ ...p, org_industry: (v as string) || '' }))} placeholder="Select industry..." />
                          <Select label="Size of organization" options={ORGANIZATION_SIZES} value={newCustomer.org_size} onChange={(v) => setNewCustomer((p) => ({ ...p, org_size: (v as string) || '' }))} placeholder="Select size" searchable />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 3. Plant */}
                {(selectedOrg || (orgQuery.trim().length >= 2 && canCreateOrg)) && (
                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 tracking-tight border-l-2 border-blue-500/30 pl-3">
                      <Factory size={18} /> Plant
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {selectedOrg ? "Pick one of this company's plants or add a new one." : 'Required for a new company.'}
                    </p>
                    {selectedOrg && !addingNewPlant && (
                      <div className="flex items-end gap-2 max-w-xl">
                        <div className="flex-1">
                          <Select
                            label="Plant / Site"
                            options={orgPlants.map((pl) => ({ value: String(pl.id), label: pl.plant_name || `Plant ${pl.id}` }))}
                            value={newCustPlantId != null ? String(newCustPlantId) : ''}
                            onChange={(val) => setNewCustPlantId(val ? Number(val) : undefined)}
                            placeholder={orgPlants.length ? 'Select plant' : 'No plants yet — add one'}
                            searchable
                          />
                        </div>
                        {canCreatePlant && (
                          <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddingNewPlant(true)}>
                            New plant
                          </Button>
                        )}
                      </div>
                    )}
                    {(!selectedOrg || addingNewPlant) && (
                      <div className="space-y-3">
                        {selectedOrg && (
                          <button type="button" className="text-xs text-slate-600 hover:text-blue-700" onClick={() => { setAddingNewPlant(false); setNewPlant(emptyNewPlant()); }}>
                            ← Pick an existing plant instead
                          </button>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input label="Plant name" value={newPlant.plant_name} onChange={(e) => setNewPlant((p) => ({ ...p, plant_name: e.target.value }))} placeholder="e.g. Main Plant" />
                          <Input label="City" value={newPlant.city} onChange={(e) => setNewPlant((p) => ({ ...p, city: e.target.value }))} />
                          <Input label="Address line 1" value={newPlant.address_line1} onChange={(e) => setNewPlant((p) => ({ ...p, address_line1: e.target.value }))} />
                          <Input label="Address line 2" value={newPlant.address_line2} onChange={(e) => setNewPlant((p) => ({ ...p, address_line2: e.target.value }))} />
                          <Select label="State" options={INDIAN_STATES} value={newPlant.state} onChange={(v) => setNewPlant((p) => ({ ...p, state: (v as string) || '' }))} placeholder="Select or type state..." isCombobox creatable searchable />
                          <Input label="Pin / Postal code" value={newPlant.postal_code} onChange={(e) => setNewPlant((p) => ({ ...p, postal_code: e.target.value }))} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Territory */}
                <div className="border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label="Domain"
                    options={domains.map((d) => ({ value: String(d.id), label: d.name }))}
                    value={newCustomer.domain_id != null ? String(newCustomer.domain_id) : ''}
                    onChange={(val) => setNewCustomer((p) => ({ ...p, domain_id: val ? Number(val) : undefined, region_id: undefined }))}
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
                          <span className="text-[11px] text-slate-400">{customerDisambiguator(c)}</span>
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

            {/* Plant selector for an existing customer — required */}
            {customerId != null && (
              <div className="space-y-3">
                {!addingPlantExisting ? (
                  <div className="flex items-end gap-2 max-w-xl">
                    <div className="flex-1">
                      <Select
                        label="Plant / Site *"
                        options={plants.map((p) => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` }))}
                        value={plantId != null ? String(plantId) : ''}
                        onChange={(val) => setPlantId(val ? Number(val) : undefined)}
                        placeholder={plants.length ? 'Select plant' : 'No plants yet — add one'}
                        searchable
                      />
                    </div>
                    <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddingPlantExisting(true)}>
                      New plant
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <button type="button" className="text-xs text-slate-600 hover:text-blue-700" onClick={() => { setAddingPlantExisting(false); setExistingNewPlant(emptyNewPlant()); }}>
                      ← Pick an existing plant instead
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Plant name" value={existingNewPlant.plant_name} onChange={(e) => setExistingNewPlant((p) => ({ ...p, plant_name: e.target.value }))} placeholder="e.g. Main Plant" />
                      <Input label="City" value={existingNewPlant.city} onChange={(e) => setExistingNewPlant((p) => ({ ...p, city: e.target.value }))} />
                      <Input label="Address line 1" value={existingNewPlant.address_line1} onChange={(e) => setExistingNewPlant((p) => ({ ...p, address_line1: e.target.value }))} />
                      <Input label="Address line 2" value={existingNewPlant.address_line2} onChange={(e) => setExistingNewPlant((p) => ({ ...p, address_line2: e.target.value }))} />
                      <Select label="State" options={INDIAN_STATES} value={existingNewPlant.state} onChange={(v) => setExistingNewPlant((p) => ({ ...p, state: (v as string) || '' }))} placeholder="Select or type state..." isCombobox creatable searchable />
                      <Input label="Pin / Postal code" value={existingNewPlant.postal_code} onChange={(e) => setExistingNewPlant((p) => ({ ...p, postal_code: e.target.value }))} />
                    </div>
                    <Button type="button" size="sm" onClick={saveExistingCustomerPlant} disabled={savingPlantExisting}>
                      {savingPlantExisting ? 'Saving…' : 'Save plant'}
                    </Button>
                  </div>
                )}
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

          {/* Customer part names (per contract) */}
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Customer's part names</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  If this customer calls a part by a different name, add it here. Work orders under this contract will then show the customer's name next to ours. Applies to this contract only.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setAliases((p) => [...p, emptyAlias()])}>
                Add name
              </Button>
            </div>
            {aliases.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No customer part names yet.</p>
            ) : (
              <div className="space-y-2">
                {aliases.map((a, idx) => (
                  <div key={idx} className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-200 p-2">
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        placeholder="Our name / code"
                        value={a.our_name}
                        onChange={(e) => setAliases((p) => p.map((x, i) => (i === idx ? { ...x, our_name: e.target.value } : x)))}
                      />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        placeholder="Customer's name for it"
                        value={a.customer_name}
                        onChange={(e) => setAliases((p) => p.map((x, i) => (i === idx ? { ...x, customer_name: e.target.value } : x)))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAliases((p) => p.filter((_, i) => i !== idx))}
                      className="p-2 text-slate-400 hover:text-rose-600"
                      title="Remove"
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
              {isEdit && contractNumber ? (
                <div>
                  <p className="text-xs font-semibold text-slate-700 ml-0.5 mb-1.5">Contract number</p>
                  <div className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-sm font-semibold text-slate-800">{contractNumber}</div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 ml-0.5">Already numbered — a number can't be changed.</p>
                </div>
              ) : (
                <SeriesSelect value={seriesCode} onChange={setSeriesCode} />
              )}
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
