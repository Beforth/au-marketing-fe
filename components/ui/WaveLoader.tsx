'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface WaveLoaderProps {
  /**
   * The number of bouncing dots to display.
   * @default 5
   */
  bars?: number;
  /**
   * Optional message to display alongside the bouncing dots.
   */
  message?: string;
  /**
   * Custom class for the container.
   */
  className?: string;
  /**
   * Custom class for each bar.
   */
  barClassName?: string;
}

/**
 * A waving bar loader using framer-motion.
 * Standardized to work with the project's indigo/slate palette.
 */
export function WaveLoader({
  bars = 5,
  message,
  className,
  barClassName,
}: WaveLoaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 items-center justify-center py-4', className)}>
      <div className="flex gap-1.5 items-end justify-center h-8">
        {Array.from({ length: bars }).map((_, index) => (
          <motion.div
            key={index}
            className={cn('w-1.5 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200/50', barClassName)}
            initial={{ height: 8 }}
            animate={{ height: [8, 24, 8] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      {message && (
        <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 animate-pulse">
          {message}
        </div>
      )}
    </div>
  );
}

export default WaveLoader;
