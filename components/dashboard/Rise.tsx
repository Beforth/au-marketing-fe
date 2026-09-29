import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Wraps a dashboard card so it fades/rises in on load, `index` cards after the previous one
 * (40ms apart, capped after 6 so a long page doesn't keep animating). The keyframes live in
 * index.html (`.dash-rise`) and are switched off for prefers-reduced-motion.
 */
export const Rise: React.FC<{ index?: number; className?: string; children: React.ReactNode }> = ({ index = 0, className, children }) => (
  <div className={cn('dash-rise', className)} style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}>
    {children}
  </div>
);
