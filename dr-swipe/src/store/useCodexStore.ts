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
  registerCaseSolved: (caseId: string) => void;
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
        cases_solved: 0
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

      registerCaseSolved: (caseId) => set((state) => ({
        history: [...state.history, caseId],
        stats: { ...state.stats, cases_solved: state.stats.cases_solved + 1 }
      }))
    }),
    {
      name: 'dr-swipe-codex',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
