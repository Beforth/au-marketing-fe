# 💎 AP | S&M Module - UI Components Library

This is the **Source of Truth** for the au-marketing-fe design system. It contains the full source code, design prompts, and configuration required for an AI to replicate this exact UI/UX from scratch.

---

## 🛠️ Global Setup & Requirements

Before implementing any component, ensure these packages are installed:
```bash
npm install framer-motion lucide-react @radix-ui/react-tooltip clsx tailwind-merge
```

### The `cn` Utility (`lib/utils.ts`)
All components rely on this for clean class merging:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 🎨 Universal Design Prompt (The "Vibe")
> "Create a high-density, professional ERP interface using the **Outfit** sans-serif font and a Slate/Indigo palette. Prioritize information visibility with compact layouts (8-10px padding). Use 'rounded-xl' for most containers and 'rounded-full' for pill/capsule elements. Typography must be crisp: Use 'font-black uppercase tracking-widest text-[11px]' for headers and labels. Interactive elements must have a scale-down effect on click (active:scale-[0.98]) and use 'spring' transitions for animations."

---

## 📋 DataTable (High-Density Grid)
**Prompt:** *Design a high-density, professional enterprise data table. It must handle infinite scrolling, have sticky headers with a slate-50 background, and support column sorting with visual chevron indicators. Use 'text-[11px] font-black uppercase' for headers and 'text-sm' for rows. Row selection should be clear with a hover background. Implement a subtle loading overlay that doesn't clear the data when refetching.*

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

---

## 🔘 SegmentToggle (The "Power" Component)
**Prompt:** *Create a segmented control with a 'sliding pill' indicator. When an option is selected, the white pill background should move smoothly using a spring transition. Text should be bold uppercase, and the whole component should look like a single integrated cylindric unit.*

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface SegmentOption<T> {
	label: string | React.ReactNode;
	icon?: LucideIcon;
	value: T;
}

interface SegmentToggleProps<T extends string | number> {
	options: SegmentOption<T>[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
	layoutId?: string;
}

export function SegmentToggle<T extends string | number>({
	options,
	value,
	onChange,
	className,
	layoutId = 'segment-toggle'
}: SegmentToggleProps<T>) {
	return (
		<div
			className={cn(
				'bg-slate-100/80 inline-flex items-center p-0 rounded-full border border-slate-200 shadow-sm relative min-w-[140px]',
				className
			)}
			role="radiogroup"
		>
			{options.map((option) => (
				<button
					key={String(option.value)}
					type="button"
					className={cn(
						'relative flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-full transition-all z-10 active:scale-[0.98]',
						value === option.value
							? 'text-indigo-700 font-bold'
							: 'text-slate-500 hover:text-slate-800',
					)}
					role="radio"
					aria-checked={value === option.value}
					onClick={() => onChange(option.value)}
				>
					{value === option.value && (
						<motion.div
							layoutId={layoutId}
							transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
							className="absolute inset-x-0 inset-y-[-1px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-slate-200 rounded-full"
						/>
					)}
					<span className="relative z-20 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
						{option.icon && <option.icon className="size-3.5" />}
						{option.label}
					</span>
				</button>
			))}
		</div>
	);
}
```

---

## 💊 Tooltip (Modern Labels)
**Prompt:** *Create an accessible tooltip using Radix UI. Design it with a 'Vercel-style' aesthetic: pure white background, subtle slate-200 border, and normal casing medium weight text (not uppercase). Use a shadow-lg and a sharp arrow pointer.*

```tsx
import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
}

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 200,
  className
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            'z-[100] px-3 py-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          <span className="text-xs font-medium text-slate-900 whitespace-nowrap leading-none block">
            {content}
          </span>
          <TooltipPrimitive.Arrow className="fill-white stroke-slate-200 stroke-1" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
```

---

## 🔍 SearchInput (Capsule Search)
**Prompt:** *Design a capsule-shaped (rounded-full) search input. It should have a fixed search icon on the left, an auto-appearing 'X' clear button on the right when text exists, and an indigo focus ring. Background should be white with a shadow-sm.*

```tsx
import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  containerClassName?: string;
  rightElement?: React.ReactNode;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(({
  onClear,
  containerClassName,
  className,
  value,
  rightElement,
  ...props
}, ref) => {
  return (
    <div className={cn('relative group/search flex items-center w-full max-w-md', containerClassName)}>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-600 transition-colors pointer-events-none z-10">
        <Search size={16} strokeWidth={2.5} />
      </div>
      
      <input
        ref={ref}
        type="text"
        value={value}
        className={cn(
          'w-full h-10 pl-11 pr-10 bg-white border border-slate-200 rounded-full outline-none transition-all shadow-sm',
          'placeholder:text-slate-400 text-sm font-medium',
          'focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:shadow-md',
          'hover:border-slate-300 hover:bg-slate-50/50',
          className
        )}
        {...props}
      />

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
```

---

## 🌊 WaveLoader (Localized Feedback)
**Prompt:** *Create a localized loader with 5 vertical bars that bounce up and down in a wave pattern (staggered delay). Use 'indigo-600' for the bars. Support an optional 'message' below the bars in bold uppercase tracked-widest typography.*

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function WaveLoader({ bars = 5, message, className }: { bars?: number; message?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 items-center justify-center py-4', className)}>
      <div className="flex gap-1.5 items-end justify-center h-8">
        {Array.from({ length: bars }).map((_, index) => (
          <motion.div
            key={index}
            className="w-1.5 rounded-full bg-indigo-600 shadow-sm"
            initial={{ height: 8 }}
            animate={{ height: [8, 24, 8] }}
            transition={{ duration: 1, repeat: Infinity, delay: index * 0.1, ease: "easeInOut" }}
          />
        ))}
      </div>
      {message && <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">{message}</div>}
    </div>
  );
}
```
