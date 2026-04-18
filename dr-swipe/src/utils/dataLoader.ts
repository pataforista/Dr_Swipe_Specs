import type { ClinicalCase } from '../types/game';
import { ClinicalCaseSchema } from './caseSchema';

/**
 * React DataLoader: Handles fetching clinical cases from the public/cases directory.
 * Validates data against ClinicalCaseSchema using Zod.
 */
export const dataLoader = {
  loadCase: async (caseId: string): Promise<ClinicalCase> => {
    const safeId = encodeURIComponent(caseId.toUpperCase());
    const response = await fetch(`${import.meta.env.BASE_URL}cases/CASE_${safeId}.json`);
    if (response.status === 404) throw new Error(`Case not found: ${caseId}`);
    if (!response.ok) throw new Error(`Failed to load case: ${response.status} - ${caseId}`);

    const raw = await response.json();
    const result = ClinicalCaseSchema.safeParse(raw);

    if (!result.success) {
      const error = result.error.flatten();
      console.error(`Caso inválido [${raw?.case_id}]:`, error);
      throw new Error(`Case validation failed for ${caseId}: ${JSON.stringify(error.fieldErrors).slice(0, 100)}`);
    }

    return result.data as ClinicalCase;
  },

  loadRandomCase: async (specialty: string = 'all'): Promise<ClinicalCase> => {
    let index: string[] = [];

    try {
      const indexResponse = await fetch(`${import.meta.env.BASE_URL}cases/case_index.json`);
      if (!indexResponse.ok) throw new Error('Failed to load case index');
      index = await indexResponse.json();
    } catch (err) {
      console.error('Failed to load case index, attempting fallback:', err);
      throw new Error('Unable to load case index. Please refresh the page.');
    }

    let filtered = index;

    if (specialty !== 'all') {
      filtered = index.filter(id => id.toLowerCase().includes(specialty.toLowerCase()));
    }

    if (filtered.length === 0) {
      throw new Error(`No cases found for specialty: ${specialty}`);
    }

    // Pure Randomization: Pick randomly from ANY available sanitized case
    const finalId = filtered[Math.floor(Math.random() * filtered.length)];

    return await dataLoader.loadCase(finalId);
  },

  /**
   * Load a specific case by its exact case_id (used for session resumption).
   * The caseId stored in sessionProgress maps directly to a filename via the index.
   */
  loadCaseById: async (caseId: string): Promise<ClinicalCase> => {
    // The case_id in JSON files uses the full stem (e.g. "PROC_CARD_IAM_001_001")
    // loadCase prefixes with "CASE_" when building the URL, so we just pass the ID as-is.
    // Strip the "CASE_" prefix if it somehow got persisted in sessionProgress.
    const sanitizedId = caseId.replace(/^CASE_/i, '');
    return await dataLoader.loadCase(sanitizedId);
  }
};
