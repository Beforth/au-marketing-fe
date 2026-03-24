# 💎 AP | S&M Module - UI Components Library

This is the **Source of Truth** for the au-marketing-fe design system. Each component must be replicated 1:1 using the **Design Prompt** and the **Full Source Code** provided.

---

## 🛠️ Global Design System Architecture

### Universal Design Prompt (The Core DNA)
> "Build a high-density, professional ERP interface using the **Outfit** font and a Slate/Indigo palette. Elements use `rounded-xl` (12px) for containers and `rounded-full` for pills. Typography uses `font-black uppercase tracking-widest text-[11px]` for labels and headers. All interactive elements must exhibit a subtle scale-down effect on click (`active:scale-[0.98]`) and use `spring` transitions (300ms, bounce 0). Layouts focus on maximum data density with tight 8-10px padding and `slate-200/60` borders."

---

## 🔘 Core Atoms

### 1. Button
**Design Prompt:**
> "Create a premium industrial button. Variants: `primary` (Indigo-600 bg, white text), `secondary` (Slate-900 bg), `outline` (white bg, Slate-200 border), `ghost` (Slate-500 text, Indigo hover), `danger` (Rose-600). Sizes: `sm` (36px), `md` (40px), `lg` (48px). All buttons must scale down to `0.98` on click and use a `200ms` spring."

**Source Code (`UI/Button.tsx`):**
```tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'xxs';
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
      ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:scale-[0.98]',
      link: 'text-indigo-600 hover:underline font-semibold p-0 h-auto',
    };

    const sizes = {
      xxs: 'h-7 px-2 text-[9px] rounded-md font-bold uppercase tracking-wider',
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
          variants[variant as keyof typeof variants],
          sizes[size as keyof typeof sizes],
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
```

### 2. Badge
**Design Prompt:**
> "Design a status capsule. Rounded-full, high-contrast, `font-black text-[9px] uppercase tracking-[0.15em]`. Variants: `success` (Emerald-50/700), `warning` (Amber-50/700), `danger` (Rose-50/700), `info` (Indigo-50/700)."

