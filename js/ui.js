import { ENGINE_STATE } from './engine.js';

export class UIController {
    constructor(engine) {
        this.engine = engine;
        this.views = {
            intro: document.getElementById('view-intro'),
            intake: document.getElementById('view-intake'),
            stream: document.getElementById('view-stream'),
            checkpoint: document.getElementById('view-checkpoint'),
            results: document.getElementById('view-results')
        };

        this.elements = {
            cardStack: document.getElementById('card-stack'),
            progressFill: document.getElementById('progress-fill'),
            counterKept: document.getElementById('counter-kept'),
            counterDiscarded: document.getElementById('counter-discarded'),
            counterCorrect: document.getElementById('counter-correct'),
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
            tutorialStep: document.getElementById('tutorial-step'),
            missionBanner: document.getElementById('mission-banner'),
            confidenceFill: document.getElementById('confidence-fill'),
            quizQuestion: document.getElementById('quiz-question'),
            quizOptions: document.getElementById('quiz-options'),
            quizHint: document.getElementById('quiz-hint'),
            btnCheckpointContinue: document.getElementById('btn-checkpoint-continue'),
            checkpointTitle: document.getElementById('checkpoint-title'),
            triadContainer: document.getElementById('triad-container'),
            triadQuestions: document.getElementById('triad-questions'),
            perlaEnarm: document.getElementById('perla-enarm'),
            perlaTitle: document.getElementById('perla-title'),
            perlaText: document.getElementById('perla-text'),
            perlaGpc: document.getElementById('perla-gpc'),
            resultOutcome: document.getElementById('result-outcome'),
            timeFill: document.getElementById('time-fill'),
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            mentorText: document.getElementById('mentor-text'),
            btnTutorialNext: document.getElementById('btn-tutorial-next'),
            davinciContainer: document.getElementById('davinci-container')
        };

        this.tutorialStep = 0;
        this.tutorialData = [
            {
                text: "Bienvenido al Sistema Central de Triaje. Soy la Dra. Velez. Iniciemos el desbridamiento de este reporte.",
                action: "none"
            },
            {
                text: "Este es el Brazo Da Vinci de triaje. Deslice a la derecha para ANEXAR evidencia clínica crítica al expediente.",
                action: "swipe-right"
            },
            {
                text: "Deslice a la izquierda para DESCARTAR el ruido administrativo o duplicados que drenan su enfoque.",
                action: "swipe-left"
            },
            {
                text: "Monitoree su barra de Tiempo y Enfoque. Si desciende al 0%, el paciente entra en descompensación crítica. Proceda.",
                action: "none"
            }
        ];

        this.swipeThreshold = 100; // px
        this.onSwipeAction = null; // callback for App
        if (this.elements.btnTutorialNext) {
            this.elements.btnTutorialNext.onclick = () => this.nextTutorialStep();
        }
    }

