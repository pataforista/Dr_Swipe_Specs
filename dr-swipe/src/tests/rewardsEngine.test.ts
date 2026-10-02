import { describe, it, expect } from 'vitest';
import { computeRewards, computeSuccessOutcome } from '../utils/rewardsEngine';

describe('rewardsEngine', () => {
  describe('computeRewards', () => {
    it('should calculate perfect outcome rewards correctly', () => {
      const rewards = computeRewards('perfect', 1);
      expect(rewards.xpEarned).toBe(40); // 1 * 20 * 2.0 = 40
      expect(rewards.coinsEarned).toBe(4); // 40 * 0.1 = 4
    });

    it('should calculate correct_with_errors outcome rewards correctly', () => {
      const rewards = computeRewards('correct_with_errors', 2);
      expect(rewards.xpEarned).toBe(40); // 2 * 20 * 1.0 = 40
      expect(rewards.coinsEarned).toBe(4); // 40 * 0.1 = 4
    });

    it('should calculate rescued outcome rewards correctly', () => {
      const rewards = computeRewards('rescued', 1.5);
      expect(rewards.xpEarned).toBe(15); // 1.5 * 20 * 0.5 = 15
      expect(rewards.coinsEarned).toBe(2); // Math.round(15 * 0.1) = 2
    });

    it('should return 0 for failed outcome', () => {
      const rewards = computeRewards('failed', 3);
      expect(rewards.xpEarned).toBe(0);
      expect(rewards.coinsEarned).toBe(0);
    });
  });

  describe('computeSuccessOutcome', () => {
    it('should return rescued if wasRescued is true', () => {
      expect(computeSuccessOutcome(true, 0)).toBe('rescued');
      expect(computeSuccessOutcome(true, 5)).toBe('rescued');
    });

    it('should return perfect if 0 mistakes and not rescued', () => {
      expect(computeSuccessOutcome(false, 0)).toBe('perfect');
    });

    it('should return correct_with_errors if mistakes > 0 and not rescued', () => {
      expect(computeSuccessOutcome(false, 1)).toBe('correct_with_errors');
      expect(computeSuccessOutcome(false, 10)).toBe('correct_with_errors');
    });
  });
});
