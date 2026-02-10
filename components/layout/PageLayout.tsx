
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
            className={`mx-auto transition-all duration-300 max-w-[1400px] w-full animate-in fade-in ${className}`}
            style={{ gap: 'var(--ui-gap)', display: 'flex', flexDirection: 'column' }}
        >
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb items={breadcrumbs} />
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-slate-500 text-sm mt-1">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-3 pb-0.5">
                        {actions}
                    </div>
                )}
            </div>

            {children}
        </div>
    );
};
