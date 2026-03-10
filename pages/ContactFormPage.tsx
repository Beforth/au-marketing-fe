/**
 * Contact Form Page
 * Create or edit a contact
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
import { selectHasPermission, selectUser, selectEmployee } from '../store/slices/authSlice';
import { marketingAPI, Contact, Domain, Region, Organization, Plant } from '../lib/marketing-api';
import { NAME_PREFIXES, COUNTRY_CODES, DEFAULT_COUNTRY_CODE, getCountryCodeSearchText } from '../constants';
import { parseNameWithPrefix, parsePhoneWithCountryCode, serializePhoneWithCountryCode } from '../lib/name-phone-utils';
import { getStoredMarketingScope } from '../lib/marketing-scope';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Globe, Plus, X } from 'lucide-react';

const ORGANIZATION_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

export const ContactFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();
  const user = useAppSelector(selectUser);
  const employee = useAppSelector(selectEmployee);
  const isEdit = Boolean(id);
  
  const canCreate = useAppSelector(selectHasPermission('marketing.create_contact'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_contact'));
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [domainRegionCollapsed, setDomainRegionCollapsed] = useState(true);
  const [namePrefix, setNamePrefix] = useState('');
  const [contactPhoneCountryCode, setContactPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [contactPhonePart, setContactPhonePart] = useState('');
  const [formData, setFormData] = useState<Partial<Contact>>({
    first_name: '',
    last_name: '',
    contact_person_name: '',
    contact_email: '',
    contact_phone: '',
    contact_job_title: '',
    domain_id: undefined,
    region_id: undefined,
    organization_id: undefined,
    plant_id: undefined,
    notes: '',
    source: '',
    series_code: undefined,
    series: undefined,
    is_active: true,
  });
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [orgSuggestions, setOrgSuggestions] = useState<Organization[]>([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [showPlantInline, setShowPlantInline] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState<{ name: string; code: string; description: string; website: string; industry: string; organization_size: string }>({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' });
  const [newPlantForm, setNewPlantForm] = useState<Partial<Plant>>({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
  const [plantModalData, setPlantModalData] = useState<Partial<Plant>>({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
  const [savingModal, setSavingModal] = useState(false);
  const orgSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canCreateOrg = useAppSelector(selectHasPermission('marketing.create_organization'));

  useEffect(() => {
    if (isEdit) {
      setDomainRegionCollapsed(false);
      if (!canEdit) {
        showToast('You do not have permission to edit contacts', 'error');
        navigate('/database/contacts');
        return;
      }
      loadContact();
    } else {
      setDomainRegionCollapsed(true);
      if (!canCreate) {
        showToast('You do not have permission to create contacts', 'error');
        navigate('/database/contacts');
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
    setFormData((prev) => ({ ...prev, organization_id: undefined, plant_id: undefined }));
    setPlants([]);
    if (orgSearchTimeoutRef.current) clearTimeout(orgSearchTimeoutRef.current);
    orgSearchTimeoutRef.current = setTimeout(() => searchOrganizationsByName(value), 300);
  }, [searchOrganizationsByName]);

  const clearOrganization = useCallback(() => {
    setSelectedOrganization(null);
    setFormData((prev) => ({ ...prev, organization_id: undefined, plant_id: undefined }));
    setPlants([]);
    setNewOrgForm((prev) => ({ ...prev, name: orgSearchQuery.trim() || prev.name }));
    setOrgSearchQuery('');
    setOrgSuggestions([]);
  }, [orgSearchQuery]);

  const resetNewOrgAndPlant = useCallback(() => {
    setNewOrgForm({ name: '', code: '', description: '', website: '', industry: '', organization_size: '' });
    setNewPlantForm({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
  }, []);

  useEffect(() => {
    if (formData.organization_id) {
      marketingAPI.getOrganizationPlants(formData.organization_id).then(setPlants).catch(() => setPlants([]));
    } else {
      setPlants([]);
      setFormData(prev => ({ ...prev, plant_id: undefined }));
    }
  }, [formData.organization_id]);

  useEffect(() => {
    if (formData.domain_id) {
      loadRegions(formData.domain_id);
    } else {
      setRegions([]);
    }
  }, [formData.domain_id]);

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
      const list = res?.items ?? [];
      setDomains(list);
      if (!isEdit) {
        const assigned = await loadUserAssignments();
        if (assigned) {
          setFormData(prev => ({ ...prev, domain_id: assigned.domain_id, region_id: assigned.region_id ?? prev.region_id }));
          await loadRegions(assigned.domain_id);
        } else if (!formData.domain_id && list.length > 0) {
          setFormData(prev => ({ ...prev, domain_id: list[0].id }));
        }
      }
    } catch (error: any) {
      showToast('Failed to load domains', 'error');
      setDomains([]);
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

  const loadContact = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const contact = await marketingAPI.getContact(parseInt(id));
      const hasApiTitle = Boolean(contact.title);
      const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.contact_person_name || '';
      const { prefix: np, namePart } = hasApiTitle ? { prefix: contact.title || '', namePart: [contact.first_name, contact.last_name].filter(Boolean).join(' ') } : parseNameWithPrefix(fullName);
      const firstPart = namePart.trim().split(/\s+/)[0] || '';
      const lastPart = namePart.trim().split(/\s+/).slice(1).join(' ') || '';
      const { code: pc, number: pNum } = parsePhoneWithCountryCode(contact.contact_phone);
      setNamePrefix(hasApiTitle ? (contact.title ?? '') : np);
      setContactPhoneCountryCode(pc || DEFAULT_COUNTRY_CODE);
      setContactPhonePart(pNum);
      setFormData({
        first_name: firstPart,
        last_name: lastPart,
        contact_person_name: contact.contact_person_name || '',
        contact_email: contact.contact_email || '',
        contact_phone: contact.contact_phone || '',
        contact_job_title: contact.contact_job_title || '',
        domain_id: contact.domain_id,
        region_id: contact.region_id ?? undefined,
        organization_id: contact.organization_id ?? undefined,
        plant_id: contact.plant_id ?? undefined,
        notes: contact.notes || '',
        source: contact.source || '',
        series_code: contact.series_code ?? undefined,
        series: contact.series ?? undefined,
        is_active: contact.is_active,
      });
      setSelectedOrganization(contact.organization ?? null);
      // Load regions for the domain if domain is set
      if (contact.domain_id) await loadRegions(contact.domain_id);
      if (contact.organization_id) {
        const pl = await marketingAPI.getOrganizationPlants(contact.organization_id);
        setPlants(pl);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load contact', 'error');
      navigate('/database/contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name?.trim() || !formData.last_name?.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }
    const fullPhone = serializePhoneWithCountryCode(contactPhoneCountryCode, contactPhonePart);
    if (!fullPhone?.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!formData.domain_id) {
      showToast('Domain is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let organization_id = formData.organization_id;
      let plant_id = formData.plant_id;

      const newOrgName = (orgSearchQuery || newOrgForm.name || '').trim();
      if (!organization_id && newOrgName && canCreateOrg) {
        const plantsToCreate = newPlantForm.plant_name?.trim()
          ? [{ plant_name: newPlantForm.plant_name.trim(), address_line1: newPlantForm.address_line1?.trim() || undefined, address_line2: newPlantForm.address_line2?.trim() || undefined, city: newPlantForm.city?.trim() || undefined, state: newPlantForm.state?.trim() || undefined, country: newPlantForm.country?.trim() || undefined, postal_code: newPlantForm.postal_code?.trim() || undefined }]
          : undefined;
        const org = await marketingAPI.createOrganization({
          name: newOrgName,
          code: newOrgForm.code.trim() || undefined,
          description: newOrgForm.description.trim() || undefined,
          website: newOrgForm.website.trim() || undefined,
          industry: newOrgForm.industry.trim() || undefined,
          organization_size: newOrgForm.organization_size?.trim() || undefined,
          is_active: true,
          plants: plantsToCreate,
        });
        organization_id = org.id;
        if (plantsToCreate?.length) {
          const plantsList = await marketingAPI.getOrganizationPlants(org.id).catch(() => []);
          plant_id = plantsList?.[0]?.id;
        }
      }

      const payload = {
        ...formData,
        title: namePrefix || undefined,
        first_name: (formData.first_name ?? '').trim() || undefined,
        last_name: (formData.last_name ?? '').trim() || undefined,
        contact_phone: fullPhone.trim() || undefined,
        organization_id: organization_id ?? undefined,
        plant_id: plant_id ?? undefined,
      };
      if (isEdit && id) {
        await marketingAPI.updateContact(parseInt(id), payload);
        showToast('Contact updated successfully', 'success');
      } else {
        await marketingAPI.createContact(payload);
        showToast('Contact created successfully', 'success');
      }
      navigate('/database/contacts');
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} contact`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Database', href: '/database' },
    { label: 'Contacts', href: '/database/contacts' },
    { label: isEdit ? 'Edit Contact' : 'Create Contact' },
  ];

  if (isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Contact' : 'Create Contact'} breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-600">Loading contact...</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={isEdit ? 'Edit Contact' : 'Create Contact'} 
      breadcrumbs={breadcrumbs}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/database/contacts')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Back
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person fields first: Title, First name, Last name, Phone, Email, Company */}
            <div className="flex gap-2 items-end">
              <div className="w-24 shrink-0">
                <Select
                  label="Title"
                  options={NAME_PREFIXES}
                  value={namePrefix}
                  onChange={(v) => setNamePrefix((v ?? '') as string)}
                  placeholder="—"
                  searchable={false}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">First name <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">Last name <span className="text-red-500">*</span></label>
                <Input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div className="w-36 shrink-0">
                <Select
                  label="Country code"
                  options={COUNTRY_CODES}
                  value={contactPhoneCountryCode}
                  onChange={(v) => setContactPhoneCountryCode((v ?? '') as string)}
                  placeholder="Code"
                  searchable
                  getSearchText={getCountryCodeSearchText}
                  exactValueMatchWhenQueryMatches={/^\+?\d+$/}
                  getOptionKey={(o) => o.label}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone <span className="text-red-500">*</span></label>
                <Input
                  type="tel"
                  value={contactPhonePart}
                  onChange={(e) => setContactPhonePart(e.target.value)}
                  placeholder="Number without code"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <Input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
              <Input
                type="text"
                value={formData.contact_job_title || ''}
                onChange={(e) => setFormData({ ...formData, contact_job_title: e.target.value })}
                placeholder="Designation"
              />
            </div>

            {/* Organization: search to link existing, or fill inline to create on save */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Organization
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={selectedOrganization?.name ?? orgSearchQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOrgSearchQuery(v);
                    setNewOrgForm(prev => ({ ...prev, name: v }));
                    onOrganizationSearchChange(v);
                  }}
                  onFocus={() => orgSearchQuery && searchOrganizationsByName(orgSearchQuery)}
                  onBlur={() => setTimeout(() => { setOrgSuggestions([]); }, 150)}
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
                                organization_id: fullOrg.id,
                                notes: fullOrg.description?.trim() ? (prev.notes?.trim() ? `${prev.notes}\n${fullOrg.description}` : fullOrg.description) : prev.notes,
                              }));
                              setSelectedOrganization(fullOrg);
                              setPlants([]);
                              showToast('Linked to organization', 'success');
                            });
                          }).catch(() => {
                            setFormData(prev => ({ ...prev, organization_id: org.id, plant_id: undefined }));
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

              {selectedOrganization ? (
                <>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm">
                    <p className="font-medium text-slate-800">Linked organization</p>
                    <p className="text-slate-600 mt-0.5">{selectedOrganization.name}{selectedOrganization.code ? ` · ${selectedOrganization.code}` : ''}</p>
                    {(selectedOrganization.website || selectedOrganization.industry) && (
                      <p className="text-slate-500 text-xs mt-1">{[selectedOrganization.website, selectedOrganization.industry].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-end">
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
                      onClick={() => { setShowPlantInline(!showPlantInline); if (!showPlantInline) setPlantModalData({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' }); }}
                      title="Add plant to organization"
                      leftIcon={<Plus size={16} />}
                    >
                      Add plant
                    </Button>
                  </div>
                  {showPlantInline && formData.organization_id != null && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">New plant</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Plant name" value={plantModalData.plant_name || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, plant_name: e.target.value }))} required placeholder="e.g. Main Plant" />
                        <Input label="Address line 1" value={plantModalData.address_line1 || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="Address line 1" />
                        <Input label="Address line 2" value={plantModalData.address_line2 || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, address_line2: e.target.value }))} placeholder="Address line 2" />
                        <Input label="City" value={plantModalData.city || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, city: e.target.value }))} />
                        <Input label="State" value={plantModalData.state || ''} onChange={(e) => setPlantModalData(prev => ({ ...prev, state: e.target.value }))} placeholder="State" />
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
                            setPlantModalData({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
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
                  <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-slate-700">Create new organization on save (name from field above, or edit below)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Organization name"
                        value={orgSearchQuery || newOrgForm.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setOrgSearchQuery(v);
                          setNewOrgForm(prev => ({ ...prev, name: v }));
                        }}
                        placeholder="Same as above, or type here"
                      />
                      <Input label="Code" value={newOrgForm.code} onChange={(e) => setNewOrgForm(prev => ({ ...prev, code: e.target.value }))} placeholder="Optional code" />
                      <Input label="Website" value={newOrgForm.website} onChange={(e) => setNewOrgForm(prev => ({ ...prev, website: e.target.value }))} placeholder="https://..." />
                      <Input label="Industry" value={newOrgForm.industry} onChange={(e) => setNewOrgForm(prev => ({ ...prev, industry: e.target.value }))} placeholder="e.g. IT, Manufacturing" />
                      <div className="md:col-span-2">
                        <Select
                          label="Size of organization"
                          options={ORGANIZATION_SIZES}
                          value={newOrgForm.organization_size}
                          onChange={(val) => setNewOrgForm(prev => ({ ...prev, organization_size: (val as string) || '' }))}
                          placeholder="Select size"
                          searchable
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                        <textarea
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={2}
                          value={newOrgForm.description}
                          onChange={(e) => setNewOrgForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Notes / important details"
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-700 mb-2">Optional: plant for new organization</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Plant name" value={newPlantForm.plant_name || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, plant_name: e.target.value }))} placeholder="e.g. Main Plant" />
                        <Input label="Address line 1" value={newPlantForm.address_line1 || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="Address line 1" />
                        <Input label="Address line 2" value={newPlantForm.address_line2 || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, address_line2: e.target.value }))} placeholder="Address line 2" />
                        <Input label="City" value={newPlantForm.city || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, city: e.target.value }))} />
                        <Input label="State" value={newPlantForm.state || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, state: e.target.value }))} placeholder="State" />
                        <Input label="Country" value={newPlantForm.country || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, country: e.target.value }))} />
                        <Input label="Postal code" value={newPlantForm.postal_code || ''} onChange={(e) => setNewPlantForm(prev => ({ ...prev, postal_code: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Source of contact</label>
              <Input
                type="text"
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g. Website, Referral"
              />
            </div>

            {/* Domain & Region — collapsed by default on create, auto-filled from user assignment */}
            <div className="md:col-span-2 space-y-2">
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
                        const res = await marketingAPI.getDomains({ 
                          is_active: true,
                          page: 1,
                          page_size: 100,
                          search: search || undefined
                        });
                        const list = res?.items ?? [];
                        return list.map(d => ({ value: d.id, label: d.name }));
                      }}
                      value={formData.domain_id}
                      onChange={(val) => setFormData({ ...formData, domain_id: val ? Number(val) : undefined, region_id: undefined })}
                      placeholder="Select Domain"
                      required
                      initialOptions={domains.map(d => ({ value: d.id, label: d.name }))}
                    />
                    <AsyncSelect
                      label="Region"
                      loadOptions={async (search) => {
                        if (!formData.domain_id) return [];
                        const res = await marketingAPI.getRegions({
                          domain_id: formData.domain_id,
                          is_active: true,
                          page: 1,
                          page_size: 25,
                          search: search || undefined
                        });
                        return res.items.map(r => ({ value: r.id, label: r.name }));
                      }}
                      value={formData.region_id}
                      onChange={(val) => setFormData({ ...formData, region_id: val ? Number(val) : undefined })}
                      placeholder="Select Region"
                      disabled={!formData.domain_id}
                      initialOptions={regions.map(r => ({ value: r.id, label: r.name }))}
                    />
                  </div>
                )}
              </div>
            </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/database/contacts')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Contact' : 'Create Contact'}
            </Button>
          </div>
          </div>
        </form>

      </Card>
    </PageLayout>
  );
};
