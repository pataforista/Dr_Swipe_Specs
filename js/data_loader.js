import { validateCase, logValidationResult } from './validate_case.js';

export class DataLoader {
    constructor() {
        this.basePath = 'cases/';
    }

    async loadCase(caseId) {
        if (!caseId) throw new Error('Case ID is required');

        try {
            // Updated path logic - some cases might be procedural
            // This logic attempts to normalize the caseId to a filename format like 'CASE_ID.json'
            // It adds 'CASE_' prefix if missing and ensures it's not duplicated.
            let normalizedCaseId = caseId.toUpperCase().replace(/^CASE_/, ''); // Remove existing 'CASE_' if present
            let casePath = `${this.basePath}CASE_${normalizedCaseId}.json`;

            const response = await fetch(casePath);

            if (!response.ok) {
                console.error(`Status ${response.status} fetching case ${caseId} from ${casePath}`);
                throw new Error(`Failed to load case data: ${response.statusText}`);
            }

            const data = await response.json();

            // ── Validación de integridad del caso ──────────────────────────
            const validation = validateCase(data);
            logValidationResult(validation);

            if (!validation.valid) {
                console.error(
                    `[DataLoader] Caso "${caseId}" tiene ${validation.errors.length} error(es) crítico(s). ` +
                    `Revisa la consola para detalles.`
                );
            }
            // No se bloquea la carga; el validador actúa como monitor de calidad.
            // ──────────────────────────────────────────────────────────────

            return data;
        } catch (error) {
            console.error("Failed to load case:", error);
            throw error;
        }
    }

    async loadProceduralCase(prefix = 'all') {
        try {
            const indexResponse = await fetch(`${this.basePath}case_index.json`);
            if (!indexResponse.ok) throw new Error('Could not load case_index.json');

            const caseIndex = await indexResponse.json();
            if (!caseIndex || caseIndex.length === 0) throw new Error('No procedural cases available.');

            // Filter by specialty if prefix is not 'all'
            let validCases = caseIndex;
            if (prefix !== 'all') {
                validCases = caseIndex.filter(id => id.includes(prefix));
                if (validCases.length === 0) validCases = caseIndex; // fallback if empty
            }

            // Pick a random case id from the filtered index
            const randomId = validCases[Math.floor(Math.random() * validCases.length)];
            return await this.loadCase(randomId);
        } catch (error) {
            console.error('Error loading procedural case:', error);
            // Fallback to a known V2 procedural case if index fails
            return await this.loadCase('case_proc_surg_appendicitis_001_001');
        }
    }
}
