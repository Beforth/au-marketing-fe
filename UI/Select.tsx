import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              'flex h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'hover:border-slate-300',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        {error && <span className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-tight">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
