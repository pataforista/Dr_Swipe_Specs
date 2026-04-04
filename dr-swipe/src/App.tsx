import { motion, AnimatePresence } from 'framer-motion';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { SwipeDeck } from './components/SwipeDeck';
import { ShockRoom } from './components/ShockRoom';
import { useState, useEffect, useRef } from 'react';
import type { ClinicalCase } from './types/game';
import { dataLoader } from './utils/dataLoader';
import { useGameAudio } from './hooks/useGameAudio';
import { shuffleBossQuestion } from './utils/formatters';
import { triggerHaptic } from './utils/hapticFeedback';
import { calculatePerfectRoundBonus, getDailyStreakMultiplier } from './utils/scoringEngine';
import { LIFELINE_COST } from './store/useCodexStore';
import { useCodexStore } from './store/useCodexStore';
import { TutorialOverlay } from './components/TutorialOverlay';
import { StatsDashboard } from './components/StatsDashboard';
import { RetrospectiveView } from './components/RetrospectiveView';

const isSwipeCorrect = (direction: 'left' | 'right', expectedAction: 'keep' | 'discard'): boolean => {
  return (direction === 'right' && expectedAction === 'keep') ||
         (direction === 'left' && expectedAction === 'discard');
};

const FeedbackToast: React.FC<{ result: 'correct' | 'wrong' | null; points: number }> = ({ result, points }) => {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          className={`fixed bottom-10 right-10 z-[200] px-6 py-4 rounded-3xl shadow-xl border-2 flex items-center gap-4 lettering
            ${result === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}
          `}
        >
          <span className="text-2xl">{result === 'correct' ? '✨' : '🖍️'}</span>
          <span className="uppercase text-lg font-bold tracking-tighter">
            {result === 'correct' ? `+${points} PTS` : `${points} PTS`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RewardToast: React.FC<{ toast: { show: boolean; text: string; type: string } }> = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl shadow-xl border-2 flex items-center gap-4 font-black italic tracking-tighter whitespace-nowrap backdrop-blur-xl
            ${toast.type === 'milestone' ? 'bg-secondary/40 border-secondary/60 text-white sticker-glow' : 'bg-white/90 border-emerald-100 text-primary'}
          `}
        >
          <span className="text-2xl">{toast.type === 'milestone' ? '🏆' : '🪙'}</span>
          <span className="uppercase text-sm tracking-widest">{toast.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const LootBoxOverlay: React.FC<{ 
  reward: { active: boolean; item: any }; 
  onClaim: () => void 
}> = ({ reward, onClaim }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[110] p-6">
      <motion.div
        className="absolute inset-0 bg-[#FDFBF7]/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="paper-sheet p-10 max-w-sm w-full text-center border-primary/20 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 sticker-glow" />
        <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="text-7xl mb-6 inline-block">🎁</motion.div>
        <span className="lettering text-primary font-bold block mb-2 text-[10px] uppercase">Suministros del Dr. Swipe</span>
        <h3 className="text-3xl font-black text-slate-800 mb-6 lettering leading-tight">{reward.item.nombre}</h3>
        <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 relative text-base font-medium text-slate-600 italic leading-relaxed lettering">"{reward.item.texto}"</div>
        <button onClick={onClaim} className="marker-btn w-full py-5 text-lg group">RECIBIR MEJORA ✨</button>
      </motion.div>
    </div>
  );
};

const PenaltyOverlay: React.FC<{ 
  penalty: { active: boolean; item: any }; 
  onAccept: () => void 
}> = ({ penalty, onAccept }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[110] p-6">
      <motion.div className="absolute inset-0 bg-rose-50/90 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div initial={{ scale: 0.8, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="paper-sheet p-10 max-w-sm w-full text-center border-rose-200 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-400 sticker-glow" />
        <span className="lettering text-rose-500 font-bold block mb-2 text-[10px] uppercase">Llamada de atención</span>
        <h3 className="text-3xl font-black text-slate-800 mb-6 lettering leading-tight italic">{penalty.item.nombre}</h3>
        <div className="bg-rose-50 rounded-2xl p-6 mb-8 border border-rose-100 shadow-inner text-base font-medium text-slate-600 italic leading-relaxed lettering">"{penalty.item.texto}"</div>
        <button onClick={onAccept} className="marker-btn w-full py-5 text-base !bg-rose-500 !shadow-rose-100">ENTENDIDO 🖍️</button>
      </motion.div>
    </div>
  );
};

const FailProtectionOverlay: React.FC<{ 
  error: string; 
  livesRemaining: number; 
  onRescue: () => void;
  onRestart: () => void;
}> = ({ error, livesRemaining, onRescue, onRestart }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[110] p-6">
      <motion.div className="absolute inset-0 bg-rose-50/95 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="paper-sheet p-10 max-w-md w-full text-center border-rose-200 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-400 sticker-glow" />
        <div className="text-7xl mb-6">🚑</div>
        <span className="lettering text-rose-500 font-bold block mb-2 text-xs uppercase">Incidente en la Guardia</span>
        <h3 className="text-4xl font-black text-slate-800 mb-6 mt-2 leading-tight lettering tracking-tighter">RELEVO MÉDICO</h3>
        <div className="bg-white p-6 rounded-2xl mb-8 border-2 border-dashed border-rose-100 text-left relative overflow-hidden">
          <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1 lettering">NOTAS DEL DIRECTOR:</p>
          <p className="text-lg font-medium text-slate-600 italic leading-relaxed relative z-10 lettering">"{error}"</p>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          <button onClick={onRescue} className="marker-btn w-full py-6 text-xl flex flex-col items-center justify-center gap-1 group">
            <span className="text-sm font-black uppercase">CAMBIAR DE INTERNO ✨</span>
            <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest">({livesRemaining - 1} DISPONIBLES)</span>
          </button>
          <button onClick={onRestart} className="text-[10px] font-bold text-slate-300 hover:text-rose-400 uppercase tracking-widest py-2 transition-all lettering">— Terminar Turno —</button>
        </div>
      </motion.div>
    </div>
  );
};

const TelemetryHUD: React.FC<{ 
  timeLeft: number; 
  state: string; 
  score: number;
  combo: number;
  vitality: number;
}> = ({ timeLeft, state, score, combo, vitality }) => {
  if (state !== 'triage' && state !== 'boss_fight' && state !== 'urgent_triage') return null;
  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex items-center justify-between p-4 paper-sheet shadow-md border-2 border-white/50 bg-white/60 backdrop-blur-md rounded-2xl mx-1">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] font-black tracking-widest text-primary/60 uppercase leading-none lettering">Puntaje</span>
          <motion.span key={score} animate={{ scale: [1, 1.1, 1] }} className="text-lg font-bold text-slate-700 leading-none lettering">{Math.max(0, score)}</motion.span>
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <div className="flex flex-col gap-0.5 flex-1 max-w-[100px]">
          <span className="text-[8px] font-black tracking-widest text-primary/60 uppercase leading-none lettering">Salud Px</span>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <motion.div animate={{ width: `${vitality}%`, backgroundColor: vitality > 60 ? '#10B981' : vitality > 30 ? '#F59E0B' : '#F43F5E' }} className="h-full transition-all duration-500" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <AnimatePresence>{combo > 1 && <motion.div initial={{ scale: 0, rotate: 10 }} animate={{ scale: 1, rotate: -3 }} exit={{ scale: 0 }} className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest shadow-sm bg-amber-100 text-amber-700 border border-amber-200 lettering">x{combo} ✨</motion.div>}</AnimatePresence>
        {state !== 'boss_fight' && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[8px] font-black tracking-widest text-rose-400 uppercase leading-none lettering">Tiempo</span>
            <span className={`text-lg font-bold leading-none lettering tabular-nums ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`}>{timeLeft}s</span>
          </div>
        )}
      </div>
    </div>
  );
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
  const [swipeFeedback, setSwipeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [lastSwipePoints, setLastSwipePoints] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const isProcessing = false;

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
    setLastSwipePoints(isCorrect ? 50 : -25);
    setSwipeFeedback(isCorrect ? 'correct' : 'wrong');
    triggerHaptic(isCorrect ? 'criticalSuccess' : 'warning');
    send({ type: 'SWIPE', direction });
    setTimeout(() => setSwipeFeedback(null), 1000);
  };

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
    if (isProcessing || isPaused) return;
    if (spendCoins(LIFELINE_COST)) {
      send({ type: 'USE_LIFELINE' });
      triggerHaptic('warning');
    }
  };

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
              <SwipeDeck cards={state.context.deck} currentIndex={state.context.currentCardIndex} onSwipe={handleSwipe} isLocked={isProcessing || isPaused} lifelineActive={state.context.lifelineActive} canUseLifeline={stats.coins >= LIFELINE_COST && !state.context.lifelineActive} onUseLifeline={handleLifeline} />
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-[110]">
                <button disabled={state.context.undoCharges === 0 || state.context.currentCardIndex === 0} onClick={handleUndo} className="w-12 h-12 rounded-full border-2 border-white bg-secondary/80 flex items-center justify-center text-xl shadow-md disabled:opacity-20 transition-all">⏪</button>
                <span className="text-[9px] font-black text-slate-400 uppercase lettering tracking-tighter">{state.context.undoCharges}/5</span>
              </div>
            </div>
          </div>
        );
      case state.matches('boss_fight'):
        return <ShockRoom questions={currentCase!.boss_fight_triad!.questions} dossierItems={state.context.dossier} onSurvive={() => { stopTriageAlarm(); send({ type: 'ANSWER_CORRECT' }); }} onGhosted={(error) => { stopTriageAlarm(); playFeedback('wrong'); send({ type: 'ANSWER_WRONG', error }); }} />;
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
