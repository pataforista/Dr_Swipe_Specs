import type { Card } from '../types/game';

/**
 * Clinical Math: Handles real-time vital calculations and score weighting.
 */
export const clinicalMath = {
  calculateScore: (card: Card, isCorrect: boolean): number => {
    let base = card.scoring.points;
    
    if (!isCorrect) {
      // Lethal risks have heavy penalties
      if (card.safety_flags?.lethal_risk) return -1000;
      return -base;
    }
    
    // Add bonus for decision critical cards
    if (card.safety_flags?.decision_critical) base += 50;
    
    return base;
  },

  parseVitals: (text: string) => {
    // Simple regex to extract numbers from TA, FC, etc.
    const taMatch = text.match(/TA\s(\d+\/\d+)/);
    const fcMatch = text.match(/FC\s(\d+)/);
    
    return {
      ta: taMatch ? taMatch[1] : null,
      fc: fcMatch ? parseInt(fcMatch[1]) : null
    };
  }
};
