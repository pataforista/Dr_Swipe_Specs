export const ENGINE_STATE = {
    INTAKE: 'intake',
    STREAM: 'evidence_stream',
    CHECKPOINT: 'checkpoint',
    RESULTS: 'results',
    DOSSIER: 'dossier'
};

export class SwipeEngine {
    constructor() {
        this.state = ENGINE_STATE.INTAKE;
        this.currentCase = null;
        this.currentIndex = 0;

        // Dossier state
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {}; // map evidence_id -> text

        // Metrics for specs
        this.startTime = 0;
        this.checkpointsPassed = 0;
    }

    initializeSession(caseData) {
        this.currentCase = caseData;
        this.state = ENGINE_STATE.INTAKE;
        this.currentIndex = 0;
        this.keptItems = [];
        this.discardedItems = [];
        this.annotations = {};
        this.checkpointsPassed = 0;
        console.log("Session initialized for:", caseData.case_id);
    }

    startReview() {
        this.state = ENGINE_STATE.STREAM;
        this.startTime = Date.now();
        // Determine if we are at start or valid index
        // In spec: evidence ordered by stream index
    }

    getCurrentCard() {
        if (!this.currentCase || this.currentIndex >= this.currentCase.evidence_stream.length) {
            return null;
        }
        return this.currentCase.evidence_stream[this.currentIndex];
    }

    handleSwipe(direction) {
        // direction: 'left' (discard) or 'right' (keep)
        const card = this.getCurrentCard();
        if (!card) return;

        if (direction === 'right') {
            this.keptItems.push(card);
        } else {
            this.discardedItems.push(card);
        }

        // Check for checkpoint trigger AFTER this card index
        // The spec says "after_evidence_index": 4 means trigger after processing index 4 (0-based)
        const triggers = this.currentCase.checkpoint_triggers || [];
        const activeTrigger = triggers.find(t => t.after_evidence_index === this.currentIndex);

        this.currentIndex++;

        if (activeTrigger) {
            this.state = ENGINE_STATE.CHECKPOINT;
            return { action: 'checkpoint', trigger: activeTrigger };
        }

        // Check if end of stream
        if (this.currentIndex >= this.currentCase.evidence_stream.length) {
            this.state = ENGINE_STATE.DOSSIER; // or results
            return { action: 'finish' };
        }

        return { action: 'next_card' };
    }

    proceedFromCheckpoint() {
        // Logic to validate decision would go here.
        // For minimal spec, we just continue.
        this.checkpointsPassed++;

        // If there are more cards, go back to stream
        if (this.currentIndex < this.currentCase.evidence_stream.length) {
            this.state = ENGINE_STATE.STREAM;
        } else {
            this.state = ENGINE_STATE.RESULTS;
        }
    }

    annotate(text) {
        // Annotate current card
        const card = this.getCurrentCard();
        if (card) {
            this.annotations[card.evidence_id] = text;
        }
    }

    getProgress() {
        if (!this.currentCase) return 0;
        return (this.currentIndex / this.currentCase.evidence_stream.length) * 100;
    }
}
