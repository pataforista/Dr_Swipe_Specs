import { motion, AnimatePresence } from 'framer-motion';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { SwipeDeck } from './components/SwipeDeck';
import { ShockRoom } from './components/ShockRoom';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ClinicalCase } from './types/game';
import { dataLoader } from './utils/dataLoader';
import { useGameAudio } from './hooks/useGameAudio';
import { shuffleBossQuestion } from './utils/formatters';
import { triggerHaptic } from './utils/hapticFeedback';
import { calculatePerfectRoundBonus, getDailyStreakMultiplier, calculateCardScore } from './utils/scoringEngine';
import { LIFELINE_COST } from './store/useCodexStore';
import { useCodexStore } from './store/useCodexStore';
import { TutorialOverlay } from './components/TutorialOverlay';
import { StatsDashboard } from './components/StatsDashboard';
import { CodexView } from './components/CodexView';
import { TiendaView } from './components/TiendaView';
import { DailyView } from './components/DailyView';
import { RetrospectiveView } from './components/RetrospectiveView';

import { FeedbackToast } from './components/overlays/FeedbackToast';
import { RewardToast } from './components/overlays/RewardToast';
import { LootBoxOverlay } from './components/overlays/LootBoxOverlay';
import { PenaltyOverlay } from './components/overlays/PenaltyOverlay';
import { FailProtectionOverlay } from './components/overlays/FailProtectionOverlay';
import { TelemetryHUD } from './components/TelemetryHUD';
import { AvatarFeedback } from './components/AvatarFeedback';
import { ReloadPrompt } from './components/overlays/ReloadPrompt';
import { LootScreen } from './components/overlays/LootScreen';
import { EventAlert } from './components/overlays/EventAlert';

const isSwipeCorrect = (direction: 'left' | 'right', expectedAction: 'keep' | 'discard'): boolean => {
  return (direction === 'right' && expectedAction === 'keep') ||
         (direction === 'left' && expectedAction === 'discard');
};

