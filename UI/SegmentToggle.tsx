import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

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
  size?: 'sm' | 'md';
}

export function SegmentToggle<T extends string | number>({
  options,
  value,
  onChange,
  className,
  layoutId = 'segment-toggle',
  size = 'md'
}: SegmentToggleProps<T>) {
  return (
    <div
      className={cn(
        'bg-slate-100/80 inline-flex items-center p-0.5 rounded-xl border border-slate-200/60 shadow-sm relative',
        size === 'sm' ? 'min-w-[120px]' : 'min-w-[140px]',
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={cn(
            'relative flex-1 flex items-center justify-center gap-2 rounded-[10px] transition-all z-10 active:scale-[0.98]',
            size === 'sm' ? 'px-3 py-1.5' : 'px-5 py-2',
            value === option.value
              ? 'text-indigo-700'
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
              className="absolute inset-0 bg-white shadow-sm border border-slate-200/50 rounded-[10px]"
            />
          )}
          <span className="relative z-20 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap">
            {option.icon && <option.icon className={size === 'sm' ? 'size-3' : 'size-3.5'} />}
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
