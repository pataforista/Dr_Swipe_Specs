import { setup, assign } from 'xstate';
import type { Card, EnarmPearl, LoreItem } from '../types/game';
import { cleanMentorComment } from '../utils/formatters';
import { parseVitalsFromText } from '../utils/vitalsParser';
import { calculateCardScore } from '../utils/scoringEngine';
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

/** Snapshot persisted by the auto-save; used by RESUME_GUARD to restore a session. */
export interface ResumeSnapshot {
  currentCardIndex: number;
  score: number;
  combo: number;
  multiplier: number;
  caseStreak: number;
  coinsEarnedThisCase: number;
  mistakesThisCase: number;
  warningCount: number;
}

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
  debriefData: { title: string; text: string; gpc: string; comment: string } | null;
  // Coin & lifeline context
  coinsEarnedThisCase: number;
  mistakesThisCase: number;
  lifelineActive: boolean; // true = hint is currently showing
  vitality: number; // 0-100 (Health/Life)
  consecutiveErrors: number;
  lootBoxReward: { active: boolean; item: LoreItem } | null;
  activePenalty: { active: boolean; item: LoreItem } | null;
  activeEvent: { type: 'lab' | 'archive' | 'systemic'; item: LoreItem } | null;
  feedbackHistory: Array<{
    cardId: string;
    cardText: string;
    isCorrect: boolean;
    feedback: string;
    category: string;
    points: number;
    expectedAction: 'keep' | 'discard';
  }>;
  lastVitals: { ta?: string; fc?: number; temp?: number; status: string } | null;
  // Shift (Guardia) context
  isSandiaMode: boolean;
  totalCasesInShift: number;
  casesCompleted: number;
  lives: number; // Number of interns left (max 5)
  // Rewind (Undo) context
  undoCharges: number;
  hasRescuedThisCase: boolean;
  lastAction: {
    vitality: number;
    score: number;
    combo: number;
    multiplier: number;
    dossier: Card[];
    discarded: Card[];
    consecutiveErrors: number;
    feedbackHistory: GameContext['feedbackHistory'];
    coinsEarnedThisCase: number;
    mistakesThisCase: number;
    lastVitals: { ta?: string; fc?: number; temp?: number; status: string } | null;
  } | null;
}

