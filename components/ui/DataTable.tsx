import React, { useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  render?: (item: T, value: any) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
  dense?: boolean;
  resizable?: boolean;
  showVerticalLines?: boolean;
  hideHeader?: boolean;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  getRowClassName,
  sortConfig,
  onSort,
  isLoading = false,
  dense = false,
  showVerticalLines = false,
  hideHeader = false,
  className,
}: DataTableProps<T>) {

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    onSort?.(key, direction);
  };

  return (
    <div className={cn("relative w-full overflow-auto customize-scrollbar border border-slate-200 rounded-xl bg-white", className)}>
      <table className={cn("w-full border-separate border-spacing-0 text-sm")}>
        {!hideHeader && (
          <thead className="sticky top-0 z-20">
            <tr>
              {columns.map((col, idx) => {
                const colKey = String(col.key);
                const isSortable = col.sortable !== false && !!onSort;
                const isLast = idx === columns.length - 1;

                return (
                  <th
                    key={colKey}
                    id={`th-${colKey}`}
                    className={cn(
                      'h-10 px-4 text-left font-semibold text-slate-600 bg-[#F8FAFC] border-b border-slate-200 transition-colors relative select-none uppercase tracking-wider text-[11px]',
                      isSortable && "cursor-pointer hover:bg-slate-100/80 hover:text-indigo-600",
                      col.align === 'center' && "text-center",
                      col.align === 'right' && "text-right",
                      idx === 0 && "pl-6",
                      showVerticalLines && !isLast && "border-r border-slate-200/50",
                      col.headerClassName
                    )}
                    style={{ width: col.width ? (typeof col.width === 'number' ? `${col.width}px` : col.width) : 'auto' }}
                    onClick={() => isSortable && handleSort(colKey)}
                  >
                    <div className={cn("flex items-center gap-1.5", col.align === 'center' && "justify-center", col.align === 'right' && "justify-end")}>
                      <span className="truncate">{col.label}</span>
                      {isSortable && (
                        <div className="flex flex-col text-slate-300">
                          <ChevronUp size={10} className={cn(sortConfig?.key === colKey && sortConfig.direction === 'asc' && "text-indigo-600")} />
                          <ChevronDown size={10} className={cn(sortConfig?.key === colKey && sortConfig.direction === 'desc' && "text-indigo-600")} />
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 relative">
          {isLoading && data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-20 text-center text-slate-400 uppercase tracking-widest text-xs font-bold opacity-30">
                No Data Found
              </td>
            </tr>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-30 flex items-center justify-center transition-all duration-300">
                  <div className="w-6 h-6 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
              {data.map((item) => (
                <tr
                  key={String(rowKey(item))}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group transition-colors",
                    onRowClick ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/50" : "hover:bg-slate-50/30",
                    getRowClassName?.(item)
                  )}
                >
                  {columns.map((col, idx) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-2.5 text-slate-600 truncate transition-colors",
                        col.align === 'center' && "text-center",
                        col.align === 'right' && "text-right",
                        idx === 0 && "pl-6",
                        showVerticalLines && idx < columns.length - 1 && "border-r border-slate-100",
                        col.cellClassName
                      )}
                    >
                      {col.render
                        ? col.render(item, (item as any)[col.key])
                        : String((item as any)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
