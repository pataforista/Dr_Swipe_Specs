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
  warningCount: number;
  caseStreak: number;
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
      warningCount: 0,
      // caseStreak persists until ghosted - don't reset in resetGame? 
      // Actually, resetGame is for a fresh start.
      caseStreak: 0,
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
    warningCount: 0,
    caseStreak: 0,
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
            target: 'critical_warning',
            guard: ({ context, event }) => {
              const card = context.deck[context.currentCardIndex];
              if (!card) return false;
              const isLethal = !!((event.direction === 'right' && card.safety_flags?.lethal_risk) || 
                               (event.direction === 'left' && card.safety_flags?.lethal_if_discarded));
              
              // Learning Curve: Warning limit decreases as streak increases
              let maxWarnings = 2; // R1: 2 Warnings (0-2 streak)
              if (context.caseStreak >= 6) maxWarnings = 0; // Adscrito: 0 Warnings (6+ streak)
              else if (context.caseStreak >= 3) maxWarnings = 1; // R2/R3: 1 Warning (3-5 streak)

              return isLethal && context.warningCount < maxWarnings;
            },
            actions: assign({
              warningCount: ({ context }) => context.warningCount + 1,
              score: ({ context }) => context.score - 1000,
              fatalError: ({ context }) => {
                const card = context.deck[context.currentCardIndex];
                const msg = cleanVazquezComment(card.scoring?.vazquez_comment, false);
                return `¡ADVERTENCIA! ${msg || "Error de seguridad detectado."}`;
              }
            })
          },
          {
            target: 'ghosted',
            guard: ({ context, event }) => {
              const card = context.deck[context.currentCardIndex];
              if (!card) return false;
              const isLethal = !!((event.direction === 'right' && card.safety_flags?.lethal_risk) || 
                               (event.direction === 'left' && card.safety_flags?.lethal_if_discarded));
              
              let maxWarnings = 2;
              if (context.caseStreak >= 6) maxWarnings = 0;
              else if (context.caseStreak >= 3) maxWarnings = 1;

              return isLethal && context.warningCount >= maxWarnings;
            },
            actions: assign({
              fatalError: ({ context }) => {
                const card = context.deck[context.currentCardIndex];
                const msg = cleanVazquezComment(card.scoring?.vazquez_comment, false);
                return `FALLO LETAL REINCIDENTE: ${msg || "Negligencia inexcusable."}`;
              },
              caseStreak: 0,
              debriefData: ({ context }) => {
                const card = context.deck[context.currentCardIndex];
                return {
                  ...context.debriefData!,
                  comment: cleanVazquezComment(card.scoring?.vazquez_comment, false) || "Negligencia."
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
                return 1 + Math.floor((context.combo + 1) / 5) * 0.5;
              },
              score: ({ context, event }) => {
                const card = context.deck[context.currentCardIndex];
                const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') || 
                                  (event.direction === 'left' && card.expected_action === 'discard');
                const nextCombo = isCorrect ? context.combo + 1 : 0;
                const nextMultiplier = isCorrect ? (1 + Math.floor(nextCombo / 5) * 0.5) : 1;
                const points = isCorrect ? card.scoring.points : -Math.floor(card.scoring.points / 2);
                const diffMultiplier = context.difficulty === 'extreme' ? 2 : (context.difficulty === 'hard' ? 1.5 : 1);
                return context.score + Math.floor(points * nextMultiplier * diffMultiplier);
              },
              currentCardIndex: ({ context }) => context.currentCardIndex + 1
            })
          }
        ],
        TIME_OUT: {
          target: 'ghosted',
          actions: assign({
            fatalError: () => "Tiempo agotado. El paciente se desestabilizó.",
            caseStreak: 0
          })
        }
      }
    },
    critical_warning: {
      after: {
        3000: { target: 'triage' }
      }
    },
    critical_alert: {
      after: {
        2000: { target: 'boss_fight' }
      }
    },
    boss_fight: {
      on: {
        ANSWER_CORRECT: { 
          target: 'reward',
          actions: assign({
            caseStreak: ({ context }) => context.caseStreak + 1,
            score: ({ context }) => context.score + (context.caseStreak * 500) // Streak Bonus
          })
        },
        ANSWER_WRONG: {
          target: 'ghosted',
          actions: assign({
            fatalError: ({ event }) => event.type === 'ANSWER_WRONG' ? event.error : "Error en Shock Room",
            caseStreak: 0
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
