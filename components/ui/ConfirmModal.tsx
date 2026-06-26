/**
 * Confirmation dialog modal – replaces window.confirm with a consistent UI.
 */
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'default';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const confirmClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
      : variant === 'primary'
        ? 'bg-[var(--primary)] hover:opacity-90 text-white'
        : 'bg-slate-800 hover:bg-slate-900 text-white';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      contentClassName="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button className={confirmClass} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Please wait…' : confirmLabel}
          </Button>
        </>
      }
    >
      {variant === 'danger' ? (
        <div className="flex gap-4 items-start">
          <div className="shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <p className="text-sm text-slate-600 pt-1.5">{message}</p>
        </div>
      ) : (
        <p className="text-slate-600 text-sm">{message}</p>
      )}
    </Modal>
  );
};
