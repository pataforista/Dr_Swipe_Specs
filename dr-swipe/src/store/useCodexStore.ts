import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerStats, EnarmPearl, CaseResult } from '../types/game';
import type { CaseProgress } from '../types/srs';
import { applySM2, outcomeToQuality } from '../utils/srsEngine';
import { safeStorage } from '../utils/safeStorage';
import { addFavorsCapped, nextDailyStreak, DAILY_FAVOR } from '../utils/favorsEngine';

export interface SessionProgress {
  caseId?: string;
  currentCardIndex: number;
  score: number;
  combo: number;
  multiplier: number;
  caseStreak: number;
  coinsEarnedThisCase: number;
  mistakesThisCase: number;
  difficulty: string;
  /** card_ids in the order they are played (decks are shuffled per game). */
  deckOrder?: string[];
  savedAt: number; // timestamp
}

interface CodexState {
  stats: PlayerStats;
  unlockedPearls: EnarmPearl[];
  history: string[]; // case ids solved
  caseStats?: Record<string, { timesSolved: number; mistakes: number; bestScore: number }>;
  /** SM-2 schedule per case (replaces the old "has mistakes" flag). */
  caseProgress: Record<string, CaseProgress>;
  /** Favores del Adjunto: earned by performance, capped, spent only on revive (ADR 011). */
  favors: number;
  settings: {
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
  dailyStreak: number;
  lastPlayedDate: string | null; // ISO date string (YYYY-MM-DD)
  sessionProgress: SessionProgress | null; // Active game session state

  // Actions
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean; // returns false if insufficient
  earnFavors: (amount: number) => void;
  spendFavors: (amount: number) => boolean; // returns false if insufficient
  unlockPearl: (pearl: EnarmPearl) => void;
  registerCaseSolved: (caseId: string, score?: number, mistakes?: number) => void;
  /**
   * Feeds finished cases into the SRS schedule. It does not grant XP/coins:
   * those are paid per case when the reward screen is reached.
   */
  commitSession: (results: CaseResult[], now?: number) => void;
  getCasesDueForReview: (now?: number) => string[];
  updateSwipeResult: (isCorrect: boolean) => void;
  incrementSessions: () => void;
  updateDailyStreak: () => void;
  saveSessionProgress: (progress: SessionProgress) => void;
  clearSessionProgress: () => void;
  updateSettings: (settings: Partial<CodexState['settings']>) => void;
}

/** v0/v1 -> v2: seed caseProgress from caseStats so no history is lost. */
export function migrateCodexState(persisted: unknown, fromVersion: number): unknown {
  if (!persisted || typeof persisted !== 'object' || fromVersion >= 2) return persisted;
  const old = persisted as { caseStats?: CodexState['caseStats']; caseProgress?: CodexState['caseProgress'] };
  if (old.caseProgress) return persisted;
  const now = Date.now();
  const caseProgress: Record<string, CaseProgress> = {};
  for (const [caseId, stat] of Object.entries(old.caseStats ?? {})) {
    // A case left with mistakes is due now; a clean one starts its schedule.
    const seeded = applySM2(null, caseId, stat.mistakes > 0 ? 2 : 5, now);
    caseProgress[caseId] = stat.mistakes > 0 ? { ...seeded, nextReviewDate: now } : seeded;
  }
  return { ...old, caseProgress };
}

export const LIFELINE_COST = 25;
export const UNDO_COST = 40;

export const useCodexStore = create<CodexState>()(
  persist(
    (set, get) => ({
      stats: {
        xp: 0,
        coins: 0,
        correct_swipes: 0,
        mistakes: 0,
        cases_solved: 0,
        best_score: 0,
        total_sessions: 0,
      },
      unlockedPearls: [],
      history: [],
      caseStats: {},
      caseProgress: {},
      favors: 0,
      settings: {
        soundEnabled: true,
        hapticsEnabled: true,
      },
      dailyStreak: 0,
      lastPlayedDate: null,
      sessionProgress: null,

      addXp: (amount) => set((state) => ({
        stats: { ...state.stats, xp: state.stats.xp + amount }
      })),

      addCoins: (amount) => set((state) => ({
        stats: { ...state.stats, coins: state.stats.coins + amount }
      })),

      spendCoins: (amount) => {
        let success = false;
        set((state) => {
          if (state.stats.coins >= amount) {
            success = true;
            return { stats: { ...state.stats, coins: state.stats.coins - amount } };
          }
          return state;
        });
        return success;
      },

      earnFavors: (amount) => set((state) => ({ favors: addFavorsCapped(state.favors ?? 0, amount) })),

      spendFavors: (amount) => {
        let success = false;
        set((state) => {
          if ((state.favors ?? 0) >= amount) {
            success = true;
            return { favors: (state.favors ?? 0) - amount };
          }
          return state;
        });
        return success;
      },

      unlockPearl: (pearl) => set((state) => {
        if (state.unlockedPearls.find(p => p.id === pearl.id)) return state;
        return { unlockedPearls: [...state.unlockedPearls, pearl] };
      }),

      registerCaseSolved: (caseId, score = 0, mistakes = 0) => set((state) => {
        const currentStats = state.caseStats || {};
        const caseStat = currentStats[caseId] || { timesSolved: 0, mistakes: 0, bestScore: 0 };
        const updatedStats = {
          ...currentStats,
          [caseId]: {
            timesSolved: caseStat.timesSolved + 1,
            // Reflects the most recent attempt, not a lifetime total, so a
            // case cleared perfectly on replay drops out of the "review my
            // mistakes" list instead of staying flagged forever.
            mistakes,
            bestScore: Math.max(caseStat.bestScore, score)
          }
        };
        // Move caseId to the end so the "avoid recently played" exclusion
        // window (history.slice(-30)) still excludes it after a replay.
        const newHistory = [...state.history.filter(id => id !== caseId), caseId];
        return {
          history: newHistory,
          caseStats: updatedStats,
          stats: {
            ...state.stats,
            cases_solved: state.stats.cases_solved + 1,
            best_score: Math.max(state.stats.best_score ?? 0, score),
          }
        };
      }),

      commitSession: (results, now = Date.now()) => set((state) => {
        if (results.length === 0) return state;
        const caseProgress = { ...state.caseProgress };
        for (const r of results) {
          caseProgress[r.caseId] = applySM2(caseProgress[r.caseId] ?? null, r.caseId, outcomeToQuality(r), now);
        }
        return { caseProgress };
      }),

      getCasesDueForReview: (now = Date.now()) =>
        Object.values(get().caseProgress)
          .filter(p => p.nextReviewDate <= now)
          .sort((a, b) => a.nextReviewDate - b.nextReviewDate)
          .map(p => p.caseId),

      updateSwipeResult: (isCorrect) => set((state) => ({
        stats: {
          ...state.stats,
          correct_swipes: isCorrect ? state.stats.correct_swipes + 1 : state.stats.correct_swipes,
          mistakes: !isCorrect ? state.stats.mistakes + 1 : state.stats.mistakes,
        }
      })),

      incrementSessions: () => set((state) => ({
        stats: { ...state.stats, total_sessions: (state.stats.total_sessions ?? 0) + 1 }
      })),

      updateDailyStreak: () => set((state) => {
        const today = new Date().toISOString().slice(0, 10);
        if (state.lastPlayedDate === today) return state; // Already updated today
        // A new day played is a reason to come back: it also pays one favor.
        return {
          dailyStreak: nextDailyStreak(state.dailyStreak, state.lastPlayedDate, today),
          lastPlayedDate: today,
          favors: addFavorsCapped(state.favors ?? 0, DAILY_FAVOR),
        };
      }),

      saveSessionProgress: (progress) => set(() => ({ sessionProgress: progress })),

      clearSessionProgress: () => set(() => ({ sessionProgress: null })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'dr-swipe-codex',
      version: 2,
      migrate: migrateCodexState as never,
      // safeStorage never throws: blocked storage (private browsing, quota)
      // degrades to in-memory persistence instead of crashing on mount.
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
