import { useCodexStore } from '../store/useCodexStore';

/**
 * Centralized haptic feedback patterns for consistent mobile experience.
 */

// Ordered by weight. Every correct swipe used to fire `criticalSuccess`
// (7 pulses), so the strong pattern meant nothing by the time a milestone came.
const hapticPatterns = {
  correctTap: [12],
  correctCritical: [25, 40, 25],
  dragHeavy: [10, 10],
  warning: [60, 40, 60],
  criticalSuccess: [50, 30, 50, 30, 50, 30, 100],
  lethalError: [200, 100, 200, 100, 500],
  timeoutAlarm: [500, 100, 500, 100, 1000],
} as const;

export type HapticPattern = keyof typeof hapticPatterns;

/**
 * Whether a vibration can actually reach the player.
 *
 * iOS Safari (and any WebKit-based browser on iOS) does not implement
 * navigator.vibrate, and there is no web API that drives the Taptic Engine.
 * This is a platform limit, not a bug to fix here: don't try to "repair" it
 * with another vibrate() call. When this returns false, useImpactFeedback
 * shows a stronger vignette instead. The error itself already has its own
 * sound (useGameAudio: wrong / lethal), so no extra tone is played.
 */
export function hapticsAvailable(): boolean {
  if (useCodexStore.getState().settings?.hapticsEnabled === false) return false;
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/**
 * Trigger a haptic pattern on supported devices.
 * Silently fails on unsupported devices.
 */
export function triggerHaptic(pattern: HapticPattern): void {
  if (!hapticsAvailable()) return;

  const vibrationPattern = hapticPatterns[pattern];
  try {
    navigator.vibrate(vibrationPattern);
  } catch (e) {
    // Silently fail on unsupported devices
    console.debug('Haptic feedback not supported:', e);
  }
}
