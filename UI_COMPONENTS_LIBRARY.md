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
