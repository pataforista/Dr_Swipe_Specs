import { describe, it, expect } from 'vitest';
import { calculateCardScore, calculatePerfectRoundBonus, getDailyStreakMultiplier } from '../utils/scoringEngine';
import type { Card } from '../types/game';

describe('scoringEngine unit tests', () => {
  const mockCard: Card = {
    card_id: "card_001",
    ui_icon: "🩺",
    category: "neuro",
    card_text: "Card text",
    expected_action: "keep",
    scoring: {
      points: 100,
      vazquez_comment: "Good job."
    }
  };

  const criticalCard: Card = {
    ...mockCard,
    safety_flags: {
      decision_critical: true
    }
  };

  const lethalRiskCard: Card = {
    ...mockCard,
    safety_flags: {
      lethal_risk: true
    }
  };

  const lethalDiscardCard: Card = {
    ...mockCard,
    safety_flags: {
      lethal_if_discarded: true
    }
  };

  describe('calculateCardScore', () => {
    it('should calculate correct basic score', () => {
      const result = calculateCardScore(mockCard, { combo: 0, multiplier: 1, difficulty: 'standard', lastCardPresentedAt: 0 }, true);
      expect(result.finalPoints).toBe(100);
      expect(result.coinsEarned).toBe(1);
      expect(result.bonusType).toBe('none');
    });

    it('should penalize wrong swipe', () => {
      const result = calculateCardScore(mockCard, { combo: 0, multiplier: 1, difficulty: 'standard', lastCardPresentedAt: 0 }, false);
      expect(result.finalPoints).toBe(-50);
      expect(result.coinsEarned).toBe(0);
      expect(result.bonusType).toBe('none');
    });

    it('should apply decision_critical bonus on success', () => {
      const result = calculateCardScore(criticalCard, { combo: 0, multiplier: 1, difficulty: 'standard', lastCardPresentedAt: 0 }, true);
      // basePoints: 100 + 50 = 150. critical bonus multiplier: x1.2. 150 * 1.2 = 180
      expect(result.finalPoints).toBe(180);
      expect(result.bonusType).toBe('critical');
      expect(result.coinsEarned).toBe(3); // 1 base + 2 critical bonus
    });

    it('should apply lethal risk penalty on failure', () => {
      const result = calculateCardScore(lethalRiskCard, { combo: 0, multiplier: 1, difficulty: 'standard', lastCardPresentedAt: 0 }, false);
      expect(result.finalPoints).toBe(-1000);
    });

    it('should apply lethal if discarded penalty on failure', () => {
      const result = calculateCardScore(lethalDiscardCard, { combo: 0, multiplier: 1, difficulty: 'standard', lastCardPresentedAt: 0 }, false);
      expect(result.finalPoints).toBe(-1000);
    });

    it('should apply combo multipliers', () => {
      // nextCombo is combo + 1 = 5. comboMultiplier = 1 + floor(5/5) * 0.5 = 1.5
      const result = calculateCardScore(mockCard, { combo: 4, multiplier: 1, difficulty: 'standard', lastCardPresentedAt: 0 }, true);
      expect(result.finalPoints).toBe(150);
      expect(result.bonusType).toBe('combo');
      expect(result.coinsEarned).toBe(10); // 1 base + 1 combo + 8 milestone
    });

    it('should apply difficulty multipliers', () => {
      const result = calculateCardScore(mockCard, { combo: 0, multiplier: 1, difficulty: 'extreme', lastCardPresentedAt: 0 }, true);
      expect(result.finalPoints).toBe(200);
    });
  });

  describe('calculatePerfectRoundBonus', () => {
    it('should calculate perfect round bonus based on difficulty and deck size', () => {
      expect(calculatePerfectRoundBonus(10, 'standard')).toBe(100);
      expect(calculatePerfectRoundBonus(10, 'hard')).toBe(200);
      expect(calculatePerfectRoundBonus(10, 'extreme')).toBe(300);
    });
  });

  describe('getDailyStreakMultiplier', () => {
    it('should calculate correct daily streak multiplier capped at x2.0', () => {
      expect(getDailyStreakMultiplier(0)).toBe(1.0);
      expect(getDailyStreakMultiplier(3)).toBe(1.3);
      expect(getDailyStreakMultiplier(10)).toBe(2.0);
    });
  });
});
