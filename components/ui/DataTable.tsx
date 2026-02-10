
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
  className?: string;
  hideHeader?: boolean;
  enableSorting?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  getRowClassName,
  className = '',
  hideHeader = false,
  enableSorting = true
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });

  const handleSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const isColumnSortable = (col: Column<T>) => {
    return enableSorting && col.sortable !== false && col.label !== '';
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      let aValue: any = (a as any)[sortConfig.key!];
      let bValue: any = (b as any)[sortConfig.key!];

      const parseValue = (val: any) => {
        if (val === undefined || val === null) return -Infinity;
        if (typeof val === 'number') return val;
        const str = String(val).trim();
        if (str.includes('$') || str.match(/^-?\$/)) return parseFloat(str.replace(/[$,]/g, '')) || 0;
        const timestamp = Date.parse(str);
        if (!isNaN(timestamp)) return timestamp;
        return str.toLowerCase();
      };

      const valA = parseValue(aValue);
      const valB = parseValue(bValue);

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc'
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  return (
    <div className={`overflow-x-auto relative ${className}`}>
      <table className="w-full text-left border-separate border-spacing-0">
        {!hideHeader && (
          <thead>
            <tr className="bg-slate-50/50">
              {columns.map((col) => {
                const sortable = isColumnSortable(col);
                return (
                  <th
                    key={String(col.key)}
                    className={`border-b border-slate-200 transition-all select-none group/header ${sortable ? 'cursor-pointer hover:bg-slate-100' : ''} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
                    style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}
                    onClick={() => sortable && handleSort(col.key)}
                  >
                    <div className={`flex items-center gap-2 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : ''}`}>
                      <span className={`text-[11px] uppercase font-black tracking-wider ${sortConfig.key === col.key ? 'text-indigo-600' : 'text-slate-500 group-hover/header:text-slate-900'}`}>
                        {col.label}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-slate-100 bg-white">
          {sortedData.length > 0 ? sortedData.map((item, idx) => (
            <tr
              key={String(rowKey(item))}
              onClick={() => onRowClick?.(item)}
              className={`group transition-all duration-200 ${onRowClick ? 'cursor-pointer' : ''} hover:bg-slate-50/50 ${getRowClassName ? getRowClassName(item) : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={`${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''} ${col.cellClassName || ''}`}
                  style={{ padding: 'calc(var(--ui-padding) * 0.75) var(--ui-padding)' }}
                >
                  <div className="text-slate-600 group-hover:text-slate-900 transition-colors text-sm font-medium">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </div>
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">No records found</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
