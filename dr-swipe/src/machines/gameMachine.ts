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
  | { type: 'VIEW_DEBRIEF' }
  | { type: 'QTE_TIMER_TICK' }
  | { type: 'QTE_INTERACT' }
  | { type: 'TRIGGER_INTERRUPTION' }
  | { type: 'RESOLVE_INTERRUPTION' }
  | { type: 'USE_LIFELINE' }
  | { type: 'APPLY_REWARD_HEAL'; value: number }
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
      // caseStreak is intentionally NOT reset here so consecutive victories
      // keep raising difficulty (adaptive learning curve). It only resets on failure.
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
      feedbackHistory: []
    }),
    clearVisuals: assign({
      showEureka: false,
      showBloodVignette: false,
      lootBoxReward: null,
      activePenalty: null,
      activeEvent: null
    }),
    applyRewardHeal: assign(({ context, event }) => {
      if (event.type !== 'APPLY_REWARD_HEAL') return {};
      return {
        vitality: Math.min(100, context.vitality + event.value),
        lootBoxReward: null
      };
    }),
    handleCardSwipe: assign(({ context, event }) => {
      if (event.type !== 'SWIPE') return {};
      const card = context.deck[context.currentCardIndex];
      if (!card) return {};

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
      
      // Vitality Logic: +5 on correct, -20 on wrong
      const vitalityChange = isCorrect ? 5 : -25;
      const nextVitality = Math.max(0, Math.min(100, context.vitality + vitalityChange));

      // Error Tracking
      const nextConsecutiveErrors = isCorrect ? 0 : context.consecutiveErrors + 1;
      let nextPenalty = context.activePenalty;
      if (nextConsecutiveErrors >= 3) {
        nextPenalty = {
          active: true,
          item: penaltyItemsList[Math.floor(Math.random() * penaltyItemsList.length)]
        };
      }

      // Loot Box logic: Trigger every 10 combo hits
      let nextLootBox = context.lootBoxReward;
      if (isCorrect && nextCombo > 0 && nextCombo % 10 === 0) {
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

      // Check for interruption trigger (combo >= 3 and 15% chance)
      let shouldTriggerInterruption = false;
      if (isCorrect && nextCombo >= 3 && Math.random() < 0.15) {
        const timeSinceLastInterruption = Date.now() - context.lastInterruptionAt;
        if (timeSinceLastInterruption > 30000) { // No more than one interruption per 30 seconds
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

      // Track combo milestone hits
      const milestoneHit = (COMBO_MILESTONES as readonly number[]).includes(nextCombo) ? nextCombo : 0;

      return {
        combo: nextCombo,
        vitality: nextVitality,
        consecutiveErrors: nextConsecutiveErrors >= 3 ? 0 : nextConsecutiveErrors,
        lootBoxReward: nextLootBox,
        activePenalty: nextPenalty,
        activeEvent: nextEvent,
        multiplier: scoreBreakdown.comboMultiplier,
        score: context.score + scoreBreakdown.finalPoints,
        dossier: nextDossier,
        showEureka: hasEureka,
        currentCardIndex: context.currentCardIndex + 1,
        lastCardPresentedAt: Date.now(),
        interruptionActive: shouldTriggerInterruption,
        lastInterruptionAt: shouldTriggerInterruption ? Date.now() : context.lastInterruptionAt,
        coinsEarnedThisCase: context.coinsEarnedThisCase + scoreBreakdown.coinsEarned,
        mistakesThisCase: isCorrect ? context.mistakesThisCase : context.mistakesThisCase + 1,
        lifelineActive: false, // Reset lifeline after swipe
        comboMilestoneHit: milestoneHit
      };
    }),
    recordFeedback: assign(({ context, event }) => {
      if (event.type !== 'SWIPE') return {};
      const card = context.deck[context.currentCardIndex];
      if (!card) return {};

      // Map 'right' to 'keep' and 'left' to 'discard'
      const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') || 
                        (event.direction === 'left' && card.expected_action === 'discard');
      
      return {
        feedbackHistory: [
          ...context.feedbackHistory,
          {
            cardId: card.card_id,
            cardText: card.card_text,
            isCorrect,
            feedback: cleanVazquezComment(card.scoring?.vazquez_comment, isCorrect),
            category: card.category,
            points: isCorrect ? 500 : -1000, 
            expectedAction: card.expected_action
          }
        ]
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
    feedbackHistory: []
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
            feedbackHistory: []
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
          target: 'ghosted',
          guard: ({ context }) => context.vitality <= 0,
          actions: assign({
            fatalError: () => "VITALIDAD AGOTADA: El paciente ha sucumbido por errores técnicos acumulados."
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
          actions: ['handleCardSwipe', 'recordFeedback']
        },
        TIME_OUT: {
          target: 'ghosted',
          actions: assign({
            fatalError: () => "Tiempo agotado. El paciente se desestabilizó.",
            caseStreak: 0
          })
        },
        TRIGGER_URGENCY: {
          target: 'urgent_triage'
        },
        CLEAR_VISUALS: {
          actions: 'clearVisuals'
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
          actions: ['handleCardSwipe', 'recordFeedback', assign({ isUrgent: false })]
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
          target: 'ghosted',
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
          target: 'ghosted',
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
