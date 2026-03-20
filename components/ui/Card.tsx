
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
        'bg-white border border-slate-200/50 transition-all duration-500 relative group/card flex flex-col min-h-[140px] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_-15px_rgba(0,0,0,0.02)]',
        onClick && 'cursor-pointer hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] hover:border-indigo-200/50 hover:-translate-y-1',
        isDraggable && 'cursor-move active:scale-[0.98] active:rotate-[0.5deg]',
        className
      )}
      style={{ maxHeight, borderRadius: '1.25rem' }}
      onClick={onClick}
    >
      {/* Removed absolute-positioned handles div to prevent overlap */}

      {(title || description || headerAction || showHandle) && (
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50 min-h-[72px]">
          <div className="min-w-0 pr-6">
            {title && <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">{title}</h3>}
            {description && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity">
            {headerAction}
            {showHandle && (
              <div className="flex items-center gap-1 border-l border-slate-100 pl-1.5 ml-0.5">
                {onResize && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onResize(); }}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Toggle size"
                  >
                    <Maximize2 size={12} />
                  </button>
                )}
                <div className="text-slate-300 cursor-move p-1.5 hover:text-slate-500" title="Drag to reorder">
                  <GripVertical size={14} />
                </div>
              </div>
            )}
          </div>
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
