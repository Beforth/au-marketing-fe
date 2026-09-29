import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, RotateCw, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { ListSkeleton } from './Skeleton';

/**
 * Dashboard card sizes by how often the card is used, not by what's in it:
 * big = worked FROM all day (full width), medium = clicked into sometimes (two per row),
 * small = glanceable (two per row). Fixed heights — the body scrolls, the card never grows.
 */
export type CardSize = 'big' | 'medium' | 'small';
export const CARD_HEIGHT: Record<CardSize, string> = { big: 'h-96', medium: 'h-80', small: 'h-64' }; // 384 / 320 / 256px

/** Card frame shared by every dashboard card: rounded-2xl, header (title/subtitle + extras), body fills the rest. */
export const CardShell: React.FC<{
  title: string;
  subtitle?: string;
  headerExtra?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, headerExtra, className, bodyClassName, children }) => (
  <div className={cn('h-full flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5', className)}>
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-900 truncate">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
      </div>
      {headerExtra && <div className="flex items-center gap-3 shrink-0">{headerExtra}</div>}
    </div>
    <div className={cn('flex-1 min-h-0', bodyClassName)}>{children}</div>
  </div>
);

export interface EmptyAction { label: string; to: string }

/** Centered icon-in-circle + message (+ optional next-step button), for any empty card body. */
export const EmptyState: React.FC<{ icon: React.ReactNode; message: string; action?: React.ReactNode; link?: EmptyAction }> = ({ icon, message, action, link }) => (
  <div className="h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
    <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">{icon}</div>
    <p className="text-sm text-slate-500">{message}</p>
    {link && (
      <Link to={link.to} className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
        {link.label} <ArrowRight size={12} />
      </Link>
    )}
    {action}
  </div>
);

interface ListCardProps {
  title: string;
  subtitle?: string;
  size: CardSize;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Right side of the header, e.g. a count or a filter. */
  headerExtra?: React.ReactNode;
  isEmpty: boolean;
  emptyIcon: React.ReactNode;
  emptyMessage: string;
  loading?: boolean;
  /** Next-step button in the empty state, e.g. { label: '+ Add a lead', to: '/leads/new' }. */
  emptyAction?: EmptyAction;
  /** Quiet line after the last row ("That's everything due") so a short list doesn't end in blank space. */
  endNote?: string;
  /** Shown instead of the list when loading failed; `onRetry` adds a "Try again" button. */
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ListCard: React.FC<ListCardProps> = ({
  title, subtitle, size, viewAllHref, viewAllLabel = 'View all', headerExtra,
  isEmpty, emptyIcon, emptyMessage, emptyAction, endNote, loading, error, onRetry, children, className,
}) => (
  <CardShell
    title={title}
    subtitle={subtitle}
    className={cn(CARD_HEIGHT[size], className)}
    bodyClassName="overflow-y-auto"
    headerExtra={(headerExtra || viewAllHref) ? (
      <>
        {headerExtra}
        {viewAllHref && (
          <Link to={viewAllHref} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            {viewAllLabel} <ArrowRight size={12} />
          </Link>
        )}
      </>
    ) : undefined}
  >
    {loading ? (
      <ListSkeleton rows={size === 'big' ? 5 : 4} />
    ) : error ? (
      <EmptyState
        icon={<AlertTriangle size={20} />}
        message={error}
        action={onRetry && (
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            <RotateCw size={12} /> Try again
          </button>
        )}
      />
    ) : isEmpty ? (
      <EmptyState icon={emptyIcon} message={emptyMessage} link={emptyAction} />
    ) : (
      <div className="p-4 space-y-2">
        {children}
        {endNote && (
          <p className="pt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 size={12} className="text-emerald-400" /> {endNote}
          </p>
        )}
      </div>
    )}
  </CardShell>
);

// Literal class strings so Tailwind (CDN) always generates them.
const AVATAR_TONE = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;
export type AvatarTone = keyof typeof AVATAR_TONE;

interface ListRowProps {
  /** Used for the initials (and the photo's alt text). */
  name: string;
  avatarUrl?: string | null;
  avatarTone?: AvatarTone;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right side: a StatusBadge, a value, or both. */
  trailing?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  /** Small icon buttons shown at the end of the row (outside the link, so they don't navigate). */
  actions?: React.ReactNode;
}

/** One row inside a ListCard: avatar (photo → initials fallback), title, sub-line, trailing badge, optional actions. */
export const ListRow: React.FC<ListRowProps> = ({ name, avatarUrl, avatarTone = 'blue', title, subtitle, trailing, to, onClick, actions }) => {
  const body = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        {/* components/ui/Avatar: photo when it loads, initials otherwise (a broken photo falls back silently) */}
        <Avatar
          src={avatarUrl}
          name={name}
          className={cn('h-9 w-9 rounded-full text-xs border', AVATAR_TONE[avatarTone])}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{title}</p>
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      {trailing && <div className="flex items-center gap-2 shrink-0">{trailing}</div>}
    </>
  );
  const cls = 'group flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 transition-all hover:bg-blue-50/40 hover:border-blue-100 hover:shadow-sm';
  if (actions) {
    const inner = 'group flex-1 min-w-0 flex items-center justify-between gap-3';
    return (
      <div className={cls}>
        {to ? <Link to={to} className={inner}>{body}</Link> : <div className={inner}>{body}</div>}
        <div className="flex items-center gap-0.5 shrink-0 border-l border-slate-200/70 pl-2">{actions}</div>
      </div>
    );
  }
  if (to) return <Link to={to} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cn(cls, 'w-full text-left')}>{body}</button>;
  return <div className={cls}>{body}</div>;
};

/** Icon button for ListRow `actions`. */
export const RowAction: React.FC<{ label: string; onClick: () => void; children: React.ReactNode; tone?: 'blue' | 'emerald' }> = ({ label, onClick, children, tone = 'blue' }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={cn(
      'h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-400 transition-colors',
      tone === 'emerald' ? 'hover:bg-emerald-50 hover:text-emerald-600' : 'hover:bg-blue-50 hover:text-blue-600'
    )}
  >
    {children}
  </button>
);
