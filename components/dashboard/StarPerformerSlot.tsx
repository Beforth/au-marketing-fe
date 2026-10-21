import React from 'react';
import { Rise } from './Rise';
import { StarPerformerTile } from './StarPerformerCard';

/**
 * Star performer: its own 3-col tile beside the 9-col hero. If it can't load, the hero simply keeps its width.
 * (The four headline number cards that used to sit here were removed; Monthly Target now follows the hero.)
 */
export const StarPerformerSlot: React.FC<{ firstIndex?: number }> = ({ firstIndex = 1 }) => (
  <Rise index={firstIndex} className="min-w-0 md:col-span-2 lg:col-span-3 min-h-64 empty:hidden">
    <StarPerformerTile />
  </Rise>
);
