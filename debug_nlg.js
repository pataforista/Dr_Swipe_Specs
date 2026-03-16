const { SwipeEngine } = require('./js/engine.js');
const fs = require('fs');

// Mock
global.window = { jsonLogic: null };
global.localStorage = { getItem: () => null, setItem: () => null };

const psychCase = JSON.parse(fs.readFileSync('./cases/CASE_DIAGNOSIS_PSYCH_001.json', 'utf8'));
const copyLibrary = JSON.parse(fs.readFileSync('./copy/ENGINE_SWIPE_COPY_LIBRARY_v1.json', 'utf8'));

const engine = new SwipeEngine();
engine.copyLibrary = copyLibrary;
engine.playerRank = 'MIP';

console.log("--- DEBUG NLG ---");
console.log("Card 1 Before:", psychCase.evidence_stream[0].payload.text);

// Initialize session
engine.initializeSession(psychCase);

const cards = engine.currentCase.evidence_stream;
console.log("Total Cards in Stream:", cards.length);

cards.forEach((c, idx) => {
    console.log(`Card ${idx} [${c.evidence_id}]: ${c.payload.text} (Condition: ${c.payload.condition})`);
});
