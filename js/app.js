import { DataLoader } from './data_loader.js';
import { SwipeEngine, ENGINE_STATE } from './engine.js';
import { UIController } from './ui.js';

class App {
    constructor() {
        this.loader = new DataLoader();
        this.engine = new SwipeEngine();
        this.ui = new UIController(this.engine);

        this.init();
    }

    async init() {
        this.bindEvents();

        // Load default case (hardcoded for v1 prototype)
        // Ideally user selects from a menu, but for "intake" we load one to start.
        try {
            const caseData = await this.loader.loadCase('case_swipe_easy_001');
            this.engine.initializeSession(caseData);
            this.ui.update();
        } catch (error) {
            console.error("Failed to initialize app:", error);
            // Fallback for file:// protocol if fetch fails
            alert("Error cargando el caso. Si estás ejecutando localmente sin servidor, por favor usa un servidor local (ej. VS Code Live Server o 'python -m http.server').");
        }
    }

    bindEvents() {
        // Intake
        document.getElementById('btn-start').addEventListener('click', () => {
            this.engine.startReview();
            this.ui.update();
        });

        // Swipe Actions
        document.getElementById('btn-discard').addEventListener('click', () => this.handleAction('left'));
        document.getElementById('btn-keep').addEventListener('click', () => this.handleAction('right'));

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.engine.state === ENGINE_STATE.STREAM) {
                if (e.key === 'ArrowLeft') this.handleAction('left');
                if (e.key === 'ArrowRight') this.handleAction('right');
            }
        });

        // Checkpoint
        document.getElementById('btn-checkpoint-continue').addEventListener('click', () => {
            this.engine.proceedFromCheckpoint();
            this.ui.update();
        });

        // Restart
        document.getElementById('btn-restart').addEventListener('click', () => {
            location.reload();
        });
    }

    handleAction(direction) {
        if (this.engine.state !== ENGINE_STATE.STREAM) return;

        const result = this.engine.handleSwipe(direction);

        if (result && result.action === 'checkpoint') {
            // Checkpoint triggered
            this.ui.update();
        } else if (result && result.action === 'finish') {
            // Finished
            this.ui.update();
        } else {
            // Next card
            this.ui.update();
        }
    }
}

// Start App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
