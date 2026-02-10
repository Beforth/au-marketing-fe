
import React from 'react';
import { GripVertical, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  onClick?: () => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  showHandle?: boolean;
  onResize?: () => void;
  noPadding?: boolean;
  maxHeight?: string;
  contentClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  className,
  headerAction,
  onClick,
  isDraggable,
  onDragStart,
  onDragOver,
  onDrop,
  showHandle,
  onResize,
  noPadding = false,
  maxHeight = 'none',
  contentClassName
}) => {
  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'bg-white border border-slate-200/60 transition-all duration-300 relative group/card flex flex-col min-h-[140px] shadow-[0_2px_4px_rgba(0,0,0,0.02),0_1px_0_rgba(0,0,0,0.02)]',
        onClick && 'cursor-pointer hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200/50',
        isDraggable && 'cursor-move active:scale-[0.99]',
        className
      )}
      style={{ maxHeight, borderRadius: '1rem' }}
      onClick={onClick}
    >
      {showHandle && (
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
          {onResize && (
            <button
              onClick={(e) => { e.stopPropagation(); onResize(); }}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
            >
              <Maximize2 size={12} />
            </button>
          )}
          <div className="text-slate-300 cursor-move p-1.5">
            <GripVertical size={14} />
          </div>
        </div>
      )}

      {(title || description || headerAction) && (
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50">
          <div className="min-w-0 pr-6">
            {title && <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">{title}</h3>}
            {description && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{description}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div
        className={cn(
          'flex-1 group/content relative',
          !noPadding && 'p-6',
          maxHeight !== 'none' && 'overflow-y-auto scrollbar-hide',
          contentClassName
        )}
      >
        <div className="animate-in fade-in duration-500 h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
