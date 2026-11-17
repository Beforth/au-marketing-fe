/**
 * Combobox: a searchable dropdown with a tick on the chosen option.
 *
 * Layout and behaviour follow befui's `combobox` (search box on top, option label with an optional description under it,
 * tick on the selected row, closes on pick). It is rebuilt on this project's own `command` + `popover` with slate/blue
 * classes, because befui's token classes (`bg-background`, `text-muted-foreground`…) do not exist here (Tailwind runs off
 * the CDN with no config). No extra package is needed.
 *
 * The open list is drawn in its own layer (a portal). Panels that close on an outside click (see FilterPopover) must treat
 * clicks inside `[data-marketing-combobox-dropdown]` as inside.
 */
import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Small text under the label. Also searchable. */
  description?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Shown when `value` matches no option. An "All" option with value '' is the usual way to represent "no filter". */
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Show the search box. Default: only when there are more than 7 options. */
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

const trigger =
  'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-[13px] font-medium text-slate-800 outline-none transition-colors ' +
  'hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 ' +
  'data-[state=open]:border-blue-500 data-[state=open]:ring-2 data-[state=open]:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50';

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select…',
  searchPlaceholder,
  emptyText,
  searchable,
  disabled,
  className,
  id,
  'aria-label': ariaLabel,
}) => {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.value === value);
  const showSearch = searchable ?? options.length > 7;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" role="combobox" aria-expanded={open} aria-label={ariaLabel} disabled={disabled} className={cn(trigger, className)}>
          <span className={cn('truncate', !current && 'text-slate-400')}>{current?.label ?? placeholder}</span>
          <ChevronsUpDown size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-marketing-combobox-dropdown=""
        className="z-[99999] w-[var(--radix-popover-trigger-width)] min-w-[12rem] overflow-hidden p-0"
      >
        <Command>
          {showSearch && <CommandInput placeholder={searchPlaceholder ?? 'Search…'} className="h-9" />}
          <CommandList className="max-h-60">
            <CommandEmpty>{emptyText ?? 'No results.'}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.value}`}
                  onSelect={() => { onValueChange(o.value); setOpen(false); }}
                  className="gap-2 text-[13px]"
                >
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate">{o.label}</span>
                    {o.description && <span className="truncate text-xs text-slate-500">{o.description}</span>}
                  </span>
                  <Check size={14} className={cn('shrink-0 text-blue-600', o.value === value ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
