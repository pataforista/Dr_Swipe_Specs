import type { CaseProgress, CaseResult } from '../types/srs';

export function outcomeToQuality(r: CaseResult): number {
  switch (r.outcome) {
    case 'perfect':
      return 5;
    case 'correct_with_errors':
      return r.mistakes === 1 ? 4 : 3;
    case 'rescued':
      return 2;
    case 'failed':
      return r.lethalErrors > 0 ? 0 : 1;
  }
}

export function applySM2(
  prev: CaseProgress | null,
  caseId: string,
  quality: number,
  now: number,
): CaseProgress {
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  const base: CaseProgress = prev ?? {
    caseId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: now,
    lastReviewDate: 0,
    lapses: 0,
    totalReviews: 0,
    lastQuality: 0,
    mastered: false,
  };

  let { easeFactor, interval, repetitions, lapses } = base;

  if (q < 3) {
    // Failure: reset and review immediately
    repetitions = 0;
    lapses += 1;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  // Update EF (SM-2 formula)
  easeFactor += 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  easeFactor = Math.max(1.3, easeFactor);

  // Defensive cap
  interval = Math.min(interval, 365);

  const DAY = 24 * 60 * 60 * 1000;
  const nextReviewDate = now + interval * DAY;
  const mastered = repetitions >= 3 && interval >= 21;

  return {
    caseId,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewDate: now,
    lapses,
    totalReviews: base.totalReviews + 1,
    lastQuality: q,
    mastered,
  };
}
