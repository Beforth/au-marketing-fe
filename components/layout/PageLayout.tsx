
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
            className={`w-full transition-all duration-300 animate-in fade-in flex flex-col gap-2 ${className}`}
        >
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb items={breadcrumbs} />
            )}
            
            <div className="flex flex-col gap-0.5 mb-3 px-1">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap">{title}</h1>
                        {description && (
                            <p className="text-sm text-slate-500 font-medium">{description}</p>
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
