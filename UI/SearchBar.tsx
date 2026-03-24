import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  isLoading?: boolean;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onClear, isLoading, value, ...props }, ref) => {
    return (
      <div className={cn('relative flex items-center w-full group', className)}>
        <div className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input
          ref={ref}
          value={value}
          className={cn(
            'flex h-11 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-10 text-sm font-semibold transition-all duration-300',
            'placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 group-hover:border-slate-300',
            'shadow-sm shadow-slate-200/50'
          )}
          {...props}
        />
        {value && !isLoading && (
          <button
            onClick={onClear}
            className="absolute right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={16} strokeWidth={3} />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-4 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