type GameEvent =
  | { type: 'START_GUARD'; deck: Card[]; difficulty: string; pearl?: EnarmPearl; isSandiaMode?: boolean }
  | { type: 'RESUME_GUARD'; deck: Card[]; difficulty: string; pearl?: EnarmPearl; snapshot: ResumeSnapshot }
  | { type: 'SWIPE'; direction: 'left' | 'right' }
  | { type: 'UNDO_SWIPE' }
  | { type: 'ANSWER_CORRECT' }
  | { type: 'ANSWER_WRONG'; error: string }
  | { type: 'RESTART' }
  | { type: 'TIME_OUT' }
  | { type: 'CLEAR_OVERLAYS' }
  | { type: 'VIEW_DEBRIEF' }
  | { type: 'USE_LIFELINE' }
  | { type: 'APPLY_REWARD_HEAL'; value: number }
  | { type: 'CONTINUE_SHIFT'; deck: Card[]; puzzle?: EnarmPearl; isSandiaMode?: boolean } // deck of the NEXT case
  | { type: 'RESCUE' }
  | { type: 'BUY_UNDO' }
  | { type: 'REVIVE_INTERN' };

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
      debriefData: null,
      coinsEarnedThisCase: 0,
      mistakesThisCase: 0,
      lifelineActive: false,
      vitality: 100,
      consecutiveErrors: 0,
      lootBoxReward: null,
      activePenalty: null,
      activeEvent: null,
      feedbackHistory: [],
      lastVitals: null,
      isSandiaMode: false,
      undoCharges: 5,
      hasRescuedThisCase: false,
      lastAction: null
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

      // Parse and persist vitals if category matches
      let nextVitals = context.lastVitals;
      if (card.category === 'vitals') {
        const parsed = parseVitalsFromText(card.card_text);
        if (parsed) nextVitals = parsed;
      }

      // Store current state for Undo
      const lastActionState = {
        vitality: context.vitality,
        score: context.score,
        combo: context.combo,
        multiplier: context.multiplier,
        dossier: [...context.dossier],
        discarded: [...context.discarded],
        consecutiveErrors: context.consecutiveErrors,
        feedbackHistory: [...context.feedbackHistory],
        coinsEarnedThisCase: context.coinsEarnedThisCase,
        mistakesThisCase: context.mistakesThisCase,
        lastVitals: context.lastVitals
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
      let nextUndoCharges = context.undoCharges;
      if (nextConsecutiveErrors >= 5) {
        nextPenalty = {
          active: true,
          item: penaltyItemsList[Math.floor(Math.random() * penaltyItemsList.length)]
        };
        nextUndoCharges = Math.max(0, context.undoCharges - 1);
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

      // Dossier tracking (kept cards feed the dossier synergy multiplier & the boss room)
      const nextDossier = [...context.dossier];
      const nextDiscarded = [...context.discarded];
      if (event.direction === 'right') {
        nextDossier.push(card);
      } else {
        nextDiscarded.push(card);
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

      // Calculate feedback for history
      const feedbackText = cleanMentorComment(card.scoring?.vazquez_comment, isCorrect, card);
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
        discarded: nextDiscarded,
        currentCardIndex: context.currentCardIndex + 1,
        lastCardPresentedAt: Date.now(),
        coinsEarnedThisCase: context.coinsEarnedThisCase + (context.isSandiaMode ? Math.floor(scoreBreakdown.coinsEarned * 0.5) : scoreBreakdown.coinsEarned),
        mistakesThisCase: isCorrect ? context.mistakesThisCase : context.mistakesThisCase + 1,
        lifelineActive: false, // Reset lifeline after swipe
        lastVitals: nextVitals,
        feedbackHistory: [...context.feedbackHistory, newHistoryItem],
        lastAction: lastActionState,
        undoCharges: nextUndoCharges
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
    debriefData: null,
    coinsEarnedThisCase: 0,
    mistakesThisCase: 0,
    lifelineActive: false,
    vitality: 100,
    consecutiveErrors: 0,
    activePenalty: null,
    lootBoxReward: null,
    activeEvent: null,
    feedbackHistory: [],
    lastVitals: null,
    totalCasesInShift: 1,
    casesCompleted: 0,
    lives: 5,
    isSandiaMode: false,
    undoCharges: 5,
    hasRescuedThisCase: false,
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
            caseStreak: 0,
            difficulty: ({ event }) => event.difficulty,
            lastCardPresentedAt: Date.now(),
            debriefData: ({ event }) => ({
              title: event.pearl?.title || "Repaso Clínico",
              text: event.pearl?.text || "",
              gpc: event.pearl?.gpc_ref || "GPC en vigor",
              comment: ""
            }),
            coinsEarnedThisCase: 0,
            mistakesThisCase: 0,
            lifelineActive: false,
            vitality: 100,
            lootBoxReward: null,
            feedbackHistory: [],
            totalCasesInShift: 3, // Default to 3 cases for a full shift
            casesCompleted: 0,
            lives: 5,
            isSandiaMode: ({ event }) => event.type === 'START_GUARD' ? !!event.isSandiaMode : false,
            hasRescuedThisCase: false
          })
        },
        RESUME_GUARD: {
          target: 'triage',
          actions: assign({
            deck: ({ event }) => event.deck,
            dossier: [],
            discarded: [],
            // Restore the persisted per-case progress (vitality/lives are not
            // persisted: a resumed case restarts with full vitality, but keeps
            // its card position, score, combo and coins).
            currentCardIndex: ({ event }) => event.snapshot.currentCardIndex,
            score: ({ event }) => event.snapshot.score,
            combo: ({ event }) => event.snapshot.combo,
            multiplier: ({ event }) => event.snapshot.multiplier,
            caseStreak: ({ event }) => event.snapshot.caseStreak,
            coinsEarnedThisCase: ({ event }) => event.snapshot.coinsEarnedThisCase,
            mistakesThisCase: ({ event }) => event.snapshot.mistakesThisCase,
            warningCount: ({ event }) => event.snapshot.warningCount,
            fatalError: null,
            difficulty: ({ event }) => event.difficulty,
            lastCardPresentedAt: Date.now(),
            debriefData: ({ event }) => ({
              title: event.pearl?.title || "Repaso Clínico",
              text: event.pearl?.text || "",
              gpc: event.pearl?.gpc_ref || "GPC en vigor",
              comment: ""
            }),
            lifelineActive: false,
            vitality: 100,
            lootBoxReward: null,
            activePenalty: null,
            activeEvent: null,
            feedbackHistory: [],
            totalCasesInShift: 1, // resumed sessions run a single case
            casesCompleted: 0,
            lives: 5,
            isSandiaMode: false,
            undoCharges: 5,
            hasRescuedThisCase: false,
            lastAction: null
          })
        }
      }
    },
    triage: {
      always: [
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
              discarded: context.lastAction.discarded,
              consecutiveErrors: context.lastAction.consecutiveErrors,
              feedbackHistory: context.lastAction.feedbackHistory,
              coinsEarnedThisCase: context.lastAction.coinsEarnedThisCase,
              mistakesThisCase: context.lastAction.mistakesThisCase,
              lastVitals: context.lastAction.lastVitals,
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
        CLEAR_OVERLAYS: {
          actions: 'clearOverlays'
        },
        APPLY_REWARD_HEAL: {
          actions: 'applyRewardHeal'
        },
        USE_LIFELINE: {
          actions: assign({ lifelineActive: true })
        },
        BUY_UNDO: {
          actions: assign({
            undoCharges: ({ context }) => context.undoCharges + 1
          })
        }
      }
    },
    critical_alert: {
      after: {
        1500: { target: 'boss_fight' }
      }
    },
    boss_fight: {
      // The ShockRoom component drives this phase and owns its own timer,
      // emitting ANSWER_CORRECT / ANSWER_WRONG. (The legacy QTE fallback was
      // unreachable dead code and has been removed.)
      on: {
        ANSWER_CORRECT: {
          target: 'reward',
          actions: assign({
            caseStreak: ({ context }) => context.caseStreak + 1,
            score: ({ context }) => context.score + (context.caseStreak * 500) // Streak Bonus
          })
        },
        ANSWER_WRONG: {
          target: 'fail_protection',
          actions: assign({
            fatalError: ({ event }) => event.type === 'ANSWER_WRONG' ? event.error : "Error en Shock Room",
            caseStreak: 0
          })
        }
      }
    },
    reward: {
      on: {
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
            coinsEarnedThisCase: 0,
            // Reset per-case state for the new patient
            // score resets per patient so XP (granted on reward = score) is not
            // double-counted across the shift (was: 3·S1 + 2·S2 + S3).
            score: 0,
            vitality: 100,
            combo: 0,
            multiplier: 1,
            consecutiveErrors: 0,
            dossier: [],
            discarded: [],
            undoCharges: 5,
            lootBoxReward: null,
            activePenalty: null,
            activeEvent: null,
            lastVitals: null,
            lifelineActive: false,
            hasRescuedThisCase: false
          })
        },
        RESTART: { target: 'idle', actions: ['resetGame'] }
      }
    },
    fail_protection: {
      always: [
        {
          target: 'ghosted',
          guard: ({ context }) => context.lives <= 0
        }
      ],
      on: {
        RESCUE: {
          target: 'triage',
          actions: assign({
            lives: ({ context }) => context.lives - 1,
            vitality: 100,
            currentCardIndex: 0, // Restart current case cards for learning
            caseStreak: 0,
            score: 0,
            coinsEarnedThisCase: 0,
            dossier: [],
            discarded: [],
            feedbackHistory: [],
            mistakesThisCase: 0,
            consecutiveErrors: 0,
            lastVitals: null,
            lifelineActive: false,
            undoCharges: 5,
            hasRescuedThisCase: true,
            lastAction: null
          })
        },
        RESTART: { target: 'idle', actions: ['resetGame'] }
      }
    },
    ghosted: {
      on: {
        VIEW_DEBRIEF: { target: 'debrief' },
        RESTART: { target: 'idle', actions: ['resetGame'] },
        REVIVE_INTERN: {
          target: 'triage',
          actions: assign({
            lives: 1,
            vitality: 100,
            currentCardIndex: 0,
            caseStreak: 0,
            score: 0,
            coinsEarnedThisCase: 0,
            dossier: [],
            discarded: [],
            feedbackHistory: [],
            mistakesThisCase: 0,
            consecutiveErrors: 0,
            lastVitals: null,
            lifelineActive: false,
            undoCharges: 5,
            hasRescuedThisCase: true,
            lastAction: null
          })
        }
      }
    },
    debrief: {
      on: { RESTART: { target: 'idle', actions: ['resetGame'] } }
    }
  }
});
