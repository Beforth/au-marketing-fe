import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2, Contact as ContactIcon, Package, Users, Briefcase, LucideIcon } from 'lucide-react';
import { marketingAPI, GlobalSearchHit, GlobalSearchResponse } from '../../lib/marketing-api';

interface PageItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
}

interface GlobalSearchResultsProps {
  query: string;
  /** Matching app pages (the old page-name search, still shown first). */
  pages: PageItem[];
  onPick: (href: string) => void;
}

const GROUPS: { key: keyof Omit<GlobalSearchResponse, 'query'>; label: string; icon: LucideIcon }[] = [
  { key: 'leads', label: 'Leads', icon: Users },
  { key: 'orders', label: 'Orders', icon: Package },
  { key: 'contacts', label: 'Contacts', icon: ContactIcon },
  { key: 'customers', label: 'Customers', icon: Briefcase },
  { key: 'organizations', label: 'Companies', icon: Building2 },
];

/**
 * Dropdown body for the navbar "Quick search… ⌘K": matching pages, then real records grouped by type
 * (GET /api/search — only records the user can already see on the list pages). Debounced 300 ms.
 */
export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({ query, pages, onPick }) => {
  const [data, setData] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(() => {
      marketingAPI.globalSearch(q)
        .then(res => { if (id === reqId.current) setData(res); })
        .catch(() => { if (id === reqId.current) setData(null); })
        .finally(() => { if (id === reqId.current) setLoading(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const groups = GROUPS.map(g => ({ ...g, hits: (data?.[g.key] ?? []) as GlobalSearchHit[] })).filter(g => g.hits.length);
  const nothing = !loading && pages.length === 0 && groups.length === 0;

  const Row: React.FC<{ icon: LucideIcon; title: string; subtitle?: string | null; href: string }> = ({ icon: Icon, title, subtitle, href }) => (
    <button
      type="button"
      // onMouseDown so the click lands before the input's blur closes the dropdown
      onMouseDown={e => { e.preventDefault(); onPick(href); }}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-slate-50 transition-colors group"
    >
      <Icon size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-slate-700 truncate">{title}</span>
        {subtitle && <span className="block text-[11px] text-slate-400 truncate">{subtitle}</span>}
      </span>
      <ArrowRight size={12} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
  );

  const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</p>
  );

  return (
    <div className="p-1.5 max-h-[420px] overflow-y-auto">
      {pages.length > 0 && (
        <div>
          <Heading>Pages</Heading>
          {pages.map(p => <Row key={p.id} icon={p.icon} title={p.title} href={p.href} />)}
        </div>
      )}
      {groups.map(g => (
        <div key={g.key}>
          <Heading>{g.label}</Heading>
          {g.hits.map(h => <Row key={`${g.key}-${h.id}`} icon={g.icon} title={h.title} subtitle={h.subtitle} href={h.href} />)}
        </div>
      ))}
      {loading && <div className="py-3 text-center text-slate-400 text-xs">Searching…</div>}
      {!loading && q.length < 2 && pages.length === 0 && (
        <div className="py-4 text-center text-slate-400 text-xs">Type at least 2 characters</div>
      )}
      {nothing && q.length >= 2 && <div className="py-4 text-center text-slate-400 text-xs">No matches found</div>}
    </div>
  );
};
