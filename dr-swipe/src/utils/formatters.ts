/**
 * Sanitizes feedback comments to avoid confusing "Excellent" praise during clinical errors.
 */
export const cleanVazquezComment = (comment: string | undefined, isCorrect: boolean): string => {
  if (!comment) return "";
  
  // Remove prefix like "Castillo:" or "Vazquez:"
  let clean = comment.includes(':') ? comment.split(':')[1].trim() : comment;
  
  // Remove leading/trailing quotes if present
  clean = clean.replace(/^"|"$/g, '').trim();

  if (!isCorrect) {
    // List of positive prefixes in Spanish to strip during errors
    const positivePrefixes = [
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
    
    let previousClean = "";
    // Apply multiple times to handle things like "¡Excelente! ¡Muy bien! [text]"
    while (clean !== previousClean) {
      previousClean = clean;
      positivePrefixes.forEach(regex => {
        clean = clean.replace(regex, '');
      });
      clean = clean.trim();
    }
    
    // Capitalize first letter of remaining text
    if (clean.length > 0) {
      clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }
  
  return clean;
};
