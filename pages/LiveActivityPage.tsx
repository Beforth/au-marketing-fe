
import React from 'react';
import { Activity, Radio, Users } from 'lucide-react';
import { PageLayout } from '../components/layout/PageLayout';
import { PresenceUser } from '../lib/marketing-api';
import { usePresenceFeed } from '../hooks/usePresenceFeed';
import { Avatar } from '../components/ui/Avatar';
import { resolveHrmsMediaUrl } from '../lib/hrms-rbac';
import {
  presenceCounts,
  presenceDetailLabel,
  presenceStatus,
  PRESENCE_AVATAR_COLORS,
} from '../lib/presence-utils';

const PresenceCard: React.FC<{ user: PresenceUser }> = ({ user }) => {
  const color = PRESENCE_AVATAR_COLORS[user.employee_id % PRESENCE_AVATAR_COLORS.length];
  const st = presenceStatus(user);
  return (
    <div className={`bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-3.5 ${st.key === 'away' ? 'opacity-60' : ''} shadow-[0_1px_3px_rgba(0,0,0,0.04),0_10px_30px_-18px_rgba(0,0,0,0.08)]`}>
      <div className="relative shrink-0">
        <Avatar
          src={resolveHrmsMediaUrl(user.profile_picture)}
          name={user.employee_name}
          className={`w-11 h-11 rounded-xl border font-bold text-sm ${color}`}
        />
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${st.dot}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 truncate">{user.employee_name}</p>
        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
          <Radio size={11} className="text-blue-500 shrink-0" />
          {presenceDetailLabel(user.page, user.label)}
        </p>
      </div>
      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${st.badge}`}>
        {st.text}
      </span>
    </div>
  );
};

export const LiveActivityPage: React.FC = () => {
  const { users, loading, error, updatedAt: lastUpdated } = usePresenceFeed(true);
  const counts = presenceCounts(users);

  return (
    <PageLayout
      title="Live Activity"
      description="Who is online right now and which screen they are on."
      breadcrumbs={[{ label: 'Live Activity' }]}
      actions={
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {counts.active} active
          </span>
          <span className="text-[11px] text-slate-500">{counts.idle} idle · {counts.away} away</span>
          <span className="text-[11px] text-slate-400">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting…'}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <Activity size={13} />
          Updates live as people move · presence is in-memory only (not stored)
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100/70 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl px-4 py-3 font-medium">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Users size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No one is online right now</p>
            <p className="text-xs text-slate-400 mt-1">Users appear here as soon as they are active on the platform.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((u) => (
              <PresenceCard key={u.employee_id} user={u} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
