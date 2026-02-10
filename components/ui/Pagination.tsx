/**
 * Pagination bar: page size selector + "X–Y of Z" + Prev/Next
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from './Select';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}) => {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-500">Rows per page</span>
        <Select
          options={pageSizeOptions.map((n) => ({ value: n, label: String(n) }))}
          value={pageSize}
          onChange={(v) => onPageSizeChange(Number(v))}
          className="w-20"
        />
        <span className="text-xs text-slate-500">
          {total === 0 ? '0' : `${start}–${end}`} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          leftIcon={<ChevronLeft size={14} />}
        >
          Previous
        </Button>
        <span className="text-xs font-medium text-slate-600 px-2">
          Page {page} of {totalPages || 1}
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || totalPages === 0}
          rightIcon={<ChevronRight size={14} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
