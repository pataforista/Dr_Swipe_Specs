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
import { calculatePerfectRoundBonus, getDailyStreakMultiplier, COMBO_MILESTONE_COINS } from './utils/scoringEngine';
import { LIFELINE_COST } from './store/useCodexStore';
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
        className="glass-panel p-8 max-w-sm border-moomin-accent/40 text-center shadow-[0_15px_45px_rgba(255,159,127,0.2)] relative bg-white/90"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-24 h-24 flex items-center justify-center text-6xl mx-auto mb-4 filter drop-shadow-[0_8px_16px_rgba(92,64,51,0.1)]"
        >
          👴
        </motion.div>
        <span className="text-[10px] font-black tracking-[0.4em] text-moomin-accent uppercase mb-2 block">
          DR. VÁZQUEZ — INTERRUPCIÓN
        </span>
        <h3 className="text-xl font-display font-black text-moomin-text mb-3 tracking-tight">
          "{line.title}"
        </h3>
        <p className="text-sm text-moomin-muted italic font-medium mb-4 leading-relaxed">
          {line.body}
        </p>
        <div className="h-1 w-12 bg-moomin-accent/20 mx-auto rounded-full" />
      </motion.div>
    </div>
  );
};

const TelemetryHUD: React.FC<{ timeLeft: number; state: string; evidenceCount: number }> = ({ timeLeft, state, evidenceCount }) => {
  const [pulse, setPulse] = useState(72);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + (Math.random() > 0.5 ? 2 : -2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (state !== 'triage' && state !== 'boss_fight') return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between glass-panel p-3 px-6 border-moomin-text/10 shadow-lg bg-white/80 backdrop-blur-md rounded-full">
      {/* Evidence Counter */}
      <div className="flex items-center gap-2">
        <span className="text-xl">💼</span>
        <div className="flex flex-col">
          <span className="text-[8px] font-black tracking-widest text-moomin-muted uppercase leading-none">Evidencia</span>
          <span className="text-sm font-black text-moomin-text leading-none">{evidenceCount}</span>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right">
          <span className="text-[8px] font-black tracking-widest text-moomin-muted uppercase leading-none">Tiempo</span>
          <span className={`text-xl font-mono font-black leading-none ${timeLeft <= 10 ? 'text-moomin-accent animate-pulse' : 'text-moomin-text'}`}>
            0:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
        <div className={`w-3 h-3 rounded-full shadow-inner ${timeLeft <= 10 ? 'bg-moomin-accent animate-ping' : 'bg-moomin-primary'}`} />
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

  // Dynamic Background Theming — Softer Moomin-inspired palette
  useEffect(() => {
    if (currentCase) {
      const colors: Record<string, string> = {
        ped: '255, 182, 193', // Moomin Secondary (Pink)
        surg: '255, 159, 127', // Moomin Accent (Coral)
        obs: '176, 229, 216',  // Moomin Tertiary (Soft Green)
        gyn: '200, 162, 200',  // Lilac
        im: '135, 206, 235',   // Moomin Primary (Sky Blue)
        gast: '255, 223, 186', // Peach
        card: '255, 127, 127', // Soft Red
        endo: '255, 218, 185', // Papaya Whip
        inf: '152, 216, 200',  // Seafoam
        neur: '230, 230, 250', // Lavender
        prev: '175, 238, 238', // Pale Turquoise
        stats: '245, 230, 211', // Moomin Dark BG
        engl: '240, 248, 255'  // Alice Blue
      };
      const key = Object.keys(colors).find(k => currentCase.case_id.toLowerCase().includes(k)) || 'default';
      const rgb = colors[key] || '135, 206, 235';
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
    setIsPaused(true); // Pausar tiempo durante feedback
    
    const isCorrect = isSwipeCorrect(direction, card.expected_action);
    updateSwipeResult(isCorrect);

    setSwipeFeedback(isCorrect ? 'correct' : 'wrong');
    setExpression(isCorrect ? 'happy' : 'angry');
    const rawComment = card.scoring.vazquez_comment;
    const cleanComment = cleanVazquezComment(rawComment, isCorrect);
    const feedbackIcon = isCorrect ? "✨ " : "⚠️ ";
    setComment(cleanComment ? feedbackIcon + cleanComment : null);

    send({ type: 'SWIPE', direction });

    setTimeout(() => {
      setExpression('neutral');
      setComment(null);
      setSwipeFeedback(null);
      setIsProcessing(false);
      setIsPaused(false); // Reanudar tiempo
      send({ type: 'CLEAR_VISUALS' });
    }, 1800); // 1.8s para dar tiempo a leer tranquilamente
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
      const difficultyLabel = currentCase.difficulty === 'extreme' ? 'EXTREMO' : currentCase.difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL';
      const difficultyColor = currentCase.difficulty === 'extreme' ? 'text-moomin-accent border-moomin-accent/20 bg-moomin-accent/5' : currentCase.difficulty === 'hard' ? 'text-orange-400 border-orange-200 bg-orange-50' : 'text-moomin-primary border-moomin-primary/20 bg-moomin-primary/5';
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel p-8 max-w-md w-full text-center border-moomin-text/5 shadow-2xl relative overflow-hidden mx-4 bg-white/95"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black tracking-[0.4em] text-moomin-primary uppercase">NUEVO CASO</span>
            <span className={`text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full border ${difficultyColor}`}>
              {difficultyLabel}
            </span>
          </div>

          {/* Patient Name */}
          <h2 className="text-4xl font-display font-black text-moomin-text mb-4 leading-tight tracking-tighter">
            {currentCase.patient_intro.name}
          </h2>

          <div className="w-16 h-1.5 bg-moomin-primary/20 mx-auto mb-6 rounded-full" />

          {/* Lore / Arrival Scenario */}
          <div className="bg-moomin-bg/50 border border-moomin-text/5 rounded-3xl p-6 mb-8 text-left shadow-inner">
            <span className="text-[10px] font-black tracking-[0.3em] text-moomin-muted uppercase block mb-3">HISTORIA CLÍNICA</span>
            <p className="text-base text-moomin-text leading-relaxed italic font-medium">
              {currentCase.patient_intro.arrival_scenario}
            </p>
          </div>

          {/* Time limit hint */}
          <p className="text-[10px] text-moomin-muted font-black tracking-[0.2em] uppercase mb-8">
            RELOJ DE GUARDIA: {timeLimitRef.current}s
          </p>

          <button
            onClick={() => {
              if (!currentCase) return;
              setShowIntro(false);
              setTimeLeft(timeLimitRef.current);
              setIsProcessing(false);
              send({
                type: 'START_GUARD',
                deck: pendingDeckRef.current,
                difficulty: currentCase.difficulty || 'standard',
                pearl: (currentCase.enarm_pearl || currentCase.perla_enarm) as any
              });
            }}
            className="btn-primary w-full py-5 text-lg"
          >
             COMENZAR CONSULTA
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
            className="flex flex-col items-center justify-center p-8 gap-8 w-full min-h-full"
          >
            <div className="relative mb-4 text-center">
              <span className="text-[12px] font-black tracking-[0.6em] text-moomin-muted uppercase mb-2 block">SISTEMA MÉDICO</span>
              <h1 className="text-7xl font-display font-black tracking-tighter text-moomin-text italic leading-none">
                DR. SWIPE
              </h1>
              <div className="h-2 w-24 bg-moomin-primary mx-auto mt-4 rounded-full opacity-30" />
            </div>

            {/* Daily Streak Badge */}
            {dailyStreak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-moomin-accent/10 border border-moomin-accent/20 px-5 py-2 rounded-full mb-2"
              >
                <span className="text-moomin-accent text-lg">🔥</span>
                <span className="text-[11px] font-black text-moomin-text/80 tracking-widest uppercase">
                  RACHA: {dailyStreak} DÍAS {dailyStreak >= 7 ? '(x2.0 XP)' : `(x${getDailyStreakMultiplier(dailyStreak).toFixed(1)} XP)`}
                </span>
              </motion.div>
            )}

            {/* Coin Balance */}
            <div className="flex items-center gap-2 mb-2 bg-white/50 px-4 py-2 rounded-full shadow-sm">
              <span className="text-xl">🪙</span>
              <span className="text-base font-black text-moomin-text tracking-widest">{stats.coins}</span>
            </div>

            {/* Quick Progress Stats */}
            {stats.cases_solved > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-3 gap-4 mb-4 w-full max-w-sm"
              >
                <div className="bg-white/80 border border-moomin-text/5 rounded-3xl p-4 text-center shadow-sm">
                  <div className="text-3xl font-display font-black text-moomin-primary">{stats.cases_solved}</div>
                  <div className="text-[9px] font-black text-moomin-muted uppercase tracking-widest mt-1">Casos</div>
                </div>
                <div className="bg-white/80 border border-moomin-text/5 rounded-3xl p-4 text-center shadow-sm">
                  <div className="text-3xl font-display font-black text-moomin-secondary">
                    {stats.correct_swipes + stats.mistakes > 0
                      ? Math.round((stats.correct_swipes / (stats.correct_swipes + stats.mistakes)) * 100)
                      : 0}%
                  </div>
                  <div className="text-[9px] font-black text-moomin-muted uppercase tracking-widest mt-1">Precisión</div>
                </div>
                <div className="bg-white/80 border border-moomin-text/5 rounded-3xl p-4 text-center shadow-sm">
                  <div className="text-3xl font-display font-black text-moomin-accent">{(stats.xp || 0).toLocaleString()}</div>
                  <div className="text-[9px] font-black text-moomin-muted uppercase tracking-widest mt-1">Puntos</div>
                </div>
              </motion.div>
            )}

            {/* Difficulty Selector */}
            <div className="flex gap-3 mb-4">
              {(['standard', 'hard', 'extreme'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                    selectedDifficulty === diff
                      ? diff === 'extreme' ? 'bg-moomin-accent/20 border-moomin-accent text-moomin-text shadow-lg scale-105'
                        : diff === 'hard' ? 'bg-orange-500/20 border-orange-500 text-moomin-text shadow-lg scale-105'
                        : 'bg-moomin-primary/20 border-moomin-primary text-moomin-text shadow-lg scale-105'
                      : 'bg-white/50 border-moomin-text/10 text-moomin-muted hover:border-moomin-text/20'
                  }`}
                >
                  {diff === 'standard' ? 'Médico General' : diff === 'hard' ? 'Residente' : 'Especialista'}
                </button>
              ))}
            </div>

            {loadError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-moomin-accent/10 border-2 border-moomin-accent/30 rounded-3xl p-5 mb-4 text-center max-w-md shadow-lg"
              >
                <p className="text-moomin-text text-sm font-bold">⚠️ {loadError}</p>
                <p className="text-moomin-muted text-xs mt-2">Hubo un pequeño error. ¿Intentamos otra vez?</p>
              </motion.div>
            )}

            <div className="flex gap-4 w-full max-w-xs justify-center">
              <button
                onClick={() => startNewCase(false)}
                disabled={isLoadingCase}
                className={`btn-primary px-12 py-6 text-xl flex-1 ${isLoadingCase ? 'opacity-50 cursor-not-allowed' : ''} shadow-[0_10px_0_rgba(135,206,235,0.3)]`}
              >
                {isLoadingCase ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block animate-spin">🕒</span> Cargando...
                  </span>
                ) : (
                  "NUEVA GUARDIA"
                )}
              </button>
            </div>
            <button
              onClick={() => setShowStats(true)}
              disabled={isLoadingCase}
              className={`text-[11px] font-black tracking-[0.4em] transition-colors uppercase py-2 px-4 rounded-full border border-transparent ${
                isLoadingCase ? 'text-moomin-muted cursor-not-allowed' : 'text-moomin-muted hover:text-moomin-primary hover:bg-white/50'
              }`}
            >
              📊 ARCHIVOS MÉDICOS
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
            className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-[100]"
          >
            {/* Pulsing background layers */}
            <motion.div
              className="absolute inset-0 bg-moomin-accent/10"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-9xl mb-8 filter drop-shadow-[0_10px_20px_rgba(255,159,127,0.4)]"
            >
              🚨
            </motion.div>
            <h2 className="text-6xl font-display font-black text-moomin-accent tracking-tighter text-glow-danger uppercase italic">
              CÓDIGO ROJO
            </h2>
            <p className="text-sm font-black tracking-[0.5em] mt-6 text-moomin-text/60 uppercase">
              PACIENTE EN ESTADO CRÍTICO
            </p>
          </motion.div>
        );

      case state.matches('boss_fight'):
        const hasQuestions = currentCase?.boss_fight_triad?.questions &&
                           Array.isArray(currentCase.boss_fight_triad.questions) &&
                           currentCase.boss_fight_triad.questions.length > 0;

        if (!hasQuestions) {
          return (
            <div className="w-full max-w-xl h-full flex flex-col items-center justify-center gap-10 relative overflow-hidden">
              <div className="text-center z-10 px-6">
                <span className="text-[11px] font-black tracking-[0.4em] text-moomin-accent uppercase mb-2 block">PROTOCOLO DE EMERGENCIA</span>
                <h2 className="text-3xl font-display font-black text-moomin-text italic tracking-tighter mb-4">ESTABILIZACIÓN MANUAL</h2>
                <div className="h-1.5 w-32 bg-moomin-accent mx-auto mb-6 rounded-full opacity-30" />
                <p className="text-sm text-moomin-muted font-bold uppercase tracking-widest leading-relaxed">Mantén el ritmo pulsando el centro</p>
              </div>

              {/* Stabilization Heart/Core */}
              <div className="relative group p-12">
                <div className="absolute inset-0 bg-moomin-accent/15 blur-[60px] rounded-full animate-pulse group-hover:opacity-40 transition-opacity" />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="w-48 h-48 rounded-full border-4 border-moomin-accent/30 flex items-center justify-center relative z-10 cursor-pointer active:scale-90 transition-transform"
                  onClick={() => {
                    triggerHaptic('qteInteract');
                    send({ type: 'QTE_INTERACT' });
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-7xl filter drop-shadow-[0_10px_15px_rgba(255,159,127,0.5)]">❤️</span>
                    <span className="text-[10px] font-black text-moomin-accent mt-6 animate-gentle-bounce tracking-widest uppercase">PULSAR</span>
                  </div>
                </motion.div>
              </div>

              {/* QTE Timer */}
              <div className="w-full max-w-xs space-y-4 text-center mt-4">
                <div className="text-4xl font-black text-moomin-text font-mono mb-2">
                  {state.context.qteTimeLeft}s
                </div>
                <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden border border-moomin-text/5 shadow-inner">
                  <motion.div
                    animate={{ width: [`${(state.context.qteTimeLeft / 5) * 100}%`] }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-moomin-accent rounded-full shadow-[0_0_15px_rgba(255,159,127,0.4)]"
                  />
                </div>
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
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="glass-panel p-10 max-w-md text-center border-moomin-text/5 shadow-2xl relative overflow-hidden bg-white/95"
          >
            {/* Particle burst on reward - More pastel */}
            {[...Array(15)].map((_, i) => {
              const angle = (i / 15) * 360;
              const rad = (angle * Math.PI) / 180;
              const dist = 100 + Math.random() * 80;
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full pointer-events-none"
                  style={{ backgroundColor: i % 3 === 0 ? '#87CEEB' : i % 3 === 1 ? '#FFB6C1' : '#98D8C8' }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.02, ease: 'easeOut' }}
                />
              );
            })}

            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-moomin-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
            >
              <span className="text-5xl filter drop-shadow-[0_8px_16px_rgba(135,206,235,0.4)]">🌈</span>
            </motion.div>

            {state.context.caseStreak > 1 && (
              <motion.div
                initial={{ y: -15, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-4 inline-block bg-moomin-secondary/10 text-moomin-muted px-5 py-2 rounded-full text-[11px] font-black tracking-widest border border-moomin-secondary/20 relative z-10"
              >
                🔥 RACHA DE CASOS: x{state.context.caseStreak}
              </motion.div>
            )}

            <div className="absolute top-6 right-6 z-20">
              <button
                onClick={() => setShowRetro(true)}
                className="w-12 h-12 rounded-full bg-moomin-primary/10 border border-moomin-primary/20 flex items-center justify-center text-2xl hover:bg-moomin-primary/20 transition-all hover:scale-110 shadow-sm"
                title="Ver Resumen de Guardia"
              >
                 📔
              </button>
            </div>

            <h2 className="text-4xl font-display font-black text-moomin-text mb-2 tracking-tighter italic relative z-10">
              ¡EXCELENTE TRABAJO!
            </h2>
            <p className="text-moomin-muted mb-6 font-medium italic text-base leading-relaxed relative z-10 px-4">
              "El paciente se encuentra estable y agradecido. ¡Eres un gran médico!"
            </p>

            {/* Perfect Round Badge - More golden/playful */}
            {state.context.mistakesThisCase === 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="mb-8 inline-block bg-[#FFD700]/10 text-[#B8860B] px-6 py-3 rounded-full text-xs font-black tracking-[0.2em] border-2 border-[#FFD700]/30 relative z-10 shadow-lg"
              >
                ✨ GUARDIA PERFECTA ✨
              </motion.div>
            )}

            {/* Score breakdown - Card style */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-moomin-bg/50 border border-moomin-text/5 rounded-[2rem] p-6 mb-8 text-left relative z-10 shadow-inner"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-moomin-muted uppercase tracking-[0.3em]">REPORTE MÉDICO</span>
                <span className="text-[10px] font-mono font-bold text-moomin-primary">{currentCase?.case_id?.slice(-8) || '---'}</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-moomin-muted uppercase tracking-widest">Experiencia</span>
                  <span className="text-2xl font-display font-black text-moomin-primary">+{state.context.score}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-moomin-muted uppercase tracking-widest">Monedas</span>
                  <span className="text-2xl font-display font-black text-moomin-secondary">+{state.context.coinsEarnedThisCase}</span>
                </div>
              </div>
            </motion.div>

            <button
              onClick={() => {
                triggerHaptic('criticalSuccess');
                send({ type: 'RESTART' });
              }}
              className="btn-primary w-full py-6 text-xl shadow-[0_10px_0_rgba(135,206,235,0.3)]"
            >
              CONTINUAR GUARDIA
            </button>
          </motion.div>
        );

      case state.matches('ghosted'):
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel p-10 max-w-md text-center border-moomin-accent/20 shadow-2xl relative overflow-hidden bg-white/95"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-moomin-accent/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <span className="text-5xl filter drop-shadow-[0_8px_16px_rgba(255,159,127,0.4)]">👻</span>
            </motion.div>

            <h2 className="text-5xl font-display font-black text-moomin-accent mb-2 tracking-tighter italic uppercase">
              DESERTADO
            </h2>
            <p className="text-moomin-muted mb-8 font-medium italic text-base leading-relaxed px-4">
              "El paciente ha abandonado la sala por falta de atención oportuna."
            </p>

            <div className="bg-moomin-bg/50 border border-moomin-text/5 rounded-[2rem] p-6 mb-8 text-left shadow-inner">
               <span className="text-[10px] font-black text-moomin-muted uppercase tracking-[0.3em] block mb-2">MOTIVO DEL FALLO</span>
               <p className="text-sm text-moomin-text font-medium italic leading-relaxed">
                 {state.context.fatalError || "El tiempo de guardia ha expirado sin una resolución clínica adecuada."}
               </p>
            </div>

            <button
              onClick={() => {
                triggerHaptic('lethalError');
                send({ type: 'RESTART' });
              }}
              className="btn-primary w-full py-6 text-xl bg-moomin-accent hover:bg-orange-400 border-orange-600/30 shadow-[0_10px_0_rgba(255,159,127,0.3)]"
            >
              REINTENTAR CONSULTA
            </button>
          </motion.div>
        );

      case state.matches('debrief'):
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel p-10 max-w-md text-left bg-white/95 border-moomin-accent/20 shadow-2xl relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] text-moomin-accent font-black tracking-[0.3em] uppercase">
                ERROR DETECTADO
              </span>
              <span className="text-[10px] font-mono font-bold text-moomin-muted">ID: {currentCase?.case_id?.slice(-8) || '---'}</span>
            </div>

            <div className="mb-6 p-6 bg-moomin-accent/5 border-l-4 border-moomin-accent rounded-r-[2rem]">
              <p className="text-[10px] text-moomin-accent font-black mb-3 flex items-center gap-2 tracking-widest uppercase">
                <span className="w-2.5 h-2.5 bg-moomin-accent rounded-full animate-pulse" />
                NOTA DE SUPERVISIÓN:
              </p>
              <p className="text-base text-moomin-text italic font-medium leading-relaxed">
                "{state.context.debriefData?.comment}"
              </p>
            </div>

            <div className="mb-8">
              <div className="text-[10px] text-moomin-muted mb-3 font-black uppercase tracking-[0.2em]">Explicación Médica:</div>
              <p className="text-sm text-moomin-text leading-relaxed font-medium bg-moomin-bg/30 p-4 rounded-2xl border border-moomin-text/5 italic">
                {state.context.debriefData?.text}
              </p>
            </div>

            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-bold text-moomin-primary underline decoration-2 underline-offset-4">GPC: {state.context.debriefData?.gpc}</span>
            </div>

            <div className="flex flex-col gap-4">
              <button
                 onClick={() => setShowRetro(true)}
                 className="btn-primary w-full py-5 !bg-white border-2 border-moomin-primary/20 !text-moomin-primary shadow-sm hover:!bg-moomin-bg transition-all"
              >
                VER HISTORIAL COMPLETO
              </button>

              <button 
                onClick={() => send({ type: 'RESTART' })} 
                className="btn-primary w-full py-6 text-xl shadow-[0_10px_0_rgba(135,206,235,0.3)]"
              >
                VOLVER A GUARDIA
              </button>
            </div>
          </motion.div>
        );

      case state.matches('critical_warning'):
        return (
          <div className="fixed inset-0 bg-moomin-accent/20 backdrop-blur-md flex flex-col items-center justify-center z-[100] animate-pulse">
            <div className="text-8xl mb-8 filter drop-shadow-[0_10px_20px_rgba(255,159,127,0.4)]">⚠️</div>
            <h2 className="text-5xl font-display font-black text-moomin-accent italic tracking-tighter uppercase">ADVERTENCIA CRÍTICA</h2>
            <p className="text-xl text-moomin-text mt-6 px-12 text-center font-bold italic max-w-lg leading-relaxed">
              {state.context.fatalError}
            </p>
            <p className="mt-12 text-[10px] text-moomin-muted tracking-[0.5em] font-black uppercase">REINTENTANDO ESTABILIZACIÓN...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-moomin-bg flex flex-col items-center safe-top safe-bottom select-none overflow-hidden text-moomin-text 
      ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''} 
      ${swipeFeedback === 'wrong' ? 'shake-lite' : ''}
      ${state.context.combo >= 15 ? 'combo-glow-3' : (state.context.combo >= 10 ? 'combo-glow-2' : (state.context.combo >= 5 ? 'combo-glow-1' : ''))}
    `}>
      {/* Background Ambience Layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-moomin-primary/10 to-transparent opacity-40" />
      </div>

      <TelemetryHUD timeLeft={timeLeft} state={state.value as string} evidenceCount={state.context.dossier.length} />

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
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-0 pointer-events-none ${swipeFeedback === 'correct' ? 'bg-moomin-primary' : 'bg-moomin-accent'}`}
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
                className="absolute w-24 h-24 rounded-full border-2 border-moomin-secondary/30"
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 3 + i, opacity: 0 }}
                transition={{ duration: 0.9, delay: i * 0.18, ease: 'easeOut' }}
              />
            ))}
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="text-5xl font-display font-black text-moomin-text drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)] tracking-tighter relative italic"
            >
              {showMilestoneCelebration >= 20 ? '🌈 MÉDICO LEGENDARIO' : showMilestoneCelebration >= 15 ? '✨ MAESTRO' : showMilestoneCelebration >= 10 ? '🔥 IMPARABLE' : '⚡ ¡NICE!'}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-black text-moomin-primary tracking-widest uppercase italic"
            >
              RACHA x{showMilestoneCelebration}
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
            <span className={`text-4xl font-display font-black italic tracking-[0.1em] ${swipeFeedback === 'correct' ? 'text-moomin-primary' : 'text-moomin-accent'} drop-shadow-md`}>
              {swipeFeedback === 'correct' ? '¡SÍ!' : '¡OUCH!'}
            </span>
            {swipeFeedback === 'correct' && (Date.now() - state.context.lastCardPresentedAt < 1200) && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="text-moomin-secondary font-black text-xl italic tracking-wider drop-shadow-sm"
              >
                ✨ ¡REACCIÓN RÁPIDA! ✨
              </motion.span>
            )}
            {state.context.showEureka && (
              <motion.span 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: [0, 1.5, 1], rotate: 0 }}
                className="text-moomin-primary font-black text-2xl drop-shadow-md mt-2 italic"
              >
                💡 DOBLE CLARIDAD 💡
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Red-Out Vignette Effect - Now Moomin Accent (Soft Orange/Rose) */}
      {timeLeft <= 15 && state.matches('triage') && (
        <div
          className="fixed inset-0 pointer-events-none z-[80]"
          style={{ 
            background: `radial-gradient(circle, transparent 40%, rgba(255, 159, 127, ${(1 - (timeLeft / 15)) * 0.4}) 100%)` 
          }}
        />
      )}
      
      <div className="w-full max-w-md flex justify-between items-start px-4 sm:px-8 py-6 sm:py-10 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-moomin-muted mb-1">PUNTOS</span>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={state.context.score}
              initial={{ scale: 1.35, color: '#87CEEB' }}
              animate={{ scale: 1, color: '#2C3E50' }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              className="text-4xl font-display font-black tracking-tighter italic"
            >
              {state.context.score}
            </motion.span>
            {state.context.multiplier > 1 && (
              <motion.span
                key={state.context.multiplier}
                initial={{ scale: 1.4, x: -6, opacity: 0 }}
                animate={{ scale: 1, x: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="text-[10px] font-black text-moomin-secondary bg-moomin-secondary/10 px-3 py-1 rounded-full border border-moomin-secondary/20 uppercase italic"
              >
                x{state.context.multiplier.toFixed(1)}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2 bg-white/40 px-3 py-1 rounded-full w-fit shadow-sm">
            <span className="text-sm">🪙</span>
            <span className="text-[11px] font-black text-moomin-text tracking-widest">{stats.coins}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="h-12 w-12 glass-panel !rounded-2xl flex items-center justify-center font-black text-sm border-moomin-text/5 shadow-md scale-110 italic bg-white/80">
            {state.context.caseStreak >= 6 ? 'ADSC' : (state.context.caseStreak >= 4 ? 'R3' : (state.context.caseStreak >= 2 ? 'R2' : 'R1'))}
          </div>
          {state.matches('triage') && state.context.deck.length > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-moomin-muted uppercase tracking-[0.2em]">CASO</span>
              <span className="text-xl font-display font-black text-moomin-text italic">
                {state.context.currentCardIndex + 1}
                <span className="text-moomin-muted/40">/{state.context.deck.length}</span>
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
              <span className="text-[9px] font-black text-moomin-muted uppercase tracking-[0.2em]">RACHA</span>
              <span className={`text-2xl font-display font-black italic drop-shadow-sm ${
                state.context.combo >= 15 ? 'text-moomin-accent' : state.context.combo >= 10 ? 'text-orange-400' : 'text-moomin-primary'
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
          <div className={`w-full h-3 bg-white/50 rounded-full overflow-hidden shadow-inner flex mb-2 border border-moomin-text/5`}>
            <motion.div
              className={`h-full ${timeLeft <= 10 ? 'bg-moomin-accent shadow-[0_0_15px_rgba(255,159,127,0.4)]' : 'bg-moomin-secondary shadow-[0_0_10px_rgba(255,182,193,0.3)]'}`}
              initial={{ width: '100%' }}
              animate={{
                width: `${(timeLeft / timeLimitRef.current) * 100}%`,
              }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{ originX: 0 }}
            />
          </div>
          <div className="flex justify-between items-center w-full px-1">
            <span className={`text-[10px] uppercase font-black tracking-widest ${timeLeft <= 10 ? 'text-moomin-accent animate-pulse' : 'text-moomin-muted'}`}>
              RELOJ DE GUARDIA
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-moomin-text font-mono font-black">{timeLeft}s</span>
              <button
                onClick={() => setIsPaused(p => !p)}
                className="text-[10px] font-black text-moomin-primary hover:text-moomin-secondary transition-colors uppercase tracking-[0.2em] italic"
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
        <div className="fixed right-6 top-1/4 bottom-1/4 w-40 hidden lg:flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar pointer-events-none opacity-80 hover:opacity-100 transition-opacity z-10">
          <span className="text-[10px] font-black text-moomin-muted uppercase tracking-[0.3em] mb-3 border-b border-moomin-text/5 pb-2 italic">Dossier</span>
          <AnimatePresence>
            {state.context.dossier.map((card, idx) => (
              <motion.div 
                key={`${card.card_id}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-2xl bg-white/60 border border-moomin-text/5 text-[10px] flex flex-col gap-1.5 shadow-sm ${state.context.showEureka && idx >= state.context.dossier.length - 3 ? 'eureka-glow ring-2 ring-moomin-primary/40' : ''}`}
              >
                <span className="text-moomin-primary font-black uppercase tracking-widest text-[8px]">{card.category}</span>
                <span className="text-moomin-text font-medium italic leading-relaxed line-clamp-2">{card.card_text}</span>
              </motion.div>
            )).reverse()}
          </AnimatePresence>
        </div>
      )}

      {/* Content Area */}
      <div className="w-full flex-grow flex items-center justify-center overflow-y-auto">
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
