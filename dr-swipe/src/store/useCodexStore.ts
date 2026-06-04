import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerStats, EnarmPearl } from '../types/game';

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
  dailyStreak: number;
  lastPlayedDate: string | null; // ISO date string (YYYY-MM-DD)
  sessionProgress: SessionProgress | null; // Active game session state
  boosts: Boosts; // owned consumable power-ups

  // Actions
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean; // returns false if insufficient
  unlockPearl: (pearl: EnarmPearl) => void;
  registerCaseSolved: (caseId: string, score?: number) => void;
  updateSwipeResult: (isCorrect: boolean) => void;
  incrementSessions: () => void;
  updateDailyStreak: () => void;
  saveSessionProgress: (progress: SessionProgress) => void;
  clearSessionProgress: () => void;
  openKnowledgeCrate: (pool: EnarmPearl[]) => CrateResult | null;
  buyBoost: (id: BoostId) => boolean;
  consumeBoost: (id: BoostId) => boolean;
}

export interface CrateResult { pearl: EnarmPearl; isNew: boolean; refund: number; }

export type BoostId = 'doubleXp' | 'doubleCoins' | 'freeHints';
export type Boosts = Record<BoostId, number>;

export interface BoostInfo { id: BoostId; name: string; desc: string; cost: number; emoji: string; }
export const BOOST_CATALOG: BoostInfo[] = [
  { id: 'doubleXp',    name: 'Doble XP',       desc: 'Duplica el XP de tu próxima guardia.',        cost: 80, emoji: '⭐' },
  { id: 'doubleCoins', name: 'Doble Monedas',  desc: 'Duplica las monedas de tu próxima guardia.',  cost: 70, emoji: '🪙' },
  { id: 'freeHints',   name: 'Pista Gratis',   desc: 'Escanea una carta sin gastar monedas (x3).',  cost: 45, emoji: '🧬' },
];
const FREE_HINTS_PER_BUY = 3;

export const LIFELINE_COST = 25;
export const KNOWLEDGE_CRATE_COST = 50;
/** Coins refunded ("polvo de estudio") when a crate yields an already-owned pearl. */
export const DUPLICATE_REFUND = 15;

const RARITY_WEIGHT: Record<string, number> = { common: 1, rare: 0.5, epic: 0.2, legendary: 0.08 };

function weightedDraw(pool: EnarmPearl[]): EnarmPearl {
  const total = pool.reduce((s, p) => s + (RARITY_WEIGHT[p.rarity ?? 'common'] ?? 1), 0);
  let r = Math.random() * total;
  for (const p of pool) {
    r -= RARITY_WEIGHT[p.rarity ?? 'common'] ?? 1;
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
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
      dailyStreak: 0,
      lastPlayedDate: null,
      sessionProgress: null,
      boosts: { doubleXp: 0, doubleCoins: 0, freeHints: 0 },

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
        const owned = state.unlockedPearls.some(
          p => (p.id && pearl.id && p.id === pearl.id) || p.title === pearl.title
        );
        if (owned) return state;
        return { unlockedPearls: [...state.unlockedPearls, pearl] };
      }),

      openKnowledgeCrate: (pool) => {
        let result: CrateResult | null = null;
        set((state) => {
          if (!pool.length || state.stats.coins < KNOWLEDGE_CRATE_COST) return state;
          const pick = weightedDraw(pool);
          const owned = state.unlockedPearls.some(
            p => (p.id && pick.id && p.id === pick.id) || p.title === pick.title
          );
          const coins = state.stats.coins - KNOWLEDGE_CRATE_COST;
          if (owned) {
            result = { pearl: pick, isNew: false, refund: DUPLICATE_REFUND };
            return { stats: { ...state.stats, coins: coins + DUPLICATE_REFUND } };
          }
          result = { pearl: pick, isNew: true, refund: 0 };
          return { stats: { ...state.stats, coins }, unlockedPearls: [...state.unlockedPearls, pick] };
        });
        return result;
      },

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

      updateDailyStreak: () => set((state) => {
        const today = new Date().toISOString().slice(0, 10);
        if (state.lastPlayedDate === today) return state; // Already updated today

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = state.lastPlayedDate === yesterday ? state.dailyStreak + 1 : 1;
        return { dailyStreak: newStreak, lastPlayedDate: today };
      }),

      saveSessionProgress: (progress) => set(() => ({ sessionProgress: progress })),

      clearSessionProgress: () => set(() => ({ sessionProgress: null })),

      buyBoost: (id) => {
        const info = BOOST_CATALOG.find(b => b.id === id);
        if (!info) return false;
        let ok = false;
        set((state) => {
          if (state.stats.coins < info.cost) return state;
          ok = true;
          const cur = state.boosts ?? { doubleXp: 0, doubleCoins: 0, freeHints: 0 };
          const inc = id === 'freeHints' ? FREE_HINTS_PER_BUY : 1;
          return {
            stats: { ...state.stats, coins: state.stats.coins - info.cost },
            boosts: { ...cur, [id]: (cur[id] ?? 0) + inc },
          };
        });
        return ok;
      },

      consumeBoost: (id) => {
        let used = false;
        set((state) => {
          const cur = state.boosts ?? { doubleXp: 0, doubleCoins: 0, freeHints: 0 };
          if ((cur[id] ?? 0) <= 0) return state;
          used = true;
          return { boosts: { ...cur, [id]: cur[id] - 1 } };
        });
        return used;
      },
    }),
    {
      name: 'dr-swipe-codex',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
