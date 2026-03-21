import type { Card } from '../types/game';

/**
 * NLG Engine: Natural Language Generation for the Lore/Noise system.
 * Dynamically injects medical horror / atmospheric flavor into clinical cards.
 */

const GENERIC_NOISE: string[] = [
  "Las luces del pasillo parpadean mientras lees: {text}",
  "Sientes un escalofrío. {text}",
  "El monitor pita rítmicamente. {text}",
  "Un interno murmura por lo bajo sobre {text}",
  "La enfermera de turno te mira fijamente. {text}",
  "El pasillo huele a antiséptico y miedo. {text}",
  "Alguien rueda una camilla a toda prisa. {text}",
  "El reloj de guardia marca las 3:17 AM. {text}",
  "La bocina del hospital llama a otro código. {text}",
  "Escuchas el llanto de una familia al fondo. {text}",
  "La pantalla del monitor parpadea. {text}",
  "Residencia de tercer año. Sigues sin acostumbrarte a esto. {text}",
  "El café ya está frío en tu bolsillo. {text}",
  "Vázquez te observa desde el otro extremo del pasillo. {text}",
  "Llevas 28 horas de guardia. {text}",
  "El ECG imprime otro tira. {text}",
  "Tres pacientes más en espera. {text}",
  "Ruido blanco de monitores. {text}",
];

const CATEGORY_NOISE: Record<string, string[]> = {
  cardio: [
    "El ritmo irregular en el monitor te eriza los vellos. {text}",
    "El pecho del paciente se mueve con dificultad. {text}",
    "Sientes los 12 derivados del ECG en la mano. {text}",
  ],
  neuro: [
    "Los ojos del paciente no siguen el dedo. {text}",
    "La escala de Glasgow baja mientras lees. {text}",
    "Asimetría pupilar. El tiempo se acelera. {text}",
  ],
  respiratorio: [
    "La saturación cae en tiempo real. {text}",
    "Se escuchan estertores al otro lado del panel. {text}",
    "El pulso-oxímetro alarma. {text}",
  ],
  gineco_obstetricia: [
    "El Doppler fetal muestra desaceleraciones. {text}",
    "La paciente aprieta tu mano. {text}",
    "Tensión en la sala de partos. {text}",
  ],
  infectologia: [
    "La fiebre no cede. Llevan días intentándolo. {text}",
    "El hemocultivo tardará horas. El paciente no tiene ese tiempo. {text}",
    "Medidas de aislamiento activadas. {text}",
  ],
  endocrino: [
    "La glucosa en el glucómetro es imposiblemente alta. {text}",
    "La familia no sabía que era diabético. {text}",
    "El aliento huele a acetona. {text}",
  ],
  trauma: [
    "La radiografía llega manchada de sangre. {text}",
    "Mecanismo de alta energía. Asumes lo peor. {text}",
    "El paciente no recuerda el impacto. {text}",
  ],
  psiquiatria: [
    "El paciente repite la misma frase sin parar. {text}",
    "La familia lleva semanas sin dormir. {text}",
    "Sujección mínima. El equipo está en alerta. {text}",
  ],
};

export const nlgEngine = {
  injectNoise: (card: Card, playerRank: string): string => {
    const noiseThreshold = playerRank.includes('R0') ? 0.9 : 0.7;

    if (Math.random() > noiseThreshold) {
      // Try to use category-specific noise first
      const cat = card.category?.toLowerCase() || '';
      const matchKey = Object.keys(CATEGORY_NOISE).find(k => cat.includes(k));
      const pool = matchKey ? CATEGORY_NOISE[matchKey] : GENERIC_NOISE;
      const template = pool[Math.floor(Math.random() * pool.length)];
      return template.replace("{text}", card.card_text);
    }

    return card.card_text;
  },

  formatMentorComment: (comment: string, mentor: string): string => {
    return `${mentor}: ${comment}`;
  }
};
