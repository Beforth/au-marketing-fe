/**
 * Copied from befui (https://befui.vercel.app/#/components/half-donut-chart); its theme colours are swapped for this app's
 * Tailwind palette and the scroll hook lives in hooks/useChartIn.ts.
 */
import * as React from 'react';
import { cn } from '../../lib/utils';
import { useChartIn } from '../../hooks/useChartIn';

export interface HalfDonutSegment {
  label: string;
  value: number;
  /** Any text color class. Defaults cycle through blue, emerald, amber, sky. */
  color?: string;
}

const palette = ['text-blue-600', 'text-emerald-500', 'text-amber-500', 'text-sky-500'];

/**
 * Half donut: a semicircle split into parts, with the total or a headline number under the arch (budget used, seats by party, storage by type).
 * Takes half the height of a donut, so it fits a dashboard card. Segments sweep across on scroll; hover one to read it in the middle.
 * Pass `max` to leave the rest of the arch empty (used 62 of 100).
 */
export function HalfDonutChart({ data, max, size = 260, thickness = 22, center, format = (n) => n.toLocaleString('en-IN'), className }: { data: HalfDonutSegment[]; max?: number; size?: number; thickness?: number; center?: React.ReactNode; format?: (n: number) => string; className?: string }) {
  const [ref, on] = useChartIn<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);
  const sum = data.reduce((s, d) => s + d.value, 0);
  const whole = max ?? (sum || 1);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const d = `M${thickness / 2},${cx} A${r},${r} 0 0 1 ${size - thickness / 2},${cx}`;
  let acc = 0;
  const h = hover === null ? null : data[hover]!;

  return (
    <div ref={ref} className={cn('grid justify-items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size / 2 + thickness / 2 + 4 }}>
        <svg width={size} height={size / 2 + thickness / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + thickness / 2 + 4}`} role="img" aria-label={data.map((x) => `${x.label} ${x.value}`).join(', ')} onMouseLeave={() => setHover(null)}>
          <path d={d} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth={thickness} strokeLinecap="round" className="text-slate-900" />
          {data.map((s, i) => {
            const frac = Math.min(s.value / whole, 1);
            const start = acc;
            acc += frac;
            return (
              <path key={s.label} d={d} pathLength={100} fill="none" stroke="currentColor" strokeWidth={hover === i ? thickness + 4 : thickness} strokeLinecap="butt" className={cn(s.color ?? palette[i % palette.length], 'cursor-pointer')} strokeDasharray={`${on ? Math.max(frac * 100 - 0.8, 0) : 0} 100`} strokeDashoffset={-start * 100} onMouseEnter={() => setHover(i)} style={{ opacity: hover !== null && hover !== i ? 0.4 : 1, transition: `stroke-dasharray 1000ms cubic-bezier(0.22,1,0.36,1) ${i * 140}ms, stroke-width 200ms, opacity 200ms` }} />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 grid justify-items-center text-center">
          {h ? (<><span className="text-2xl font-semibold tabular-nums">{format(h.value)}</span><span className="text-xs text-slate-500">{h.label}</span></>) : (center ?? (<><span className="text-2xl font-semibold tabular-nums">{format(sum)}</span><span className="text-xs text-slate-500">{max ? `of ${format(max)}` : 'Total'}</span></>))}
        </div>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {data.map((s, i) => <li key={s.label} className="flex items-center gap-1.5" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}><span className={cn('size-2 rounded-full bg-current', s.color ?? palette[i % palette.length])} />{s.label}</li>)}
      </ul>
    </div>
  );
}
