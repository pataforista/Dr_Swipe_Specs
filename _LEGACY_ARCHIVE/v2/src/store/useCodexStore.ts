import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PerlaENARM } from '../types/clinical';

interface CodexState {
  unlockedPearls: PerlaENARM[];
  addPearl: (newPearl: PerlaENARM) => void;
  getTotalUnlocked: () => number;
}

export const useCodexStore = create<CodexState>()(
  persist(
    (set, get) => ({
      unlockedPearls: [],
      
      addPearl: (newPearl) => set((state) => {
        // Validation: No duplicates
        const alreadyExists = state.unlockedPearls.some(p => p.id === newPearl.id);
        if (alreadyExists) return state;
        
        return { unlockedPearls: [...state.unlockedPearls, newPearl] };
      }),

      getTotalUnlocked: () => get().unlockedPearls.length,
    }),
    {
      name: 'dr_swipe_codex_vault',
    }
  )
);
