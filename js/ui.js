import { ENGINE_STATE } from './engine.js';

export class UIController {
    constructor(engine) {
        this.engine = engine;
        this.views = {
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
            caseFraming: document.getElementById('case-framing'),
            listKept: document.getElementById('list-kept'),
            listDiscarded: document.getElementById('list-discarded')
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
            case ENGINE_STATE.INTAKE:
                this.showView('intake');
                this.renderIntake();
                break;
            case ENGINE_STATE.STREAM:
                this.showView('stream');
                this.renderCurrentCard();
                this.updateStats();
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
    }
}
