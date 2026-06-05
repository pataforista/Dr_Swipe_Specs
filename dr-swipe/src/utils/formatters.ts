import type { BossQuestion } from '../types/game';

/**
 * Creates contextual feedback comments based on whether the decision was correct or wrong.
 * Implements the "Institución de Salud Verde" tone: specific, dry, clinical, not moralizing.
 */
export const cleanVazquezComment = (comment: string | undefined, isCorrect: boolean): string => {
  if (!comment) return isCorrect ? "Decisión oportuna." : "Esta decisión no sostiene. Revísala antes de cerrar el caso.";

  let clean = comment;
  
  if (comment.includes(':')) {
    const parts = comment.split(':');
    clean = parts.slice(1).join(':').trim();
  }
  
  // Remove surrounding quotes
  clean = clean.replace(/^"|"$/g, '').trim();

  // Extract reasoning by wiping out generic positive praise
  const positiveMarkers = [
      /^¡?Excelente!?\s*/i,
      /^¡?Muy bien!?\s*/i,
      /^¡?Bien!?\s*/i,
      /^¡?Perfecto!?\s*/i,
      /^¡?Correcto!?\s*/i,
      /^¡?Buen trabajo!?\s*/i,
      /^¡?Genial!?\s*/i,
      /^¡?Fantástico!?\s*/i,
      /^¡?Logrado!?\s*/i,
      /^¡?Exacto!?\s*/i
  ];
  
  let reasoning = clean;
  positiveMarkers.forEach(regex => {
    reasoning = reasoning.replace(regex, '');
  });
  
  // Clean leading punctuation and spaces (fixes "Nota clínica: . Es un criterio...")
  reasoning = reasoning.replace(/^[\s.]+/, '');
  
  // Capitalize first letter of reasoning
  if (reasoning.length > 0) {
     reasoning = reasoning.charAt(0).toUpperCase() + reasoning.slice(1);
  }
  reasoning = reasoning.trim();
  
  if (isCorrect) {
    // "Formato: [Confirmación breve]. [Dato adicional que amplía la comprensión.]"
    return reasoning ? `Correcto. ${reasoning}` : "Correcto.";
  } else {
    // Neutral correction. Focus on the clinical fact.
    if (reasoning) {
      // Pick prefix based on the context of the reasoning or error type
      let prefix = "Nota clínica:";
      const lowerReasoning = reasoning.toLowerCase();
      
      if (lowerReasoning.includes("red flag") || lowerReasoning.includes("letal") || lowerReasoning.includes("vital")) {
        prefix = "🚨 ¡ERROR CRÍTICO!";
      } else if (lowerReasoning.includes("ruido") || lowerReasoning.includes("irrelevante") || lowerReasoning.includes("basura")) {
        prefix = "🧹 DESCARTE RECOMENDADO:";
      } else if (lowerReasoning.includes("importante") || lowerReasoning.includes("clave")) {
        prefix = "🎯 DATO CLAVE OMITIDO:";
      } else {
        const prefixes = ["Nota clínica:", "Punto clave:", "Recordatorio:"];
        prefix = prefixes[reasoning.length % prefixes.length];
      }
      
      return `${prefix} ${reasoning}`;
    } else {
      return "Esta decisión no sostiene. Revísala antes de cerrar el caso.";
    }
  }
};

/**
 * Deriva el avatar del mentor a partir del prefijo del comentario
 * ("Castillo: …", "Navarro: …"). Mendoza/Vázquez/sin prefijo → 'mendoza'
 * (el único otro avatar definido en AvatarFeedback).
 */
export const getMentorAvatar = (comment: string | undefined): 'mendoza' | 'castillo' | 'navarro' => {
  const m = comment?.match(/^\s*(Castillo|Navarro)\s*:/i);
  if (m) return m[1].toLowerCase() as 'castillo' | 'navarro';
  return 'mendoza';
};

/**
 * Shuffles the options of a boss question and updates the correct_index.
 * Returns a NEW object to avoid mutations.
 */
export function shuffleBossQuestion(q: BossQuestion): BossQuestion {
  const optionsWithMeta = q.options.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === q.correct_index
  }));

  // Fisher-Yates shuffle
  for (let i = optionsWithMeta.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsWithMeta[i], optionsWithMeta[j]] = [optionsWithMeta[j], optionsWithMeta[i]];
  }

  return {
    ...q,
    options: optionsWithMeta.map(o => o.text),
    correct_index: optionsWithMeta.findIndex(o => o.isCorrect)
  };
}
