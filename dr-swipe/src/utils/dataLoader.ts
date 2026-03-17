import type { ClinicalCase } from '../types/game';

/**
 * React DataLoader: Handles fetching clinical cases from the public/cases directory.
 */
export const dataLoader = {
  loadCase: async (caseId: string): Promise<ClinicalCase> => {
    const response = await fetch(`/cases/CASE_${caseId.toUpperCase()}.json`);
    if (!response.ok) throw new Error(`Failed to load case: ${caseId}`);
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
    
    const randomId = filtered[Math.floor(Math.random() * filtered.length)];
    return await dataLoader.loadCase(randomId);
  }
};
