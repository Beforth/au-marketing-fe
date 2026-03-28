import React from 'react';
import { User, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchSuggestionProps<T> {
  items: T[];
  onSelect: (item: T) => void;
  title: string;
  renderItem: (item: T) => {
    id: string | number;
    title: string;
    subtitle?: string;
    rightText?: string;
  };
  icon?: LucideIcon;
  containerClassName?: string;
  className?: string;
}

export function SearchSuggestion<T>({
  items,
  onSelect,
  title,
  renderItem,
  icon: Icon = User,
  containerClassName,
  className
}: SearchSuggestionProps<T>) {
  if (items.length === 0) return null;

  return (
    <div className={cn(
      "absolute left-0 right-0 top-full z-[50] mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-150 ring-1 ring-black/5",
      containerClassName
    )}>
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-indigo-100 bg-indigo-50/40 flex items-center gap-2">
        <Icon size={14} className="text-indigo-500" />
        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{title}</span>
      </div>

      {/* Suggestions List */}
      <div className="max-h-56 overflow-auto py-0.5 bg-white">
        {items.map((item) => {
          const { id, title: itemTitle, subtitle, rightText } = renderItem(item);
          return (
            <button
              key={id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(item);
              }}
              className={cn(
                "w-full px-4 py-2 text-left hover:bg-indigo-50/50 flex items-center gap-3 transition-colors group border-b border-slate-50 last:border-0",
                className
              )}
            >
              <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                <div className="min-w-0 flex flex-col">
                  <span className="font-bold text-[13px] text-slate-900 truncate group-hover:text-indigo-700 transition-colors leading-tight">
                    {itemTitle}
                  </span>
                  {subtitle && (
                    <span className="text-[11px] text-indigo-400 font-medium truncate leading-normal">
                      {subtitle}
                    </span>
                  )}
                </div>
                
                {rightText && (
                  <div className="shrink-0">
                    <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                      {rightText}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
