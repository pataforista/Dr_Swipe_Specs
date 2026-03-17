import type { Card } from '../types/game';

/**
 * NLG Engine: Natural Language Generation for the Lore/Noise system.
 * It dynamically injects medical horror/atmospheric details into the clinical cards.
 */
export const nlgEngine = {
  injectNoise: (card: Card, playerRank: string): string => {
    const noiseTemplates = [
      "Las luces del pasillo parpadean mientras lees: {text}",
      "Sientes un escalofrío. {text}",
      "El monitor pita rítmicamente. {text}",
      "Un interno murmura por lo bajo sobre {text}"
    ];
    
    // Higher ranks get more "Noise" (distractions)
    const noiseThreshold = playerRank.includes('R0') ? 0.9 : 0.7;
    
    if (Math.random() > noiseThreshold) {
      const template = noiseTemplates[Math.floor(Math.random() * noiseTemplates.length)];
      return template.replace("{text}", card.card_text);
    }
    
    return card.card_text;
  },

  formatMentorComment: (comment: string, mentor: string): string => {
    return `${mentor}: ${comment}`;
  }
};
