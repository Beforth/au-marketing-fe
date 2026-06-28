import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, ArrowLeft, Save, X, Upload, FileText, Eye, Plus, Trash2, CalendarCheck, Download, FileDown } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PdfPreviewModal } from '../components/ui/PdfPreviewModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SegmentToggle } from '../components/ui/SegmentToggle';
import { PageLayout } from '../components/layout/PageLayout';
import { useApp } from '../App';
import { useAppSelector } from '../store/hooks';
import { selectHasPermission } from '../store/slices/authSlice';
import {
  marketingAPI, ExhibitionEvent, Installment, StallVendor,
  BannerSource, EventType, EventUpdateInput,
} from '../lib/marketing-api';

const TABS_EXHIBITION = [
  { key: 'overview', label: 'Overview' },
  { key: 'space_booking', label: 'Space Booking' },
  { key: 'stall_design', label: 'Stall Design' },
  { key: 'banner_design', label: 'Banner Design' },
  { key: 'travel', label: 'Travel' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'local_travel', label: 'Local Travel' },
  { key: 'gifting', label: 'Gifting' },
  { key: 'analysis', label: 'Analysis' },
];

const TABS_ROADSHOW = [
  { key: 'overview', label: 'Overview' },
  { key: 'space_booking', label: 'Space Booking' },
  { key: 'table_booking', label: 'Table Booking' },
  { key: 'travel', label: 'Travel' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'local_travel', label: 'Local Travel' },
  { key: 'gifting', label: 'Gifting' },
  { key: 'analysis', label: 'Analysis' },
];

const BANNER_SOURCE_OPTIONS: { value: BannerSource; label: string }[] = [
  { value: 'stall_vendor', label: 'From Stall Vendor' },
  { value: 'own', label: 'Own Design' },
];

type TabKey = 'overview' | 'space_booking' | 'stall_design' | 'banner_design' | 'table_booking' | 'travel' | 'hotel' | 'local_travel' | 'gifting' | 'analysis';

