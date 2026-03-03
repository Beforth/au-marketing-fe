import { NAME_PREFIXES } from '../constants';
import { COUNTRY_CODES } from './country-codes';

/** Parse full name into prefix + rest (e.g. "Mr. John Doe" -> { prefix: "Mr.", namePart: "John Doe" }) */
export function parseNameWithPrefix(fullName: string | null | undefined): { prefix: string; namePart: string } {
  const s = (fullName ?? '').trim();
  if (!s) return { prefix: '', namePart: '' };
  const prefixes = [...NAME_PREFIXES]
    .filter((p) => p.value)
    .sort((a, b) => b.value.length - a.value.length);
  for (const p of prefixes) {
    if (s === p.value || s.startsWith(p.value + ' ')) {
      return { prefix: p.value, namePart: s.slice(p.value.length).trim() };
    }
  }
  return { prefix: '', namePart: s };
}

/** Build full name from prefix + name part (stored in API) */
export function serializeNameWithPrefix(prefix: string, namePart: string): string {
  const n = (namePart ?? '').trim();
  if (!prefix) return n;
  return n ? `${prefix} ${n}` : prefix;
}

/** Parse phone into country code + number (e.g. "+91 9876543210" -> { code: "+91", number: "9876543210" }) */
export function parsePhoneWithCountryCode(phone: string | null | undefined): { code: string; number: string } {
  const s = (phone ?? '').trim();
  if (!s) return { code: '', number: '' };
  const codes = [...COUNTRY_CODES]
    .filter((c) => c.value)
    .sort((a, b) => b.value.length - a.value.length);
  for (const c of codes) {
    if (s === c.value || s.startsWith(c.value + ' ') || s.startsWith(c.value)) {
      const rest = s.startsWith(c.value + ' ') ? s.slice(c.value.length + 1) : s.slice(c.value.length);
      return { code: c.value, number: rest.trim() };
    }
  }
  return { code: '', number: s };
}

/** Build full phone for API from country code + number */
export function serializePhoneWithCountryCode(code: string, number: string): string {
  const n = (number ?? '').trim();
  if (!code) return n;
  return n ? `${code} ${n}` : code;
}
