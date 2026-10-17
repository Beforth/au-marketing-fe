import React, { useEffect, useState } from 'react';
import { Crown, MapPin, Star, Trophy } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { resolveHrmsMediaUrl } from '../../lib/hrms-rbac';
import { marketingAPI, StarPerformerResponse } from '../../lib/marketing-api';

/** "Star Performer of the Month" — its own tile beside the greeting. Shows no numbers, only who it is. */
export const StarPerformerCard: React.FC<{ data: StarPerformerResponse }> = ({ data }) => {
  const p = data.performer;
  const monthName = new Date(data.year, data.month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="relative h-full min-h-64 flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-100 text-amber-950 shadow-sm ring-1 ring-amber-300/60">
      {/* big, faint trophy as a watermark — fills the corner without adding noise */}
      <Trophy aria-hidden className="pointer-events-none absolute -bottom-6 -right-5 h-36 w-36 text-white/35" strokeWidth={1.25} />

      <div className="relative flex items-center justify-between px-4 pt-3.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-900">
          <Star size={12} className="fill-amber-600 text-amber-600" /> Star performer
        </p>
        <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-300/60">{monthName}</span>
      </div>

      {p ? (
        <>
          <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-3 text-center">
            <div className="relative">
              <Crown size={22} className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 fill-amber-400 text-amber-700 drop-shadow-sm" aria-hidden />
              <Avatar
                src={resolveHrmsMediaUrl(p.profile_picture)}
                name={p.employee_name}
                className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-3xl text-white shadow-md ring-4 ring-white"
              />
            </div>
            <p className="mt-3 max-w-full truncate text-xl font-extrabold leading-tight" title={p.employee_name}>{p.employee_name}</p>
            {(p.region_name || p.domain_name) && (
              <span className="mt-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-300/60">
                <MapPin size={11} className="shrink-0" /> {p.region_name || p.domain_name}
              </span>
            )}
          </div>
          <div className="relative flex items-center justify-center gap-1.5 border-t border-amber-400/40 bg-white/30 px-4 py-2 text-[11px] font-bold text-amber-900">
            <Trophy size={12} /> Top closer of the month
          </div>
        </>
      ) : (
        <p className="relative flex flex-1 items-center justify-center px-6 text-center text-sm font-semibold text-amber-900">No star yet this month. The first win takes the spot.</p>
      )}
    </div>
  );
};

/** Fetches the star performer and renders its tile; renders nothing if the request fails. */
export const StarPerformerTile: React.FC = () => {
  const [data, setData] = useState<StarPerformerResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    marketingAPI.getStarPerformer().then((r) => { if (!cancelled) setData(r); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return data ? <StarPerformerCard data={data} /> : null;
};
