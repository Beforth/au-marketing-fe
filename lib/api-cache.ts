const store = new Map<string, { data: unknown; expiry: number }>();

const DEFAULT_TTL = 5 * 60 * 1000;

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL): void {
  store.set(key, { data, expiry: Date.now() + ttlMs });
}

export function clearCache(key?: string): void {
  if (key) store.delete(key);
  else store.clear();
}

export function getCacheKey(prefix: string, id?: number | string): string {
  return id != null ? `${prefix}_${id}` : prefix;
}
