import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, Star } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { resolveHrmsMediaUrl } from '../../lib/hrms-rbac';
import { marketingAPI, StarPerformerResponse } from '../../lib/marketing-api';

/** A username-style name ("shubham.badgujar") is shown in two tones; a normal name stays one colour. */
const TwoToneName: React.FC<{ name: string }> = ({ name }) => {
  const dot = name.indexOf('.');
  if (dot <= 0 || /\s/.test(name)) return <>{name}</>;
  return <><span className="text-slate-900">{name.slice(0, dot)}</span><span className="text-slate-400">{name.slice(dot)}</span></>;
};

/** "Star Performer of the Month" — its own tile beside the greeting. Shows no numbers, region or domain, only who it is. */
export const StarPerformerCard: React.FC<{ data: StarPerformerResponse }> = ({ data }) => {
  const p = data.performer;
  const monthName = new Date(data.year, data.month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="relative h-full min-h-64 flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-white via-amber-50/40 to-orange-50/60 text-slate-900 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.35)] ring-1 ring-amber-200/70">
      {/* soft warm glow in the corner + a slow light sweep across the whole card */}
      <div aria-hidden className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-amber-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent star-sweep" />

      <div className="relative flex items-center justify-between px-4 pt-3.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700">
          <Star size={13} className="fill-amber-500 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]" /> Star performer
        </p>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">{monthName}</span>
      </div>

      {p ? (
        <>
          <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-3 text-center">
            <div className="relative">
              <Crown size={22} className="absolute -top-5 left-1/2 z-10 -translate-x-1/2 fill-amber-400 text-amber-600 drop-shadow-sm" aria-hidden />
              <span aria-hidden className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 blur-md star-glow" />
              <span className="relative block rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 p-[3px]">
                <Avatar
                  src={resolveHrmsMediaUrl(p.profile_picture)}
                  name={p.employee_name}
                  className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl text-white ring-4 ring-white"
                />
              </span>
            </div>
            <p className="mt-4 max-w-full truncate text-xl font-extrabold leading-tight" title={p.employee_name}><TwoToneName name={p.employee_name} /></p>
          </div>
          <div className="relative flex items-center justify-center gap-2 border-t border-amber-100 bg-gradient-to-r from-amber-50/60 via-amber-50 to-amber-50/60 px-4 py-2.5 text-xs font-bold text-orange-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 ring-1 ring-amber-200"><Sparkles size={13} className="text-amber-600" /></span>
            Top closer of the month
          </div>
        </>
      ) : (
        <p className="relative flex flex-1 items-center justify-center px-6 text-center text-sm font-semibold text-amber-800">No star yet this month. The first win takes the spot.</p>
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
