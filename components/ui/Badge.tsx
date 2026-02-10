
import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    error: 'bg-rose-50 text-rose-700 border border-rose-100',
    outline: 'border border-slate-200 text-slate-600',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center',
      styles[variant],
      className
    )}>
      {children}
    </span>
  );
};
