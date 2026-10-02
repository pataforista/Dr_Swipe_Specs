/**
 * SWIPE PHYSICS FOR DR. SWIPE
 * ===========================
 * Tuned to feel like Tinder: the card pivots from below its centre, follows
 * the finger a little in Y, commits on a light flick, and keeps its momentum
 * on the way out instead of fading while it flies.
 */

export const SWIPE_CONFIG = {
  // Decision thresholds
  DRAG_THRESHOLD: 0.32, // fraction of card width; a deliberate drag, not a heavy one
  VELOCITY_THRESHOLD: 0.5, // px/ms: a light flick commits
  MIN_FLICK_OFFSET: 24, // px: a flick needs this much travel, so a tap or jitter never commits

  // Dimensions
  CARD_WIDTH: 320,

  // Follow the finger vertically, but only a little (Tinder style)
  DRAG_Y_LIMIT: 70,
  // Rotation pivot sits below the card, so the top swings wider than the bottom
  PIVOT_Y: 1.15,
  MAX_DRAG_ROTATION: 14, // degrees, reached at +-ROTATION_RANGE px
  ROTATION_RANGE: 260,

  // Exit specs
  EXIT_DURATION: 0.22, // seconds at zero velocity; the decision is registered at T+0
  EXIT_DURATION_MIN: 0.13,
  EXIT_DISTANCE: 560,
  EXIT_ROTATION: 28,

  // A gesture shorter than this is judged by its average speed too: the
  // pointer velocity framer reports is smoothed per frame and under-reads quick flicks.
  FLICK_WINDOW_MS: 300,

  // Ignore a second commit this soon after the first (held key / double tap)
  MIN_SWIPE_INTERVAL_MS: 140,

  // Momentum carry: 1.0 px/ms of release velocity adds this many px to the exit
  MOMENTUM_MULTIPLIER: 120,
  Y_OFFSET: -30, // toss upward

  // Snap-back spring when the drag is not enough
  RETURN_SPRING: { type: 'spring' as const, stiffness: 380, damping: 26 },
};

export type SwipeDirection = 'left' | 'right';

/**
 * Decides whether a released drag commits. Distance commits on its own;
 * otherwise a flick commits if it is fast enough AND travelled a little.
 * A flick goes the way the finger was moving, not the way the card was offset
 * (a quick flick right after a small drag left must not go left).
 *
 * `velocityX` is px/ms. Returns null when the card should snap back.
 */
export function decideSwipe(offsetX: number, velocityX: number, cardWidth: number = SWIPE_CONFIG.CARD_WIDTH): SwipeDirection | null {
  const distance = cardWidth * SWIPE_CONFIG.DRAG_THRESHOLD;
  if (Math.abs(offsetX) > distance) return offsetX > 0 ? 'right' : 'left';
  const isFlick = Math.abs(velocityX) > SWIPE_CONFIG.VELOCITY_THRESHOLD && Math.abs(offsetX) > SWIPE_CONFIG.MIN_FLICK_OFFSET;
  if (isFlick) return velocityX > 0 ? 'right' : 'left';
  return null;
}

/** Faster release, shorter flight; buttons and keys (velocity 0) get the full duration. */
export const exitDuration = (velocityX: number) => {
  const speed = Math.min(2.5, Math.abs(velocityX));
  return Math.max(SWIPE_CONFIG.EXIT_DURATION_MIN, SWIPE_CONFIG.EXIT_DURATION - speed * 0.04);
};

/**
 * Exit pose including momentum carry. Opacity is NOT part of it: the card stays
 * solid for most of the flight and only fades at the very end (see SwipeDeck).
 */
export const calculateExitPosition = (direction: SwipeDirection, velocityX: number) => {
  const sign = direction === 'right' ? 1 : -1;
  // Only momentum in the exit direction adds distance.
  const carry = Math.max(0, velocityX * sign) * SWIPE_CONFIG.MOMENTUM_MULTIPLIER;
  return {
    x: sign * (SWIPE_CONFIG.EXIT_DISTANCE + carry),
    y: SWIPE_CONFIG.Y_OFFSET,
    rotate: sign * SWIPE_CONFIG.EXIT_ROTATION,
  };
};

/**
 * Release velocity (px/ms) used to judge a flick. Takes the faster of the
 * reported pointer velocity and, for short gestures, offset / elapsed time.
 */
export function releaseVelocity(reportedVx: number, offsetX: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || elapsedMs > SWIPE_CONFIG.FLICK_WINDOW_MS) return reportedVx;
  const average = offsetX / elapsedMs;
  return Math.abs(average) > Math.abs(reportedVx) && Math.sign(average) === Math.sign(offsetX) ? average : reportedVx;
}
