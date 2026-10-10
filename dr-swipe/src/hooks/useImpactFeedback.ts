import { useCallback, useRef } from 'react';

/** How long a lethal mistake freezes input and the clock. */
export const HIT_STOP_MS = 220;

export type ImpactKind = 'normal' | 'lethal';

const SHAKE: Keyframe[] = [
  { transform: 'translate3d(0, 0, 0)' },
  { transform: 'translate3d(-6px, 0, 0)' },
  { transform: 'translate3d(5px, 0, 0)' },
  { transform: 'translate3d(-4px, 0, 0)' },
  { transform: 'translate3d(3px, 0, 0)' },
  { transform: 'translate3d(0, 0, 0)' },
];

// Hit-stop: the screen recoils and holds still for the freeze, then shakes.
// The hold is what makes the hit read; a shake alone looks like any miss.
const holdEnd = HIT_STOP_MS / 520;
const LETHAL: Keyframe[] = [
  { transform: 'translate3d(0, 0, 0) scale(1)', offset: 0 },
  { transform: 'translate3d(0, 0, 0) scale(0.985)', offset: 0.04 },
  { transform: 'translate3d(0, 0, 0) scale(0.985)', offset: holdEnd },
  { transform: 'translate3d(-9px, 0, 0) scale(1)', offset: holdEnd + 0.1 },
  { transform: 'translate3d(7px, 0, 0)', offset: holdEnd + 0.22 },
  { transform: 'translate3d(-5px, 0, 0)', offset: holdEnd + 0.34 },
  { transform: 'translate3d(3px, 0, 0)', offset: holdEnd + 0.46 },
  { transform: 'translate3d(0, 0, 0) scale(1)', offset: 1 },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Screen shake + red vignette for a mistake, run through the Web Animations
 * API. The previous CSS classes stayed on the root for 2 s, so a second
 * mistake inside that window could not restart the animation and went
 * unfelt. Each call here cancels the running one and starts over.
 *
 * Only transform and opacity animate (composited); with reduced motion the
 * shake is dropped and only the vignette shows.
 */
export function useImpactFeedback() {
  const rootRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const running = useRef<Animation[]>([]);

  const playImpact = useCallback((kind: ImpactKind) => {
    running.current.forEach(a => a.cancel());
    running.current = [];
    const root = rootRef.current;
    const vignette = vignetteRef.current;
    if (vignette?.animate) {
      running.current.push(kind === 'lethal'
        ? vignette.animate(
            [{ opacity: 0 }, { opacity: 1, offset: 0.06 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }],
            { duration: 700, easing: 'ease-out' })
        : vignette.animate([{ opacity: 0 }, { opacity: 0.75, offset: 0.3 }, { opacity: 0 }], { duration: 280, easing: 'ease-out' }));
    }
    if (root?.animate && !prefersReducedMotion()) {
      running.current.push(kind === 'lethal'
        ? root.animate(LETHAL, { duration: 520, easing: 'linear' })
        : root.animate(SHAKE, { duration: 300, easing: 'ease-in-out' }));
    }
  }, []);

  return { rootRef, vignetteRef, playImpact };
}
