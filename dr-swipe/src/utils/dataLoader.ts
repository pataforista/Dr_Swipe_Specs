import type { ClinicalCase } from '../types/game';

/**
 * React DataLoader: Handles fetching clinical cases from the public/cases directory.
 */
export const dataLoader = {
  loadCase: async (caseId: string): Promise<ClinicalCase> => {
    const safeId = encodeURIComponent(caseId.toUpperCase());
    const response = await fetch(`/cases/CASE_${safeId}.json`);
    if (response.status === 404) throw new Error(`Case not found: ${caseId}`);
    if (!response.ok) throw new Error(`Failed to load case: ${response.status} - ${caseId}`);
    return await response.json();
  },

  loadRandomCase: async (specialty: string = 'all'): Promise<ClinicalCase> => {
    const indexResponse = await fetch('/cases/case_index.json');
    if (!indexResponse.ok) throw new Error('Failed to load case index');

    const index: string[] = await indexResponse.json();
    let filtered = index;

    if (specialty !== 'all') {
      filtered = index.filter(id => id.toLowerCase().includes(specialty.toLowerCase()));
    }

    if (filtered.length === 0) {
      throw new Error(`No cases found for specialty: ${specialty}`);
    }

    const randomId = filtered[Math.floor(Math.random() * filtered.length)];
    return await dataLoader.loadCase(randomId);
  }
};
