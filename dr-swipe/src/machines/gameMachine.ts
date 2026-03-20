import { setup, assign } from 'xstate';
import type { Card, EnarmPearl } from '../types/game';
import { cleanVazquezComment } from '../utils/formatters';

interface GameContext {
  deck: Card[];
  dossier: Card[];
  discarded: Card[];
  currentCardIndex: number;
  fatalError: string | null;
  score: number;
  combo: number;
  multiplier: number;
  difficulty: string;
  debriefData: { title: string; text: string; gpc: string; comment: string } | null;
}

type GameEvent =
  | { type: 'START_GUARD'; deck: Card[]; difficulty: string; pearl: EnarmPearl }
  | { type: 'SWIPE'; direction: 'left' | 'right' }
  | { type: 'TRIGGER_BOSS' }
  | { type: 'ANSWER_CORRECT' }
  | { type: 'ANSWER_WRONG'; error: string }
  | { type: 'CLAIM' }
  | { type: 'RESTART' }
  | { type: 'TIME_OUT' }
  | { type: 'VIEW_DEBRIEF' };

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
      multiplier: 1,
      debriefData: null
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
    multiplier: 1,
    difficulty: 'standard',
    debriefData: null
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
            multiplier: 1,
            difficulty: ({ event }) => event.difficulty,
            debriefData: ({ event }) => ({
              title: event.pearl?.title || "Repaso Clínico",
              text: event.pearl?.text || "",
              gpc: event.pearl?.gpc_ref || "GPC en vigor",
              comment: ""
            })
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
                const cleanMsg = cleanVazquezComment(card.scoring?.vazquez_comment, false);
                return `FALLO LETAL: ${cleanMsg || "Fallo crítico de seguridad."}`;
              },
              debriefData: ({ context }) => {
                const card = context.deck[context.currentCardIndex];
                const cleanMsg = cleanVazquezComment(card.scoring?.vazquez_comment, false);
                return {
                  ...context.debriefData!,
                  comment: `VÁZQUEZ: He detectado una desviación letal. ${cleanMsg}`
                };
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
                
                // Difficulty Scaling
                const diffMultiplier = context.difficulty === 'extreme' ? 2 : (context.difficulty === 'hard' ? 1.5 : 1);
                
                return context.score + Math.floor(points * nextMultiplier * diffMultiplier);
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
        ],
        TIME_OUT: {
          target: 'ghosted',
          actions: assign({
            fatalError: () => "Tiempo agotado. El paciente se desestabilizó por falta de atención rápida."
          })
        }
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
          actions: assign({
            fatalError: ({ event }) => {
              if (event.type === 'ANSWER_WRONG') {
                return event.error;
              }
              return "Error en el Shock Room";
            },
            debriefData: ({ context, event }) => {
              const errorMessage = event.type === 'ANSWER_WRONG' ? event.error : "Fallo en protocolo de choque.";
              return {
                ...context.debriefData!,
                comment: errorMessage
              };
            }
          })
        }
      }
    },
    reward: {
      on: { 
        CLAIM: { target: 'idle', actions: ['resetGame'] },
        RESTART: { target: 'idle', actions: ['resetGame'] } 
      }
    },
    ghosted: {
      on: { 
        VIEW_DEBRIEF: { target: 'debrief' },
        RESTART: { target: 'idle', actions: ['resetGame'] } 
      }
    },
    debrief: {
      on: { RESTART: { target: 'idle', actions: ['resetGame'] } }
    }
  }
});
