import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { KpiSparkline } from './KpiSparkline';

/**
 * Colour by MEANING, not to make the row look varied:
 * emerald = positive/active, amber = pending/waiting, rose = urgent/negative,
 * blue = neutral/primary, violet = secondary metric.
 */
export type KpiAccent = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';

// Literal class strings so Tailwind (CDN) always generates them.
const ACCENT: Record<KpiAccent, { box: string; hover: string; spark: string }> = {
  blue: { box: 'bg-blue-50 text-blue-600 border-blue-100', hover: 'hover:border-blue-300', spark: '#2563eb' },
  emerald: { box: 'bg-emerald-50 text-emerald-600 border-emerald-100', hover: 'hover:border-emerald-300', spark: '#059669' },
  amber: { box: 'bg-amber-50 text-amber-600 border-amber-100', hover: 'hover:border-amber-300', spark: '#d97706' },
  rose: { box: 'bg-rose-50 text-rose-600 border-rose-100', hover: 'hover:border-rose-300', spark: '#e11d48' },
  violet: { box: 'bg-violet-50 text-violet-600 border-violet-100', hover: 'hover:border-violet-300', spark: '#7c3aed' },
};

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: KpiAccent;
  /** % change vs previous period — renders a small up/down/neutral chip. */
  delta?: number | null;
  /** 6-point series rendered as a tiny sparkline. */
  sparkline?: number[];
  /** Optional element in the bottom-right (e.g. a mini won/lost donut) instead of the sparkline. */
  right?: React.ReactNode;
  /** Click-through target (route path). */
  linkTo?: string;
}

/** KPI card: label + big number on the left, accent icon box on the right, trend/sub-line underneath. */
export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label, value, subtitle, icon, accent = 'blue', delta, sparkline, right, linkTo,
}) => {
  const a = ACCENT[accent];
  const hasDelta = delta != null && !isNaN(delta);
  const deltaUp = hasDelta && delta! > 0;
  const deltaFlat = hasDelta && delta! === 0;
  const deltaText = hasDelta ? `${delta! > 0 ? '+' : ''}${Math.round(delta! * 10) / 10}%` : '';

  const body = (
    <div className="flex h-full items-stretch justify-between gap-3 p-4">
      <div className="min-w-0 flex flex-col">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums leading-tight">{value}</p>
        <div className="mt-auto pt-1.5 flex items-center gap-1.5 min-w-0">
          {hasDelta && (
            <span
              className={cn(
                'shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-1.5 py-0.5 border',
                deltaUp && 'text-emerald-600 bg-emerald-50 border-emerald-100',
                deltaFlat && 'text-slate-500 bg-slate-50 border-slate-100',
                !deltaUp && !deltaFlat && 'text-rose-600 bg-rose-50 border-rose-100'
              )}
              title="vs last month"
            >
              {deltaUp ? <ArrowUpRight size={11} /> : deltaFlat ? <Minus size={11} /> : <ArrowDownRight size={11} />}
              {deltaText}
            </span>
          )}
          {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end justify-between gap-1">
        {icon && (
          <div className={cn('h-10 w-10 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-110', a.box)}>
            {icon}
          </div>
        )}
        {right ? right : sparkline ? <KpiSparkline data={sparkline} stroke={a.spark} /> : null}
      </div>
    </div>
  );

  const cls = cn(
    'group block h-full rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200',
    linkTo && cn('hover:shadow-md hover:-translate-y-0.5', a.hover)
  );
  return linkTo ? <Link to={linkTo} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
};
