import React, { useEffect, useState, useCallback } from 'react';
import { marketingAPI, ChangelogVersionResponse, ChangelogSection } from '../../lib/marketing-api';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, Layers, Calendar, HelpCircle, ArrowLeft } from 'lucide-react';
import { Button, Input, Label } from '../../UI';
import { useApp } from '../../App';
import { cn } from '../../lib/utils';

interface SectionFormState {
  title: string;
  items: string[];
}

export const VersionsSettings: React.FC = () => {
  const { showToast } = useApp();
  const [versions, setVersions] = useState<ChangelogVersionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVersion, setEditingVersion] = useState<ChangelogVersionResponse | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields
  const [formVersion, setFormVersion] = useState('');
  const [formReleaseDate, setFormReleaseDate] = useState('');
  const [formSections, setFormSections] = useState<SectionFormState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await marketingAPI.getWhatsNew();
      setVersions(data);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to fetch versions', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const openAddForm = () => {
    setEditingVersion(null);
    setFormVersion('');
    setFormReleaseDate('');
    setFormSections([{ title: 'Features', items: [''] }]);
    setIsFormOpen(true);
  };

  const openEditForm = (v: ChangelogVersionResponse) => {
    setEditingVersion(v);
    setFormVersion(v.version);
    setFormReleaseDate(v.release_date);
    setFormSections(v.sections.map(s => ({
      title: s.title,
      items: s.items.length > 0 ? [...s.items] : ['']
    })));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingVersion(null);
  };

  // Section handlers
  const addSection = () => {
    setFormSections([...formSections, { title: '', items: [''] }]);
  };

  const removeSection = (secIndex: number) => {
    setFormSections(formSections.filter((_, idx) => idx !== secIndex));
  };

  const updateSectionTitle = (secIndex: number, title: string) => {
    const updated = [...formSections];
    updated[secIndex].title = title;
    setFormSections(updated);
  };

  // Item handlers
  const addItem = (secIndex: number) => {
    const updated = [...formSections];
    updated[secIndex].items.push('');
    setFormSections(updated);
  };

  const removeItem = (secIndex: number, itemIndex: number) => {
    const updated = [...formSections];
    updated[secIndex].items = updated[secIndex].items.filter((_, idx) => idx !== itemIndex);
    // Keep at least one empty input
    if (updated[secIndex].items.length === 0) {
      updated[secIndex].items.push('');
    }
    setFormSections(updated);
  };

  const updateItemText = (secIndex: number, itemIndex: number, text: string) => {
    const updated = [...formSections];
    updated[secIndex].items[itemIndex] = text;
    setFormSections(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVersion.trim()) {
      showToast('Version code is required', 'error');
      return;
    }
    if (!formReleaseDate.trim()) {
      showToast('Release date is required', 'error');
      return;
    }

    // Clean up sections and items (remove empty items/sections)
    const cleanedSections: ChangelogSection[] = formSections
      .map(s => ({
        title: s.title.trim(),
        items: s.items.map(i => i.trim()).filter(i => i.length > 0)
      }))
      .filter(s => s.title.length > 0 && s.items.length > 0);

    if (cleanedSections.length === 0) {
      showToast('At least one section with a title and one item is required', 'error');
      return;
    }

    const payload = {
      version: formVersion.trim(),
      release_date: formReleaseDate.trim(),
      sections: cleanedSections
    };

    setSubmitting(true);
    try {
      if (editingVersion) {
        await marketingAPI.updateWhatsNew(editingVersion.id, payload);
        showToast(`Version ${payload.version} updated successfully`, 'success');
      } else {
        await marketingAPI.createWhatsNew(payload);
        showToast(`Version ${payload.version} created successfully`, 'success');
      }
      setIsFormOpen(false);
      fetchVersions();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save version', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, version: string) => {
    if (!window.confirm(`Are you sure you want to delete version ${version}?`)) return;

    try {
      await marketingAPI.deleteWhatsNew(id);
      showToast(`Version ${version} deleted successfully`, 'success');
      fetchVersions();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete version', 'error');
    }
  };

  if (isFormOpen) {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {editingVersion ? `Edit Version ${editingVersion.version}` : 'Create New Version'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={closeForm} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitting} leftIcon={<Save size={14} />}>
              {submitting ? 'Saving...' : 'Save Version'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Version Code</Label>
            <Input
              value={formVersion}
              onChange={e => setFormVersion(e.target.value)}
              placeholder="e.g. 1.0.9 or v1.0.9"
              required
            />
          </div>
          <div>
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Release Date</Label>
            <Input
              value={formReleaseDate}
              onChange={e => setFormReleaseDate(e.target.value)}
              placeholder="e.g. June 15, 2026"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Changelog Sections</Label>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={addSection}
              leftIcon={<Plus size={12} />}
            >
              Add Section
            </Button>
          </div>

          {formSections.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              No sections added. Click "Add Section" to begin.
            </div>
          )}

          {formSections.map((sec, secIdx) => (
            <div key={secIdx} className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50/30 space-y-4 relative group">
              <button
                type="button"
                onClick={() => removeSection(secIdx)}
                className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50"
                title="Remove Section"
              >
                <X size={14} />
              </button>

              <div className="max-w-md">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Section Title</Label>
                <Input
                  value={sec.title}
                  onChange={e => updateSectionTitle(secIdx, e.target.value)}
                  placeholder="e.g. Features, Bug Fixes, Performance"
                  className="h-8 text-xs font-semibold bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Section Items</span>
                  <button
                    type="button"
                    onClick={() => addItem(secIdx)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={10} /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {sec.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex gap-2 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                      <Input
                        value={item}
                        onChange={e => updateItemText(secIdx, itemIdx, e.target.value)}
                        placeholder="Describe the change or feature added..."
                        className="h-8 text-xs bg-white flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(secIdx, itemIdx)}
                        className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Version Releases</h3>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Manage in-app changelog versions and notes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={fetchVersions}
            disabled={loading}
            leftIcon={<RefreshCw size={12} className={cn(loading && 'animate-spin')} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={openAddForm}
            leftIcon={<Plus size={12} />}
            className="shadow-lg shadow-blue-500/10 rounded-xl"
          >
            Add Version
          </Button>
        </div>
      </div>

      {loading && versions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={24} className="animate-spin text-slate-400" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Loading releases...</p>
        </div>
      ) : versions.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Layers size={18} />
          </div>
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">No versions stored in DB</p>
          <p className="text-[10px] text-slate-400 uppercase mt-1">Click Add Version or run the seeder script to populate</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px] w-28">Version</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px] w-40">Release Date</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px]">Sections & Bullet Points</th>
                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[9px] w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {versions.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-blue-600 align-top">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[10px]">
                      {v.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium align-top">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      {v.release_date}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top space-y-2 text-slate-500">
                    {v.sections.map((s, idx) => (
                      <div key={idx} className="text-[11px] leading-relaxed">
                        <span className="font-bold text-slate-700 uppercase tracking-wide text-[9px] block">
                          • {s.title}
                        </span>
                        <span className="pl-3 text-[10px] text-slate-400 block truncate max-w-lg">
                          {s.items.join(' · ')}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEditForm(v)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
                        title="Edit Version"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.version)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
                        title="Delete Version"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
