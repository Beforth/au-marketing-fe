
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 overflow-visible">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl bg-white">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-visible">
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
