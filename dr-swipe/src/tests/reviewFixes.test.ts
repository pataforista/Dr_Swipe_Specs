import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine } from '../machines/gameMachine';
import { specialtyFromCaseId } from '../utils/sessionEngine';
import type { Card } from '../types/game';

const card = (id: string, action: 'keep' | 'discard', lethal = false): Card => ({
  card_id: id,
  ui_icon: '🩺',
  category: 'hx',
  card_text: id,
  expected_action: action,
  scoring: { points: 100 },
  safety_flags: lethal ? { lethal_risk: true } : undefined,
});

const deck = [card('a', 'keep', true), card('b', 'discard'), card('c', 'keep'), card('d', 'discard')];

describe('fixes from the full review', () => {
  it('ABANDONAR from the pause menu leaves triage', () => {
    const a = createActor(gameMachine).start();
    a.send({ type: 'START_GUARD', deck, difficulty: 'standard' });
    a.send({ type: 'SWIPE', direction: 'right' });
    a.send({ type: 'RESTART' });
    expect(a.getSnapshot().matches('idle')).toBe(true);
    expect(a.getSnapshot().context.score).toBe(0);
  });

  it('counts an explicit lethal miss, and undo reverts it', () => {
    const a = createActor(gameMachine).start();
    a.send({ type: 'START_GUARD', deck, difficulty: 'standard' });
    a.send({ type: 'SWIPE', direction: 'left' }); // lethal card discarded
    expect(a.getSnapshot().context.lethalErrorsThisCase).toBe(1);
    a.send({ type: 'UNDO_SWIPE' });
    expect(a.getSnapshot().context.lethalErrorsThisCase).toBe(0);
  });

  it('undo gives back a shield charge spent on the reverted mistake', () => {
    const a = createActor(gameMachine).start();
    a.send({ type: 'START_GUARD', deck, difficulty: 'standard' });
    a.send({ type: 'APPLY_REWARD', heal: 0, shield: 1, undo: 0, hint: false });
    a.send({ type: 'SWIPE', direction: 'left' });
    expect(a.getSnapshot().context.shieldCharges).toBe(0);
    a.send({ type: 'UNDO_SWIPE' });
    expect(a.getSnapshot().context.shieldCharges).toBe(1);
  });

  it('a rescued case does not inherit the combo of the failed attempt', () => {
    const a = createActor(gameMachine).start();
    a.send({ type: 'START_GUARD', deck, difficulty: 'standard' });
    a.send({ type: 'SWIPE', direction: 'right' });
    a.send({ type: 'SWIPE', direction: 'left' });
    expect(a.getSnapshot().context.combo).toBe(2);
    a.send({ type: 'TIME_OUT' });
    a.send({ type: 'RESCUE' });
    expect(a.getSnapshot().context).toMatchObject({ combo: 0, multiplier: 1 });
  });

  it('a study-mode save resumes in study mode', () => {
    const a = createActor(gameMachine).start();
    a.send({
      type: 'RESUME_GUARD', deck, difficulty: 'standard', isSandiaMode: true,
      snapshot: { currentCardIndex: 1, score: 10, combo: 1, multiplier: 1, caseStreak: 0, coinsEarnedThisCase: 1, mistakesThisCase: 0 },
    });
    expect(a.getSnapshot().context.isSandiaMode).toBe(true);
    expect(a.getSnapshot().context.undoCharges).toBe(5);
  });

  it('PSYC case ids map to psychiatry', () => {
    expect(specialtyFromCaseId('PROC_PSYC_DEPRESSION_001_001')).toBe('psych');
  });
});
