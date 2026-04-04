import { setup, assign } from 'xstate';
import type { Card, EnarmPearl } from '../types/game';
import { cleanVazquezComment } from '../utils/formatters';
import { calculateCardScore, COMBO_MILESTONES } from '../utils/scoringEngine';
import rewardData from '../data/lore/rewardItems.json';
import penaltyData from '../data/lore/penaltyItems.json';

const rewardItemsList = rewardData.rewardItems;
const penaltyItemsList = penaltyData.penaltyItems;

import labData from '../data/lore/labEvents.json';
import archiveData from '../data/lore/archiveEvents.json';
import systemicData from '../data/lore/systemicEvents.json';

const labEventsList = labData.labEvents;
const archiveEventsList = archiveData.archiveEvents;
const systemicEventsList = systemicData.systemicEvents;

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
  // QTE context
  qteActive: boolean;
  qteTimeLeft: number;
  // Interruption context
  interruptionActive: boolean;
  lastInterruptionAt: number;
  // Coin & lifeline context
  coinsEarnedThisCase: number;
  mistakesThisCase: number;
  lifelineActive: boolean; // true = hint is currently showing
  comboMilestoneHit: number; // last milestone combo reached (5,10,15,20), 0 if none
  vitality: number; // 0-100 (Health/Life)
  consecutiveErrors: number;
  lootBoxReward: { active: boolean; item: any } | null;
  activePenalty: { active: boolean; item: any } | null;
  activeEvent: { type: 'lab' | 'archive' | 'systemic'; item: any } | null;
  feedbackHistory: Array<{
    cardId: string;
    cardText: string;
    isCorrect: boolean;
    feedback: string;
    category: string;
    points: number;
    expectedAction: 'keep' | 'discard';
  }>;
  // Shift (Guardia) context
  isSandiaMode: boolean;
  totalCasesInShift: number;
  casesCompleted: number;
  lives: number; // Number of interns left (max 5)
  // Rewind (Undo) context
  undoCharges: number;
  lastAction: {
    vitality: number;
    score: number;
    combo: number;
    multiplier: number;
    dossier: Card[];
    feedbackHistory: any[];
    coinsEarnedThisCase: number;
    mistakesThisCase: number;
  } | null;
}

