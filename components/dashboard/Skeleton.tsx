import React from 'react';
import { cn } from '../../lib/utils';

/** Grey placeholder block with a light sweep (`.dash-shimmer` in index.html; still for reduced motion). */
export const Shimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('dash-shimmer rounded-md', className)} aria-hidden />
);

/** Placeholder rows shaped like ListRow (avatar, two lines, pill). */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="p-4 space-y-2" role="status" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
        <Shimmer className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Shimmer className="h-3 w-2/5" />
          <Shimmer className="h-2.5 w-3/5" />
        </div>
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

/** Placeholder shaped like a bar chart. */
export const ChartSkeleton: React.FC = () => (
  <div className="h-full flex items-end gap-3 px-6 pb-6 pt-8" role="status" aria-label="Loading">
    {[55, 80, 40, 65, 30, 70].map((h, i) => (
      <div key={i} className="flex-1 dash-shimmer rounded-t-md" style={{ height: `${h}%` }} />
    ))}
  </div>
);
