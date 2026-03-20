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
