/**
 * Contact Form Page
 * Create or edit a contact
 */
import React, { useState, useEffect } from 'react';
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
import { marketingAPI, Contact, Domain, Region, Series } from '../lib/marketing-api';
import { ArrowLeft, ChevronDown, ChevronRight, Globe } from 'lucide-react';

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
  const [formData, setFormData] = useState<Partial<Contact>>({
    company_name: '',
    contact_person_name: '',
    contact_email: '',
    contact_phone: '',
    contact_job_title: '',
    website: '',
    industry: '',
    domain_id: undefined,
    region_id: undefined,
    address_line1: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    notes: '',
    source: '',
    series_code: undefined,
    series: undefined,
    is_active: true,
  });
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  useEffect(() => {
    if (isEdit) {
      setDomainRegionCollapsed(false);
      if (!canEdit) {
        showToast('You do not have permission to edit contacts', 'error');
        navigate('/contacts');
        return;
      }
      loadContact();
    } else {
      setDomainRegionCollapsed(true);
      if (!canCreate) {
        showToast('You do not have permission to create contacts', 'error');
        navigate('/contacts');
        return;
      }
    }
    loadDomains();
    marketingAPI.getSeries({ page: 1, page_size: 100, is_active: true }).then((r) => setSeriesList(r.items)).catch(() => setSeriesList([]));
  }, [id, isEdit, canCreate, canEdit]);

  useEffect(() => {
    if (formData.domain_id) {
      loadRegions(formData.domain_id);
    } else {
      setRegions([]);
    }
  }, [formData.domain_id]);

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
      const list = res?.items ?? [];
      setDomains(list);
      if (!isEdit) {
        const assigned = await loadUserAssignments();
        if (assigned) {
          setFormData(prev => ({ ...prev, domain_id: assigned.domain_id, region_id: assigned.region_id }));
          await loadRegions(assigned.domain_id);
        } else if (list.length > 0) {
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
      setFormData({
        company_name: contact.company_name,
        contact_person_name: contact.contact_person_name || '',
        contact_email: contact.contact_email || '',
        contact_phone: contact.contact_phone || '',
        contact_job_title: contact.contact_job_title || '',
        website: contact.website || '',
        industry: contact.industry || '',
        domain_id: contact.domain_id,
        region_id: contact.region_id || undefined,
        address_line1: contact.address_line1 || '',
        city: contact.city || '',
        state: contact.state || '',
        country: contact.country || '',
        postal_code: contact.postal_code || '',
        notes: contact.notes || '',
        source: contact.source || '',
        series_code: contact.series_code ?? undefined,
        series: contact.series ?? undefined,
        is_active: contact.is_active,
      });
      // Load regions for the domain if domain is set
      if (contact.domain_id) {
        await loadRegions(contact.domain_id);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load contact', 'error');
      navigate('/contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.domain_id) {
      showToast('Company name and domain are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && id) {
        await marketingAPI.updateContact(parseInt(id), formData);
        showToast('Contact updated successfully', 'success');
      } else {
        await marketingAPI.createContact(formData);
        showToast('Contact created successfully', 'success');
      }
      navigate('/contacts');
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} contact`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Contacts', href: '/contacts' },
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
          onClick={() => navigate('/contacts')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Back
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
              <Input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
              <Input
                type="text"
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Industry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Source</label>
              <Input
                type="text"
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Lead source"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Person Name
              </label>
              <Input
                type="text"
                value={formData.contact_person_name || ''}
                onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                placeholder="Contact person name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
              <Input
                type="text"
                value={formData.contact_job_title || ''}
                onChange={(e) => setFormData({ ...formData, contact_job_title: e.target.value })}
                placeholder="Job title"
              />
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <Input
                type="tel"
                value={formData.contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Series (by code, no FK): numbering series + generated number */}
            <div className="md:col-span-2 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-end gap-4">
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Address Line 1</label>
              <Input
                type="text"
                value={formData.address_line1 || ''}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
              <Input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
              <Input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State/Province"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
              <Input
                type="text"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Postal Code</label>
              <Input
                type="text"
                value={formData.postal_code || ''}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Postal code"
              />
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
              onClick={() => navigate('/contacts')}
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
        </form>
      </Card>
    </PageLayout>
  );
};
