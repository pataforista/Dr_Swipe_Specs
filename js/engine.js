export const ENGINE_STATE = {
    INTRO: 'intro',
    INTAKE: 'intake',
    STREAM: 'evidence_stream',
    CHECKPOINT: 'checkpoint',
    FINAL_TRIAD: 'final_triad',
    RESULTS: 'results',
    DOSSIER: 'dossier'
};

// Noise types that should be discarded
const NOISE_TYPES_DISCARD = new Set([
    'duplicate',
    'irrelevant_true',
    'borderline',
    'delayed_result',
    'false_alarm'
]);

export class SwipeEngine {
    constructor() {
        this.state = ENGINE_STATE.INTRO;
        this.currentCase = null;
        this.currentIndex = 0;
        this.tutorialActive = true;

        // Dossier state
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {};
        this.pinnedItems = new Set();

        // Metrics
        this.startTime = 0;
        this.checkpointsPassed = 0;

        this.lastFeedback = null;
        this.confidence = 50;
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

        // Advanced Gameplay
        this.worldState = {};
        this.synergyRules = [];
        this.timeFocus = 100;
        this.eventLog = [];
    }

    initializeSession(caseData) {
        this.currentCase = caseData;
        this.state = ENGINE_STATE.INTRO;
        this.currentIndex = 0;
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {};
        this.pinnedItems = new Set();
        this.checkpointsPassed = 0;
        this.lastFeedback = null;
        this.stats = {
            correct: 0,
            total: 0,
            streak: 0,
            bestStreak: 0,
            mistakes: [],
            neuronas: 0  // FIX: was missing from reset
        };

        this.worldState = {
            paciente_estable: true,
            alerta_iatrogenia: false
        };
        this.timeFocus = 100;
        this.confidence = 50;
        this.synergyRules = (caseData.synergy_rules || []).map(r => ({ ...r, active: false }));

        console.log("Session initialized for:", caseData.case_id);
    }

    startReview() {
        this.state = ENGINE_STATE.STREAM;
        this.startTime = Date.now();
    }

    getCurrentCard() {
        if (!this.currentCase || this.currentIndex >= this.currentCase.evidence_stream.length) {
            return null;
        }
        return this.currentCase.evidence_stream[this.currentIndex];
    }

    handleSwipe(direction) {
        const card = this.getCurrentCard();
        if (!card) return;

        // FIX: registerDecision now returns `correct` so updateConfidence gets it
        const correct = this.registerDecision(direction, card);

        if (direction === 'right') {
            this.keptItems.push(card);
        } else {
            this.discardedItems.push(card);
        }

        // Check for checkpoint trigger AFTER this card index
        const triggers = this.currentCase.checkpoint_triggers || [];
        const activeTrigger = triggers.find(t => t.after_evidence_index === this.currentIndex);

        this.currentIndex++;
        this.updateConfidence(correct, card);  // FIX: `correct` is now properly defined
        this.updateTimeFocus(direction, card);

        // Check for Narrative Triggers
        const triggerResult = this.evaluateTriggers(direction, card);

        // Check for Synergy (Intuition)
        const synergyResult = this.checkSynergy();

        if (activeTrigger) {
            this.state = ENGINE_STATE.CHECKPOINT;
            this.currentCheckpoint = this.currentCase.checkpoint_quizzes
                ? this.currentCase.checkpoint_quizzes.find(q => q.checkpoint_sequence === activeTrigger.checkpoint_sequence)
                : null;
            return {
                action: 'checkpoint',
                trigger: activeTrigger,
                quiz: this.currentCheckpoint,
                narration: triggerResult,
                intuition: synergyResult
            };
        }

        // Check if end of stream
        if (this.currentIndex >= this.currentCase.evidence_stream.length) {
            this.state = ENGINE_STATE.FINAL_TRIAD;
            this.currentTriadIndex = 0;
            return { action: 'finish', intuition: synergyResult };
        }

        return {
            action: 'next_card',
            narration: triggerResult,
            intuition: synergyResult
        };
    }

    updateTimeFocus(direction, card) {
        const baseCost = 2;
        const heavyPenalty = 5;

        this.timeFocus -= baseCost;

        if (direction === 'left' && this.getExpectedAction(card) === 'right') {
            this.timeFocus -= heavyPenalty;
        }

        this.timeFocus = Math.max(0, this.timeFocus);
    }

