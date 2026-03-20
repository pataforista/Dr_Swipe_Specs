/**
 * Creates contextual feedback comments based on whether the decision was correct or wrong.
 * For errors, provides corrective feedback instead of showing incorrect praise.
 */
export const cleanVazquezComment = (comment: string | undefined, isCorrect: boolean): string => {
  if (!comment) return "";

  // Extract base comment and doctor name
  let clean = comment;
  let doctorName = 'Vázquez';

  if (comment.includes(':')) {
    const [doctor, msg] = comment.split(':');
    doctorName = doctor.trim();
    clean = msg.trim();
  }

  // Remove surrounding quotes
  clean = clean.replace(/^"|"$/g, '').trim();

  if (!isCorrect) {
    // Try to extract the actual clinical reasoning from positive feedback
    const positiveMarkers = [
      /^¡?Excelente!?\s*/i,
      /^¡?Muy bien!?\s*/i,
      /^¡?Bien!?\s*/i,
      /^¡?Perfecto!?\s*/i,
      /^¡?Correcto!?\s*/i,
      /^¡?Buen trabajo!?\s*/i,
      /^¡?Genial!?\s*/i,
      /^¡?Fantástico!?\s*/i,
      /^¡?Logrado!?\s*/i
    ];

    // Remove positive markers to get the reasoning
    let reasoning = clean;
    positiveMarkers.forEach(regex => {
      reasoning = reasoning.replace(regex, '');
    });
    reasoning = reasoning.trim();

    // If we found reasoning, use it to create corrective feedback
    if (reasoning) {
      // Create contextual error message
      clean = `Fallo crítico: ${reasoning}`;
    } else {
      // Fallback for comments without reasoning
      clean = "Revisá esta decisión - no fue la correcta en este contexto.";
    }
  }

  return clean;
};
