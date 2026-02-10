/**
 * Customer Form Page
 * Create or edit a customer with location management
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission, selectEmployee, selectUser } from '../store/slices/authSlice';
import { marketingAPI, Customer, Domain, Region, Contact, Series } from '../lib/marketing-api';
import { ArrowLeft, Plus, Trash2, MapPin, Building2, User, Globe, ChevronDown, ChevronRight, Layers, Hash } from 'lucide-react';

interface Location {
  id?: string;
  name: string;  // Title / plant name (e.g. "Main Plant", "North Factory")
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useApp();
  const employee = useAppSelector(selectEmployee);
  const user = useAppSelector(selectUser);
  const isEdit = Boolean(id);
  
  const canCreate = useAppSelector(selectHasPermission('marketing.customer.create'));
  const canEdit = useAppSelector(selectHasPermission('marketing.customer.edit'));
  
  const tabParam = searchParams.get('tab');
  const activeTab: 'customer' | 'organization' = tabParam === 'organization' ? 'organization' : 'customer';
  const setActiveTab = (tab: 'customer' | 'organization') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [locations, setLocations] = useState<Location[]>([
    { name: '', address: '', city: '', state: '', pincode: '', is_primary: true }
  ]);
  
  const [linkedContactId, setLinkedContactId] = useState<number | null>(null);
  const [domainRegionCollapsed, setDomainRegionCollapsed] = useState(true);
  const [formData, setFormData] = useState<Partial<Customer>>({
    company_name: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    industry: '',
    company_size: undefined,
    website: '',
    notes: '',
    domain_id: undefined,
    region_id: undefined,
    series_code: undefined,
    series: undefined,
    is_active: true,
  });
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  useEffect(() => {
    if (isEdit) {
      setDomainRegionCollapsed(false);
      if (!canEdit) {
        showToast('You do not have permission to edit customers', 'error');
        navigate('/customers');
        return;
      }
      loadCustomer();
    } else {
      setDomainRegionCollapsed(true);
      if (!canCreate) {
        showToast('You do not have permission to create customers', 'error');
        navigate('/customers');
        return;
      }
    }
    loadDomains();
    marketingAPI.getSeries({ page: 1, page_size: 100, is_active: true }).then((r) => setSeriesList(r.items)).catch(() => setSeriesList([]));
  }, [id, isEdit, canCreate, canEdit]);

  useEffect(() => {
    if (!isEdit && formData.domain_id) {
      loadRegions(formData.domain_id);
    }
  }, [formData.domain_id, isEdit]);

  const loadUserAssignments = async (): Promise<{ domain_id: number; region_id: number } | null> => {
    const id = employee?.id ?? user?.id;
    if (!id) return null;
    try {
      const assignments = await marketingAPI.getEmployeeAssignments(id);
      if (assignments?.length) {
        const a = assignments.find((x: any) => x.region && x.is_active) ?? assignments[0];
        if (a?.region) return { domain_id: a.region.domain_id, region_id: a.region.id };
      }
    } catch (_) {}
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
          setFormData(prev => ({ ...prev, domain_id: assigned.domain_id, region_id: assigned.region_id }));
          await loadRegions(assigned.domain_id);
        } else if (domainsData.length > 0) {
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
        primary_contact_name: customer.primary_contact_name || '',
        primary_contact_email: customer.primary_contact_email || '',
        primary_contact_phone: customer.primary_contact_phone || '',
        industry: customer.industry || '',
        company_size: customer.company_size || undefined,
        website: customer.website || '',
        notes: customer.notes || '',
        domain_id: customer.domain_id,
        region_id: customer.region_id || undefined,
        series_code: customer.series_code ?? undefined,
        series: customer.series ?? undefined,
        is_active: customer.is_active,
      });
      if (customer.converted_from_contact_id) {
        setLinkedContactId(customer.converted_from_contact_id);
      }
      // Load locations from customer plants (multiple locations)
      if (customer.plants && customer.plants.length > 0) {
        setLocations(customer.plants.map((p, i) => ({
          name: p.plant_name || '',
          address: p.address_line1 || '',
          city: p.city || '',
          state: p.state || '',
          pincode: p.postal_code || '',
          is_primary: i === 0,
        })));
      } else if (customer.address_line1) {
        setLocations([{
          name: '',
          address: customer.address_line1,
          city: customer.city || '',
          state: customer.state || '',
          pincode: customer.postal_code || '',
          is_primary: true
        }]);
      }
      await loadRegions(customer.domain_id);
    } catch (error: any) {
      showToast(error.message || 'Failed to load customer', 'error');
      navigate('/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.primary_contact_name || 
        !formData.primary_contact_email || !formData.primary_contact_phone ||
        !formData.domain_id || !formData.region_id) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Validate locations
    const primaryLocation = locations.find(loc => loc.is_primary);
    if (!primaryLocation || !primaryLocation.address || !primaryLocation.city || 
        !primaryLocation.state || !primaryLocation.pincode) {
      showToast('Please fill all required fields in the primary location', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const primaryLoc = locations.find(loc => loc.is_primary) || locations[0];
      // Send all locations as plants (multiple locations)
      const plantsPayload = locations.map((loc, i) => ({
        plant_name: (loc.name && loc.name.trim()) ? loc.name.trim() : (loc.is_primary ? 'Primary' : `Location ${i + 1}`),
        address_line1: loc.address || undefined,
        city: loc.city || undefined,
        state: loc.state || undefined,
        postal_code: loc.pincode || undefined,
      }));
      const customerData = {
        ...formData,
        address_line1: primaryLoc.address,
        city: primaryLoc.city,
        state: primaryLoc.state,
        postal_code: primaryLoc.pincode,
        plants: plantsPayload,
      };
      if (linkedContactId) {
        (customerData as Record<string, unknown>).converted_from_contact_id = linkedContactId;
      }

      if (isEdit && id) {
        await marketingAPI.updateCustomer(parseInt(id), customerData as Partial<Customer>);
        showToast('Customer updated successfully', 'success');
      } else {
        await marketingAPI.createCustomer(customerData as Partial<Customer>);
        showToast('Customer created successfully', 'success');
      }
      navigate('/customers');
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} customer`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLocation = () => {
    setLocations([...locations, { name: '', address: '', city: '', state: '', pincode: '', is_primary: false }]);
  };

  const removeLocation = (index: number) => {
    if (locations.length === 1) {
      showToast('At least one location is required', 'error');
      return;
    }
    const newLocations = locations.filter((_, i) => i !== index);
    // Ensure at least one location is primary
    if (!newLocations.some(loc => loc.is_primary) && newLocations.length > 0) {
      newLocations[0].is_primary = true;
    }
    setLocations(newLocations);
  };

  const setPrimaryLocation = (index: number) => {
    setLocations(locations.map((loc, i) => ({
      ...loc,
      is_primary: i === index
    })));
  };

  const updateLocation = (index: number, field: keyof Location, value: string | boolean) => {
    setLocations(locations.map((loc, i) => 
      i === index ? { ...loc, [field]: value } : loc
    ));
  };

  const breadcrumbs = [
    { label: 'Customers', href: '/customers' },
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
          onClick={() => navigate('/customers')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Back
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs: Customer | Organization */}
          <div className="flex border-b border-slate-200 -mx-1">
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'customer'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <User size={16} /> Customer
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('organization')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'organization'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers size={16} /> Organization
              </span>
            </button>
          </div>

          {activeTab === 'customer' && (
            <>
              {!isEdit && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User size={16} /> Link to existing contact (optional)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customers are created on top of contacts. Select a contact to use their organization data and locations.
                  </p>
                  <AsyncSelect
                    label="Select contact"
                    loadOptions={async (search) => {
                      const res = await marketingAPI.getContacts({
                        page: 1,
                        page_size: 50,
                        is_converted: false,
                      });
                      const contactsData = res.items;
                      const list = search
                        ? contactsData.filter(
                            c =>
                              c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
                              c.contact_email?.toLowerCase().includes(search.toLowerCase())
                          )
                        : contactsData;
                      return list.map(c => ({
                        value: c.id,
                        label: `${c.company_name}${c.contact_email ? ` (${c.contact_email})` : ''}`,
                      }));
                    }}
                    value={linkedContactId ?? undefined}
                    onChange={async (val) => {
                      const contactId = val ? Number(val) : null;
                      setLinkedContactId(contactId);
                      if (!contactId) return;
                      try {
                        const contact = await marketingAPI.getContact(contactId);
                        setFormData(prev => ({
                          ...prev,
                          company_name: contact.company_name,
                          industry: contact.industry || prev.industry,
                          website: contact.website || prev.website,
                          domain_id: contact.domain_id,
                          region_id: contact.region_id ?? prev.region_id,
                          primary_contact_name: contact.contact_person_name || prev.primary_contact_name,
                          primary_contact_email: contact.contact_email || prev.primary_contact_email,
                          primary_contact_phone: contact.contact_phone || prev.primary_contact_phone,
                        }));
                        await loadRegions(contact.domain_id);
                    const plantsData = await marketingAPI.getPlants({ contact_id: contactId });
                    if (plantsData && plantsData.length > 0) {
                      setLocations(
                        plantsData.map((p, i) => ({
                          name: p.plant_name || '',
                          address: p.address_line1 || '',
                          city: p.city || '',
                          state: p.state || '',
                          pincode: p.postal_code || '',
                          is_primary: i === 0,
                        }))
                      );
                    }
                      } catch (err: any) {
                        showToast(err.message || 'Failed to load contact', 'error');
                      }
                    }}
                    placeholder="Search and select contact..."
                    initialOptions={[]}
                  />
                </div>
              )}

              {isEdit && linkedContactId && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm text-indigo-800 flex items-center gap-2">
                    <User size={16} />
                    This customer was created from an existing contact.
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/contacts/${linkedContactId}/edit`)}
                      className="ml-2"
                    >
                      View contact
                    </Button>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} /> Company
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Company / Customer name"
                      type="text"
                      value={formData.company_name || ''}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Industry"
                      type="text"
                      value={formData.industry || ''}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g., IT, Manufacturing"
                    />
                  </div>
                  <div>
                    <Select
                      label="Company Size"
                      options={COMPANY_SIZES}
                      value={formData.company_size}
                      onChange={(val) => setFormData({ ...formData, company_size: val as string })}
                      placeholder="Select size"
                      searchable
                    />
                  </div>
                  <div>
                    <Input
                      label="Website"
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <User size={18} /> Primary contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Contact Person"
                      type="text"
                      value={formData.primary_contact_name || ''}
                      onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                      placeholder="Primary contact name"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Email"
                      type="email"
                      value={formData.primary_contact_email || ''}
                      onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                      placeholder="Primary contact email"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Phone"
                      type="tel"
                      value={formData.primary_contact_phone || ''}
                      onChange={(e) => setFormData({ ...formData, primary_contact_phone: e.target.value })}
                      placeholder="Primary contact phone"
                      required
                    />
                  </div>
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
                  {/* Series (by code, no FK): numbering series + generated number */}
                  <div className="flex flex-wrap items-end gap-4 md:col-span-2 border-t border-slate-200 pt-4">
                    <div className="min-w-[200px] flex flex-col gap-2">
                      <label className="block text-sm font-medium text-slate-700">Numbering series</label>
                      <Select
                        value={formData.series_code ?? ''}
                        onChange={(val) => setFormData({ ...formData, series_code: (val != null && val !== '') ? String(val) : undefined })}
                        options={[
                          { value: '', label: 'None' },
                          ...seriesList.map((s) => ({ value: String(s.code), label: `${s.name} (${s.code})` })),
                        ]}
                        placeholder="None"
                      />
                    </div>
                    <div className="min-w-[160px] flex flex-col gap-2">
                      <label className="block text-sm font-medium text-slate-700">Series number</label>
                      <Input
                        type="text"
                        value={formData.series ?? ''}
                        readOnly
                        disabled
                        className="bg-slate-50"
                        placeholder={formData.series_code ? 'Saved with next number' : 'Select series & save'}
                      />
                    </div>
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
          )}

          {activeTab === 'organization' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Layers size={18} /> Plants / Locations
              </h3>
              <p className="text-xs text-slate-500">
                Add multiple plants or locations for this customer. At least one primary location is required.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Locations</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLocation}
                  leftIcon={<Plus size={14} />}
                >
                  Add Location
                </Button>
              </div>
              <div className="space-y-4">
                {locations.map((location, index) => (
                  <Card key={index} className="p-4 border-2 border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">
                          {location.name.trim() ? location.name : (location.is_primary ? 'Primary Location' : `Location ${index + 1}`)}
                        </span>
                        {location.is_primary && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!location.is_primary && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrimaryLocation(index)}
                          >
                            Set as Primary
                          </Button>
                        )}
                        {locations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLocation(index)}
                            className="text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Input
                          label="Location / Plant name"
                          type="text"
                          value={location.name}
                          onChange={(e) => updateLocation(index, 'name', e.target.value)}
                          placeholder="e.g. Main Plant, North Factory"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label="Address"
                          type="text"
                          value={location.address}
                          onChange={(e) => updateLocation(index, 'address', e.target.value)}
                          placeholder="Enter complete address"
                          required={location.is_primary}
                        />
                      </div>
                      <div>
                        <Input
                          label="City"
                          type="text"
                          value={location.city}
                          onChange={(e) => updateLocation(index, 'city', e.target.value)}
                          placeholder="Enter city"
                          required={location.is_primary}
                        />
                      </div>
                      <div>
                        <Input
                          label="State"
                          type="text"
                          value={location.state}
                          onChange={(e) => updateLocation(index, 'state', e.target.value)}
                          placeholder="Enter state"
                          required={location.is_primary}
                        />
                      </div>
                      <div>
                        <Input
                          label="Pincode"
                          type="text"
                          value={location.pincode}
                          onChange={(e) => updateLocation(index, 'pincode', e.target.value)}
                          placeholder="Enter pincode"
                          required={location.is_primary}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customers')}
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
