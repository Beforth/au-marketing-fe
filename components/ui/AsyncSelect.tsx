/**
 * Async Searchable Select Component with API-based search
 * Dropdown is rendered in a portal so it is not clipped by parent overflow.
 */
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';


export interface AsyncSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface AsyncSelectProps {
  loadOptions: (search: string) => Promise<AsyncSelectOption[]>;
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
  initialOptions?: AsyncSelectOption[];
  inputSize?: 'sm' | 'md' | 'lg';
  triggerClassName?: string;
  containerClassName?: string;
}

export const AsyncSelect: React.FC<AsyncSelectProps> = ({
  loadOptions,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  className,
  label,
  error,
  initialOptions = [],
  inputSize = 'md',
  triggerClassName,
  containerClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<AsyncSelectOption[]>(initialOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cacheRef = useRef<Map<string, AsyncSelectOption[]>>(new Map());
  const lastSearchRef = useRef<string>('');

  const selectedOption = options.find(opt => opt.value === value);

  /** Stable fingerprint so we resync when parent passes a new option set (e.g. regions after domain change). */
  const initialOptionsKey = useMemo(
    () => JSON.stringify(initialOptions.map((o) => ({ v: o.value, l: o.label }))),
    [initialOptions]
  );

  // Debounced search function with caching
  const performSearch = useCallback(async (query: string) => {
    const cacheKey = query.toLowerCase().trim();
    if (cacheRef.current.has(cacheKey)) {
      setOptions(cacheRef.current.get(cacheKey)!);
      return;
    }

    lastSearchRef.current = cacheKey;
    setIsLoading(true);
    try {
      const results = await loadOptions(query);
      setOptions(results);
      cacheRef.current.set(cacheKey, results);
    } catch (error) {
      console.error('Error loading options:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadOptions]);

  // When initial options change (new domain, etc.), replace list + drop stale search/cache.
  useEffect(() => {
    setSearchQuery('');
    setOptions(initialOptions);
    cacheRef.current.clear();
    lastSearchRef.current = '';
    if (initialOptions.length > 0) {
      cacheRef.current.set('', initialOptions);
    }
  }, [initialOptionsKey]); // initialOptions content matches key on the render when the key changes

  // Load initial options when dropdown opens (only if we don't have any and no initial options)
  useEffect(() => {
    if (isOpen && options.length === 0 && !searchQuery && initialOptions.length === 0) {
      performSearch('');
    }
  }, [isOpen, options.length, searchQuery, initialOptions.length, performSearch]);

  // Debounce search query - only search when query actually changes and dropdown is open
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const cacheKey = searchQuery.toLowerCase().trim();
    // Only search if query changed and we don't have it cached
    if (cacheKey !== lastSearchRef.current || !cacheRef.current.has(cacheKey)) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else if (cacheRef.current.has(cacheKey)) {
      // Use cached result immediately
      setOptions(cacheRef.current.get(cacheKey)!);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isOpen, performSearch]);

  // Position dropdown in portal so it is not clipped by parent overflow
  useLayoutEffect(() => {
    if (!isOpen || !selectRef.current) {
      setDropdownRect(null);
      return;
    }
    const rect = selectRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 260;
    const openUp = spaceBelow < dropdownHeight && rect.top > spaceBelow;
    setDropdownRect({
      top: openUp ? rect.top - dropdownHeight : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, [isOpen]);

  // Close dropdown when clicking outside (trigger or portal dropdown)
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const path = event.composedPath();
      if (selectRef.current && path.includes(selectRef.current)) return;
      if (dropdownRef.current && path.includes(dropdownRef.current)) return;
      setIsOpen(false);
      setSearchQuery('');
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    if (optionValue === value) {
      onChange(undefined);
    } else {
      onChange(optionValue);
    }
    setIsOpen(false);
    setSearchQuery('');
    // Clear cache when selection changes to allow fresh data
    cacheRef.current.clear();
    lastSearchRef.current = '';
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearchQuery('');
  };

  return (
    <div className={cn('space-y-1.5 w-full', containerClassName || className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 ml-0.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full border rounded-lg text-left transition-all',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm',
            'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/30',
            inputSize === 'sm' && 'h-9 px-3 text-xs',
            inputSize === 'md' && 'h-10 px-4 text-sm font-medium',
            inputSize === 'lg' && 'h-12 px-5 text-base font-medium',
            disabled && 'bg-slate-50 cursor-not-allowed opacity-50',
            error && 'border-rose-300 bg-rose-50',
            'flex items-center justify-between gap-2',
            triggerClassName
          )}
        >
          <span className={cn(
            'flex-1 truncate',
            !selectedOption && 'text-slate-400'
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear(e as any);
                }}
                className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </div>
            )}
            <ChevronDown
              size={16}
              className={cn(
                'text-slate-400 transition-transform',
                isOpen && 'transform rotate-180'
              )}
            />
          </div>
        </button>

        {isOpen && dropdownRect && createPortal(
          <div
            ref={dropdownRef}
            data-marketing-async-select-dropdown
            className="fixed z-[99999] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-80 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              minWidth: 160,
            }}
          >
            <div className="p-2 border-b border-slate-200 shrink-0">
              <div className="relative group/search">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-600 transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all shadow-inner"
                  onClick={(e) => e.stopPropagation()}
                />
                {isLoading && (
                  <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
                )}
              </div>
            </div>
            <div className="overflow-y-auto max-h-48 scrollbar-hide py-1 min-h-0">
              {isLoading && options.length === 0 ? (
                <div className="px-3 py-8 text-sm text-slate-500 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500 opacity-50" />
                  <p className="text-xs uppercase tracking-widest font-black opacity-30">Loading options...</p>
                </div>
              ) : options.length === 0 ? (
                <div className="px-3 py-6 text-sm text-slate-500 text-center uppercase tracking-widest font-black opacity-30">
                  No results found
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                      'flex items-center justify-between mx-1 rounded-lg w-[calc(100%-8px)]',
                      value === option.value && 'bg-indigo-50 text-indigo-700 font-bold',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {value === option.value && (
                      <div className="h-2 w-2 rounded-full bg-indigo-600 shadow-sm" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && (
        <p className="text-[11px] text-rose-500 font-medium ml-0.5 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};
