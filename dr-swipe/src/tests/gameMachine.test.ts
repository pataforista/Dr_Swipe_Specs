import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { gameMachine } from '../machines/gameMachine';
import type { Card } from '../types/game';

describe('gameMachine state flow', () => {
  const mockDeck: Card[] = [
    {
      card_id: "card_1",
      ui_icon: "🩺",
      card_text: "Card 1 content",
      category: "neuro",
      expected_action: "keep",
      scoring: { points: 100, vazquez_comment: "cmt1" }
    },
    {
      card_id: "card_2",
      ui_icon: "🩺",
      card_text: "Card 2 content",
      category: "cardio",
      expected_action: "discard",
      scoring: { points: 100, vazquez_comment: "cmt2" }
    },
    {
      card_id: "card_3",
      ui_icon: "🩺",
      card_text: "Card 3 content",
      category: "neuro",
      expected_action: "keep",
      scoring: { points: 100, vazquez_comment: "cmt3" }
    },
    {
      card_id: "card_4",
      ui_icon: "🩺",
      card_text: "Card 4 content",
      category: "cardio",
      expected_action: "discard",
      scoring: { points: 100, vazquez_comment: "cmt4" }
    },
    {
      card_id: "card_5",
      ui_icon: "🩺",
      card_text: "Card 5 content",
      category: "neuro",
      expected_action: "keep",
      scoring: { points: 100, vazquez_comment: "cmt5" }
    },
    {
      card_id: "card_6",
      ui_icon: "🩺",
      card_text: "Card 6 content",
      category: "cardio",
      expected_action: "discard",
      scoring: { points: 100, vazquez_comment: "cmt6" }
    },
    {
      card_id: "card_7",
      ui_icon: "🩺",
      card_text: "Card 7 content",
      category: "neuro",
      expected_action: "keep",
      scoring: { points: 100, vazquez_comment: "cmt7" }
    },
    {
      card_id: "card_8",
      ui_icon: "🩺",
      card_text: "Card 8 content",
      category: "cardio",
      expected_action: "discard",
      scoring: { points: 100, vazquez_comment: "cmt8" }
    }
  ];

  it('should initialize to idle state', () => {
    const actor = createActor(gameMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe('idle');
  });

  it('should transition to triage on START_GUARD', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({
      type: 'START_GUARD',
      deck: mockDeck,
      difficulty: 'standard'
    });
    const state = actor.getSnapshot();
    expect(state.value).toBe('triage');
    expect(state.context.deck).toEqual(mockDeck);
    expect(state.context.lives).toBe(5);
  });

  it('should handle correct swipe progression and combo increment', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GUARD', deck: mockDeck, difficulty: 'standard' });
    
    // Swipe right (keep) on keep card -> Correct!
    actor.send({ type: 'SWIPE', direction: 'right' });
    
    const state = actor.getSnapshot();
    expect(state.context.currentCardIndex).toBe(1);
    expect(state.context.combo).toBe(1);
    expect(state.context.score).toBeGreaterThan(0);
  });

  it('should support UNDO_SWIPE to revert card index, vitalities, and errors', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GUARD', deck: mockDeck, difficulty: 'standard' });
    
    actor.send({ type: 'SWIPE', direction: 'right' });
    
    expect(actor.getSnapshot().context.currentCardIndex).toBe(1);
    
    actor.send({ type: 'UNDO_SWIPE' });
    
    const state = actor.getSnapshot();
    expect(state.context.currentCardIndex).toBe(0);
    expect(state.context.undoCharges).toBe(4); // deducts 1 undo charge
  });

  it('should support BUY_UNDO to increase undo charges', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GUARD', deck: mockDeck, difficulty: 'standard' });
    
    const initialCharges = actor.getSnapshot().context.undoCharges;
    actor.send({ type: 'BUY_UNDO' });
    
    expect(actor.getSnapshot().context.undoCharges).toBe(initialCharges + 1);
  });

  it('should transition to fail_protection on lives depleted and allow RESCUE', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GUARD', deck: mockDeck, difficulty: 'standard' });

    // Swipe wrong until vitality reaches 0 (7 wrong swipes)
    for (let s = 0; s < 7; s++) {
      const deck = actor.getSnapshot().context.deck;
      const currentIdx = actor.getSnapshot().context.currentCardIndex;
      const card = deck[currentIdx % deck.length];
      const dir = card?.expected_action === 'keep' ? 'left' : 'right';
      actor.send({ type: 'SWIPE', direction: dir });
    }

    expect(actor.getSnapshot().value).toBe('fail_protection');
    
    // Now rescue
    actor.send({ type: 'RESCUE' });
    const state = actor.getSnapshot();
    expect(state.value).toBe('triage');
    expect(state.context.lives).toBe(4);
  });

  it('should transition to ghosted when lives reach 0, and allow REVIVE_INTERN', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GUARD', deck: mockDeck, difficulty: 'standard' });

    // Deplete first 4 lives by rescuing (r = 0 to 3)
    for (let r = 0; r < 4; r++) {
      for (let s = 0; s < 7; s++) {
        const deck = actor.getSnapshot().context.deck;
        const currentIdx = actor.getSnapshot().context.currentCardIndex;
        const card = deck[currentIdx % deck.length];
        const dir = card?.expected_action === 'keep' ? 'left' : 'right';
        actor.send({ type: 'SWIPE', direction: dir });
      }
      
      const snapshot = actor.getSnapshot();
      if (snapshot.value === 'fail_protection') {
        actor.send({ type: 'RESCUE' });
      }
    }

    // Now we are at lives = 1. Deplete the final life to go to ghosted.
    for (let s = 0; s < 7; s++) {
      const deck = actor.getSnapshot().context.deck;
      const currentIdx = actor.getSnapshot().context.currentCardIndex;
      const card = deck[currentIdx % deck.length];
      const dir = card?.expected_action === 'keep' ? 'left' : 'right';
      actor.send({ type: 'SWIPE', direction: dir });
    }

    let snapshot = actor.getSnapshot();
    if (snapshot.value === 'fail_protection') {
      actor.send({ type: 'RESCUE' }); // lives becomes 0, returns to triage
    }

    // Now we are in triage with lives = 0. Swipe wrong 7 times:
    for (let s = 0; s < 7; s++) {
      const deck = actor.getSnapshot().context.deck;
      const currentIdx = actor.getSnapshot().context.currentCardIndex;
      const card = deck[currentIdx % deck.length];
      const dir = card?.expected_action === 'keep' ? 'left' : 'right';
      actor.send({ type: 'SWIPE', direction: dir });
    }

    snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('ghosted');

    // Revive intern test
    actor.send({ type: 'REVIVE_INTERN' });
    const revivedState = actor.getSnapshot();
    expect(revivedState.value).toBe('triage');
    expect(revivedState.context.lives).toBe(1);
  });
});
