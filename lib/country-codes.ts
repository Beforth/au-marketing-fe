/**
 * Country calling codes with flags for phone inputs.
 * Uses country-list-with-dial-code-and-flag for full list + flag emojis.
 */
import CountryList from 'country-list-with-dial-code-and-flag';

export type CountryCodeOption = { value: string; label: string };

const raw = CountryList.getAll({ withSecondary: false }).map((c) => ({
  value: c.dialCode,
  label: `${c.flag} ${c.dialCode}`,
}));

// Default country code for new phone inputs (India)
export const DEFAULT_COUNTRY_CODE = '+91';

// Sort: empty option first, then by country name for easier scanning
export const COUNTRY_CODES: CountryCodeOption[] = [
  { value: '', label: 'Code' },
  ...raw.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
];

/** Use with Select getSearchText so typing "91", "+91", or "India" finds the right option */
export function getCountryCodeSearchText(opt: { value: string | number; label: string }): string {
  const value = String(opt.value);
  if (!value) return (opt.label || '').trim();
  const dialOnly = value.replace(/^\+/, '');
  const labelStr = String(opt.label);
  const match = labelStr.match(/\+\d+\s+(.+)$/);
  const namePart = match ? match[1].trim() : labelStr;
  return `${dialOnly} ${value} ${namePart}`.trim();
}
