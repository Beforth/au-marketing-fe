import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationProps {
  type?: NotificationType;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export function Notification({ type = 'info', title, message, onClose, className }: NotificationProps) {
  const icons = {
    info: <Info className="text-blue-500" size={20} />,
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    warning: <AlertCircle className="text-amber-500" size={20} />,
    error: <XCircle className="text-rose-500" size={20} />,
  };

  const backgrounds = {
    info: 'bg-blue-50/50 border-blue-100',
    success: 'bg-emerald-50/50 border-emerald-100',
    warning: 'bg-amber-50/50 border-amber-100',
    error: 'bg-rose-50/50 border-rose-100',
  };

  return (
    <div className={cn(
      'flex items-start gap-4 p-4 rounded-2xl border shadow-sm transition-all duration-300 animate-in slide-in-from-right-5',
      backgrounds[type],
      className
    )}>
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h4>
        {message && <p className="text-xs font-semibold text-slate-500 mt-1">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 p-1 rounded-full hover:bg-white/50 text-slate-400">
          <X size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
