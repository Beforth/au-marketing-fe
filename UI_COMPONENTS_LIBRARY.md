# 💎 AP | S&M Module - UI Components Library

This document contains the source code and design prompts for the key UI components used in the **au-marketing-fe** project. These components follow the **High-Density ERP** design system, prioritizing efficiency, visual excellence, and smooth animations.

### Dependencies Requirement:
- `framer-motion`, `lucide-react`, `zustand`, `date-fns`, `cmdk`, `@radix-ui/react-popover`, `@radix-ui/react-dialog`

---

## 📅 Premium Calendar System
**Prompt:** *Integrate a shadcn-compliant calendar with a year/month combobox and quick navigation. Ensure it supports custom items (features) with color-coded statuses.*

```tsx
// components/ui/calendar.tsx
// (Source includes: CalendarProvider, CalendarHeader, CalendarBody, CalendarItem, useCalendar zustand store)
```

---

## 🔍 Command & Pickers
**Design:** *Fuzzy-search enabled pickers for month/year selection. Built on cmdk and Radix UI Popover.*

```tsx
// components/ui/command.tsx
// components/ui/popover.tsx
```

---

## 🔘 SegmentToggle
**Prompt:** *Adapt a theme switcher pattern to create a premium "List / Review" toggle for a marketing module. Use high-density typography (font-black, uppercase) and a sliding background animation with spring easing.*

```tsx
// components/ui/SegmentToggle.tsx
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
				'bg-slate-100 inline-flex items-center p-1 rounded-lg border border-slate-200 shadow-sm relative min-w-[140px]',
				className
			)}
			role="radiogroup"
		>
			{options.map((option) => (
				<button
					key={String(option.value)}
					className={cn(
						'relative flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all z-10 active:scale-[0.98]',
						value === option.value
							? 'text-indigo-600'
							: 'text-slate-500 hover:text-slate-800',
					)}
					role="radio"
					aria-checked={value === option.value}
					onClick={() => onChange(option.value)}
				>
					{value === option.value && (
						<motion.div
							layoutId={layoutId}
							transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
							className="absolute inset-0 bg-white shadow-sm border border-slate-200/50 rounded-md"
						/>
					)}
					<span className="relative z-20 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
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

## 🌊 WaveLoader
**Prompt:** *Create a bouncing bar loader (5 dots) that uses Framer Motion for height scaling. Theme it with Indigo-600 and add a pulsed message below.*

```tsx
// components/ui/WaveLoader.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface WaveLoaderProps {
  bars?: number;
  message?: string;
  className?: string;
  barClassName?: string;
}

export function WaveLoader({
  bars = 5,
  message,
  className,
  barClassName,
}: WaveLoaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 items-center justify-center py-4', className)}>
      <div className="flex gap-1.5 items-end justify-center h-8">
        {Array.from({ length: bars }).map((_, index) => (
          <motion.div
            key={index}
            className={cn('w-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200/50', barClassName)}
            initial={{ height: 8 }}
            animate={{ height: [8, 24, 8] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      {message && (
        <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
}
```

---

## 🌀 Loader (Spinner)
**Design:** *A standardized, high-performance circular spinner using Framer Motion for linear rotation. Supports primary, white, and slate variants.*

```tsx
// components/ui/Loader.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'primary' | 'white' | 'slate';
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  variant = 'primary',
  className 
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  const variantClasses = {
    primary: 'border-indigo-600/20 border-t-indigo-600',
    white: 'border-white/20 border-t-white',
    slate: 'border-slate-200 border-t-slate-500',
  };

  return (
    <div className={cn('flex items-center justify-center', className)} role="status">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'rounded-full border-solid',
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};
```

---

## 📅 Select (Extended)
**Features:** *Fuzzy search, Combobox mode support, loose comparison for pagination values, and standardized Slate/Indigo styling.*

```tsx
// components/ui/Select.tsx (Key logic for finding options)
const selectedOption = options.find(opt => opt.value == value); // Loose comparison for string/number match

// Combobox rendering logic
{isCombobox ? (
  <input
    ref={searchInputRef}
    value={isOpen ? searchQuery : (selectedOption?.label || '')}
    ...
  />
) : (
 ...
)}
```

---

## 🔘 Button
**Features:** *Multi-variant (ghost, primary, link, etc.), scale-down micro-interaction, and integrated loading state.*

```tsx
// components/ui/Button.tsx
export const Button: React.FC<ButtonProps> = ({ ... }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-indigo-500/20',
    outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    link: 'text-indigo-600 hover:underline font-semibold p-0 h-auto',
    ...
  };
  ...
}
```

---

## 📇 Card
**Features:** *Glassmorphism-ready (solid by default), draggable supports, group hover actions, and standardized internal padding.*

```tsx
// components/ui/Card.tsx
export const Card: React.FC<CardProps> = ({ ... }) => {
  return (
    <div className={cn(
      'bg-white border border-slate-200/50 transition-all duration-500 relative group/card flex flex-col min-h-[140px] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)]',
      onClick && 'cursor-pointer hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:border-indigo-200/50 hover:-translate-y-1',
      className
    )}>
      ...
    </div>
  );
}
```

---

## 📏 Pagination
**Features:** *Rows-per-page selector, "X of Y" total display, and disabled state handling for edge cases.*

```tsx
// components/ui/Pagination.tsx
<Select
  options={pageSizeOptions.map((n) => ({ value: n, label: String(n) }))}
  value={pageSize}
  onChange={(v) => v !== undefined && onPageSizeChange(Number(v))}
  clearable={false}
  searchable={false}
/>
```

---

## 🎨 Global Design Tokens (Tailwind)
**File:** `tailwind.config.js` or `index.html` root:
- **Primary**: `#4f46e5` (Indigo 600)
- **Background**: `#f8fafc` (Slate 50)
- **Border**: `#e2e8f0` (Slate 200)
- **Radius**: `1.25rem` (Card), `0.5rem` (Buttons)
- **Font**: Inter (Standardized weights: 400, 600, 700, 900)
