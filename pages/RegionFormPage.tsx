/**
 * Region Form Page
 * Create or edit a region (under a domain)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AsyncSelect } from '../components/ui/AsyncSelect';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import { marketingAPI, Region } from '../lib/marketing-api';
import { ArrowLeft } from 'lucide-react';
import { Select } from '../components/ui/Select';
import CountryList from 'country-list-with-dial-code-and-flag';

const countryOptions = CountryList.getAll({ withSecondary: false })
  .map((c) => ({
    value: c.code,
    label: `${c.flag} ${c.name} (${c.code})`,
    name: c.name
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const RegionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { domainId, regionId } = useParams<{ domainId: string; regionId?: string }>();
  const { showToast } = useApp();
  const isEdit = Boolean(regionId);

  const canCreate = useAppSelector(selectHasPermission('marketing.create_region'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_region'));

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domainName, setDomainName] = useState<string>('');
  const [isExport, setIsExport] = useState<boolean>(false);
  const [existingRegions, setExistingRegions] = useState<Region[]>([]);
  const [formData, setFormData] = useState<Partial<Region>>({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });

  const headUsernameMapRef = useRef<Map<number, string>>(new Map());
  const coordinatorUsernameMapRef = useRef<Map<number, string>>(new Map());
  const coordinatorEmailMapRef = useRef<Map<number, string>>(new Map());

  const domainIdNum = domainId ? parseInt(domainId, 10) : 0;

  useEffect(() => {
    if (!domainIdNum) {
      showToast('Invalid domain', 'error');
      navigate('/domains');
      return;
    }
    if (isEdit) {
      if (!canEdit) {
        showToast('You do not have permission to edit regions', 'error');
        navigate('/domains');
        return;
      }
      loadRegion();
    } else {
      if (!canCreate) {
        showToast('You do not have permission to create regions', 'error');
        navigate('/domains');
        return;
      }
      loadDomainName();
    }
  }, [domainId, domainIdNum, regionId, isEdit, canCreate, canEdit]);

  const loadDomainName = async () => {
    if (!domainIdNum) return;
    try {
      const domain = await marketingAPI.getDomain(domainIdNum);
      setDomainName(domain.name);
      const isExp = Boolean(domain.is_export);
      setIsExport(isExp);
      if (isExp) {
        const res = await marketingAPI.getRegions({ domain_id: domainIdNum, is_active: true, page: 1, page_size: 100 });
        setExistingRegions(res.items);
      }
    } catch {
      setDomainName('Domain');
    }
  };

  const loadRegion = async () => {
    if (!regionId) return;
    setIsLoading(true);
    try {
      const region = await marketingAPI.getRegion(parseInt(regionId, 10));
      if (region.domain_id !== domainIdNum) {
        showToast('Region does not belong to this domain', 'error');
        navigate('/domains');
        return;
      }
      if (region.head_employee_id) {
        headUsernameMapRef.current.set(region.head_employee_id, region.head_username || '');
      }
      if (region.coordinator_employee_id) {
        coordinatorUsernameMapRef.current.set(region.coordinator_employee_id, region.coordinator_username || '');
        if (region.coordinator_email) coordinatorEmailMapRef.current.set(region.coordinator_employee_id, region.coordinator_email);
      }
      setFormData({
        name: region.name,
        code: region.code,
        description: region.description || '',
        is_active: region.is_active,
        head_employee_id: region.head_employee_id,
        head_username: region.head_username,
        coordinator_employee_id: region.coordinator_employee_id,
        coordinator_username: region.coordinator_username,
        coordinator_email: region.coordinator_email,
      });
      const dName = region.domain?.name || 'Domain';
      setDomainName(dName);
      const isExp = region.domain ? Boolean(region.domain.is_export) : false;
      setIsExport(isExp);
      if (isExp) {
        const res = await marketingAPI.getRegions({ domain_id: domainIdNum, is_active: true, page: 1, page_size: 100 });
        setExistingRegions(res.items);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load region', 'error');
      navigate('/domains');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      showToast('Name and code are required', 'error');
      return;
    }

    if (!isEdit && isExport) {
      const alreadyExists = existingRegions.some(r => r.code.toUpperCase() === formData.code?.toUpperCase());
      if (alreadyExists) {
        showToast('Region for this country already exists in this domain', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isEdit && regionId) {
        await marketingAPI.updateRegion(parseInt(regionId, 10), formData);
        showToast('Region updated successfully', 'success');
      } else {
        await marketingAPI.createRegion({
          ...formData,
          domain_id: domainIdNum,
        });
        showToast('Region created successfully', 'success');
      }
      navigate('/domains');
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} region`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Domains', href: '/domains' },
    { label: domainName || 'Domain' },
    { label: isEdit ? 'Edit Region' : 'Create Region' },
  ];

  if (isEdit && isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Region' : 'Create Region'} breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading region...</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isEdit ? 'Edit Region' : 'Create Region'}
      breadcrumbs={breadcrumbs}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/domains')}
          leftIcon={<ArrowLeft size={14} />}
        >
          Back
        </Button>
      }
    >
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && domainName && (
            <p className="text-sm text-slate-600">
              Creating region under domain: <strong>{domainName}</strong>
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            {!isEdit && isExport ? (
              <Select
                placeholder="Search and select country..."
                options={countryOptions}
                value={formData.code}
                onChange={(val) => {
                  if (!val) {
                    setFormData(prev => ({ ...prev, name: '', code: '' }));
                    return;
                  }
                  const selectedOpt = countryOptions.find(opt => opt.value === val);
                  if (selectedOpt) {
                    setFormData(prev => ({
                      ...prev,
                      name: selectedOpt.name,
                      code: String(selectedOpt.value).toUpperCase()
                    }));
                  }
                }}
                searchable={true}
              />
            ) : (
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., North America, Europe"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., NA, EU"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Code will be automatically converted to uppercase</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Region description..."
            />
          </div>

          <div>
            <AsyncSelect
              label="Region Head"
              loadOptions={async (search) => {
                const res = await marketingAPI.getEmployees({
                  page: 1,
                  page_size: 20,
                  search: search || undefined,
                  status: 'active',
                });
                res.employees.forEach((e) => {
                  headUsernameMapRef.current.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || '');
                });
                return res.employees.map((e) => ({
                  value: e.id,
                  label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || `#${e.id}`,
                }));
              }}
              value={formData.head_employee_id}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  head_employee_id: val ? Number(val) : undefined,
                  head_username: val ? headUsernameMapRef.current.get(Number(val)) ?? undefined : undefined,
                })
              }
              placeholder="Select region head (optional)"
              initialOptions={
                formData.head_employee_id
                  ? [{ value: formData.head_employee_id, label: formData.head_username || `Employee #${formData.head_employee_id}` }]
                  : []
              }
            />
          </div>

          <div>
            <AsyncSelect
              label="Region Coordinator"
              loadOptions={async (search) => {
                const res = await marketingAPI.getEmployees({
                  page: 1,
                  page_size: 20,
                  search: search || undefined,
                  status: 'active',
                });
                res.employees.forEach((e) => {
                  coordinatorUsernameMapRef.current.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || '');
                  coordinatorEmailMapRef.current.set(e.id, e.email || '');
                });
                return res.employees.map((e) => ({
                  value: e.id,
                  label: [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || `#${e.id}`,
                }));
              }}
              value={formData.coordinator_employee_id}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  coordinator_employee_id: val ? Number(val) : undefined,
                  coordinator_username: val ? coordinatorUsernameMapRef.current.get(Number(val)) ?? undefined : undefined,
                  coordinator_email: val ? coordinatorEmailMapRef.current.get(Number(val)) ?? undefined : undefined,
                })
              }
              placeholder="Select region coordinator (optional)"
              initialOptions={
                formData.coordinator_employee_id
                  ? [{ value: formData.coordinator_employee_id, label: formData.coordinator_username || `Employee #${formData.coordinator_employee_id}` }]
                  : []
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => navigate('/domains')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Region' : 'Create Region'}
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
};