export const EventDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();
  const canView = useAppSelector(selectHasPermission('marketing.view_events'));
  const canEdit = useAppSelector(selectHasPermission('marketing.edit_events'));

  const [event, setEvent] = useState<ExhibitionEvent | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [editingTravelIdx, setEditingTravelIdx] = useState<number | null>(null);
  const [editingGiftIdx, setEditingGiftIdx] = useState<number | null>(null);

  const employeeCacheRef = useRef<Map<number, string>>(new Map());
  const nextVendorIdRef = useRef(1);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ev = await marketingAPI.getEvent(parseInt(id));

      // Resolve employee names into cache before rendering (avoid Employee #N flicker)
      const allIds = new Set([
        ...(ev.selected_employee_ids || []),
        ...(ev.travel_employee_ids || []),
        ...(ev.hotel_employee_ids || []),
        ...(ev.travel_tickets || []).map(t => t.employee_id).filter((e): e is number => e != null),
      ]);
      if (allIds.size > 0) {
        try {
          const res = await marketingAPI.getEmployees({ page_size: 500, status: 'active' });
          res.employees.forEach((emp) => {
            const name = [emp.first_name, emp.last_name].filter(Boolean).join(' ').trim() || emp.username || `#${emp.id}`;
            employeeCacheRef.current.set(emp.id, name);
          });
        } catch {
          // silently fail, fallback shows ID
        }
      }

      // Initialize vendor ID counter past any existing IDs (avoid overflow / collision)
      const maxVendorId = Math.max(0, ...(ev.stall_vendors || []).map(v => v.id));
      nextVendorIdRef.current = maxVendorId + 1;

      setEvent(ev);
    } catch (error: any) {
      showToast(error.message || 'Failed to load event', 'error');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => { if (canView) loadEvent(); }, [canView, loadEvent]);

  const handleEndEvent = async () => {
    if (!event) return;
    try {
      const updated = await marketingAPI.endEvent(event.id);
      setEvent(updated);
      showToast('Event ended successfully', 'success');
      setConfirmEnd(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to end event', 'error');
    }
  };

  const updateField = async (fields: EventUpdateInput) => {
    if (!event || !canEdit) return;
    setSaving(true);
    try {
      const updated = await marketingAPI.updateEvent(event.id, fields);
      setEvent(updated);
      showToast('Saved successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (fileType: 'stall_design' | 'banner_design' | 'travel_ticket' | 'local_travel_proof', file: File, vendorId?: number, entryIndex?: number) => {
    if (!event) return;
    setUploadProgress(0);
    try {
      const result = await marketingAPI.uploadEventFile(event.id, fileType, file, vendorId, setUploadProgress, entryIndex);
      const createdAt = new Date().toISOString();
      if (fileType === 'local_travel_proof') {
        const newFile = { id: result.id, file_name: result.file_name, file_url: result.file_url };
        setEvent({ ...event, local_travel_proofs: [...(event.local_travel_proofs || []), newFile] });
      } else if (fileType === 'stall_design' || fileType === 'banner_design') {
        const existing = event.stall_design_files.filter(f => f.vendor_id === vendorId);
        const newFile = {
          id: result.id,
          vendor_id: vendorId ?? null,
          file_name: result.file_name,
          file_url: result.file_url,
          revision_no: existing.length + 1,
          is_selected: false,
          created_at: createdAt,
        };
        if (fileType === 'stall_design') {
          setEvent({ ...event, stall_design_files: [...event.stall_design_files, newFile] });
        } else {
          setEvent({ ...event, banner_design_files: [...(event.banner_design_files || []), newFile] });
        }
      } else if (fileType === 'travel_ticket') {
        const newTicket = {
          id: result.id,
          employee_id: vendorId ?? 0,
          file_name: result.file_name,
          file_url: result.file_url,
          created_at: createdAt,
        };
        setEvent({ ...event, travel_tickets: [...(event.travel_tickets || []), newTicket] });
      }
      showToast('File uploaded successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to upload file', 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleViewFile = async (fileId: number) => {
    if (!event) return;
    try {
      const url = await marketingAPI.getEventFileDownloadUrl(event.id, fileId);
      setPreviewFile({ url, name: 'File' });
    } catch (error: any) {
      showToast(error.message || 'Failed to load file', 'error');
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    if (!event) return;
    try {
      await marketingAPI.downloadEventFile(event.id, fileId, fileName);
    } catch (error: any) {
      showToast(error.message || 'Failed to download file', 'error');
    }
  };

  const isEnded = event?.status === 'ended';
  const tabs = event?.type === 'roadshow' ? TABS_ROADSHOW : TABS_EXHIBITION;

  if (loading || !event) {
    return (
      <PageLayout title="Event Details" breadcrumbs={[{ label: 'Events', href: '/events' }, { label: 'Loading...' }]}>
        <Card><div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /><p className="mt-4 text-slate-600">Loading event...</p></div></Card>
      </PageLayout>
    );
  }

  const overviewTab = (
    <div className="space-y-6">
      <Card>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Name</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{event.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Location</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{event.location}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Start Date</p>
            <p className="text-sm font-medium text-slate-700 mt-1">{new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">End Date</p>
            <p className="text-sm font-medium text-slate-700 mt-1">{new Date(event.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Type</p>
            <Badge variant={event.type === 'exhibition' ? 'success' : 'default'} className="mt-1">{event.type === 'exhibition' ? 'Exhibition' : 'Roadshow'}</Badge>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
            <Badge variant={event.status === 'active' ? 'success' : 'default'} className="mt-1">{event.status === 'active' ? 'Active' : 'Ended'}</Badge>
          </div>
        </div>
      </Card>

      {event.status === 'active' && canEdit && (
        <div className="flex justify-end">
          <Button variant="danger" onClick={() => setConfirmEnd(true)} leftIcon={<CalendarCheck size={14} />}>
            End Event
          </Button>
        </div>
      )}
    </div>
  );

  const spaceBookingTab = (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vendor Name" value={event.space_booking_vendor || ''} onChange={(e) => setEvent({ ...event, space_booking_vendor: e.target.value })} disabled={isEnded || !canEdit} placeholder="Vendor name..." />
          <Input label="Total Amount (₹)" type="text" value={event.space_booking_amount ? String(event.space_booking_amount) : ''} onChange={(e) => setEvent({ ...event, space_booking_amount: parseFloat(e.target.value.replace(/\D/g, '')) || 0 })} disabled={isEnded || !canEdit} placeholder="0" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="pi_sent" checked={event.space_booking_pi_sent} disabled className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 opacity-60" />
              <label htmlFor="pi_sent" className="text-sm font-medium text-slate-500">PI Sent to Accounts</label>
            </div>
            <p className="text-[10px] text-slate-400 ml-7">Work in progress — feature not finalized</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Payment Status</label>
            {(() => {
              const totalPaid = (event.space_booking_installments || [])
                .filter(e => e.paid)
                .reduce((s, e) => s + (Number(e.amount) || 0), 0);
              const totalAmount = event.space_booking_amount || 0;
              const status = totalPaid <= 0 ? 'pending' : totalPaid >= totalAmount ? 'completed' : 'partial';
              const badge = status === 'completed'
                ? { variant: 'success' as const, label: 'Completed' }
                : status === 'partial'
                  ? { variant: 'warning' as const, label: 'Partial' }
                  : { variant: 'default' as const, label: 'Pending' };
              return <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>;
            })()}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Payment Entries</label>
            {canEdit && !isEnded && (
              <Button size="sm" variant="outline" onClick={() => setEvent({ ...event, space_booking_installments: [...(event.space_booking_installments || []), { due_date: '', amount: 0, paid: false }] })} leftIcon={<Plus size={12} />}>
                Add Payment Entry
              </Button>
            )}
          </div>

          {/* Summary bar */}
          {(() => {
            const totalPaid = (event.space_booking_installments || [])
              .filter(e => e.paid)
              .reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const totalAmount = event.space_booking_amount || 0;
            const remaining = Math.max(0, totalAmount - totalPaid);
            return (
              <div className="flex items-center gap-6 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <span className="text-slate-600">Total Amount: <strong className="text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</strong></span>
                <span className="text-slate-600">Total Paid: <strong className="text-emerald-600">₹{totalPaid.toLocaleString('en-IN')}</strong></span>
                <span className="text-slate-600">Remaining: <strong className={remaining > 0 ? 'text-amber-600' : 'text-slate-900'}>₹{remaining.toLocaleString('en-IN')}</strong></span>
              </div>
            );
          })()}

          {(!event.space_booking_installments || event.space_booking_installments.length === 0) ? (
            <p className="text-sm text-slate-400">No payment entries added yet.</p>
          ) : (
            <div className="space-y-2">
              {event.space_booking_installments.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <DatePicker value={entry.due_date || ''} onChange={(val) => {
                    const updated = [...(event.space_booking_installments || [])];
                    updated[idx] = { ...updated[idx], due_date: val || '' };
                    setEvent({ ...event, space_booking_installments: updated });
                  }} placeholder="Date" inputSize="sm" showIcon={false} />
                  <Input type="text" value={entry.amount ? String(entry.amount) : ''} onChange={(e) => {
                    const updated = [...(event.space_booking_installments || [])];
                    updated[idx] = { ...updated[idx], amount: parseFloat(e.target.value.replace(/\D/g, '')) || 0 };
                    setEvent({ ...event, space_booking_installments: updated });
                  }} placeholder="Amount" containerClassName="w-32" />
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={entry.paid} onChange={(e) => {
                      const updated = [...(event.space_booking_installments || [])];
                      updated[idx] = { ...updated[idx], paid: e.target.checked };
                      setEvent({ ...event, space_booking_installments: updated });
                    }} disabled={isEnded || !canEdit} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                    Paid
                  </label>
                  {canEdit && !isEnded && (
                    <button onClick={() => setEvent({ ...event, space_booking_installments: event.space_booking_installments.filter((_, i) => i !== idx) })} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => {
              const paidAmount = (event.space_booking_installments || [])
                .filter(e => e.paid)
                .reduce((s, e) => s + (Number(e.amount) || 0), 0);
              const totalAmount = event.space_booking_amount || 0;
              const paymentStatus = paidAmount <= 0 ? 'pending' : paidAmount >= totalAmount ? 'completed' : 'partial';
              updateField({
                space_booking_vendor: event.space_booking_vendor,
                space_booking_amount: event.space_booking_amount,
                space_booking_paid_amount: paidAmount,
                space_booking_pi_sent: event.space_booking_pi_sent,
                space_booking_payment_status: paymentStatus,
                space_booking_installments: event.space_booking_installments,
              });
            }} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Space Booking'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const stallDesignTab = event.type === 'exhibition' ? (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Vendors</h3>
          {canEdit && !isEnded && (
            <Button size="sm" variant="outline" onClick={() => { setNewVendorName(''); setVendorModalOpen(true); }} leftIcon={<Plus size={12} />}>
              Add Vendor
            </Button>
          )}
        </div>
        {(!event.stall_vendors || event.stall_vendors.length === 0) ? (
          <p className="text-sm text-slate-400">No vendors added yet.</p>
        ) : (
          <div className="space-y-3">
            {event.stall_vendors.map((vendor) => (
              <div key={vendor.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{vendor.name}</span>
                    {event.stall_selected_vendor_id === vendor.id && (
                      <Badge variant="success">Selected</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && !isEnded && event.stall_selected_vendor_id !== vendor.id && (
                      <Button size="sm" variant="outline" onClick={() => updateField({ stall_selected_vendor_id: vendor.id })}>
                        Select as Winner
                      </Button>
                    )}
                    {canEdit && !isEnded && (
                      <button onClick={() => {
                        setEvent({
                          ...event,
                          stall_vendors: event.stall_vendors.filter(v => v.id !== vendor.id),
                          stall_design_files: event.stall_design_files.filter(f => f.vendor_id !== vendor.id),
                        });
                      }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 shrink-0">
                    <Upload size={12} />
                    <span>Upload Design</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('stall_design', file, vendor.id);
                      e.target.value = '';
                    }} disabled={isEnded || !canEdit} />
                  </label>
                  {uploadProgress !== null && <div className="w-24 bg-slate-200 rounded-full h-1"><div className="bg-blue-600 h-1 rounded-full" style={{ width: `${uploadProgress}%` }} /></div>}
                </div>

                {event.stall_design_files.filter(f => f.vendor_id === vendor.id).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {event.stall_design_files.filter(f => f.vendor_id === vendor.id).map((file) => (
                      <div key={file.id} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-400" />
                          <span className="text-slate-700">{file.file_name}</span>
                          <span className="text-xs text-slate-400">Rev {file.revision_no}</span>
                          {file.is_selected && <Badge variant="success" className="text-[10px]">Selected</Badge>}
                        </div>
                        <button onClick={() => handleViewFile(file.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Preview">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDownloadFile(file.id, file.file_name)} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Download">
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {event.stall_selected_vendor_id && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Selected Vendor: {event.stall_vendors.find(v => v.id === event.stall_selected_vendor_id)?.name}</p>
                <p className="text-xs text-emerald-600 mt-1">PO Status: {event.stall_po_created ? 'PO Created' : 'PO Not Created'}</p>
              </div>
              {canEdit && !isEnded && !event.stall_po_created && (
                <Button size="sm" onClick={() => updateField({ stall_po_created: true })}>Create PO</Button>
              )}
            </div>
          </div>
        )}

        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => updateField({
              stall_vendors: event.stall_vendors,
              stall_selected_vendor_id: event.stall_selected_vendor_id,
              stall_po_created: event.stall_po_created,
            })} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Stall Design'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  ) : null;

  const bannerDesignTab = event.type === 'exhibition' ? (
    <div className="space-y-4">
      <Card>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Design Source</label>
          <SegmentToggle<BannerSource>
            options={BANNER_SOURCE_OPTIONS}
            value={event.banner_design_source || 'own'}
            onChange={(val) => setEvent({ ...event, banner_design_source: val })}
          />
          {event.banner_design_source === 'stall_vendor' && event.stall_selected_vendor_id && (
            <p className="text-sm text-slate-500 mt-2">Using designs from selected vendor: {event.stall_vendors.find(v => v.id === event.stall_selected_vendor_id)?.name}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 shrink-0">
            <Upload size={12} />
            <span>Upload Banner</span>
            <input type="file" accept=".pdf" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload('banner_design', file);
              e.target.value = '';
            }} disabled={isEnded || !canEdit} />
          </label>
          {uploadProgress !== null && <div className="w-24 bg-slate-200 rounded-full h-1"><div className="bg-blue-600 h-1 rounded-full" style={{ width: `${uploadProgress}%` }} /></div>}
        </div>

        {event.banner_design_files && event.banner_design_files.length > 0 && (
          <div className="mt-4 space-y-2">
            {event.banner_design_files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-700">{file.file_name}</span>
                </div>
                <button onClick={() => handleViewFile(file.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Preview">
                  <Eye size={14} />
                </button>
                <button onClick={() => handleDownloadFile(file.id, file.file_name)} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Download">
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => updateField({ banner_design_source: event.banner_design_source })} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  ) : null;

  const tableBookingTab = event.type === 'roadshow' ? (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Venue" value={event.table_booking_venue || ''} onChange={(e) => setEvent({ ...event, table_booking_venue: e.target.value })} disabled={isEnded || !canEdit} placeholder="Venue name..." />
          <Input label="Table Count" type="text" value={event.table_booking_count ? String(event.table_booking_count) : ''} onChange={(e) => {
            const count = parseInt(e.target.value.replace(/\D/g, '')) || 0;
            setEvent({ ...event, table_booking_count: count, table_booking_total_cost: count * (event.table_booking_cost_per_table || 0) });
          }} disabled={isEnded || !canEdit} placeholder="0" />
          <Input label="Cost per Table (₹)" type="text" value={event.table_booking_cost_per_table ? String(event.table_booking_cost_per_table) : ''} onChange={(e) => {
            const cost = parseInt(e.target.value.replace(/\D/g, '')) || 0;
            setEvent({ ...event, table_booking_cost_per_table: cost, table_booking_total_cost: (event.table_booking_count || 0) * cost });
          }} disabled={isEnded || !canEdit} placeholder="0" />
          <Input label="Total Cost (₹)" value={event.table_booking_total_cost ? String(event.table_booking_total_cost) : ''} disabled />
        </div>
        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => updateField({
              table_booking_venue: event.table_booking_venue,
              table_booking_count: event.table_booking_count,
              table_booking_cost_per_table: event.table_booking_cost_per_table,
            })} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Table Booking'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  ) : null;

  const travelTab = (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-4">
          <Input label="Days Before Exhibition (for production team)" type="text" value={event.travel_days_before ? String(event.travel_days_before) : ''} onChange={(e) => setEvent({ ...event, travel_days_before: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} disabled={isEnded || !canEdit} placeholder="e.g., 2" />
          {event.travel_days_before > 0 && event.start_date && (
            <p className="text-xs text-slate-500 mt-1">
              Team will be notified immediately, and again on{' '}
              <span className="font-semibold text-slate-700">
                {(() => {
                  const d = new Date(event.start_date);
                  d.setDate(d.getDate() - event.travel_days_before);
                  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                })()}
              </span>
              {' '}(departure day).
            </p>
          )}
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Assigned Employees for Travel</label>
          {event.selected_employee_ids && event.selected_employee_ids.length > 0 ? (
            <div className="space-y-2">
              {event.selected_employee_ids.map((empId) => (
                <div key={empId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">{employeeCacheRef.current.get(empId) || `Employee #${empId}`}</span>
                  <div className="flex items-center gap-2">
                    {event.travel_tickets?.some(t => t.employee_id === empId) ? (
                      <Badge variant="success">Ticket Uploaded</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">No ticket</span>
                    )}
                    {canEdit && !isEnded && (
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100">
                        <Upload size={12} />
                        <span>Upload Ticket</span>
                        <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('travel_ticket', file, empId);
                          e.target.value = '';
                        }} disabled={isEnded || !canEdit} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No employees selected for this event. Edit the event to add employees.</p>
          )}
        </div>

        {event.travel_tickets && event.travel_tickets.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Uploaded Tickets</label>
            <div className="space-y-1">
              {event.travel_tickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-slate-700">{ticket.file_name}</span>
                    <span className="text-xs text-slate-400">Employee #{ticket.employee_id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleViewFile(ticket.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Preview">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => handleDownloadFile(ticket.id, ticket.file_name)} className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded" title="Download">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => updateField({ travel_days_before: event.travel_days_before })} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Travel'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const hotelTab = (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 gap-4">
          <Input label="Hotel Name" value={event.hotel_name || ''} onChange={(e) => setEvent({ ...event, hotel_name: e.target.value })} disabled={isEnded || !canEdit} placeholder="Hotel name..." />
          <Input label="Hotel Cost (₹)" type="text" value={event.hotel_cost ? String(event.hotel_cost) : ''} onChange={(e) => setEvent({ ...event, hotel_cost: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} disabled={isEnded || !canEdit} placeholder="0" />
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Employees Staying</label>
          {event.selected_employee_ids && event.selected_employee_ids.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {event.selected_employee_ids.map((empId) => {
                const isSelected = event.hotel_employee_ids?.includes(empId);
                return (
                  <button
                    key={empId}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? (event.hotel_employee_ids || []).filter(id => id !== empId)
                        : [...(event.hotel_employee_ids || []), empId];
                      setEvent({ ...event, hotel_employee_ids: updated });
                    }}
                    disabled={isEnded || !canEdit}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    {employeeCacheRef.current.get(empId) || `Emp #${empId}`}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No employees selected for this event.</p>
          )}
        </div>

        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => updateField({ hotel_name: event.hotel_name, hotel_employee_ids: event.hotel_employee_ids, hotel_cost: event.hotel_cost })} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Hotel Booking'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const entries = event.local_travel_entries || [];
  const proofsForEntry = (idx: number) => (event.local_travel_proofs || []).filter(pf => pf.entry_index === idx);

  const localTravelTab = (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">Local Travel Entries</label>
          {canEdit && !isEnded && editingTravelIdx === null && (
            <Button size="sm" variant="outline" onClick={() => {
              const idx = entries.length;
              setEvent({ ...event, local_travel_entries: [...entries, { note: '', amount: 0, employee_ids: [] }] });
              setEditingTravelIdx(idx);
            }} leftIcon={<Plus size={12} />}>
              Add Entry
            </Button>
          )}
        </div>

        {/* Editable form */}
        {editingTravelIdx !== null && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                {editingTravelIdx < entries.length ? 'Editing Entry' : 'New Entry'}
              </span>
            </div>
            <Input type="text" value={entries[editingTravelIdx]?.note || ''} onChange={(e) => {
              const updated = [...entries];
              updated[editingTravelIdx] = { ...updated[editingTravelIdx], note: e.target.value };
              setEvent({ ...event, local_travel_entries: updated });
            }} placeholder="Note — what was this for? (e.g., venue visit, setup day)" />
            <div className="flex items-center gap-3">
              <Input type="text" value={entries[editingTravelIdx]?.amount ? String(entries[editingTravelIdx].amount) : ''} onChange={(e) => {
                const updated = [...entries];
                updated[editingTravelIdx] = { ...updated[editingTravelIdx], amount: parseFloat(e.target.value.replace(/\D/g, '')) || 0 };
                setEvent({ ...event, local_travel_entries: updated });
              }} placeholder="Amount" containerClassName="w-28" />
              <span className="text-xs text-slate-500">Employees:</span>
              <div className="flex flex-wrap gap-1.5">
                {event.selected_employee_ids && event.selected_employee_ids.length > 0 ? event.selected_employee_ids.map((empId) => {
                  const isSelected = entries[editingTravelIdx]?.employee_ids?.includes(empId);
                  return (
                    <button
                      key={empId}
                      type="button"
                      onClick={() => {
                        const updated = [...entries];
                        const current = updated[editingTravelIdx].employee_ids || [];
                        updated[editingTravelIdx] = {
                          ...updated[editingTravelIdx],
                          employee_ids: isSelected
                            ? current.filter((id: number) => id !== empId)
                            : [...current, empId],
                        };
                        setEvent({ ...event, local_travel_entries: updated });
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-blue-200 text-blue-800 border-blue-400'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {employeeCacheRef.current.get(empId) || `#${empId}`}
                    </button>
                  );
                }) : <span className="text-xs text-slate-400">None</span>}
              </div>
            </div>
            {/* Proof upload in editable form */}
            <div className="flex items-center gap-2 flex-wrap">
              {proofsForEntry(editingTravelIdx).map((pf) => (
                <div key={pf.id} className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 rounded-md px-2 py-1">
                  <FileText size={12} className="text-slate-400" />
                  <span className="text-slate-600">{pf.file_name}</span>
                  <button onClick={() => handleViewFile(pf.id)} className="text-blue-600 hover:text-blue-800" title="View">
                    <Eye size={12} />
                  </button>
                  <button onClick={() => handleDownloadFile(pf.id, pf.file_name)} className="text-slate-500 hover:text-slate-700" title="Download">
                    <Download size={12} />
                  </button>
                </div>
              ))}
              <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-100">
                <Upload size={12} />
                <span>Add Proof</span>
                <input type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload('local_travel_proof', file, undefined, editingTravelIdx);
                  e.target.value = '';
                }} />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => setEditingTravelIdx(null)} leftIcon={<X size={14} />}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Read-only saved entries */}
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No local travel entries added yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              editingTravelIdx === idx ? null : (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{entry.note || '(no note)'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">₹{(entry.amount || 0).toLocaleString('en-IN')}</span>
                      {(entry.employee_ids || []).length > 0 && (
                        <span>
                          {(entry.employee_ids || []).map(eid => employeeCacheRef.current.get(eid) || `#${eid}`).join(', ')}
                        </span>
                      )}
                      {proofsForEntry(idx).length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileText size={11} />
                          {proofsForEntry(idx).length} file{(proofsForEntry(idx).length > 1 ? 's' : '')}
                        </span>
                      )}
                    </div>
                    {proofsForEntry(idx).length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        {proofsForEntry(idx).map(pf => (
                          <span key={pf.id} className="inline-flex items-center gap-1">
                            <button onClick={() => handleViewFile(pf.id)} className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2">
                              {pf.file_name}
                            </button>
                            <button onClick={() => handleDownloadFile(pf.id, pf.file_name)} className="text-slate-400 hover:text-slate-600" title="Download">
                              <Download size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {canEdit && !isEnded && (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => {
                        setEditingTravelIdx(idx);
                      }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => {
                        setEvent({ ...event, local_travel_entries: entries.filter((_, i) => i !== idx) });
                        if (editingTravelIdx === idx) setEditingTravelIdx(null);
                      }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-2">
          Total: <span className="font-semibold text-slate-700">₹{entries.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('en-IN')}</span>
        </p>
        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => {
              updateField({ local_travel_entries: entries });
              setEditingTravelIdx(null);
            }} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Local Travel'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const giftEntries = event.gifting_entries || [];

  const giftingTab = (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">Gifting Entries</label>
          {canEdit && !isEnded && editingGiftIdx === null && (
            <Button size="sm" variant="outline" onClick={() => {
              const idx = giftEntries.length;
              setEvent({ ...event, gifting_entries: [...giftEntries, { name: '', count: 0, amount: 0 }] });
              setEditingGiftIdx(idx);
            }} leftIcon={<Plus size={12} />}>
              Add Gift
            </Button>
          )}
        </div>

        {/* Editable form */}
        {editingGiftIdx !== null && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              {editingGiftIdx < giftEntries.length ? 'Editing Gift' : 'New Gift'}
            </span>
            <div className="flex items-center gap-3">
              <Input type="text" value={giftEntries[editingGiftIdx]?.name || ''} onChange={(e) => {
                const updated = [...giftEntries];
                updated[editingGiftIdx] = { ...updated[editingGiftIdx], name: e.target.value };
                setEvent({ ...event, gifting_entries: updated });
              }} placeholder="Gift name (e.g., Pen, Diary)" containerClassName="flex-1" />
              <Input type="text" value={giftEntries[editingGiftIdx]?.count ? String(giftEntries[editingGiftIdx].count) : ''} onChange={(e) => {
                const updated = [...giftEntries];
                updated[editingGiftIdx] = { ...updated[editingGiftIdx], count: parseInt(e.target.value.replace(/\D/g, '')) || 0 };
                setEvent({ ...event, gifting_entries: updated });
              }} placeholder="Count" containerClassName="w-20" />
              <Input type="text" value={giftEntries[editingGiftIdx]?.amount ? String(giftEntries[editingGiftIdx].amount) : ''} onChange={(e) => {
                const updated = [...giftEntries];
                updated[editingGiftIdx] = { ...updated[editingGiftIdx], amount: parseFloat(e.target.value.replace(/\D/g, '')) || 0 };
                setEvent({ ...event, gifting_entries: updated });
              }} placeholder="Per-unit cost" containerClassName="w-28" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => setEditingGiftIdx(null)} leftIcon={<X size={14} />}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Read-only saved entries */}
        {giftEntries.length === 0 ? (
          <p className="text-sm text-slate-400">No gifting entries added yet.</p>
        ) : (
          <div className="space-y-2">
            {giftEntries.map((entry, idx) => (
              editingGiftIdx === idx ? null : (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-slate-800">{entry.name || '(unnamed)'}</p>
                    <span className="text-xs text-slate-500">x{entry.count || 0}</span>
                    <span className="text-sm font-semibold text-slate-700">₹{((entry.amount || 0) * (entry.count || 0)).toLocaleString('en-IN')}</span>
                    {entry.count > 0 && entry.amount > 0 && (
                      <span className="text-xs text-slate-400">(₹{entry.amount}/unit)</span>
                    )}
                  </div>
                  {canEdit && !isEnded && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingGiftIdx(idx)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => {
                        setEvent({ ...event, gifting_entries: giftEntries.filter((_, i) => i !== idx) });
                        if (editingGiftIdx === idx) setEditingGiftIdx(null);
                      }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-2">
          Total: <span className="font-semibold text-slate-700">₹{giftEntries.reduce((s, e) => s + (e.amount || 0) * (e.count || 0), 0).toLocaleString('en-IN')}</span>
        </p>
        {canEdit && !isEnded && (
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <Button onClick={() => {
              updateField({ gifting_entries: giftEntries });
              setEditingGiftIdx(null);
            }} disabled={saving} leftIcon={<Save size={14} />}>
              {saving ? 'Saving...' : 'Save Gifting'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );

  const expenseCategories = [
    { label: 'Space Booking', amount: event.space_booking_amount || 0 },
    ...(event.type === 'exhibition' ? [
      { label: 'Stall Design', amount: 0 },
      { label: 'Banner Design', amount: 0 },
    ] : [
      { label: 'Table Booking', amount: event.table_booking_total_cost || 0 },
    ]),
    { label: 'Travel', amount: 0 },
    { label: 'Hotel', amount: event.hotel_cost || 0 },
    { label: 'Local Travel', amount: (event.local_travel_entries || []).reduce((s, e) => s + (e.amount || 0), 0) },
    { label: 'Gifting', amount: (event.gifting_entries || []).reduce((s, e) => s + (e.amount || 0) * (e.count || 0), 0) },
  ];

  const totalSpent = expenseCategories.reduce((sum, cat) => sum + (cat.amount || 0), 0);

  const analysisTab = (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Budget</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">₹{(event.budget || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Total Spent</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">₹{(totalSpent || event.total_spent || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Remaining</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">₹{Math.max(0, (event.budget || 0) - totalSpent).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <h4 className="font-semibold text-slate-900 mb-3">Per-Category Breakdown</h4>
        <div className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Spent</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">% of Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenseCategories.map((cat) => (
                <tr key={cat.label}>
                  <td className="px-4 py-3 text-slate-700">{cat.label}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">₹{(cat.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-600">
                      {event.budget > 0 ? `${((cat.amount || 0) / event.budget * 100).toFixed(1)}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-slate-800">Total</td>
                <td className="px-4 py-3 text-right text-slate-900">₹{(totalSpent || event.total_spent || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {event.budget > 0 ? `${((totalSpent || event.total_spent || 0) / event.budget * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return overviewTab;
      case 'space_booking': return spaceBookingTab;
      case 'stall_design': return stallDesignTab;
      case 'banner_design': return bannerDesignTab;
      case 'table_booking': return tableBookingTab;
      case 'travel': return travelTab;
      case 'hotel': return hotelTab;
      case 'local_travel': return localTravelTab;
      case 'gifting': return giftingTab;
      case 'analysis': return analysisTab;
      default: return overviewTab;
    }
  };

  return (
    <PageLayout
      title={event.name || 'Event Details'}
      description="Event details and attendee management."
      breadcrumbs={[
        { label: 'Events', href: '/events' },
        { label: event.name },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.id}/edit`)} leftIcon={<Edit size={14} />}>
              Edit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/events')} leftIcon={<ArrowLeft size={14} />}>
            Back
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderTab()}
      </div>

      <PdfPreviewModal
        isOpen={previewFile != null}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ''}
        fileName={previewFile?.name || ''}
      />

      <Modal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title="Add Vendor"
        footer={
          <>
            <Button variant="outline" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (newVendorName.trim() && event) {
                const updatedVendors = [...(event.stall_vendors || []), { id: nextVendorIdRef.current++, name: newVendorName.trim() }];
                await updateField({ stall_vendors: updatedVendors });
                setVendorModalOpen(false);
                setNewVendorName('');
              }
            }} disabled={!newVendorName.trim() || saving}>Save</Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Vendor Name</label>
          <Input
            type="text"
            value={newVendorName}
            onChange={(e) => setNewVendorName(e.target.value)}
            placeholder="Enter vendor name..."
            autoFocus
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        onConfirm={handleEndEvent}
        title="End Event"
        message="Are you sure you want to end this event? This will lock all editing."
        confirmLabel="End Event"
        variant="danger"
      />
    </PageLayout>
  );
};
