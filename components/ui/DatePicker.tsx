import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  required?: boolean;
  disabled?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  className,
  label,
  icon,
  showIcon = true,
  required,
  disabled,
  inputSize = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse value string to Date object for local display logic
  const selectedDate = value ? new Date(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) {
      setDropdownRect(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 340; // Approx height of calendar
    const openUp = spaceBelow < dropdownHeight && rect.top > spaceBelow;
    
    setDropdownRect({
      top: openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280),
      openUp,
    });
  }, [isOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const path = event.composedPath();
      if (containerRef.current && path.includes(containerRef.current)) return;
      if (dropdownRef.current && path.includes(dropdownRef.current)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
    }
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && value) {
      setViewDate(new Date(value));
    } else if (!isOpen) {
      setViewDate(new Date());
    }
    setIsOpen(!isOpen);
    setIsYearPickerOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  };

  const handleYearChange = (year: number) => {
    const d = new Date(viewDate);
    d.setFullYear(year);
    setViewDate(d);
    setIsYearPickerOpen(false);
  };

  const handleSelectDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setIsOpen(false);
  };

  // Calendar logic
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  
  // Prev month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      currentMonth: false
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      currentMonth: true
    });
  }
  
  // Next month days to fill 6 rows if needed (42 cells)
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      currentMonth: false
    });
  }

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getFullYear() === selectedDate.getFullYear() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getDate() === selectedDate.getDate();
  };

  const isToday = (date: Date) => {
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 ml-0.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'w-full border rounded-lg text-left transition-all',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]',
            'bg-white border-slate-300',
            inputSize === 'sm' && 'h-9 px-3 text-xs',
            inputSize === 'md' && 'h-10 px-4 text-sm font-medium',
            inputSize === 'lg' && 'h-12 px-5 text-base font-medium',
            disabled && 'bg-slate-50 cursor-not-allowed opacity-50',
            'flex items-center justify-between gap-2 group'
          )}
        >
          <div className="flex items-center gap-2 flex-1 truncate">
            {showIcon && (
              icon ? (
                <div className="text-slate-400 group-hover:text-[var(--primary)] transition-colors">
                  {icon}
                </div>
              ) : (
                <CalendarIcon size={16} className="text-slate-400 group-hover:text-[var(--primary)] transition-colors" />
              )
            )}
            <span className={cn(
              'truncate',
              !value && 'text-slate-400'
            )}>
              {value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {value && !disabled && (
              <div
                onClick={handleClear}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                title="Clear date"
              >
                <X size={14} />
              </div>
            )}
          </div>
        </button>

        {isOpen && dropdownRect && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl p-3 shadow-indigo-100/20 animate-spring-in"
            style={{
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-0.5 pointer-events-auto">
                <span className="text-sm font-bold text-slate-900 leading-none">{MONTHS[month]}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsYearPickerOpen(!isYearPickerOpen);
                  }}
                  className={cn(
                    "text-xs flex items-center gap-1 mt-0.5 transition-colors font-medium rounded px-1 -ml-1",
                    isYearPickerOpen ? "bg-[var(--primary)] text-white" : "text-slate-500 hover:text-[var(--primary)] hover:bg-[var(--primary-muted)]"
                  )}
                >
                  {year}
                  <ChevronDown size={12} className={cn("transition-transform", isYearPickerOpen && "rotate-180")} />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {isYearPickerOpen ? (
              <div className="grid grid-cols-4 gap-2 h-[230px] overflow-y-auto pr-1 customize-scrollbar">
                {Array.from({ length: 41 }, (_, i) => today.getFullYear() - 20 + i).map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearChange(y)}
                    className={cn(
                      "py-2 text-sm rounded-lg transition-all",
                      y === year 
                        ? "bg-[var(--primary)] text-white font-bold shadow-md shadow-[var(--primary)]/20" 
                        : "text-slate-600 hover:bg-[var(--primary-muted)] hover:text-[var(--primary)]"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Days of Week */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px">
                  {calendarDays.map((day, idx) => {
                    const selected = isSelected(day.date);
                    const current = isToday(day.date);
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDate(day.date)}
                        className={cn(
                          'aspect-square flex items-center justify-center text-sm rounded-lg transition-all relative',
                          !day.currentMonth && 'text-slate-300',
                          day.currentMonth && !selected && 'text-slate-700 hover:bg-[var(--primary-muted)] hover:text-[var(--primary)]',
                          selected && 'bg-[var(--primary)] text-white font-bold shadow-md shadow-[var(--primary)]/20',
                          current && !selected && 'text-[var(--primary)] font-bold'
                        )}
                      >
                        {day.date.getDate()}
                        {current && !selected && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Calendar Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelectDate(today)}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
