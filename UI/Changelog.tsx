import React from 'react';
import { cn } from '../lib/utils';
import { Badge } from './Badge';

export interface ChangelogItem {
  version: string;
  date: string;
  changes: {
    type: 'feat' | 'fix' | 'refactor' | 'style';
    description: string;
  }[];
}

export function Changelog({ items }: { items: ChangelogItem[] }) {
  const typeMap = {
    feat: { label: 'Feature', variant: 'success' },
    fix: { label: 'Fixed', variant: 'danger' },
    refactor: { label: 'Refactor', variant: 'info' },
    style: { label: 'UI/UX', variant: 'warning' },
  } as const;

  return (
    <div className="flex flex-col gap-8 w-full">
      {items.map((item, idx) => (
        <div key={idx} className="relative pl-8 border-l-2 border-slate-100">
          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-white bg-indigo-500 ring-2 ring-indigo-500/20" />
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900 leading-none">{item.version}</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {item.changes.map((change, cIdx) => (
              <div key={cIdx} className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <Badge variant={typeMap[change.type].variant as any} className="mt-0.5 shrink-0">
                  {typeMap[change.type].label}
                </Badge>
                <p className="text-sm font-semibold text-slate-600">{change.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
