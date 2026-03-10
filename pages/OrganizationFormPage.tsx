/**
 * Organization Form – Create or edit organization; when editing, list/add plants.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import {
  setOrganizationPlants,
  addOrganizationPlant,
  updateOrganizationPlant,
  removeOrganizationPlant,
  selectPlantsForOrganization,
} from '../store/slices/organizationPlantsSlice';
import { marketingAPI, Organization, Plant } from '../lib/marketing-api';
import { ArrowLeft, Plus, MapPin, Building2, Layers, Pencil, Trash2 } from 'lucide-react';

const ORGANIZATION_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const TAB_PARAM = 'tab';
const TAB_ORGANIZATION = 'organization';
const TAB_PLANTS = 'plants';

export const OrganizationFormPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();
  const isEdit = Boolean(id);
  const canCreate = useAppSelector(selectHasPermission('marketing.create_organization'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_organization'));
  const canCreatePlant = useAppSelector(selectHasPermission('marketing.create_plant'));
  const canEditPlant = useAppSelector(selectHasPermission('marketing.edit_plant'));
  const canDeletePlant = useAppSelector(selectHasPermission('marketing.delete_plant'));

  const plants = useAppSelector(selectPlantsForOrganization(id));

  const activeTab = useMemo((): 'organization' | 'plants' => {
    const tab = searchParams.get(TAB_PARAM);
    return tab === TAB_PLANTS ? 'plants' : 'organization';
  }, [searchParams]);

  const setActiveTab = (tab: 'organization' | 'plants') => {
    if (tab === 'organization') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete(TAB_PARAM);
        return next;
      }, { replace: true });
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(TAB_PARAM, TAB_PLANTS);
        return next;
      }, { replace: true });
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: '',
    code: '',
    description: '',
    website: '',
    industry: '',
    is_active: true,
  });
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [plantForm, setPlantForm] = useState<Partial<Plant>>({
    plant_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
  });
  const [editingPlantId, setEditingPlantId] = useState<number | null>(null);
  const [editingPlantForm, setEditingPlantForm] = useState<Partial<Plant>>({});
  const [savingPlant, setSavingPlant] = useState(false);
  /** When creating: multiple plants to submit with the org */
  const [pendingPlants, setPendingPlants] = useState<Array<Partial<Plant>>>([]);

  useEffect(() => {
    if (isEdit && id) {
      if (!canEdit) {
        showToast('You do not have permission to edit organizations', 'error');
        navigate('/database/organizations');
        return;
      }
      loadOrganization();
    } else {
      if (!canCreate) {
        showToast('You do not have permission to create organizations', 'error');
        navigate('/database/organizations');
        return;
      }
    }
  }, [id, isEdit, canCreate, canEdit]);

  const loadOrganization = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const org = await marketingAPI.getOrganization(parseInt(id));
      setFormData({
        name: org.name,
        code: org.code || '',
        description: org.description || '',
        website: org.website || '',
        industry: org.industry || '',
        organization_size: org.organization_size ?? undefined,
        is_active: org.is_active,
      });
      try {
        const plantsList = await marketingAPI.getOrganizationPlants(parseInt(id));
        dispatch(setOrganizationPlants({ organizationId: parseInt(id), plants: plantsList }));
      } catch (plantsErr: any) {
        dispatch(setOrganizationPlants({ organizationId: parseInt(id), plants: [] }));
        showToast(plantsErr?.message || 'Could not load organization plants', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to load organization', 'error');
      navigate('/database/organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('Organization name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEdit && id) {
        await marketingAPI.updateOrganization(parseInt(id), formData);
        showToast('Organization updated', 'success');
      } else {
        const plantsToCreate = pendingPlants.filter((p) => p.plant_name?.trim());
        const payload = { ...formData, plants: plantsToCreate.length > 0 ? plantsToCreate : undefined };
        const created = await marketingAPI.createOrganization(payload);
        showToast('Organization created' + (plantsToCreate.length ? ` with ${plantsToCreate.length} plant(s)` : ''), 'success');
        navigate(`/organizations/${created.id}/edit`);
        return;
      }
      navigate('/database/organizations');
    } catch (e: any) {
      showToast(e.message || 'Failed to save organization', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPendingPlant = () => {
    setPendingPlants((prev) => [...prev, { plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' }]);
  };
  const updatePendingPlant = (index: number, field: keyof Plant, value: string | undefined) => {
    setPendingPlants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };
  const removePendingPlant = (index: number) => {
    setPendingPlants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPlant = async () => {
    if (!id || !plantForm.plant_name?.trim()) {
      showToast('Plant name is required', 'error');
      return;
    }
    try {
      const created = await marketingAPI.createOrganizationPlant(parseInt(id), plantForm);
      showToast('Plant added', 'success');
      setPlantForm({ plant_name: '', address_line1: '', address_line2: '', city: '', state: '', country: '', postal_code: '' });
      setShowAddPlant(false);
      dispatch(addOrganizationPlant({ organizationId: parseInt(id), plant: created }));
    } catch (e: any) {
      showToast(e.message || 'Failed to add plant', 'error');
    }
  };

  const handleUpdatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || editingPlantId == null || !editingPlantForm.plant_name?.trim()) {
      showToast('Plant name is required', 'error');
      return;
    }
    setSavingPlant(true);
    try {
      const updated = await marketingAPI.updateOrganizationPlant(parseInt(id), editingPlantId, editingPlantForm);
      showToast('Plant updated', 'success');
      setEditingPlantId(null);
      setEditingPlantForm({});
      dispatch(updateOrganizationPlant({ organizationId: parseInt(id), plant: updated }));
    } catch (e: any) {
      showToast(e.message || 'Failed to update plant', 'error');
    } finally {
      setSavingPlant(false);
    }
  };

  const handleDeletePlant = async (plantId: number) => {
    if (!id) return;
    if (!window.confirm('Remove this plant from the organization?')) return;
    try {
      await marketingAPI.deleteOrganizationPlant(parseInt(id), plantId);
      showToast('Plant removed', 'success');
      dispatch(removeOrganizationPlant({ organizationId: parseInt(id), plantId }));
      if (editingPlantId === plantId) {
        setEditingPlantId(null);
        setEditingPlantForm({});
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to remove plant', 'error');
    }
  };

  const breadcrumbs = [
    { label: 'Database', href: '/database' },
    { label: 'Organizations', href: '/database/organizations' },
    { label: isEdit ? 'Edit Organization' : 'New Organization' },
  ];

  if (isLoading) {
    return (
      <PageLayout title={isEdit ? 'Edit Organization' : 'New Organization'} breadcrumbs={breadcrumbs}>
        <div className="p-8 text-center text-slate-500">Loading...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isEdit ? 'Edit Organization' : 'New Organization'}
      breadcrumbs={breadcrumbs}
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/database/organizations')} leftIcon={<ArrowLeft size={14} />}>
          Back
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs: Organization | Plants */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('organization')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'organization' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Building2 size={16} /> Organization
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plants')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'plants' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers size={16} /> Organization Plants
            </span>
          </button>
        </div>

        {activeTab === 'organization' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <Input
            label="Organization name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Acme Corp"
          />
          <Input
            label="Code (optional)"
            value={formData.code || ''}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. ACME"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Important details / notes</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              placeholder="Important things about this organization"
            />
          </div>
          <Input
            label="Website"
            value={formData.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Industry"
            value={formData.industry || ''}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            placeholder="e.g. Manufacturing"
          />
          <Select
            label="Size of organization"
            options={ORGANIZATION_SIZES}
            value={formData.organization_size}
            onChange={(val) => setFormData({ ...formData, organization_size: val as string })}
            placeholder="Select size"
            searchable
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-slate-300"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">Active</label>
          </div>
        </div>
        )}

        {activeTab === 'plants' && (
        <>
        {/* When creating: add multiple plants in the same form */}
        {!isEdit && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Plants (address, pin code, city, country)</h3>
              <Button type="button" size="sm" variant="outline" onClick={addPendingPlant} leftIcon={<Plus size={14} />}>
                Add Plant
              </Button>
            </div>
            {pendingPlants.length === 0 && (
              <p className="text-sm text-slate-500 mb-4">You can add one or more plants now, or add them after creating the organization.</p>
            )}
            <ul className="space-y-4">
              {pendingPlants.map((p, index) => (
                <li key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Plant {index + 1}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removePendingPlant(index)} className="text-red-600 hover:text-red-700">
                      Remove
                    </Button>
                  </div>
                  <Input
                    label="Plant name"
                    value={p.plant_name || ''}
                    onChange={(e) => updatePendingPlant(index, 'plant_name', e.target.value)}
                    placeholder="e.g. Main Plant"
                  />
                  <Input
                    label="Address line 1"
                    value={p.address_line1 || ''}
                    onChange={(e) => updatePendingPlant(index, 'address_line1', e.target.value)}
                    placeholder="Address line 1"
                  />
                  <Input
                    label="Address line 2"
                    value={p.address_line2 || ''}
                    onChange={(e) => updatePendingPlant(index, 'address_line2', e.target.value)}
                    placeholder="Address line 2"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="City"
                      value={p.city || ''}
                      onChange={(e) => updatePendingPlant(index, 'city', e.target.value)}
                    />
                    <Input
                      label="State"
                      value={p.state || ''}
                      onChange={(e) => updatePendingPlant(index, 'state', e.target.value)}
                      placeholder="State"
                    />
                    <Input
                      label="Country"
                      value={p.country || ''}
                      onChange={(e) => updatePendingPlant(index, 'country', e.target.value)}
                    />
                    <Input
                      label="Pin / Postal code"
                      value={p.postal_code || ''}
                      onChange={(e) => updatePendingPlant(index, 'postal_code', e.target.value)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isEdit && id && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Plants (address, pin code, city, country)</h3>
              {canCreatePlant && (
                <Button type="button" size="sm" onClick={() => setShowAddPlant(true)} leftIcon={<Plus size={14} />}>
                  Add Plant
                </Button>
              )}
            </div>
            {plants.length === 0 && !showAddPlant && (
              <p className="text-sm text-slate-500">No plants yet. Add a plant with name, address, city, country, pin code.</p>
            )}
            <ul className="space-y-2">
              {plants.map((p) => (
                <li key={p.id} className="py-2 border-b border-slate-100 last:border-0">
                  {editingPlantId === p.id ? (
                    <form onSubmit={handleUpdatePlant} className="p-4 bg-slate-50 rounded-lg space-y-3">
                      <Input
                        label="Plant name"
                        value={editingPlantForm.plant_name || ''}
                        onChange={(e) => setEditingPlantForm(prev => ({ ...prev, plant_name: e.target.value }))}
                        required
                        placeholder="e.g. Main Plant"
                      />
                      <Input
                        label="Address line 1"
                        value={editingPlantForm.address_line1 || ''}
                        onChange={(e) => setEditingPlantForm(prev => ({ ...prev, address_line1: e.target.value }))}
                        placeholder="Address line 1"
                      />
                      <Input
                        label="Address line 2"
                        value={editingPlantForm.address_line2 || ''}
                        onChange={(e) => setEditingPlantForm(prev => ({ ...prev, address_line2: e.target.value }))}
                        placeholder="Address line 2"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="City"
                          value={editingPlantForm.city || ''}
                          onChange={(e) => setEditingPlantForm(prev => ({ ...prev, city: e.target.value }))}
                        />
                        <Input
                          label="State"
                          value={editingPlantForm.state || ''}
                          onChange={(e) => setEditingPlantForm(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="State"
                        />
                        <Input
                          label="Country"
                          value={editingPlantForm.country || ''}
                          onChange={(e) => setEditingPlantForm(prev => ({ ...prev, country: e.target.value }))}
                        />
                        <Input
                          label="Pin / Postal code"
                          value={editingPlantForm.postal_code || ''}
                          onChange={(e) => setEditingPlantForm(prev => ({ ...prev, postal_code: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={savingPlant}>{savingPlant ? 'Saving...' : 'Save'}</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setEditingPlantId(null); setEditingPlantForm({}); }}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium">{p.plant_name}</span>
                      {(p.address_line1 || p.city || p.state || p.country || p.postal_code) && (
                        <span className="text-sm text-slate-500">
                          {[p.address_line1, p.address_line2, p.city, p.state, p.country, p.postal_code].filter(Boolean).join(', ')}
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        {canEditPlant && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPlantId(p.id);
                              setEditingPlantForm({
                                plant_name: p.plant_name || '',
                                address_line1: p.address_line1 || '',
                                city: p.city || '',
                                country: p.country || '',
                                postal_code: p.postal_code || '',
                              });
                            }}
                            title="Edit plant"
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                        {canDeletePlant && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDeletePlant(p.id)}
                            title="Remove plant"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {showAddPlant && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg space-y-3">
                <Input
                  label="Plant name"
                  value={plantForm.plant_name || ''}
                  onChange={(e) => setPlantForm({ ...plantForm, plant_name: e.target.value })}
                  required
                  placeholder="e.g. Main Plant"
                />
                <Input
                  label="Address line 1"
                  value={plantForm.address_line1 || ''}
                  onChange={(e) => setPlantForm({ ...plantForm, address_line1: e.target.value })}
                  placeholder="Address line 1"
                />
                <Input
                  label="Address line 2"
                  value={plantForm.address_line2 || ''}
                  onChange={(e) => setPlantForm({ ...plantForm, address_line2: e.target.value })}
                  placeholder="Address line 2"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="City"
                    value={plantForm.city || ''}
                    onChange={(e) => setPlantForm({ ...plantForm, city: e.target.value })}
                  />
                  <Input
                    label="State"
                    value={plantForm.state || ''}
                    onChange={(e) => setPlantForm({ ...plantForm, state: e.target.value })}
                    placeholder="State"
                  />
                  <Input
                    label="Country"
                    value={plantForm.country || ''}
                    onChange={(e) => setPlantForm({ ...plantForm, country: e.target.value })}
                  />
                  <Input
                    label="Pin / Postal code"
                    value={plantForm.postal_code || ''}
                    onChange={(e) => setPlantForm({ ...plantForm, postal_code: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => handleAddPlant()}>
                    Add Plant
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddPlant(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}
        </>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? 'Update Organization' : 'Create Organization'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/database/organizations')}>
            Cancel
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};
