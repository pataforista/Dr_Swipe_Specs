import type { CaseProgress } from '../types/srs';
import { specialtyFromCaseId } from './sessionEngine';
import achievementsData from '../data/lore/achievements.json';

export type AchievementMetric =
  | 'cases_solved' | 'total_sessions' | 'correct_swipes'
  | 'perfectCases' | 'rescuedCases' | 'failedCases' | 'lethalErrors'
  | 'revives' | 'nightShifts' | 'bestCombo'
  | 'dailyStreak' | 'pearls' | 'masteredCases' | 'specialtiesPlayed' | 'favors';

export interface AchievementDef {
  id: string;
  emoji: string;
  nombre: string;
  chiste: string;
  metric: AchievementMetric;
  umbral: number;
}

export type AchievementSnapshot = Record<AchievementMetric, number>;

export const ACHIEVEMENTS = achievementsData.achievements as AchievementDef[];

/** Lifetime counters that the machine does not keep (persisted in the store). */
export interface AchievementCounters {
  perfectCases: number;
  rescuedCases: number;
  failedCases: number;
  lethalErrors: number;
  revives: number;
  nightShifts: number;
  bestCombo: number;
}

export const EMPTY_COUNTERS: AchievementCounters = {
  perfectCases: 0, rescuedCases: 0, failedCases: 0, lethalErrors: 0, revives: 0, nightShifts: 0, bestCombo: 0,
};

/** Achievements whose threshold the snapshot reaches and that are not unlocked yet. */
export function evaluateAchievements(
  snapshot: AchievementSnapshot,
  unlocked: Record<string, number>,
  catalog: AchievementDef[] = ACHIEVEMENTS,
): AchievementDef[] {
  return catalog.filter(a => !(a.id in unlocked) && (snapshot[a.metric] ?? 0) >= a.umbral);
}

/** Midnight to 5:59 counts as a night shift. */
export function isNightHour(hour: number): boolean {
  return hour >= 0 && hour < 6;
}

export interface SnapshotSource {
  stats: { cases_solved: number; total_sessions?: number; correct_swipes: number };
  counters?: Partial<AchievementCounters>;
  dailyStreak: number;
  pearlCount: number;
  caseProgress: Record<string, CaseProgress>;
  favors?: number;
}

/** Single place that maps store state to achievement metrics (store and Codex share it). */
export function buildAchievementSnapshot(src: SnapshotSource): AchievementSnapshot {
  const progress = Object.values(src.caseProgress);
  return {
    cases_solved: src.stats.cases_solved,
    total_sessions: src.stats.total_sessions ?? 0,
    correct_swipes: src.stats.correct_swipes,
    ...EMPTY_COUNTERS,
    ...src.counters,
    dailyStreak: src.dailyStreak,
    pearls: src.pearlCount,
    masteredCases: progress.filter(p => p.mastered).length,
    specialtiesPlayed: new Set(progress.map(p => specialtyFromCaseId(p.caseId))).size,
    favors: src.favors ?? 0,
  };
}