type GameEvent =
  | { type: 'START_GUARD'; deck: Card[]; difficulty: string; pearl: EnarmPearl; isSandiaMode?: boolean }
  | { type: 'SWIPE'; direction: 'left' | 'right' }
  | { type: 'UNDO_SWIPE' }
  | { type: 'TRIGGER_BOSS' }
  | { type: 'ANSWER_CORRECT' }
  | { type: 'ANSWER_WRONG'; error: string }
  | { type: 'CLAIM' }
  | { type: 'RESTART' }
  | { type: 'TIME_OUT' }
  | { type: 'TRIGGER_URGENCY' }
  | { type: 'RESOLVE_URGENCY' }
  | { type: 'CLEAR_VISUALS' }
  | { type: 'CLEAR_OVERLAYS' }
  | { type: 'VIEW_DEBRIEF' }
  | { type: 'QTE_TIMER_TICK' }
  | { type: 'QTE_INTERACT' }
  | { type: 'TRIGGER_INTERRUPTION' }
  | { type: 'RESOLVE_INTERRUPTION' }
  | { type: 'USE_LIFELINE' }
  | { type: 'APPLY_REWARD_HEAL'; value: number }
  | { type: 'CONTINUE_SHIFT'; deck: Card[]; puzzle: any; isSandiaMode?: boolean } // deck of the NEXT case
  | { type: 'RESCUE' }
  | { type: 'CLEAR_MILESTONE' };

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
      lastCardPresentedAt: 0,
      showEureka: false,
      isUrgent: false,
      showBloodVignette: false,
      debriefData: null,
      qteActive: false,
      qteTimeLeft: 0,
      interruptionActive: false,
      lastInterruptionAt: 0,
      coinsEarnedThisCase: 0,
      mistakesThisCase: 0,
      lifelineActive: false,
      comboMilestoneHit: 0,
      vitality: 100,
      consecutiveErrors: 0,
      lootBoxReward: null,
      activePenalty: null,
      activeEvent: null,
      feedbackHistory: [],
      undoCharges: 5,
      lastAction: null
    }),
    clearVisuals: assign({
      showEureka: false,
      showBloodVignette: false
    }),
    clearOverlays: assign({
      lootBoxReward: null,
      activePenalty: null,
      activeEvent: null
    }),
    applyRewardHeal: assign(({ context, event }) => {
      if (event.type !== 'APPLY_REWARD_HEAL') return {};
      // Sandia mode: no heal needed as there is no damage, but we allow it for consistency
      return {
        vitality: Math.min(100, context.vitality + event.value),
        lootBoxReward: null
      };
    }),
    handleCardSwipe: assign(({ context, event }) => {
      if (event.type !== 'SWIPE') return {};
      const card = context.deck[context.currentCardIndex];
      if (!card) return {};

      // Store current state for Undo
      const lastActionState = {
        vitality: context.vitality,
        score: context.score,
        combo: context.combo,
        multiplier: context.multiplier,
        dossier: [...context.dossier],
        feedbackHistory: [...context.feedbackHistory],
        coinsEarnedThisCase: context.coinsEarnedThisCase,
        mistakesThisCase: context.mistakesThisCase
      };

      const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') ||
                        (event.direction === 'left' && card.expected_action === 'discard');

      const timeTaken = Date.now() - context.lastCardPresentedAt;

      // Use centralized scoring engine
      const scoreBreakdown = calculateCardScore(
        card,
        {
          combo: context.combo,
          multiplier: context.multiplier,
          difficulty: context.difficulty,
          dossier: context.dossier,
          lastCardPresentedAt: context.lastCardPresentedAt
        },
        isCorrect,
        timeTaken
      );

      const nextCombo = isCorrect ? context.combo + 1 : 0;

      // Vitality Logic: +8 on correct, -15 on wrong (more forgiving, rewards learning)
      // SANDIA MODE: No health reduction
      const vitalityChange = isCorrect ? 8 : (context.isSandiaMode ? 0 : -15);
      const nextVitality = Math.max(0, Math.min(100, context.vitality + vitalityChange));

      // Error Tracking
      // Changed from 3 to 5 consecutive errors to avoid frustration during learning phase
      const nextConsecutiveErrors = isCorrect ? 0 : context.consecutiveErrors + 1;
      let nextPenalty = context.activePenalty;
      if (nextConsecutiveErrors >= 5) {
        nextPenalty = {
          active: true,
          item: penaltyItemsList[Math.floor(Math.random() * penaltyItemsList.length)]
        };
      }

      // Loot Box logic: Trigger every 8 combo hits (más frecuente para permitir recuperación)
      // Cambio: 10 → 8 para dar más oportunidades de curación y motivar racha positiva
      let nextLootBox = context.lootBoxReward;
      if (isCorrect && nextCombo > 0 && nextCombo % 8 === 0) {
        nextLootBox = {
          active: true,
          item: rewardItemsList[Math.floor(Math.random() * rewardItemsList.length)]
        };
      }

      // Tactical Dossier Combo Logic
      let nextDossier = [...context.dossier];
      let hasEureka = false;

      if (event.direction === 'right') {
        nextDossier.push(card);
        // Check if last 3 match category
        if (nextDossier.length >= 3) {
          const last3 = nextDossier.slice(-3);
          if (last3.every(c => c.category === card.category)) {
            hasEureka = true;
          }
        }
      }

      // Check for interruption trigger (combo >= 5 y 8% chance para menos disrupción)
      // Cambio: Combo >= 3 → 5, Chance 15% → 8% para mantener el flow del jugador
      let shouldTriggerInterruption = false;
      if (isCorrect && nextCombo >= 5 && Math.random() < 0.08) {
        const timeSinceLastInterruption = Date.now() - context.lastInterruptionAt;
        if (timeSinceLastInterruption > 45000) { // Increased cooldown from 30s to 45s
          shouldTriggerInterruption = true;
        }
      }

      // Random Probabilistic Events (Lab, Archive, Systemic) - 5% chance if answering correctly
      let nextEvent = context.activeEvent;
      if (isCorrect && !nextEvent && Math.random() < 0.05) {
        const eventPool = Math.random();
        if (eventPool < 0.4) {
          nextEvent = { type: 'lab', item: labEventsList[Math.floor(Math.random() * labEventsList.length)] };
        } else if (eventPool < 0.8) {
          nextEvent = { type: 'archive', item: archiveEventsList[Math.floor(Math.random() * archiveEventsList.length)] };
        } else {
          nextEvent = { type: 'systemic', item: systemicEventsList[Math.floor(Math.random() * systemicEventsList.length)] };
        }
      }

      const milestoneHit = (COMBO_MILESTONES as readonly number[]).includes(nextCombo) ? nextCombo : 0;

      // Calculate feedback for history
      const feedbackText = cleanVazquezComment(card.scoring?.vazquez_comment, isCorrect);
      const newHistoryItem = {
        cardId: card.card_id,
        cardText: card.card_text,
        isCorrect,
        feedback: feedbackText,
        category: card.category,
        points: scoreBreakdown.finalPoints,
        expectedAction: card.expected_action
      };

      return {
        combo: nextCombo,
        vitality: nextVitality,
        consecutiveErrors: nextConsecutiveErrors >= 5 ? 0 : nextConsecutiveErrors,
        lootBoxReward: nextLootBox,
        activePenalty: nextPenalty,
        activeEvent: nextEvent,
        multiplier: scoreBreakdown.comboMultiplier,
        score: Math.max(0, context.score + (context.isSandiaMode ? Math.floor(scoreBreakdown.finalPoints * 0.5) : scoreBreakdown.finalPoints)),
        dossier: nextDossier,
        showEureka: hasEureka,
        currentCardIndex: context.currentCardIndex + 1,
        lastCardPresentedAt: Date.now(),
        interruptionActive: shouldTriggerInterruption,
        lastInterruptionAt: shouldTriggerInterruption ? Date.now() : context.lastInterruptionAt,
        coinsEarnedThisCase: context.coinsEarnedThisCase + (context.isSandiaMode ? Math.floor(scoreBreakdown.coinsEarned * 0.5) : scoreBreakdown.coinsEarned),
        mistakesThisCase: isCorrect ? context.mistakesThisCase : context.mistakesThisCase + 1,
        lifelineActive: false, // Reset lifeline after swipe
        comboMilestoneHit: milestoneHit,
        feedbackHistory: [...context.feedbackHistory, newHistoryItem],
        lastAction: lastActionState
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
    debriefData: null,
    qteActive: false,
    qteTimeLeft: 0,
    interruptionActive: false,
    lastInterruptionAt: 0,
    coinsEarnedThisCase: 0,
    mistakesThisCase: 0,
    lifelineActive: false,
    comboMilestoneHit: 0,
    vitality: 100,
    consecutiveErrors: 0,
    activePenalty: null,
    lootBoxReward: null,
    activeEvent: null,
    feedbackHistory: [],
    totalCasesInShift: 1,
    casesCompleted: 0,
    lives: 5,
    isSandiaMode: false,
    undoCharges: 5,
    lastAction: null
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
            }),
            qteActive: false,
            qteTimeLeft: 0,
            interruptionActive: false,
            lastInterruptionAt: 0,
            coinsEarnedThisCase: 0,
            mistakesThisCase: 0,
            lifelineActive: false,
            comboMilestoneHit: 0,
            vitality: 100,
            lootBoxReward: null,
            feedbackHistory: [],
            totalCasesInShift: 3, // Default to 3 cases for a full shift
            casesCompleted: 0,
            lives: 5,
            isSandiaMode: ({ event }) => event.type === 'START_GUARD' ? !!event.isSandiaMode : false
          })
        }
      }
    },
    triage: {
      always: [
        {
          target: 'interruption_active',
          guard: ({ context }) => context.interruptionActive
        },
        {
          target: 'fail_protection',
          guard: ({ context }) => context.vitality <= 0,
          actions: assign({
            fatalError: () => "VITALIDAD AGOTADA: El paciente se ha desestabilizado."
          })
        },
        {
          target: 'critical_alert',
          guard: ({ context }) => context.currentCardIndex >= context.deck.length && context.deck.length > 0
        }
      ],
      on: {
        SWIPE: {
          target: 'triage',
          actions: ['handleCardSwipe']
        },
        UNDO_SWIPE: {
          target: 'triage',
          guard: ({ context }) => context.undoCharges > 0 && context.currentCardIndex > 0 && context.lastAction !== null,
          actions: assign(({ context }) => {
            if (!context.lastAction) return {};
            return {
              currentCardIndex: Math.max(0, context.currentCardIndex - 1),
              vitality: context.lastAction.vitality,
              score: context.lastAction.score,
              combo: context.lastAction.combo,
              multiplier: context.lastAction.multiplier,
              dossier: context.lastAction.dossier,
              feedbackHistory: context.lastAction.feedbackHistory,
              coinsEarnedThisCase: context.lastAction.coinsEarnedThisCase,
              mistakesThisCase: context.lastAction.mistakesThisCase,
              undoCharges: context.undoCharges - 1,
              lastAction: null
            };
          })
        },
        TIME_OUT: {
          target: 'fail_protection',
          actions: assign({
            fatalError: () => "Tiempo agotado. El paciente se desestabilizó.",
          })
        },
        TRIGGER_URGENCY: {
          target: 'urgent_triage'
        },
        CLEAR_VISUALS: {
          actions: 'clearVisuals'
        },
        CLEAR_OVERLAYS: {
          actions: 'clearOverlays'
        },
        USE_LIFELINE: {
          actions: assign({ lifelineActive: true })
        },
        CLEAR_MILESTONE: {
          actions: assign({ comboMilestoneHit: 0 })
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
    interruption_active: {
      entry: assign({ showBloodVignette: false }),
      on: {
        RESOLVE_INTERRUPTION: {
          target: 'triage',
          actions: assign({ interruptionActive: false })
        }
      },
      after: {
        2000: {
          target: 'triage',
          actions: assign({ interruptionActive: false })
        }
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
          target: 'fail_protection',
          actions: assign({ fatalError: () => "Código Rojo Fallido: El paciente no resistió." })
        }
      }
    },
    critical_alert: {
      after: {
        1000: { target: 'boss_fight' }
      }
    },
    boss_fight: {
      entry: assign({
        qteActive: true,
        qteTimeLeft: 5
      }),
      on: {
        QTE_TIMER_TICK: {
          actions: assign({
            qteTimeLeft: ({ context }) => Math.max(0, context.qteTimeLeft - 1)
          })
        },
        QTE_INTERACT: {
          target: 'reward',
          actions: assign({
            caseStreak: ({ context }) => context.caseStreak + 1,
            score: ({ context }) => context.score + (context.caseStreak * 500),
            qteActive: false,
            qteTimeLeft: 0
          })
        },
        ANSWER_CORRECT: {
          target: 'reward',
          actions: assign({
            caseStreak: ({ context }) => context.caseStreak + 1,
            score: ({ context }) => context.score + (context.caseStreak * 500), // Streak Bonus
            qteActive: false,
            qteTimeLeft: 0
          })
        },
        ANSWER_WRONG: {
          target: 'fail_protection',
          actions: assign({
            fatalError: ({ event }) => event.type === 'ANSWER_WRONG' ? event.error : "Error en Shock Room",
            caseStreak: 0,
            qteActive: false,
            qteTimeLeft: 0
          })
        }
      },
      after: {
        5000: {
          guard: ({ context }) => context.qteActive && context.qteTimeLeft <= 0,
          target: 'fail_protection',
          actions: assign({
            fatalError: () => "QTE Fallido: El paciente se desestabilizó.",
            caseStreak: 0,
            qteActive: false
          })
        }
      }
    },
    reward: {
      on: { 
        CLAIM: [
          {
            guard: ({ context }) => context.casesCompleted + 1 < context.totalCasesInShift,
            target: 'triage',
            actions: assign({
              casesCompleted: ({ context }) => context.casesCompleted + 1,
              // We'll need to inject the new deck here or wait for CONTINUE_SHIFT
            })
          },
          { target: 'idle', actions: ['resetGame'] }
        ],
        CONTINUE_SHIFT: {
          target: 'triage',
          actions: assign({
            deck: ({ event }) => event.deck,
            currentCardIndex: 0,
            casesCompleted: ({ context }) => context.casesCompleted + 1,
            debriefData: ({ event }) => ({
              title: event.puzzle?.title || "Siguiente Paciente",
              text: event.puzzle?.text || "",
              gpc: event.puzzle?.gpc_ref || "GPC en vigor",
              comment: ""
            }),
            lastCardPresentedAt: Date.now(),
            feedbackHistory: [],
            mistakesThisCase: 0,
            coinsEarnedThisCase: 0
          })
        },
        RESTART: { target: 'idle', actions: ['resetGame'] } 
      }
    },
    fail_protection: {
      always: [
        {
          target: 'ghosted',
          guard: ({ context }) => context.lives <= 1
        }
      ],
      on: {
        RESCUE: {
          target: 'triage',
          actions: assign({
            lives: ({ context }) => context.lives - 1,
            vitality: 100,
            currentCardIndex: 0, // Restart current case cards for learning
            caseStreak: 0
          })
        },
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
