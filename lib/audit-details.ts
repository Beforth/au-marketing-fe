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
