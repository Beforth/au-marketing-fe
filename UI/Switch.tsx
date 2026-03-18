import React from 'react';
import { cn } from '../lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
            ref={ref}
            {...props}
          />
          <div className={cn(
            'h-6 w-11 rounded-full bg-slate-200 transition-all duration-300 peer-checked:bg-indigo-600',
            'peer-focus:ring-2 peer-focus:ring-indigo-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}>
            <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-all duration-300 peer-checked:translate-x-5" />
          </div>
        </div>
        {label && <span className="text-sm font-semibold text-slate-700 select-none">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
