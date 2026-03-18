import React from 'react';
import { cn } from '../lib/utils';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative flex items-center justify-center">
          <input
            type="radio"
            className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
            ref={ref}
            {...props}
          />
          <div className={cn(
            'h-5 w-5 rounded-full border-2 border-slate-200 bg-white transition-all duration-200 flex items-center justify-center',
            'peer-checked:border-indigo-600',
            'peer-focus:ring-2 peer-focus:ring-indigo-500/20',
            'group-hover:border-slate-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}>
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 scale-0 peer-checked:scale-100 transition-transform duration-200" />
          </div>
        </div>
        {label && <span className="text-sm font-semibold text-slate-700 select-none">{label}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';
