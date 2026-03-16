const { SwipeEngine, ENGINE_STATE } = require('./js/engine.js');
const fs = require('fs');

// Mock
global.window = { jsonLogic: null };
global.localStorage = { getItem: () => null, setItem: () => null };

function runV3Test() {
    console.log("--- Testing Schema v3: Visceral Triage ---");

    const psychCase = JSON.parse(fs.readFileSync('./cases/CASE_DIAGNOSIS_PSYCH_001.json', 'utf8'));
    const copyLibrary = JSON.parse(fs.readFileSync('./copy/ENGINE_SWIPE_COPY_LIBRARY_v1.json', 'utf8'));

    // 1. Test initialized with v3
    const engine = new SwipeEngine();
    engine.copyLibrary = copyLibrary;
    engine.initializeSession(psychCase);

    console.log("Format Version:", engine.formatVersion);
    if (engine.formatVersion !== 'v3_swipe_action') throw new Error("Format should be v3_swipe_action");
    
    // 2. Test Swipe Correctness (Expected Action)
    const card1 = engine.getCurrentCard();
    console.log("Card 1 Category:", card1.category, "Expected:", card1.expected_action);
    
    engine.handleSwipe('right'); // Keep 'mania_energia' -> Correct
    if (engine.stats.correct !== 1) throw new Error("Swipe Right should be correct for 'keep'");

    // 3. Test Lethal Discard
    console.log("\nTesting Lethal Discard (Tox Screen)...");
    engine.handleSwipe('left'); // Discard vitals -> Correct (expected_action: discard)
    
    const toxCard = engine.getCurrentCard();
    console.log("Card 3:", toxCard.card_text, "Expected:", toxCard.expected_action);
    
    engine.handleSwipe('left'); // Lethal Discard!
    console.log("State after lethal discard:", engine.state);
    if (engine.state !== ENGINE_STATE.GHOSTED) throw new Error("Should be ghosted after lethal discard");
    
    console.log("Vazquez Lethal Comment:", engine.lastFeedback?.text);
    if (!engine.lastFeedback?.text.includes("¡Descartaste el toxicológico!")) throw new Error("Wrong lethal feedback");

    console.log("\n✅ ALL v3 LOGIC TESTS PASSED");
}

try {
    runV3Test();
} catch (e) {
    console.error("❌ TEST FAILED:", e.message);
    process.exit(1);
}
