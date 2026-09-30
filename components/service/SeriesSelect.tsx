/**
 * Pick a numbering series from the active ones (instead of typing its code, where a typo silently gives no number).
 * Used by the Service contract and complaint forms. Value = the series code; empty = no automatic number.
 */
import React, { useEffect, useState } from 'react';
import { Select } from '../ui/Select';
import { marketingAPI, Series } from '../../lib/marketing-api';

export const SeriesSelect: React.FC<{
  value: string;
  onChange: (code: string) => void;
  label?: string;
  disabled?: boolean;
}> = ({ value, onChange, label = 'Numbering series (optional)', disabled }) => {
  const [list, setList] = useState<Series[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    marketingAPI
      .getSeries({ page: 1, page_size: 100, is_active: true })
      .then((r) => setList(r.items || []))
      .catch(() => setList([]))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <Select
        label={label}
        options={[{ value: '', label: 'No automatic number' }, ...list.map((s) => ({ value: s.code, label: `${s.name} — ${s.pattern}` }))]}
        value={value}
        onChange={(v) => onChange(String(v ?? ''))}
        placeholder={loaded ? 'No automatic number' : 'Loading series…'}
        disabled={disabled}
        searchable
        clearable={false}
      />
      <p className="text-[11px] text-slate-400 font-medium mt-1 ml-0.5">
        {loaded && list.length === 0
          ? 'No numbering series yet — create one on the Numbering Series page.'
          : 'The number is made when you save, from the series you pick.'}
      </p>
    </div>
  );
};
