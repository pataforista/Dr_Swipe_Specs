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
 * Trigger a haptic pattern on supported devices.
 * Silently fails on unsupported devices.
 */
export function triggerHaptic(pattern: HapticPattern): void {
  const store = useCodexStore.getState();
  if (store.settings && !store.settings.hapticsEnabled) {
    return;
  }

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
