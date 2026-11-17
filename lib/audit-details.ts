/**
 * Audit-log details are written by the API as "<what happened> — <change 1>; <change 2>; …"
 * (au-marketing-api/app/audit_utils.py `with_changes`). Split that so the changes can be shown as a list.
 */
export function splitAuditDetails(details: string | null | undefined): { summary: string; changes: string[] } {
  const text = (details || '').trim();
  const at = text.indexOf(' — ');
  if (at < 0) return { summary: text, changes: [] };
  const changes = text.slice(at + 3).split('; ').map(s => s.trim()).filter(Boolean);
  return { summary: text.slice(0, at).trim(), changes };
}

/** "Today", "Yesterday", or "17 Nov 2026" (local time). */
export function dayLabel(d: Date, now: Date = new Date()): string {
  const midnight = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((midnight(now) - midnight(d)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The words of a search box, as the backend reads them (every word must match, any order). */
export function searchWords(search: string): string[] {
  return Array.from(new Set(search.split(/\s+/).map(w => w.trim()).filter(Boolean)));
}

/** Splits text into plain and matched pieces so matches can be marked. Case-insensitive. */
export function highlightParts(text: string, words: string[]): { text: string; hit: boolean }[] {
  if (!text || words.length === 0) return [{ text, hit: false }];
  // A one-letter word ("N" in "AP Quote N") is only marked when it stands alone, not inside every other word.
  const escaped = words
    .map(w => { const e = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return w.length === 1 ? `\\b${e}\\b` : e; })
    .sort((a, b) => b.length - a.length);
  // split() with one capture group puts every match at an odd index.
  return text.split(new RegExp(`(${escaped.join('|')})`, 'i')).map((p, i) => ({ text: p, hit: i % 2 === 1 })).filter(p => p.text !== '');
}

/**
 * Hides database ids from text shown to people: "Enquiry #130 (lead 'Rahul Verma')" → "Enquiry (lead 'Rahul Verma')".
 * Only a "#number" straight after a word is removed. The raw text (with ids) stays in the row's tooltip.
 */
export function withoutIds(text: string | null | undefined): string {
  return (text || '').replace(/(\p{L}) #\d+(?!\d)/gu, '$1');
}

// toLocaleTimeString puts a narrow no-break space before am/pm in newer browsers; use a normal space.
const plainSpaces = (s: string) => s.replace(/ /g, ' ');

/** 12-hour clock, e.g. "3:21 pm" ("3:21:32 pm" with seconds). Always 12-hour, whatever the computer's locale says. */
export function timeLabel(d: Date, withSeconds = false): string {
  return plainSpaces(
    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), hour12: true }),
  ).toLowerCase();
}
