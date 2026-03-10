
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Optional class for the inner content box (e.g. max-w-4xl for wider modals) */
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, contentClassName }) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 isolate">
      <div 
        className="absolute inset-0 bg-slate-900/55 animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className={`relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 overflow-visible ${contentClassName ?? 'max-w-lg'}`}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl bg-white">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
