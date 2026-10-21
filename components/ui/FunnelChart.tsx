import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FunnelStage {
  label: string;
  value: number;
  /** Bar colour (any CSS colour). Defaults to blue. */
  color?: string;
  /** Small text on the right, e.g. the share of all leads. */
  note?: string;
}

/**
 * Funnel-style chart: one centred bar per stage, width relative to the largest stage, label on the left and a note on the right.
 * Adapted from befui's Funnel chart (https://befui.vercel.app/#/components/funnel-chart): bars are sized against the
 * largest stage (not the first) and coloured per stage, because the stages here are "leads currently in this stage"
 * counts, which do not always shrink step by step.
 */
export function FunnelChart({ stages, format = (n) => n.toLocaleString('en-IN'), className }: { stages: FunnelStage[]; format?: (n: number) => string; className?: string }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <ol className={cn('grid w-full gap-1.5', className)}>
      {stages.map((s) => (
        <li key={s.label} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-[13px]">
          <span className="truncate text-slate-700" title={s.label}>{s.label}</span>
          <div className="flex justify-center">
            <div
              style={{ width: `${Math.max(10, (s.value / max) * 100)}%`, backgroundColor: s.color || '#2563eb' }}
              className="flex h-8 items-center justify-center rounded-md text-xs font-semibold tabular-nums text-white transition-[width] duration-500"
            >
              {format(s.value)}
            </div>
          </div>
          <span className="text-right text-xs tabular-nums text-slate-400">{s.note ?? ''}</span>
        </li>
      ))}
    </ol>
  );
}
