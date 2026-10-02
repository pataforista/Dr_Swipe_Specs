import { describe, it, expect } from 'vitest';
import { favorsForCase, addFavorsCapped, nextDailyStreak, FAVOR_CAP, REVIVE_FAVOR_COST } from '../utils/favorsEngine';

describe('favorsEngine', () => {
  it('paga más por casos limpios y nada por casos rescatados o fallados', () => {
    expect(favorsForCase('perfect', 0)).toBe(2);
    expect(favorsForCase('correct_with_errors', 1)).toBe(1);
    expect(favorsForCase('correct_with_errors', 2)).toBe(0);
    expect(favorsForCase('rescued', 0)).toBe(0);
    expect(favorsForCase('failed', 5)).toBe(0);
  });

  it('el tope obliga a gastar: nunca acumula más de FAVOR_CAP', () => {
    expect(addFavorsCapped(4, 2)).toBe(FAVOR_CAP);
    expect(addFavorsCapped(0, -3)).toBe(0);
  });

  it('un revive cuesta menos que el tope y más que un caso perfecto', () => {
    expect(REVIVE_FAVOR_COST).toBeLessThanOrEqual(FAVOR_CAP);
    expect(REVIVE_FAVOR_COST).toBeGreaterThan(favorsForCase('perfect', 0));
  });

  describe('nextDailyStreak (un día de gracia)', () => {
    it('primer día empieza en 1', () => {
      expect(nextDailyStreak(0, null, '2026-10-02')).toBe(1);
    });
    it('día consecutivo suma', () => {
      expect(nextDailyStreak(3, '2026-10-01', '2026-10-02')).toBe(4);
    });
    it('un día de ausencia se perdona', () => {
      expect(nextDailyStreak(3, '2026-09-30', '2026-10-02')).toBe(4);
    });
    it('dos días de ausencia rompen la racha', () => {
      expect(nextDailyStreak(3, '2026-09-29', '2026-10-02')).toBe(1);
    });
    it('jugar dos veces el mismo día no cambia la racha', () => {
      expect(nextDailyStreak(3, '2026-10-02', '2026-10-02')).toBe(3);
    });
  });
});
