import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface DashboardStatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentClassName?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ label, value, subtitle, icon, accentClassName }) => {
  return (
    <Card noPadding className="min-h-0">
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-[11px] text-slate-400 mt-1 truncate">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', accentClassName || 'bg-blue-50 text-blue-600')}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};
