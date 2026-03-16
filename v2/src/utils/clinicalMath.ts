import { ClinicalRange } from '../types/procedural';

/**
 * Genera un valor clínico basado en un rango y un nivel de dificultad.
 * Si la dificultad es alta (>2) y el rango es marcado como borderline, 
 * genera valores cercanos a los límites para aumentar la confusión.
 */
export const generateClinicalValue = (range: ClinicalRange, difficultyLevel: number): number => {
  const { min, max } = range;
  
  if (difficultyLevel > 2 && range.isBorderline) {
    const coinToss = Math.random() > 0.5;
    const edgeVariance = (max - min) * 0.1; // 10% de variación en los bordes
    
    return coinToss 
      ? Math.floor(min + (Math.random() * edgeVariance))
      : Math.floor(max - (Math.random() * edgeVariance));
  }

  // Generación estándar aleatoria dentro del rango
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