**Source Code (`UI/Badge.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-900 text-white border-transparent',
    secondary: 'bg-slate-100 text-slate-900 border-transparent hover:bg-slate-200',
    outline: 'text-slate-900 border-slate-200 bg-transparent',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-widest text-[9px] font-black',
    warning: 'bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-widest text-[9px] font-black',
    danger: 'bg-rose-50 text-rose-700 border-rose-100 uppercase tracking-widest text-[9px] font-black',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-100 uppercase tracking-widest text-[9px] font-black',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2',
        variants[variant as keyof typeof variants],
        className
      )}
      {...props}
    />
  );
}
```

### 3. Card
**Design Prompt:**
> "Industrial minimalist container. `rounded-2xl`, `border-slate-200`, `bg-white`. Include a `hoverable` prop for `-translate-y-1` and shadow lift. Sub-components: `CardHeader` (p-6), `CardTitle` (font-black text-lg), `CardContent` (p-6 pt-0)."

**Source Code (`UI/Card.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  noPadding?: boolean;
  contentClassName?: string;
}

export function Card({ className, hoverable, noPadding, children, contentClassName, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-all duration-300 overflow-hidden',
        hoverable && 'hover:shadow-md hover:border-slate-300 hover:-translate-y-1',
        className
      )}
      {...props}
    >
      <div className={cn(!noPadding && 'p-6', contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-black leading-none uppercase tracking-tight text-slate-900', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-500 font-medium', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}
```

### 4. Separator
**Design Prompt:**
> "Clean 1px line (Slate-200) used to divide sections."

**Source Code (`UI/Separator.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className, orientation = 'horizontal', ...props }: SeparatorProps) {
  return (
    <div
      className={cn(
        'shrink-0 bg-slate-200',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
}
```

### 5. Skeleton
**Design Prompt:**
> "Pulsing slate-100 placeholder for loading states."

**Source Code (`UI/Skeleton.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-100', className)}
      {...props}
    />
  );
}
```

---

## ⌨️ Form Controls

### 1. Input & Textarea
**Design Prompt:**
> "Standard h-11 input. Border: `slate-200`. Focus: `indigo-500` border + `indigo-500/20` ring. Labels are `font-black text-[11px] uppercase tracking-widest text-slate-500`. Errors in `rose-500`."

**Source Code (`UI/Input.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[11px] uppercase font-black text-slate-500 ml-1 tracking-widest">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            error ? 'border-rose-500' : 'hover:border-slate-300',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && typeof error === 'string' && (
          <span className="text-[10px] font-bold text-rose-500 mt-0.5 ml-1 uppercase tracking-tight">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className="text-[10px] font-medium text-slate-400 mt-0.5 ml-1">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### 2. Checkbox
**Design Prompt:**
> "Custom checkbox with `Indigo-600` checked state and a scale-up checkmark animation."

**Source Code (`UI/Checkbox.tsx`):**
```tsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
            ref={ref}
            {...props}
          />
          <div className={cn(
            'h-5 w-5 rounded-md border-2 border-slate-200 bg-white transition-all duration-200 flex items-center justify-center',
            'peer-checked:bg-indigo-600 peer-checked:border-indigo-600',
            'peer-focus:ring-2 peer-focus:ring-indigo-500/20',
            'group-hover:border-slate-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}>
            <Check className="h-3.5 w-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-200" />
          </div>
        </div>
        {label && <span className="text-sm font-semibold text-slate-700 select-none">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
```

### 3. Radio
**Design Prompt:**
> "Round radio button with `Indigo-600` dot on selection."

**Source Code (`UI/Radio.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative flex items-center justify-center">
          <input
            type="radio"
            className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
            ref={ref}
            {...props}
          />
          <div className={cn(
            'h-5 w-5 rounded-full border-2 border-slate-200 bg-white transition-all duration-200 flex items-center justify-center',
            'peer-checked:border-indigo-600',
            'peer-focus:ring-2 peer-focus:ring-indigo-500/20',
            'group-hover:border-slate-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}>
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 scale-0 peer-checked:scale-100 transition-transform duration-200" />
          </div>
        </div>
        {label && <span className="text-sm font-semibold text-slate-700 select-none">{label}</span>}
      </label>
    );
  }
);

Radio.displayName = 'Radio';
```

### 4. Switch
**Design Prompt:**
> "Pill-style Switch with sliding white thumb."

**Source Code (`UI/Switch.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  size?: 'sm' | 'md';
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, size = 'md', ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
            ref={ref}
            {...props}
          />
          <div className={cn(
            'rounded-full bg-slate-200 transition-all duration-300 peer-checked:bg-indigo-600',
            size === 'sm' ? 'h-4 w-8' : 'h-6 w-11',
            className
          )}>
            <div className={cn(
              'absolute top-0.5 left-0.5 rounded-full bg-white transition-all duration-300 shadow-sm',
              size === 'sm' ? 'h-3 w-3 peer-checked:translate-x-4' : 'h-5 w-5 peer-checked:translate-x-5'
            )} />
          </div>
        </div>
        {label && <span className="text-sm font-semibold text-slate-700 select-none">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
```

### 5. Select
**Design Prompt:**
> "Industrial select dropdown. Minimalist border, high-density options."

**Source Code (`UI/Select.tsx`):**
```tsx
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-[11px] uppercase font-black text-slate-500 ml-1 tracking-widest">{label}</label>}
        <div className="relative">
          <select
            className={cn(
              'flex h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 transition-all duration-200',
              error ? 'border-rose-500' : 'hover:border-slate-300',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
        {error && <span className="text-[10px] font-bold text-rose-500 mt-0.5 ml-1 uppercase">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
```

---

## 📋 Industrial Grid Systems

### 1. Advanced DataTable
**Design Prompt:**
> "Sticky header grid with scrollable container and sorting indicators."

**Source Code (`components/ui/DataTable.tsx`):**
```tsx
import React, { useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  render?: (item: T, value: any) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
  dense?: boolean;
  resizable?: boolean;
  showVerticalLines?: boolean;
  hideHeader?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  getRowClassName,
  sortConfig,
  onSort,
  isLoading = false,
  dense = false,
  showVerticalLines = false,
  hideHeader = false,
  className,
}: DataTableProps<T>) {

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    onSort?.(key, direction);
  };

  return (
    <div className={cn("relative w-full overflow-auto customize-scrollbar border border-slate-200 rounded-xl bg-white", className)}>
      <table className={cn("w-full border-separate border-spacing-0 text-sm")}>
        {!hideHeader && (
          <thead className="sticky top-0 z-20">
            <tr>
              {columns.map((col, idx) => {
                const colKey = String(col.key);
                const isSortable = col.sortable !== false && !!onSort;
                const isLast = idx === columns.length - 1;

                return (
                  <th
                    key={colKey}
                    id={`th-${colKey}`}
                    className={cn(
                      'h-10 px-4 text-left font-semibold text-slate-600 bg-[#F8FAFC] border-b border-slate-200 transition-colors relative select-none uppercase tracking-wider text-[11px]',
                      isSortable && "cursor-pointer hover:bg-slate-100/80 hover:text-indigo-600",
                      col.align === 'center' && "text-center",
                      col.align === 'right' && "text-right",
                      idx === 0 && "pl-6",
                      showVerticalLines && !isLast && "border-r border-slate-200/50",
                      col.headerClassName
                    )}
                    style={{ width: col.width ? (typeof col.width === 'number' ? `${col.width}px` : col.width) : 'auto' }}
                    onClick={() => isSortable && handleSort(colKey)}
                  >
                    <div className={cn("flex items-center gap-1.5", col.align === 'center' && "justify-center", col.align === 'right' && "justify-end")}>
                      <span className="truncate">{col.label}</span>
                      {isSortable && (
                        <div className="flex flex-col text-slate-300">
                          <ChevronUp size={10} className={cn(sortConfig?.key === colKey && sortConfig.direction === 'asc' && "text-indigo-600")} />
                          <ChevronDown size={10} className={cn(sortConfig?.key === colKey && sortConfig.direction === 'desc' && "text-indigo-600")} />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 relative">
          {isLoading && data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center text-slate-400 uppercase tracking-widest text-xs font-bold opacity-30">
                No Data Found
              </td>
            </tr>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-30 flex items-center justify-center transition-all duration-300">
                  <div className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
              {data.map((item) => (
                <tr
                  key={String(rowKey(item))}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50" : "hover:bg-slate-50/30",
                    getRowClassName?.(item)
                  )}
                >
                  {columns.map((col, idx) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-2.5 text-slate-600 truncate transition-colors",
                        col.align === 'center' && "text-center",
                        col.align === 'right' && "text-right",
                        idx === 0 && "pl-6",
                        showVerticalLines && idx < columns.length - 1 && "border-r border-slate-100",
                        col.cellClassName
                      )}
                    >
                      {col.render
                        ? col.render(item, (item as any)[col.key])
                        : String((item as any)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

### 2. Pagination
**Design Prompt:**
> "Standard pagination controls with previous/next and ellipsis for overflow."

**Source Code (`UI/Pagination.tsx`):**
```tsx
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <nav className={cn('flex items-center justify-center gap-1.5 px-4 py-3', className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-9 w-9 p-0 rounded-lg"
      >
        <ChevronLeft size={16} />
      </Button>
      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <div className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal size={14} className="text-slate-400" />
              </div>
            ) : (
              <Button
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={cn(
                  'h-9 w-9 p-0 rounded-lg text-xs',
                  currentPage === page ? 'shadow-indigo-500/20' : 'text-slate-600'
                )}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-9 w-9 p-0 rounded-lg"
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
}
```

---

## 📈 Dashboard & Performance

### 1. StatCard
**Design Prompt:**
> "Metric card with icon, trend indicator, and large value."

**Source Code (`components/ui/StatCard.tsx`):**
```tsx
import React from 'react';
import { cn } from '../../lib/utils';

export interface StatItem {
  label: string;
  value: string | number;
  icon: any;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<{ stat: StatItem }> = ({ stat }) => (
  <div className="bg-white border border-slate-200/60 p-6 rounded-2xl group hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200/50 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="w-9 h-9 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center transition-all duration-300 border border-slate-100 group-hover:border-indigo-100">
        <stat.icon size={18} />
      </div>
      <div className={cn(
        'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
        stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 
        stat.trend === 'down' ? 'text-rose-600 bg-rose-50' : 
        'text-slate-500 bg-slate-50'
      )}>
        {stat.change}
      </div>
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
    <h3 className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight tracking-[-0.02em]">{stat.value}</h3>
  </div>
);
```

### 2. Charts Section
**Design Prompt:**
> "Comprehensive chart library using `recharts`."

**Source Code (`components/ui/ChartsSection.tsx`):**
```tsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CHART_DATA } from '../../constants';

const chartColors = {
  target: '#f1f5f9', // slate-100
  achieved: '#6366f1', // indigo-500
  won: '#10b981', // emerald-500
  lost: '#f43f5e', // rose-500
  total: '#94a3b8', // slate-400
  hot: '#f59e0b', // amber-500
  default: ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'],
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/40 backdrop-blur-md border border-white/20 p-2 rounded-xl shadow-sm min-w-0 pointer-events-none">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-[10px] text-slate-500 font-bold capitalize">{entry.name || entry.dataKey}</span>
            </div>
            <span className="text-[10px] font-black text-slate-800">
              {typeof entry.value === 'number' && entry.value < 1000 && entry.value % 1 !== 0 
                ? entry.value.toFixed(2) 
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ... (Rest of chart implementations: target/achieved, won/lost, lead status etc)
```

---

## 🗺️ Navigation

### 1. Sidebar
**Design Prompt:**
> "Fixed-width industrial sidebar. `w-60`, `bg-white`, `border-r`."

**Source Code (`components/ui/Sidebar.tsx`):**
```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { SIDEBAR_LINKS, SECONDARY_LINKS } from '../../constants';
import { NavItem } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { selectUserDisplayName, selectUserInitials, selectEmployee, selectUser, selectHasPermission } from '../../store/slices/authSlice';
import { Modal } from './Modal';

export const Sidebar: React.FC = () => {
  const [showChangelog, setShowChangelog] = useState(false);
  const userDisplayName = useAppSelector(selectUserDisplayName);
  const userInitials = useAppSelector(selectUserInitials);
  const employee = useAppSelector(selectEmployee);
  const user = useAppSelector(selectUser);
  const appVersion = 'v1.0.0';
  
  // (Filter logic omitted for brevity in prompt, but UI structure follows)
  
  return (
    <aside className="w-60 h-screen bg-white border-r border-slate-200/60 flex flex-col fixed left-0 top-0 z-30">
      <div className="p-5 flex flex-col h-full">
        <Link to="/" className="flex items-center gap-2.5 mb-7 px-2 hover:opacity-80 transition-all">
          <img src="/aureole-logo.png" alt="Aureole" className="w-10 h-10 rounded object-contain flex-shrink-0" />
          <span className="text-lg font-bold tracking-tight text-slate-900">S&M Hub</span>
        </Link>
        <nav className="space-y-0.5">
          {SIDEBAR_LINKS.map((item) => <SidebarItem key={item.title} item={item} />)}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-100">
          {/* Secondary links & Profile */}
        </div>
      </div>
    </aside>
  );
};

const SidebarItem: React.FC<{ item: NavItem }> = ({ item }) => {
  return (
    <NavLink
      to={item.href}
      className={({ isActive }) => `
        group flex items-center justify-between w-full rounded-lg text-[13px] transition-all duration-200 font-medium px-3 py-2
        ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
      `}
    >
      <div className="flex items-center gap-3">
        <item.icon size={18} className="text-slate-400 group-hover:text-slate-600" />
        <span>{item.title}</span>
      </div>
    </NavLink>
  );
};
```

### 2. Tabs
**Design Prompt:**
> "Underline or pill-style tabs."

**Source Code (`UI/Tabs.tsx`):**
```tsx
import React from 'react';
import { cn } from '../lib/utils';

export function Tabs({ value, onValueChange, children, className }: any) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className, value, onValueChange }: any) {
  return (
    <div className={cn('inline-flex h-12 items-center justify-center rounded-xl bg-slate-100/50 p-1.5 text-slate-500', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const element = child as React.ReactElement<any>;
          return React.cloneElement(element, {
            active: element.props.value === value,
            onClick: () => onValueChange(element.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ children, className, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-black transition-all duration-200 uppercase tracking-widest',
        active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900',
        className
      )}
    >
      {children}
    </button>
  );
}
```

---

## 🔔 Overlays & Feedback

### 1. Modal
**Design Prompt:**
> "Industrial modal with backdrop blur."

**Source Code (`UI/Modal.tsx`):**
```tsx
import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'max';
}

export function Modal({ isOpen, onClose, title, children, footer, className, contentClassName, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw]',
    max: 'max-w-[1400px]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className={cn(
        'relative w-full flex flex-col bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden',
        sizes[size],
        className
      )}>
        <div className="flex items-center justify-between border-b border-slate-100/80 px-8 py-5 bg-slate-50/30">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100 h-9 w-9">
            <X size={18} strokeWidth={2.5} />
          </Button>
        </div>
        <div className={cn('px-8 py-6 overflow-y-auto customize-scrollbar max-h-[80vh]', contentClassName)}>
          {children}
        </div>
        {footer && <div className="border-t border-slate-100 flex justify-end gap-3 px-8 py-5 bg-slate-50/30">{footer}</div>}
      </div>
    </div>
  );
}
```

### 2. Toast
**Design Prompt:**
> "Floating glass notification widget."

**Source Code (`components/ui/Toast.tsx`):**
```tsx
import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <XCircle className="text-rose-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
    warning: <AlertCircle className="text-amber-500" size={18} />,
  };

  return (
    <div className={cn(
      'fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border bg-white/80 backdrop-blur-md shadow-lg animate-in slide-in-from-right-10 duration-300 max-w-sm',
      type === 'success' && 'border-emerald-100',
      type === 'error' && 'border-rose-100',
      type === 'info' && 'border-blue-100',
      type === 'warning' && 'border-amber-100'
    )}>
      {icons[type]}
      <span className="text-sm font-semibold text-slate-800">{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};
```

### 3. Tooltip
**Design Prompt:**
> "Micro-tooltip for icon actions."

**Source Code (`UI/Tooltip.tsx`):**
```tsx
import React, { useState } from 'react';
import { cn } from '../lib/utils';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className={cn(
          'absolute z-[100] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 rounded-lg shadow-xl whitespace-nowrap animate-in zoom-in-95 duration-200',
          positions[position],
          className
        )}>
          {content}
          <div className={cn(
            'absolute border-4 border-transparent',
            position === 'top' && 'border-t-slate-900 top-full left-1/2 -translate-x-1/2',
            position === 'bottom' && 'border-b-slate-900 bottom-full left-1/2 -translate-x-1/2',
            position === 'left' && 'border-l-slate-900 left-full top-1/2 -translate-y-1/2',
            position === 'right' && 'border-r-slate-900 right-full top-1/2 -translate-y-1/2'
          )} />
        </div>
      )}
    </div>
  );
}
```

---

## 🏗️ High-Density Modules

### 1. Kanban Board
**Design Prompt:**
> "Draggable card system for lead/order management."

**Key Logic:**
```tsx
// Vertical Column Component
export const KanbanColumn = ({ status, items, onDrop }) => (
  <div className="flex-1 flex flex-col min-w-[300px] h-full bg-slate-50/50 rounded-2xl border border-slate-100 p-3">
    <div className="flex items-center justify-between mb-4 px-1">
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">{status.label}</h4>
      <Badge variant="secondary">{items.length}</Badge>
    </div>
    <div className="flex-1 overflow-y-auto space-y-3" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, status.id)}>
      {items.map(item => <KanbanCard key={item.id} item={item} />)}
    </div>
  </div>
);

// Draggable Card Component
export const KanbanCard = ({ item }) => (
  <div draggable onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(item))} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 transition-all cursor-grab active:cursor-grabbing">
    {/* Card Content (Title, Meta, Status Dot) */}
  </div>
);
```

### 2. High-Density Industrial Calendar
**Design Prompt:**
> "Full ERP Calendar with Zustad state management."

**Source Code (`components/ui/calendar.tsx`):**
```tsx
'use client';
import { Button } from './Button';
import { cn } from '../../lib/utils';
import { getDay, getDaysInMonth, isSameDay } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, createContext, useContext, useState } from 'react';
import { create } from 'zustand';

// Full State & Context...
// Full Body Implementation... (Refer to codebase for all 460 lines)
export const CalendarBody = ({ features, children, onDateClick }: CalendarBodyProps) => {
  const { month, year } = useCalendar();
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const firstDay = (getDay(new Date(year, month, 1)) - 0 + 7) % 7;
  
  return (
    <div className="grid flex-grow grid-cols-7 border-l border-slate-200">
      {/* 42 cells (6 rows) implementation */}
    </div>
  );
};
```

---

_Built with ❤️ — AP | S&M Module Source of Truth_
