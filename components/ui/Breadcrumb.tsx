import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-4" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center hover:text-slate-900 transition-colors"
      >
        <Home size={16} className="mr-1" />
        <span>Home</span>
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={16} className="text-slate-400" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="hover:text-slate-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'text-slate-900 font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
