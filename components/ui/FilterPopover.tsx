/**
 * Filter Popover Component
 * Small popover window that opens next to filter button
 */
import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLElement | null>;
  onApply?: () => void;
  onClear?: () => void;
  /** Overrides the panel's width/padding (default "w-80 p-4"). */
  panelClassName?: string;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  isOpen,
  onClose,
  children,
  triggerRef,
  onApply,
  onClear,
  panelClassName,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: triggerRect.bottom + 8,
        left: triggerRect.left,
      });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Select/DatePicker render their open dropdown in a portal at document.body,
      // outside this popover's DOM subtree — without this check, clicking an option
      // inside them looks like an "outside" click and closes the popover before it registers.
      const inPortaledDropdown = (target as Element)?.closest?.(
        '[data-marketing-select-dropdown], [data-marketing-datepicker-dropdown]'
      );
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !inPortaledDropdown
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Card className={cn('shadow-xl border-slate-200 p-4', panelClassName || 'w-80')}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 mb-4">
          {children}
        </div>
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
          {onClear && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              Clear
            </Button>
          )}
          {onApply && (
            <Button
              size="sm"
              onClick={onApply}
            >
              Apply
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
