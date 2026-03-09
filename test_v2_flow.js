const { SwipeEngine, ENGINE_STATE } = require('./js/engine.js');

// Mock window for Node testing
global.window = { jsonLogic: null };

function testFullV2PsychFlow() {
    console.log("--- Starting End-to-End V2 Psych Flow Test ---");

    // 1. Setup
    const psychCase = JSON.parse(require('fs').readFileSync('./cases/CASE_DIAGNOSIS_PSYCH_001.json', 'utf8'));
    const engine = new SwipeEngine();
    engine.initializeSession(psychCase);

    console.log("Step 1: Intake (Format V2 recognized)");
    if (engine.formatVersion !== 'v2') throw new Error("Format error");
    if (!engine.patientProfile) throw new Error("Missing patient profile");

    // 2. Start Review
    engine.startReview();
    console.log("Step 2: Stream Started");

    // 3. First Differential: Episodio Maníaco (Match)
    let card = engine.getCurrentCard();
    console.log(`Action: Swiping right on ${card.payload.title}`);
    let res = engine.handleSwipe('right');

    if (engine.lastFeedback.correct !== true) throw new Error("Match failed");
    console.log("Result: Match OK. Feedback:", engine.lastFeedback.feedback_text);

    // 4. Second Differential: Crisis de Pánico (Discard)
    card = engine.getCurrentCard();
    console.log(`Action: Swiping left on ${card.payload.title}`);
    res = engine.handleSwipe('left');

    if (engine.lastFeedback.correct !== true) throw new Error("Discard failed");
    console.log("Result: Discard OK. Feedback:", engine.lastFeedback.feedback_text);

    // 5. Final Differential: Consumo de Sustancias (Red Flag Test)
    // We'll test DOING THE WRONG THING (Swiping RIGHT on a non-match that is a Lethal Risk)
    card = engine.getCurrentCard();
    console.log(`Action: WRONG action (Match) on Red Flag: ${card.payload.title}`);
    res = engine.handleSwipe('right');

    if (engine.state !== ENGINE_STATE.GHOSTED) throw new Error("Should have been GHOSTED");
    if (res.action !== 'ghosted') throw new Error("Response should be ghosted");
    console.log("Result: GHOSTING TRIGGERED SUCCESSFULLY 👻");

    console.log("--- V2 PSYCH FLOW TEST COMPLETED SUCCESSFULLY ---");
}

try {
    testFullV2PsychFlow();
} catch (e) {
    console.error("❌ FLOW TEST FAILED:", e.message);
    process.exit(1);
}
