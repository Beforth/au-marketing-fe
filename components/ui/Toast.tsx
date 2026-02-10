
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={18} />,
    error: <AlertCircle className="text-rose-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    info: 'bg-blue-50 border-blue-100',
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-right-10 fade-in duration-300 ${bgColors[type]}`}>
      {icons[type]}
      <span className="text-sm font-semibold text-slate-800">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/5 rounded-lg transition-colors">
        <X size={14} className="text-slate-400" />
      </button>
    </div>
  );
};
