import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  containerClassName?: string;
  rightElement?: React.ReactNode;
  inputSize?: 'sm' | 'md';
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(({
  onClear,
  containerClassName,
  className,
  value,
  rightElement,
  inputSize = 'md',
  ...props
}, ref) => {
  return (
    <div className={cn('relative group/search flex items-center w-full', containerClassName)}>
      <div className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-600 transition-colors pointer-events-none z-10",
        inputSize === 'sm' && "left-3"
      )}>
        <Search size={inputSize === 'sm' ? 14 : 16} strokeWidth={2.5} />
      </div>
      
      <input
        ref={ref}
        type="text"
        value={value}
        className={cn(
          'w-full bg-white border border-slate-200 rounded-full outline-none transition-all shadow-sm',
          inputSize === 'sm' ? 'h-9 pl-9 pr-9 text-xs' : 'h-10 pl-11 pr-10 text-sm font-medium',
          'placeholder:text-slate-400',
          'focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-md',
          'hover:border-slate-300 hover:bg-slate-50/50',
          className
        )}
        {...props}
      />

      {rightElement && !value && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-focus-within/search:opacity-80 transition-opacity z-10 pointer-events-none">
          {rightElement}
        </div>
      )}

      {value && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onClear?.(); }}
          className="absolute right-3 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});
