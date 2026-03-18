import React from 'react';
import { cn } from '../lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange });
        }
        return child;
      })}
    </div>
  );
}

export function TabsList({ children, className, value, onValueChange }: any) {
  return (
    <div className={cn('inline-flex h-12 items-center justify-center rounded-xl bg-slate-100/50 p-1.5 text-slate-500', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const element = child as React.ReactElement<any>;
          return React.cloneElement(element, {
            active: element.props.value === value,
            onClick: () => onValueChange(element.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

export function TabsTrigger({ children, className, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-black transition-all duration-200 uppercase tracking-widest',
        active
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-slate-500 hover:text-slate-900',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className, value, activeValue }: any) {
  if (value !== activeValue) return null;
  return <div className={cn('mt-2', className)}>{children}</div>;
}
