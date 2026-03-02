import { validateCase, logValidationResult } from './validate_case.js';

export class DataLoader {
    constructor() {
        this.basePath = 'cases/';
    }

    async loadCase(caseId) {
        // Construct path. For v1 we assume standard naming or pass full filename
        // In specs: cases/CASE_SWIPE_EASY_001.json
        // We'll try to load exactly that file given the ID "CASE_SWIPE_EASY_001"
        const fileName = `${caseId.toUpperCase()}.json`;
        const url = `${this.basePath}${fileName}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
}
