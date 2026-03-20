'use client';

import { Button } from './Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { cn } from '../../lib/utils';
import { getDay, getDaysInMonth, isSameDay } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, createContext, useContext, useState } from 'react';
import { create } from 'zustand';

export type CalendarState = {
  month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  year: number;
  setMonth: (month: CalendarState['month']) => void;
  setYear: (year: CalendarState['year']) => void;
};

export const useCalendar = create<CalendarState>()(
  (set) => ({
    month: new Date().getMonth() as CalendarState['month'],
    year: new Date().getFullYear(),
    setMonth: (month: CalendarState['month']) => set(() => ({ month })),
    setYear: (year: CalendarState['year']) => set(() => ({ year })),
  })
);

type CalendarContextProps = {
  locale: Intl.LocalesArgument;
  startDay: number;
};

const CalendarContext = createContext<CalendarContextProps>({
  locale: 'en-US',
  startDay: 0,
});

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string | number;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

type ComboboxProps = {
  value: string;
  setValue: (value: string) => void;
  data: {
    value: string;
    label: string;
  }[];
  labels: {
    button: string;
    empty: string;
    search: string;
  };
  className?: string;
};

export const monthsForLocale = (
  localeName: Intl.LocalesArgument,
  monthFormat: Intl.DateTimeFormatOptions['month'] = 'long'
) => {
  const format = new Intl.DateTimeFormat(localeName, { month: monthFormat })
    .format;

  return [...new Array(12).keys()].map((m) =>
    format(new Date(Date.UTC(2021, m % 12)))
  );
};

export const daysForLocale = (locale: Intl.LocalesArgument, startDay: number) => {
  const weekdays: string[] = [];
  const baseDate = new Date(2024, 0, startDay);

  for (let i = 0; i < 7; i++) {
    weekdays.push(
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(baseDate)
    );
    baseDate.setDate(baseDate.getDate() + 1);
  }

  return weekdays;
};

