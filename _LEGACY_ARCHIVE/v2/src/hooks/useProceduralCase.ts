import { useState, useEffect } from 'react';
import { BlueprintCard, PlayableCard } from '../types/procedural';
import { generateClinicalValue } from '../utils/clinicalMath';
import { nlgEngine } from '../utils/nlgEngine'; 

/**
 * Hook para instanciar un mazo procedural a partir de blueprints.
 * Realiza la generación de valores RNG y el formateo NLG.
 */
export const useProceduralCase = (blueprintCards: BlueprintCard[], playerRankLevel: number) => {
  const [playableDeck, setPlayableDeck] = useState<PlayableCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateDeck = () => {
      setIsGenerating(true);
      
      const instantiatedCards = blueprintCards.map((card) => {
        let finalCardText = card.static_text || "";

        if (card.dynamic_value) {
          const generatedNumber = generateClinicalValue(card.dynamic_value, playerRankLevel);
          finalCardText = nlgEngine.format(card.nlg_trigger, generatedNumber, card.dynamic_value.unit);
        }

        return {
          ...card,
          instanceId: `${card.id}-${Math.random().toString(36).substring(2, 9)}`,
          displayText: finalCardText,
        } as PlayableCard;
      });

      setPlayableDeck(instantiatedCards);
      setIsGenerating(false);
    };

    generateDeck();
  }, [blueprintCards, playerRankLevel]);

  return { playableDeck, isGenerating };
};
