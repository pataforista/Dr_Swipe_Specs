export const ENGINE_STATE = {
    INTAKE: 'intake',
    STREAM: 'evidence_stream',
    CHECKPOINT: 'checkpoint',
    RESULTS: 'results',
    DOSSIER: 'dossier'
};

export class SwipeEngine {
    constructor() {
        this.state = ENGINE_STATE.INTAKE;
        this.currentCase = null;
        this.currentIndex = 0;

        // Dossier state
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {}; // map evidence_id -> text

        // Metrics for specs
        this.startTime = 0;
        this.checkpointsPassed = 0;

        this.lastFeedback = null;
        this.stats = {
            correct: 0,
            total: 0,
            streak: 0,
            bestStreak: 0,
            mistakes: []
        };
    }

    initializeSession(caseData) {
        this.currentCase = caseData;
        this.state = ENGINE_STATE.INTAKE;
        this.currentIndex = 0;
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {};
        this.checkpointsPassed = 0;
        this.lastFeedback = null;
        this.stats = {
            correct: 0,
            total: 0,
            streak: 0,
            bestStreak: 0,
            mistakes: []
        };
        console.log("Session initialized for:", caseData.case_id);
    }

    startReview() {
        this.state = ENGINE_STATE.STREAM;
        this.startTime = Date.now();
        // Determine if we are at start or valid index
        // In spec: evidence ordered by stream index
    }

    getCurrentCard() {
        if (!this.currentCase || this.currentIndex >= this.currentCase.evidence_stream.length) {
            return null;
        }
        return this.currentCase.evidence_stream[this.currentIndex];
    }

    handleSwipe(direction) {
        // direction: 'left' (discard) or 'right' (keep)
        const card = this.getCurrentCard();
        if (!card) return;

        this.registerDecision(direction, card);

        if (direction === 'right') {
            this.keptItems.push(card);
        } else {
            this.discardedItems.push(card);
        }

        // Check for checkpoint trigger AFTER this card index
        // The spec says "after_evidence_index": 4 means trigger after processing index 4 (0-based)
        const triggers = this.currentCase.checkpoint_triggers || [];
        const activeTrigger = triggers.find(t => t.after_evidence_index === this.currentIndex);

        this.currentIndex++;

        if (activeTrigger) {
            this.state = ENGINE_STATE.CHECKPOINT;
            return { action: 'checkpoint', trigger: activeTrigger };
        }

        // Check if end of stream
        if (this.currentIndex >= this.currentCase.evidence_stream.length) {
            this.state = ENGINE_STATE.DOSSIER; // or results
            return { action: 'finish' };
        }

        return { action: 'next_card' };
    }

    getExpectedAction(card) {
        const isNoise = card.noise_type && card.noise_type !== 'none';
        const isAdmin = card.category === 'admin' || (card.tags && card.tags.includes('admin'));
        return isNoise || isAdmin ? 'left' : 'right';
    }

    getDecisionRationale(card) {
        if (card.noise_type === 'duplicate') {
            return 'Duplicado: ya tienes este dato, no aporta nueva información clínica.';
        }
        if (card.noise_type === 'irrelevant_true') {
            return 'Dato real pero poco útil para decidir; no cambia la conducta clínica.';
        }
        const isAdmin = card.category === 'admin' || (card.tags && card.tags.includes('admin'));
        if (isAdmin) {
            return 'Administrativo: útil para contacto o logística, pero no para la decisión clínica.';
        }
        if (card.category === 'vitals') {
            return 'Signo vital clave: ayuda a valorar la estabilidad y gravedad del paciente.';
        }
        if (card.category === 'labs') {
            return 'Laboratorio relevante: confirma o descarta hipótesis clínicas.';
        }
        if (card.category === 'imaging') {
            return 'Imagenología: aporta evidencia objetiva para el diagnóstico.';
        }
        if (card.category === 'meds') {
            return 'Historial de medicamentos: influye en riesgos e interacciones.';
        }
        if (card.category === 'timeline' || card.category === 'notes') {
            return 'Contexto clínico: orienta la interpretación de los datos.';
        }
        return 'Aporta contexto o evidencia útil para la decisión clínica.';
    }

    getTeachingTip(card) {
        const expected = this.getExpectedAction(card);
        if (expected === 'left') {
            return 'Busca ruido: duplicados, datos administrativos o irrelevantes suelen descartarse.';
        }
        return 'Conserva lo que cambia una decisión: signos vitales, labs, imágenes o fármacos.';
    }

    registerDecision(direction, card) {
        const expected = this.getExpectedAction(card);
        const correct = direction === expected;
        this.stats.total += 1;
        if (correct) {
            this.stats.correct += 1;
            this.stats.streak += 1;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
        } else {
            this.stats.streak = 0;
            this.stats.mistakes.push({
                evidence_id: card.evidence_id,
                title: card.payload.title,
                category: card.category,
                expected
            });
        }

        this.lastFeedback = {
            correct,
            expected,
            rationale: this.getDecisionRationale(card),
            title: card.payload.title,
            category: card.category
        };
    }

    proceedFromCheckpoint() {
        // Logic to validate decision would go here.
        // For minimal spec, we just continue.
        this.checkpointsPassed++;

        // If there are more cards, go back to stream
        if (this.currentIndex < this.currentCase.evidence_stream.length) {
            this.state = ENGINE_STATE.STREAM;
        } else {
            this.state = ENGINE_STATE.RESULTS;
        }
    }

    annotate(text) {
        // Annotate current card
        const card = this.getCurrentCard();
        if (card) {
            this.annotations[card.evidence_id] = text;
        }
    }

    getProgress() {
        if (!this.currentCase) return 0;
        return (this.currentIndex / this.currentCase.evidence_stream.length) * 100;
    }

    getAccuracy() {
        if (!this.stats.total) return 0;
        return Math.round((this.stats.correct / this.stats.total) * 100);
    }
}
