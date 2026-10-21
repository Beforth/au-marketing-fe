// Most specific first: the first match wins. Covers every screen in App.tsx.
const PAGE_LABELS: [RegExp, string][] = [
  [/^\/(\?|$)/, 'Dashboard'],
  [/^\/leads\/new/, 'Creating Lead'],
  [/^\/leads\/\d+\/edit/, 'Editing Lead'],
  [/^\/leads/, 'Leads'],
  [/^\/quotations/, 'Quotations'],
  [/^\/orders\/new/, 'Creating Order'],
  [/^\/orders\/\d+/, 'Viewing Order'],
  [/^\/orders/, 'Orders'],
  [/^\/contacts\/new/, 'Creating Contact'],
  [/^\/contacts\/\d+\/edit/, 'Editing Contact'],
  [/^\/contacts/, 'Contacts'],
  [/^\/customers\/new/, 'Creating Customer'],
  [/^\/customers\/\d+\/edit/, 'Editing Customer'],
  [/^\/customers/, 'Customers'],
  [/^\/organizations\/new/, 'Creating Organization'],
  [/^\/organizations\/\d+\/edit/, 'Editing Organization'],
  [/^\/organizations/, 'Organizations'],
  [/^\/visiting-card-contacts/, 'Visiting Cards'],
  [/^\/database/, 'Database'],
  [/^\/domains/, 'Domains & Targets'],
  [/^\/employees/, 'Employees'],
  [/^\/my-team/, 'My Team'],
  [/^\/my-todo/, 'My To-Do'],
  [/^\/dsr/, 'DSR'],
  [/^\/daily-service-reports/, 'Daily Service Reports'],
  [/^\/events\/new/, 'Creating Event'],
  [/^\/events\/\d+\/edit/, 'Editing Event'],
  [/^\/events\/\d+/, 'Viewing Event'],
  [/^\/events/, 'Events'],
  [/^\/reports\/leads-by-region/, 'Leads by Region Report'],
  [/^\/reports\/od-plan/, 'OD Plan'],
  [/^\/reports\/expected-order/, 'Expected Order'],
  [/^\/reports/, 'MIS'],
  [/^\/report-templates/, 'Report Templates'],
  [/^\/schema/, 'Schema'],
  [/^\/service\/contracts\/[^/]+\/work-order/, 'Service · Work Order'],
  [/^\/service\/contracts\/[^/]+\/plan/, 'Service · Visit Plan'],
  [/^\/service\/contracts/, 'Service · Contracts'],
  [/^\/service\/visits\/[^/]+\/report/, 'Service · Visit Report'],
  [/^\/service\/visits\/[^/]+\/work-order/, 'Service · Work Order'],
  [/^\/service\/visits/, 'Service · Visits'],
  [/^\/service\/work-orders/, 'Service · Work Orders'],
  [/^\/service\/complaints/, 'Service · Complaints'],
  [/^\/service\/store/, 'Service · Store'],
  [/^\/service\/reports/, 'Service · Reports'],
  [/^\/service/, 'Service'],
  [/^\/financials/, 'Financials'],
  [/^\/inventory/, 'Inventory'],
  [/^\/numbering-series/, 'Numbering Series'],
  [/^\/roles/, 'Roles'],
  [/^\/live-activity/, 'Live Activity'],
  [/^\/support/, 'Support & Tickets'],
  [/^\/settings/, 'Settings'],
];

export function presencePageLabel(page: string): string {
  for (const [re, label] of PAGE_LABELS) {
    if (re.test(page)) return label;
  }
  // Unknown screen: never show the raw address (it can carry search text), just say they are in the app.
  return 'On the app';
}

/**
 * Combines the generic page category with the optional record-specific label
 * a page announces (e.g. "Editing Lead" + "Acme Corp" -> "Editing Lead — Acme Corp").
 */
export function presenceDetailLabel(page: string, label?: string | null): string {
  const category = presencePageLabel(page);
  return label ? `${category} — ${label}` : category;
}

export function presenceTimeAgo(secondsAgo: number): string {
  if (secondsAgo < 5) return 'Active now';
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const m = Math.floor(secondsAgo / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export const PRESENCE_AVATAR_COLORS = [
  'bg-blue-100 text-blue-600 border-blue-200/60',
  'bg-emerald-100 text-emerald-600 border-emerald-200/60',
  'bg-amber-100 text-amber-600 border-amber-200/60',
  'bg-violet-100 text-violet-600 border-violet-200/60',
  'bg-rose-100 text-rose-600 border-rose-200/60',
  'bg-cyan-100 text-cyan-600 border-cyan-200/60',
];

export type PresenceStatusKey = 'active' | 'idle' | 'away';

const minutesText = (secs: number) => {
  const m = Math.floor(secs / 60);
  return m < 60 ? `${Math.max(m, 1)}m` : `${Math.floor(m / 60)}h`;
};

/** Dot colour, badge text and badge colour for a person's status (green active, amber idle, grey away). */
export function presenceStatus(u: { seconds_ago: number; idle_seconds?: number; status?: PresenceStatusKey }) {
  const key: PresenceStatusKey = u.status ?? 'active'; // an older server sends no status
  const idle = u.idle_seconds ?? u.seconds_ago;
  if (key === 'idle') return { key, dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700', text: `Idle ${minutesText(idle)}` };
  if (key === 'away') return { key, dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500', text: `Away ${minutesText(idle)}` };
  return { key, dot: 'bg-emerald-500', badge: idle < 30 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500', text: presenceTimeAgo(idle) };
}

export function presenceCounts(users: { status?: PresenceStatusKey }[]) {
  return users.reduce(
    (c, u) => { c[u.status ?? 'active'] += 1; return c; },
    { active: 0, idle: 0, away: 0 } as Record<PresenceStatusKey, number>,
  );
}
