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
import { RetrospectiveView } from './components/RetrospectiveView';

import { FeedbackToast } from './components/overlays/FeedbackToast';
import { RewardToast } from './components/overlays/RewardToast';
import { LootBoxOverlay } from './components/overlays/LootBoxOverlay';
import { PenaltyOverlay } from './components/overlays/PenaltyOverlay';
import { FailProtectionOverlay } from './components/overlays/FailProtectionOverlay';
import { TelemetryHUD } from './components/TelemetryHUD';
import { AvatarFeedback } from './components/AvatarFeedback';

const isSwipeCorrect = (direction: 'left' | 'right', expectedAction: 'keep' | 'discard'): boolean => {
  return (direction === 'right' && expectedAction === 'keep') ||
         (direction === 'left' && expectedAction === 'discard');
};

export function App() {
  const [state, send] = useMachine(gameMachine);
  const { playFeedback, startTriageAlarm, stopTriageAlarm } = useGameAudio();
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const { addXp, addCoins, registerCaseSolved, unlockPearl, updateSwipeResult, incrementSessions, spendCoins, updateDailyStreak, clearSessionProgress, stats, dailyStreak } = useCodexStore();
  const timeLimitRef = useRef<number>(60);
  const pendingDeckRef = useRef<any[]>([]);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('dr_swipe_tutorial_seen'));
  const [showStats, setShowStats] = useState(false);
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

  useEffect(() => {
    if (state.matches('reward') || state.matches('ghosted') || state.matches('debrief')) clearSessionProgress();
  }, [state.value, clearSessionProgress]);

  useEffect(() => {
    let timer: number;
    const isOverlayActive = !!(state.context.activeEvent || state.context.activePenalty || state.context.lootBoxReward);
    if (!isPaused && !isOverlayActive && timeLeft > 0 && (state.matches('triage') || state.matches('urgent_triage'))) {
      if (state.context.isSandiaMode) return;
      timer = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (state.matches('triage') && timeLeft === 0 && !state.context.isSandiaMode) {
      triggerHaptic('timeoutAlarm');
      send({ type: 'TIME_OUT' });
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, send, isPaused]);

  useEffect(() => {
    if (state.matches('reward') && currentCase) {
      const streakMult = getDailyStreakMultiplier(dailyStreak);
      const xpGained = Math.floor(state.context.score * streakMult);
      addXp(xpGained);
      let totalCoins = state.context.coinsEarnedThisCase;
      if (state.context.mistakesThisCase === 0) {
        const bonus = calculatePerfectRoundBonus(state.context.deck.length, state.context.difficulty);
        totalCoins += bonus;
        showToast(`¡GUARDIA PERFECTA! +${bonus} 🪙`, 'milestone');
      }
      addCoins(totalCoins);
      if (totalCoins > 0 && state.context.mistakesThisCase > 0) showToast(`+${totalCoins} 🪙`, 'coins');
      registerCaseSolved(currentCase.case_id, state.context.score);
      const pearl = currentCase.enarm_pearl || (currentCase as any).perla_enarm;
      if (pearl) unlockPearl(pearl);
    }
  }, [state.value, currentCase, dailyStreak, addXp, addCoins, registerCaseSolved, unlockPearl]);

  const startNewCase = async () => {
    setIsPaused(false);
    setIsLoadingCase(true);
    incrementSessions();
    updateDailyStreak();
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
    
    // Update Vazquez Feedback immediately on swipe
    const lastFeedback = state.context.feedbackHistory[state.context.feedbackHistory.length - 1];
    // Note: Since 'send' is async in terms of context update, we might need to wait for the next render
    // or use the 'isCorrect' calculated here.
    setTimeout(() => setSwipeFeedback(null), 1000);
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
      }, 3000);
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
    send({ type: 'CONTINUE_SHIFT', deck: shuffledCards, puzzle: nextCase.enarm_pearl || (nextCase as any).perla_enarm });
  };

  const handleLifeline = () => {
    if (isLoadingCase || isPaused) return;
    if (spendCoins(LIFELINE_COST)) {
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
        <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center p-8 z-[120]">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-10 max-w-md w-full text-center shadow-xl relative bg-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 washi-tape-pink -rotate-1 shadow-sm" />
            <span className="text-[10px] font-bold text-slate-400 uppercase lettering block mt-4 mb-2">EXPEDIENTE MÉDICO 📔</span>
            <h2 className="text-5xl font-black text-slate-800 lettering mb-4">{currentCase.patient_intro.name}</h2>
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border-2 border-dashed border-slate-100 italic lettering text-lg">"{currentCase.patient_intro.arrival_scenario}"</div>
            <button onClick={() => { setShowIntro(false); setTimeLeft(timeLimitRef.current); send({ type: 'START_GUARD', deck: pendingDeckRef.current, difficulty: currentCase.difficulty || 'standard', pearl: currentCase.enarm_pearl as any }); }} className="marker-btn w-full py-5 text-xl group">INICIAR CONSULTA ✨</button>
          </motion.div>
        </div>
      );
    }
    switch (true) {
      case state.matches('idle'):
        return (
          <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center p-8 overflow-hidden z-[120]">
            <div className="text-center mb-10">
              <span className="text-[10px] font-black tracking-widest text-primary uppercase mb-2 block lettering">NOTAS DE ESTUDIO ✨</span>
              <h1 className="text-7xl font-black text-slate-800 lettering drop-shadow-sm">Dr. Swipe</h1>
              <div className="h-2 w-48 washi-tape-pink mx-auto mt-4 rotate-1" />
            </div>
            {dailyStreak > 0 && <div className="flex items-center gap-2 bg-amber-100 px-6 py-2 rounded-2xl mb-10 shadow-sm font-bold text-amber-700 lettering uppercase text-[11px]">🔥 Racha: {dailyStreak} Días</div>}
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button onClick={() => startNewCase()} disabled={isLoadingCase} className="marker-btn py-5 text-xl">{isLoadingCase ? 'PREPARANDO...' : 'EMPEZAR GUARDIA ✨'}</button>
              <button onClick={() => setShowStats(true)} className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase lettering tracking-widest pt-2">Ver mi diario 📔</button>
            </div>
          </div>
        );
      case state.matches('triage') || state.matches('urgent_triage'):
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-sm gap-4 px-4 h-full pt-16 pb-12">
            <div className="relative w-full h-full flex flex-col items-center">
              <SwipeDeck cards={state.context.deck} currentIndex={state.context.currentCardIndex} onSwipe={handleSwipe} isLocked={isLoadingCase || isPaused} lifelineActive={state.context.lifelineActive} canUseLifeline={stats.coins >= LIFELINE_COST && !state.context.lifelineActive} onUseLifeline={handleLifeline} />
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-[110]">
                <button disabled={state.context.undoCharges === 0 || state.context.currentCardIndex === 0} onClick={handleUndo} className="w-12 h-12 rounded-full border-2 border-white bg-secondary/80 flex items-center justify-center text-xl shadow-md disabled:opacity-20 transition-all">⏪</button>
                <span className="text-[9px] font-black text-slate-400 uppercase lettering tracking-tighter">{state.context.undoCharges}/5</span>
              </div>
            </div>
          </div>
        );
      case state.matches('boss_fight'):
        return <ShockRoom questions={currentCase!.boss_fight_triad!.questions} dossierItems={state.context.dossier} onSurvive={() => { stopTriageAlarm(); send({ type: 'ANSWER_CORRECT' }); }} onGhosted={handleBossGhosted} />;
      case state.matches('reward'):
        return (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-10 max-w-md text-center shadow-xl relative">
            <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm font-bold text-4xl">✨</div>
            <h2 className="text-5xl font-black text-slate-800 mb-4 lettering">¡Muy bien!</h2>
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border-2 border-dashed border-slate-100 text-left">
              <div className="flex justify-between mb-4"><span className="text-[10px] uppercase font-bold text-slate-400">Puntos</span><span className="text-3xl font-black text-primary lettering">+{state.context.score}</span></div>
              <div className="flex justify-between"><span className="text-[10px] uppercase font-bold text-slate-400">Monedas</span><span className="text-3xl font-black text-secondary lettering">+{state.context.coinsEarnedThisCase}</span></div>
            </div>
            <button onClick={() => { if (caseQueue.length > 0) handleCaseTransition(); else send({ type: 'RESTART' }); }} className="marker-btn w-full py-5 text-xl">{caseQueue.length > 0 ? `Siguiente Px (${caseQueue.length})` : 'Terminar Turno'}</button>
          </motion.div>
        );
      case state.matches('ghosted'):
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-10 max-w-md text-center shadow-xl relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-400" />
            <div className="text-7xl mb-6 mt-4">💀</div>
            <span className="lettering text-rose-500 font-bold block mb-2 text-[10px] uppercase">Turno Terminado</span>
            <h2 className="text-5xl font-black text-slate-800 mb-4 lettering">Sin más internos</h2>
            <div className="bg-rose-50 p-6 rounded-2xl mb-8 border-2 border-dashed border-rose-100 italic lettering text-lg">
              "{state.context.fatalError || 'El servicio no sobrevivió.'}"
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => send({ type: 'VIEW_DEBRIEF' })} className="marker-btn w-full py-5 text-xl !bg-slate-700">VER NOTAS 📝</button>
              <button onClick={() => send({ type: 'RESTART' })} className="text-[10px] font-bold text-slate-300 hover:text-rose-400 uppercase tracking-widest py-2 transition-all lettering">— Nueva Guardia —</button>
            </div>
          </motion.div>
        );
      case state.matches('debrief'):
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-10 max-w-md text-left shadow-xl relative">
            <div className="mb-6"><span className="bg-rose-500 text-white px-4 py-1 rounded-lg lettering text-xl shadow-sm rotate-[-2deg] inline-block">¡NOTITA! 📝</span></div>
            <div className="bg-rose-50 p-6 rounded-2xl mb-6 border-2 border-dashed border-rose-100 italic lettering text-lg">"{state.context.debriefData?.comment}"</div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-4 lettering">GPC: {state.context.debriefData?.gpc}</p>
            <button onClick={() => send({ type: 'RESTART' })} className="marker-btn w-full py-5 text-lg">Continuar Estudiando ✨</button>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-[#FDFBF7] flex flex-col items-center select-none overflow-hidden text-slate-800 pt-4 ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''} ${swipeFeedback === 'wrong' ? 'shake-lite' : ''}`}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] medical-grid" />
      <TelemetryHUD timeLeft={timeLeft} state={state.value as string} score={state.context.score} combo={state.context.combo} vitality={state.context.vitality} />
      
      {/* Background Avatar Feedback Layer */}
      <div className="fixed top-28 left-0 right-0 z-avatar pointer-events-none flex justify-center">
        <AvatarFeedback 
          doctor="mendoza" 
          expression={vazquezExpression} 
          dialogueText={vazquezDialogue} 
          isVisible={!!vazquezDialogue && (state.matches('triage') || state.matches('urgent_triage'))} 
        />
      </div>

      <div className="w-full flex-grow flex items-center justify-center relative z-10">{renderCurrentView()}</div>
      <AnimatePresence>{showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}</AnimatePresence>
      <AnimatePresence>{showStats && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-sm p-6 overflow-hidden"><StatsDashboard onClose={() => setShowStats(false)} /></div>}</AnimatePresence>
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
            <button onClick={() => send({ type: 'RESTART' })} className="text-[10px] font-bold text-slate-300 uppercase py-2 lettering">ABANDONAR</button>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      <div className="w-full max-w-md text-center opacity-20 py-4"><p className="text-[8px] font-bold tracking-widest uppercase lettering">HGC ARCHIVE · Dr. Swipe Scrapbook</p></div>
    </div>
  );
}

export default App;
