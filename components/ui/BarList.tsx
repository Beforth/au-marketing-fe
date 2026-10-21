import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BarListItem {
  label: string;
  value: number;
  href?: string;
}

/**
 * Ranked list with a bar behind each label (top sources, products, countries). Bars scale to the largest value.
 * Copied from befui (https://befui.vercel.app/#/components/bar-list), with its theme colours swapped for this app's
 * Tailwind palette because the app has no befui theme variables.
 */
export function BarList({ items, format = (n) => n.toLocaleString('en-IN'), className }: { items: BarListItem[]; format?: (n: number) => string; className?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className={cn('grid gap-1.5', className)}>
      {items.map((it) => {
        const Tag = it.href ? 'a' : 'div';
        return (
          <li key={it.label}>
            <Tag {...(it.href ? { href: it.href } : {})} className={cn('relative flex items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-[13px] text-slate-900', it.href && 'transition-colors hover:text-blue-600')}>
              <span aria-hidden className="absolute inset-y-0 left-0 rounded-md bg-blue-600/10" style={{ width: `${(it.value / max) * 100}%` }} />
              <span className="relative truncate font-medium">{it.label}</span>
              <span className="relative tabular-nums text-slate-500">{format(it.value)}</span>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
}
