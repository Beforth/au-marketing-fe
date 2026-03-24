import React from 'react';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[11px] uppercase font-black tracking-widest text-slate-500 ml-1">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
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

Textarea.displayName = 'Textarea';
