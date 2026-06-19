import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Database } from 'lucide-react';
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
  bordered?: boolean;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className={cn('px-4 py-3', i === 0 && 'pl-6')}>
          <div
            className="h-3 rounded bg-slate-100 animate-pulse"
            style={{ width: `${55 + (i * 17) % 35}%` }}
          />
        </td>
      ))}
    </tr>
  );
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
  bordered = false,
}: DataTableProps<T>) {

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    onSort?.(key, direction);
  };

  const cellPy = dense ? 'py-2' : 'py-3';

  return (
    <div
      className={cn(
        'relative w-full overflow-auto customize-scrollbar',
        bordered && 'border border-slate-200 rounded-2xl bg-white shadow-xs',
        className
      )}
    >
      <table className="w-full border-separate border-spacing-0 text-left">

        {/* ── Header ───────────────────────────────────────────────── */}
        {!hideHeader && (
          <thead className="sticky top-0 z-20">
            <tr>
              {columns.map((col, idx) => {
                const colKey = String(col.key);
                const isSortable = col.sortable !== false && !!onSort;
                const isActive = sortConfig?.key === colKey;
                const isFirst = idx === 0;
                const isLast = idx === columns.length - 1;

                return (
                  <th
                    key={colKey}
                    id={`th-${colKey}`}
                    className={cn(
                      // base: high-density gray header from HRMS specs
                      'h-10 px-4 text-left select-none relative bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold',
                      // divider below header
                      'border-b border-slate-200',
                      // first/last col border styling (if table is bordered)
                      isFirst && 'pl-6',
                      // sortable
                      isSortable && 'cursor-pointer hover:bg-slate-100/70 transition-colors duration-150 group',
                      col.headerClassName
                    )}
                    style={{
                      width: col.width
                        ? typeof col.width === 'number' ? `${col.width}px` : col.width
                        : 'auto',
                    }}
                    onClick={() => isSortable && handleSort(colKey)}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 transition-colors duration-150',
                        col.align === 'center' && 'justify-center w-full',
                        col.align === 'right' && 'justify-end w-full',
                      )}
                    >
                      <span className="truncate">{col.label}</span>

                      {isSortable && (
                        <span className="shrink-0 transition-opacity duration-150">
                          {isActive ? (
                            sortConfig?.direction === 'asc'
                              ? <ArrowUp size={10} className="text-blue-600" strokeWidth={2.5} />
                              : <ArrowDown size={10} className="text-blue-600" strokeWidth={2.5} />
                          ) : (
                            <ArrowUpDown
                              size={10}
                              className="text-slate-300 group-hover:text-slate-400"
                              strokeWidth={2}
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}

        {/* ── Body ─────────────────────────────────────────────────── */}
        <tbody className="relative bg-white">

          {/* Loading skeleton — shown when no data yet */}
          {isLoading && data.length === 0 ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))}
            </>
          ) : data.length === 0 ? (
            /* Empty state */
            <tr>
              <td colSpan={columns.length} className="py-16 text-center bg-white">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200/50">
                    <Database size={15} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    No data found
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            <>
              {/* Overlay spinner when refreshing existing data */}
              {isLoading && (
                <tr className="absolute inset-0 z-30 pointer-events-none">
                  <td>
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              )}

              {data.map((item, rowIndex) => {
                const isLastRow = rowIndex === data.length - 1;
                return (
                  <tr
                    key={String(rowKey(item))}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      // row interaction & hover (transition duration from HRMS specifications)
                      'transition-colors duration-200',
                      onRowClick
                        ? 'cursor-pointer hover:bg-slate-50/60 active:bg-slate-50/90'
                        : 'hover:bg-slate-50/40',
                      getRowClassName?.(item)
                    )}
                  >
                    {columns.map((col, idx) => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          'px-4 align-middle text-xs font-normal text-slate-800 truncate transition-colors duration-100',
                          cellPy,
                          idx === 0 && 'pl-6',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          !isLastRow && 'border-b border-slate-200/60',
                          col.cellClassName
                        )}
                      >
                        {col.render
                          ? col.render(item, (item as any)[col.key])
                          : String((item as any)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
