import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router-dom';

/**
 * Makes a list/kanban page remember where the user was when they come back
 * with the browser Back button (open a lead -> Back). Fresh visits (sidebar
 * click, new link) still start clean. In-memory only, so a full refresh resets.
 */

const filterStore = new Map<string, unknown>();
const scrollStore = new Map<string, { y: number; spots: [number, number][] }>();

// Inner scrollers (kanban board sideways, each column up/down) are found by their overflow-* class.
const scrollers = () =>
  Array.from(document.querySelectorAll<HTMLElement>('main [class*="overflow-"]')).filter(
    (el) => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth,
  );

/** Drop-in replacement for useState: on Back, starts from the last value. */
export function useRestorableState<T>(key: string, initial: T) {
  const navType = useNavigationType();
  const [value, setValue] = useState<T>(() =>
    navType === 'POP' && filterStore.has(key) ? (filterStore.get(key) as T) : initial,
  );
  filterStore.set(key, value);
  return [value, setValue] as const;
}

/** Call once per list page. `ready` = first data load finished (false while loading). */
export function useScrollMemory(key: string, ready: boolean) {
  const navType = useNavigationType();
  const restored = useRef(false);

  useLayoutEffect(
    () => () => {
      scrollStore.set(key, {
        y: window.scrollY,
        spots: scrollers().map((el) => [el.scrollLeft, el.scrollTop]),
      });
    },
    [key],
  );

  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const saved = scrollStore.get(key);
    if (navType !== 'POP' || !saved) return;
    requestAnimationFrame(() => {
      scrollers().forEach((el, i) => {
        if (saved.spots[i]) el.scrollTo(saved.spots[i][0], saved.spots[i][1]);
      });
      window.scrollTo(0, saved.y);
    });
  }, [ready, key, navType]);
}
