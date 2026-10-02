import { describe, it, expect } from 'vitest';
import { applySM2, outcomeToQuality } from '../utils/srsEngine';
import type { CaseResult } from '../types/srs';

describe('SRS Engine (SM-2)', () => {
  it('un caso perfecto progresa 1 -> 6 -> 15+', () => {
    let p = applySM2(null, 'c1', 5, 0);
    expect(p.interval).toBe(1);
    
    p = applySM2(p, 'c1', 5, p.nextReviewDate);
    expect(p.interval).toBe(6);
    
    p = applySM2(p, 'c1', 5, p.nextReviewDate);
    expect(p.interval).toBeGreaterThanOrEqual(15);
  });

  it('un fallo resetea repetitions y reprograma a 1 dia', () => {
    let p = applySM2(null, 'c1', 5, 0);
    p = applySM2(p, 'c1', 5, 0);
    p = applySM2(p, 'c1', 1, 0); // fallo
    
    expect(p.repetitions).toBe(0);
    expect(p.interval).toBe(1);
    expect(p.lapses).toBe(1);
    expect(p.easeFactor).toBeLessThan(2.5);
  });

  it('outcomeToQuality mapea correctamente', () => {
    const perfect: CaseResult = { caseId: '1', specialty: 'med', outcome: 'perfect', mistakes: 0, lethalErrors: 0, timeSpentMs: 1000 };
    expect(outcomeToQuality(perfect)).toBe(5);

    const rescued: CaseResult = { caseId: '2', specialty: 'med', outcome: 'rescued', mistakes: 1, lethalErrors: 1, timeSpentMs: 1000 };
    expect(outcomeToQuality(rescued)).toBe(2);
  });
});
