import { DataLoader } from './data_loader.js';
import { SwipeEngine, ENGINE_STATE } from './engine.js';
import { UIController } from './ui.js';
import { AudioManager } from './audio_manager.js';

class App {
    constructor() {
        this.loader = new DataLoader();
        this.engine = new SwipeEngine();
        this.ui = new UIController(this.engine);
        this.audio = new AudioManager();

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
        // Intro to Intake
        document.getElementById('btn-to-intake').addEventListener('click', () => {
            this.engine.state = ENGINE_STATE.INTAKE;
            this.ui.update();
            this.audio.play('swipe');
        });

        // Intake to Stream
        document.getElementById('btn-start').addEventListener('click', () => {
            this.engine.startReview();
            this.ui.update();
            this.audio.play('swipe');

            // Show tutorial if active
            if (this.engine.tutorialActive) {
                this.ui.showTutorialStep(0);
                this.engine.tutorialActive = false;
            }
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
            this.audio.play('finish');
        } else {
            // Next card
            this.ui.update();

            // Play feedback sound
            if (this.engine.lastFeedback) {
                this.audio.play(this.engine.lastFeedback.correct ? 'correct' : 'wrong');
            }
        }
    }
}

// Start App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
