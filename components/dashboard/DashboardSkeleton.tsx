import React from 'react';

const SkeletonBlock: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-slate-100 rounded-lg animate-pulse ${className ?? ''}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="w-16 h-3.5" />
              <SkeletonBlock className="w-24 h-6" />
              <SkeletonBlock className="w-20 h-3" />
            </div>
            <SkeletonBlock className="w-9 h-9 rounded-xl" />
          </div>
          <SkeletonBlock className="w-full h-6 mt-4" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
      <div className="lg:col-span-2">
        <SkeletonBlock className="h-32" />
      </div>
      <SkeletonBlock className="h-32" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-64" />
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-48" />
        <SkeletonBlock className="h-48" />
      </div>
    </div>
  </div>
);
