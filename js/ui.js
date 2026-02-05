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
            resultStatus: document.getElementById('result-status'),
            listMistakes: document.getElementById('list-mistakes'),
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            tutorialStep: document.getElementById('tutorial-step')
        };
    }

    showView(viewName) {
        // Hide all
        Object.values(this.views).forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });

        // Show target
        const target = this.views[viewName];
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
        }
    }

    update() {
        const state = this.engine.state;

        // Map engine state to UI view
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
                this.updateStats();
                this.renderFeedback();
                break;
            case ENGINE_STATE.CHECKPOINT:
                this.showView('checkpoint');
                break;
            case ENGINE_STATE.DOSSIER:
            case ENGINE_STATE.RESULTS:
                this.showView('results');
                this.renderResults();
                break;
        }
    }

    renderIntake() {
        if (this.engine.currentCase) {
            this.elements.caseFraming.textContent = `Caso ID: ${this.engine.currentCase.case_id} | Dificultad: ${this.engine.currentCase.difficulty}`;
        }
    }

    renderCurrentCard() {
        const card = this.engine.getCurrentCard();
        const container = this.elements.cardStack;
        container.innerHTML = ''; // Clear

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

        // Note context: we use title class for css but h3 tag.
        const text = document.createElement('p');
        text.className = 'card-text';
        text.textContent = card.payload.text;

        cardEl.appendChild(category);
        cardEl.appendChild(title);
        cardEl.appendChild(text);

        container.appendChild(cardEl);
    }

    updateStats() {
        this.elements.progressFill.style.width = `${this.engine.getProgress()}%`;
        this.elements.counterKept.textContent = `Guardados: ${this.engine.keptItems.length}`;
        this.elements.counterDiscarded.textContent = `Descartados: ${this.engine.discardedItems.length}`;
        if (this.elements.counterCorrect) {
            this.elements.counterCorrect.textContent = `Aciertos: ${this.engine.stats.correct}`;
        }
        if (this.elements.counterStreak) {
            this.elements.counterStreak.textContent = `Racha: ${this.engine.stats.streak}`;
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
    }

    renderResults() {
        const kept = this.engine.keptItems;
        const discarded = this.engine.discardedItems;

        const createList = (items, parent) => {
            parent.innerHTML = '';
            items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `[${item.category}] ${item.payload.title}: ${item.payload.text}`;
                parent.appendChild(li);
            });
        };

        createList(kept, this.elements.listKept);
        createList(discarded, this.elements.listDiscarded);

        if (this.elements.resultStatus) {
            this.elements.resultStatus.innerHTML = `
                <strong>Precisión:</strong> ${this.engine.getAccuracy()}%<br>
                <strong>Aciertos:</strong> ${this.engine.stats.correct} de ${this.engine.stats.total}<br>
                <strong>Mejor racha:</strong> ${this.engine.stats.bestStreak}
            `;
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

    showTutorialStep(stepNumber) {
        if (!this.elements.tutorialOverlay) return;

        const steps = [
            {
                title: "Bienvenido, Doctor",
                text: "Esta es tu mesa de trabajo. Tu objetivo es construir un expediente clínico sólido.",
                btnText: "Siguiente"
            },
            {
                title: "¿Por qué hacemos esto?",
                text: "En medicina, el exceso de información puede matar. Debes filtrar lo importante del ruido.",
                btnText: "Entendido"
            },
            {
                title: "Botones de Acción",
                text: "Usa ✔ para GUARDAR evidencia crítica y ✖ para DESCARTAR lo irrelevante o duplicado.",
                btnText: "Empezar Tutorial"
            }
        ];

        const step = steps[stepNumber];
        if (!step) {
            this.elements.tutorialOverlay.classList.add('hidden');
            return;
        }

        this.elements.tutorialOverlay.classList.remove('hidden');
        this.elements.tutorialStep.innerHTML = `
            <h3>${step.title}</h3>
            <p>${step.text}</p>
            <button class="btn primary" id="btn-tutorial-next">${step.btnText}</button>
        `;

        document.getElementById('btn-tutorial-next').onclick = () => {
            this.showTutorialStep(stepNumber + 1);
        };
    }
}
