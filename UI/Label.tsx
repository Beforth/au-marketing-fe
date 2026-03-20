import React from 'react';
import { cn } from '../lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-[11px] uppercase font-black tracking-widest text-slate-500 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 text-sm">*</span>}
    </label>
  )
);

Label.displayName = 'Label';
