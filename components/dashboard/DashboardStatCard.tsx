import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { KpiSparkline } from './KpiSparkline';

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentClassName?: string;
  /** % change vs previous period — renders a small up/down/neutral chip. */
  delta?: number | null;
  /** 6-point series rendered as a tiny sparkline under the value. */
  sparkline?: number[];
  /** Optional right-side element (e.g. a mini won/lost donut) in place of the delta chip. */
  right?: React.ReactNode;
  /** Click-through target (route path). */
  linkTo?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accentClassName,
  delta,
  sparkline,
  right,
  linkTo,
}) => {
  const hasDelta = delta != null && !isNaN(delta);
  const deltaUp = hasDelta && delta! > 0;
  const deltaFlat = hasDelta && delta! === 0;
  const deltaText = hasDelta ? `${delta! > 0 ? '+' : ''}${Math.round(delta! * 10) / 10}%` : '';

  const body = (
    <div className="flex items-center gap-3 p-4">
      {icon && (
        <div className={cn('shrink-0 w-9 h-9 rounded-xl flex items-center justify-center', accentClassName || 'bg-blue-50 text-blue-600')}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 min-h-5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</p>
          {hasDelta ? (
            <span
              className={cn(
                'shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-1.5 py-0.5 border',
                deltaUp && 'text-emerald-600 bg-emerald-50 border-emerald-100',
                deltaFlat && 'text-slate-500 bg-slate-50 border-slate-100',
                !deltaUp && !deltaFlat && 'text-rose-600 bg-rose-50 border-rose-100'
              )}
            >
              {deltaUp ? <ArrowUpRight size={11} /> : deltaFlat ? <Minus size={11} /> : <ArrowDownRight size={11} />}
              {deltaText}
            </span>
          ) : null}
        </div>
        <p className="text-[22px] font-bold text-slate-900 leading-tight mt-1 tabular-nums">{value}</p>
        <div className="flex items-center justify-between gap-2 h-6 mt-1">
          <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>
          {sparkline && <KpiSparkline data={sparkline} stroke="#2563eb" />}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
      {linkTo && (
        <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors" />
      )}
    </div>
  );

  return (
    <Card noPadding className="min-h-0 group/card">
      {linkTo ? (
        <Link to={linkTo} className="block h-full group">
          {body}
        </Link>
      ) : (
        body
      )}
    </Card>
  );
};
