/**
 * Service module — "Reopen complaint" modal, shared between the complaint
 * detail page and the Complaints kanban board (dropping a closed card anywhere).
 */
import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useApp } from '../../App';
import { marketingAPI, ServiceComplaint } from '../../lib/marketing-api';

interface ReopenComplaintModalProps {
  complaint: ServiceComplaint;
  isOpen: boolean;
  onClose: () => void;
  onReopened: (updated: ServiceComplaint) => void;
}

export const ReopenComplaintModal: React.FC<ReopenComplaintModalProps> = ({ complaint, isOpen, onClose, onReopened }) => {
  const { showToast } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) setNote('');
  }, [isOpen, complaint.id]);

  const submit = async () => {
    setBusy(true);
    try {
      const updated = await marketingAPI.reopenServiceComplaint(complaint.id, note.trim());
      showToast('Complaint reopened', 'success');
      onReopened(updated);
      onClose();
    } catch (e: any) {
      showToast(e?.message || 'Failed to reopen complaint', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reopen complaint"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={note.trim().length < 3 || busy} isLoading={busy} onClick={submit}>Reopen</Button>
        </>
      }
    >
      <p className="text-sm text-slate-500 mb-3">
        The reopened complaint gets an "i" added to its number ({complaint.display_number} → {complaint.display_number}i).
      </p>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Why is it being reopened? <span className="text-rose-500">*</span></label>
      <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
    </Modal>
  );
};
