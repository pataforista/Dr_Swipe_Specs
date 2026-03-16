const ENGINE_STATE = {
    INTRO: 'intro',
    INTAKE: 'intake',
    STREAM: 'evidence_stream',
    CHECKPOINT: 'checkpoint',
    FINAL_TRIAD: 'final_triad',
    CONFIDENCE_CHECK: 'confidence_check',
    RESULTS: 'results',
    DOSSIER: 'dossier',
    GHOSTED: 'ghosted',
    THE_CHAT: 'the_chat',
    SHOCK_MODE: 'shock_mode',
    CRITICAL_ALERT: 'critical_alert',
    CODEX: 'codex'
};

export { ENGINE_STATE };

import { CodexManager } from './codex.js';

let NLG_ENGINE;
if (typeof require !== 'undefined') {
    NLG_ENGINE = require('./nlg_engine.js').NLG_ENGINE;
} else {
    // In browser, assume it's loaded as a global or handling it via standard imports elsewhere
    // This part is tricky if nlg_engine.js is an ES module too.
    // Given the previous setup, let's keep the dynamic promise but better.
    import('./nlg_engine.js').then(m => NLG_ENGINE = m.NLG_ENGINE).catch(e => console.warn("NLG_ENGINE failed to load:", e));
}

const NOISE_TYPES_DISCARD = new Set([
    'duplicate',
    'irrelevant_true',
    'borderline',
    'delayed_result',
    'false_alarm'
]);

