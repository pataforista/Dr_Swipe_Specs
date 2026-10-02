import type { GameContext } from '../machines/gameMachine';
import type { CaseOutcome, CaseResult, SessionMetrics, SessionState, Specialty } from '../types/game';
import { computeRewards } from './rewardsEngine';
import { outcomeToQuality } from './srsEngine';

/** Case ids look like `PROC_PED_EXANT_MEASLES_001_014`: the area is the 2nd token. */
const SPECIALTY_BY_TOKEN: Record<string, Specialty> = {
  PED: 'ped',
  OBS: 'obs',
  OBG: 'obs',
  GYN: 'gyn',
  INT: 'im',
  ENDO: 'im',
  SURG: 'surg',
  NEUR: 'neur',
  INF: 'inf',
  PREV: 'prev',
  STATS: 'stats',
  ENGL: 'engl',
  PSYCH: 'psych',
};

export function specialtyFromCaseId(caseId: string): Specialty {
  const token = caseId.split('_')[1]?.toUpperCase() ?? '';
  return SPECIALTY_BY_TOKEN[token] ?? 'im';
}

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

  return {
    caseId,
    specialty: specialtyFromCaseId(caseId),
    outcome,
    mistakes: ctx.mistakesThisCase || 0,
    lethalErrors: ctx.lethalErrorsThisCase || 0,
    timeSpentMs: now - (ctx.caseStartedAt || now),
    // A failed case is judged on the cards decided before it collapsed.
    cardsSeen: outcome === 'failed' ? ctx.currentCardIndex : ctx.deck.length,
    xpEarned: rewards.xpEarned,
    coinsEarned: rewards.coinsEarned,
    pearlId: outcome === 'failed' ? null : ctx.pearlId || null,
  };
}

export function gradeFor(precision: number, survivalRate: number): SessionMetrics['grade'] {
  if (precision >= 0.95 && survivalRate === 1) return 'S';
  if (precision >= 0.85 && survivalRate >= 0.66) return 'A';
  if (precision >= 0.7) return 'B';
  return 'C';
}

/**
 * Summary of a shift, derived only from its case results (ADR 007).
 * `payout` replaces the estimated XP/coins when the caller knows what was
 * actually granted (the per-case payout also depends on score and daily streak).
 * `casesScheduledAhead` counts cases that come back within a day under SM-2
 * (quality below 4), i.e. the ones worth reviewing.
 */
export function computeSessionMetrics(
  session: SessionState,
  payout?: { xp: number; coins: number },
): SessionMetrics {
  const results = session.caseResults;
  const casesFailed = results.filter(r => r.outcome === 'failed').length;
  const casesCompleted = results.length - casesFailed;
  const cards = results.reduce((n, r) => n + r.cardsSeen, 0);
  const mistakes = results.reduce((n, r) => n + r.mistakes, 0);
  const precision = cards > 0 ? Math.max(0, 1 - mistakes / cards) : 0;
  const survivalRate = results.length > 0 ? casesCompleted / results.length : 0;

  return {
    precision,
    survivalRate,
    grade: gradeFor(precision, survivalRate),
    xpEarned: payout?.xp ?? results.reduce((n, r) => n + r.xpEarned, 0),
    coinsEarned: payout?.coins ?? results.reduce((n, r) => n + r.coinsEarned, 0),
    maxCombo: session.maxCombo,
    casesCompleted,
    casesFailed,
    casesScheduledAhead: results.filter(r => outcomeToQuality(r) < 4).length,
  };
}
