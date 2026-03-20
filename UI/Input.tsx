import React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, containerClassName, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label className="text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'hover:border-slate-300',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-tight">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
