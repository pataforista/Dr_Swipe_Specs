import type { CaseOutcome } from '../types/game';

/**
 * "Favores del Adjunto" (ADR 011): soft currency earned by playing well, never
 * bought. It only pays for "Llamar al Adjunto" (revive), so coins stay for
 * lifeline and undo and the two economies do not blur (principle 3.4).
 */
export const FAVOR_CAP = 5;
export const REVIVE_FAVOR_COST = 3;
export const DAILY_FAVOR = 1;

/** A clean case earns 2, a case with a single slip earns 1, anything messier earns none. */
export function favorsForCase(outcome: CaseOutcome, mistakes: number): number {
  if (outcome === 'perfect') return 2;
  if (outcome === 'correct_with_errors' && mistakes <= 1) return 1;
  return 0;
}

export function addFavorsCapped(current: number, amount: number): number {
  return Math.max(0, Math.min(FAVOR_CAP, current + Math.max(0, amount)));
}

/**
 * Days of silence tolerated before the daily streak resets: one missed day is
 * forgiven (ADR 012), two in a row break it.
 */
export const STREAK_GRACE_DAYS = 1;

/** Whole days between two YYYY-MM-DD strings (UTC), or null if either is invalid. */
export function daysBetween(fromIso: string, toIso: string): number | null {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

export function nextDailyStreak(streak: number, lastPlayed: string | null, today: string): number {
  if (!lastPlayed) return 1;
  const gap = daysBetween(lastPlayed, today);
  if (gap === null || gap < 1) return Math.max(1, streak);
  return gap <= 1 + STREAK_GRACE_DAYS ? streak + 1 : 1;
}