    evaluateTriggers(direction, card) {
        const triggers = card.triggers || [];
        let narration = null;

        triggers.forEach(t => {
            const actionMatch = (direction === 'right' && t.on_action === 'keep') ||
                (direction === 'left' && t.on_action === 'discard');

            if (actionMatch) {
                if (t.set_flag) {
                    this.worldState[t.set_flag] = t.value !== undefined ? t.value : true;
                }
                if (t.narration) narration = t.narration;
            }
        });

        return narration;
    }

    checkSynergy() {
        if (!window.jsonLogic) return null;

        let foundSynergy = null;
        const context = {
            kept_ids: this.keptItems.map(i => i.evidence_id),
            world_state: this.worldState,
            stats: this.stats
        };

        this.synergyRules.forEach(rule => {
            if (!rule.active && window.jsonLogic.apply(rule.condition, context)) {
                rule.active = true;
                this.stats.neuronas += rule.bonus || 50;
                foundSynergy = rule.message;
            }
        });

        return foundSynergy;
    }

    // FIX: Extended to recognize all noise types from schema
    getExpectedAction(card) {
        const isNoise = card.noise_type && NOISE_TYPES_DISCARD.has(card.noise_type);
        const isAdmin = card.category === 'admin' ||
            (card.tags && (card.tags.includes('admin') || card.tags.includes('administrative')));
        // Explicit is_signal override from schema
        if (card.is_signal === false) return 'left';
        if (card.is_signal === true && !isAdmin) return 'right';
        return isNoise || isAdmin ? 'left' : 'right';
    }

    getDecisionRationale(card) {
        if (card.noise_type === 'duplicate') {
            return 'Duplicado: ya tienes este dato. No aporta nueva información para la decisión.';
        }
        if (card.noise_type === 'irrelevant_true') {
            return 'Dato real pero irrelevante: no cambia la conducta clínica en este momento.';
        }
        if (card.noise_type === 'borderline') {
            return 'Dato borderline: su valor clínico es cuestionable en este contexto. Descartar reduce el ruido del expediente.';
        }
        if (card.noise_type === 'delayed_result') {
            return 'Resultado tardío: llegó fuera del momento útil; la decisión ya fue tomada sin él.';
        }
        if (card.noise_type === 'false_alarm') {
            return 'Falsa alarma: el evento fue autolimitado y no requiere acción. Registrarlo inflaría el expediente.';
        }
        const isAdmin = card.category === 'admin' ||
            (card.tags && (card.tags.includes('admin') || card.tags.includes('administrative')));
        if (isAdmin) {
            return 'Dato administrativo: útil para contacto o logística, pero no para la decisión clínica.';
        }
        if (card.category === 'vitals') {
            return 'Signo vital clave: permite valorar estabilidad hemodinámica y gravedad del paciente.';
        }
        if (card.category === 'labs') {
            return 'Laboratorio relevante: confirma o descarta hipótesis clínicas diagnósticas.';
        }
        if (card.category === 'imaging') {
            return 'Imagenología: aporta evidencia objetiva y orienta el diagnóstico diferencial.';
        }
        if (card.category === 'meds') {
            return 'Historial farmacológico: influye en riesgos, interacciones e indicaciones terapéuticas.';
        }
        if (card.category === 'timeline' || card.category === 'notes') {
            return 'Contexto clínico: orienta la cronología o interpretación de los datos.';
        }
        return 'Este dato aporta contexto o evidencia útil para la decisión clínica.';
    }

    getTeachingTip(card) {
        const expected = this.getExpectedAction(card);
        if (card.noise_type === 'duplicate') {
            return '💡 Tip: Los duplicados no aportan información nueva. Descartar mejora la precisión del expediente.';
        }
        if (card.noise_type === 'false_alarm' || card.noise_type === 'borderline') {
            return '💡 Tip: Datos de alarma que se resuelven solos son ruido trampa — el ENARM los usa para distraer.';
        }
        if (card.noise_type === 'delayed_result') {
            return '💡 Tip: Un resultado llegado tarde ya no guía la decisión inmediata.';
        }
        if (card.category === 'vitals') {
            return '💡 Tip: Los signos vitales son la primera lectura del ENARM — nunca los descuides.';
        }
        if (card.category === 'labs') {
            return '💡 Tip: En el ENARM, los labs confirman o descartan síndromes — lee el valor, no solo el nombre.';
        }
        if (card.category === 'imaging') {
            return '💡 Tip: La imagenología en el ENARM confirma diagnóstico o indica urgencia quirúrgica.';
        }
        if (card.category === 'meds') {
            return '💡 Tip: El historial farmacológico puede esconder contraindicaciones clave para el ENARM.';
        }
        if (expected === 'left') {
            return '💡 Tip: Busca ruido: duplicados, alertas autolimitadas o datos fuera de tiempo.';
        }
        return '💡 Tip: Conserva lo que cambia una decisión: vitales, labs, imagen o fármacos.';
    }

