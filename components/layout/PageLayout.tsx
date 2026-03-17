
import React from 'react';
import { Breadcrumb, BreadcrumbItem } from '../ui/Breadcrumb';

interface PageLayoutProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    breadcrumbs?: BreadcrumbItem[];
}

export const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    description,
    actions,
    children,
    className = "",
    breadcrumbs
}) => {
    return (
        <div
            className={`w-full transition-all duration-300 animate-in fade-in ${className}`}
            style={{ gap: 'var(--ui-gap)', display: 'flex', flexDirection: 'column' }}
        >
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb items={breadcrumbs} />
            )}
            
            <div className="flex flex-col gap-0.5 mb-3 px-1">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap">{title}</h1>
                        {description && (
                            <p className="text-slate-400 text-[10px] font-medium py-0 opacity-80 uppercase tracking-widest leading-none">{description}</p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {children}
        </div>
    );
};
