const { SwipeEngine, ENGINE_STATE } = require('./js/engine.js');

// Mock window.jsonLogic if needed, though not strictly for V2 basic tests
global.window = { jsonLogic: null };

function testV2Logic() {
    console.log("--- Testing SwipeEngine V2 Logic ---");

    // Load V2 Psychiatry Case Mock
    const psychCase = JSON.parse(require('fs').readFileSync('./cases/CASE_DIAGNOSIS_PSYCH_001.json', 'utf8'));

    const engine = new SwipeEngine();
    engine.initializeSession(psychCase);

    console.log("Format Version:", engine.formatVersion);
    if (engine.formatVersion !== 'v2') throw new Error("Format should be V2");

    // Test Match (Right Swipe)
    const card0 = engine.getCurrentCard(); // Episodio Maníaco (is_match: true)
    console.log(`Swiping right on: ${card0.payload.title}`);
    const res1 = engine.handleSwipe('right');

    if (engine.lastFeedback.correct !== true) throw new Error("Should be correct match");
    if (engine.lastFeedback.feedback_text !== card0.feedback.match) throw new Error("Incorrect match feedback");
    console.log("✅ Match Logic OK");

    // Test Discard (Left Swipe) on Non-Match
    const card1 = engine.getCurrentCard(); // Crisis de Pánico (is_match: false)
    console.log(`Swiping left on: ${card1.payload.title}`);
    engine.handleSwipe('left');

    if (engine.lastFeedback.correct !== true) throw new Error("Should be correct discard");
    if (engine.lastFeedback.feedback_text !== card1.feedback.discard) throw new Error("Incorrect discard feedback");
    console.log("✅ Discard Logic OK");

    // Test Ghosting (Left Swipe on Lethal Risk)
    const card2 = engine.getCurrentCard(); // Consumo de Sustancias (is_match: false, lethal_risk: true)
    // Wait, is_match: false means expected action is LEFT. 
    // To trigger GHOSTING, the user must FAIL to provide the correct action.
    // If it's a lethal risk and the user does the WRONG action, they get ghosted?
    // Let's re-verify registerDecision logic:
    // if (this.formatVersion === 'v2' && card.safety_flags?.lethal_risk && !correct) { this.state = ENGINE_STATE.GHOSTED; }

    console.log(`FAILING Lethal Risk swipe (right) on: ${card2.payload.title}`);
    const res3 = engine.handleSwipe('right'); // WRONG ACTION

    if (engine.state !== ENGINE_STATE.GHOSTED) throw new Error("Should be GHOSTED");
    if (res3.action !== 'ghosted') throw new Error("HandleSwipe should return 'ghosted' action");
    console.log("✅ Ghosting Logic OK");

    console.log("--- ALL V2 LOGIC TESTS PASSED ---");
}

try {
    testV2Logic();
} catch (e) {
    console.error("❌ TEST FAILED:", e.message);
    process.exit(1);
}
