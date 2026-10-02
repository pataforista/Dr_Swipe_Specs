import type { CaseOutcome } from '../types/game';

export function computeRewards(
  outcome: CaseOutcome,
  difficulty: number,
): { xpEarned: number; coinsEarned: number } {
  const baseXP = difficulty * 20;
  const multiplier =
    outcome === 'perfect'              ? 2.0 :
    outcome === 'correct_with_errors'  ? 1.0 :
    outcome === 'rescued'              ? 0.5 :
                                         0.0; // failed
  const xp = Math.round(baseXP * multiplier);
  return { xpEarned: xp, coinsEarned: Math.round(xp * 0.1) };
}

export function computeSuccessOutcome(
  wasRescued: boolean,
  mistakesThisCase: number,
): CaseOutcome {
  if (wasRescued) return 'rescued';
  if (mistakesThisCase === 0) return 'perfect';
  return 'correct_with_errors';
}
