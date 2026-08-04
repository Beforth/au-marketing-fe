/**
 * Lets a record-detail page (e.g. LeadFormPage) announce a human-readable label
 * ("Acme Corp") for what it's currently showing, so the presence heartbeat can
 * broadcast something more useful than the raw URL. usePresence() (mounted once
 * in DashboardLayout) reads this; pages set it and clear it on unmount.
 */
type Listener = () => void;

let currentLabel: string | null = null;
const listeners = new Set<Listener>();

export function setPresenceLabel(label: string | null): void {
  currentLabel = label;
  listeners.forEach((listener) => listener());
}

export function getPresenceLabel(): string | null {
  return currentLabel;
}

export function subscribePresenceLabel(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
