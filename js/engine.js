export const ENGINE_STATE = {
    INTRO: 'intro',
    INTAKE: 'intake',
    STREAM: 'evidence_stream',
    CHECKPOINT: 'checkpoint',
    FINAL_TRIAD: 'final_triad',
    RESULTS: 'results',
    DOSSIER: 'dossier'
};

export class SwipeEngine {
    constructor() {
        this.state = ENGINE_STATE.INTRO;
        this.currentCase = null;
        this.currentIndex = 0;
        this.tutorialActive = true;

        // Dossier state
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {}; // map evidence_id -> text

        // Metrics for specs
        this.startTime = 0;
        this.checkpointsPassed = 0;

        this.lastFeedback = null;
        this.confidence = 50; // Starts at 50%
        this.quizResults = [];
        this.currentCheckpoint = null;
        this.stats = {
            correct: 0,
            total: 0,
            streak: 0,
            bestStreak: 0,
            mistakes: [],
            neuronas: 0
        };
    }

    initializeSession(caseData) {
        this.currentCase = caseData;
        this.state = ENGINE_STATE.INTRO;
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
        this.updateConfidence(correct, card);

        if (activeTrigger) {
            this.state = ENGINE_STATE.CHECKPOINT;
            this.currentCheckpoint = this.currentCase.checkpoint_quizzes
                ? this.currentCase.checkpoint_quizzes.find(q => q.checkpoint_sequence === activeTrigger.checkpoint_sequence)
                : null;
            return { action: 'checkpoint', trigger: activeTrigger, quiz: this.currentCheckpoint };
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

    updateConfidence(isCorrect, card) {
        const delta = isCorrect ? 10 : -15;
        // Signals are more important for confidence
        const weight = card.noise_type === 'none' ? 1.5 : 1.0;

        this.confidence = Math.min(100, Math.max(0, this.confidence + (delta * weight)));
    }

    getUnlockedHints(quiz) {
        if (!quiz || !quiz.required_evidence_ids) return [];

        const keptIds = this.keptItems.map(i => i.evidence_id);
        return quiz.required_evidence_ids.filter(id => keptIds.includes(id));
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

    proceedFromCheckpoint(answerIndex) {
        // If there was a quiz, validate answer
        if (this.currentCheckpoint) {
            const isCorrect = answerIndex === this.currentCheckpoint.correct_index;
            this.quizResults.push({
                checkpoint: this.currentCheckpoint.checkpoint_sequence,
                correct: isCorrect,
                question: this.currentCheckpoint.question
            });

            if (isCorrect) {
                this.stats.neuronas += 50;
                this.confidence = Math.min(100, this.confidence + 15);
            } else {
                this.confidence = Math.max(0, this.confidence - 10);
            }
        }

        this.checkpointsPassed++;
        this.currentCheckpoint = null;

        // If there are more cards, go back to stream
        if (this.currentIndex < this.currentCase.evidence_stream.length) {
            this.state = ENGINE_STATE.STREAM;
        } else {
            this.state = ENGINE_STATE.FINAL_TRIAD;
            this.currentTriadIndex = 0;
        }
    }

    handleTriadAnswer(answerIndex) {
        const triad = this.currentCase.final_triad[this.currentTriadIndex];
        const isCorrect = answerIndex === triad.correct_index;

        if (isCorrect) {
            this.stats.neuronas += 100;
            this.confidence = Math.min(100, this.confidence + 10);
        } else {
            this.confidence = Math.max(0, this.confidence - 20);
        }

        this.currentTriadIndex++;
        if (this.currentTriadIndex >= this.currentCase.final_triad.length) {
            this.state = ENGINE_STATE.RESULTS;
            return { action: 'finish' };
        }
        return { action: 'next_triad' };
    }

    annotate(text) {
        // Annotate current card
        const card = this.getCurrentCard();
        if (card) {
            this.annotations[card.evidence_id] = text;
        }
    }

    getMission() {
        if (!this.currentCase) return "Iniciando revisión...";

        // Map difficulty or tags to a specific mission statement
        const missions = {
            'easy': 'Filtra el ruido básico: descarta duplicados y datos administrativos.',
            'standard': 'Expediente crítico: conserva solo evidencia que defina una conducta clínica.',
            'hard': 'Alta complejidad: ignora distractores sutiles y prioriza señales de riesgo.'
        };

        return missions[this.currentCase.difficulty] || 'Revisa el expediente y construye el dossier clínico.';
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
