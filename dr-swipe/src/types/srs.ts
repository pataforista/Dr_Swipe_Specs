export type CaseOutcome = 'perfect' | 'correct_with_errors' | 'rescued' | 'failed';

export type CaseResult = {
  caseId: string;
  specialty: string;
  outcome: CaseOutcome;
  mistakes: number;
  lethalErrors: number;
  timeSpentMs: number;
};

export type CaseProgress = {
  caseId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: number;
  lastReviewDate: number;
  lapses: number;
  totalReviews: number;
  lastQuality: number;
  mastered: boolean;
};