    updateConfidence(isCorrect, card) {
        const delta = isCorrect ? 10 : -15;
        const weight = (card.noise_type === 'none' || !card.noise_type) ? 1.5 : 1.0;
        this.confidence = Math.min(100, Math.max(0, this.confidence + (delta * weight)));
    }

    getUnlockedHints(quiz) {
        if (!quiz || !quiz.required_evidence_ids) return [];
        const keptIds = this.keptItems.map(i => i.evidence_id);
        return quiz.required_evidence_ids.filter(id => keptIds.includes(id));
    }

    // FIX: returns `correct` boolean so handleSwipe can use it
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
            category: card.category,
            noiseType: card.noise_type
        };

        return correct;  // FIX: return correct for handleSwipe to use
    }

    proceedFromCheckpoint(answerIndex) {
        if (this.currentCheckpoint) {
            const correctIndex = this.currentCheckpoint.correct_index;
            const isCorrect = answerIndex === correctIndex;
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

        this.quizResults.push({
            type: 'triad',
            triadType: triad.type,
            correct: isCorrect,
            question: triad.question
        });

        this.currentTriadIndex++;
        if (this.currentTriadIndex >= this.currentCase.final_triad.length) {
            this.calculateDossierScore();
            this.state = ENGINE_STATE.RESULTS;
            return { action: 'finish' };
        }
        return { action: 'next_triad' };
    }

    annotate(text) {
        const card = this.getCurrentCard();
        if (card) {
            this.annotations[card.evidence_id] = text;
        }
    }

    getMission() {
        if (!this.currentCase) return "Iniciando revisión...";

        const missions = {
            'easy': '🟢 Nivel Básico — Filtra duplicados y datos administrativos del expediente.',
            'standard': '🟡 Nivel Estándar — Conserva solo evidencia que defina una conducta clínica.',
            'hard': '🔴 Nivel Avanzado — Ignora distractores sutiles y prioriza señales de riesgo vital.'
        };

        return missions[this.currentCase.difficulty] || 'Revisa el expediente y construye el dossier clínico.';
    }

    getCaseMeta() {
        return this.currentCase?.case_meta || null;
    }

    getProgress() {
        if (!this.currentCase) return 0;
        return (this.currentIndex / this.currentCase.evidence_stream.length) * 100;
    }

    getAccuracy() {
        if (!this.stats.total) return 0;
        return Math.round((this.stats.correct / this.stats.total) * 100);
    }

    pinItem(evidenceId) {
        if (this.pinnedItems.size < 3) {
            this.pinnedItems.add(evidenceId);
        }
    }

    unpinItem(evidenceId) {
        this.pinnedItems.delete(evidenceId);
    }

    calculateDossierScore() {
        const keptNoise = this.keptItems.filter(i => this.getExpectedAction(i) === 'left').length;
        this.stats.scoring_tags = [];

        // Penalties
        if (keptNoise >= 3) {
            this.stats.scoring_tags.push('hoarding');
            this.stats.neuronas -= 50;
        }
        if (this.stats.mistakes.some(m => m.expected === 'left')) {
            this.stats.scoring_tags.push('false_positive');
        }

        // Rewards
        const utilityRatio = this.keptItems.length > 0 ? (this.keptItems.length - keptNoise) / this.keptItems.length : 0;
        if (utilityRatio >= 0.8 && this.keptItems.length > 0) {
            this.stats.scoring_tags.push('precision');
            this.stats.neuronas += 50;
        }

        if (utilityRatio >= 0.8 && this.keptItems.length > 0 && this.keptItems.length <= 6) {
            this.stats.scoring_tags.push('clean_dossier');
            this.stats.neuronas += 50;
        }

        if (this.discardedItems.filter(i => i.noise_type === 'false_alarm' || i.noise_type === 'borderline').length >= 2) {
            this.stats.scoring_tags.push('clinical_eye');
            this.stats.neuronas += 75;
        }
    }
}
