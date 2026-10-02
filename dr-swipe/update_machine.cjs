const fs = require('fs');
let content = fs.readFileSync('C:/Users/Admin/Documents/GitHub/Dr_Swipe_Specs/dr-swipe/src/machines/gameMachine.ts', 'utf8');

// 1. Imports
const importLines = `import { setup, assign } from 'xstate';
import type { Card, EnarmPearl, LoreItem, SessionState, CaseOutcome } from '../types/game';
import { cleanMentorComment } from '../utils/formatters';
import { parseVitalsFromText } from '../utils/vitalsParser';
import { calculateCardScore, isLethalCard, undoChargesFor, VITALITY_HIT } from '../utils/scoringEngine';
import { buildCaseResult } from '../utils/sessionEngine';
import { computeSuccessOutcome } from '../utils/rewardsEngine';`;

content = content.replace(/import \{ setup, assign \} from 'xstate';[\s\S]*?from '\.\.\/utils\/scoringEngine';/, importLines);

// 2. GameContext
const contextRegex = /session: SessionState;\s+feedbackHistory: Array<\{/;
const newContext = `session: SessionState;
  lethalErrorsThisCase: number;
  caseStartedAt: number;
  wasRescued: boolean;
  caseId: string;
  pearlId: string | null;
  feedbackHistory: Array<{`;
content = content.replace(contextRegex, newContext);
content = content.replace(/hasRescuedThisCase: boolean;\s+/, '');

// 3. Events
content = content.replace(/deck: Card\[\]; difficulty: string; pearl\?: EnarmPearl; isSandiaMode\?: boolean \}/, 'deck: Card[]; difficulty: string; pearl?: EnarmPearl; isSandiaMode?: boolean; case_id?: string }');
content = content.replace(/snapshot: ResumeSnapshot \}/, 'snapshot: ResumeSnapshot; case_id?: string }');
content = content.replace(/puzzle\?: EnarmPearl; isSandiaMode\?: boolean \} \/\/ deck of the NEXT case/, 'puzzle?: EnarmPearl; isSandiaMode?: boolean; case_id?: string } // deck of the NEXT case');

// 4. recordCaseResult
const setupRegex = /export const gameMachine = setup\(\{/;
const recordCaseResult = `const recordCaseResult = (resolveOutcome: (ctx: GameContext) => CaseOutcome) =>
  assign(({ context }) => {
    const now = Date.now();
    const result = buildCaseResult(context, resolveOutcome(context), now);
    return {
      session: {
        ...context.session,
        caseResults: [...context.session.caseResults, result],
      },
      currentCardIndex: 0,
      mistakesThisCase: 0,
      lethalErrorsThisCase: 0,
      wasRescued: false,
      combo: 0,
      caseStartedAt: now,
      lastAction: null,
    };
  });

export const gameMachine = setup({`;
content = content.replace(setupRegex, recordCaseResult);

// 5. resetGame
content = content.replace(/hasRescuedThisCase: false,/, `wasRescued: false,
      lethalErrorsThisCase: 0,
      caseStartedAt: Date.now(),
      caseId: '',
      pearlId: null,`);

// 6. context initialization
content = content.replace(/hasRescuedThisCase: false,/, `wasRescued: false,
    lethalErrorsThisCase: 0,
    caseStartedAt: Date.now(),
    caseId: '',
    pearlId: null,`);

// 7. START_GUARD, RESUME_GUARD, CONTINUE_SHIFT, RESCUE, REVIVE_INTERN - replace hasRescuedThisCase with wasRescued
content = content.replace(/hasRescuedThisCase:/g, 'wasRescued:');

// 8. ADD caseId, etc to START_GUARD
const startGuardRegex = /wasRescued: false,\s*usedUndoThisCase: false,\s*lastAction: null/;
content = content.replace(startGuardRegex, `wasRescued: false,
            lethalErrorsThisCase: 0,
            caseStartedAt: Date.now(),
            caseId: ({ event }) => event.case_id || (event.deck[0] ? event.deck[0].card_id.split('_').slice(0, 2).join('_') : 'unknown'),
            pearlId: ({ event }) => event.pearl?.id || null,
            usedUndoThisCase: false,
            lastAction: null`);

// 9. RESUME_GUARD
const resumeGuardRegex = /wasRescued: false,\s*usedUndoThisCase: false,\s*lastAction: null/;
content = content.replace(resumeGuardRegex, `wasRescued: false,
            lethalErrorsThisCase: 0,
            caseStartedAt: Date.now(),
            caseId: ({ event }) => event.case_id || (event.deck[0] ? event.deck[0].card_id.split('_').slice(0, 2).join('_') : 'unknown'),
            pearlId: ({ event }) => event.pearl?.id || null,
            usedUndoThisCase: false,
            lastAction: null`);

// 10. reward state
const rewardStateRegex = /reward: \{\s*on: \{/;
content = content.replace(rewardStateRegex, `reward: {
      entry: [recordCaseResult(({ context }) => computeSuccessOutcome(context.wasRescued, context.mistakesThisCase))],
      on: {`);

// 11. debrief state
const debriefStateRegex = /debrief: \{\s*on: \{/;
content = content.replace(debriefStateRegex, `debrief: {
      entry: [recordCaseResult(() => 'failed')],
      on: {`);

// 12. ghosted state
const ghostedStateRegex = /ghosted: \{\s*on: \{/;
content = content.replace(ghostedStateRegex, `ghosted: {
      entry: [
        assign({
          lethalErrorsThisCase: ({ context }) => context.lethalErrorsThisCase + 1
        })
      ],
      on: {`);

// 13. CONTINUE_SHIFT actions
const continueShiftRegex = /lifelineActive: false,\s*wasRescued: false/;
content = content.replace(continueShiftRegex, `lifelineActive: false,
            wasRescued: false,
            lethalErrorsThisCase: 0,
            caseStartedAt: Date.now(),
            caseId: ({ event }) => event.case_id || (event.deck[0] ? event.deck[0].card_id.split('_').slice(0, 2).join('_') : 'unknown'),
            pearlId: ({ event }) => event.puzzle?.id || null`);


fs.writeFileSync('C:/Users/Admin/Documents/GitHub/Dr_Swipe_Specs/dr-swipe/src/machines/gameMachine.ts', content);