export function App() {
  const [state, send] = useMachine(gameMachine);
  const { playFeedback, stopTriageAlarm } = useGameAudio();
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const { addXp, addCoins, registerCaseSolved, unlockPearl, updateSwipeResult, incrementSessions, spendCoins, updateDailyStreak, saveSessionProgress, clearSessionProgress, sessionProgress, stats, dailyStreak, boosts, consumeBoost, trackMission, refreshDaily } = useCodexStore();
  const [guardBoosts, setGuardBoosts] = useState<{ doubleXp: boolean; doubleCoins: boolean }>({ doubleXp: false, doubleCoins: false });
  const timeLimitRef = useRef<number>(60);
  const pendingDeckRef = useRef<any[]>([]);
  const rewardProcessedRef = useRef(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('dr_swipe_tutorial_seen'));
  const [showStats, setShowStats] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showTienda, setShowTienda] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [showRetro, setShowRetro] = useState(false);
  const [caseQueue, setCaseQueue] = useState<ClinicalCase[]>([]);
  const [rewardToast, setRewardToast] = useState<{ show: boolean; text: string; type: 'coins' | 'xp' | 'milestone' }>({ show: false, text: '', type: 'coins' });
  const [showIntro, setShowIntro] = useState(false);
  const [lastSwipePoints, setLastSwipePoints] = useState<number>(0);
  const [swipeFeedback, setSwipeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [vazquezDialogue, setVazquezDialogue] = useState<string | null>(null);
  const [vazquezExpression, setVazquezExpression] = useState<'neutral' | 'happy' | 'angry' | 'shocked'>('neutral');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => { refreshDaily(); }, [refreshDaily]);

  useEffect(() => {
    if (state.matches('reward') || state.matches('ghosted') || state.matches('debrief')) clearSessionProgress();
  }, [state.value, clearSessionProgress]);

  useEffect(() => {
    let timer: number;
    const isOverlayActive = !!(state.context.activeEvent || state.context.activePenalty || state.context.lootBoxReward || showIntro);
    if (!isPaused && !isOverlayActive && timeLeft > 0 && (state.matches('triage') || state.matches('urgent_triage'))) {
      if (state.context.isSandiaMode) return;
      timer = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (state.matches('triage') && timeLeft === 0 && !state.context.isSandiaMode) {
      triggerHaptic('timeoutAlarm');
      send({ type: 'TIME_OUT' });
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, send, isPaused, showIntro]);

  // AUTO-SAVE SESSION every 3 swipes
  useEffect(() => {
    if (state.matches('triage') && currentCase && state.context.currentCardIndex > 0 && state.context.currentCardIndex % 3 === 0) {
      saveSessionProgress({
        caseId: currentCase.case_id,
        currentCardIndex: state.context.currentCardIndex,
        score: state.context.score,
        combo: state.context.combo,
        multiplier: state.context.multiplier,
        caseStreak: state.context.caseStreak,
        coinsEarnedThisCase: state.context.coinsEarnedThisCase,
        mistakesThisCase: state.context.mistakesThisCase,
        warningCount: state.context.warningCount,
        difficulty: state.context.difficulty,
        savedAt: Date.now()
      });
    }
  }, [state.context.currentCardIndex, state.value, currentCase, saveSessionProgress]);

  useEffect(() => {
    if (!state.matches('reward')) {
      // Reset the guard whenever we leave the reward screen so the NEXT case can grant.
      rewardProcessedRef.current = false;
      return;
    }
    // Process each reward exactly once. handleCaseTransition swaps currentCase while
    // still in 'reward' (before CONTINUE_SHIFT), which would otherwise re-fire this
    // effect and double-grant XP/coins/missions.
    if (!currentCase || rewardProcessedRef.current) return;
    rewardProcessedRef.current = true;

    const streakMult = getDailyStreakMultiplier(dailyStreak);
    const xpGained = Math.floor(state.context.score * streakMult) * (guardBoosts.doubleXp ? 2 : 1);
    addXp(xpGained);
    let totalCoins = state.context.coinsEarnedThisCase;
    if (state.context.mistakesThisCase === 0) {
      const bonus = calculatePerfectRoundBonus(state.context.deck.length, state.context.difficulty);
      totalCoins += bonus;
      showToast(`¡GUARDIA PERFECTA! +${bonus} 🪙`, 'milestone');
    }
    if (guardBoosts.doubleCoins) totalCoins *= 2;
    addCoins(totalCoins);
    if (totalCoins > 0 && state.context.mistakesThisCase > 0) showToast(`+${totalCoins} 🪙`, 'coins');
    registerCaseSolved(currentCase.case_id, state.context.score);
    trackMission('cases', 1);
    if (state.context.mistakesThisCase === 0) trackMission('perfect', 1);
    const pearl = currentCase.enarm_pearl || (currentCase as any).perla_enarm;
    if (pearl) unlockPearl(pearl);
  }, [state.value, currentCase, dailyStreak, guardBoosts, addXp, addCoins, registerCaseSolved, unlockPearl, trackMission]);

  const startNewCase = async () => {
    setIsPaused(false);
    setIsLoadingCase(true);
    incrementSessions();
    updateDailyStreak();
    // Activate any pre-guard power-ups bought in the shop (apply to the whole shift).
    setGuardBoosts({ doubleXp: consumeBoost('doubleXp'), doubleCoins: consumeBoost('doubleCoins') });
    try {
      send({ type: 'RESTART' });
      const numCases = 3;
      const loadedCases: ClinicalCase[] = [];
      for (let i = 0; i < numCases; i++) {
        const caseData = await dataLoader.loadRandomCase();
        if (caseData.boss_fight_triad?.questions) caseData.boss_fight_triad.questions = caseData.boss_fight_triad.questions.map(q => shuffleBossQuestion(q));
        loadedCases.push(caseData);
      }
      const caseData = loadedCases[0];
      setCurrentCase(caseData);
      setCaseQueue(loadedCases.slice(1));
      const timeLimit = Math.max(90, Math.min(180, caseData.card_stream.length * 18));
      const fullDeck = [...caseData.card_stream];
      const shuffledCards = [fullDeck.shift()!, ...fullDeck.sort(() => Math.random() - 0.5)];
      timeLimitRef.current = timeLimit;
      pendingDeckRef.current = shuffledCards;
      setShowIntro(true);
    } catch (err) {
      send({ type: 'RESTART' });
    } finally {
      setIsLoadingCase(false);
    }
  };

  const resumeSession = async () => {
    if (!sessionProgress || !sessionProgress.caseId) return;
    setIsLoadingCase(true);
    try {
      // Find the specific case file
      const caseData = await dataLoader.loadCaseById(sessionProgress.caseId);
      if (caseData.boss_fight_triad?.questions) {
         caseData.boss_fight_triad.questions = caseData.boss_fight_triad.questions.map(q => shuffleBossQuestion(q));
      }
      setCurrentCase(caseData);
      setGuardBoosts({ doubleXp: false, doubleCoins: false }); // resumed guards don't carry shop boosts
      setCaseQueue([]); // Clearing queue for resumed cases to avoid complexity
      
      const fullDeck = [...caseData.card_stream];
      const initialCard = fullDeck.shift()!;
      // Not randomizing on resume to maintain consistency with the saved index
      const resumedDeck = [initialCard, ...fullDeck]; 

      send({ 
        type: 'START_GUARD', 
        deck: resumedDeck, 
        difficulty: sessionProgress.difficulty, 
        pearl: caseData.enarm_pearl as any 
      });

      const timeLimit = Math.max(90, Math.min(180, resumedDeck.length * 18));
      setTimeLeft(timeLimit);
      timeLimitRef.current = timeLimit;
      pendingDeckRef.current = resumedDeck;
      setShowIntro(true);
    } catch (err) {
      console.error("Failed to resume session", err);
      clearSessionProgress();
    } finally {
      setIsLoadingCase(false);
    }
  };

  const showToast = (text: string, type: 'coins' | 'xp' | 'milestone' = 'coins') => {
    setRewardToast({ show: true, text, type });
    setTimeout(() => setRewardToast(prev => ({ ...prev, show: false })), 2500);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isPaused) return;
    const card = state.context.deck[state.context.currentCardIndex];
    if (!card) return;
    const isCorrect = isSwipeCorrect(direction, card.expected_action);
    updateSwipeResult(isCorrect);
    if (isCorrect) trackMission('correct');
    const timeTaken = Date.now() - state.context.lastCardPresentedAt;
    const scoreBreakdown = calculateCardScore(
      card,
      {
        combo: state.context.combo,
        multiplier: state.context.multiplier,
        difficulty: state.context.difficulty,
        dossier: state.context.dossier,
        lastCardPresentedAt: state.context.lastCardPresentedAt,
      },
      isCorrect,
      timeTaken
    );
    setLastSwipePoints(scoreBreakdown.finalPoints);
    setSwipeFeedback(isCorrect ? 'correct' : 'wrong');
    triggerHaptic(isCorrect ? 'criticalSuccess' : 'warning');
    send({ type: 'SWIPE', direction });
    setTimeout(() => setSwipeFeedback(null), 2000);
  };

  useEffect(() => {
    const history = state.context.feedbackHistory;
    if (history.length > 0) {
      const last = history[history.length - 1];
      setVazquezDialogue(last.feedback);
      setVazquezExpression(last.isCorrect ? 'happy' : 'angry');
      
      const timer = setTimeout(() => {
        setVazquezDialogue(null);
        setVazquezExpression('neutral');
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [state.context.feedbackHistory]);

  const handleUndo = () => {
    if (state.context.undoCharges > 0 && state.context.currentCardIndex > 0) {
      send({ type: 'UNDO_SWIPE' });
      triggerHaptic('warning');
    }
  };

  const handleCaseTransition = () => {
    if (caseQueue.length === 0) return send({ type: 'RESTART' });
    const nextCase = caseQueue[0];
    setCurrentCase(nextCase);
    setCaseQueue(caseQueue.slice(1));
    const timeLimit = Math.max(90, Math.min(180, nextCase.card_stream.length * 18));
    const fullDeck = [...nextCase.card_stream];
    const shuffledCards = [fullDeck.shift()!, ...fullDeck.sort(() => Math.random() - 0.5)];
    setTimeLeft(timeLimit);
    timeLimitRef.current = timeLimit;
    pendingDeckRef.current = shuffledCards;
    setShowIntro(true); // Trigger intro card for next patient
  };

  const handleLifeline = () => {
    if (isLoadingCase || isPaused) return;
    // Prefer a free hint (shop boost) before spending coins.
    if (consumeBoost('freeHints') || spendCoins(LIFELINE_COST)) {
      send({ type: 'USE_LIFELINE' });
      triggerHaptic('warning');
    }
  };

  const handleBossGhosted = useCallback((error: string) => {
    stopTriageAlarm();
    playFeedback('wrong');
    send({ type: 'ANSWER_WRONG', error });
  }, [stopTriageAlarm, playFeedback, send]);

  const renderCurrentView = () => {
    if (showIntro && currentCase) {
      return (
        <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center p-4 sm:p-8 z-[120] overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-6 sm:p-10 max-w-md w-full text-center shadow-xl relative bg-white my-auto">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-6 sm:h-8 washi-tape-pink -rotate-1 shadow-sm" />
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase lettering block mt-3 sm:mt-4 mb-1 sm:mb-2">EXPEDIENTE MÉDICO 📔</span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-800 lettering mb-3 sm:mb-4 break-words">{currentCase.patient_intro.name}</h2>
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 border-2 border-dashed border-slate-100 italic lettering text-base sm:text-lg">"{currentCase.patient_intro.arrival_scenario}"</div>
            <button 
              onClick={() => { 
                setShowIntro(false); 
                setTimeLeft(timeLimitRef.current); 
                if (state.matches('idle')) {
                  send({ type: 'START_GUARD', deck: pendingDeckRef.current, difficulty: currentCase.difficulty || 'standard', pearl: currentCase.enarm_pearl as any }); 
                } else {
                  send({ type: 'CONTINUE_SHIFT', deck: pendingDeckRef.current, puzzle: currentCase.enarm_pearl || (currentCase as any).perla_enarm });
                }
              }} 
              className="marker-btn w-full py-4 sm:py-5 text-base sm:text-xl group"
            >
              INICIAR CONSULTA ✨
            </button>
          </motion.div>
        </div>
      );
    }
    switch (true) {
      case state.matches('idle'):
        return (
          <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto z-[120]">
            <div className="text-center mb-6 sm:mb-10">
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-primary uppercase mb-2 block lettering">NOTAS DE ESTUDIO ✨</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-800 lettering drop-shadow-sm">Dr. Swipe</h1>
              <div className="h-2 w-32 sm:w-48 washi-tape-pink mx-auto mt-3 sm:mt-4 rotate-1" />
            </div>
            {dailyStreak > 0 && <button onClick={() => setShowDaily(true)} className="flex items-center gap-2 bg-amber-100 px-4 sm:px-6 py-2 rounded-2xl mb-6 sm:mb-10 shadow-sm font-bold text-amber-700 lettering uppercase text-[10px] sm:text-[11px] hover:bg-amber-200 transition-colors">🔥 Racha: {dailyStreak} Días</button>}
            <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs px-2">
              <button onClick={() => startNewCase()} disabled={isLoadingCase} className="marker-btn py-4 sm:py-5 text-base sm:text-xl group">
                 {isLoadingCase ? 'PREPARANDO...' : 'EMPEZAR GUARDIA ✨'}
                 <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">NUEVA</div>
              </button>
              
              {sessionProgress && (
                <button onClick={() => resumeSession()} disabled={isLoadingCase} className="marker-btn py-4 sm:py-5 text-base sm:text-xl !bg-slate-700 !border-slate-600 shadow-slate-200">
                   REANUDAR GUARDIA 📑
                </button>
              )}

              <button onClick={() => setShowDaily(true)} className="marker-btn py-4 sm:py-5 text-sm sm:text-base !bg-amber-400 !border-amber-400 shadow-amber-100 !text-amber-900">
                 MISIONES DEL DÍA 🗓️
              </button>

              <div className="flex gap-3">
                <button onClick={() => setShowCodex(true)} className="marker-btn flex-1 py-4 sm:py-5 text-sm sm:text-base !bg-secondary !border-secondary shadow-amber-100">
                   CODEX 📖
                </button>
                <button onClick={() => setShowTienda(true)} className="marker-btn flex-1 py-4 sm:py-5 text-sm sm:text-base !bg-secondary !border-secondary shadow-amber-100">
                   TIENDA 🛒
                </button>
              </div>

              <button onClick={() => setShowStats(true)} className="text-[10px] sm:text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase lettering tracking-widest pt-2">Ver mi diario 📔</button>
            </div>
          </div>
        );
      case state.matches('triage') || state.matches('urgent_triage'):
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-sm gap-2 sm:gap-4 px-2 sm:px-4 h-full pt-12 sm:pt-16 pb-8 sm:pb-12">
            <div className="relative w-full h-full flex flex-col items-center">
              <SwipeDeck cards={state.context.deck} currentIndex={state.context.currentCardIndex} onSwipe={handleSwipe} isLocked={isLoadingCase || isPaused} lifelineActive={state.context.lifelineActive} canUseLifeline={(stats.coins >= LIFELINE_COST || (boosts?.freeHints ?? 0) > 0) && !state.context.lifelineActive} freeHint={(boosts?.freeHints ?? 0) > 0} onUseLifeline={handleLifeline} />
              <div className="absolute -bottom-10 sm:-bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-[110]">
                <button disabled={state.context.undoCharges === 0 || state.context.currentCardIndex === 0} onClick={handleUndo} className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-white bg-secondary/80 flex items-center justify-center text-lg sm:text-xl shadow-md disabled:opacity-20 transition-all">⏪</button>
                <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase lettering tracking-tighter">{state.context.undoCharges}/5</span>
              </div>
            </div>
          </div>
        );
      case state.matches('boss_fight'):
        return <ShockRoom questions={currentCase!.boss_fight_triad!.questions} dossierItems={state.context.dossier} onSurvive={() => { stopTriageAlarm(); send({ type: 'ANSWER_CORRECT' }); }} onGhosted={handleBossGhosted} />;
      case state.matches('reward'):
        return (
          <LootScreen 
            score={state.context.score}
            xpTotal={Math.floor(state.context.score * getDailyStreakMultiplier(dailyStreak))}
            coins={state.context.coinsEarnedThisCase}
            isPerfect={state.context.mistakesThisCase === 0}
            onContinue={() => { 
              if (caseQueue.length > 0) handleCaseTransition(); 
              else send({ type: 'RESTART' }); 
            }}
          />
        );
      case state.matches('ghosted'):
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-6 sm:p-10 max-w-md w-full text-center shadow-xl relative mx-4">
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-400" />
            <div className="text-6xl sm:text-7xl mb-4 sm:mb-6 mt-3 sm:mt-4">💀</div>
            <span className="lettering text-rose-500 font-bold block mb-2 text-[9px] sm:text-[10px] uppercase">Turno Terminado</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-3 sm:mb-4 lettering">Sin más internos</h2>
            <div className="bg-rose-50 p-4 sm:p-6 rounded-2xl mb-6 sm:mb-8 border-2 border-dashed border-rose-100 italic lettering text-base sm:text-lg">
              "{state.context.fatalError || 'El servicio no sobrevivió.'}"
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <button onClick={() => send({ type: 'VIEW_DEBRIEF' })} className="marker-btn w-full py-4 sm:py-5 text-base sm:text-xl !bg-slate-700">VER NOTAS 📝</button>
              <button onClick={() => send({ type: 'RESTART' })} className="text-[9px] sm:text-[10px] font-bold text-slate-400 hover:text-rose-400 uppercase tracking-widest py-2 transition-all lettering">— Nueva Guardia —</button>
            </div>
          </motion.div>
        );
      case state.matches('debrief'):
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-6 sm:p-10 max-w-md w-full text-left shadow-xl relative mx-4">
            <div className="mb-4 sm:mb-6"><span className="bg-rose-500 text-white px-3 sm:px-4 py-1 rounded-lg lettering text-base sm:text-xl shadow-sm rotate-[-2deg] inline-block">¡NOTITA! 📝</span></div>
            <div className="bg-rose-50 p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 border-2 border-dashed border-rose-100 italic lettering text-base sm:text-lg">"{state.context.debriefData?.comment}"</div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mb-3 sm:mb-4 lettering">GPC: {state.context.debriefData?.gpc}</p>
            <button onClick={() => send({ type: 'RESTART' })} className="marker-btn w-full py-4 sm:py-5 text-base sm:text-lg">Continuar Estudiando ✨</button>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-[#FDFBF7] flex flex-col items-center select-none overflow-hidden text-slate-800 p-safe-top p-safe-bottom p-safe-left p-safe-right ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''} ${swipeFeedback === 'wrong' ? 'shake-lite' : ''}`}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] medical-grid" />
      <TelemetryHUD 
        timeLeft={timeLeft} 
        state={state.value as string} 
        score={state.context.score} 
        combo={state.context.combo} 
        vitality={state.context.vitality}
        coins={stats.coins}
        lastVitals={state.context.lastVitals}
      />
      
      {/* Background Avatar Feedback Layer */}
      <div className="fixed top-28 left-0 right-0 z-avatar pointer-events-none flex justify-center">
        <AvatarFeedback 
          doctor="vazquez"
          expression={vazquezExpression} 
          dialogueText={vazquezDialogue} 
          isVisible={!!vazquezDialogue && (state.matches('triage') || state.matches('urgent_triage'))} 
        />
      </div>

      <div className="w-full flex-grow flex items-center justify-center relative z-10">{renderCurrentView()}</div>
      <AnimatePresence>{showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}</AnimatePresence>
      <AnimatePresence>{showStats && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-sm p-6 overflow-hidden"><StatsDashboard onClose={() => setShowStats(false)} /></div>}</AnimatePresence>
      <AnimatePresence>{showCodex && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-sm p-4 sm:p-6 overflow-hidden"><CodexView onClose={() => setShowCodex(false)} /></div>}</AnimatePresence>
      <AnimatePresence>{showTienda && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-sm p-4 sm:p-6 overflow-hidden"><TiendaView onClose={() => setShowTienda(false)} /></div>}</AnimatePresence>
      <AnimatePresence>{showDaily && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-sm p-4 sm:p-6 overflow-hidden"><DailyView onClose={() => setShowDaily(false)} /></div>}</AnimatePresence>
      <AnimatePresence mode="wait">{state.context.activeEvent?.item && <EventAlert key={state.context.activeEvent?.item?.id ?? 'event'} event={state.context.activeEvent} onClose={() => send({ type: 'CLEAR_OVERLAYS' })} />}</AnimatePresence>
      <AnimatePresence>{state.context.lootBoxReward?.active && state.context.lootBoxReward.item && <LootBoxOverlay reward={{ active: true, item: state.context.lootBoxReward.item }} onClaim={() => send({ type: 'CLEAR_OVERLAYS' })} />}</AnimatePresence>
      <AnimatePresence>{state.context.activePenalty?.active && <PenaltyOverlay penalty={{ active: true, item: state.context.activePenalty.item }} onAccept={() => send({ type: 'CLEAR_OVERLAYS' })} />}</AnimatePresence>
      <AnimatePresence>{state.matches('fail_protection') && <FailProtectionOverlay error={state.context.fatalError || "Error Clínico"} livesRemaining={state.context.lives} onRescue={() => send({ type: 'RESCUE' })} onRestart={() => send({ type: 'RESTART' })} />}</AnimatePresence>
      {showRetro && <div className="fixed inset-0 z-[150] bg-[#FDFBF7]/90 backdrop-blur-md p-6"><RetrospectiveView history={state.context.feedbackHistory} onClose={() => setShowRetro(false)} /></div>}
      <FeedbackToast result={swipeFeedback} points={lastSwipePoints} />
      <RewardToast toast={rewardToast} />
      <AnimatePresence>{isPaused && state.matches('triage') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="paper-sheet p-10 max-w-xs w-full text-center border-primary/20 shadow-xl relative">
            <p className="text-slate-400 text-sm italic mb-8 lettering leading-relaxed">"Guardia en pausa. Tus notas están seguras."</p>
            <button onClick={() => setIsPaused(false)} className="marker-btn w-full py-4 text-sm mb-4">REANUDAR ✨</button>
            <button onClick={() => send({ type: 'RESTART' })} className="text-[10px] font-bold text-slate-400 uppercase py-2 lettering">ABANDONAR</button>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      <div className="w-full max-w-md text-center opacity-20 py-4"><p className="text-[8px] font-bold tracking-widest uppercase lettering">HGC ARCHIVE · Dr. Swipe Scrapbook</p></div>
      <ReloadPrompt />
    </div>
  );
}

export default App;
