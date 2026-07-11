import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerStats, EnarmPearl } from '../types/game';
import { safeStorage } from '../utils/safeStorage';

export interface SessionProgress {
  caseId?: string;
  currentCardIndex: number;
  score: number;
  combo: number;
  multiplier: number;
  caseStreak: number;
  coinsEarnedThisCase: number;
  mistakesThisCase: number;
  warningCount: number;
  difficulty: string;
  savedAt: number; // timestamp
}

interface CodexState {
  stats: PlayerStats;
  unlockedPearls: EnarmPearl[];
  history: string[]; // case ids solved
  caseStats?: Record<string, { timesSolved: number; mistakes: number; bestScore: number }>;
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
  unlockPearl: (pearl: EnarmPearl) => void;
  registerCaseSolved: (caseId: string, score?: number, mistakes?: number) => void;
  updateSwipeResult: (isCorrect: boolean) => void;
  incrementSessions: () => void;
  updateDailyStreak: () => void;
  saveSessionProgress: (progress: SessionProgress) => void;
  clearSessionProgress: () => void;
  updateSettings: (settings: Partial<CodexState['settings']>) => void;
}

export const LIFELINE_COST = 25;
export const UNDO_COST = 40;
export const REVIVE_COST = 75;

export const useCodexStore = create<CodexState>()(
  persist(
    (set) => ({
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

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = state.lastPlayedDate === yesterday ? state.dailyStreak + 1 : 1;
        return { dailyStreak: newStreak, lastPlayedDate: today };
      }),

      saveSessionProgress: (progress) => set(() => ({ sessionProgress: progress })),

      clearSessionProgress: () => set(() => ({ sessionProgress: null })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'dr-swipe-codex',
      // safeStorage never throws: blocked storage (private browsing, quota)
      // degrades to in-memory persistence instead of crashing on mount.
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
