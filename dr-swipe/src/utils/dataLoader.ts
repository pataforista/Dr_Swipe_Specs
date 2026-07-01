import type { ClinicalCase } from '../types/game';
import { ClinicalCaseSchema } from './caseSchema';

/**
 * React DataLoader: Handles fetching clinical cases from the public/cases directory.
 * Validates data against ClinicalCaseSchema using Zod.
 */
export const dataLoader = {
  loadCase: async (caseId: string): Promise<ClinicalCase> => {
    // Strip diacritics so a stale/accent-corrupted case_id (e.g. an old saved
    // session persisted as "PROC_PED_EXÁNT_MEÁSLES…") still resolves to the
    // ASCII filename on disk instead of 404'ing.
    const asciiId = caseId.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const safeId = encodeURIComponent(asciiId.toUpperCase());
    const response = await fetch(`${import.meta.env.BASE_URL}cases/CASE_${safeId}.json`);
    if (response.status === 404) throw new Error(`Case not found: ${caseId}`);
    if (!response.ok) throw new Error(`Failed to load case: ${response.status} - ${caseId}`);
    // The SPA fallback (_redirects) answers missing files with index.html and a
    // 200 status, so a non-JSON content-type is really a "case not found".
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) throw new Error(`Case not found (SPA fallback): ${caseId}`);

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
      const spec = specialty.toLowerCase();
      if (spec === 'go') {
        filtered = index.filter(id => id.includes('_GYN_') || id.includes('_OBS_'));
      } else if (spec === 'ped') {
        filtered = index.filter(id => id.includes('_PED_'));
      } else if (spec === 'surg') {
        filtered = index.filter(id => id.includes('_SURG_'));
      } else if (spec === 'im') {
        filtered = index.filter(id => 
          !id.includes('_GYN_') && 
          !id.includes('_OBS_') && 
          !id.includes('_PED_') && 
          !id.includes('_SURG_') &&
          !id.startsWith('SWIPE_')
        );
      } else {
        filtered = index.filter(id => id.toLowerCase().includes(spec));
      }
    }

    if (filtered.length === 0) {
      throw new Error(`No cases found for specialty: ${specialty}`);
    }

    // Pure Randomization: Pick randomly from ANY available sanitized case
    const finalId = filtered[Math.floor(Math.random() * filtered.length)];

    return await dataLoader.loadCase(finalId);
  },

  /**
   * Load `count` random cases in parallel, sampling WITHOUT replacement so a
   * shift never repeats the same patient.
   */
  loadRandomCases: async (count: number, specialty: string = 'all', excludeIds: string[] = []): Promise<ClinicalCase[]> => {
    const indexResponse = await fetch(`${import.meta.env.BASE_URL}cases/case_index.json`);
    if (!indexResponse.ok) throw new Error('Failed to load case index');
    let index: string[] = await indexResponse.json();

    if (specialty !== 'all') {
      const spec = specialty.toLowerCase();
      if (spec === 'go') {
        index = index.filter(id => id.includes('_GYN_') || id.includes('_OBS_'));
      } else if (spec === 'ped') {
        index = index.filter(id => id.includes('_PED_'));
      } else if (spec === 'surg') {
        index = index.filter(id => id.includes('_SURG_'));
      } else if (spec === 'im') {
        index = index.filter(id => 
          !id.includes('_GYN_') && 
          !id.includes('_OBS_') && 
          !id.includes('_PED_') && 
          !id.includes('_SURG_') &&
          !id.startsWith('SWIPE_')
        );
      } else {
        index = index.filter(id => id.toLowerCase().includes(spec));
      }
    }
    
    // Exclude recently solved cases
    let pool = index.filter(id => !excludeIds.includes(id));
    if (pool.length < count) {
      pool = index;
    }

    if (pool.length === 0) throw new Error(`No cases found for specialty: ${specialty}`);

    // Partial Fisher-Yates: shuffle just the first `count` slots
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return await Promise.all(pool.slice(0, n).map(id => dataLoader.loadCase(id)));
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
