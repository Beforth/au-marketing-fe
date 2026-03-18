import React, { useState } from 'react';
import { cn } from '../lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={cn(
          'absolute z-[100] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200',
          positions[position],
          className
        )}>
          {content}
          <div className={cn(
            'absolute border-4 border-transparent',
            position === 'top' && 'top-full left-1/2 -translate-x-1/2 border-t-slate-900',
            position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900',
            position === 'left' && 'left-full top-1/2 -translate-y-1/2 border-l-slate-900',
            position === 'right' && 'right-full top-1/2 -translate-y-1/2 border-r-slate-900'
          )} />
        </div>
      )}
    </div>
  );
}
