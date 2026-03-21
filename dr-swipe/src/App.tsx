import { motion, AnimatePresence } from 'framer-motion';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { SwipeDeck } from './components/SwipeDeck';
import { AvatarFeedback } from './components/AvatarFeedback';
import { ShockRoom } from './components/ShockRoom';
import { useState, useEffect, useRef } from 'react';
import type { ClinicalCase } from './types/game';
import { dataLoader } from './utils/dataLoader';
import { useGameAudio } from './hooks/useGameAudio';
import { cleanVazquezComment } from './utils/formatters';
import { triggerHaptic } from './utils/hapticFeedback';
import { calculateCardScore, calculatePerfectRoundBonus, getDailyStreakMultiplier, COMBO_MILESTONE_COINS } from './utils/scoringEngine';
import { LIFELINE_COST } from './store/useCodexStore';
import DecryptedText from './components/bits/DecryptedText';
import ShinyText from './components/bits/ShinyText';
import ErrorBoundary from './components/ErrorBoundary';
import { useCodexStore, type SessionProgress } from './store/useCodexStore';
import { TutorialOverlay } from './components/TutorialOverlay';
import { StatsDashboard } from './components/StatsDashboard';
import { RetrospectiveView } from './components/RetrospectiveView';

const isSwipeCorrect = (direction: 'left' | 'right', expectedAction: 'keep' | 'discard'): boolean => {
  return (direction === 'right' && expectedAction === 'keep') ||
         (direction === 'left' && expectedAction === 'discard');
};

const VAZQUEZ_LINES = [
  { title: "Así que... ¿racha de aciertos?", body: "Déjame complicarte un poco las cosas, doctorcillo." },
  { title: "No te confíes.", body: "El exceso de confianza mata más pacientes que la ignorancia." },
  { title: "¿Crees que ya lo sabes todo?", body: "Los R1 que sonríen así son los primeros en cometer errores fatales." },
  { title: "Impresionante. Para ser estudiante.", body: "Ahora muéstrame que puedes mantenerlo bajo presión real." },
  { title: "Buena racha... de momento.", body: "El siguiente caso no será tan amable contigo." },
  { title: "Noto seguridad en ti.", body: "Recuerda: la medicina te humillará cuando menos lo esperes." },
  { title: "Eso estuvo bien.", body: "Pero en urgencias, el segundo caso siempre es peor que el primero." },
  { title: "¿Cuántas horas llevas despierto?", body: "Porque tus decisiones son demasiado limpias para ser de guardia." },
  { title: "Correcto. Ahora hazlo más rápido.", body: "En el mundo real, el paciente no espera a que pienses." },
  { title: "Vas bien.", body: "Demasiado bien. Algo estás pasando por alto." },
  { title: "La GPC dice una cosa.", body: "El paciente frente a ti puede decir otra. Aprende a distinguir." },
  { title: "Tú y yo sabemos que tuviste suerte.", body: "La próxima vez, no cuentes con eso." },
  { title: "R2 ya te estarías quedando dormido.", body: "¿Puedes sostener esto tres horas más sin equivocarte?" },
  { title: "Diagnóstico correcto.", body: "Pero el tratamiento a tiempo es lo que salva vidas, no el diagnóstico solo." },
];

const VazquezInterruption: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const line = VAZQUEZ_LINES[Math.floor(Math.random() * VAZQUEZ_LINES.length)];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[120] pointer-events-none">
      {/* Backdrop vignette */}
      <motion.div
        className="absolute inset-0 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="glass-panel p-8 max-w-sm border-medical-danger/40 text-center shadow-[0_0_60px_rgba(239,68,68,0.4)] relative"
      >
        {/* Corner accent */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-medical-danger/40" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-medical-danger/40" />

        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-20 h-20 flex items-center justify-center text-5xl mx-auto mb-4 filter drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]"
        >
          👴
        </motion.div>
        <span className="text-[9px] font-black tracking-[0.4em] text-medical-danger/60 uppercase mb-2 block">
          DR. VÁZQUEZ — INTERRUPCIÓN
        </span>
        <h3 className="text-xl font-display font-black text-white mb-3 tracking-tight">
          "{line.title}"
        </h3>
        <p className="text-sm text-slate-300 italic font-medium mb-4 leading-relaxed">
          {line.body}
        </p>
        <div className="h-0.5 w-16 bg-medical-danger/40 mx-auto" />
      </motion.div>
    </div>
  );
};

const TelemetryHUD: React.FC<{ timeLeft: number; state: string }> = ({ timeLeft, state }) => {
  const [pulse, setPulse] = useState(72);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + (Math.random() > 0.5 ? 1 : -1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (state !== 'triage') return null;

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 pointer-events-none z-50 glass-panel p-6 border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-md rounded-3xl">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-2">
        <div className="w-3 h-3 bg-medical-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
        <span className="text-xs font-black tracking-widest text-medical-primary uppercase">MONITOR DE PACIENTE</span>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Presión Arterial</span>
        <div className="text-lg text-slate-200 font-mono font-black">120/80 <span className="text-[10px] text-slate-500">mmHg</span></div>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saturación O2</span>
        <div className="text-lg text-slate-200 font-mono font-black">98% <span className="text-[10px] text-medical-primary">(ESTABLE)</span></div>
      </div>

      <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frecuencia Cardíaca</span>
        <div className="flex items-end gap-1 h-8 opacity-80">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [10, 25, 15, 20, 12] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              className="w-1.5 bg-medical-primary/50 rounded-full"
            />
          ))}
        </div>
        <span className="text-3xl font-black text-medical-primary font-mono mt-1">{pulse} <small className="text-xs text-medical-primary/70 mb-1 inline-block">LPM</small></span>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiempo de Reacción</span>
        <div className="text-xl text-slate-100 font-mono font-black">{timeLeft} <span className="text-[10px] text-slate-500">SEG</span></div>
      </div>
    </div>
  );
};


