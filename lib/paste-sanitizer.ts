/**
 * Normalizes Unicode "styled" Latin letters/digits — the kind produced by fancy-text
 * generators and copied from WhatsApp/Instagram bios (𝐛𝐨𝐥𝐝, 𝑖𝑡𝑎𝑙𝑖𝑐, 𝓼𝓬𝓻𝓲𝓹𝓽, Ｆｕｌｌｗｉｄｔｈ) —
 * back to plain ASCII, so pasted text always renders in the app's own font.
 *
 * These aren't the same letters in a different font; they're distinct Unicode code
 * points (Mathematical Alphanumeric Symbols, Fullwidth Latin) that happen to render
 * stylized in every font, so no CSS font-family rule can normalize them. Only
 * characters in these specific ranges are touched — genuine accented text (é, ñ, ü)
 * is left untouched.
 */
// Combining Diacritical Marks block (U+0300–U+036F) — matches stray marks left behind
// by NFKD-decomposing a "fancy" character, written as escapes to avoid embedding literal
// combining characters in this source file.
const COMBINING_MARKS_RE = new RegExp('[̀-ͯ]', 'g');

function normalizeFancyUnicode(text: string): string {
  return Array.from(text).map((ch) => {
    const cp = ch.codePointAt(0)!;
    const isMathAlphanumeric = cp >= 0x1d400 && cp <= 0x1d7ff;
    const isFullwidthLatin = (cp >= 0xff21 && cp <= 0xff3a) || (cp >= 0xff41 && cp <= 0xff5a) || (cp >= 0xff10 && cp <= 0xff19);
    if (!isMathAlphanumeric && !isFullwidthLatin) return ch;
    // Compatibility-decompose (Unicode defines these as canonical equivalents of plain ASCII)
    // then strip any stray combining marks that ride along in the decomposition.
    return ch.normalize('NFKD').replace(COMBINING_MARKS_RE, '');
  }).join('');
}

function isTextEntryElement(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) return false;
  if (el instanceof HTMLInputElement) {
    const textLikeTypes = ['text', 'search', 'tel', 'url', 'password', 'email'];
    return textLikeTypes.includes(el.type);
  }
  return true;
}

function insertTextAtCursor(el: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const newValue = el.value.slice(0, start) + text + el.value.slice(end);

  const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) {
    setter.call(el, newValue);
  } else {
    el.value = newValue;
  }

  try {
    const cursor = start + text.length;
    el.setSelectionRange(cursor, cursor);
  } catch {
    // Some input types don't support selection ranges — cursor position isn't critical here.
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Global paste handler: intercepts paste into any text input/textarea, strips fancy
 * Unicode styling from the clipboard text, and only overrides the native paste when
 * something actually needed fixing (leaves ordinary paste behavior untouched otherwise).
 */
export function handleGlobalPaste(e: ClipboardEvent): void {
  if (!isTextEntryElement(e.target)) return;
  const raw = e.clipboardData?.getData('text/plain');
  if (!raw) return;

  const sanitized = normalizeFancyUnicode(raw);
  if (sanitized === raw) return;

  e.preventDefault();
  insertTextAtCursor(e.target, sanitized);
}
