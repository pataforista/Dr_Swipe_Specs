import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine } from '../machines/gameMachine';
import { resolveRewardEffect } from '../utils/rewardEffects';
import rewards from '../data/lore/rewardItems.json';
import type { Card } from '../types/game';

const card = (id: string, expected: 'keep' | 'discard'): Card => ({
  card_id: id, ui_icon: '🩺', card_text: id, category: 'neuro', expected_action: expected,
  scoring: { points: 100, vazquez_comment: 'c' },
});

describe('reward effects', () => {
  it('every authored reward does something and says what', () => {
    for (const r of rewards.rewardItems) {
      const fx = resolveRewardEffect(r.efecto);
      const acts = fx.heal || fx.shield || fx.undo || fx.hint || fx.seconds;
      expect(acts, r.id).toBeTruthy();
      expect(fx.description.length, r.id).toBeGreaterThan(5);
    }
  });

  it('shield absorbs the vitality hit of a wrong swipe', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GUARD', deck: [card('a', 'keep'), card('b', 'keep')], difficulty: 'standard' });
    actor.send({ type: 'APPLY_REWARD', heal: 0, shield: 1, undo: 0, hint: false });
    expect(actor.getSnapshot().context.shieldCharges).toBe(1);
    const before = actor.getSnapshot().context.vitality;
    actor.send({ type: 'SWIPE', direction: 'left' }); // wrong
    expect(actor.getSnapshot().context.vitality).toBe(before);
    expect(actor.getSnapshot().context.shieldCharges).toBe(0);
    actor.send({ type: 'SWIPE', direction: 'left' }); // wrong again, no shield left
    expect(actor.getSnapshot().context.vitality).toBeLessThan(before);
  });

  it('grants an undo charge and a hint', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GUARD', deck: [card('a', 'keep')], difficulty: 'standard' });
    const undo = actor.getSnapshot().context.undoCharges;
    actor.send({ type: 'APPLY_REWARD', heal: 0, shield: 0, undo: 1, hint: true });
    expect(actor.getSnapshot().context.undoCharges).toBe(undo + 1);
    expect(actor.getSnapshot().context.lifelineActive).toBe(true);
  });
});