const Combobox = ({
  value,
  setValue,
  data,
  labels,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn('w-40 justify-between capitalize h-9 px-4 text-xs font-bold rounded-lg', className)}
        >
          {value
            ? data.find((item) => item.value === value)?.label
            : labels.button}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0 bg-white border border-slate-200">
        <Command
          filter={(value, search) => {
            const label = data.find((item) => item.value === value)?.label;

            return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                  className="capitalize"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type OutOfBoundsDayProps = {
  day: number;
};

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
  <div className="relative h-full w-full bg-slate-50/50 p-3 text-slate-300 text-xs font-medium">
    {day}
  </div>
);

export type CalendarBodyProps = {
  features: Feature[];
  children: (props: {
    feature: Feature;
  }) => ReactNode;
  onDateClick?: (date: Date) => void;
};

export const CalendarBody = ({ features, children, onDateClick }: CalendarBodyProps) => {
  const { month, year } = useCalendar();
  const { startDay } = useContext(CalendarContext);
  const safeYear = isNaN(year) ? new Date().getFullYear() : year;
  const safeMonth = isNaN(month) ? new Date().getMonth() : month;
  
  const daysInMonth = getDaysInMonth(new Date(safeYear, safeMonth, 1));
  const firstDay = (getDay(new Date(safeYear, safeMonth, 1)) - startDay + 7) % 7;
  const days: ReactNode[] = [];

  const prevMonth = safeMonth === 0 ? 11 : safeMonth - 1;
  const prevMonthYear = safeMonth === 0 ? safeYear - 1 : safeYear;
  const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1));
  const prevMonthDaysArray = Array.from(
    { length: prevMonthDays },
    (_, i) => i + 1
  );

  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDaysArray[prevMonthDays - firstDay + i];

    if (day) {
      days.push(<OutOfBoundsDay key={`prev-${i}`} day={day} />);
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const featuresForDay = features.filter((feature) => {
      return isSameDay(feature.endAt, new Date(safeYear, safeMonth, day));
    });

    days.push(
      <div
        key={day}
        onClick={() => onDateClick?.(new Date(safeYear, safeMonth, day))}
        className="relative flex h-full w-full flex-col gap-1.5 p-3 text-slate-900 text-xs cursor-pointer hover:bg-slate-50 transition-colors group/day"
      >
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 group-hover/day:text-indigo-600 transition-colors">{day}</span>
          <span className="opacity-0 group-hover/day:opacity-100 text-[9px] font-black uppercase tracking-widest text-indigo-500 transition-opacity whitespace-nowrap">
            Add plan +
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {featuresForDay.slice(0, 3).map((feature) => children({ feature }))}
        </div>
        {featuresForDay.length > 3 && (
          <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
            +{featuresForDay.length - 3} more
          </span>
        )}
      </div>
    );
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1));
  const nextMonthDaysArray = Array.from(
    { length: nextMonthDays },
    (_, i) => i + 1
  );

  const remainingDays = 7 - ((firstDay + daysInMonth) % 7);
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      const day = nextMonthDaysArray[i];

      if (day) {
        days.push(<OutOfBoundsDay key={`next-${i}`} day={day} />);
      }
    }
  }

  return (
    <div className="grid flex-grow grid-cols-7 border-l border-slate-200">
      {days.map((day, index) => (
        <div
          key={index}
          className={cn(
            'relative aspect-square overflow-hidden border-b border-r border-slate-200 transition-colors bg-white',
            // Highlight today?
            // isSameDay(new Date(), new Date(year, month, index - firstDay + 1)) && 'bg-indigo-50/10'
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarDatePickerProps = {
  className?: string;
  children: ReactNode;
};

export const CalendarDatePicker = ({
  className,
  children,
}: CalendarDatePickerProps) => (
  <div className={cn('flex items-center gap-2', className)}>{children}</div>
);

export type CalendarMonthPickerProps = {
  className?: string;
};

export const CalendarMonthPicker = ({
  className,
}: CalendarMonthPickerProps) => {
  const { month, setMonth } = useCalendar();
  const { locale } = useContext(CalendarContext);

  return (
    <Combobox
      className={className}
      value={month.toString()}
      setValue={(value) =>
        setMonth(Number.parseInt(value) as CalendarState['month'])
      }
      data={monthsForLocale(locale).map((month, index) => ({
        value: index.toString(),
        label: month,
      }))}
      labels={{
        button: 'Select month',
        empty: 'No month found',
        search: 'Search month',
      }}
    />
  );
};

export type CalendarYearPickerProps = {
  className?: string;
  start: number;
  end: number;
};

export const CalendarYearPicker = ({
  className,
  start,
  end,
}: CalendarYearPickerProps) => {
  const { year, setYear } = useCalendar();

  return (
    <Combobox
      className={className}
      value={year.toString()}
      setValue={(value) => setYear(Number.parseInt(value))}
      data={Array.from({ length: end - start + 1 }, (_, i) => ({
        value: (start + i).toString(),
        label: (start + i).toString(),
      }))}
      labels={{
        button: 'Select year',
        empty: 'No year found',
        search: 'Search year',
      }}
    />
  );
};

export type CalendarDatePaginationProps = {
  className?: string;
};

export const CalendarDatePagination = ({
  className,
}: CalendarDatePaginationProps) => {
  const { month, year, setMonth, setYear } = useCalendar();

  const handlePreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth((month - 1) as CalendarState['month']);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth((month + 1) as CalendarState['month']);
    }
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Button onClick={() => handlePreviousMonth()} variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
        <ChevronLeftIcon size={14} />
      </Button>
      <Button onClick={() => handleNextMonth()} variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100">
        <ChevronRightIcon size={14} />
      </Button>
    </div>
  );
};

export type CalendarDateProps = {
  children: ReactNode;
};

export const CalendarDate = ({ children }: CalendarDateProps) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/30">{children}</div>
);

export type CalendarHeaderProps = {
  className?: string;
};

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
  const { locale, startDay } = useContext(CalendarContext);

  return (
    <div className={cn('grid grid-cols-7 border-x border-slate-200 bg-slate-50/50', className)}>
      {daysForLocale(locale, startDay).map((day) => (
        <div key={day} className="px-3 py-2.5 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest border-r border-slate-200 last:border-r-0">
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarItemProps = {
  feature: Feature;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export const CalendarItem = ({ feature, className, onClick }: CalendarItemProps) => (
  <button
    type="button"
    onClick={(e) => onClick?.(e)}
    className={cn(
      'group flex items-center gap-2 w-full px-2 py-1 rounded border border-transparent hover:border-slate-200 bg-slate-50 hover:bg-white text-left transition-all duration-200 active:scale-[0.98]',
      className
    )}
    key={feature.id}
  >
    <div
      className="h-1.5 w-1.5 shrink-0 rounded-full shadow-sm"
      style={{
        backgroundColor: feature.status.color,
      }}
    />
    <span className="truncate text-[10px] font-semibold text-slate-600 group-hover:text-slate-900 tracking-tight">
      {feature.name}
    </span>
  </button>
);

export type CalendarProviderProps = {
  locale?: Intl.LocalesArgument;
  startDay?: number;
  children: ReactNode;
  className?: string;
};

export const CalendarProvider = ({
  locale = 'en-US',
  startDay = 0,
  children,
  className,
}: CalendarProviderProps) => (
  <CalendarContext.Provider value={{ locale, startDay }}>
    <div className={cn('relative flex flex-col rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  </CalendarContext.Provider>
);
