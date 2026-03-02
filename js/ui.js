import { ENGINE_STATE } from './engine.js';

const CATEGORY_ICONS = {
    vitals: '🩺',
    labs: '🧪',
    imaging: '📸',
    meds: '💊',
    timeline: '📋',
    notes: '🗒️',
    admin: '📁'
};

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
            checkpointTitle: document.getElementById('checkpoint-title'),
            perlaEnarm: document.getElementById('perla-enarm'),
            perlaTitle: document.getElementById('perla-title'),
            perlaText: document.getElementById('perla-text'),
            perlaGpc: document.getElementById('perla-gpc'),
            resultOutcome: document.getElementById('result-outcome'),
            timeFill: document.getElementById('time-fill'),
            mentorText: document.getElementById('mentor-text'),
            btnTutorialNext: document.getElementById('btn-tutorial-next'),
            davinciContainer: document.getElementById('davinci-container')
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
            case ENGINE_STATE.RESULTS:
            case ENGINE_STATE.DOSSIER:
                this.showView('results');
                this.renderResults();
                this.launchConfetti();
                break;
        }
    }

    renderIntake() {
        if (!this.engine.currentCase) return;
        const meta = this.engine.getCaseMeta();
        const framing = this.elements.caseFraming;
        if (!framing) return;

        if (meta) {
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

        const icon = CATEGORY_ICONS[card.category] || '📄';

        // Safety flag banner
        if (card.safety_flags && (card.safety_flags.lethal_risk || card.safety_flags.decision_critical)) {
            const alert = document.createElement('div');
            alert.className = 'card-alert';
            alert.textContent = card.safety_flags.lethal_risk ? '⚠️ Dato crítico de seguridad' : '⚡ Decisión crítica';
            cardEl.appendChild(alert);
        }

        const category = document.createElement('div');
        category.className = `card-category cat-${card.category}`;
        category.textContent = `${icon} ${card.category.toUpperCase()}`;

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = card.payload.title;

        const text = document.createElement('p');
        text.className = 'card-text';
        text.textContent = card.payload.text;

        text.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (!selection.isCollapsed && text.contains(selection.anchorNode)) {
                try {
                    const range = selection.getRangeAt(0);
                    const mark = document.createElement('mark');
                    mark.className = 'highlight-target';
                    range.surroundContents(mark);
                    selection.removeAllRanges();
                    if (navigator.vibrate) navigator.vibrate(20);
                } catch (e) {
                    // Ignore complex selection errors spanning multiple nodes
                }
            }
        });

        // Card index indicator
        const indexBadge = document.createElement('div');
        indexBadge.className = 'card-index';
        const total = this.engine.currentCase?.evidence_stream?.length || '?';
        indexBadge.textContent = `${this.engine.currentIndex + 1} / ${total}`;

        cardEl.appendChild(category);
        cardEl.appendChild(title);
        cardEl.appendChild(text);
        cardEl.appendChild(indexBadge);

        container.appendChild(cardEl);
        this.initializeSwipe(cardEl);
    }

    initializeSwipe(cardEl) {
        const hammer = new Hammer(cardEl);
        hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

        hammer.on('pan', (ev) => {
            cardEl.style.transition = 'none';
            const x = ev.deltaX;
            const rotate = x / 12;
            cardEl.style.transform = `translateX(${x}px) rotate(${rotate}deg)`;

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
                cardEl.style.transform = `translateX(${finalX}px) rotate(${ev.deltaX / 5}deg)`;
                setTimeout(() => {
                    if (this.onSwipeAction) this.onSwipeAction(direction);
                }, 200);
            } else {
                cardEl.style.transform = '';
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
        this.elements.btnCheckpointContinue.onclick = () => {
            this.engine.proceedFromCheckpoint(selectedIndex);
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
        this.elements.btnCheckpointContinue.onclick = () => {
            this.engine.handleTriadAnswer(selectedIndex);
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
            this.elements.resultOutcome.innerHTML = `
                <div class="verdict-label">${verdict}</div>
                <div class="score-grid">
                    <div class="score-item"><span class="score-num">${accuracy}%</span><span class="score-label">Precisión</span></div>
                    <div class="score-item"><span class="score-num">${Math.round(this.engine.confidence)}%</span><span class="score-label">Confianza</span></div>
                    <div class="score-item"><span class="score-num">${neuronas} 🧠</span><span class="score-label">Neuronas</span></div>
                </div>
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
                        'clinical_eye': '👁️ Ojo Clínico (+75)'
                    };
                    tagEl.textContent = tagNames[tag] || tag;
                    tagsDiv.appendChild(tagEl);
                });
                this.elements.resultOutcome.appendChild(tagsDiv);
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
}
