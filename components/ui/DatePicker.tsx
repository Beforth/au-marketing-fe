import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  required?: boolean;
  disabled?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
  showTime?: boolean;
  showNow?: boolean;
  /** When `showTime` is true: place hour/minute controls beside the calendar instead of below it. */
  timePanelPosition?: 'bottom' | 'right';
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
  inputSize = 'md',
  showTime = false,
  showNow = false,
  timePanelPosition = 'bottom',
}) => {
  const timeOnRight = showTime && timePanelPosition === 'right';
  const [isOpen, setIsOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Time state
  const initialDate = value ? new Date(value) : new Date();
  const [hours, setHours] = useState(initialDate.getHours());
  const [minutes, setMinutes] = useState(initialDate.getMinutes());

  useEffect(() => {
    if (value && showTime) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setHours(d.getHours());
        setMinutes(d.getMinutes());
      }
    }
  }, [value, showTime]);

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
    const dropdownHeight = showTime && timePanelPosition === 'bottom' ? 440 : showTime && timeOnRight ? 380 : 340;
    const openUp = spaceBelow < dropdownHeight && rect.top > spaceBelow;
    const minWidth = timeOnRight ? 380 : 300;
    const maxWidth = timeOnRight ? 420 : 360;
    const targetWidth = Math.min(Math.max(rect.width, minWidth), maxWidth);

    setDropdownRect({
      top: openUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: targetWidth,
      openUp,
    });
  }, [isOpen, showTime, timeOnRight]);

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
    const d = new Date(date);
    if (showTime) {
      d.setHours(hours);
      d.setMinutes(minutes);
      updateValue(d);
    } else {
      updateValue(d);
      setIsOpen(false);
    }
  };

  const handleTimeChange = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
    const baseDate = selectedDate || new Date();
    const newDate = new Date(baseDate);
    newDate.setHours(h);
    newDate.setMinutes(m);
    updateValue(newDate);
  };

  const updateValue = (date: Date) => {
    if (showTime) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    } else {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    }
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
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ date: new Date(year, month - 1, daysInPrevMonth - i), currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ date: new Date(year, month, i), currentMonth: true });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ date: new Date(year, month + 1, i), currentMonth: false });
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
            <span className={cn('truncate', !value && 'text-slate-400')}>
              {value ? new Date(value).toLocaleString(undefined, showTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }) : placeholder}
            </span>
          </div>
          {value && !disabled && (
            <div onClick={handleClear} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors" title="Clear">
              <X size={14} />
            </div>
          )}
        </button>

        {isOpen && dropdownRect && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl p-4 shadow-indigo-100/20 animate-spring-in"
            style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
          >
            <div className={cn(timeOnRight && !isYearPickerOpen && 'flex flex-row gap-3 items-stretch')}>
              <div className={cn(timeOnRight && !isYearPickerOpen && 'min-w-0 flex-1')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col gap-0.5 pointer-events-auto">
                    <span className="text-sm font-bold text-slate-900 leading-none">{MONTHS[month]}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsYearPickerOpen(!isYearPickerOpen); }} className={cn("text-xs flex items-center gap-1 mt-0.5 transition-colors font-medium rounded px-1 -ml-1", isYearPickerOpen ? "bg-[var(--primary)] text-white" : "text-slate-500 hover:text-[var(--primary)] hover:bg-[var(--primary-muted)]")}>
                      {year} <ChevronDown size={12} className={cn("transition-transform", isYearPickerOpen && "rotate-180")} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={18} /></button>
                    <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronRight size={18} /></button>
                  </div>
                </div>

                {isYearPickerOpen ? (
                  <div className="grid grid-cols-4 gap-2 h-[230px] overflow-y-auto pr-1 customize-scrollbar">
                    {Array.from({ length: 41 }, (_, i) => today.getFullYear() - 20 + i).map(y => (
                      <button key={y} type="button" onClick={() => handleYearChange(y)} className={cn("py-2 text-sm rounded-lg transition-all", y === year ? "bg-[var(--primary)] text-white font-bold shadow-md shadow-[var(--primary)]/20" : "text-slate-600 hover:bg-[var(--primary-muted)] hover:text-[var(--primary)]")}>
                        {y}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 mb-1">
                      {DAYS.map(day => <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-px">
                      {calendarDays.map((day, idx) => {
                        const selected = isSelected(day.date);
                        const current = isToday(day.date);
                        return (
                          <button key={idx} type="button" onClick={() => handleSelectDate(day.date)} className={cn('aspect-square flex items-center justify-center text-sm rounded-lg transition-all relative', !day.currentMonth && 'text-slate-300', day.currentMonth && !selected && 'text-slate-700 hover:bg-[var(--primary-muted)] hover:text-[var(--primary)]', selected && 'bg-[var(--primary)] text-white font-bold shadow-md shadow-[var(--primary)]/20', current && !selected && 'text-[var(--primary)] font-bold')}>
                            {day.date.getDate()}
                            {current && !selected && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {showTime && !isYearPickerOpen && timeOnRight && (
                <div className="shrink-0 w-[104px] border-l border-slate-100 pl-3 flex flex-col justify-center pt-0.5 pb-1">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Time</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <select className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 text-xs px-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400" value={hours} onChange={(e) => handleTimeChange(Number(e.target.value), minutes)} aria-label="Hour">
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                    </select>
                    <select className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 text-xs px-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400" value={minutes} onChange={(e) => handleTimeChange(hours, Number(e.target.value))} aria-label="Minute">
                      {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {showTime && !isYearPickerOpen && !timeOnRight && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Set Time</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <select className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 text-xs px-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400" value={hours} onChange={(e) => handleTimeChange(Number(e.target.value), minutes)}>
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                    </select>
                  </div>
                  <span className="text-slate-300 font-bold">:</span>
                  <div className="flex-1">
                    <select className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 text-xs px-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400" value={minutes} onChange={(e) => handleTimeChange(hours, Number(e.target.value))}>
                      {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => handleSelectDate(today)} className="text-xs font-semibold text-[var(--primary)] hover:underline">Today</button>
                {showTime && showNow && <button type="button" onClick={() => updateValue(new Date())} className="text-xs font-semibold text-emerald-600 hover:underline">Now</button>}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleClear} className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors">Clear</button>
                {showTime && <button type="button" onClick={() => setIsOpen(false)} className="text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-black transition-colors">Done</button>}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
