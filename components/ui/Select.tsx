/**
 * Searchable Select Component with Fuzzy Search
 * Dropdown is rendered in a portal so it is not clipped by parent overflow.
 */
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
  label?: string;
  error?: string;
}

// Simple fuzzy search function
const fuzzySearch = (query: string, text: string): boolean => {
  if (!query) return true;
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match
  if (textLower.includes(queryLower)) return true;
  
  // Fuzzy match - check if all characters in query appear in order in text
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
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
  label,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => fuzzySearch(searchQuery, opt.label))
    : options;

  // Position dropdown in portal (measure trigger so dropdown is not clipped by overflow)
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        selectRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setIsOpen(false);
      setSearchQuery('');
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    if (optionValue === value) {
      // Allow deselecting if clicking the same option
      onChange(undefined);
    } else {
      onChange(optionValue);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearchQuery('');
  };

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
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
            'w-full px-3 py-2 border rounded-lg text-sm text-left transition-all',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500',
            'bg-white border-slate-300',
            disabled && 'bg-slate-50 cursor-not-allowed opacity-50',
            error && 'border-rose-300 bg-rose-50',
            'flex items-center justify-between gap-2'
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
            className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              minWidth: 160,
            }}
          >
            {searchable && (
              <div className="p-2 border-b border-slate-200">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                      'flex items-center justify-between',
                      value === option.value && 'bg-indigo-50 text-indigo-700 font-medium',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                      'first:rounded-t-lg last:rounded-b-lg'
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <span className="text-indigo-600">✓</span>
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
