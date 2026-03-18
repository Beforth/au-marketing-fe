import React from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
            <Calendar size={18} />
          </div>
          <input
            type="date"
            ref={ref}
            className={cn(
              'flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
              'group-hover:border-slate-300 [appearance:none] cursor-pointer',
              'relative z-10 bg-transparent',
              error ? 'border-rose-500' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[10px] font-bold text-rose-500 ml-1 uppercase">{error}</span>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
