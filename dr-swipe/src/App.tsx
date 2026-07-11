import { motion, AnimatePresence } from 'framer-motion';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { SwipeDeck } from './components/SwipeDeck';
import { ShockRoom } from './components/ShockRoom';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Card, ClinicalCase } from './types/game';
import { dataLoader } from './utils/dataLoader';
import { useGameAudio } from './hooks/useGameAudio';
import { shuffleBossQuestion } from './utils/formatters';
import { triggerHaptic } from './utils/hapticFeedback';
import { calculatePerfectRoundBonus, getDailyStreakMultiplier } from './utils/scoringEngine';
import { safeStorage } from './utils/safeStorage';
import { LIFELINE_COST, UNDO_COST, REVIVE_COST } from './store/useCodexStore';
import { useCodexStore, type SessionProgress } from './store/useCodexStore';
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
import { ReloadPrompt } from './components/overlays/ReloadPrompt';
import { LootScreen } from './components/overlays/LootScreen';
import { EventAlert } from './components/overlays/EventAlert';
import { DoodleButton } from './components/ui/DoodleButton';
import { DoodleToggle } from './components/ui/DoodleToggle';
export function App() {
  const [state, send, actorRef] = useMachine(gameMachine);
  const { playFeedback, playGacha, startTriageAlarm, stopTriageAlarm } = useGameAudio();
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const { addXp, addCoins, registerCaseSolved, unlockPearl, updateSwipeResult, incrementSessions, spendCoins, updateDailyStreak, saveSessionProgress, clearSessionProgress, sessionProgress, stats, dailyStreak, settings = { soundEnabled: true, hapticsEnabled: true }, updateSettings, caseStats } = useCodexStore();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const timeLimitRef = useRef<number>(60);
  const pendingDeckRef = useRef<Card[]>([]);
  // Guards the reward effect: a case must only be paid out once. Without this,
  // setCurrentCase(nextCase) during the `reward` state re-fires the effect and
  // pays XP/coins twice while registering the *next* case as already solved.
  const rewardedCaseRef = useRef<string | null>(null);
  // Holds the saved snapshot between resumeSession() and the intro button.
  const pendingResumeRef = useRef<SessionProgress | null>(null);
  const mentorTimerRef = useRef<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => !safeStorage.getItem('dr_swipe_tutorial_seen'));
  const [showStats, setShowStats] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStudyModeActive, setIsStudyModeActive] = useState(false);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [showRetro, setShowRetro] = useState(false);
  const [caseQueue, setCaseQueue] = useState<ClinicalCase[]>([]);
  const [rewardToast, setRewardToast] = useState<{ show: boolean; text: string; type: 'coins' | 'xp' | 'milestone' }>({ show: false, text: '', type: 'coins' });
  const [showIntro, setShowIntro] = useState(false);
  const [lastSwipePoints, setLastSwipePoints] = useState<number>(0);
  const [swipeFeedback, setSwipeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [mentorDialogue, setMentorDialogue] = useState<string | null>(null);
  const [mentorExpression, setMentorExpression] = useState<'neutral' | 'happy' | 'angry' | 'shocked'>('neutral');
  const [timeLeft, setTimeLeft] = useState(60);

  const showToast = useCallback((text: string, type: 'coins' | 'xp' | 'milestone' = 'coins') => {
    // Deferred a tick: the reward payout effect calls this while React is
    // still committing, and a synchronous setState there cascades renders.
    window.setTimeout(() => setRewardToast({ show: true, text, type }), 0);
    window.setTimeout(() => setRewardToast(prev => ({ ...prev, show: false })), 2500);
  }, []);

  useEffect(() => {
    if (state.matches('reward') || state.matches('ghosted') || state.matches('debrief')) clearSessionProgress();
  }, [state, clearSessionProgress]);

  useEffect(() => {
    let timer: number;
    const isOverlayActive = !!(state.context.activeEvent || state.context.activePenalty || state.context.lootBoxReward || showIntro);
    if (!isPaused && !isOverlayActive && timeLeft > 0 && state.matches('triage')) {
      if (state.context.isSandiaMode) return;
      timer = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (state.matches('triage') && timeLeft === 0 && !state.context.isSandiaMode) {
      triggerHaptic('timeoutAlarm');
      send({ type: 'TIME_OUT' });
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, send, isPaused, showIntro]);

  // Clock-tick alarm during the last 10 seconds of triage
  useEffect(() => {
    if (state.matches('triage') && !isPaused && !showIntro && timeLeft > 0 && timeLeft <= 10 && !state.context.isSandiaMode) {
      startTriageAlarm();
    } else {
      stopTriageAlarm();
    }
  }, [state, timeLeft, isPaused, showIntro, startTriageAlarm, stopTriageAlarm]);

  // Gacha jingle when a loot box appears
  useEffect(() => {
    if (state.context.lootBoxReward?.active) playGacha();
  }, [state.context.lootBoxReward, playGacha]);

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
  }, [state, currentCase, saveSessionProgress]);

  useEffect(() => {
    if (state.matches('reward') && currentCase) {
      if (rewardedCaseRef.current === currentCase.case_id) return; // already paid out
      rewardedCaseRef.current = currentCase.case_id;
      const streakMult = getDailyStreakMultiplier(dailyStreak);
      const xpGained = Math.floor(state.context.score * streakMult);
      addXp(xpGained);
      let totalCoins = state.context.coinsEarnedThisCase;
      const isPerfectRound = state.context.mistakesThisCase === 0 && !state.context.hasRescuedThisCase;
      if (isPerfectRound) {
        const bonus = calculatePerfectRoundBonus(state.context.deck.length, state.context.difficulty);
        totalCoins += bonus;
        showToast(`¡GUARDIA PERFECTA! +${bonus} 🪙`, 'milestone');
      } else if (totalCoins > 0) {
        showToast(`+${totalCoins} 🪙`, 'coins');
      }
      addCoins(totalCoins);
      registerCaseSolved(currentCase.case_id, state.context.score, state.context.mistakesThisCase);
      const pearl = currentCase.enarm_pearl ?? currentCase.perla_enarm;
      if (pearl) unlockPearl(pearl);
    } else if (!state.matches('reward')) {
      rewardedCaseRef.current = null;
    }
  }, [state, currentCase, dailyStreak, addXp, addCoins, registerCaseSolved, unlockPearl, showToast]);

  // Cases without a boss triad (or with 0 questions) skip the ShockRoom instead
  // of crashing on questions[currentStep].
  useEffect(() => {
    if (state.matches('boss_fight') && !(currentCase?.boss_fight_triad?.questions?.length)) {
      send({ type: 'ANSWER_CORRECT' });
    }
  }, [state, currentCase, send]);

  const startNewCase = async (studyMode = false, specialty = 'all') => {
    setIsPaused(false);
    setIsLoadingCase(true);
    setIsStudyModeActive(studyMode);
    incrementSessions();
    updateDailyStreak();
    try {
      send({ type: 'RESTART' });
      const excludeIds = useCodexStore.getState().history.slice(-30);
      const loadedCases = await dataLoader.loadRandomCases(3, specialty, excludeIds);
      for (const c of loadedCases) {
        if (c.boss_fight_triad?.questions) c.boss_fight_triad.questions = c.boss_fight_triad.questions.map(q => shuffleBossQuestion(q));
      }
      const caseData = loadedCases[0];
      setCurrentCase(caseData);
      setCaseQueue(loadedCases.slice(1));
      const timeLimit = Math.max(90, Math.min(180, caseData.card_stream.length * 18));
      timeLimitRef.current = timeLimit;
      // Cards are played in authored order: clinical decks are sequenced
      // (vitals before their interpretation, options A/B/C), so shuffling
      // destroys the narrative.
      pendingDeckRef.current = [...caseData.card_stream];
      setShowIntro(true);
    } catch (err) {
      console.error('Failed to start a new shift:', err);
      showToast('SIN CONEXIÓN: no se pudo cargar la guardia 📡', 'milestone');
      send({ type: 'RESTART' });
    } finally {
      setIsLoadingCase(false);
    }
  };

  const resumeSession = async () => {
    if (!sessionProgress || !sessionProgress.caseId) return;
    setIsLoadingCase(true);
    setIsStudyModeActive(false);
    incrementSessions();
    updateDailyStreak();
    try {
      // Find the specific case file
      const caseData = await dataLoader.loadCaseById(sessionProgress.caseId);
      if (caseData.boss_fight_triad?.questions) {
         caseData.boss_fight_triad.questions = caseData.boss_fight_triad.questions.map(q => shuffleBossQuestion(q));
      }
      setCurrentCase(caseData);
      setCaseQueue([]); // Clearing queue for resumed cases to avoid complexity

      const timeLimit = Math.max(90, Math.min(180, caseData.card_stream.length * 18));
      setTimeLeft(timeLimit);
      timeLimitRef.current = timeLimit;
      // Decks keep their authored order, so the saved currentCardIndex maps to
      // the same card it was saved at.
      pendingDeckRef.current = [...caseData.card_stream];
      pendingResumeRef.current = sessionProgress;
      setShowIntro(true);
    } catch (err) {
      console.error("Failed to resume session", err);
      showToast('No se pudo reanudar la guardia 📡', 'milestone');
      clearSessionProgress();
    } finally {
      setIsLoadingCase(false);
    }
  };

  const startMistakesRepass = async () => {
    const statsObj = useCodexStore.getState().caseStats || {};
    const failedCaseIds = Object.keys(statsObj).filter(id => statsObj[id].mistakes > 0);
    
    if (failedCaseIds.length === 0) {
      showToast("¡No tienes casos fallados para repasar! 🌟", "milestone");
      return;
    }
    
    setIsPaused(false);
    setIsLoadingCase(true);
    setIsStudyModeActive(true); // Study mode default for review
    incrementSessions();
    updateDailyStreak();
    
    try {
      send({ type: 'RESTART' });
      // Pick up to 3 random case IDs from failedCaseIds
      const pool = [...failedCaseIds];
      const n = Math.min(3, pool.length);
      for (let i = 0; i < n; i++) {
        const j = i + Math.floor(Math.random() * (pool.length - i));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const finalIds = pool.slice(0, n);
      
      const loadedCases = await Promise.all(finalIds.map(id => dataLoader.loadCaseById(id)));
      for (const c of loadedCases) {
        if (c.boss_fight_triad?.questions) c.boss_fight_triad.questions = c.boss_fight_triad.questions.map(q => shuffleBossQuestion(q));
      }
      const caseData = loadedCases[0];
      setCurrentCase(caseData);
      setCaseQueue(loadedCases.slice(1));
      const timeLimit = Math.max(90, Math.min(180, caseData.card_stream.length * 18));
      timeLimitRef.current = timeLimit;
      pendingDeckRef.current = [...caseData.card_stream];
      setShowIntro(true);
    } catch (err) {
      console.error('Failed to load review cases:', err);
      showToast('Error al cargar repaso 📡', 'milestone');
      send({ type: 'RESTART' });
    } finally {
      setIsLoadingCase(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isPaused) return;
    const before = actorRef.getSnapshot().context.feedbackHistory.length;
    send({ type: 'SWIPE', direction });
    // The machine processes SWIPE synchronously; read the authoritative result
    // from the actor snapshot instead of re-running the scoring engine here.
    const ctx = actorRef.getSnapshot().context;
    if (ctx.feedbackHistory.length === before) return; // swipe was ignored (no card)
    const last = ctx.feedbackHistory[ctx.feedbackHistory.length - 1];
    updateSwipeResult(last.isCorrect);
    setLastSwipePoints(last.points);
    setSwipeFeedback(last.isCorrect ? 'correct' : 'wrong');
    playFeedback(last.isCorrect ? 'correct' : 'wrong');
    triggerHaptic(last.isCorrect ? 'criticalSuccess' : 'warning');
    setTimeout(() => setSwipeFeedback(null), 2000);
    // Mentor bubble for this swipe
    setMentorDialogue(last.feedback);
    setMentorExpression(last.isCorrect ? 'happy' : 'angry');
    if (mentorTimerRef.current !== null) clearTimeout(mentorTimerRef.current);
    mentorTimerRef.current = window.setTimeout(() => {
      setMentorDialogue(null);
      setMentorExpression('neutral');
      mentorTimerRef.current = null;
    }, 4500);
  };

  useEffect(() => () => {
    if (mentorTimerRef.current !== null) clearTimeout(mentorTimerRef.current);
  }, []);

  // Mirrors the machine's own UNDO_SWIPE guard: with no lastAction snapshot
  // there is nothing to revert, so don't let the paid path spend coins for
  // a swipe that silently no-ops. Also blocked while an event/loot overlay
  // from the swipe being undone is still on screen, so it can't be claimed
  // after the swipe that triggered it has been reverted.
  const canUndo = state.context.currentCardIndex > 0
    && state.context.lastAction !== null
    && !state.context.activeEvent
    && !state.context.activePenalty
    && !state.context.lootBoxReward;

  const handleUndo = () => {
    if (!canUndo) return;
    if (state.context.undoCharges > 0) {
      send({ type: 'UNDO_SWIPE' });
      triggerHaptic('warning');
    } else if (stats.coins >= UNDO_COST && spendCoins(UNDO_COST)) {
      send({ type: 'BUY_UNDO' });
      send({ type: 'UNDO_SWIPE' });
      triggerHaptic('criticalSuccess');
      showToast("+1 Deshacer ⏪", 'coins');
    }
  };

  const handleCaseTransition = () => {
    if (caseQueue.length === 0) return send({ type: 'RESTART' });
    const nextCase = caseQueue[0];
    setCurrentCase(nextCase);
    setCaseQueue(caseQueue.slice(1));
    const timeLimit = Math.max(90, Math.min(180, nextCase.card_stream.length * 18));
    setTimeLeft(timeLimit);
    timeLimitRef.current = timeLimit;
    pendingDeckRef.current = [...nextCase.card_stream];
    setShowIntro(true); // Trigger intro card for next patient
  };

  const handleLifeline = () => {
    if (isLoadingCase || isPaused) return;
    if (spendCoins(LIFELINE_COST)) {
      send({ type: 'USE_LIFELINE' });
      triggerHaptic('warning');
    }
  };

  const handleLootClaim = () => {
    const item = state.context.lootBoxReward?.item;
    if (item?.efecto?.tipo === 'heal') {
      send({ type: 'APPLY_REWARD_HEAL', value: item.efecto.valor ?? 20 });
    } else {
      send({ type: 'CLEAR_OVERLAYS' });
    }
  };

  const handleEventClose = () => {
    const activeEvent = state.context.activeEvent;
    if (activeEvent) {
      if (activeEvent.type === 'archive') {
        addCoins(10);
        showToast("+10 🪙 de archivo", 'coins');
      } else if (activeEvent.type === 'systemic') {
        setTimeLeft(t => Math.max(0, t - 10));
        showToast("-10s: Evento sistémico 🏥", 'milestone');
      } else if (activeEvent.type === 'lab') {
        send({ type: 'USE_LIFELINE' });
        showToast("Pista revelada por laboratorio 🧪", 'milestone');
      }
    }
    send({ type: 'CLEAR_OVERLAYS' });
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
                if (pendingResumeRef.current) {
                  const snapshot = pendingResumeRef.current;
                  pendingResumeRef.current = null;
                  send({
                    type: 'RESUME_GUARD',
                    deck: pendingDeckRef.current,
                    difficulty: snapshot.difficulty,
                    pearl: currentCase.enarm_pearl ?? currentCase.perla_enarm,
                    snapshot: {
                      currentCardIndex: snapshot.currentCardIndex,
                      score: snapshot.score,
                      combo: snapshot.combo,
                      multiplier: snapshot.multiplier,
                      caseStreak: snapshot.caseStreak,
                      coinsEarnedThisCase: snapshot.coinsEarnedThisCase,
                      mistakesThisCase: snapshot.mistakesThisCase,
                      warningCount: snapshot.warningCount,
                    }
                  });
                } else if (state.matches('idle')) {
                  send({ type: 'START_GUARD', deck: pendingDeckRef.current, difficulty: currentCase.difficulty || 'standard', pearl: currentCase.enarm_pearl ?? currentCase.perla_enarm, isSandiaMode: isStudyModeActive });
                } else {
                  send({ type: 'CONTINUE_SHIFT', deck: pendingDeckRef.current, puzzle: currentCase.enarm_pearl ?? currentCase.perla_enarm, isSandiaMode: isStudyModeActive });
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
          <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden z-[120]">
            <div className="text-center mb-6 sm:mb-10">
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-primary uppercase mb-2 block lettering">NOTAS DE ESTUDIO ✨</span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-800 lettering drop-shadow-sm">Dr. Swipe</h1>
              <div className="h-2 w-32 sm:w-48 washi-tape-pink mx-auto mt-3 sm:mt-4 rotate-1" />
            </div>
            {dailyStreak > 0 && <div className="flex items-center gap-2 bg-amber-100 px-4 sm:px-6 py-2 rounded-2xl mb-6 sm:mb-10 shadow-sm font-bold text-amber-700 lettering uppercase text-[10px] sm:text-[11px]">🔥 Racha: {dailyStreak} Días</div>}
            
            {/* Specialty Selector Chips */}
            <div className="mb-6 sm:mb-8 text-center max-w-sm w-full z-20">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 lettering">SELECCIONAR ESPECIALIDAD:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: 'all', label: 'Mixta 🎲' },
                  { id: 'im', label: 'Med. Interna 🩺' },
                  { id: 'ped', label: 'Pediatría 👶' },
                  { id: 'go', label: 'Gineco-Obstetricia 🤰' },
                  { id: 'surg', label: 'Cirugía 🩹' }
                ].map(spec => (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpecialty(spec.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition-all duration-150 active:scale-95 cursor-pointer border-2 ${
                      selectedSpecialty === spec.id
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs px-2 z-10">
              <div className="relative group flex justify-center mt-2 mb-4 w-full">
                <DoodleButton
                  label={isLoadingCase ? 'PREPARANDO' : 'INICIAR GUARDIA'}
                  onClick={() => startNewCase(false, selectedSpecialty)}
                  disabled={isLoadingCase}
                />
                <div className="absolute -top-3 right-0 sm:-right-4 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-md z-20 animate-pulse pointer-events-none">NUEVA</div>
              </div>

              <button onClick={() => startNewCase(true, selectedSpecialty)} disabled={isLoadingCase} className="marker-btn py-4 sm:py-5 text-base sm:text-xl !bg-emerald-600 !border-emerald-500 shadow-emerald-200 group">
                 {isLoadingCase ? 'PREPARANDO...' : 'MODO ESTUDIO 🍉'}
                 <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">SIN DAÑO</div>
              </button>

              {/* Repasar Errores Button */}
              {Object.values(caseStats ?? {}).some(s => s.mistakes > 0) && (
                <button onClick={() => startMistakesRepass()} disabled={isLoadingCase} className="marker-btn py-4 sm:py-5 text-base sm:text-xl !bg-rose-600 !border-rose-500 shadow-rose-200">
                   REPASAR MIS ERRORES 🖍️
                </button>
              )}

              {sessionProgress && (
                <button onClick={() => resumeSession()} disabled={isLoadingCase} className="marker-btn py-4 sm:py-5 text-base sm:text-xl !bg-slate-700 !border-slate-600 shadow-slate-200">
                   REANUDAR GUARDIA 📑
                </button>
              )}

              <div className="flex gap-4 justify-center pt-2">
                <button onClick={() => setShowStats(true)} className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-primary transition-colors uppercase lettering tracking-widest cursor-pointer">Ver mi diario 📔</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => setShowSettings(true)} className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-primary transition-colors uppercase lettering tracking-widest cursor-pointer">Ajustes ⚙️</button>
              </div>
            </div>
          </div>
        );
      case state.matches('triage'):
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-sm gap-2 sm:gap-4 px-2 sm:px-4 h-full pt-12 sm:pt-16 pb-8 sm:pb-12">
            <div className="relative w-full h-full flex flex-col items-center">
              <SwipeDeck cards={state.context.deck} currentIndex={state.context.currentCardIndex} onSwipe={handleSwipe} isLocked={isLoadingCase || isPaused} lifelineActive={state.context.lifelineActive} canUseLifeline={stats.coins >= LIFELINE_COST && !state.context.lifelineActive} onUseLifeline={handleLifeline} />
              <div className="absolute -bottom-10 sm:-bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-[110] pointer-events-auto">
                <button
                  disabled={!canUndo || (state.context.undoCharges === 0 && stats.coins < UNDO_COST)}
                  onClick={handleUndo}
                  className={`w-10 sm:w-12 h-10 sm:h-12 rounded-full border-2 border-white flex items-center justify-center text-lg sm:text-xl shadow-md transition-all active:scale-90 ${
                    state.context.undoCharges === 0
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-secondary/80 hover:bg-secondary'
                  }`}
                  title={state.context.undoCharges === 0 ? `Comprar Deshacer por ${UNDO_COST} 🪙` : "Deshacer"}
                >
                  {state.context.undoCharges === 0 ? '🪙' : '⏪'}
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase lettering tracking-tighter">
                  {state.context.undoCharges === 0 ? `${UNDO_COST} 🪙` : `${state.context.undoCharges}/5`}
                </span>
              </div>
            </div>
          </div>
        );
      case state.matches('boss_fight'):
        if (!currentCase?.boss_fight_triad?.questions?.length) return null; // skipped via effect
        return <ShockRoom questions={currentCase.boss_fight_triad.questions} dossierItems={state.context.dossier} onSurvive={() => { stopTriageAlarm(); send({ type: 'ANSWER_CORRECT' }); }} onGhosted={handleBossGhosted} />;
      case state.matches('reward'):
        return (
          <LootScreen
            score={state.context.score}
            xpTotal={Math.floor(state.context.score * getDailyStreakMultiplier(dailyStreak))}
            coins={state.context.coinsEarnedThisCase}
            isPerfect={state.context.mistakesThisCase === 0 && !state.context.hasRescuedThisCase}
            pearl={currentCase?.enarm_pearl ?? currentCase?.perla_enarm}
            feedbackHistoryCount={state.context.feedbackHistory.length}
            onViewRetro={() => setShowRetro(true)}
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
              {stats.coins >= REVIVE_COST && (
                <button
                  onClick={() => {
                    if (spendCoins(REVIVE_COST)) {
                      setTimeLeft(timeLimitRef.current);
                      send({ type: 'REVIVE_INTERN' });
                      triggerHaptic('criticalSuccess');
                      showToast("Interno contratado 🩺", 'milestone');
                    }
                  }}
                  className="marker-btn w-full py-4 sm:py-5 text-base sm:text-xl !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-500 shadow-emerald-200"
                >
                  CONTRATAR INTERNO 🩺 ({REVIVE_COST} 🪙)
                </button>
              )}
              <button onClick={() => send({ type: 'VIEW_DEBRIEF' })} className="marker-btn w-full py-4 sm:py-5 text-base sm:text-xl !bg-slate-700">VER NOTAS 📝</button>
              <button onClick={() => send({ type: 'RESTART' })} className="text-[9px] sm:text-[10px] font-bold text-slate-500 hover:text-rose-500 uppercase tracking-widest py-2 transition-all lettering">— Nueva Guardia —</button>
            </div>
          </motion.div>
        );
      case state.matches('debrief'):
        return (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="paper-sheet p-6 sm:p-10 max-w-md w-full text-left shadow-xl relative mx-4">
            <div className="mb-4 sm:mb-6">
              <span className="bg-rose-500 text-white px-3 sm:px-4 py-1 rounded-lg lettering text-sm sm:text-base shadow-sm rotate-[-2deg] inline-block">
                PERLA ENARM DE REPASO 📚
              </span>
            </div>
            {state.context.debriefData?.title && (
              <h3 className="text-lg font-black text-slate-800 mb-2 leading-snug">
                {state.context.debriefData.title}
              </h3>
            )}
            <div className="bg-rose-50 p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 border-2 border-dashed border-rose-100 lettering text-xs leading-relaxed text-slate-700">
              {state.context.debriefData?.text || "Revisa las cartas de tu consulta para repasar los conceptos clave."}
            </div>
            {state.context.debriefData?.gpc && (
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 sm:mb-4 lettering">
                GPC: {state.context.debriefData.gpc}
              </p>
            )}
            {state.context.feedbackHistory.length > 0 && (
              <button onClick={() => setShowRetro(true)} className="marker-btn w-full py-3 sm:py-4 text-sm sm:text-base !bg-slate-700 mb-3 sm:mb-4">VER REPASO DE CARTAS 📋</button>
            )}
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
        onPause={() => setIsPaused(true)}
      />

      {/* Background Avatar Feedback Layer */}
      <div className="fixed top-28 left-0 right-0 z-avatar pointer-events-none flex justify-center">
        <AvatarFeedback
          doctor="mendoza"
          expression={mentorExpression}
          dialogueText={mentorDialogue}
          isVisible={!!mentorDialogue && state.matches('triage')}
        />
      </div>

      <div className="w-full flex-grow flex items-center justify-center relative z-10">{renderCurrentView()}</div>
      <AnimatePresence>{showTutorial && <TutorialOverlay onComplete={() => { safeStorage.setItem('dr_swipe_tutorial_seen', '1'); setShowTutorial(false); }} />}</AnimatePresence>
      <AnimatePresence>{showStats && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-sm p-6 overflow-hidden"><StatsDashboard onClose={() => setShowStats(false)} /></div>}</AnimatePresence>
      <AnimatePresence mode="wait">{state.context.activeEvent?.item && <EventAlert key={state.context.activeEvent?.item?.id ?? 'event'} event={state.context.activeEvent} onClose={handleEventClose} />}</AnimatePresence>
      <AnimatePresence>{state.context.lootBoxReward?.active && state.context.lootBoxReward.item && <LootBoxOverlay reward={{ active: true, item: state.context.lootBoxReward.item }} onClaim={handleLootClaim} />}</AnimatePresence>
      <AnimatePresence>{state.context.activePenalty?.active && <PenaltyOverlay penalty={{ active: true, item: state.context.activePenalty.item }} onAccept={() => send({ type: 'CLEAR_OVERLAYS' })} />}</AnimatePresence>
      <AnimatePresence>{state.matches('fail_protection') && (
        <FailProtectionOverlay
          error={state.context.fatalError || "Error Clínico"}
          livesRemaining={state.context.lives}
          onRescue={() => {
            setTimeLeft(timeLimitRef.current);
            send({ type: 'RESCUE' });
          }}
          onRestart={() => send({ type: 'RESTART' })}
        />
      )}</AnimatePresence>
      {showRetro && <div className="fixed inset-0 z-[150] bg-[#FDFBF7]/90 backdrop-blur-md p-6"><RetrospectiveView history={state.context.feedbackHistory} onClose={() => setShowRetro(false)} /></div>}
      <FeedbackToast result={swipeFeedback} points={lastSwipePoints} />
      <RewardToast toast={rewardToast} />
      <AnimatePresence>{isPaused && state.matches('triage') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="paper-sheet p-10 max-w-xs w-full text-center border-primary/20 shadow-xl relative">
            <p className="text-slate-400 text-sm italic mb-8 lettering leading-relaxed">"Guardia en pausa. Tus notas están seguras."</p>
            <button onClick={() => setIsPaused(false)} className="marker-btn w-full py-4 text-sm mb-4">REANUDAR ✨</button>
            <button onClick={() => send({ type: 'RESTART' })} className="text-[10px] font-bold text-slate-500 uppercase py-2 lettering">ABANDONAR</button>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-sm p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="paper-sheet p-8 max-w-sm w-full text-left shadow-2xl relative overflow-hidden bg-white"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 washi-tape-pink -rotate-1 shadow-sm border-x-2 border-white/40 z-20" />
              
              <div className="flex justify-between items-center mb-6 pt-4">
                <span className="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase lettering">AJUSTES ⚙️</span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border-2 border-white shadow-sm text-slate-400 hover:text-rose-400 cursor-pointer"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-5 mb-8">
                {/* Sound Setting */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Efectos de Sonido</span>
                    <span className="text-[9px] text-slate-400">Procedural Audio Synth</span>
                  </div>
                  <DoodleToggle
                    id="sound-toggle"
                    checked={settings.soundEnabled}
                    onChange={(c) => updateSettings({ soundEnabled: c })}
                    label="ON"
                  />
                </div>

                {/* Haptics Setting */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Vibración / Hápticos</span>
                    <span className="text-[9px] text-slate-400">Tactile Haptic Feedback</span>
                  </div>
                  <DoodleToggle
                    id="haptics-toggle"
                    checked={settings.hapticsEnabled}
                    onChange={(c) => updateSettings({ hapticsEnabled: c })}
                    label="ON"
                  />
                </div>

                {/* Replay Tutorial */}
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowTutorial(true);
                  }}
                  className="marker-btn py-3 text-xs w-full"
                >
                  VER TUTORIAL DE NUEVO 📘
                </button>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-3.5 bg-slate-100 border-2 border-white rounded-xl text-[10px] font-black tracking-widest text-slate-500 uppercase hover:bg-slate-200 transition-colors"
              >
                Cerrar Ajustes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-md text-center opacity-20 py-4"><p className="text-[10px] font-bold tracking-widest uppercase lettering">HGC ARCHIVE · Dr. Swipe Scrapbook</p></div>
      <ReloadPrompt />
    </div>
  );
}

export default App;