function App() {
  const [state, send] = useMachine(gameMachine);
  const { playGhosted, startAlarm, stopAlarm } = useGameAudio();
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const { addXp, addCoins, registerCaseSolved, unlockPearl, updateSwipeResult, incrementSessions, spendCoins, updateDailyStreak, saveSessionProgress, clearSessionProgress, stats, dailyStreak, sessionProgress } = useCodexStore();
  // Stores the calculated time limit so timer bar uses consistent denominator
  const timeLimitRef = useRef<number>(60);
  // Stores the precomputed shuffled deck for when intro → START_GUARD
  const pendingDeckRef = useRef<any[]>([]);

  // Tutorial: shown once on first visit
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('dr_swipe_tutorial_seen'));
  // Stats dashboard toggle
  const [showStats, setShowStats] = useState(false);
  // Pause state — managed entirely in App (no machine change needed)
  const [isPaused, setIsPaused] = useState(false);
  // Difficulty override — player can choose from idle screen
  const [selectedDifficulty, setSelectedDifficulty] = useState<'standard' | 'hard' | 'extreme' | null>(null);
  // Combo milestone celebration
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState<number>(0);
  // Loading state for case fetching
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Retrospective view toggle
  const [showRetro, setShowRetro] = useState(false);

  // Dynamic Background Theming
  useEffect(() => {
    if (currentCase) {
      const colors: Record<string, string> = {
        ped: '244, 114, 182',
        surg: '185, 28, 28',
        obs: '139, 92, 246',
        gyn: '168, 85, 247',
        im: '59, 130, 246',
        gast: '234, 179, 8',
        card: '225, 29, 72',
        endo: '249, 115, 22',
        inf: '34, 197, 94',
        neur: '79, 70, 229',
        prev: '20, 184, 166',
        stats: '100, 116, 139',
        engl: '51, 65, 85'
      };
      const key = Object.keys(colors).find(k => currentCase.case_id.toLowerCase().includes(k)) || 'default';
      const rgb = colors[key] || '13, 148, 136';
      document.documentElement.style.setProperty('--specialty-rgb', rgb);
    }
  }, [currentCase]);

  // Auto-save session progress every second during active gameplay
  useEffect(() => {
    const isActiveGame = state.matches('triage') || state.matches('urgent_triage') || state.matches('boss_fight');

    if (isActiveGame && currentCase) {
      const sessionProgress: SessionProgress = {
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
      };
      saveSessionProgress(sessionProgress);
    }
  }, [state.context, state.value, currentCase, saveSessionProgress]);

  // Clear session progress when game ends (reward or ghosted)
  useEffect(() => {
    if (state.matches('reward') || state.matches('ghosted') || state.matches('debrief')) {
      clearSessionProgress();
    }
  }, [state.value, clearSessionProgress]);

  const [showIntro, setShowIntro] = useState(false);
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'angry' | 'shocked'>('neutral');
  const [comment, setComment] = useState<string | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  // Prevents double-swiping during the feedback animation window
  const [isProcessing, setIsProcessing] = useState(false);

  // Time Tense Haptics (Variance)
  useEffect(() => {
    if (!state.matches('triage')) return;
    if (timeLeft === 10 || timeLeft === 5 || timeLeft === 3) {
      triggerHaptic('warning');
    }
  }, [timeLeft, state]);

  useEffect(() => {
    let timer: number;
    if (state.matches('triage') && timeLeft > 0 && !isPaused) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (state.matches('triage') && timeLeft === 0) {
      triggerHaptic('timeoutAlarm');
      send({ type: 'TIME_OUT' });
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, send, isPaused]);

  useEffect(() => {
    if (state.matches('triage') && !state.context.isUrgent) {
      const timer = window.setInterval(() => {
        if (Math.random() < 0.15) { // 15% chance every 15s
          send({ type: 'TRIGGER_URGENCY' });
        }
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [state, send]);

  // QTE Timer countdown
  useEffect(() => {
    if (!state.matches('boss_fight') || !state.context.qteActive) return;

    const timer = window.setInterval(() => {
      send({ type: 'QTE_TIMER_TICK' });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, send]);

  useEffect(() => {
    const isLethal = state.matches('ghosted') || state.matches('debrief');
    if (isLethal) {
      triggerHaptic('lethalError');
    }
  }, [state]);

  // Fix: startAlarm must be a side-effect, not a render call
  useEffect(() => {
    if (state.matches('critical_alert')) {
      startAlarm();
    }
  }, [state.value, startAlarm]);

  // Save persistent progression when a case is won
  useEffect(() => {
    if (state.matches('reward') && currentCase) {
      // Apply daily streak multiplier to XP
      const streakMult = getDailyStreakMultiplier(dailyStreak);
      const xpGained = Math.floor(state.context.score * streakMult);
      addXp(xpGained);

      // Award coins earned during the case
      let totalCoins = state.context.coinsEarnedThisCase;
      // Perfect round bonus
      if (state.context.mistakesThisCase === 0) {
        totalCoins += calculatePerfectRoundBonus(
          state.context.deck.length,
          state.context.difficulty
        );
      }
      addCoins(totalCoins);

      registerCaseSolved(currentCase.case_id, state.context.score);
      const pearl = currentCase.enarm_pearl || (currentCase as any).perla_enarm;
      if (pearl) unlockPearl(pearl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.matches('reward')]);

  const startNewCase = async (skipIntro = false) => {
    // Capture caseStreak before RESTART resets it, so adaptive difficulty works correctly
    const savedStreak = state.context.caseStreak;
    setIsPaused(false);
    setShowMilestoneCelebration(0);
    setLoadError(null);
    setIsLoadingCase(true);
    incrementSessions();
    updateDailyStreak();
    try {
      send({ type: 'RESTART' }); // Reset machine to idle
      const caseData = await dataLoader.loadRandomCase();

      // Validate case has required fields
      if (!caseData.card_stream || caseData.card_stream.length < 1) {
        throw new Error('Caso inválido: no contiene cartas.');
      }
      if (!caseData.patient_intro) {
        throw new Error('Caso inválido: falta información del paciente.');
      }

      // Apply difficulty override if player selected one
      if (selectedDifficulty) {
        (caseData as any).difficulty = selectedDifficulty;
      }
      setCurrentCase(caseData);

      // Adaptive Learning Curve: Time per card decreases as streak increases
      let timePerCard = 15; // R1
      if (savedStreak >= 6) timePerCard = 8; // Adscrito
      else if (savedStreak >= 3) timePerCard = 12; // R2/R3
      const timeLimit = Math.max(60, Math.min(180, caseData.card_stream.length * timePerCard));

      // Shuffle logic: keep first vitals card anchored
      const fullDeck = [...caseData.card_stream];
      const vitals = fullDeck.shift();

      if (!vitals) {
        throw new Error('Caso inválido: primera carta no encontrada.');
      }

      const shuffledCards = [vitals, ...fullDeck.sort(() => Math.random() - 0.5)];

      timeLimitRef.current = timeLimit;
      pendingDeckRef.current = shuffledCards;

      if (skipIntro) {
        setShowIntro(false);
        setTimeLeft(timeLimit);
        setIsProcessing(false);
        send({
          type: 'START_GUARD',
          deck: shuffledCards,
          difficulty: caseData.difficulty || 'standard',
          pearl: (caseData.enarm_pearl || caseData.perla_enarm) as any
        });
      } else {
        setShowIntro(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al cargar caso.';
      console.error('Case loading error:', err);
      setLoadError(errorMsg);
      send({ type: 'RESTART' });
      setCurrentCase(null);
    } finally {
      setIsLoadingCase(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isProcessing || isPaused) return;
    const card = state.context.deck[state.context.currentCardIndex];
    if (!card) return;

    setIsProcessing(true);
    const isCorrect = isSwipeCorrect(direction, card.expected_action);
    updateSwipeResult(isCorrect);

    setSwipeFeedback(isCorrect ? 'correct' : 'wrong');
    setExpression(isCorrect ? 'happy' : 'angry');
    const rawComment = card.scoring.vazquez_comment;
    const cleanComment = cleanVazquezComment(rawComment, isCorrect);
    const feedbackIcon = isCorrect ? "✅ " : "❌ ";
    setComment(cleanComment ? feedbackIcon + cleanComment : null);

    send({ type: 'SWIPE', direction });

    setTimeout(() => {
      setExpression('neutral');
      setComment(null);
      setSwipeFeedback(null);
      setIsProcessing(false);
      send({ type: 'CLEAR_VISUALS' });
    }, 1500);
  };

  // Combo milestone celebration effect
  useEffect(() => {
    const milestone = state.context.comboMilestoneHit;
    if (milestone > 0) {
      setShowMilestoneCelebration(milestone);
      triggerHaptic('qteInteract');
      const timer = setTimeout(() => {
        setShowMilestoneCelebration(0);
        send({ type: 'CLEAR_MILESTONE' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.context.comboMilestoneHit, send]);

  // Handle lifeline purchase
  const handleLifeline = () => {
    if (isProcessing || isPaused) return;
    const success = spendCoins(LIFELINE_COST);
    if (success) {
      send({ type: 'USE_LIFELINE' });
      triggerHaptic('warning');
    }
  };

  const resumeGame = async () => {
    if (!sessionProgress?.caseId) return;

    setLoadError(null);
    setIsLoadingCase(true);
    try {
      const caseData = await dataLoader.loadRandomCase();
      if (caseData.case_id !== sessionProgress.caseId) {
        // If somehow different case, load the exact one
        const exactCase = await dataLoader.loadCase(sessionProgress.caseId);
        setCurrentCase(exactCase);
      } else {
        setCurrentCase(caseData);
      }

      // Restore game state
      send({ type: 'RESTART' });
      setTimeout(() => {
        send({
          type: 'START_GUARD',
          deck: pendingDeckRef.current,
          difficulty: sessionProgress.difficulty || 'standard',
          pearl: (currentCase?.enarm_pearl || currentCase?.perla_enarm) as any
        });
        setTimeLeft(Math.max(5, timeLimitRef.current - Math.floor((Date.now() - sessionProgress.savedAt) / 1000)));
      }, 0);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al reanudar juego.';
      console.error('Resume game error:', err);
      setLoadError(errorMsg);
    } finally {
      setIsLoadingCase(false);
    }
  };

  const renderCurrentView = () => {
    if (showIntro && currentCase) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel p-10 max-w-md text-center border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Decorative Corner Accent */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-medical-primary/10 -translate-x-8 -translate-y-8 rotate-45 border border-medical-primary/30" />
          
          <span className="text-[10px] font-black tracking-[0.4em] text-medical-primary uppercase mb-6 block">BREVIARIO CLÍNICO</span>
          
          <h2 className="text-4xl font-display font-black text-white mb-6 leading-tight tracking-tighter">
            <DecryptedText text={currentCase.patient_intro.name} animateOn="view" speed={30} maxIterations={5} />
          </h2>
          
          <div className="w-12 h-1 bg-medical-primary/30 mx-auto mb-8 rounded-full" />
          
          <p className="text-lg text-slate-300 leading-relaxed mb-10 italic font-medium px-4">
            <DecryptedText text={currentCase.patient_intro.arrival_scenario} animateOn="view" speed={25} maxIterations={1} revealMultiplier={2} />
          </p>
          
          <button
            onClick={() => {
              if (!currentCase) return;
              setShowIntro(false);
              // Use precomputed timeLimit and shuffled deck from startNewCase
              setTimeLeft(timeLimitRef.current);
              setIsProcessing(false);
              send({
                type: 'START_GUARD',
                deck: pendingDeckRef.current,
                difficulty: currentCase.difficulty || 'standard',
                pearl: (currentCase.enarm_pearl || currentCase.perla_enarm) as any
              });
            }}
            className="btn-primary w-full py-5 text-base"
          >
            <ShinyText text="INGRESAR A URGENCIAS" speed={3} />
          </button>
        </motion.div>
      );
    }

    switch (true) {
      case state.matches('idle'):
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-8 gap-6"
          >
            <div className="relative mb-6">
              <h1 className="text-7xl font-display font-black tracking-tighter text-medical-primary text-glow italic">
                <DecryptedText text="DR. SWIPE" animateOn="view" speed={100} />
              </h1>
              <span className="absolute -bottom-4 right-0 text-[10px] font-black tracking-[0.5em] text-white/20 uppercase">MEDICAL TRUTH SYSTEM</span>
            </div>
            {/* Daily Streak Badge */}
            {dailyStreak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-1.5 rounded-full mb-2"
              >
                <span className="text-orange-400 text-sm">🔥</span>
                <span className="text-[10px] font-black text-orange-400 tracking-widest uppercase">
                  RACHA DIARIA: {dailyStreak} {dailyStreak >= 7 ? '(x2.0 XP)' : `(x${getDailyStreakMultiplier(dailyStreak).toFixed(1)} XP)`}
                </span>
              </motion.div>
            )}

            {/* Coin Balance */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-400 text-lg">🪙</span>
              <span className="text-sm font-black text-yellow-400/80 tracking-widest">{stats.coins}</span>
            </div>

            {/* Quick Progress Stats */}
            {stats.cases_solved > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs"
              >
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-display font-black text-medical-primary">{stats.cases_solved}</div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Casos</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-display font-black text-medical-secondary">
                    {stats.correct_swipes + stats.mistakes > 0
                      ? Math.round((stats.correct_swipes / (stats.correct_swipes + stats.mistakes)) * 100)
                      : 0}%
                  </div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Precisión</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-display font-black text-yellow-400">{(stats.xp || 0).toLocaleString()}</div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">XP</div>
                </div>
              </motion.div>
            )}

            {/* Difficulty Selector */}
            <div className="flex gap-2 mb-6">
              {(['standard', 'hard', 'extreme'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    selectedDifficulty === diff
                      ? diff === 'extreme' ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : diff === 'hard' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                      : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                  }`}
                >
                  {diff === 'standard' ? 'Normal' : diff === 'hard' ? 'Difícil' : 'Extremo'}
                </button>
              ))}
            </div>

            {loadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4 text-center max-w-md"
              >
                <p className="text-red-400 text-sm font-medium">⚠️ {loadError}</p>
                <p className="text-red-300/70 text-xs mt-2">Por favor, intenta de nuevo.</p>
              </motion.div>
            )}

            {sessionProgress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4 text-center max-w-md"
              >
                <p className="text-blue-400 text-sm font-medium">💾 Juego interrumpido detectado</p>
                <p className="text-blue-300/70 text-xs mt-1">Hay una partida en progreso. ¿Deseas reanudarla?</p>
                <button
                  onClick={resumeGame}
                  disabled={isLoadingCase}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black px-4 py-2 rounded transition-colors text-sm"
                >
                  Reanudar Partida
                </button>
              </motion.div>
            )}

            <div className="flex gap-3 w-full max-w-xs justify-center">
              <button
                onClick={() => startNewCase(false)}
                disabled={isLoadingCase}
                className={`btn-primary px-12 py-6 text-lg flex-1 ${isLoadingCase ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingCase ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block animate-spin">⟳</span> Cargando...
                  </span>
                ) : (
                  <ShinyText text="NUEVA GUARDIA" speed={3} />
                )}
              </button>
            </div>
            <button
              onClick={() => setShowStats(true)}
              disabled={isLoadingCase}
              className={`text-[10px] font-black tracking-[0.4em] transition-colors uppercase ${
                isLoadingCase ? 'text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-medical-primary'
              }`}
            >
              📊 Ver Estadísticas
            </button>
          </motion.div>
        );

      case state.matches('triage'):
        return (
          <SwipeDeck
            cards={state.context.deck}
            currentIndex={state.context.currentCardIndex}
            onSwipe={handleSwipe}
            isLocked={isProcessing || isPaused}
            lifelineActive={state.context.lifelineActive}
            canUseLifeline={stats.coins >= LIFELINE_COST && !state.context.lifelineActive}
            onUseLifeline={handleLifeline}
          />
        );

      case state.matches('critical_alert'):
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Pulsing background layers */}
            <motion.div
              className="absolute inset-0 bg-medical-danger/15"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border-2 border-medical-danger/20 rounded-full"
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                  style={{ margin: 'auto', width: '80px', height: '80px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                />
              ))}
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-8xl mb-6 filter drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
            >
              🚨
            </motion.div>
            <h2 className="text-5xl font-display font-black text-medical-danger tracking-tighter text-glow-danger">
              CÓDIGO ROJO
            </h2>
            <p className="text-sm font-black tracking-[0.4em] mt-4 text-white/50 uppercase">
              SHOCK ROOM REQUERIDO
            </p>
          </motion.div>
        );

      case state.matches('boss_fight'):
        const hasQuestions = currentCase?.boss_fight_triad?.questions &&
                           Array.isArray(currentCase.boss_fight_triad.questions) &&
                           currentCase.boss_fight_triad.questions.length > 0;

        if (!hasQuestions) {
          return (
            <div className="telemetry-panel w-full max-w-xl h-full flex flex-col items-center justify-center gap-8 relative overflow-hidden bg-black/40">
              {/* Background ECG pulse effect */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d="M 0 50 L 20 50 L 25 30 L 30 70 L 35 50 L 50 50"
                    fill="transparent"
                    stroke="#dc2626"
                    strokeWidth="2"
                    initial={{ pathLength: 0, x: -100 }}
                    animate={{ pathLength: 1, x: 200 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                </svg>
              </div>

              <div className="text-center z-10">
                <h2 className="text-2xl font-black text-white italic tracking-tighter animate-pulse mb-1">PROTOCOLO DE ESTABILIZACIÓN</h2>
                <div className="h-0.5 w-32 bg-medical-danger mx-auto mb-4" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] px-4">Pulsa rítmicamente para mantener el gasto cardíaco</p>
              </div>

              {/* Stabilization Heart/Core */}
              <div className="relative group p-8">
                <div className="absolute inset-0 bg-medical-danger/20 blur-3xl rounded-full animate-pulse group-hover:opacity-40 transition-opacity" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="w-40 h-40 rounded-full border-2 border-medical-danger/40 flex items-center justify-center relative z-10 cursor-pointer active:scale-95 transition-transform bg-black/20"
                  onClick={() => {
                    triggerHaptic('qteInteract');
                    send({ type: 'QTE_INTERACT' });
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">❤️</span>
                    <span className="text-[8px] font-black text-medical-danger mt-4 animate-bounce">PULSAR</span>
                  </div>
                </motion.div>
              </div>

              {/* QTE Timer */}
              <div className="w-full max-w-xs space-y-2 text-center mt-4">
                <div className="text-2xl font-black text-medical-danger font-mono mb-3">
                  {state.context.qteTimeLeft}s
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    animate={{ width: [`${(state.context.qteTimeLeft / 5) * 100}%`] }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-medical-danger shadow-[0_0_10px_#dc2626]"
                  />
                </div>
                <p className="text-[9px] font-black text-white/30 italic tracking-widest uppercase">Mantén el ritmo cardíaco...</p>
              </div>
            </div>
          );
        }
        return (
          <ShockRoom 
            questions={currentCase!.boss_fight_triad!.questions}
            dossierItems={state.context.dossier}
            onSurvive={() => {
              stopAlarm();
              send({ type: 'ANSWER_CORRECT' });
            }}
            onGhosted={(error) => {
              stopAlarm();
              playGhosted();
              send({ type: 'ANSWER_WRONG', error });
            }}
          />
        );

      case state.matches('reward'):
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="glass-panel p-10 max-w-sm text-center border-medical-primary/30 shadow-[0_0_60px_rgba(13,148,136,0.15)] relative overflow-hidden"
          >
            {/* Particle burst on reward */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * 360;
              const rad = (angle * Math.PI) / 180;
              const dist = 80 + Math.random() * 60;
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
                  style={{ backgroundColor: i % 3 === 0 ? '#0d9488' : i % 3 === 1 ? '#14b8a6' : '#fbbf24' }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.02, ease: 'easeOut' }}
                />
              );
            })}
            {/* Subtle shimmer background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-medical-primary/5 to-transparent pointer-events-none"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              className="w-20 h-20 bg-medical-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
            >
              <span className="text-4xl drop-shadow-[0_0_15px_rgba(13,148,136,0.8)]">🏆</span>
            </motion.div>

            {state.context.caseStreak > 1 && (
              <motion.div
                initial={{ y: -15, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-4 inline-block bg-medical-secondary/20 text-medical-secondary px-4 py-1 rounded-full text-[10px] font-black tracking-widest border border-medical-secondary/30 relative z-10"
              >
                🔥 RACHA DE CASOS: x{state.context.caseStreak}
              </motion.div>
            )}

            {/* Retrospective Trigger (Victory) */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setShowRetro(true)}
                className="w-10 h-10 rounded-full bg-medical-primary/10 border border-medical-primary/30 flex items-center justify-center text-xl hover:bg-medical-primary/20 transition-colors"
                title="Ver Retrospectiva"
              >
                 📋
              </button>
            </div>

            <h2 className="text-3xl font-display font-black text-medical-primary mb-2 tracking-tighter uppercase relative z-10">
              MÉRITO ALCANZADO
            </h2>
            <p className="text-slate-400 mb-4 font-medium italic text-sm relative z-10">
              "Se ha estabilizado la situación clínica con precisión empírica."
            </p>

            {/* Perfect Round Badge */}
            {state.context.mistakesThisCase === 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="mb-4 inline-block bg-yellow-500/20 text-yellow-400 px-5 py-2 rounded-full text-xs font-black tracking-widest border border-yellow-500/30 relative z-10"
              >
                ⭐ RONDA PERFECTA — 0 ERRORES ⭐
              </motion.div>
            )}

            {/* Score breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left relative z-10"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">REPORTE DE GUARDIA</span>
                <span className="text-[9px] font-mono text-medical-primary/60">{currentCase?.case_id?.slice(-8) || '---'}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400 uppercase tracking-widest">Puntuación total</span>
                <span className="text-2xl font-display font-black text-medical-primary text-glow">
                  {state.context.score.toLocaleString()}
                </span>
              </div>
              {state.context.multiplier > 1 && (
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Multiplicador combo</span>
                  <span className="text-sm font-black text-medical-secondary">x{state.context.multiplier.toFixed(1)}</span>
                </div>
              )}
              {state.context.combo > 0 && (
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Racha máx. cartas</span>
                  <span className="text-sm font-black text-white/70">{state.context.combo} seguidas</span>
                </div>
              )}
              <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-white/5">
                <span className="text-xs text-yellow-500/80 uppercase tracking-widest">Monedas ganadas</span>
                <span className="text-sm font-black text-yellow-400">
                  🪙 +{state.context.coinsEarnedThisCase + (state.context.mistakesThisCase === 0 ? calculatePerfectRoundBonus(state.context.deck.length, state.context.difficulty) : 0)}
                </span>
              </div>
              {dailyStreak > 1 && (
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-orange-500/80 uppercase tracking-widest">Bonus racha diaria</span>
                  <span className="text-sm font-black text-orange-400">x{getDailyStreakMultiplier(dailyStreak).toFixed(1)} XP</span>
                </div>
              )}
            </motion.div>

            <div className="flex flex-col gap-4 relative z-10">
              <button
                onClick={() => startNewCase(true)}
                className="btn-primary w-full py-5 !bg-medical-primary hover:!bg-teal-600 group"
              >
                <div className="flex items-center justify-center gap-2">
                  <ShinyText text="SIGUIENTE CASO" speed={3} />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </button>
              <button
                onClick={() => setShowRetro(true)}
                className="btn-primary w-full py-4 !bg-white/5 border-white/10 hover:!bg-white/10 !text-slate-300"
              >
                ANÁLISIS DE GUARDIA (RETRO)
              </button>
              <button
                onClick={() => send({ type: 'CLAIM' })}
                className="text-[10px] font-black tracking-[0.4em] text-slate-500 hover:text-white transition-colors uppercase"
              >
                Registrar y Salir
              </button>
            </div>
          </motion.div>
        );

      case state.matches('critical_warning'):
        return (
          <div className="fixed inset-0 bg-red-600/20 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-pulse">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-5xl font-display font-black text-white text-glow-danger uppercase tracking-tighter">ADVERTENCIA CRÍTICA</h2>
            <p className="text-lg text-white/80 mt-4 px-12 text-center font-bold italic">
              {state.context.fatalError}
            </p>
            <p className="mt-8 text-[10px] text-white/40 tracking-[0.5em] font-black uppercase">REINTENTANDO ESTABILIZACIÓN...</p>
          </div>
        );

      case state.matches('ghosted'):
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center p-12 text-center relative"
          >
            {/* Ambient danger glow */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.15) 0%, transparent 70%)' }}
            />

            <div className="relative mb-6">
              <motion.h2
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-6xl font-display font-black text-medical-danger text-glow-danger italic tracking-tighter relative z-10"
              >
                GHOSTED
              </motion.h2>
              <div className="absolute top-0 left-0 w-full h-full bg-medical-danger opacity-20 animate-pulse blur-2xl" />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-6 border-medical-danger/20 mb-8 max-w-xs bg-medical-danger/5 relative z-10"
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-medical-danger inline-block"
                />
                <p className="text-sm font-mono text-medical-danger uppercase tracking-[0.2em] font-black">FALLO SISTÉMICO</p>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed text-sm">
                {state.context.fatalError || "Negligencia o fallo preventivo en el triage."}
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-4 relative z-10"
            >
              <button
                onClick={() => send({ type: 'VIEW_DEBRIEF' })}
                className="btn-primary px-8 py-4 text-xs !rounded-xl !bg-medical-danger hover:!bg-red-700"
              >
                <ShinyText text="ANÁLISIS DE FALLO (RETRO)" speed={3} />
              </button>
              <button
                onClick={() => send({ type: 'RESTART' })}
                className="text-[10px] font-black tracking-[0.4em] text-slate-500 hover:text-white transition-colors uppercase border-b border-white/5 pb-1"
              >
                Cerrar Expediente
              </button>
            </motion.div>
          </motion.div>
        );

      case state.matches('debrief'):
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="cyber-panel p-8 max-w-sm text-left bg-black/80"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="telemetry-text text-[9px] text-medical-danger font-black tracking-[0.4em] uppercase">
                ERROR_TYPE: {state.context.debriefData?.title.toUpperCase().replace(' ', '_')}
              </span>
              <span className="text-[8px] font-mono text-white/20">CASE ID: {currentCase?.case_id || 'UNKNOWN'}</span>
            </div>

            <div className="mb-6 p-4 bg-medical-danger/10 border-l-4 border-medical-danger">
              <p className="text-xs text-medical-danger font-mono font-black mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-medical-danger rounded-full animate-ping" />
                VÁZQUEZ_LOG_REPORT:
              </p>
              <p className="text-sm text-slate-100 italic font-medium leading-relaxed">
                "{state.context.debriefData?.comment}"
              </p>
            </div>

            <div className="mb-6">
              <div className="text-[9px] text-white/40 mb-2 font-mono uppercase tracking-widest">Diagnostic_Correction:</div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {state.context.debriefData?.text}
              </p>
            </div>

            <div className="flex items-center justify-between mb-8 opacity-60">
              <span className="text-[9px] font-mono text-medical-primary">GPC_SOURCE: {state.context.debriefData?.gpc}</span>
              <div className="flex gap-1">
                <div className="w-1 h-3 bg-medical-primary/20" />
                <div className="w-1 h-3 bg-medical-primary/40" />
                <div className="w-1 h-3 bg-medical-primary/60" />
              </div>
            </div>

            <button
               onClick={() => setShowRetro(true)}
               className="btn-primary w-full py-4 mb-4 !bg-medical-danger/20 border-medical-danger/40 !text-red-200"
            >
              VER HISTORIAL COMPLETO
            </button>

            <button 
              onClick={() => send({ type: 'RESTART' })} 
              className="btn-primary w-full py-4 !rounded-none !bg-medical-danger hover:!bg-red-700 text-xs tracking-widest border-t border-b border-white/20"
            >
              TERMINAR_REPORTE // VOLVER_A_GUARDIA
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-[#070b14] flex flex-col items-center safe-top safe-bottom select-none overflow-hidden text-slate-100 crt-screen 
      ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''} 
      ${swipeFeedback === 'wrong' ? 'shake-lite' : ''}
      ${state.context.combo >= 15 ? 'combo-glow-3' : (state.context.combo >= 10 ? 'combo-glow-2' : (state.context.combo >= 5 ? 'combo-glow-1' : ''))}
      ${state.context.showBloodVignette ? 'blood-vignette' : ''}
    `}>
      {/* Glitch Overlay (Urgency) */}
      {state.context.isUrgent && <div className="fixed inset-0 z-[100] glitch-overlay pointer-events-none" />}

      <TelemetryHUD timeLeft={timeLeft} state={state.value as string} />

      {/* Lethal Error Red Flash */}
      <AnimatePresence>
        {state.context.showBloodVignette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.5, 0.3, 0.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 bg-medical-danger pointer-events-none z-[110]"
          />
        )}
      </AnimatePresence>

      {/* Vazquez Interruption */}
      <AnimatePresence>
        {state.context.interruptionActive && (
          <VazquezInterruption onDismiss={() => send({ type: 'RESOLVE_INTERRUPTION' })} />
        )}
      </AnimatePresence>

      {/* Swipe Feedback Flash - Short burst */}
      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-0 pointer-events-none ${swipeFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}
          />
        )}
      </AnimatePresence>

      {/* Combo Milestone Celebration */}
      <AnimatePresence>
        {showMilestoneCelebration > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.3, y: -60 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[70] pointer-events-none flex flex-col items-center gap-2"
          >
            {/* Expanding rings behind text */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute w-24 h-24 rounded-full border-2 border-yellow-400/40"
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 3 + i, opacity: 0 }}
                transition={{ duration: 0.9, delay: i * 0.18, ease: 'easeOut' }}
              />
            ))}
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="text-5xl font-display font-black text-yellow-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] tracking-tighter relative"
            >
              {showMilestoneCelebration >= 20 ? '🏅 LEYENDA' : showMilestoneCelebration >= 15 ? '💎 MAESTRO' : showMilestoneCelebration >= 10 ? '🔥 IMPARABLE' : '⚡ EN RACHA'}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-black text-yellow-300/90 tracking-widest"
            >
              COMBO x{showMilestoneCelebration} — +{COMBO_MILESTONE_COINS[showMilestoneCelebration as keyof typeof COMBO_MILESTONE_COINS]} 🪙
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Status Label - Subtle and brief */}
      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex flex-col items-center gap-2"
          >
            <span className={`text-3xl font-display font-black uppercase tracking-[0.1em] ${swipeFeedback === 'correct' ? 'text-green-300' : 'text-red-300'} drop-shadow-lg`}>
              {swipeFeedback === 'correct' ? 'CORRECTO' : 'FALLO'}
            </span>
            {swipeFeedback === 'correct' && (Date.now() - state.context.lastCardPresentedAt < 1200) && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="perfect-swipe-text"
              >
                ⚡ ¡PERFECTO! +20% ⚡
              </motion.span>
            )}
            {state.context.showEureka && (
              <motion.span 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: [0, 1.5, 1], rotate: 0 }}
                className="text-yellow-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] mt-2"
              >
                💡 COMBO DE CLARIDAD x2 💡
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Red-Out Vignette Effect - Reduced intensity */}
      {timeLeft <= 15 && state.matches('triage') && (
        <div
          className="red-out-overlay fixed inset-0"
          style={{ opacity: (1 - (timeLeft / 15)) * 0.8 }}
        />
      )}
      
      {/* HUD */}
      <div className="w-full max-w-md flex justify-between items-start px-8 py-10 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mb-1">XP ACUMULADO</span>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={state.context.score}
              initial={{ scale: 1.35, color: '#14b8a6' }}
              animate={{ scale: 1, color: '#0d9488' }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              className="text-3xl font-display font-black text-glow tracking-tighter"
            >
              {state.context.score}
            </motion.span>
            {state.context.multiplier > 1 && (
              <motion.span
                key={state.context.multiplier}
                initial={{ scale: 1.4, x: -6, opacity: 0 }}
                animate={{ scale: 1, x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="text-[10px] font-black text-medical-secondary bg-medical-secondary/10 px-2 py-0.5 rounded-full border border-medical-secondary/20 uppercase"
              >
                x{state.context.multiplier.toFixed(1)}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400 text-xs">🪙</span>
            <span className="text-[10px] font-black text-yellow-400/70 tracking-widest">{stats.coins}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="h-12 w-12 glass-panel !rounded-2xl flex items-center justify-center font-black text-sm border-white/20 shadow-lg scale-110">
            {state.context.caseStreak >= 6 ? 'ADSC' : (state.context.caseStreak >= 4 ? 'R3' : (state.context.caseStreak >= 2 ? 'R2' : 'R1'))}
          </div>
          {state.matches('triage') && state.context.deck.length > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">CARTAS</span>
              <span className="text-lg font-display font-black text-slate-300">
                {state.context.currentCardIndex + 1}
                <span className="text-slate-600">/{state.context.deck.length}</span>
              </span>
            </div>
          )}
          {state.context.combo > 1 && (
            <motion.div
              key={state.context.combo}
              initial={{ scale: 1.6, y: -15, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 16 }}
              className="flex flex-col items-end"
            >
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">STREAK</span>
              <span className={`text-2xl font-display font-black italic drop-shadow-[0_0_12px_rgba(13,148,136,0.6)] ${
                state.context.combo >= 15 ? 'text-yellow-400' : state.context.combo >= 10 ? 'text-orange-400' : 'text-medical-primary'
              }`}>
                {state.context.combo}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Timer Bar */}
      {state.matches('triage') && currentCase && (
        <div className="w-full max-w-sm px-8 -mt-2 mb-4 z-50">
          <div className={`w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner flex mb-1 transition-all ${timeLeft <= 10 ? 'timer-critical' : ''}`}>
            <motion.div
              className={`h-full flex-grow ${timeLeft <= 10 ? 'bg-medical-danger' : 'bg-medical-secondary'}`}
              initial={{ width: '100%' }}
              animate={{
                width: `${(timeLeft / timeLimitRef.current) * 100}%`,
                boxShadow: timeLeft <= 10
                  ? ['0 0 8px rgba(239,68,68,0.6)', '0 0 16px rgba(239,68,68,0.9)', '0 0 8px rgba(239,68,68,0.6)']
                  : '0 0 4px rgba(20,184,166,0.3)'
              }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{ originX: 0 }}
            />
          </div>
          <div className="flex justify-between items-center w-full">
            <span className={`text-[10px] uppercase font-black tracking-widest ${timeLeft <= 10 ? 'text-medical-danger animate-pulse' : 'text-slate-500'}`}>
              TIEMPO DE RESPUESTA
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/80 font-mono font-black">{timeLeft}s</span>
              <button
                onClick={() => setIsPaused(p => !p)}
                className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                aria-label={isPaused ? 'Reanudar' : 'Pausar'}
              >
                {isPaused ? '▶ REANUDAR' : '⏸ PAUSA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Feedback Area */}
      <div className="w-full h-40 flex justify-center -mt-8 pointer-events-none">
        <ErrorBoundary fallback={<div className="h-40 flex items-center justify-center text-red-400 font-bold bg-red-400/10 rounded-xl border border-red-400/20 px-8">Error en Feedback del Mentor</div>}>
          <AvatarFeedback 
            doctor={currentCase ? (currentCase.case_id.toLowerCase().includes('ped') ? 'castillo' : (currentCase.case_id.toLowerCase().includes('surg') ? 'mendoza' : 'navarro')) : 'navarro'} 
            expression={expression} 
            dialogueText={comment}
            isVisible={!state.matches('idle') || showIntro}
          />
        </ErrorBoundary>
      </div>

      {/* Tactical Dossier (Dossier Médico) */}
      {!state.matches('idle') && (
        <div className="fixed right-4 top-1/4 bottom-1/4 w-32 hidden lg:flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar pointer-events-none opacity-60 hover:opacity-100 transition-opacity z-10">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">Dossier</span>
          <AnimatePresence>
            {state.context.dossier.map((card, idx) => (
              <motion.div 
                key={`${card.card_id}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 rounded bg-slate-900/40 border border-slate-800/50 text-[9px] flex flex-col gap-1 ${state.context.showEureka && idx >= state.context.dossier.length - 3 ? 'eureka-glow ring-1 ring-yellow-400/50' : ''}`}
              >
                <span className="text-slate-400 font-bold">{card.category}</span>
                <span className="text-slate-200 line-clamp-2">{card.card_text}</span>
              </motion.div>
            )).reverse()}
          </AnimatePresence>
        </div>
      )}

      {/* Content Area */}
      <div className="w-full flex-grow flex items-center justify-center">
        {renderCurrentView()}
      </div>

      {/* Footer */}
      {!state.matches('boss_fight') && (
        <div className="w-full max-w-md text-center opacity-30 py-8">
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase">
            HGC ARCHIVE · Dr. Swipe v3
          </p>
        </div>
      )}

      {/* Tutorial overlay — first launch only */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay
            onComplete={() => {
              localStorage.setItem('dr_swipe_tutorial_seen', '1');
              setShowTutorial(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Stats dashboard — accessible from idle */}
      <AnimatePresence>
        {showStats && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
            <StatsDashboard onClose={() => setShowStats(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Retrospective Modal */}
      <AnimatePresence>
        {showRetro && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <RetrospectiveView 
              history={state.context.feedbackHistory} 
              onClose={() => setShowRetro(false)}
              caseId={currentCase?.case_id}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Pause overlay */}
      <AnimatePresence>
        {isPaused && state.matches('triage') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-10 max-w-xs w-full text-center border-white/20 shadow-2xl"
            >
              <span className="text-[9px] font-black tracking-[0.4em] text-medical-primary uppercase block mb-4">GUARDIA EN PAUSA</span>
              <p className="text-4xl mb-6">⏸</p>
              <p className="text-slate-400 text-sm font-medium mb-8">El tiempo está detenido. El paciente espera.</p>
              <button
                onClick={() => setIsPaused(false)}
                className="btn-primary w-full py-4"
              >
                REANUDAR GUARDIA
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
