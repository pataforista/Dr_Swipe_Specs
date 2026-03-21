import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerStats, EnarmPearl } from '../types/game';

interface CodexState {
  stats: PlayerStats;
  unlockedPearls: EnarmPearl[];
  history: string[]; // case ids solved

  // Actions
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  unlockPearl: (pearl: EnarmPearl) => void;
  registerCaseSolved: (caseId: string, score?: number) => void;
  updateSwipeResult: (isCorrect: boolean) => void;
  incrementSessions: () => void;
}

export const useCodexStore = create<CodexState>()(
  persist(
    (set) => ({
      stats: {
        rank: 'R0 Aspirante',
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

      addXp: (amount) => set((state) => ({
        stats: { ...state.stats, xp: state.stats.xp + amount }
      })),

      addCoins: (amount) => set((state) => ({
        stats: { ...state.stats, coins: state.stats.coins + amount }
      })),

      unlockPearl: (pearl) => set((state) => {
        if (state.unlockedPearls.find(p => p.id === pearl.id)) return state;
        return { unlockedPearls: [...state.unlockedPearls, pearl] };
      }),

      registerCaseSolved: (caseId, score = 0) => set((state) => ({
        history: [...state.history, caseId],
        stats: {
          ...state.stats,
          cases_solved: state.stats.cases_solved + 1,
          best_score: Math.max(state.stats.best_score ?? 0, score),
        }
      })),

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
    }),
    {
      name: 'dr-swipe-codex',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
