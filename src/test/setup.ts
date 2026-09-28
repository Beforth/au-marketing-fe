import '@testing-library/jest-dom/vitest';

// Node 25+ defines its own `localStorage` global (undefined unless run with
// --localstorage-file), which shadows jsdom's. Modules like lib/api.ts read it
// at import time, so provide an in-memory stand-in when it's missing.
if (typeof globalThis.localStorage?.getItem !== 'function') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (key) => { store.delete(key); },
    setItem: (key, value) => { store.set(key, String(value)); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}