    showView(viewName) {
        Object.values(this.views).forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
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

                // Trigger tutorial if first time
                if (this.engine.stats.total === 0 && this.tutorialStep === 0) {
                    this.startTutorial();
                }
                break;
            case ENGINE_STATE.CHECKPOINT:
                this.showView('checkpoint');
                this.renderQuiz();
                break;
            case ENGINE_STATE.FINAL_TRIAD:
                this.showView('checkpoint');
                this.renderFinalTriad();
                break;
            case ENGINE_STATE.RESULTS:
            case ENGINE_STATE.DOSSIER:
                this.showView('results');
                this.renderResults();
                this.launchConfetti();
                break;
        }
    }

    renderIntake() {
        if (this.engine.currentCase) {
            this.elements.caseFraming.textContent = `Caso ID: ${this.engine.currentCase.case_id} | Dificultad: ${this.engine.currentCase.difficulty}`;
        }
    }

    renderMission() {
        if (this.elements.missionBanner) {
            this.elements.missionBanner.textContent = `MISIÓN: ${this.engine.getMission()}`;
        }
    }

    renderCurrentCard() {
        const card = this.engine.getCurrentCard();
        const container = this.elements.cardStack;
        container.innerHTML = '';

        if (!card) return;

        if (this.elements.learningTip) {
            this.elements.learningTip.textContent = this.engine.getTeachingTip(card);
        }

        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.style.animation = 'fadeIn 0.3s ease';

        const category = document.createElement('div');
        category.className = 'card-category';
        category.textContent = card.category;

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = card.payload.title;

        const text = document.createElement('p');
        text.className = 'card-text';
        text.textContent = card.payload.text;

        cardEl.appendChild(category);
        cardEl.appendChild(title);
        cardEl.appendChild(text);

        container.appendChild(cardEl);

        this.initializeSwipe(cardEl);
    }

    initializeSwipe(cardEl) {
        const hammer = new Hammer(cardEl);
        hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

        hammer.on('pan', (ev) => {
            cardEl.style.transition = 'none';
            const x = ev.deltaX;
            const rotate = x / 10;
            cardEl.style.transform = `translateX(${x}px) rotate(${rotate}deg)`;

            // Visual feedback on draft
            if (x > 50) cardEl.style.borderColor = 'var(--success)';
            else if (x < -50) cardEl.style.borderColor = 'var(--danger)';
            else cardEl.style.borderColor = '#e5e7eb';
        });

        hammer.on('panend', (ev) => {
            cardEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            if (Math.abs(ev.deltaX) > this.swipeThreshold) {
                const direction = ev.deltaX > 0 ? 'right' : 'left';
                const finalX = direction === 'right' ? 1000 : -1000;
                cardEl.style.transform = `translateX(${finalX}px) rotate(${ev.deltaX / 5}deg)`;

                setTimeout(() => {
                    if (this.onSwipeAction) this.onSwipeAction(direction);
                }, 200);
            } else {
                cardEl.style.transform = '';
                cardEl.style.borderColor = '#e5e7eb';
            }
        });
    }

    launchConfetti() {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 1000
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    updateStats() {
        this.elements.progressFill.style.width = `${this.engine.getProgress()}%`;

        const oldConfidence = parseFloat(this.elements.confidenceFill.style.width) || 0;
        const newConfidence = this.engine.confidence;
        this.elements.confidenceFill.style.width = `${newConfidence}%`;

        if (newConfidence > oldConfidence + 5) {
            this.renderDiscoveryEffect();
        }

        this.elements.counterKept.textContent = `Guardados: ${this.engine.keptItems.length}`;
        this.elements.counterDiscarded.textContent = `Descartados: ${this.engine.discardedItems.length}`;

        const isResults = this.engine.state === ENGINE_STATE.RESULTS || this.engine.state === ENGINE_STATE.DOSSIER;
        if (this.elements.counterCorrect) {
            this.elements.counterCorrect.textContent = `Aciertos: ${this.engine.stats.correct}`;
            this.elements.counterCorrect.classList.toggle('hide-during-stream', !isResults);
        }
        if (this.elements.counterStreak) {
            this.elements.counterStreak.textContent = `Racha: ${this.engine.stats.streak}`;
            this.elements.counterStreak.classList.toggle('hide-during-stream', !isResults);
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

        const actionLabel = feedback.expected === 'right' ? 'Guardar' : 'Descartar';
        this.elements.feedbackTitle.textContent = feedback.correct
            ? `✅ ¡Bien! ${actionLabel} era lo correcto.`
            : `🔍 Consejo: lo ideal era ${actionLabel.toLowerCase()}.`;
        this.elements.feedbackText.textContent = feedback.rationale;

        // Check for Narrative or Intuition bits in the last action result
        // Note: result is passed from App.js to handleAction
    }

    showEventNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `event-toast type-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'intuition' ? '🌟' : '📢'}</div>
            <div class="toast-content">${message}</div>
        `;
        document.body.appendChild(toast);

        // Animation
        setTimeout(() => toast.classList.add('active'), 100);
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
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

        this.elements.checkpointTitle.textContent = `Reto Clínico #${quiz.checkpoint_sequence}`;
        this.elements.quizQuestion.textContent = quiz.question;
        this.elements.quizOptions.innerHTML = '';
        this.elements.btnCheckpointContinue.classList.add('hidden');

        const unlockedIds = this.engine.getUnlockedHints(quiz);
        if (unlockedIds.length > 0) {
            this.elements.quizHint.classList.remove('hidden');
            this.elements.quizHint.innerHTML = `🌟 <strong>Investigación activa:</strong> Tienes ${unlockedIds.length} dato(s) clave.`;
        } else {
            this.elements.quizHint.classList.add('hidden');
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
        } else {
            button.classList.add('wrong');
            options[correctIndex].classList.add('correct');
        }

        this.elements.btnCheckpointContinue.classList.remove('hidden');
        this.elements.btnCheckpointContinue.onclick = () => {
            this.engine.proceedFromCheckpoint(selectedIndex);
            this.update();
        };
    }

    renderFinalTriad() {
        const currentTriadIndex = this.engine.currentTriadIndex;
        const triad = this.engine.currentCase.final_triad[currentTriadIndex];
        if (!triad) return;

        this.elements.checkpointTitle.textContent = `DESAFÍO FINAL: ${triad.type.toUpperCase()}`;
        this.elements.quizQuestion.textContent = triad.question;
        this.elements.quizOptions.innerHTML = '';
        this.elements.btnCheckpointContinue.classList.add('hidden');

        const unlockedIds = this.engine.getUnlockedHints(triad);
        if (unlockedIds.length > 0) {
            this.elements.quizHint.classList.remove('hidden');
            this.elements.quizHint.innerHTML = `🌟 <strong>Memoria clínica:</strong> Tienes ${unlockedIds.length} dato(s) clave en tu expediente.`;
        } else {
            this.elements.quizHint.classList.add('hidden');
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
        } else {
            button.classList.add('wrong');
            options[correctIndex].classList.add('correct');
        }

        this.elements.btnCheckpointContinue.classList.remove('hidden');
        this.elements.btnCheckpointContinue.onclick = () => {
            this.engine.handleTriadAnswer(selectedIndex);
            this.update();
        };
    }

    renderResults() {
        const kept = this.engine.keptItems;
        const discarded = this.engine.discardedItems;

        const createList = (items, parent) => {
            if (!parent) return;
            parent.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `[${item.category}] ${item.payload.title}: ${item.payload.text}`;
                parent.appendChild(li);
            });
        };

        createList(kept, this.elements.listKept);
        createList(discarded, this.elements.listDiscarded);

        if (this.elements.resultOutcome) {
            const accuracy = this.engine.getAccuracy();
            let verdict = "Investigación Incompleta";
            if (accuracy > 80 && this.engine.confidence > 70) verdict = "Investigación de Excelencia";
            else if (accuracy > 60) verdict = "Investigación Aceptable";

            this.elements.resultOutcome.innerHTML = `
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem;">${verdict}</div>
                <strong>Precisión Clínica:</strong> ${accuracy}%<br>
                <strong>Confianza Final:</strong> ${Math.round(this.engine.confidence)}%<br>
                <strong>Neuronas Ganadas:</strong> ${this.engine.stats.neuronas} 🧠
            `;
        }

        if (this.elements.perlaEnarm && this.engine.currentCase.perla_enarm) {
            const perla = this.engine.currentCase.perla_enarm;
            this.elements.perlaEnarm.classList.remove('hidden');
            this.elements.perlaTitle.textContent = perla.title;
            this.elements.perlaText.textContent = perla.text;
            this.elements.perlaGpc.textContent = perla.gpc_ref;
        }

        if (this.elements.listMistakes) {
            this.elements.listMistakes.innerHTML = '';
            if (this.engine.stats.mistakes.length === 0) {
                const li = document.createElement('li');
                li.textContent = '¡Excelente! No hay errores para revisar.';
                this.elements.listMistakes.appendChild(li);
            } else {
                this.engine.stats.mistakes.forEach(mistake => {
                    const li = document.createElement('li');
                    const expectedAction = mistake.expected === 'right' ? 'guardar' : 'descartar';
                    li.textContent = `[${mistake.category}] ${mistake.title}: era mejor ${expectedAction}.`;
                    this.elements.listMistakes.appendChild(li);
                });
            }
        }
    }

    startTutorial() {
        this.tutorialStep = 0;
        this.elements.tutorialOverlay.classList.remove('hidden');
        this.elements.tutorialOverlay.classList.add('active');
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
        this.elements.mentorText.textContent = step.text;

        // Visual cues
        if (this.elements.davinciContainer) {
            this.elements.davinciContainer.classList.remove('robot-swiping');
            if (step.action !== 'none') {
                this.elements.davinciContainer.classList.add('robot-swiping');
            }
        }
    }

    finishTutorial() {
        this.elements.tutorialOverlay.classList.remove('active');
        setTimeout(() => {
            this.elements.tutorialOverlay.classList.add('hidden');
        }, 500);
    }
}
