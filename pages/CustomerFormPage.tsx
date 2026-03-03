/**
 * Customer Form Page
 * Create or edit a customer with location management
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectEmployee, selectUser } from '../store/slices/authSlice';
import { marketingAPI, Customer, Domain, Region, Organization, Contact, Plant, contactCompanyName } from '../lib/marketing-api';
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText } from '../constants';
import { parseNameWithPrefix, serializeNameWithPrefix, parsePhoneWithCountryCode, serializePhoneWithCountryCode } from '../lib/name-phone-utils';
import { getStoredMarketingScope } from '../lib/marketing-scope';
import { ArrowLeft, ArrowRight, Building2, User, Globe, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

export const CustomerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();
  const employee = useAppSelector(selectEmployee);
  const user = useAppSelector(selectUser);
  const isEdit = Boolean(id);
  
  const canCreate = useAppSelector(selectHasPermission('marketing.create_customer'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_customer'));
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [primaryContactContactId, setPrimaryContactContactId] = useState<number | null>(null);
  const [domainRegionCollapsed, setDomainRegionCollapsed] = useState(true);
  const [contactSuggestions, setContactSuggestions] = useState<Contact[]>([]);
  const [orgSuggestions, setOrgSuggestions] = useState<Organization[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [showPlantInline, setShowPlantInline] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState<{ name: string; code: string; description: string; website: string; industry: string; organization_size: string }>({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' });
  const [newPlantForm, setNewPlantForm] = useState<Partial<Plant>>({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' });
  const [plantModalData, setPlantModalData] = useState<Partial<Plant>>({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' });
  const [savingModal, setSavingModal] = useState(false);
  const contactSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orgSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canCreateOrg = useAppSelector(selectHasPermission('marketing.create_organization'));
  const canCreateContact = useAppSelector(selectHasPermission('marketing.create_contact'));
  const canCreatePlant = useAppSelector(selectHasPermission('marketing.create_plant'));
  const [createContactForm, setCreateContactForm] = useState<{ name_prefix: string; first_name: string; last_name: string; contact_email: string; phone_country_code: string; contact_phone: string; plant_id: number | undefined }>({ name_prefix: '', first_name: '', last_name: '', contact_email: '', phone_country_code: DEFAULT_COUNTRY_CODE, contact_phone: '', plant_id: undefined });
  const [primaryContactSearchQuery, setPrimaryContactSearchQuery] = useState('');
  const [selectedPrimaryContact, setSelectedPrimaryContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    company_name: '',
    notes: '',
    domain_id: undefined,
    region_id: undefined,
    organization_id: undefined,
    plant_id: undefined,
    series_code: undefined,
    series: undefined,
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) {
      setDomainRegionCollapsed(false);
      if (!canEdit) {
        showToast('You do not have permission to edit customers', 'error');
        navigate('/database/customers');
        return;
      }
      loadCustomer();
    } else {
      setDomainRegionCollapsed(true);
      if (!canCreate) {
        showToast('You do not have permission to create customers', 'error');
        navigate('/database/customers');
        return;
      }
    }
    loadDomains();
  }, [id, isEdit, canCreate, canEdit, employee?.id, user?.id]);

  const searchOrganizationsByName = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setOrgSuggestions([]);
      return;
    }
    setOrgSearchQuery(q);
    marketingAPI.getOrganizations({ page: 1, page_size: 15, search: q, is_active: true })
      .then(res => setOrgSuggestions(res.items ?? []))
      .catch(() => setOrgSuggestions([]));
  }, []);

  const onOrganizationSearchChange = useCallback((value: string) => {
    setSelectedOrganization(null);
    setFormData(prev => ({ ...prev, organization_id: undefined, plant_id: undefined }));
    setPlants([]);
    setNewOrgForm(prev => ({ ...prev, name: value }));
    if (orgSearchTimeoutRef.current) clearTimeout(orgSearchTimeoutRef.current);
    orgSearchTimeoutRef.current = setTimeout(() => searchOrganizationsByName(value), 300);
  }, [searchOrganizationsByName]);

  const clearOrganization = useCallback(() => {
    setSelectedOrganization(null);
    setFormData(prev => ({ ...prev, organization_id: undefined, plant_id: undefined, company_name: orgSearchQuery.trim() || prev.company_name }));
    setPlants([]);
    setNewOrgForm(prev => ({ ...prev, name: orgSearchQuery.trim() || prev.name }));
    setOrgSearchQuery('');
    setOrgSuggestions([]);
  }, [orgSearchQuery]);

  const contactDisplayName = useCallback((c: Contact) => {
    const parts = [c.title, c.first_name, c.last_name].filter(Boolean);
    if (parts.length) return parts.join(' ').trim();
    return c.contact_person_name || contactCompanyName(c) || '';
  }, []);

  const searchContactsByEmailOrPhone = useCallback((query: string) => {
    if (query.trim().length < 2) {
      setContactSuggestions([]);
      return;
    }
    marketingAPI.searchContacts(query.trim(), 10).then(setContactSuggestions).catch(() => setContactSuggestions([]));
  }, []);

  const onPrimaryContactSearchChange = useCallback((value: string) => {
    setPrimaryContactSearchQuery(value);
    if (contactSearchTimeoutRef.current) clearTimeout(contactSearchTimeoutRef.current);
    contactSearchTimeoutRef.current = setTimeout(() => searchContactsByEmailOrPhone(value.trim()), 400);
  }, [searchContactsByEmailOrPhone]);

  useEffect(() => {
    if (!isEdit && formData.domain_id) {
      loadRegions(formData.domain_id);
    }
  }, [formData.domain_id, isEdit]);

  const loadUserAssignments = async (): Promise<{ domain_id: number; region_id?: number } | null> => {
    const cachedScope = getStoredMarketingScope();
    if (cachedScope?.domain_id != null) {
      return {
        domain_id: cachedScope.domain_id,
        region_id: cachedScope.region_id ?? cachedScope.region_ids?.[0],
      };
    }
    const candidateIds = Array.from(new Set([employee?.id, user?.id].filter((v): v is number => typeof v === 'number' && Number.isFinite(v))));
    for (const candidateId of candidateIds) {
      try {
        const assignments = await marketingAPI.getEmployeeAssignments(candidateId);
        if (!assignments?.length) continue;
        const active = assignments.find((x: any) => x?.is_active) ?? assignments[0];
        if (!active) continue;
        if (active.region?.id != null && active.region?.domain_id != null) {
          return { domain_id: active.region.domain_id, region_id: active.region.id };
        }
        if (active.region_id != null) {
          try {
            const region = await marketingAPI.getRegion(active.region_id);
            if (region?.id != null && region?.domain_id != null) {
              return { domain_id: region.domain_id, region_id: region.id };
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
    return null;
  };

  const loadDomains = async () => {
    try {
      const res = await marketingAPI.getDomains({ is_active: true, page: 1, page_size: 100 });
      const domainsData = res.items;
      setDomains(domainsData);
      if (!isEdit) {
        const assigned = await loadUserAssignments();
        if (assigned) {
          setFormData(prev => ({ ...prev, domain_id: assigned.domain_id, region_id: assigned.region_id ?? prev.region_id }));
          await loadRegions(assigned.domain_id);
        } else if (!formData.domain_id && domainsData.length > 0) {
          setFormData(prev => ({ ...prev, domain_id: domainsData[0].id }));
        }
      }
    } catch (error: any) {
      showToast('Failed to load domains', 'error');
    }
  };

  const loadRegions = async (domainId: number) => {
    try {
      const res = await marketingAPI.getRegions({ domain_id: domainId, is_active: true, page: 1, page_size: 100 });
      const regionsData = res.items;
      setRegions(regionsData);
    } catch (error: any) {
      showToast('Failed to load regions', 'error');
      setRegions([]);
    }
  };

  const loadCustomer = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const customer = await marketingAPI.getCustomer(parseInt(id));
      setFormData({
        company_name: customer.company_name,
        notes: customer.notes || '',
        domain_id: customer.domain_id,
        region_id: customer.region_id || undefined,
        organization_id: customer.organization_id ?? undefined,
        plant_id: customer.plant_id ?? undefined,
        series_code: customer.series_code ?? undefined,
        series: customer.series ?? undefined,
        is_active: customer.is_active,
      });
      if (customer.primary_contact_contact_id != null) {
        setPrimaryContactContactId(customer.primary_contact_contact_id);
      }
      setSelectedPrimaryContact(customer.primary_contact_contact ?? null);
      setSelectedOrganization(customer.organization ?? null);
      if (customer.organization_id) {
        const pl = await marketingAPI.getOrganizationPlants(customer.organization_id);
        setPlants(pl);
      }
      await loadRegions(customer.domain_id);
    } catch (error: any) {
      showToast(error.message || 'Failed to load customer', 'error');
      navigate('/database/customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.organization_id) {
      marketingAPI.getOrganizationPlants(formData.organization_id).then(setPlants).catch(() => setPlants([]));
    } else {
      setPlants([]);
      setFormData(prev => ({ ...prev, plant_id: undefined }));
    }
  }, [formData.organization_id]);

  // Sync inline contact form's plant with customer's selected plant so the new contact is linked to the same plant
  useEffect(() => {
    if (formData.organization_id != null && formData.plant_id != null) {
      setCreateContactForm(prev => (prev.plant_id === formData.plant_id ? prev : { ...prev, plant_id: formData.plant_id }));
    }
  }, [formData.organization_id, formData.plant_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyOrOrgName = (formData.company_name || orgSearchQuery || newOrgForm.name || '').trim();
    if (!companyOrOrgName && !formData.organization_id) {
      showToast('Company / organization name is required', 'error');
      return;
    }
    if (!formData.domain_id || !formData.region_id) {
      showToast('Domain and region are required', 'error');
      return;
    }
    const inlineContactFilled = createContactForm.first_name?.trim() && createContactForm.last_name?.trim() && serializePhoneWithCountryCode(createContactForm.phone_country_code, createContactForm.contact_phone)?.trim();
    if (!primaryContactContactId && !inlineContactFilled) {
      showToast('Please link an existing contact or fill the contact details below to create one on save', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      let organization_id = formData.organization_id;
      let plant_id = formData.plant_id;
      let company_name = formData.company_name?.trim() || '';

      // 1. Create organization first if needed (so we can attach it and the new contact to the customer)
      if (!organization_id && companyOrOrgName && canCreateOrg) {
        const plantsToCreate = newPlantForm.plant_name?.trim()
          ? [{ plant_name: newPlantForm.plant_name.trim(), address_line1: newPlantForm.address_line1?.trim() || undefined, city: newPlantForm.city?.trim() || undefined, country: newPlantForm.country?.trim() || undefined, postal_code: newPlantForm.postal_code?.trim() || undefined }]
          : undefined;
        const org = await marketingAPI.createOrganization({
          name: newOrgForm.name.trim() || companyOrOrgName,
          code: newOrgForm.code.trim() || undefined,
          description: newOrgForm.description.trim() || undefined,
          website: newOrgForm.website.trim() || undefined,
          industry: newOrgForm.industry.trim() || undefined,
          organization_size: newOrgForm.organization_size?.trim() || undefined,
          is_active: true,
          plants: plantsToCreate,
        });
        organization_id = org.id;
        company_name = org.name;
        if (plantsToCreate?.length) {
          const plantsList = await marketingAPI.getOrganizationPlants(org.id).catch(() => []);
          plant_id = plantsList?.[0]?.id;
        }
      } else if (organization_id && selectedOrganization?.name) {
        company_name = selectedOrganization.name;
      } else if (!company_name) {
        company_name = orgSearchQuery.trim() || newOrgForm.name.trim() || companyOrOrgName;
      }

      // 2. Create contact if needed (attached to the organization and plant above, so it's linked to the company)
      let primaryContactId = primaryContactContactId;
      if (!primaryContactId && inlineContactFilled && formData.domain_id && canCreateContact) {
        const fullPhone = serializePhoneWithCountryCode(createContactForm.phone_country_code, createContactForm.contact_phone);
        const contactPlantId = createContactForm.plant_id ?? plant_id ?? undefined;
        const contactPayload: Parameters<typeof marketingAPI.createContact>[0] = {
          title: createContactForm.name_prefix?.trim() || undefined,
          first_name: createContactForm.first_name.trim(),
          last_name: createContactForm.last_name.trim(),
          contact_email: createContactForm.contact_email?.trim() || undefined,
          contact_phone: fullPhone?.trim() || undefined,
          domain_id: formData.domain_id,
          region_id: formData.region_id ?? undefined,
          organization_id: organization_id ?? undefined,
          plant_id: contactPlantId,
        };
        const contact = await marketingAPI.createContact(contactPayload);
        primaryContactId = contact.id;
      }

      const customerData: Partial<Customer> = {
        ...formData,
        company_name: company_name || formData.company_name,
        organization_id: organization_id ?? undefined,
        plant_id: plant_id ?? undefined,
        primary_contact_contact_id: primaryContactId ?? undefined,
      };
      if (isEdit && id) {
        await marketingAPI.updateCustomer(parseInt(id), customerData as Partial<Customer>);
        showToast('Customer updated successfully', 'success');
      } else {
        await marketingAPI.createCustomer(customerData as Partial<Customer>);
        showToast('Customer created successfully', 'success');
      }
      navigate('/database/customers');
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} customer`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Database', href: '/database' },
    { label: 'Customers', href: '/database/customers' },
    { label: isEdit ? 'Edit Customer' : 'Create Customer' },
  ];

  if (isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Customer' : 'Create Customer'} breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-600">Loading customer...</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={isEdit ? 'Edit Customer' : 'Create Customer'} 
      breadcrumbs={breadcrumbs}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/database/customers')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Back
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} /> Organization (optional)
                </h3>
                <p className="text-sm text-slate-600">Link to an existing organization or fill details below to create one on save. Company name comes from the organization or the field above.</p>
                <div className="relative md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company / Organization name</label>
                  <Input
                    type="text"
                    value={selectedOrganization?.name ?? orgSearchQuery}
                    onChange={(e) => {
                      const v = e.target.value;
                      setOrgSearchQuery(v);
                      setNewOrgForm(prev => ({ ...prev, name: v }));
                      setFormData(prev => ({ ...prev, company_name: v }));
                      onOrganizationSearchChange(v);
                    }}
                    onFocus={() => orgSearchQuery && searchOrganizationsByName(orgSearchQuery)}
                    onBlur={() => setTimeout(() => setOrgSuggestions([]), 150)}
                    placeholder="Type to search and link existing organization, or fill details below to create new"
                    className={formData.organization_id != null ? 'pr-24' : undefined}
                    rightElement={
                      formData.organization_id != null ? (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={clearOrganization}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Clear organization"
                          >
                            <X size={16} />
                          </button>
                          <a
                            href={`/organizations/${formData.organization_id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 transition-colors inline-flex"
                            title="Open organization in new tab"
                          >
                            <ArrowRight size={16} />
                          </a>
                        </div>
                      ) : undefined
                    }
                  />
                  {orgSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                      <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100">Link to existing organization:</p>
                      {orgSuggestions.map(org => (
                        <button
                          key={org.id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col gap-0.5"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOrgSuggestions([]);
                            setOrgSearchQuery('');
                            marketingAPI.getOrganization(org.id).then((fullOrg) => {
                              marketingAPI.getOrganizationPlants(org.id).then((plantsList) => {
                                const firstPlant = plantsList && plantsList.length > 0 ? plantsList[0] : null;
                                setFormData(prev => ({
                                  ...prev,
                                  company_name: fullOrg.name,
                                  organization_id: fullOrg.id,
                                  notes: fullOrg.description?.trim() ? (prev.notes?.trim() ? `${prev.notes}\n${fullOrg.description}` : fullOrg.description) : prev.notes,
                                  plant_id: firstPlant ? firstPlant.id : undefined,
                                }));
                                setSelectedOrganization(fullOrg);
                                setPlants(plantsList ?? []);
                                showToast('Linked to organization' + (firstPlant ? ' and plant' : ''), 'success');
                              }).catch(() => {
                                setFormData(prev => ({
                                  ...prev,
                                  company_name: fullOrg.name,
                                  organization_id: fullOrg.id,
                                  notes: fullOrg.description?.trim() ? (prev.notes?.trim() ? `${prev.notes}\n${fullOrg.description}` : fullOrg.description) : prev.notes,
                                }));
                                setSelectedOrganization(fullOrg);
                                setPlants([]);
                                showToast('Linked to organization', 'success');
                              });
                            }).catch(() => {
                              setFormData(prev => ({
                                ...prev,
                                company_name: org.name,
                                organization_id: org.id,
                                plant_id: undefined,
                              }));
                              setSelectedOrganization(org);
                              setPlants([]);
                              showToast('Linked to organization', 'success');
                            });
                          }}
                        >
                          <span className="font-medium">{org.name}</span>
                          {(org.industry || org.website || org.code) && (
                            <span className="text-slate-500 text-xs">{[org.code, org.industry, org.website].filter(Boolean).join(' · ')}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedOrganization ? (
                    <>
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm mt-3">
                        <p className="font-medium text-slate-800">Linked organization</p>
                        <p className="text-slate-600 mt-0.5">{selectedOrganization.name}{selectedOrganization.code ? ` · ${selectedOrganization.code}` : ''}</p>
                        {(selectedOrganization.website || selectedOrganization.industry) && (
                          <p className="text-slate-500 text-xs mt-1">{[selectedOrganization.website, selectedOrganization.industry].filter(Boolean).join(' · ')}</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-end mt-3">
                        <div className="min-w-[200px]">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Plant</label>
                          <Select
                            options={[
                              { value: '', label: 'None' },
                              ...plants.map(p => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` })),
                            ]}
                            value={formData.plant_id != null ? String(formData.plant_id) : ''}
                            onChange={(val) => setFormData({ ...formData, plant_id: val ? Number(val) : undefined })}
                            placeholder="Select plant"
                            searchable
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setShowPlantInline(!showPlantInline); if (!showPlantInline) setPlantModalData({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' }); }}
                          title="Add plant to organization"
                          leftIcon={<Plus size={16} />}
                        >
                          Add plant
                        </Button>
                      </div>
                      {showPlantInline && formData.organization_id != null && (
                        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 mt-3">
                          <h4 className="text-sm font-medium text-slate-700">New plant</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Plant name" value={plantModalData.plant_name || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, plant_name: e.target.value }))} required placeholder="e.g. Main Plant" />
                            <Input label="Address" value={plantModalData.address_line1 || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="Address line 1" />
                            <Input label="City" value={plantModalData.city || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, city: e.target.value }))} />
                            <Input label="Country" value={plantModalData.country || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, country: e.target.value }))} />
                            <Input label="Pin / Postal code" value={plantModalData.postal_code || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, postal_code: e.target.value }))} />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={savingModal || !plantModalData.plant_name?.trim()}
                            onClick={async () => {
                              if (!formData.organization_id) return;
                              setSavingModal(true);
                              try {
                                const created = await marketingAPI.createOrganizationPlant(formData.organization_id, plantModalData);
                                showToast('Plant added', 'success');
                                const pl = await marketingAPI.getOrganizationPlants(formData.organization_id);
                                setPlants(pl);
                                setFormData(prev => ({ ...prev, plant_id: created.id }));
                                setShowPlantInline(false);
                                setPlantModalData({ plant_name: '', address_line1: '', city: '', country: '', postal_code: '' });
                              } catch (e: any) {
                                showToast(e.message || 'Failed to add plant', 'error');
                              } finally {
                                setSavingModal(false);
                              }
                            }}
                          >
                            {savingModal ? 'Adding...' : 'Add Plant'}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    canCreateOrg && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-4 space-y-3 mt-3">
                        <p className="text-sm font-medium text-slate-700">Create new organization on save (fill below)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="relative">
                            <Input
                              label="Organization name"
                              value={orgSearchQuery || newOrgForm.name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setOrgSearchQuery(v);
                                setNewOrgForm(prev => ({ ...prev, name: v }));
                                setFormData(prev => ({ ...prev, company_name: v }));
                                if (orgSearchTimeoutRef.current) clearTimeout(orgSearchTimeoutRef.current);
                                orgSearchTimeoutRef.current = setTimeout(() => searchOrganizationsByName(v), 300);
                              }}
                              onFocus={() => (orgSearchQuery || newOrgForm.name) && searchOrganizationsByName(orgSearchQuery || newOrgForm.name)}
                              placeholder="Same as above, or type here to search"
                            />
                            {orgSuggestions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                                <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100">Link to existing organization:</p>
                                {orgSuggestions.map(org => (
                                  <button
                                    key={org.id}
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex flex-col gap-0.5"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOrgSuggestions([]);
                                      setOrgSearchQuery('');
                                      marketingAPI.getOrganization(org.id).then((fullOrg) => {
                                        marketingAPI.getOrganizationPlants(org.id).then((plantsList) => {
                                          const firstPlant = plantsList && plantsList.length > 0 ? plantsList[0] : null;
                                          setFormData(prev => ({ ...prev, company_name: fullOrg.name, organization_id: fullOrg.id, notes: fullOrg.description?.trim() ? (prev.notes?.trim() ? `${prev.notes}\n${fullOrg.description}` : fullOrg.description) : prev.notes, plant_id: firstPlant ? firstPlant.id : undefined }));
                                          setSelectedOrganization(fullOrg);
                                          setPlants(plantsList ?? []);
                                          showToast('Linked to organization' + (firstPlant ? ' and plant' : ''), 'success');
                                        }).catch(() => {
                                          setFormData(prev => ({ ...prev, company_name: fullOrg.name, organization_id: fullOrg.id, notes: fullOrg.description?.trim() ? (prev.notes?.trim() ? `${prev.notes}\n${fullOrg.description}` : fullOrg.description) : prev.notes }));
                                          setSelectedOrganization(fullOrg);
                                          setPlants([]);
                                          showToast('Linked to organization', 'success');
                                        });
                                      }).catch(() => {
                                        setFormData(prev => ({ ...prev, company_name: org.name, organization_id: org.id, plant_id: undefined }));
                                        setSelectedOrganization(org);
                                        setPlants([]);
                                        showToast('Linked to organization', 'success');
                                      });
                                    }}
                                  >
                                    <span className="font-medium">{org.name}</span>
                                    {(org.industry || org.website || org.code) && (
                                      <span className="text-slate-500 text-xs">{[org.code, org.industry, org.website].filter(Boolean).join(' · ')}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Input label="Code" value={newOrgForm.code} onChange={(e) => setNewOrgForm(prev => ({ ...prev, code: e.target.value }))} placeholder="Optional code" />
                          <Input label="Website" value={newOrgForm.website} onChange={(e) => setNewOrgForm(prev => ({ ...prev, website: e.target.value }))} placeholder="https://..." />
                          <Input label="Industry" value={newOrgForm.industry} onChange={(e) => setNewOrgForm(prev => ({ ...prev, industry: e.target.value }))} placeholder="e.g. IT, Manufacturing" />
                          <div className="md:col-span-2">
                            <Select label="Size of organization" options={COMPANY_SIZES} value={newOrgForm.organization_size} onChange={(val) => setNewOrgForm(prev => ({ ...prev, organization_size: (val as string) || '' }))} placeholder="Select size" searchable />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                            <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={2} value={newOrgForm.description} onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Notes / important details" />
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-2">Optional: plant for new organization</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Plant name" value={newPlantForm.plant_name || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, plant_name: e.target.value }))} placeholder="e.g. Main Plant" />
                            <Input label="Address" value={newPlantForm.address_line1 || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="Address line 1" />
                            <Input label="City" value={newPlantForm.city || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, city: e.target.value }))} />
                            <Input label="Country" value={newPlantForm.country || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, country: e.target.value }))} />
                            <Input label="Postal code" value={newPlantForm.postal_code || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, postal_code: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User size={18} /> Primary contact
                </h3>
                <p className="text-xs text-slate-500">Primary contact is a link to a contact record. Search by email or phone and select one.</p>
                {primaryContactContactId != null ? (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-sm text-slate-800">
                      {selectedPrimaryContact ? (
                        <>
                          <p className="font-medium">{contactDisplayName(selectedPrimaryContact) || contactCompanyName(selectedPrimaryContact) || 'Contact'}</p>
                          <p className="text-slate-600 text-xs mt-0.5">{[selectedPrimaryContact.contact_email, selectedPrimaryContact.contact_phone].filter(Boolean).join(' · ')}</p>
                        </>
                      ) : (
                        <p className="font-medium">Contact linked</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setPrimaryContactContactId(null); setSelectedPrimaryContact(null); setPrimaryContactSearchQuery(''); setContactSuggestions([]); }}
                        className="text-sm text-slate-600 hover:text-rose-600"
                      >
                        Change
                      </button>
                      <a
                        href={`/contacts/${primaryContactContactId}/edit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-sm text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 rounded border border-indigo-200"
                        title="Open contact in new tab"
                      >
                        <ArrowRight size={14} />
                        View contact
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative max-w-md">
                      <Input
                        label="Search by email or phone"
                        type="text"
                        value={primaryContactSearchQuery}
                        onChange={(e) => onPrimaryContactSearchChange(e.target.value)}
                        onBlur={() => setTimeout(() => setContactSuggestions([]), 150)}
                        placeholder="Type to search existing contact, or fill details below to create on save"
                      />
                      {primaryContactSearchQuery.trim().length >= 2 && contactSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                          <p className="text-xs text-slate-500 px-3 py-2 border-b border-slate-100">Link to existing contact:</p>
                          {contactSuggestions.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPrimaryContactContactId(c.id);
                                setSelectedPrimaryContact(c);
                                setPrimaryContactSearchQuery('');
                                setContactSuggestions([]);
                                showToast('Contact linked', 'success');
                              }}
                            >
                              <span>{contactDisplayName(c) || contactCompanyName(c)}</span>
                              <span className="text-slate-500 text-xs truncate">{[c.contact_email, c.contact_phone].filter(Boolean).join(' · ')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {canCreateContact && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-4 space-y-3 mt-3">
                        <p className="text-sm font-medium text-slate-700">Create new contact on save (fill below). Organization is taken from the customer above.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex gap-2 items-end">
                            <div className="w-24 shrink-0">
                              <Select label="Title" options={NAME_PREFIXES} value={createContactForm.name_prefix} onChange={(v) => setCreateContactForm(prev => ({ ...prev, name_prefix: (v ?? '') as string }))} placeholder="—" searchable={false} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Input label="First name" value={createContactForm.first_name} onChange={(e) => setCreateContactForm(prev => ({ ...prev, first_name: e.target.value }))} placeholder="First name" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Input label="Last name" value={createContactForm.last_name} onChange={(e) => setCreateContactForm(prev => ({ ...prev, last_name: e.target.value }))} placeholder="Last name" />
                            </div>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="w-36 shrink-0">
                              <Select label="Country code" options={COUNTRY_CODES} value={createContactForm.phone_country_code} onChange={(v) => setCreateContactForm(prev => ({ ...prev, phone_country_code: (v ?? '') as string }))} placeholder="Code" searchable getSearchText={getCountryCodeSearchText} exactValueMatchWhenQueryMatches={/^\+?\d+$/} getOptionKey={(o) => o.label} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Input label="Phone" type="tel" value={createContactForm.contact_phone} onChange={(e) => setCreateContactForm(prev => ({ ...prev, contact_phone: e.target.value }))} placeholder="Number" />
                            </div>
                          </div>
                          <Input label="Email" type="email" value={createContactForm.contact_email} onChange={(e) => setCreateContactForm(prev => ({ ...prev, contact_email: e.target.value }))} placeholder="email@example.com" />
                          {formData.organization_id && plants.length > 0 && (
                            <div className="md:col-span-2">
                              <Select
                                label="Plant"
                                options={[{ value: '', label: 'None' }, ...plants.map(p => ({ value: String(p.id), label: p.plant_name || `Plant ${p.id}` }))]}
                                value={createContactForm.plant_id != null ? String(createContactForm.plant_id) : ''}
                                onChange={(val) => setCreateContactForm(prev => ({ ...prev, plant_id: val ? Number(val) : undefined }))}
                                placeholder="Select plant"
                                searchable
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notes about this customer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active customer</label>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDomainRegionCollapsed(!domainRegionCollapsed)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Globe size={16} className="text-slate-500" />
                      Domain & Region
                      {formData.domain_id && (
                        <span className="text-slate-500 font-normal">
                          — {domains.find(d => d.id === formData.domain_id)?.name ?? 'Domain'}
                          {formData.region_id && regions.find(r => r.id === formData.region_id)
                            ? ` · ${regions.find(r => r.id === formData.region_id)?.name}`
                            : ''}
                        </span>
                      )}
                    </span>
                    {domainRegionCollapsed ? (
                      <ChevronRight size={18} className="text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-500 shrink-0" />
                    )}
                  </button>
                  {!domainRegionCollapsed && (
                    <div className="p-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 bg-white">
                      <AsyncSelect
                        label="Domain"
                        loadOptions={async (search) => {
                          if (!search && domains.length > 0) return domains.slice(0, 10).map(d => ({ value: d.id, label: d.name }));
                          const res = await marketingAPI.getDomains({ is_active: true, page: 1, page_size: 10, search: search || undefined });
                          return res.items.map(d => ({ value: d.id, label: d.name }));
                        }}
                        value={formData.domain_id}
                        onChange={(val) => setFormData({ ...formData, domain_id: val ? Number(val) : undefined, region_id: undefined })}
                        placeholder="Select Domain"
                        initialOptions={domains.slice(0, 10).map(d => ({ value: d.id, label: d.name }))}
                      />
                      <AsyncSelect
                        label="Region"
                        loadOptions={async (search) => {
                          if (!formData.domain_id) return [];
                          if (!search && regions.length > 0) return regions.slice(0, 10).map(r => ({ value: r.id, label: r.name }));
                          const res = await marketingAPI.getRegions({ domain_id: formData.domain_id, is_active: true, page: 1, page_size: 25, search: search || undefined });
                          return res.items.map(r => ({ value: r.id, label: r.name }));
                        }}
                        value={formData.region_id}
                        onChange={(val) => setFormData({ ...formData, region_id: val ? Number(val) : undefined })}
                        placeholder="Select Region"
                        required
                        disabled={!formData.domain_id}
                        initialOptions={regions.slice(0, 10).map(r => ({ value: r.id, label: r.name }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/database/customers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
};
