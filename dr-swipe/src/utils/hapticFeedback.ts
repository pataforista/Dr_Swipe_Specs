import { useCodexStore } from '../store/useCodexStore';

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
