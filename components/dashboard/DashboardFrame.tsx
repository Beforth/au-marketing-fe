import React from 'react';
import { Plus, ClipboardList, KanbanSquare, MapPin, ListTodo } from 'lucide-react';
import type { HeroAction } from './DashboardHero';
import { Rise } from './Rise';
import { cn } from '../../lib/utils';

/**
 * Bento grid for the role dashboards (pages/dashboards/*): one CSS grid — 1 column on phones,
 * 2 at md, 12 at lg, 16px gap — where cards of different widths interlock instead of stacking in
 * full-width rows:
 *   Row 1: hero (6) · stack of 2 KPIs (3) · stack of 2 KPIs (3)  — stacks stretch to the hero
 *   Row 2: main chart/list (6) · small (3) · small (3)           — 320px
 *   Row 3: the list the user works from daily (12)                — 384px
 *   Row 4+: secondary (6) · secondary (6)                         — 320px (one alone → 12)
 * Cards sharing a row share a height; lists scroll inside their card.
 */
export const BentoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">{children}</div>
);

/** Width in the 12-col grid. At md: wide/half/full take both columns, small takes one. */
export type TileSpan = 'wide' | 'small' | 'full';
/** Height tier: big 384 (most-used list), medium 320 (actionable), small 256 (glanceable), auto. */
export type TileHeight = 'big' | 'medium' | 'small' | 'auto';

// Literal class strings so Tailwind (CDN) always generates them.
const SPAN: Record<TileSpan, string> = {
  wide: 'md:col-span-2 lg:col-span-6',
  small: 'md:col-span-1 lg:col-span-3',
  full: 'md:col-span-2 lg:col-span-12',
};
const HEIGHT: Record<TileHeight, string> = {
  big: 'h-96',
  medium: 'h-80',
  small: 'h-64',
  auto: '',
};

/** One grid cell. Children should fill it (h-full) — ListCards size themselves to the same tier. */
export const Tile: React.FC<{ span: TileSpan; height?: TileHeight; index?: number; className?: string; children: React.ReactNode }> = ({
  span, height = 'medium', index = 0, className, children,
}) => (
  <Rise index={index} className={cn('min-w-0', SPAN[span], HEIGHT[height], className)}>
    {children}
  </Rise>
);

/**
 * Two secondary cards side by side (6 + 6). If one of them is missing (null/false), the other
 * spans the full width instead of leaving a hole.
 */
export const HalfPair: React.FC<{ index?: number; height?: TileHeight; left?: React.ReactNode; right?: React.ReactNode }> = ({
  index = 0, height = 'medium', left, right,
}) => {
  const cards = [left, right].filter(Boolean);
  return (
    <>
      {cards.map((c, i) => (
        <Tile key={i} span={cards.length === 1 ? 'full' : 'wide'} height={height} index={index + i}>{c}</Tile>
      ))}
    </>
  );
};

/** Two KPI cards stacked in a 3-col cell; stretches to the row's height (the hero), min 256px. */
export const KpiStack: React.FC<{ index?: number; children: React.ReactNode }> = ({ index = 0, children }) => (
  <Rise index={index} className="min-w-0 md:col-span-1 lg:col-span-3 grid grid-rows-2 gap-4 min-h-64">
    {children}
  </Rise>
);

/** The dashboard's real quick actions. Heads also get Leads by Region; employees get My To-Do. */
export function quickActions(forHead: boolean): HeroAction[] {
  return [
    { label: 'New Lead', href: '/leads/new', icon: <Plus size={14} />, primary: true },
    { label: 'Log DSR', href: '/daily-service-reports/new', icon: <ClipboardList size={14} /> },
    { label: 'Leads board', href: '/leads', icon: <KanbanSquare size={14} /> },
    forHead
      ? { label: 'Leads by Region', href: '/reports/leads-by-region', icon: <MapPin size={14} /> }
      : { label: 'My To-Do', href: '/my-todo', icon: <ListTodo size={14} /> },
  ];
}

/** "3 follow-ups due · 5 hot leads · 42 open leads" — skips zero parts. */
export function heroSubtitle(parts: [number, string, string][], fallback: string): string {
  const text = parts
    .filter(([n]) => n > 0)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`)
    .join(' · ');
  return text || fallback;
}
