import { useEffect, useState } from 'react';
import { countUpValue } from '../utils/countUp';

/** Counts from 0 to `target` after `delayMs`. Jumps straight to the target when the user prefers reduced motion. */
export function useCountUp(target: number, durationMs = 900, delayMs = 0): number {
  const reduced = typeof window !== 'undefined'
    && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = (now - start) / durationMs;
        setValue(countUpValue(target, progress));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, durationMs, delayMs, reduced]);

  return reduced ? target : value;
}
