import React from 'react';
import { Shimmer, ListSkeleton, ChartSkeleton } from './Skeleton';

const Box: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className, children }) => (
  <div className={`rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden ${className ?? ''}`}>{children}</div>
);

const Header = () => (
  <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
    <Shimmer className="h-3.5 w-32" />
    <Shimmer className="h-2.5 w-48" />
  </div>
);

const Kpi = () => (
  <Box className="p-4 flex justify-between">
    <div className="space-y-2">
      <Shimmer className="h-2.5 w-20" />
      <Shimmer className="h-6 w-16" />
      <Shimmer className="h-2.5 w-24" />
    </div>
    <Shimmer className="h-10 w-10 rounded-xl" />
  </Box>
);

/**
 * Whole-dashboard placeholder while the summary loads — the same bento shape as the real page
 * (components/dashboard/DashboardFrame.tsx): hero + 2 KPI stacks, chart · 2 small cards, a full-width
 * list, then a pair.
 */
export const DashboardSkeleton: React.FC = () => (
  <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4" role="status" aria-label="Loading dashboard">
    <div className="md:col-span-2 lg:col-span-6 h-64 rounded-2xl bg-gradient-to-br from-blue-600/80 via-blue-700/80 to-indigo-800/80 p-6 space-y-3">
      <div className="h-3 w-48 rounded bg-white/20" />
      <div className="h-7 w-72 rounded bg-white/25" />
      <div className="h-3 w-56 rounded bg-white/20" />
      <div className="flex gap-2 pt-4">
        {[0, 1, 2].map((i) => <div key={i} className="h-8 w-24 rounded-full bg-white/20" />)}
      </div>
    </div>
    <div className="md:col-span-1 lg:col-span-3 grid grid-rows-2 gap-4"><Kpi /><Kpi /></div>
    <div className="md:col-span-1 lg:col-span-3 grid grid-rows-2 gap-4"><Kpi /><Kpi /></div>

    <Box className="md:col-span-2 lg:col-span-6 h-80 flex flex-col"><Header /><div className="flex-1"><ChartSkeleton /></div></Box>
    <Box className="md:col-span-1 lg:col-span-3 h-80 flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><Shimmer className="h-28 w-28 rounded-full" /></div></Box>
    <Box className="md:col-span-1 lg:col-span-3 h-80 flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><Shimmer className="h-28 w-28 rounded-full" /></div></Box>

    <Box className="md:col-span-2 lg:col-span-12 h-96"><Header /><ListSkeleton rows={5} /></Box>

    <Box className="md:col-span-2 lg:col-span-6 h-80"><Header /><ListSkeleton /></Box>
    <Box className="md:col-span-2 lg:col-span-6 h-80"><Header /><ListSkeleton /></Box>
  </div>
);
