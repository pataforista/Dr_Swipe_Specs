import type { Card } from '../types/game';

/**
 * Centralized haptic feedback patterns for consistent mobile experience.
 */

const hapticPatterns = {
  lethalError: [200, 100, 200, 100, 500],
  warning: [100, 50, 100],
  timeoutAlarm: [500, 100, 500, 100, 1000],
  criticalSuccess: [50, 30, 50, 30, 50, 30, 100],
  cardSwipe: [20, 10, 20],
  dragHeavy: [10, 10],
  qteInteract: [30, 20, 30]
} as const;

export type HapticPattern = keyof typeof hapticPatterns;

/**
 * Trigger a haptic pattern on supported devices.
 * Silently fails on unsupported devices.
 */
export function triggerHaptic(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  const vibrationPattern = hapticPatterns[pattern];
  try {
    navigator.vibrate(vibrationPattern);
  } catch (e) {
    // Silently fail on unsupported devices
    console.debug('Haptic feedback not supported:', e);
  }
}

/**
 * Resolve the haptic pattern for a swipe based on its clinical outcome.
 *
 * Tactile reinforcement of the decision: a correct call feels rewarding, a
 * mistake feels like a warning, and a mistake on a lethal card delivers the
 * harsher "lethalError" buzz so the body remembers the stakes, not just the eyes.
 */
export function getSwipeHapticPattern(card: Card, direction: 'left' | 'right'): HapticPattern {
  const chosenAction = direction === 'right' ? 'keep' : 'discard';
  const isCorrect = chosenAction === card.expected_action;

  if (isCorrect) {
    return 'criticalSuccess';
  }

  const isLethal = card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded;
  return isLethal ? 'lethalError' : 'warning';
}

/**
 * Stop all ongoing vibrations.
 */
export function stopHaptic(): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return;
  }

  try {
    navigator.vibrate(0);
  } catch (e) {
    console.debug('Failed to stop haptic:', e);
  }
}
