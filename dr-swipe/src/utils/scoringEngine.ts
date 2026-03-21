import type { Card } from '../types/game';

export interface GameContextForScoring {
  combo: number;
  multiplier: number;
  difficulty: string;
  dossier: Card[];
  lastCardPresentedAt: number;
}

export interface ScoreBreakdown {
  basePoints: number;
  comboMultiplier: number;
  difficultyMultiplier: number;
  speedBonus: number;
  dossierMultiplier: number;
  finalPoints: number;
  bonusType: 'speed' | 'dossier' | 'combo' | 'none';
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
    // Lethal risks have heavy penalties
    if (card.safety_flags?.lethal_risk) {
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
      dossierMultiplier: 1,
      finalPoints: basePoints,
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
  let bonusType: 'speed' | 'dossier' | 'combo' | 'none' = 'none';

  if (timeTaken !== undefined && timeTaken < 1200) {
    speedBonus = 1.2;
    bonusType = 'speed';
  }

  // Dossier synergy multiplier (check for related diagnoses)
  let dossierMultiplier = 1;
  if (card.related_diagnoses && context.dossier.length > 0) {
    let matchCount = 0;
    for (const diagnosis of card.related_diagnoses) {
      const hasMatch = context.dossier.some(
        (dCard) =>
          dCard.related_diagnoses?.includes(diagnosis) ||
          dCard.category === diagnosis
      );
      if (hasMatch) {
        matchCount++;
        if (matchCount >= 3) break; // Cap at 3 matches
      }
    }
    if (matchCount > 0) {
      dossierMultiplier = 1 + matchCount * 0.2; // 1.2x, 1.4x, 1.6x per match
      bonusType = 'dossier';
    }
  }

  // If we have combo multiplier but no dossier bonus, prefer showing combo
  if (comboMultiplier > 1 && bonusType === 'none') {
    bonusType = 'combo';
  }

  const finalPoints = Math.floor(
    basePoints * comboMultiplier * difficultyMultiplier * speedBonus * dossierMultiplier
  );

  return {
    basePoints,
    comboMultiplier,
    difficultyMultiplier,
    speedBonus,
    dossierMultiplier,
    finalPoints,
    bonusType
  };
}
