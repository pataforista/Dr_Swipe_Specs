import type { GameContext } from '../machines/gameMachine';
import type { CaseOutcome, CaseResult, Specialty } from '../types/game';
import { computeRewards } from './rewardsEngine';

export function buildCaseResult(
  ctx: GameContext,
  outcome: CaseOutcome,
  now: number,
): CaseResult {
  let diffMultiplier = 1;
  if (ctx.difficulty === 'hard') diffMultiplier = 1.5;
  if (ctx.difficulty === 'extreme') diffMultiplier = 2.0;

  const rewards = computeRewards(outcome, diffMultiplier);
  const caseId = ctx.caseId || 'unknown_case';
  const specialty = (caseId.split('_')[0] || 'im') as Specialty;
  
  const pearlId = ctx.pearlId || null;

  return {
    caseId,
    specialty,
    outcome,
    mistakes: ctx.mistakesThisCase || 0,
    lethalErrors: ctx.lethalErrorsThisCase || 0,
    timeSpentMs: now - (ctx.caseStartedAt || now),
    xpEarned: rewards.xpEarned,
    coinsEarned: rewards.coinsEarned,
    pearlId: outcome === 'failed' ? null : pearlId,
  };
}
