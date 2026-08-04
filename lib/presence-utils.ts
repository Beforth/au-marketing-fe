export const PRESENCE_REFRESH_MS = 5000;

const PAGE_LABELS: [RegExp, string][] = [
  [/^\/$/, 'Dashboard'],
  [/^\/leads\/new/, 'Creating Lead'],
  [/^\/leads\/\d+\/edit/, 'Editing Lead'],
  [/^\/leads/, 'Leads'],
  [/^\/quotations/, 'Quotations'],
  [/^\/orders\/new/, 'Creating Order'],
  [/^\/orders/, 'Orders'],
  [/^\/domains/, 'Domains & Targets'],
  [/^\/database/, 'Database'],
  [/^\/my-team/, 'My Team'],
  [/^\/events/, 'Events'],
  [/^\/reports/, 'Reports'],
  [/^\/settings/, 'Settings'],
];

export function presencePageLabel(page: string): string {
  for (const [re, label] of PAGE_LABELS) {
    if (re.test(page)) return label;
  }
  return page || 'On the app';
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
