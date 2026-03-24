import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  getSearchText?: (option: SelectOption) => string;
  exactValueMatchWhenQueryMatches?: RegExp;
  getOptionKey?: (option: SelectOption, index: number) => string | number;
  label?: string;
  error?: string;
  containerClassName?: string;
  clearable?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
  triggerClassName?: string;
  isCombobox?: boolean;
  dropdownWidth?: number | 'auto' | 'trigger';
}

const fuzzySearch = (query: string, text: string): boolean => {
  if (!query) return true;
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  if (textLower.includes(queryLower)) return true;
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) queryIndex++;
  }
  return queryIndex === queryLower.length;
};

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  className,
  searchable = true,
  clearable = true,
  getSearchText,
  exactValueMatchWhenQueryMatches,
  getOptionKey,
  label,
  error,
  containerClassName,
  inputSize = 'md',
  triggerClassName,
  isCombobox = false,
  dropdownWidth = 'trigger'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownRect, setDropdownRect] = useState<{ top: number; bottom: number; left: number; width: number; openUp: boolean } | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value == value);
  const trimmedQuery = (searchQuery ?? '').trim();
  const isQueryDialCode = exactValueMatchWhenQueryMatches?.test(trimmedQuery);
  const normalizedDialCode = isQueryDialCode && trimmedQuery
    ? (trimmedQuery.startsWith('+') ? trimmedQuery : '+' + trimmedQuery)
    : null;

  const filteredOptions = searchable && trimmedQuery
    ? isQueryDialCode && normalizedDialCode
      ? options.filter(opt => String(opt.value) === normalizedDialCode)
      : options.filter(opt => {
        const textToSearch = getSearchText ? getSearchText(opt) : opt.label;
        return fuzzySearch(trimmedQuery, textToSearch);
      })
    : options;

  useLayoutEffect(() => {
    if (!isOpen || !selectRef.current) {
      setDropdownRect(null);
      return;
    }
    const rect = selectRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 250 && spaceAbove > spaceBelow;

    setDropdownRect({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, [isOpen]);

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
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    if (optionValue != value) onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearchQuery('');
  };

  return (
    <div className={cn('space-y-1.5 w-full relative', containerClassName || className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 ml-0.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={cn("relative", isCombobox && "group/combobox")} ref={selectRef}>
        {isCombobox ? (
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              disabled={disabled}
              placeholder={placeholder}
              value={isOpen ? searchQuery : (selectedOption?.label || '')}
              onChange={(e) => {
                if (!isOpen) setIsOpen(true);
                setSearchQuery(e.target.value);
              }}
              onFocus={() => !disabled && setIsOpen(true)}
              className={cn(
                'w-full border rounded-lg text-left transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500',
                'bg-white border-slate-300 shadow-sm',
                inputSize === 'sm' && 'h-9 px-3 text-xs',
                inputSize === 'md' && 'h-10 px-4 text-sm font-medium',
                inputSize === 'lg' && 'h-12 px-5 text-base font-medium',
                disabled && 'bg-slate-50 cursor-not-allowed opacity-50',
                error && 'border-rose-300 bg-rose-50 placeholder:text-rose-400',
                'pr-10',
                triggerClassName
              )}
            />
            <div className="absolute right-3 flex items-center gap-1">
              {value && !disabled && clearable && (
                <div onClick={handleClear} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={14} />
                </div>
              )}
              <ChevronDown size={16} className={cn('text-slate-400 transition-transform cursor-pointer', isOpen && 'rotate-180')} />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full border rounded-lg text-left transition-all',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm',
              'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/30 font-medium',
              inputSize === 'sm' && 'h-9 px-3 text-xs',
              inputSize === 'md' && 'h-10 px-4 text-sm font-medium',
              inputSize === 'lg' && 'h-12 px-5 text-base font-medium',
              disabled && 'bg-slate-50 cursor-not-allowed opacity-50',
              error && 'border-rose-300 bg-rose-50',
              'flex items-center justify-between gap-2',
              triggerClassName
            )}
          >
            <span className={cn('flex-1 truncate', !selectedOption && 'text-slate-400 font-normal')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {value && !disabled && clearable && (
                <div onClick={handleClear} className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={14} />
                </div>
              )}
              <ChevronDown size={16} className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')} />
            </div>
          </button>
        )}

        {isOpen && dropdownRect && createPortal(
          <div
            ref={dropdownRef}
            data-marketing-select-dropdown
            className="fixed z-[99999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: dropdownRect.openUp ? 'auto' : dropdownRect.bottom + 4,
              bottom: dropdownRect.openUp ? window.innerHeight - dropdownRect.top + 4 : 'auto',
              left: dropdownRect.left,
              width: dropdownWidth === 'trigger' ? dropdownRect.width : dropdownWidth === 'auto' ? 'auto' : dropdownWidth,
              minWidth: dropdownWidth === 'trigger' ? dropdownRect.width : 100,
              maxHeight: '300px'
            }}
          >
            {searchable && !isCombobox && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            <div className="overflow-y-auto customize-scrollbar py-1 min-h-0">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-[10px] text-slate-300 text-center uppercase tracking-[0.2em] font-bold">
                  No results
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={getOptionKey ? getOptionKey(option, index) : option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-[calc(100%-8px)] mx-1 px-3 py-2 text-sm text-left transition-colors rounded-lg mb-0.5 flex items-center justify-between',
                      value == option.value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600',
                      option.disabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {value == option.value && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && (
        <p className="text-[11px] text-rose-500 font-medium ml-0.5 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
