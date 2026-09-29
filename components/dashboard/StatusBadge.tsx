import React from 'react';
import { cn } from '../../lib/utils';

export type StatusTone = 'pending' | 'success' | 'danger' | 'neutral' | 'info';

// Literal class strings (not built by concatenation) so Tailwind always sees them.
const TONE: Record<StatusTone, { pill: string; dot: string }> = {
  pending: { pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  success: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  danger: { pill: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  neutral: { pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  info: { pill: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
};

/**
 * Dashboard status pill. `pulse` adds a blinking dot — only for things that need attention right
 * now (e.g. overdue), not every pending item. (components/ui/Badge.tsx has no info tone or dot.)
 */
export const StatusBadge: React.FC<{ status: StatusTone; label: React.ReactNode; pulse?: boolean; className?: string; style?: React.CSSProperties }> = ({
  status, label, pulse, className, style,
}) => (
  <span
    className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 whitespace-nowrap', TONE[status].pill, className)}
    style={style}
  >
    {pulse && <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', TONE[status].dot)} />}
    {label}
  </span>
);
