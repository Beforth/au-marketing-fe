/**
 * Copied from befui (https://befui.vercel.app/#/components/pace-chart); theme colours swapped for this app's Tailwind palette.
 */
import * as React from 'react';
import { cn } from '../../lib/utils';
import { useChartIn } from '../../hooks/useChartIn';

export interface PacePoint {
  /** Day of the month, 1 to `daysInMonth`. */
  day: number;
  /** Total so far on that day (cumulative, never the amount for that day). */
  value: number;
}

const W = 560, H = 180, pad = { l: 8, r: 8, t: 22, b: 22 };

/**
 * Burn-up chart for a monthly target: the running total so far, a faint straight line for where you should be, a dashed projection to month end
 * at the current daily rate, and the target line. In this app the canvas is 560x180 and the chart is capped at 36rem wide so its labels stay readable in a half-width card. A chip says whether you are ahead of or behind pace. Pass cumulative `points`, not daily amounts.
 */
export function PaceChart({ points, target, daysInMonth, format = (n) => String(n), className }: { points: PacePoint[]; target: number; daysInMonth: number; format?: (n: number) => string; className?: string }) {
  const id = React.useId();
  const [ref, on] = useChartIn<SVGSVGElement>();
  const last = points[points.length - 1] ?? { day: 0, value: 0 };
  const projection = last.day ? (last.value / last.day) * daysInMonth : 0;
  const expected = (target * last.day) / daysInMonth;
  const gap = expected - last.value;
  const max = Math.max(target, projection, ...points.map((p) => p.value)) * 1.08 || 1;
  const x = (d: number) => pad.l + ((d - 1) / Math.max(daysInMonth - 1, 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

  return (
    <div className={cn('mx-auto w-full max-w-[36rem]', className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">Projected <span className="font-semibold text-slate-900 tabular-nums">{format(projection)}</span> of {format(target)}</p>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', gap > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>
          {gap > 0 ? `Behind pace by ${format(gap)}` : 'Ahead of pace'}
        </span>
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${format(last.value)} won by day ${last.day} of ${daysInMonth}, projected ${format(projection)} against a target of ${format(target)}`}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0.28" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} className="stroke-amber-500" strokeWidth="1.5" />
        <text x={pad.l} y={y(target) - 6} className="fill-amber-600 text-[10px] font-medium">Target {format(target)}</text>
        <line x1={x(1)} y1={y(0)} x2={x(daysInMonth)} y2={y(target)} className="stroke-slate-300" strokeWidth="1.5" />
        <g style={{ clipPath: on ? 'inset(-10% -10% -10% -10%)' : 'inset(-10% 100% -10% -10%)', transition: 'clip-path 1200ms cubic-bezier(0.22,1,0.36,1)' }} className="text-blue-600">
          {points.length > 0 && <path d={`${line} L${x(last.day)},${y(0)} L${x(points[0]!.day)},${y(0)} Z`} fill={`url(#${id})`} />}
          {last.day < daysInMonth && <line x1={x(last.day)} y1={y(last.value)} x2={x(daysInMonth)} y2={y(projection)} stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" opacity="0.7" />}
          <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(last.day)} cy={y(last.value)} r="4.5" fill="currentColor" className="stroke-white" strokeWidth="2" />
        </g>
        <text x={W - pad.r} y={Math.min(y(projection) + 14, H - pad.b - 2)} textAnchor="end" className="fill-slate-400 text-[10px]">{format(projection)}</text>
        <text x={pad.l} y={H - 4} className="fill-slate-400 text-[10px]">Day 1</text>
        <text x={W - pad.r} y={H - 4} textAnchor="end" className="fill-slate-400 text-[10px]">Day {daysInMonth}</text>
      </svg>
    </div>
  );
}
