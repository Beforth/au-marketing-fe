import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2 mb-6', className)} aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center text-slate-400 hover:text-indigo-600 transition-all duration-200 group"
      >
        <Home size={14} className="group-hover:scale-110 transition-transform" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-slate-300 shrink-0" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              'text-xs font-black uppercase tracking-widest',
              index === items.length - 1 ? 'text-slate-900 border-b-2 border-indigo-500/50 pb-0.5' : 'text-slate-500'
            )}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
