import { setup, assign } from 'xstate';
import type { Card } from '../types/game';

interface GameContext {
  deck: Card[];
  dossier: Card[];
  discarded: Card[];
  currentCardIndex: number;
  fatalError: string | null;
  score: number;
  combo: number;
  multiplier: number;
}

type GameEvent =
  | { type: 'START_GUARD'; deck: Card[] }
  | { type: 'SWIPE'; direction: 'left' | 'right' }
  | { type: 'TRIGGER_BOSS' }
  | { type: 'ANSWER_CORRECT' }
  | { type: 'ANSWER_WRONG'; error: string }
  | { type: 'CLAIM' }
  | { type: 'RESTART' };

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  actions: {
    resetGame: assign({
      deck: [],
      dossier: [],
      discarded: [],
      currentCardIndex: 0,
      fatalError: null,
      score: 0,
      combo: 0,
      multiplier: 1
    })
  }
}).createMachine({
  id: 'drSwipeEngine',
  initial: 'idle',
  context: {
    deck: [],
    dossier: [],
    discarded: [],
    currentCardIndex: 0,
    fatalError: null,
    score: 0,
    combo: 0,
    multiplier: 1
  },
  states: {
    idle: {
      on: {
        START_GUARD: {
          target: 'triage',
          actions: assign({
            deck: ({ event }) => event.deck,
            dossier: [],
            discarded: [],
            currentCardIndex: 0,
            fatalError: null,
            score: 0,
            combo: 0,
            multiplier: 1
          })
        }
      }
    },
    triage: {
      always: [
        { 
          target: 'critical_alert', 
          guard: ({ context }) => context.currentCardIndex >= context.deck.length && context.deck.length > 0 
        }
      ],
      on: {
        SWIPE: [
          {
            target: 'ghosted',
            guard: ({ context, event }) => {
              const card = context.deck[context.currentCardIndex];
              if (!card) return false;
              const isLethalKeep = event.direction === 'right' && card.safety_flags?.lethal_risk;
              const isLethalDiscard = event.direction === 'left' && card.safety_flags?.lethal_if_discarded;
              return !!(isLethalKeep || isLethalDiscard);
            },
            actions: assign({
              fatalError: ({ context }) => {
                const card = context.deck[context.currentCardIndex];
                return card.scoring?.vazquez_comment || "Fallo crítico de seguridad.";
              }
            })
          },
          {
            target: 'triage',
            actions: assign({
              combo: ({ context, event }) => {
                const card = context.deck[context.currentCardIndex];
                const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') || 
                                  (event.direction === 'left' && card.expected_action === 'discard');
                return isCorrect ? context.combo + 1 : 0;
              },
              multiplier: ({ context, event }) => {
                const card = context.deck[context.currentCardIndex];
                const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') || 
                                  (event.direction === 'left' && card.expected_action === 'discard');
                if (!isCorrect) return 1;
                const newCombo = context.combo + 1;
                return 1 + Math.floor(newCombo / 5) * 0.5; // X1.5 at 5, X2.0 at 10, etc.
              },
              score: ({ context, event }) => {
                const card = context.deck[context.currentCardIndex];
                const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') || 
                                  (event.direction === 'left' && card.expected_action === 'discard');
                const nextCombo = isCorrect ? context.combo + 1 : 0;
                const nextMultiplier = isCorrect ? (1 + Math.floor(nextCombo / 5) * 0.5) : 1;
                const points = isCorrect ? card.scoring.points : -Math.floor(card.scoring.points / 2);
                return context.score + Math.floor(points * nextMultiplier);
              },
              dossier: ({ context, event }) => event.direction === 'right' 
                ? [...context.dossier, context.deck[context.currentCardIndex]] 
                : context.dossier,
              discarded: ({ context, event }) => event.direction === 'left' 
                ? [...context.discarded, context.deck[context.currentCardIndex]] 
                : context.discarded,
              currentCardIndex: ({ context }) => context.currentCardIndex + 1
            })
          }
        ]
      }
    },
    critical_alert: {
      after: {
        2000: { target: 'boss_fight' }
      }
    },
    boss_fight: {
      on: {
        ANSWER_CORRECT: { target: 'reward' },
        ANSWER_WRONG: {
          target: 'ghosted',
          actions: assign({ fatalError: ({ event }) => (event.type === 'ANSWER_WRONG' ? event.error : "Error en el Shock Room") })
        }
      }
    },
    reward: {
      on: { CLAIM: { target: 'idle', actions: ['resetGame'] } }
    },
    ghosted: {
      on: { RESTART: { target: 'idle', actions: ['resetGame'] } }
    }
  }
});
