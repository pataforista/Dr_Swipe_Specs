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
  lastCardPresentedAt: number;
  showEureka: boolean;
  isUrgent: boolean;
  showBloodVignette: boolean;
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
  | { type: 'TRIGGER_URGENCY' }
  | { type: 'RESOLVE_URGENCY' }
  | { type: 'CLEAR_VISUALS' }
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
      caseStreak: 0,
      lastCardPresentedAt: 0,
      showEureka: false,
      isUrgent: false,
      showBloodVignette: false,
      debriefData: null
    }),
    clearVisuals: assign({
      showEureka: false,
      showBloodVignette: false
    }),
    handleCardSwipe: assign(({ context, event }) => {
      if (event.type !== 'SWIPE') return {};
      const card = context.deck[context.currentCardIndex];
      if (!card) return {};

      const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') || 
                        (event.direction === 'left' && card.expected_action === 'discard');
      
      const nextCombo = isCorrect ? context.combo + 1 : 0;
      const nextMultiplier = isCorrect ? (1 + Math.floor(nextCombo / 5) * 0.5) : 1;
      const points = isCorrect ? card.scoring.points : -Math.floor(card.scoring.points / 2);
      
      // Perfect Swipe Logic (x1.2)
      const timeTaken = Date.now() - context.lastCardPresentedAt;
      const speedBonus = (isCorrect && timeTaken < 1200) ? 1.2 : 1;
      
      // Tactical Dossier Combo Logic
      let nextDossier = [...context.dossier];
      let hasEureka = false;
      let tacticalBonus = 1;

      if (event.direction === 'right') {
        nextDossier.push(card);
        // Check if last 3 match category
        if (nextDossier.length >= 3) {
          const last3 = nextDossier.slice(-3);
          if (last3.every(c => c.category === card.category)) {
            hasEureka = true;
            tacticalBonus = 2.0; // Combo de Claridad
          }
        }
      }

      const diffMultiplier = context.difficulty === 'extreme' ? 2 : (context.difficulty === 'hard' ? 1.5 : 1);
      const finalPoints = Math.floor(points * nextMultiplier * diffMultiplier * speedBonus * tacticalBonus);

      return {
        combo: nextCombo,
        multiplier: nextMultiplier,
        score: context.score + finalPoints,
        dossier: nextDossier,
        showEureka: hasEureka,
        currentCardIndex: context.currentCardIndex + 1,
        lastCardPresentedAt: Date.now()
      };
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
    lastCardPresentedAt: 0,
    showEureka: false,
    isUrgent: false,
    showBloodVignette: false,
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
            lastCardPresentedAt: Date.now(),
            showEureka: false,
            isUrgent: false,
            showBloodVignette: false,
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
              showBloodVignette: true,
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
            actions: 'handleCardSwipe'
          }
        ],
        TIME_OUT: {
          target: 'ghosted',
          actions: assign({
            fatalError: () => "Tiempo agotado. El paciente se desestabilizó.",
            caseStreak: 0
          })
        },
        CLEAR_VISUALS: {
          actions: 'clearVisuals'
        }
      }
    },
    critical_warning: {
      on: {
        CLEAR_VISUALS: { actions: assign({ showBloodVignette: false }) }
      },
      after: {
        3000: { target: 'triage', actions: assign({ showBloodVignette: false }) }
      }
    },
    urgent_triage: {
      entry: assign({ isUrgent: true, lastCardPresentedAt: Date.now() }),
      on: {
        SWIPE: {
          target: 'triage',
          actions: ['handleCardSwipe', assign({ isUrgent: false })]
        },
        TIME_OUT: {
          target: 'ghosted',
          actions: assign({ fatalError: () => "Código Rojo Fallido: El paciente no resistió.", caseStreak: 0 })
        }
      }
    },
    critical_alert: {
      after: {
        1000: { target: 'boss_fight' }
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