const CATEGORY_ICONS = {
    vitals: '🩺',
    labs: '🧪',
    imaging: '📸',
    meds: '💊',
    timeline: '📋',
    notes: '🗒️',
    admin: '📁',
    psych: '🧠',
    clock: '🕒',
    thermometer: '🌡️',
    stomach: '🤢',
    money: '💸',
    family: '🌳',
    toxicity: '☢️'
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
        this.annotations = {};
        this.pinnedItems = new Set();
        this.formatVersion = 'v1';
        this.patientProfile = null;

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
        this.decisionHistory = [];
        this.cognitiveBiasTags = [];
        this.selfConfidence = null;
        this.diagnosticBudget = { points: 0, spent: 0, enabled: false };
        this.consult = { tokens: 1, used: 0 };

        // Gamification & Progression (Persisted)
        this.coins = 0;
        this.playerRank = 'MIP'; // MIP, R1, R2, R3, Jefe
        this.caseCount = 0;
        this.casesPerShock = 5;
        this.inventory = [];
        this.challenge = { target: 3, progress: 0, completed: false };
        
        // Initialize Codex Manager
        this.codexManager = new CodexManager(); 
        this.loadGamificationState();
    }

    loadGamificationState() {
        try {
            const state = JSON.parse(localStorage.getItem('drSwipeGameState')) || {};
            this.coins = state.coins || 0;
            this.playerRank = state.playerRank || 'MIP';
            this.playerRank = state.playerRank || 'MIP';
            this.caseCount = state.caseCount || 0;
            this.inventory = state.inventory || [];

            // Basic daily challenge persistence
            const today = new Date().toDateString();
            if (state.challengeDate !== today) {
                this.challenge = { target: 3, progress: 0, completed: false, date: today };
                this.saveGamificationState();
            } else {
                this.challenge = state.challenge || { target: 3, progress: 0, completed: false, date: today };
            }
        } catch (e) {
            console.warn("Could not load gamification state:", e);
        }
    }

    saveGamificationState() {
        try {
            const state = {
                coins: this.coins,
                playerRank: this.playerRank,
                caseCount: this.caseCount,
                inventory: this.inventory,
                challenge: this.challenge,
                challengeDate: this.challenge.date
            };
            localStorage.setItem('drSwipeGameState', JSON.stringify(state));
        } catch (e) {
            console.warn("Could not save gamification state:", e);
        }
    }

    addCoins(amount) {
        this.coins += amount;
        this.saveGamificationState();
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.saveGamificationState();
            return true;
        }
        return false;
    }

    updateChallengeState(isPerfect, isGhosted) {
        if (this.challenge.completed) return;

        if (isGhosted) {
            // Reset challenge streak on lethal mistake
            this.challenge.progress = 0;
        } else if (isPerfect) {
            this.challenge.progress += 1;
            if (this.challenge.progress >= this.challenge.target) {
                this.challenge.completed = true;
                this.addCoins(50); // Daily challenge reward
            }
        }
        this.saveGamificationState();
    }


    initializeSession(caseData) {
        this.currentCase = caseData;
        this.formatVersion = caseData.version || 'v1';
        
        // v3 migration: arrival_scenario instead of bio
        this.patientProfile = caseData.patient_intro || caseData.patient_profile || null;
        if (this.patientProfile && this.patientProfile.arrival_scenario) {
            this.patientProfile.bio = this.patientProfile.arrival_scenario;
        }
        
        this.state = ENGINE_STATE.INTRO;
        this.currentIndex = 0;
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {};
        this.pinnedItems = new Set();
        this.checkpointsPassed = 0;
        this.lastFeedback = null;
        this.decisionHistory = [];
        this.cognitiveBiasTags = [];
        this.selfConfidence = null;

        this.stats = {
            correct: 0,
            total: 0,
            streak: 0,
            bestStreak: 0,
            mistakes: [],
            neuronas: 0
        };

        // v3 support: use card_stream if evidence_stream is missing
        if (!this.currentCase.evidence_stream && this.currentCase.card_stream) {
            this.currentCase.evidence_stream = this.currentCase.card_stream;
        }

        this.worldState = {
            paciente_estable: true,
            alerta_iatrogenia: false
        };
        this.timeFocus = 100;
        this.confidence = 50;
        this.synergyRules = (caseData.synergy_rules || []).map(r => ({ ...r, active: false }));
        this.diagnosticBudget = {
            points: this.formatVersion === 'v3_swipe_action' ? 0 : (this.formatVersion === 'v2' ? 6 : 0),
            spent: 0,
            enabled: this.formatVersion === 'v2' || this.formatVersion === 'v3_swipe_action'
        };
        this.consult = { tokens: 1, used: 0 };

        // Triage Fatal: Process evidence with NLG_ENGINE
        if (NLG_ENGINE) {
            this.currentCase.evidence_stream = this.currentCase.evidence_stream.map(card => {
                return NLG_ENGINE.processCard(card);
            });

            // Inject occasional Mexican Noise if not a Boss Fight
            if (this.state !== ENGINE_STATE.SHOCK_MODE && this.playerRank === 'MIP') {
                 const noiseCard = NLG_ENGINE.getRandomNoise();
                 const pos = Math.floor(Math.random() * this.currentCase.evidence_stream.length);
                 this.currentCase.evidence_stream.splice(pos, 0, noiseCard);
            }
        }

        console.log("Session initialized for:", caseData.case_id, "Rank:", this.playerRank, "v3:", this.formatVersion === 'v3_swipe_action');
    }

    getCurrentCard() {
        if (!this.currentCase || this.currentIndex >= this.currentCase.evidence_stream.length) {
            return null;
        }
        let card = this.currentCase.evidence_stream[this.currentIndex];

        // V3: Dynamic (RNG) Values
        if (card.dynamic_value) {
            const dv = card.dynamic_value;
            const rngVal = Math.floor(Math.random() * (dv.max - dv.min + 1)) + dv.min;
            card.card_text = `${card.category}: ${rngVal} ${dv.unit}`;
            // If it's a triad/results card, update the payload too
            if (card.payload) {
                card.payload.text = card.card_text;
            }
        }

        return card;
    }

    handleSwipe(direction) {
        const card = this.getCurrentCard();
        if (!card) return;

        // FIX: registerDecision now returns `correct` so updateConfidence gets it
        const correct = this.registerDecision(direction, card);

        if (direction === 'right') {
            this.keptItems.push(card);
            this.consumeDiagnosticBudget(card);
        } else {
            this.discardedItems.push(card);
        }

        if (this.state === ENGINE_STATE.GHOSTED) {
            return { action: 'ghosted', feedback: this.lastFeedback };
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


    consumeDiagnosticBudget(card) {
        if (!this.diagnosticBudget.enabled) return;
        const consumableCategories = new Set(['labs', 'imaging']);
        if (!consumableCategories.has(card.category)) return;

        this.diagnosticBudget.points -= 1;
        this.diagnosticBudget.spent += 1;

        if (this.diagnosticBudget.points < 0) {
            this.stats.neuronas = Math.max(0, this.stats.neuronas - 25);
            this.stats.scoring_tags = this.stats.scoring_tags || [];
            if (!this.stats.scoring_tags.includes('overtesting')) {
                this.stats.scoring_tags.push('overtesting');
            }
        }
    }

    useInterconsult() {
        if (this.consult.tokens <= 0) return false;
        this.consult.tokens -= 1;
        this.consult.used += 1;
        this.stats.neuronas = Math.max(0, this.stats.neuronas - 30);
        return true;
    }

    applyInterconsultToOptions(optionsLength, correctIndex) {
        if (!this.useInterconsult()) return null;
        for (let i = 0; i < optionsLength; i++) {
            if (i !== correctIndex) return i;
        }
        return null;
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
        if (this.formatVersion === 'v3_swipe_action' && card.expected_action) {
            return card.expected_action === 'keep' ? 'right' : 'left';
        }
        if (this.formatVersion === 'v2') {
            return card.is_match ? 'right' : 'left';
        }
        const isNoise = card.noise_type && NOISE_TYPES_DISCARD.has(card.noise_type);
        const isAdmin = card.category === 'admin' ||
            (card.tags && Array.isArray(card.tags) && (card.tags.includes('admin') || card.tags.includes('administrative')));
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
            (card.tags && Array.isArray(card.tags) && (card.tags.includes('admin') || card.tags.includes('administrative')));
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

        // --- INTERCEPTOR DE VÁZQUEZ (A prueba de balas) ---
        // ¿Guardó (right) algo que era basura (left) y además era letal?
        const keptLethalNoise = (direction === 'right') && (expected === 'left') && card.safety_flags?.lethal_risk;

        // ¿Descartó (left) algo que era vital (right) y no se podía perder?
        const discardedLethalSignal = (direction === 'left') && (expected === 'right') && card.safety_flags?.lethal_if_discarded;

        if (keptLethalNoise || discardedLethalSignal) {
            this.state = ENGINE_STATE.GHOSTED;
            this.logLethalError(card);
            if (card.scoring?.vazquez_comment) {
                this.lastFeedback = { text: card.scoring.vazquez_comment, type: 'lethal' };
            }
        }

        this.stats.total += 1;
        if (correct) {
            this.stats.correct += 1;
            this.stats.streak += 1;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
        } else {
            this.stats.streak = 0;
            this.stats.mistakes.push({
                evidence_id: card.evidence_id || card.card_id,
                title: card.payload?.title || card.card_text || 'Evidencia',
                category: card.category,
                expected
            });
        }

        this.decisionHistory.push({
            direction,
            expected,
            category: card.category,
            isCorrect: correct,
            index: this.currentIndex
        });

        if (this.state !== ENGINE_STATE.GHOSTED) {
            let feedback_text = (this.formatVersion === 'v1' || this.formatVersion === 'v2') ?
                (direction === 'right' ? card.feedback?.match : card.feedback?.discard) :
                this.getDecisionRationale(card);
            
            // V3: Mentor Lore Override
            let mentor = "Dra. Vélez";
            if (card.scoring?.vazquez_comment) {
                feedback_text = card.scoring.vazquez_comment;
                // Parse specific mentor from comment if present (e.g., "Mendoza: ...")
                if (feedback_text.includes(':')) {
                    const parts = feedback_text.split(':');
                    mentor = parts[0].trim();
                    feedback_text = parts.slice(1).join(':').trim();
                }
            }

            this.lastFeedback = {
                correct,
                expected,
                title: card.payload?.title || card.card_text || 'Evidencia',
                category: card.category,
                noiseType: card.noise_type,
                feedback_text,
                mentor
            };
        }

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

        // Triage Fatal: If in Shock Mode, acing the checkpoint can unlock a Perla
        if (this.state === ENGINE_STATE.SHOCK_MODE && this.stats.streak >= 5) {
            this.unlockPerla();
        }

        if (this.currentIndex < this.currentCase.evidence_stream.length) {
            this.state = ENGINE_STATE.STREAM;
        } else {
            // Check for Shock Mode trigger
            if (this.currentCase.is_boss || (this.caseCount + 1) % this.casesPerShock === 0) {
                this.triggerShockMode();
            } else {
                this.state = ENGINE_STATE.FINAL_TRIAD;
                this.currentTriadIndex = 0;
            }
        }
    }

    triggerShockMode() {
        this.state = ENGINE_STATE.CRITICAL_ALERT;
        // The UI will handle the flash/vibration and then call proceedToShockInterrogation
    }

    proceedToShockInterrogation() {
        this.state = ENGINE_STATE.SHOCK_MODE;
        this.currentTriadIndex = 0;
        this.shockTimer = 15; // 15 seconds real-time
    }

    unlockPerla() {
        if (!this.currentCase.enarm_pearl) return;
        const pearl = this.currentCase.enarm_pearl;
        
        if (this.codexManager) {
            const isNew = this.codexManager.savePearl(
                this.currentCase.theme_config,
                pearl,
                this.currentCase.case_id
            );
            
            if (isNew) {
                this.stats.unlockedPearl = pearl;
            }
        }
    }

    logLethalError(card) {
        const error = {
            case_id: this.currentCase.case_id,
            evidence_id: card.evidence_id || card.card_id,
            title: card.payload?.title || card.card_text || 'Evidencia Crítica',
            reason: card.safety_flags?.rationale || card.scoring?.vazquez_comment || "Error crítico de seguridad",
            timestamp: Date.now()
        };
        
        if (this.codexManager) {
            this.codexManager.saveError(error);
        }
    }

    handleTriadAnswer(answerIndex) {
        const triadList = this.currentCase.boss_fight_triad?.questions || this.currentCase.final_triad;
        const triad = triadList[this.currentTriadIndex];
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

        // SHOCK MODE LETHAL FAILURE
        if (!isCorrect && this.state === ENGINE_STATE.SHOCK_MODE) {
            this.state = ENGINE_STATE.GHOSTED;
            this.lastFeedback = { 
                text: `¡DUDAR EN CHOQUE ES MATAR! ${triad.rationale || "Has fallado en la decisión crítica."}`,
                type: 'lethal' 
            };
            return { action: 'ghosted' };
        }

        this.currentTriadIndex++;
        if (this.currentTriadIndex >= triadList.length) {
            this.calculateDossierScore();
            if (this.state === ENGINE_STATE.SHOCK_MODE) {
                // If they survived the shock mode, they win and unlock perla
                this.unlockPerla();
            }
            this.state = ENGINE_STATE.CONFIDENCE_CHECK;
            return { action: 'confidence_check' };
        }

        return { action: 'next_question' };
    }


    submitConfidenceCheck(level) {
        this.selfConfidence = Math.min(5, Math.max(1, Number(level) || 3));
        this.evaluateCognitiveBiases();
        this.state = ENGINE_STATE.RESULTS;
    }

    evaluateCognitiveBiases() {
        const tags = [];
        const wrongKeptSignals = this.decisionHistory.filter(d => !d.isCorrect && d.expected === 'right').length;
        const lateSignalMisses = this.decisionHistory.filter(d => !d.isCorrect && d.expected === 'right' && d.index > (this.currentCase.evidence_stream.length * 0.6)).length;
        const earlyErrors = this.decisionHistory.slice(0, 3).filter(d => !d.isCorrect).length;

        if (wrongKeptSignals >= 2) tags.push('confirmation_bias');
        if (this.keptItems.length <= 2 && this.stats.mistakes.length >= 3) tags.push('premature_closure');
        if (earlyErrors >= 2) tags.push('anchoring');
        if (lateSignalMisses >= 2) tags.push('search_satisficing');

        this.cognitiveBiasTags = tags;
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
        const keptSignals = this.keptItems.filter(i => this.getExpectedAction(i) === 'right').length;
        const totalSignals = this.currentCase.evidence_stream.filter(e => this.getExpectedAction(e) === 'right').length;
        
        this.stats.scoring_tags = [];

        // Penalties
        if (keptNoise >= 3) {
            this.stats.scoring_tags.push('hoarding');
            this.stats.neuronas -= 50;
        }
        if (this.stats.mistakes.some(m => m.expected === 'left')) {
            this.stats.scoring_tags.push('false_positive');
        }

        if (this.keptItems.length > 0) {
            this.stats.scoring_tags.push('precision');
            this.stats.neuronas += 50;
        }

        if (this.keptItems.length > 0 && this.keptItems.length <= totalSignals) {
            this.stats.scoring_tags.push('clean_dossier');
            this.stats.neuronas += 50;
        }

        if (this.discardedItems.filter(i => i.noise_type === 'false_alarm' || i.noise_type === 'borderline').length >= 2) {
            this.stats.scoring_tags.push('clinical_eye');
            this.stats.neuronas += 75;
        }

        // Calculate Rank
        const accuracy = this.getAccuracy();
        const totalKept = this.keptItems.length;
        const isGhosted = this.state === ENGINE_STATE.GHOSTED;
        
        // Evitar NaN si el jugador descarta todo (Rango "Nihilista")
        const utilityRatio = totalKept === 0 ? 0 : (totalKept - keptNoise) / totalKept;

        if (isGhosted) {
            this.stats.rank = 'F'; // Muerte súbita
        } else if (totalKept === 0 && this.stats.total > 0) {
            this.stats.rank = 'D'; // Descartó hasta al paciente
        } else if (accuracy >= 90 && keptNoise === 0) {
            this.stats.rank = 'S'; // El Francotirador
        } else if (keptNoise >= 3 || accuracy < 60) {
            this.stats.rank = 'D'; // El Residente Paranoico
        } else {
            this.stats.rank = 'B'; // El Dr. House de Presupuesto (Rango intermedio)
        }

        // Gamification: Award Coins based on performance
        let earnedCoins = 0;
        if (this.stats.rank === 'S') earnedCoins = 25;
        else if (this.stats.rank === 'B') earnedCoins = 10;
        else if (this.stats.rank === 'D') earnedCoins = 5;

        if (earnedCoins > 0) {
            this.stats.earnedCoins = earnedCoins;
            this.addCoins(earnedCoins);
        }

        // Rank Up Logic
        if (this.stats.rank === 'S') {
            this.updatePlayerRank();
        }

        this.incrementCaseCount();

        // Update challenge
        const isPerfect = !isGhosted && accuracy >= 80;
        this.updateChallengeState(isPerfect, isGhosted);
    }

    updatePlayerRank() {
        const ranks = ['MIP', 'R1', 'R2', 'R3', 'Jefe'];
        const currentIndex = ranks.indexOf(this.playerRank);
        if (currentIndex < ranks.length - 1) {
            this.playerRank = ranks[currentIndex + 1];
            this.stats.rankUp = true;
            this.saveGamificationState();
        }
    }

    incrementCaseCount() {
        this.caseCount++;
        this.saveGamificationState();
    }

    shouldTriggerShock() {
        return this.caseCount > 0 && this.caseCount % this.casesPerShock === 0;
    }
}

// Node.js support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SwipeEngine, ENGINE_STATE };
}
