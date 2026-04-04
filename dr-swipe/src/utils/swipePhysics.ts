/**
 * SWIPE PHYSICS REFINEMENT FOR DR. SWIPE
 * =========================================
 * Implements the tactile satisfaction of Tinder with parallel timing.
 */

export const SWIPE_CONFIG = {
  // Decision Thresholds
  DRAG_THRESHOLD: 0.4, // 40% of card width
  VELOCITY_THRESHOLD: 0.8, // px/ms
  
  // Dimensions
  CARD_WIDTH: 320,
  MAX_ROTATION: 15, // Degrees
  
  // Exit Specs (CRITICAL for "Visceral" feel)
  EXIT_DURATION: 0.25, // seconds (250ms = catarthic)
  REVEAL_DELAY: 0.05, // 50ms next card reveal
  FEEDBACK_TOAST_DELAY: 0.1, // 100ms discrete toast
  
  // Momentum Carry
  MOMENTUM_MULTIPLIER: 100, // exitX = 500 + vx * 100
  Y_OFFSET: -20, // Tossing effect
};

/**
 * Calculates the exit position including momentum carry for visceral satisfaction.
 */
export const calculateExitPosition = (direction: 'left' | 'right', velocityX: number) => {
  const baseExitX = direction === 'right' ? 500 : -500;
  // vx is pixels per ms. 1.0 vx = 100px extra momentum.
  const momentum = velocityX * SWIPE_CONFIG.MOMENTUM_MULTIPLIER;
  
  return {
    x: baseExitX + momentum,
    y: SWIPE_CONFIG.Y_OFFSET,
    opacity: 0,
    rotate: direction === 'right' ? 25 : -25
  };
};

/**
 * Pattern for Haptic Feedback
 */
export const HAPTIC_PATTERNS = {
  DRAG_START: 20,
  SUCCESS_KEEP: [40, 20, 40],
  SUCCESS_DISCARD: 60,
  ERROR: 120,
  UNDO: [20, 40, 60]
};
