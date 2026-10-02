const fs = require('fs');
let content = fs.readFileSync('dr-swipe/src/machines/gameMachine.ts', 'utf8');

content = content.replace(/import type \{ Card, LoreItem, EnarmPearl \} from '\.\.\/types\/game';/, `import type { Card, LoreItem, EnarmPearl, SessionState, CaseResult } from '../types/game';\nimport type { CaseOutcome } from '../types/srs';`);

content = content.replace(/activeEvent: \{ active: boolean; event: \{ title: string; description: string; effect: string \} \} \| null;/, `activeEvent: { active: boolean; event: { title: string; description: string; effect: string } } | null;\n    session: SessionState;`);

content = content.replace(/activeEvent: null,/, `activeEvent: null,\n      session: {\n        startedAt: 0,\n        caseResults: [],\n        pearlsEarned: [],\n        casesCompleted: 0,\n        casesFailed: 0,\n        totalXP: 0,\n        totalCoins: 0,\n        maxCombo: 0,\n        correctSwipes: 0,\n        wrongSwipes: 0,\n      },`);

// Initializing in START_GUARD
content = content.replace(/lastAction: null\n\s*\}\)\n\s*\}/, `lastAction: null,\n              session: {\n                startedAt: Date.now(),\n                caseResults: [],\n                pearlsEarned: [],\n                casesCompleted: 0,\n                casesFailed: 0,\n                totalXP: 0,\n                totalCoins: 0,\n                maxCombo: 0,\n                correctSwipes: 0,\n                wrongSwipes: 0,\n              }\n            })\n          }`);

fs.writeFileSync('dr-swipe/src/machines/gameMachine.ts', content);
