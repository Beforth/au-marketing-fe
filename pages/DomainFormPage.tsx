/**
 * Domain Form Page
 * Create or edit a domain
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
import { marketingAPI, Domain } from '../lib/marketing-api';
import { ArrowLeft } from 'lucide-react';

export const DomainFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();
  const isEdit = Boolean(id);
  
  const canCreate = useAppSelector(selectHasPermission('marketing.create_domain'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_domain'));
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Domain>>({
    name: '',
    code: '',
    description: '',
    is_active: true,
  });
  const headUsernameMapRef = useRef<Map<number, string>>(new Map());
  const headEmailMapRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (isEdit) {
      if (!canEdit) {
        showToast('You do not have permission to edit domains', 'error');
        navigate('/domains');
        return;
      }
      loadDomain();
    } else {
      if (!canCreate) {
        showToast('You do not have permission to create domains', 'error');
        navigate('/domains');
        return;
      }
    }
  }, [id, isEdit, canCreate, canEdit]);

  const loadDomain = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const domain = await marketingAPI.getDomain(parseInt(id));
      if (domain.head_employee_id) {
        headUsernameMapRef.current.set(domain.head_employee_id, domain.head_username || '');
        if (domain.head_email) headEmailMapRef.current.set(domain.head_employee_id, domain.head_email);
      }
      setFormData({
        name: domain.name,
        code: domain.code,
        description: domain.description || '',
        is_active: domain.is_active,
        head_employee_id: domain.head_employee_id,
        head_username: domain.head_username,
        head_email: domain.head_email,
      });
    } catch (error: any) {
      showToast(error.message || 'Failed to load domain', 'error');
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

    setIsSubmitting(true);
    try {
      if (isEdit && id) {
        await marketingAPI.updateDomain(parseInt(id), formData);
        showToast('Domain updated successfully', 'success');
      } else {
        await marketingAPI.createDomain(formData);
        showToast('Domain created successfully', 'success');
      }
      navigate('/domains');
    } catch (error: any) {
      showToast(error.message || `Failed to ${isEdit ? 'update' : 'create'} domain`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Domains', href: '/domains' },
    { label: isEdit ? 'Edit Domain' : 'Create Domain' },
  ];

  if (isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Domain' : 'Create Domain'} breadcrumbs={breadcrumbs}>
        <Card>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-600">Loading domain...</p>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={isEdit ? 'Edit Domain' : 'Create Domain'} 
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Domestic, Export"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Code <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., DOMESTIC, EXPORT"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Code will be automatically converted to uppercase</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Domain description..."
            />
          </div>

          <div>
            <AsyncSelect
              label="Domain Head"
              loadOptions={async (search) => {
                const res = await marketingAPI.getEmployees({
                  page: 1,
                  page_size: 20,
                  search: search || undefined,
                  status: 'active',
                });
                res.employees.forEach((e) => {
                  headUsernameMapRef.current.set(e.id, [e.first_name, e.last_name].filter(Boolean).join(' ').trim() || e.username || '');
                  headEmailMapRef.current.set(e.id, e.email || '');
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
                  head_email: val ? headEmailMapRef.current.get(Number(val)) ?? undefined : undefined,
                })
              }
              placeholder="Select domain head (optional)"
              initialOptions={
                formData.head_employee_id
                  ? [{ value: formData.head_employee_id, label: formData.head_username || `Employee #${formData.head_employee_id}` }]
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
              onClick={() => navigate('/domains')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Domain' : 'Create Domain'}
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
};
