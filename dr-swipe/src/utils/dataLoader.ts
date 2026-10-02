import type { ClinicalCase } from '../types/game';
import { ClinicalCaseSchema } from './caseSchema';
import { pickDistinctFamilies } from './deckOrder';

export interface CaseManifest {
  version: number;
  total: number;
  /** Case ids (without the CASE_ prefix) per specialty chip, built by regen_index.js. */
  specialties: Record<string, string[]>;
}

let manifestPromise: Promise<CaseManifest> | null = null;

/** Fetched once per page load; a failed fetch is not cached so a retry can succeed. */
export function loadManifest(): Promise<CaseManifest> {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}cases/manifest.json`);
      if (!response.ok) throw new Error('Failed to load case manifest');
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('json')) throw new Error('Failed to load case manifest (SPA fallback)');
      return (await response.json()) as CaseManifest;
    })().catch(err => {
      manifestPromise = null;
      throw err;
    });
  }
  return manifestPromise;
}

/** `all` is every group; an unknown specialty yields no ids. */
export function idsForSpecialty(manifest: CaseManifest, specialty: string): string[] {
  if (specialty === 'all') return Object.values(manifest.specialties).flat();
  return manifest.specialties[specialty.toLowerCase()] ?? [];
}

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

  /**
   * Load `count` random cases in parallel from distinct disease families, so a
   * shift never repeats the same patient and recent families are avoided.
   */
  loadRandomCases: async (count: number, specialty: string = 'all', excludeIds: string[] = []): Promise<ClinicalCase[]> => {
    const manifest = await loadManifest();
    const index = idsForSpecialty(manifest, specialty);
    if (index.length === 0) throw new Error(`No cases found for specialty: ${specialty}`);

    // One variant per disease family, avoiding recently played families.
    const ids = pickDistinctFamilies(index, count, excludeIds);
    // Only the picked cases are fetched (and Zod-validated), never the whole
    // specialty: a shift downloads `count` files however large the corpus is.
    return await Promise.all(ids.map(id => dataLoader.loadCase(id)));
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
