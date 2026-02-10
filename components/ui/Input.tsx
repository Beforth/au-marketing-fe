
import React, { forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onClear?: () => void;
  error?: string;
  variant?: 'slate' | 'white' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  icon,
  rightElement,
  onClear,
  error,
  variant = 'slate',
  inputSize = 'md',
  className,
  containerClassName,
  value,
  ...props
}, ref) => {
  const variants = {
    slate: 'bg-slate-50 border-slate-200 focus:bg-white',
    white: 'bg-white border-slate-200 shadow-sm focus:shadow-md',
    ghost: 'bg-transparent border-transparent hover:bg-slate-50 focus:bg-white focus:border-slate-200',
  };

  const sizes = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 text-sm font-medium',
    lg: 'h-12 px-5 text-base font-medium',
  };

  return (
    <div className={cn('space-y-1.5 w-full font-sans', containerClassName)}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 ml-0.5">
          {label}
        </label>
      )}
      <div className="relative group/input flex items-center">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[var(--primary)] transition-colors pointer-events-none z-10">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          value={value}
          className={cn(
            'w-full border rounded-lg outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)]',
            variants[variant],
            sizes[inputSize],
            icon && 'pl-10',
            (rightElement || (onClear && value)) && 'pr-12',
            error ? 'border-rose-300 bg-rose-50' : '',
            className
          )}
          {...props}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5">
          {onClear && value && (
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); onClear(); }}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          {rightElement}
        </div>
      </div>
      {error && (
        <p className="text-[11px] text-rose-500 font-medium ml-0.5 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
