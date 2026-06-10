import type { Card } from '../types/game';

export interface GameContextForScoring {
  combo: number;
  multiplier: number;
  difficulty: string;
  lastCardPresentedAt: number;
}

export interface ScoreBreakdown {
  basePoints: number;
  comboMultiplier: number;
  difficultyMultiplier: number;
  speedBonus: number;
  finalPoints: number;
  coinsEarned: number;
  bonusType: 'speed' | 'combo' | 'none';
}

/**
 * Coin thresholds for combo milestones.
 * Reaching these combo counts awards bonus coins.
 * Reducido de [5,10,15,20] a [5,8,12,16] para celebraciones más frecuentes
 */
export const COMBO_MILESTONES = [5, 8, 12, 16, 20] as const;
export const COMBO_MILESTONE_COINS = { 5: 8, 8: 15, 12: 25, 16: 40, 20: 60 } as const;

/**
 * Calculate bonus coins for perfect round (zero mistakes across all cards).
 */
export function calculatePerfectRoundBonus(totalCards: number, difficulty: string): number {
  const base = totalCards * 10;
  const mult = difficulty === 'extreme' ? 3 : difficulty === 'hard' ? 2 : 1;
  return base * mult;
}

/**
 * Calculate daily streak multiplier (caps at x2.0 after 7 consecutive days).
 */
export function getDailyStreakMultiplier(streak: number): number {
  return Math.min(2.0, 1 + streak * 0.1);
}

/**
 * Calculate card score with full breakdown.
 * Centralized scoring logic for consistent calculations across the game.
 */
export function calculateCardScore(
  card: Card,
  context: GameContextForScoring,
  isCorrect: boolean,
  timeTaken?: number
): ScoreBreakdown {
  // Base points
  let basePoints = card.scoring.points;
  if (!isCorrect) {
    // Lethal risks have heavy penalties. Both lethal_risk and lethal_if_discarded
    // are surfaced to the player as "¡Letal!", so they must carry the same weight.
    if (card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded) {
      basePoints = -1000;
    } else {
      basePoints = -Math.floor(card.scoring.points / 2);
    }
  }

  // Add bonus for decision critical cards
  if (isCorrect && card.safety_flags?.decision_critical) {
    basePoints += 50;
  }

  if (!isCorrect) {
    return {
      basePoints,
      comboMultiplier: 1,
      difficultyMultiplier: 1,
      speedBonus: 1,
      finalPoints: basePoints,
      coinsEarned: 0,
      bonusType: 'none'
    };
  }

  // Combo multiplier
  const nextCombo = context.combo + 1;
  const comboMultiplier = 1 + Math.floor(nextCombo / 5) * 0.5;

  // Difficulty multiplier
  const difficultyMultiplier =
    context.difficulty === 'extreme' ? 2 : context.difficulty === 'hard' ? 1.5 : 1;

  // Perfect Swipe Logic (x1.2)
  let speedBonus = 1;
  let bonusType: 'speed' | 'combo' | 'none' = 'none';

  if (timeTaken !== undefined && timeTaken < 1200) {
    speedBonus = 1.2;
    bonusType = 'speed';
  }

  // If we have a combo multiplier, surface it as the bonus
  if (comboMultiplier > 1 && bonusType === 'none') {
    bonusType = 'combo';
  }

  const finalPoints = Math.floor(
    basePoints * comboMultiplier * difficultyMultiplier * speedBonus
  );

  // Coin calculation: 1 base + bonus for speed/combo milestones
  let coinsEarned = 1;
  if (speedBonus > 1) coinsEarned += 2; // Speed bonus coins
  if (comboMultiplier > 1) coinsEarned += Math.floor(comboMultiplier); // Combo coins
  // Milestone bonus coins
  const milestone = COMBO_MILESTONES.find(m => m === nextCombo);
  if (milestone) coinsEarned += COMBO_MILESTONE_COINS[milestone];

  return {
    basePoints,
    comboMultiplier,
    difficultyMultiplier,
    speedBonus,
    finalPoints,
    coinsEarned,
    bonusType
  };
}
