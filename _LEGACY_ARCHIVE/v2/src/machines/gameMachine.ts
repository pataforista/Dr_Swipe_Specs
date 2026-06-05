import { createMachine, assign } from 'xstate';
import { ClinicalCase, SwipeCard, PerlaENARM } from '../types/clinical';

interface GameContext {
    currentCase: ClinicalCase | null;
    currentIndex: number;
    keptItems: SwipeCard[];
    discardedItems: SwipeCard[];
    stats: {
        correct: number;
        total: number;
        lethalError?: string;
    };
    latestPerla?: PerlaENARM;
}

type GameEvent =
    | { type: 'START_CASE'; caseData: ClinicalCase }
    | { type: 'SWIPE'; direction: 'left' | 'right' }
    | { type: 'SURVIVE' }
    | { type: 'GHOST'; reason: string }
    | { type: 'CLAIM_REWARD'; perla: PerlaENARM }
    | { type: 'COLLECTED' }
    | { type: 'NEXT' }
    | { type: 'RESTART' };

export const gameMachine = createMachine({
    id: 'game',
    initial: 'idle',
    types: {} as {
        context: GameContext;
        events: GameEvent;
    },
    context: {
        currentCase: null,
        currentIndex: 0,
        keptItems: [],
        discardedItems: [],
        stats: {
            correct: 0,
            total: 0,
        },
    },
    states: {
        idle: {
            on: {
                START_CASE: {
                    target: 'intake',
                    actions: assign({
                        currentCase: ({ event }) => event.caseData,
                        currentIndex: 0,
                        keptItems: [],
                        discardedItems: [],
                        stats: { correct: 0, total: 0 },
                        latestPerla: undefined
                    }),
                },
            },
        },
        intake: {
            on: {
                NEXT: 'swiping',
            },
        },
        swiping: {
            always: [
                {
                    target: 'boss_fight',
                    guard: ({ context }) => 
                        !!context.currentCase && context.currentIndex >= context.currentCase.card_stream.length,
                }
            ],
            on: {
                SWIPE: [
                    {
                        target: 'ghosted',
                        guard: ({ context, event }) => {
                            const card = context.currentCase?.card_stream[context.currentIndex];
                            if (!card) return false;
                            const isLethalDiscard = event.direction === 'left' && card.safety_flags?.lethal_if_discarded;
                            const isLethalKeep = event.direction === 'right' && card.expected_action === 'discard' && card.safety_flags?.lethal_risk;
                            return !!(isLethalDiscard || isLethalKeep);
                        },
                        actions: assign({
                           stats: ({ context }) => {
                               const card = context.currentCase?.card_stream[context.currentIndex];
                               return {
                                   ...context.stats,
                                   lethalError: card?.safety_flags?.rationale || 'Decision Fatal'
                               };
                           }
                        })
                    },
                    {
                        actions: assign(({ context, event }) => {
                            const card = context.currentCase!.card_stream[context.currentIndex];
                            const isCorrect = (event.direction === 'right' && card.expected_action === 'keep') ||
                                              (event.direction === 'left' && card.expected_action === 'discard');
                            
                            const newKept = event.direction === 'right' ? [...context.keptItems, card] : context.keptItems;
                            const newDiscarded = event.direction === 'left' ? [...context.discardedItems, card] : context.discardedItems;

                            return {
                                currentIndex: context.currentIndex + 1,
                                keptItems: newKept,
                                discardedItems: newDiscarded,
                                stats: {
                                    ...context.stats,
                                    total: context.stats.total + 1,
                                    correct: context.stats.correct + (isCorrect ? 1 : 0),
                                }
                            };
                        }),
                    }
                ],
            },
        },
        boss_fight: {
            on: {
                SURVIVE: 'results',
                GHOST: {
                    target: 'ghosted',
                    actions: assign({
                        stats: ({ context, event }) => ({
                            ...context.stats,
                            lethalError: event.reason
                        })
                    })
                }
            }
        },
        results: {
            on: {
                CLAIM_REWARD: {
                    target: 'reward',
                    actions: assign({
                        latestPerla: ({ event }) => event.perla
                    })
                },
                RESTART: 'idle'
            }
        },
        reward: {
            on: {
                COLLECTED: 'idle'
            }
        },
        ghosted: {
            on: {
                RESTART: 'idle'
            }
        },
    },
});
