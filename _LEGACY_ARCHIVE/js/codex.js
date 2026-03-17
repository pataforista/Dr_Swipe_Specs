/**
 * CodexManager - Gestor de persistencia y especialidades para el Códice de Guardia.
 * Organiza las Perlas ENARM por temas y registra errores memorables.
 */
export class CodexManager {
    constructor() {
        this.storageKey = 'dr_swipe_codex_v1';
        this.data = this.loadCodex();
    }

    loadCodex() {
        const data = localStorage.getItem(this.storageKey);
        // Estructura inicial: Temas (perlas) y Errores (lista plana)
        return data ? JSON.parse(data) : {
            perlas: {
                'theme-psych': [],
                'theme-surg': [],
                'theme-im': [],
                'theme-peds': [],
                'theme-gyn': []
            },
            errors: [] // Lista de errores memorables
        };
    }

    savePearl(themeConfig, perlaData, caseId) {
        if (!perlaData) return false;
        
        // Normalizar themeConfig por si viene con prefijos o variaciones
        const theme = this.normalizeTheme(themeConfig);
        
        if (!this.data.perlas[theme]) {
            this.data.perlas[theme] = [];
        }

        const alreadyUnlocked = this.data.perlas[theme].find(p => p.caseId === caseId);
        
        if (!alreadyUnlocked) {
            this.data.perlas[theme].push({
                caseId: caseId,
                dateUnlocked: new Date().toISOString(),
                perla: perlaData
            });
            this.persist();
            return true;
        }
        return false;
    }

    saveError(errorData) {
        // Evitar duplicados por evidencia en el mismo caso
        const alreadyLogged = this.data.errors.find(e => 
            e.case_id === errorData.case_id && e.evidence_id === errorData.evidence_id
        );

        if (!alreadyLogged) {
            this.data.errors.push({
                ...errorData,
                dateLogged: new Date().toISOString()
            });
            this.persist();
            return true;
        }
        return false;
    }

    normalizeTheme(themeId) {
        // Asegurar que mapee a nuestras claves internas
        if (themeId.includes('psych')) return 'theme-psych';
        if (themeId.includes('surg')) return 'theme-surg';
        if (themeId.includes('peds')) return 'theme-peds';
        if (themeId.includes('gyn')) return 'theme-gyn';
        return 'theme-im'; // Default a Medicina Interna
    }

    persist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    getPerlasByTheme(theme) {
        return this.data.perlas[this.normalizeTheme(theme)] || [];
    }

    getErrors() {
        return this.data.errors || [];
    }
}
