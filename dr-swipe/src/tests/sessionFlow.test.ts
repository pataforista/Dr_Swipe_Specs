import { describe, it, expect, vi } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine } from '../machines/gameMachine';
import { computeSessionMetrics, specialtyFromCaseId, gradeFor } from '../utils/sessionEngine';
import { useCodexStore, migrateCodexState } from '../store/useCodexStore';
import type { Card, CaseResult } from '../types/game';

const card = (i: number, action: 'keep' | 'discard'): Card => ({
  card_id: `c${i}`, ui_icon: 'x', category: 'neuro', card_text: `t${i}`,
  expected_action: action, scoring: { points: 100 },
});
const deck = [card(1, 'keep'), card(2, 'discard')];
const answer = (a: ReturnType<typeof createActor<typeof gameMachine>>, ok: boolean) => {
  for (const c of deck) {
    const right = c.expected_action === 'keep' ? 'right' : 'left';
    const wrong = right === 'right' ? 'left' : 'right';
    a.send({ type: 'SWIPE', direction: ok ? right : wrong });
  }
};
const result = (o: Partial<CaseResult> = {}): CaseResult => ({
  caseId: 'PROC_PED_X_001_001', specialty: 'ped', outcome: 'perfect', mistakes: 0,
  lethalErrors: 0, timeSpentMs: 1000, cardsSeen: 10, xpEarned: 40, coinsEarned: 4, pearlId: null, ...o,
});

describe('shift flow', () => {
  it('records each cleared case, keeps its counters for the reward screen and ends in victoria_guardia', () => {
    vi.useFakeTimers();
    try {
      const a = createActor(gameMachine).start();
      a.send({ type: 'START_GUARD', deck, difficulty: 'standard', case_id: 'PROC_PED_X_001_001' });
      expect(a.getSnapshot().context.session.startedAt).toBeGreaterThan(0);
      answer(a, false); // two misses
      vi.advanceTimersByTime(1600); // critical_alert -> boss_fight
      a.send({ type: 'ANSWER_CORRECT' });
      let snap = a.getSnapshot();
      expect(snap.matches('reward')).toBe(true);
      expect(snap.context.session.caseResults).toHaveLength(1);
      expect(snap.context.session.caseResults[0]).toMatchObject({ caseId: 'PROC_PED_X_001_001', specialty: 'ped', outcome: 'correct_with_errors', mistakes: 2, cardsSeen: 2 });
      expect(snap.context.mistakesThisCase).toBe(2); // reward screen still needs it

      a.send({ type: 'FINISH_SHIFT' });
      snap = a.getSnapshot();
      expect(snap.matches('victoria_guardia')).toBe(true);
      expect(snap.context.session.caseResults).toHaveLength(1);

      a.send({ type: 'RESTART' });
      expect(a.getSnapshot().matches('idle')).toBe(true);
      expect(a.getSnapshot().context.session.caseResults).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('tracks the best combo of the shift', () => {
    const a = createActor(gameMachine).start();
    a.send({ type: 'START_GUARD', deck, difficulty: 'standard', case_id: 'PROC_PED_X_001_001' });
    answer(a, true);
    expect(a.getSnapshot().context.session.maxCombo).toBe(2);
  });
});

describe('computeSessionMetrics', () => {
  it('derives precision, survival, grade and review count from results', () => {
    const m = computeSessionMetrics({
      startedAt: 1, maxCombo: 7,
      caseResults: [result(), result({ outcome: 'correct_with_errors', mistakes: 2 }), result({ outcome: 'failed', mistakes: 1, cardsSeen: 5, caseId: 'PROC_OBS_Y_001_001' })],
    });
    expect(m.casesCompleted).toBe(2);
    expect(m.casesFailed).toBe(1);
    expect(m.precision).toBeCloseTo(1 - 3 / 25);
    expect(m.maxCombo).toBe(7);
    expect(m.casesScheduledAhead).toBe(2); // quality 3 and 1
    expect(m.xpEarned).toBe(120);
  });

  it('prefers the real payout and handles an empty shift', () => {
    expect(computeSessionMetrics({ startedAt: 1, maxCombo: 0, caseResults: [result()] }, { xp: 99, coins: 9 }).xpEarned).toBe(99);
    const empty = computeSessionMetrics({ startedAt: 1, maxCombo: 0, caseResults: [] });
    expect(empty.precision).toBe(0);
    expect(empty.grade).toBe('C');
  });

  it('grades and maps case ids to specialties', () => {
    expect(gradeFor(1, 1)).toBe('S');
    expect(gradeFor(0.9, 1)).toBe('A');
    expect(gradeFor(0.75, 0.5)).toBe('B');
    expect(specialtyFromCaseId('PROC_PED_EXANT_MEASLES_001_014')).toBe('ped');
    expect(specialtyFromCaseId('PROC_ENDO_DM2_MANAGEMENT_001_002')).toBe('im');
    expect(specialtyFromCaseId('weird')).toBe('im');
  });
});

describe('commitSession and SRS in the store', () => {
  it('schedules a failure for tomorrow and a perfect case for later; is cumulative', () => {
    const now = 1_000_000;
    useCodexStore.setState({ caseProgress: {} });
    const { commitSession, getCasesDueForReview } = useCodexStore.getState();
    commitSession([result({ caseId: 'A', outcome: 'failed', mistakes: 3 }), result({ caseId: 'B' })], now);
    const p = useCodexStore.getState().caseProgress;
    expect(p.A.interval).toBe(1);
    expect(p.A.lapses).toBe(1);
    expect(p.B.interval).toBe(1);
    expect(getCasesDueForReview(now)).toEqual([]);
    expect(getCasesDueForReview(now + 2 * 86_400_000).sort()).toEqual(['A', 'B']);
    commitSession([result({ caseId: 'B' })], now + 86_400_000);
    expect(useCodexStore.getState().caseProgress.B.interval).toBe(6);
  });

  it('migrates v1 caseStats to caseProgress without losing cases', () => {
    const migrated = migrateCodexState(
      { caseStats: { X: { timesSolved: 1, mistakes: 2, bestScore: 10 }, Y: { timesSolved: 3, mistakes: 0, bestScore: 50 } } }, 1,
    ) as { caseStats: object; caseProgress: Record<string, { nextReviewDate: number; lapses: number }> };
    expect(Object.keys(migrated.caseProgress).sort()).toEqual(['X', 'Y']);
    expect(migrated.caseProgress.X.nextReviewDate).toBeLessThanOrEqual(Date.now());
    expect(migrated.caseProgress.Y.nextReviewDate).toBeGreaterThan(Date.now());
    expect(Object.keys(migrated.caseStats)).toEqual(['X', 'Y']);
  });
});
