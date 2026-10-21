import { useEffect, useRef, useState } from 'react';

/** True once the element has scrolled into view (immediately for reduced motion), so a chart can play its entrance. From befui's charts helper. */
export function useChartIn<T extends Element>() {
  const ref = useRef<T>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return setOn(true);
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, on] as const;
}
