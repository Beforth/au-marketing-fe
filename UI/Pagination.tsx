import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <nav className={cn('flex items-center justify-center gap-1.5 px-4 py-3', className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-9 w-9 p-0 rounded-lg"
      >
        <ChevronLeft size={16} />
      </Button>
      <div className="flex items-center gap-1">
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <div className="flex h-9 w-9 items-center justify-center">
                <MoreHorizontal size={14} className="text-slate-400" />
              </div>
            ) : (
              <Button
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={cn(
                  'h-9 w-9 p-0 rounded-lg text-xs',
                  currentPage === page ? 'shadow-indigo-500/20' : 'text-slate-600'
                )}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-9 w-9 p-0 rounded-lg"
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  );
}
