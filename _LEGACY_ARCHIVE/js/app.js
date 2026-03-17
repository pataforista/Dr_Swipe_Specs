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

        this.selectedDifficulty = 'easy';
        this.caseMap = {
            easy: 'case_swipe_easy_001',
            standard: 'case_swipe_standard_001',
            hard: 'case_swipe_hard_001'
        };

        this.init();
    }

    async init() {
        this.bindEvents();
        this.ui.onSwipeAction = (direction) => this.handleAction(direction);

        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');

        if (mode === 'procedural') {
            try {
                const proceduralData = sessionStorage.getItem('PROCEDURAL_CASE');
                if (proceduralData) {
                    const caseData = JSON.parse(proceduralData);
                    this.engine.initializeSession(caseData);
                    this.selectedDifficulty = caseData.difficulty;

                    // UI Adjustments for Sandbox
                    document.getElementById('sandbox-mode-banner')?.classList.remove('hidden');
                    document.getElementById('difficulty-section')?.classList.add('hidden');
                    document.querySelector('.subtitle').textContent = "Juega un caso infinito generado al vuelo";

                    this.ui.update();
                    console.log("Loaded procedural sandbox case");
                    return;
                }
            } catch (e) {
                console.error("Failed to load procedural case from session:", e);
                alert("Error cargando el caso procedimental. Volviendo a modo normal.");
            }
        }

        // Pre-load easy case to prepare intake screen
        try {
            await this.loadCase('easy');
            this.ui.update();
        } catch (error) {
            console.error("Failed to initialize app:", error);
            alert("Error cargando el caso. Por favor usa un servidor local (ej. VS Code Live Server o 'python -m http.server').");
        }
    }

    async loadCase(difficultyOrSpecialty) {
        // Now using procedural cases filtered by specialty prefix or 'all'
        const caseData = await this.loader.loadProceduralCase(difficultyOrSpecialty);
        this.engine.initializeSession(caseData);
        this.selectedDifficulty = difficultyOrSpecialty;
    }

    bindEvents() {
        // Intro → Intake
        document.getElementById('btn-to-intake').addEventListener('click', () => {
            this.engine.state = ENGINE_STATE.INTAKE;
            this.ui.update();
            this.audio.play('swipe');
        });

        // Specialty selector buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const specialty = btn.dataset.specialty;
                try {
                    await this.loadCase(specialty);
                    this.ui.renderIntake();
                } catch (e) {
                    console.error("Cannot load case:", e);
                }
            });
        });

        // Gamification / Gacha events
        document.getElementById('btn-open-gacha')?.addEventListener('click', () => {
            this.engine.state = ENGINE_STATE.GACHA;
            this.ui.update();
        });

        document.getElementById('btn-gacha-back')?.addEventListener('click', () => {
            this.engine.state = ENGINE_STATE.INTAKE;
            this.ui.update();
        });

        document.getElementById('btn-pull-gacha')?.addEventListener('click', () => {
            if (this.engine.spendCoins(100)) {
                this.audio.play('swipe'); // Play generic sound
                this.ui.playGachaAnimation();
            } else {
                const errorMsg = document.getElementById('gacha-error-msg');
                if (errorMsg) {
                    errorMsg.classList.remove('hidden');
                    setTimeout(() => errorMsg.classList.add('hidden'), 2000);
                }
                this.audio.play('wrong');
            }
        });

        // Intake → Stream (FIX: was 'btn-start', HTML has 'btn-start-game')
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.engine.startReview();
            this.ui.update();
            this.audio.play('swipe');

            if (this.engine.tutorialActive) {
                this.ui.startTutorial();
                this.engine.tutorialActive = false;
            }
        });

        // Swipe buttons
        document.getElementById('btn-discard').addEventListener('click', () => this.handleAction('left'));
        document.getElementById('btn-keep').addEventListener('click', () => this.handleAction('right'));

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (this.engine.state === ENGINE_STATE.STREAM) {
                if (e.key === 'ArrowLeft') this.handleAction('left');
                if (e.key === 'ArrowRight') this.handleAction('right');
            }
        });

        // FIX: Removed the redundant btn-checkpoint-continue listener here.
        // ui.js handles it correctly with selectedIndex in handleQuizAnswer/handleTriadAnswer.

        // Restart
        document.getElementById('btn-restart').addEventListener('click', () => {
            location.reload();
        });
    }

    handleAction(direction) {
        if (this.engine.state !== ENGINE_STATE.STREAM) return;

        const result = this.engine.handleSwipe(direction);

        if (this.engine.formatVersion === 'v2') {
            this.ui.updatePatientSummary();
        }

        if (result && result.action === 'ghosted') {
            this.ui.update();
            this.audio.play('wrong');
        } else if (this.engine.formatVersion === 'v2') {
            // V2 clinical reasoning always shows "The Chat" after a swipe
            this.engine.state = ENGINE_STATE.THE_CHAT;
            this.ui.update();
            if (this.engine.lastFeedback) {
                this.audio.play(this.engine.lastFeedback.correct ? 'correct' : 'wrong');
            }
        } else if (result && result.action === 'checkpoint') {
            this.ui.update();
        } else if (result && result.action === 'finish') {
            this.ui.update();
            this.audio.play('finish');
        } else {
            this.ui.update();

            if (this.engine.lastFeedback) {
                this.audio.play(this.engine.lastFeedback.correct ? 'correct' : 'wrong');
            }

            if (result && result.narration) {
                this.ui.showEventNotification(result.narration, 'narration');
            }
            if (result && result.intuition) {
                this.ui.showEventNotification(result.intuition, 'intuition');
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
