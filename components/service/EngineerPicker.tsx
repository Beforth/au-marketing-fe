/**
 * Choose the engineer for a service visit: search employees by name, pick one, or clear the choice.
 * Value = { id: sign-in user id (what notifications use), name }. Same lookup as "Assign" on a complaint.
 */
import React, { useRef, useState } from 'react';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';
import { marketingAPI, HRMSEmployee } from '../../lib/marketing-api';

export interface EngineerValue {
  id: number | null;
  name: string | null;
}

export const EngineerPicker: React.FC<{
  value: EngineerValue;
  onChange: (v: EngineerValue) => void;
  label?: string;
  disabled?: boolean;
}> = ({ value, onChange, label = 'Engineer (optional)', disabled }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HRMSEmployee[]>([]);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (v: string) => {
    setQuery(v);
    setFailed(false);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      marketingAPI
        .getEmployees({ search: v.trim(), page_size: 8, status: 'active' })
        .then((r) => setResults(r.employees || []))
        .catch(() => {
          setResults([]);
          setFailed(true);
        });
    }, 300);
  };

  const pick = (e: HRMSEmployee) => {
    const uid = e.user_id ?? e.id;
    const name = `${e.first_name} ${e.last_name}`.trim() || e.username || `#${uid}`;
    onChange({ id: uid, name });
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      {value.name ? (
        <div>
          <p className="text-xs font-semibold text-slate-700 ml-0.5 mb-1.5">{label}</p>
          <div className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800 truncate">{value.name}</span>
            {!disabled && (
              <button type="button" className="text-slate-400 hover:text-rose-600 shrink-0" title="Remove the engineer" onClick={() => onChange({ id: null, name: null })}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <Input label={label} value={query} onChange={(e) => search(e.target.value)} placeholder="Type a name to search…" disabled={disabled} />
          {(results.length > 0 || failed) && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-auto">
              {failed && <p className="px-3 py-2 text-xs text-rose-500">Could not load employees (you may not have permission).</p>}
              {results.map((e) => (
                <button key={e.id} type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onMouseDown={(ev) => { ev.preventDefault(); pick(e); }}>
                  <span className="font-medium text-slate-800">{`${e.first_name} ${e.last_name}`.trim() || e.username}</span>
                  {(e.designation || e.department) && <span className="text-xs text-slate-400"> · {[e.designation, e.department].filter(Boolean).join(' · ')}</span>}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
