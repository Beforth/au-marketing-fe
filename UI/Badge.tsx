import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-900 text-white border-transparent',
    secondary: 'bg-slate-100 text-slate-900 border-transparent hover:bg-slate-200',
    outline: 'text-slate-900 border-slate-200 bg-transparent',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-widest text-[9px] font-black',
    warning: 'bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-widest text-[9px] font-black',
    danger: 'bg-rose-50 text-rose-700 border-rose-100 uppercase tracking-widest text-[9px] font-black',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-100 uppercase tracking-widest text-[9px] font-black',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
