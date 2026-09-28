import React from 'react';
import { dsrStatusGroup, dsrStatusLabel } from '../../lib/dsr-helpers';

/**
 * Approval Status badge (guide §9.4): Approved / Rejected (hover shows reason) /
 * Pending (hover shows "Pending level N approval").
 */
export const DSRStatusBadge: React.FC<{ status: string; currentLevel?: number | null; rejectionReason?: string | null }> = ({
  status, currentLevel, rejectionReason,
}) => {
  const group = dsrStatusGroup(status);
  if (group === 'done') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Approved
      </span>
    );
  }
  if (group === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800" title={rejectionReason || 'Rejected'}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800" title={dsrStatusLabel(status, currentLevel)}>
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Pending
    </span>
  );
};
