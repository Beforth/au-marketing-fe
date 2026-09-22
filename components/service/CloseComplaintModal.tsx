/**
 * Service module — "Close complaint" modal, shared between the complaint
 * detail page and the Complaints kanban board (dropping a card on "Closed").
 */
import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useApp } from '../../App';
import { marketingAPI, ServiceComplaint } from '../../lib/marketing-api';

interface CloseComplaintModalProps {
  complaint: ServiceComplaint;
  isOpen: boolean;
  onClose: () => void;
  onClosed: (updated: ServiceComplaint) => void;
}

export const CloseComplaintModal: React.FC<CloseComplaintModalProps> = ({ complaint, isOpen, onClose, onClosed }) => {
  const { showToast } = useApp();
  const [note, setNote] = useState('');
  const [hours, setHours] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setHours(complaint.actual_time_hours != null ? String(complaint.actual_time_hours) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, complaint.id]);

  const submit = async () => {
    setBusy(true);
    try {
      const updated = await marketingAPI.closeServiceComplaint(complaint.id, note.trim() || undefined, hours ? Number(hours) : null);
      showToast('Complaint closed', 'success');
      onClosed(updated);
      onClose();
    } catch (e: any) {
      showToast(e?.message || 'Failed to close complaint', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Close complaint"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} isLoading={busy} onClick={submit}>Close complaint</Button>
        </>
      }
    >
      <p className="text-xs text-amber-600 mb-3">
        If this complaint is tied to a visit, that visit's service report must be submitted first — closing will be refused otherwise.
      </p>
      <Input label="Actual time taken (hours)" type="number" min={0} step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
      <label className="block text-sm font-medium text-slate-700 mb-1.5 mt-3">Closing note (optional)</label>
      <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
    </Modal>
  );
};
