const { SwipeEngine, ENGINE_STATE } = require('./js/engine.js');
const fs = require('fs');

// Mock global environment
global.window = { jsonLogic: null };
global.localStorage = {
    getItem: () => null,
    setItem: () => null
};

function runTest() {
    console.log("--- Testing Triage Fatal Ranking & Vázquez Feedback ---");

    const psychCase = JSON.parse(fs.readFileSync('./cases/CASE_DIAGNOSIS_PSYCH_001.json', 'utf8'));
    const copyLibrary = JSON.parse(fs.readFileSync('./copy/ENGINE_SWIPE_COPY_LIBRARY_v1.json', 'utf8'));

    // 1. Test Rank S (Perfect)
    console.log("\nTesting RANK S...");
    const engineS = new SwipeEngine();
    engineS.copyLibrary = copyLibrary; // Manual inject for test
    engineS.initializeSession(psychCase);
    
    // Swipe correctly on all 3 cards in psych case (is_match: 1st true, 2nd false, 3rd false)
    engineS.handleSwipe('right');
    engineS.handleSwipe('left');
    engineS.handleSwipe('left');
    
    engineS.calculateDossierScore();
    console.log("Accuracy:", engineS.getAccuracy(), "Rank:", engineS.stats.rank);
    if (engineS.stats.rank !== 'S') throw new Error("Rank should be S");
    console.log("Vazquez S Feedback:", copyLibrary.vazquez_feedback.RANK_S.title);

    // 2. Test Rank F (Lethal Error)
    console.log("\nTesting RANK F (Lethal Failure)...");
    const engineF = new SwipeEngine();
    engineF.copyLibrary = copyLibrary;
    engineF.initializeSession(psychCase);
    
    engineF.handleSwipe('right');
    engineF.handleSwipe('left');
    engineF.handleSwipe('right'); // WRONG on Lethal Risk card
    
    engineF.calculateDossierScore();
    console.log("State:", engineF.state, "Rank:", engineF.stats.rank);
    if (engineF.stats.rank !== 'F') throw new Error("Rank should be F");
    console.log("Vazquez F Feedback:", copyLibrary.vazquez_feedback.RANK_F.title);

    // 3. Test Rank D (Hoarding/High Noise)
    console.log("\nTesting RANK D (Hoarding)...");
    const engineD = new SwipeEngine();
    engineD.copyLibrary = copyLibrary;
    engineD.initializeSession(psychCase);
    
    // Keep some noise but avoid lethal card (Card 3)
    engineD.handleSwipe('right'); // Signal (Correct)
    engineD.handleSwipe('right'); // Noise -> Mistake (Kept Noise)
    engineD.handleSwipe('left');  // Noise Lethal -> Correct (Discarded)
    
    engineD.calculateDossierScore();
    const keptNoise = engineD.keptItems.filter(i => engineD.getExpectedAction(i) === 'left').length;
    console.log("Accuracy:", engineD.getAccuracy(), "Kept Noise:", keptNoise, "Rank:", engineD.stats.rank);
    if (engineD.stats.rank !== 'D') throw new Error("Rank should be D due to weak performance or noise");

    // 4. Test NLG Engine & Progression
    console.log("\nTesting NLG & Progression...");
    const engineP = new SwipeEngine();
    engineP.copyLibrary = copyLibrary;
    engineP.playerRank = 'MIP';
    engineP.initializeSession(psychCase);

    const firstCard = engineP.getCurrentCard();
    console.log("Original Text:", psychCase.evidence_stream[0].payload.text);
    console.log("NLG Injected Text:", firstCard.payload.text);
    
    // Test Rank Up
    engineP.handleSwipe('right');
    engineP.handleSwipe('left');
    engineP.handleSwipe('left');
    engineP.calculateDossierScore();
    
    console.log("New Player Rank:", engineP.playerRank);
    if (engineP.playerRank !== 'R1') throw new Error("Should have ranked up to R1");

    console.log("\n✅ ALL ADVANCED TESTS PASSED");
}

try {
    runTest();
} catch (e) {
    console.error("❌ TEST FAILED:", e.message);
    process.exit(1);
}
