import { ENGINE_STATE } from './engine.js';

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
    toxicity: '☢️',
    SHOCK_MODE: 'shock_mode',
    CRITICAL_ALERT: 'critical_alert',
    CODEX: 'codex'
};

export class UIController {
    constructor(engine) {
        this.engine = engine;
        this.views = {
            intro: document.getElementById('view-intro'),
            intake: document.getElementById('view-intake'),
            stream: document.getElementById('view-stream'),
            checkpoint: document.getElementById('view-checkpoint'),
            confidenceCheck: document.getElementById('view-confidence-check'),
            results: document.getElementById('view-results'),
            chat: document.getElementById('view-chat'),
            gacha: document.getElementById('view-gacha'),
            codex: document.getElementById('view-codex')
        };

        this.elements = {
            cardStack: document.getElementById('card-stack'),
            progressFill: document.getElementById('progress-fill'),
            counterKept: document.getElementById('counter-kept'),
            counterDiscarded: document.getElementById('counter-discarded'),
            counterNeuronas: document.getElementById('counter-neuronas'),
            counterStreak: document.getElementById('counter-streak'),
            caseFraming: document.getElementById('case-framing'),
            listKept: document.getElementById('list-kept'),
            listDiscarded: document.getElementById('list-discarded'),
            learningTip: document.getElementById('learning-tip'),
            feedbackBox: document.getElementById('feedback-box'),
            feedbackTitle: document.getElementById('feedback-title'),
            feedbackText: document.getElementById('feedback-text'),
            listMistakes: document.getElementById('list-mistakes'),
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            missionBanner: document.getElementById('mission-banner'),
            confidenceFill: document.getElementById('confidence-fill'),
            quizQuestion: document.getElementById('quiz-question'),
            quizOptions: document.getElementById('quiz-options'),
            quizHint: document.getElementById('quiz-hint'),
            btnCheckpointContinue: document.getElementById('btn-checkpoint-continue'),
            btnInterconsult: document.getElementById('btn-interconsult'),
            checkpointTitle: document.getElementById('checkpoint-title'),
            perlaEnarm: document.getElementById('perla-enarm'),
            perlaTitle: document.getElementById('perla-title'),
            perlaText: document.getElementById('perla-text'),
            perlaGpc: document.getElementById('perla-gpc'),
            resultOutcome: document.getElementById('result-outcome'),
            resultDossier: document.getElementById('result-dossier'),
            shockMask: document.getElementById('shock-mask'),
            timeFill: document.getElementById('time-fill'),
            mentorText: document.getElementById('mentor-text'),
            btnTutorialNext: document.getElementById('btn-tutorial-next'),
            davinciContainer: document.getElementById('davinci-container'),
            patientSummaryBar: document.getElementById('patient-summary-bar'),
            summaryNameAge: document.getElementById('summary-name-age'),
            summaryVitals: document.getElementById('summary-vitals'),
            viewChat: document.getElementById('view-chat'),
            viewGacha: document.getElementById('view-gacha'),
            chatMessages: document.getElementById('chat-messages'),
            chatOutcomeBadge: document.getElementById('chat-outcome-badge'),
            btnChatContinue: document.getElementById('btn-chat-continue'),
            coinCount: document.getElementById('coin-count'),
            gachaCoinCount: document.getElementById('gacha-coin-count'),
            challengeProgress: document.getElementById('challenge-progress'),
            challengeBanner: document.getElementById('daily-challenge-banner'),
            gachaCard: document.getElementById('gacha-card'),
            gachaResultIcon: document.getElementById('gacha-result-icon'),
            gachaResultTitle: document.getElementById('gacha-result-title'),
            gachaResultDesc: document.getElementById('gacha-result-desc'),
            gachaErrorMsg: document.getElementById('gacha-error-msg'),
            inventoryList: document.getElementById('inventory-list'),
            counterBudget: document.getElementById('counter-budget'),
            counterConsult: document.getElementById('counter-consult'),
            confidenceInput: document.getElementById('confidence-input'),
            confidenceValue: document.getElementById('confidence-value'),
            btnConfirmConfidence: document.getElementById('btn-confirm-confidence'),
            biasTags: document.getElementById('bias-tags'),
            codexList: document.getElementById('codex-list'),
            btnCodexBack: document.getElementById('btn-codex-back'),
            tabPerlas: document.getElementById('tab-perlas'),
            tabErrores: document.getElementById('tab-errores'),
            codexFilters: document.getElementById('codex-filters')
        };

        this.tutorialStep = 0;
        this.tutorialData = [
            {
                text: "¡Hola! Soy la Dra. Vélez, tu guía ENARM. Verás tarjetas de un expediente clínico — tu misión es filtrar lo útil de lo irrelevante.",
                action: "none"
            },
            {
                text: "Desliza ➡️ a la DERECHA (o presiona ✔) para GUARDAR un dato que cambia una decisión clínica: signos vitales, labs relevantes, imagen o fármacos.",
                action: "swipe-right"
            },
            {
                text: "Desliza ⬅️ a la IZQUIERDA (o presiona ✖) para DESCARTAR: duplicados, datos administrativos, falsas alarmas o resultados tardíos.",
                action: "swipe-left"
            },
            {
                text: "Al final responderás 3 preguntas tipo ENARM: diagnóstico, estudio gold standard y tratamiento. ¡Construye bien tu expediente! 🧠",
                action: "none"
            }
        ];

        this.swipeThreshold = 100;
        this.onSwipeAction = null;

        if (this.elements.btnTutorialNext) {
            this.elements.btnTutorialNext.onclick = () => this.nextTutorialStep();
        }

        if (this.elements.btnShowCodex) {
            this.elements.btnShowCodex.onclick = () => {
                this.engine.state = ENGINE_STATE.CODEX;
                this.update();
            };
        }

        if (this.elements.btnCodexBack) {
            this.elements.btnCodexBack.onclick = () => {
                this.engine.state = ENGINE_STATE.INTRO;
                this.update();
            };
        }

        if (this.elements.tabPerlas) {
            this.elements.tabPerlas.onclick = () => this.renderCodex('perlas');
        }
        if (this.elements.tabErrores) {
            this.elements.tabErrores.onclick = () => this.renderCodex('errores');
        }

        if (this.elements.codexFilters) {
            this.elements.codexFilters.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;
                
                this.elements.codexFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const activeTab = this.elements.tabPerlas?.classList.contains('active') ? 'perlas' : 'errores';
                this.renderCodex(activeTab, btn.dataset.theme);
            });
        }
    }

    showView(viewName) {
        Object.values(this.views).forEach(el => {
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('active');
            }
        });

        const target = this.views[viewName];
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    }

    update() {
        const state = this.engine.state;
        switch (state) {
            case ENGINE_STATE.INTRO:
                this.showView('intro');
                break;
            case ENGINE_STATE.INTAKE:
                this.showView('intake');
                this.renderIntake();
                break;
            case ENGINE_STATE.STREAM:
                this.showView('stream');
                this.renderCurrentCard();
                this.renderMission();
                this.updateStats();
                this.renderFeedback();
                break;
            case ENGINE_STATE.CHECKPOINT:
                this.showView('checkpoint');
                this.renderQuiz();
                break;
            case ENGINE_STATE.FINAL_TRIAD:
                this.showView('checkpoint');
                this.renderFinalTriad();
                break;
            case ENGINE_STATE.CONFIDENCE_CHECK:
                this.showView('confidenceCheck');
                this.renderConfidenceCheck();
                break;
            case ENGINE_STATE.CRITICAL_ALERT:
                this.renderShockTrigger();
                break;
            case ENGINE_STATE.SHOCK_MODE:
                this.showView('checkpoint');
                this.renderShockTriad();
                break;
            case ENGINE_STATE.RESULTS:
            case ENGINE_STATE.DOSSIER:
                this.showView('results');
                this.renderResults();
                this.launchConfetti();
                break;
            case ENGINE_STATE.CODEX:
                this.showView('codex');
                this.renderCodex();
                break;
            case ENGINE_STATE.GHOSTED:
                this.showView('results'); // Use results view but render ghosted
                this.renderGhosted();
                break;
            case ENGINE_STATE.THE_CHAT:
                this.showView('chat');
                this.renderChat();
                break;
            case ENGINE_STATE.GACHA:
                this.showView('gacha');
                this.renderGacha();
                break;
        }
    }

    renderIntake() {
        if (!this.engine.currentCase) return;
        const meta = this.engine.getCaseMeta();
        const profile = this.engine.patientProfile; // V2 Support
        const framing = this.elements.caseFraming;

        // Sync gamification state
        if (this.elements.coinCount) {
            this.elements.coinCount.textContent = this.engine.coins;
        }

        if (this.elements.challengeBanner && this.elements.challengeProgress) {
            const chal = this.engine.challenge;
            this.elements.challengeProgress.textContent = `${chal.progress}/${chal.target}`;
            if (chal.completed) {
                this.elements.challengeBanner.style.borderColor = 'var(--success)';
                this.elements.challengeProgress.textContent = "¡Completado!";
                this.elements.challengeProgress.style.background = "var(--success)";
                this.elements.challengeProgress.style.color = "white";
            } else {
                this.elements.challengeBanner.style.borderColor = 'rgba(var(--accent-rgb), 0.3)';
                this.elements.challengeProgress.style.background = "var(--surface)";
                this.elements.challengeProgress.style.color = "var(--text-light)";
            }
        }
        if (!framing) return;

        if (this.engine.formatVersion === 'v3_swipe_action' && profile) {
             framing.innerHTML = `
                <div class="patient-card intro-v3">
                    <div class="intro-header">
                        <span class="patient-avatar">🏥</span>
                        <h2 class="patient-name">${profile.name}</h2>
                    </div>
                    <div class="intro-body">
                        <p class="arrival-scenario">"${profile.arrival_scenario}"</p>
                        <div class="timer-warning">
                            <span class="timer-label">⏰ Triage Rápido:</span>
                            <span class="timer-value">${profile.time_limit_sec || 30}s</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (this.engine.formatVersion === 'v2' && profile) {
            framing.innerHTML = `
                <div class="patient-card profile-card">
                    <div class="profile-header" style="background-image: url('${profile.image_url || ''}')">
                        <div class="profile-overlay">
                            <h2 class="profile-name">${profile.name}, ${profile.age}</h2>
                            <span class="mood-tag">✨ ${profile.mood || 'Estable'}</span>
                        </div>
                    </div>
                    <div class="profile-body">
                        <p class="profile-bio">${profile.bio}</p>
                        <div class="vitals-grid">
                            <div class="vital-tag"><span class="vital-label">TA</span><span class="vital-value">${profile.vitals?.TA || '--'}</span></div>
                            <div class="vital-tag"><span class="vital-label">FC</span><span class="vital-value">${profile.vitals?.FC || '--'}</span></div>
                            <div class="vital-tag"><span class="vital-label">TEMP</span><span class="vital-value">${profile.vitals?.Temp || '--'}</span></div>
                        </div>
                        <div class="profile-details">
                            <p><strong>Detalles:</strong> ${profile.details}</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (meta) {
            framing.innerHTML = `
                <div class="patient-card">
                    <div class="patient-header">
                        <span class="patient-icon">🏥</span>
                        <strong>Expediente del Paciente</strong>
                    </div>
                    <div class="patient-details">
                        <span><strong>Paciente:</strong> ${meta.patient_code || 'Anónimo'}</span>
                        <span><strong>Edad/Sexo:</strong> ${meta.age || '?'} años, ${meta.sex || '?'}</span>
                        <span><strong>Motivo de consulta:</strong> ${meta.chief_complaint || 'No especificado'}</span>
                        <span class="specialty-tag">📌 ${meta.enarm_specialty || 'Medicina General'}</span>
                    </div>
                </div>
            `;
        } else {
            framing.textContent = `Caso: ${this.engine.currentCase.case_id} | Dificultad: ${this.engine.currentCase.difficulty}`;
        }
    }

    renderMission() {
        if (this.elements.missionBanner) {
            this.elements.missionBanner.textContent = this.engine.getMission();
        }
    }

    renderCurrentCard() {
        const container = this.elements.cardStack;
        // Keep only 3 cards in DOM: Current, Next, Preload
        container.innerHTML = '';
        
        const currentIdx = this.engine.currentIndex;
        const stream = this.engine.currentCase?.card_stream || this.engine.currentCase?.evidence_stream || [];
        
        // Render 3 cards if they exist
        for (let i = 0; i < 3; i++) {
            const cardData = stream[currentIdx + i];
            if (!cardData) break;
            
            const cardEl = this.createCardElement(cardData, i);
            container.appendChild(cardEl);
            
            if (i === 0) {
                this.initializeSwipe(cardEl);
                if (this.elements.learningTip) {
                    this.elements.learningTip.textContent = this.engine.getTeachingTip(cardData);
                }
            }
        }
    }

    createCardElement(card, stackIndex) {
        const cardEl = document.createElement('div');
        cardEl.className = `card stack-level-${stackIndex}`;
        if (stackIndex === 0) cardEl.style.animation = 'fadeIn 0.3s ease';
        
        // Hardware acceleration fix
        cardEl.style.willChange = 'transform';
        cardEl.style.transform = `translate3d(0, 0, 0)`;

        // Safety flag banner
        if (card.safety_flags && (card.safety_flags.lethal_risk || card.safety_flags.decision_critical)) {
            const alert = document.createElement('div');
            alert.className = 'card-alert';
            alert.textContent = card.safety_flags.lethal_risk ? '⚠️ Dato crítico de seguridad' : '⚡ Decisión crítica';
            cardEl.appendChild(alert);
        }

        const category = document.createElement('div');
        category.className = 'card-category';
        const categoryIcon = this.engine.CATEGORY_ICONS?.[card.category] || '📄';
        const displayIcon = card.ui_icon || categoryIcon; 
        const displayCategory = card.category || 'Evidencia';
        category.innerHTML = `<span class="cat-icon">${displayIcon}</span> <span class="cat-name">${displayCategory}</span>`;

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = card.payload?.title || 'Sin Título';

        const text = document.createElement('p');
        text.className = 'card-text';
        text.textContent = card.payload?.text || card.card_text || 'Sin descripción';

        // Card index indicator
        const indexBadge = document.createElement('div');
        indexBadge.className = 'card-index';
        const total = stream.length;
        indexBadge.textContent = `${this.engine.currentIndex + stackIndex + 1} / ${total}`;

        cardEl.appendChild(category);
        cardEl.appendChild(title);
        cardEl.appendChild(text);
        cardEl.appendChild(indexBadge);

        if (this.engine.currentCase.case_id?.includes('psych')) cardEl.classList.add('theme-psych');
        if (this.engine.currentCase.case_id?.includes('surg')) cardEl.classList.add('theme-surg');

        return cardEl;
    }

    initializeSwipe(cardEl) {
        const hammer = new Hammer(cardEl);
        hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

        hammer.on('pan', (ev) => {
            cardEl.style.transition = 'none';
            const x = ev.deltaX;
            const rotate = x / 12;
            // hardware acceleration
            cardEl.style.transform = `translate3d(${x}px, 0, 0) rotate(${rotate}deg)`;

            const leftHint = document.querySelector('.hint-left');
            const rightHint = document.querySelector('.hint-right');

            if (x > 50) {
                cardEl.style.borderColor = 'var(--success)';
                cardEl.classList.add('swipe-right-preview');
                cardEl.classList.remove('swipe-left-preview');
                if (rightHint) rightHint.classList.add('active');
                if (leftHint) leftHint.classList.remove('active');
            } else if (x < -50) {
                cardEl.style.borderColor = 'var(--danger)';
                cardEl.classList.add('swipe-left-preview');
                cardEl.classList.remove('swipe-right-preview');
                if (leftHint) leftHint.classList.add('active');
                if (rightHint) rightHint.classList.remove('active');
            } else {
                cardEl.style.borderColor = '';
                cardEl.classList.remove('swipe-right-preview', 'swipe-left-preview');
                if (leftHint) leftHint.classList.remove('active');
                if (rightHint) rightHint.classList.remove('active');
            }
        });

        hammer.on('panend', (ev) => {
            cardEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            const leftHint = document.querySelector('.hint-left');
            const rightHint = document.querySelector('.hint-right');
            if (leftHint) leftHint.classList.remove('active');
            if (rightHint) rightHint.classList.remove('active');

            if (Math.abs(ev.deltaX) > this.swipeThreshold) {
                const direction = ev.deltaX > 0 ? 'right' : 'left';
                const finalX = direction === 'right' ? 1200 : -1200;
                // hardware acceleration
                cardEl.style.transform = `translate3d(${finalX}px, 0, 0) rotate(${ev.deltaX / 5}deg)`;
                setTimeout(() => {
                    if (this.onSwipeAction) this.onSwipeAction(direction);
                }, 200);
            } else {
                cardEl.style.transform = `translate3d(0, 0, 0)`;
                cardEl.style.borderColor = '';
                cardEl.classList.remove('swipe-right-preview', 'swipe-left-preview');
            }
        });
    }

    launchConfetti() {
        const count = 200;
        const defaults = { origin: { y: 0.7 }, zIndex: 1000 };
        function fire(particleRatio, opts) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    updateStats() {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${this.engine.getProgress()}%`;
        }

        const oldConfidence = parseFloat(this.elements.confidenceFill?.style.width) || 0;
        const newConfidence = this.engine.confidence;
        if (this.elements.confidenceFill) {
            this.elements.confidenceFill.style.width = `${newConfidence}%`;
            if (newConfidence > oldConfidence + 5) {
                this.renderDiscoveryEffect();
            }
        }

        if (this.elements.counterKept) {
            this.elements.counterKept.textContent = `📂 ${this.engine.keptItems.length}`;
        }
        if (this.elements.counterDiscarded) {
            this.elements.counterDiscarded.textContent = `🗑️ ${this.engine.discardedItems.length}`;
        }
        if (this.elements.counterNeuronas) {
            this.elements.counterNeuronas.textContent = `🧠 ${this.engine.stats.neuronas}`;
        }
        if (this.elements.counterStreak) {
            const streak = this.engine.stats.streak;
            this.elements.counterStreak.textContent = `🔥 ${streak}`;
            this.elements.counterStreak.classList.toggle('streak-hot', streak >= 3);
        }
        if (this.elements.counterBudget) {
            this.elements.counterBudget.textContent = `💸 ${this.engine.diagnosticBudget.points}`;
        }
        if (this.elements.counterConsult) {
            this.elements.counterConsult.textContent = `☎️ ${this.engine.consult.tokens}`;
        }

        if (this.elements.timeFill) {
            this.elements.timeFill.style.width = `${this.engine.timeFocus}%`;
            this.elements.timeFill.parentElement.classList.toggle('low-time', this.engine.timeFocus < 25);
        }
    }

    renderFeedback() {
        const feedback = this.engine.lastFeedback;
        if (!feedback || !this.elements.feedbackBox) return;

        this.elements.feedbackBox.classList.toggle('feedback-correct', feedback.correct);
        this.elements.feedbackBox.classList.toggle('feedback-wrong', !feedback.correct);

        const actionLabel = feedback.expected === 'right' ? 'Guardar ➡️' : 'Descartar ⬅️';
        this.elements.feedbackTitle.textContent = feedback.correct
            ? `✅ Correcto — ${actionLabel} era lo indicado.`
            : `🔍 Tip: lo ideal era ${feedback.expected === 'right' ? 'guardar ➡️' : 'descartar ⬅️'}.`;
        this.elements.feedbackText.textContent = feedback.rationale;
    }

    showEventNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `event-toast type-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'intuition' ? '🌟' : '📢'}</div>
            <div class="toast-content">${message}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('active'), 100);
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }

    renderDiscoveryEffect() {
        const bar = document.querySelector('.confidence-bar');
        if (bar) {
            bar.style.animation = 'discoveryPulse 0.5s ease-out';
            setTimeout(() => bar.style.animation = '', 500);
        }
    }

    renderQuiz() {
        const quiz = this.engine.currentCheckpoint;
        if (!quiz) return;

        this.elements.checkpointTitle.textContent = `🩺 Reto Clínico — Etapa ${quiz.checkpoint_sequence}`;
        this.elements.quizQuestion.textContent = quiz.question;
        this.elements.quizOptions.innerHTML = '';
        this.elements.btnCheckpointContinue.classList.add('hidden');

        const unlockedIds = this.engine.getUnlockedHints(quiz);
        if (unlockedIds.length > 0) {
            this.elements.quizHint.classList.remove('hidden');
            this.elements.quizHint.innerHTML = `🌟 <strong>Tienes ${unlockedIds.length} dato(s) clave en tu expediente</strong> que pueden ayudarte.`;
        } else {
            this.elements.quizHint.classList.add('hidden');
        }

        if (this.elements.btnInterconsult) {
            this.elements.btnInterconsult.classList.remove('hidden');
            this.elements.btnInterconsult.disabled = this.engine.consult.tokens <= 0;
            this.elements.btnInterconsult.textContent = this.engine.consult.tokens > 0
                ? `Interconsulta (☎️ ${this.engine.consult.tokens})`
                : 'Interconsulta agotada';
            this.elements.btnInterconsult.onclick = () => {
                const eliminated = this.engine.applyInterconsultToOptions(quiz.options.length, quiz.correct_index);
                if (eliminated === null) return;
                const btns = this.elements.quizOptions.querySelectorAll('.quiz-option');
                if (btns[eliminated]) {
                    btns[eliminated].disabled = true;
                    btns[eliminated].classList.add('eliminated');
                    btns[eliminated].textContent = '✖ Opción descartada por interconsulta';
                }
                this.elements.btnInterconsult.disabled = true;
            };
        }

        quiz.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => this.handleQuizAnswer(idx, quiz.correct_index, btn);
            this.elements.quizOptions.appendChild(btn);
        });
    }

    handleQuizAnswer(selectedIndex, correctIndex, button) {
        const options = this.elements.quizOptions.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.disabled = true);

        if (selectedIndex === correctIndex) {
            button.classList.add('correct');
            this.showEventNotification('🧠 +50 Neuronas — ¡Respuesta correcta!', 'intuition');
        } else {
            button.classList.add('wrong');
            options[correctIndex].classList.add('correct');
        }

        this.elements.btnCheckpointContinue.classList.remove('hidden');
        if (this.elements.btnInterconsult) this.elements.btnInterconsult.classList.add('hidden');
        
        // Clear shock interval if active
        if (this.shockInterval) {
            clearInterval(this.shockInterval);
            this.shockInterval = null;
        }

        this.elements.btnCheckpointContinue.onclick = () => {
            const state = this.engine.state;
            if (state === ENGINE_STATE.SHOCK_MODE || state === ENGINE_STATE.FINAL_TRIAD) {
                this.engine.handleTriadAnswer(selectedIndex);
            } else {
                this.engine.proceedFromCheckpoint(selectedIndex);
            }
            this.update();
        };
    }

    renderFinalTriad() {
        const currentTriadIndex = this.engine.currentTriadIndex;
        const triad = this.engine.currentCase.final_triad[currentTriadIndex];
        if (!triad) return;

        const typeLabel = {
            diagnosis: '🔬 Diagnóstico',
            gold_standard: '🏆 Estudio de Elección',
            treatment: '💊 Tratamiento'
        };

        this.elements.checkpointTitle.textContent = `TRÍADA ENARM — ${typeLabel[triad.type] || triad.type.toUpperCase()} (${currentTriadIndex + 1}/3)`;
        this.elements.quizQuestion.textContent = triad.question;
        this.elements.quizOptions.innerHTML = '';
        this.elements.btnCheckpointContinue.classList.add('hidden');

        const unlockedIds = this.engine.getUnlockedHints(triad);
        if (unlockedIds.length > 0) {
            this.elements.quizHint.classList.remove('hidden');
            this.elements.quizHint.innerHTML = `🌟 <strong>Memoria clínica activa:</strong> Tienes ${unlockedIds.length} dato(s) clave en tu expediente.`;
        } else {
            this.elements.quizHint.classList.add('hidden');
        }

        if (this.elements.btnInterconsult) {
            this.elements.btnInterconsult.classList.remove('hidden');
            this.elements.btnInterconsult.disabled = this.engine.consult.tokens <= 0;
            this.elements.btnInterconsult.textContent = this.engine.consult.tokens > 0
                ? `Interconsulta (☎️ ${this.engine.consult.tokens})`
                : 'Interconsulta agotada';
            this.elements.btnInterconsult.onclick = () => {
                const eliminated = this.engine.applyInterconsultToOptions(triad.options.length, triad.correct_index);
                if (eliminated === null) return;
                const btns = this.elements.quizOptions.querySelectorAll('.quiz-option');
                if (btns[eliminated]) {
                    btns[eliminated].disabled = true;
                    btns[eliminated].classList.add('eliminated');
                    btns[eliminated].textContent = '✖ Opción descartada por interconsulta';
                }
                this.elements.btnInterconsult.disabled = true;
            };
        }

        triad.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => this.handleTriadAnswer(idx, triad.correct_index, btn);
            this.elements.quizOptions.appendChild(btn);
        });
    }

    handleTriadAnswer(selectedIndex, correctIndex, button) {
        const options = this.elements.quizOptions.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.disabled = true);

        if (selectedIndex === correctIndex) {
            button.classList.add('correct');
            this.showEventNotification('🧠 +100 Neuronas — ¡Tríada correcta!', 'intuition');
        } else {
            button.classList.add('wrong');
            options[correctIndex].classList.add('correct');
        }

        this.elements.btnCheckpointContinue.classList.remove('hidden');
        if (this.elements.btnInterconsult) this.elements.btnInterconsult.classList.add('hidden');
        this.elements.btnCheckpointContinue.onclick = () => {
            this.engine.handleTriadAnswer(selectedIndex);
            this.update();
        };
    }


    renderConfidenceCheck() {
        if (!this.elements.confidenceInput || !this.elements.btnConfirmConfidence) return;
        this.elements.confidenceInput.value = this.engine.selfConfidence || 3;
        if (this.elements.confidenceValue) {
            this.elements.confidenceValue.textContent = this.elements.confidenceInput.value;
        }

        this.elements.confidenceInput.oninput = () => {
            if (this.elements.confidenceValue) {
                this.elements.confidenceValue.textContent = this.elements.confidenceInput.value;
            }
        };

        this.elements.btnConfirmConfidence.onclick = () => {
            this.engine.submitConfidenceCheck(this.elements.confidenceInput.value);
            this.update();
        };
    }

    renderResults() {
        const kept = this.engine.keptItems;
        const discarded = this.engine.discardedItems;

        const createList = (items, parent, isKept = false) => {
            if (!parent) return;
            parent.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                const icon = CATEGORY_ICONS[item.category] || '📄';
                li.innerHTML = `<span class="list-icon">${icon}</span> <strong>${item.payload.title}:</strong> ${item.payload.text}`;

                if (isKept) {
                    const actions = document.createElement('div');
                    actions.className = 'dossier-actions';

                    const btnPin = document.createElement('button');
                    const isPinned = this.engine.pinnedItems.has(item.evidence_id);
                    btnPin.className = `btn-action ${isPinned ? 'active' : ''}`;
                    btnPin.innerHTML = '📌 Pin';
                    btnPin.onclick = () => {
                        if (this.engine.pinnedItems.has(item.evidence_id)) {
                            this.engine.unpinItem(item.evidence_id);
                            btnPin.classList.remove('active');
                        } else {
                            if (this.engine.pinnedItems.size < 3) {
                                this.engine.pinItem(item.evidence_id);
                                btnPin.classList.add('active');
                            } else {
                                this.showEventNotification('Máximo 3 pines permitidos', 'info');
                            }
                        }
                    };

                    const btnAnnotate = document.createElement('button');
                    btnAnnotate.className = 'btn-action';
                    btnAnnotate.innerHTML = '✍️ Nota';
                    btnAnnotate.onclick = () => {
                        const note = prompt('Añadir nota a ' + item.payload.title, this.engine.annotations[item.evidence_id] || '');
                        if (note !== null && note.trim() !== '') {
                            this.engine.annotations[item.evidence_id] = note;
                            let noteEl = li.querySelector('.dossier-note');
                            if (!noteEl) {
                                noteEl = document.createElement('div');
                                noteEl.className = 'dossier-note';
                                li.appendChild(noteEl);
                            }
                            noteEl.textContent = `📝 ${note}`;
                        } else if (note === '') {
                            delete this.engine.annotations[item.evidence_id];
                            const noteEl = li.querySelector('.dossier-note');
                            if (noteEl) noteEl.remove();
                        }
                    };

                    actions.appendChild(btnPin);
                    actions.appendChild(btnAnnotate);
                    li.appendChild(actions);

                    if (this.engine.annotations[item.evidence_id]) {
                        const noteEl = document.createElement('div');
                        noteEl.className = 'dossier-note';
                        noteEl.textContent = `📝 ${this.engine.annotations[item.evidence_id]}`;
                        li.appendChild(noteEl);
                    }
                }

                parent.appendChild(li);
            });
        };

        createList(kept, this.elements.listKept, true);
        createList(discarded, this.elements.listDiscarded, false);

        // Score outcome
        if (this.elements.resultOutcome) {
            const accuracy = this.engine.getAccuracy();
            const neuronas = this.engine.stats.neuronas;
            let verdict = '🔴 Expediente con ruido';
            let verdictClass = 'verdict-bad';
            if (accuracy > 80 && this.engine.confidence > 70) {
                verdict = '🏆 Expediente de Excelencia';
                verdictClass = 'verdict-excellent';
            } else if (accuracy > 60) {
                verdict = '✅ Expediente Aceptable';
                verdictClass = 'verdict-good';
            }

            this.elements.resultOutcome.className = `result-box outcome-box ${verdictClass}`;
            
            // Triage Fatal: Vazquez Feedback
            const rank = this.engine.stats.rank || 'D';
            const copy = this.engine.copyLibrary?.vazquez_feedback?.[`RANK_${rank}`] || { title: 'Feedback', text: 'Sigue practicando.' };
            
            this.elements.resultOutcome.innerHTML = `
                <div class="vazquez-header">
                    <div class="vazquez-avatar">👨‍⚕️</div>
                    <div class="vazquez-dialogue">
                        <span class="vazquez-rank">RANGO ${rank}: ${copy.title}</span>
                        <p class="vazquez-text">"${copy.text}"</p>
                    </div>
                </div>
                <div class="score-grid">
                    <div class="score-item"><span class="score-num">${accuracy}%</span><span class="score-label">Precisión</span></div>
                    <div class="score-item"><span class="score-num">${Math.round(this.engine.confidence)}%</span><span class="score-label">Confianza</span></div>
                    <div class="score-item"><span class="score-num">${neuronas} 🧠</span><span class="score-label">Neuronas</span></div>
                </div>
                ${this.engine.stats.rankUp ? `
                    <div class="rank-up-banner animation-bounce">
                        🎉 ¡ASCENSO! Ahora eres ${this.engine.playerRank}
                    </div>
                ` : ''}
            `;

            if (this.engine.stats.scoring_tags && this.engine.stats.scoring_tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'scoring-tags';
                this.engine.stats.scoring_tags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = `scoring-tag tag-${tag}`;
                    const tagNames = {
                        'hoarding': '📦 Acumulador (-50)',
                        'false_positive': '⚠️ Falso Positivo',
                        'precision': '🎯 Alta Precisión (+50)',
                        'clean_dossier': '✨ Dossier Limpio (+50)',
                        'clinical_eye': '👁️ Ojo Clínico (+75)',
                        'overtesting': '💸 Sobreuso diagnóstico (-25)'
                    };
                    tagEl.textContent = tagNames[tag] || tag;
                    tagsDiv.appendChild(tagEl);
                });
                this.elements.resultOutcome.appendChild(tagsDiv);
            }

            const biasLabels = {
                confirmation_bias: '🧠 Sesgo de confirmación',
                premature_closure: '⏱️ Cierre prematuro',
                anchoring: '⚓ Anclaje',
                search_satisficing: '🔎 Búsqueda satisfactoria'
            };

            if (this.engine.cognitiveBiasTags && this.engine.cognitiveBiasTags.length > 0) {
                const biasDiv = document.createElement('div');
                biasDiv.className = 'bias-tags';
                biasDiv.innerHTML = '<h4>Espejo del médico</h4>';
                this.engine.cognitiveBiasTags.forEach(tag => {
                    const el = document.createElement('span');
                    el.className = 'scoring-tag';
                    el.textContent = biasLabels[tag] || tag;
                    biasDiv.appendChild(el);
                });
                this.elements.resultOutcome.appendChild(biasDiv);
            }

            if (this.engine.selfConfidence) {
                const calibracion = document.createElement('p');
                calibracion.className = 'confidence-calibration';
                calibracion.textContent = `Autoevaluación de confianza: ${this.engine.selfConfidence}/5`;
                this.elements.resultOutcome.appendChild(calibracion);
            }

            // Gamification Coin Reward Banner
            if (this.engine.stats.earnedCoins > 0) {
                const coinDiv = document.createElement('div');
                coinDiv.className = 'coin-reward-banner';
                coinDiv.style.marginTop = '1rem';
                coinDiv.style.padding = '0.75rem';
                coinDiv.style.background = 'rgba(234, 179, 8, 0.1)';
                coinDiv.style.border = '1px solid #eab308';
                coinDiv.style.borderRadius = '8px';
                coinDiv.style.color = '#eab308';
                coinDiv.style.fontWeight = 'bold';
                coinDiv.style.textAlign = 'center';
                coinDiv.innerHTML = `🪙 +${this.engine.stats.earnedCoins} Monedas ENARM ganadas`;
                this.elements.resultOutcome.appendChild(coinDiv);
            }
        }

        // Perla ENARM
        if (this.elements.perlaEnarm && this.engine.currentCase.perla_enarm) {
            const perla = this.engine.currentCase.perla_enarm;
            this.elements.perlaEnarm.classList.remove('hidden');
            this.elements.perlaTitle.textContent = `💡 Perla ENARM: ${perla.title}`;
            this.elements.perlaText.textContent = perla.text;
            this.elements.perlaGpc.textContent = perla.gpc_ref;
        }

        // Mistakes / learning opportunities
        if (this.elements.listMistakes) {
            this.elements.listMistakes.innerHTML = '';
            if (this.engine.stats.mistakes.length === 0) {
                const li = document.createElement('li');
                li.textContent = '🌟 ¡Sin errores! Expediente perfecto.';
                this.elements.listMistakes.appendChild(li);
            } else {
                this.engine.stats.mistakes.forEach(mistake => {
                    const li = document.createElement('li');
                    const expectedAction = mistake.expected === 'right' ? 'guardar ➡️' : 'descartar ⬅️';
                    const icon = CATEGORY_ICONS[mistake.category] || '📄';
                    li.innerHTML = `${icon} <strong>${mistake.title}</strong> — era mejor ${expectedAction}.`;
                    this.elements.listMistakes.appendChild(li);
                });
            }
        }
    }

    startTutorial() {
        this.tutorialStep = 0;
        if (this.elements.tutorialOverlay) {
            this.elements.tutorialOverlay.classList.remove('hidden');
            this.elements.tutorialOverlay.classList.add('active');
        }
        this.updateTutorialContent();
    }

    nextTutorialStep() {
        this.tutorialStep++;
        if (this.tutorialStep >= this.tutorialData.length) {
            this.finishTutorial();
        } else {
            this.updateTutorialContent();
        }
    }

    updateTutorialContent() {
        const step = this.tutorialData[this.tutorialStep];
        if (this.elements.mentorText) {
            this.elements.mentorText.textContent = step.text;
        }
        if (this.elements.davinciContainer) {
            this.elements.davinciContainer.classList.toggle('robot-swiping', step.action !== 'none');
        }
    }

    finishTutorial() {
        if (this.elements.tutorialOverlay) {
            this.elements.tutorialOverlay.classList.remove('active');
            setTimeout(() => {
                this.elements.tutorialOverlay.classList.add('hidden');
            }, 500);
        }
    }

    renderChat() {
        const feedback = this.engine.lastFeedback;
        if (!feedback) return;

        // Setup Chat Container
        this.elements.chatMessages.innerHTML = '';
        this.elements.chatOutcomeBadge.className = `outcome-badge ${feedback.correct ? 'match' : 'error'}`;
        this.elements.chatOutcomeBadge.textContent = feedback.correct ? '¡Perfect Match!' : 'Error clínico';

        // Add sequence of messages
        this.addMessage('system', `Analizando acción: ${feedback.expected === 'right' ? 'Match' : 'Descarte'}`);

        // Delay the mentor's response for "effect"
        setTimeout(() => {
            this.addMessage('mentor', feedback.feedback_text || "Sin comentarios adicionales por ahora.");
        }, 400);

        this.elements.btnChatContinue.onclick = () => {
            // Check if game continues or ends
            if (this.engine.currentIndex < this.engine.currentCase.evidence_stream.length) {
                this.engine.state = ENGINE_STATE.STREAM;
            } else {
                this.engine.state = ENGINE_STATE.FINAL_TRIAD;
            }
            this.update();
        };
    }

    addMessage(type, text) {
        const msg = document.createElement('div');
        msg.className = `message ${type}`;
        msg.textContent = text;
        this.elements.chatMessages.appendChild(msg);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    renderGhosted() {
        this.elements.resultOutcome.innerHTML = `
            <div class="ghosted-screen">
                <div class="ghost-icon">👻</div>
                <h2 class="title" style="color: var(--danger)">¡Te han hecho Ghosting!</h2>
                <p>Ignoraste una <strong>Red Flag</strong> crítica y el paciente se ha complicado. La racha de estudio se ha perdido.</p>
                <div class="feedback-card" style="margin-top: 20px; background: rgba(239, 68, 68, 0.1); border-color: var(--danger);">
                    <h4>¿Qué pasó?</h4>
                    <p>${this.engine.lastFeedback?.text || this.engine.lastFeedback?.feedback_text || "No identificaste un riesgo vital inminente."}</p>
                </div>
            </div>
        `;

        // Hide normal results sections
        if (this.elements.perlaEnarm) this.elements.perlaEnarm.classList.add('hidden');
        const lists = document.querySelector('.dossier-lists');
        if (lists) lists.style.display = 'none';

        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }

    updatePatientSummary() {
        const profile = this.engine.patientProfile;
        if (!profile || !this.elements.patientSummaryBar) return;

        this.elements.patientSummaryBar.classList.remove('hidden');
        this.elements.summaryNameAge.textContent = `${profile.name}, ${profile.age}`;
        this.elements.summaryVitals.textContent = `TA: ${profile.vitals?.TA} · FC: ${profile.vitals?.FC}`;
    }

    renderGacha() {
        if (this.elements.gachaCoinCount) {
            this.elements.gachaCoinCount.textContent = this.engine.coins;
        }
        if (this.elements.gachaErrorMsg) {
            this.elements.gachaErrorMsg.classList.add('hidden');
        }
        if (this.elements.gachaCard) {
            this.elements.gachaCard.classList.remove('flipped');
        }

        this.renderInventory();
    }

    renderInventory() {
        if (!this.elements.inventoryList) return;
        this.elements.inventoryList.innerHTML = '';

        if (this.engine.inventory.length === 0) {
            this.elements.inventoryList.innerHTML = '<li style="grid-column: 1/-1; color: var(--text-light);">Aún no tienes recompensas.</li>';
            return;
        }

        const counts = this.engine.inventory.reduce((acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

        const itemMeta = {
            'avatar_gold': { icon: '🧑‍⚕️', name: 'Avatar Élite' },
            'perla_dorada': { icon: '✨', name: 'Perla de Sabiduría' },
            'tiempo_extra': { icon: '⏳', name: 'Bono de Tiempo' }
        };

        Object.entries(counts).forEach(([itemId, qty]) => {
            const meta = itemMeta[itemId] || { icon: '📦', name: itemId };
            const li = document.createElement('li');
            li.innerHTML = `<span>${meta.icon}</span><strong>${meta.name}</strong><small>x${qty}</small>`;
            this.elements.inventoryList.appendChild(li);
        });
    }

    playGachaAnimation(reward) {
        if (!this.elements.gachaCard) return;

        // Define reward metadata
        const rewardsDB = [
            { id: 'avatar_gold', icon: '🧑‍⚕️', title: 'Avatar Élite', desc: 'Un nuevo diseño para la Dra. Vélez', weight: 30 },
            { id: 'perla_dorada', icon: '✨', title: 'Perla de Sabiduría', desc: 'Pista automática en la Tríada Final', weight: 50 },
            { id: 'tiempo_extra', icon: '⏳', title: 'Bono de Tiempo', desc: 'Gana más tiempo base en el siguiente caso', weight: 20 }
        ];

        // Random roll based on weights if reward is not specified
        let pulledReward = reward;
        if (!pulledReward) {
            const rand = Math.random() * 100;
            let sum = 0;
            for (let r of rewardsDB) {
                sum += r.weight;
                if (rand <= sum) {
                    pulledReward = r;
                    break;
                }
            }
        }

        // Set the back of the card
        if (this.elements.gachaResultIcon) this.elements.gachaResultIcon.textContent = pulledReward.icon;
        if (this.elements.gachaResultTitle) this.elements.gachaResultTitle.textContent = pulledReward.title;
        if (this.elements.gachaResultDesc) this.elements.gachaResultDesc.textContent = pulledReward.desc;

        // Animate flip
        setTimeout(() => {
            this.elements.gachaCard.classList.add('flipped');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

            // Add to engine inventory
            this.engine.inventory.push(pulledReward.id);
            this.engine.saveGamificationState();

            setTimeout(() => {
                this.renderGacha(); // Refresh lists and coins
                this.launchConfetti();
            }, 800);
        }, 100);
    }

    showShockAlert(message) {
        if (this.elements.shockMask) {
            this.elements.shockMask.classList.add('active');
            this.showToast(`🚨 ${message}`, 'danger');
            setTimeout(() => {
                this.elements.shockMask.classList.remove('active');
            }, 5000);
        }
    }

    renderCodex(tab = 'perlas', themeFilter = 'all') {
        const codexManager = this.engine.codexManager;
        this.elements.codexList.innerHTML = '';
        
        if (this.elements.tabPerlas) this.elements.tabPerlas.classList.toggle('active', tab === 'perlas');
        if (this.elements.tabErrores) this.elements.tabErrores.classList.toggle('active', tab === 'errores');

        // Show/hide filters specifically for perlas
        if (this.elements.codexFilters) {
            this.elements.codexFilters.classList.toggle('hidden', tab !== 'perlas');
        }

        if (tab === 'perlas') {
            const allThemes = ['theme-psych', 'theme-im', 'theme-surg', 'theme-peds', 'theme-gyn'];
            const themesToShow = themeFilter === 'all' ? allThemes : [themeFilter];
            
            let totalShown = 0;

            themesToShow.forEach(theme => {
                const perlas = codexManager.getPerlasByTheme(theme);
                perlas.forEach(entry => {
                    const perla = entry.perla;
                    const card = document.createElement('div');
                    card.className = `codex-card perla-item ${theme}`;
                    card.innerHTML = `
                        <div class="perla-badge">✨</div>
                        <h4>${perla.title}</h4>
                        <p>${perla.text}</p>
                        <span class="gpc-tag">${perla.source || 'GPC'}</span>
                        <div class="perla-footer">Desbloqueado: ${new Date(entry.dateUnlocked).toLocaleDateString()}</div>
                    `;
                    this.elements.codexList.appendChild(card);
                    totalShown++;
                });
            });

            if (totalShown === 0) {
                this.elements.codexList.innerHTML = `<p class="empty-msg">No hay perlas en esta categoría. Sobrevive a una Sala de Choque de ${themeFilter === 'all' ? 'cualquier especialidad' : themeFilter.replace('theme-', '')} para ganar una.</p>`;
            }
        } else {
            const errors = codexManager.getErrors();
            if (errors.length === 0) {
                this.elements.codexList.innerHTML = '<p class="empty-msg">Tu historial está limpio. No has cometido errores letales (por ahora).</p>';
                return;
            }
            errors.forEach(err => {
                const card = document.createElement('div');
                card.className = 'codex-card error-item';
                card.innerHTML = `
                    <div class="error-badge">💀</div>
                    <h4>${err.title}</h4>
                    <p><em>Vázquez dice:</em> ${err.reason}</p>
                    <span class="case-id-tag">${err.case_id}</span>
                `;
                this.elements.codexList.appendChild(card);
            });
        }
    }
}
