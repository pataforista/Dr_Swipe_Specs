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
  // Capitalize first letter of reasoning
  if (reasoning.length > 0) {
     reasoning = reasoning.charAt(0).toUpperCase() + reasoning.slice(1);
  }
  reasoning = reasoning.trim();
  
  if (isCorrect) {
    // "Formato: [Confirmación breve]. [Dato adicional que amplía la comprensión.]"
    return reasoning ? `Correcto. ${reasoning}` : "Correcto.";
  } else {
    // No moralizing. Clinical correction.
    if (reasoning) {
      // Pick prefix deterministically based on reasoning length
      const prefixes = ["Error de criterio:", "Revisión necesaria:", "Atención:"];
      const prefix = prefixes[reasoning.length % prefixes.length];
      return `${prefix} ${reasoning}`;
    } else {
      return "Esta decisión no sostiene. Revísala antes de cerrar el caso.";
    }
  }
};
