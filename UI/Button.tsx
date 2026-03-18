import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-[0.98]',
      secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm active:scale-[0.98]',
      outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs active:scale-[0.98]',
      ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:scale-[0.98]',
      link: 'text-indigo-600 hover:underline font-semibold p-0 h-auto',
    };

    const sizes = {
      xs: 'h-8 px-3 text-[10px] rounded-lg uppercase tracking-widest font-bold',
      sm: 'h-9 px-4 text-xs rounded-lg font-bold',
      md: 'h-10 px-5 text-sm rounded-lg font-bold',
      lg: 'h-12 px-8 text-base rounded-xl font-bold',
      icon: 'h-10 w-10 p-0 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin mr-2" size={16} />
        ) : (
          leftIcon && <span className="mr-2 opacity-90">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 opacity-90">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
