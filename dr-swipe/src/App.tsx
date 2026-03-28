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
import { cleanVazquezComment, shuffleBossQuestion } from './utils/formatters';
import { triggerHaptic } from './utils/hapticFeedback';
import { calculatePerfectRoundBonus, getDailyStreakMultiplier } from './utils/scoringEngine';
import { LIFELINE_COST } from './store/useCodexStore';
import ErrorBoundary from './components/ErrorBoundary';
import { useCodexStore } from './store/useCodexStore';
import { TutorialOverlay } from './components/TutorialOverlay';
import { StatsDashboard } from './components/StatsDashboard';
import { RetrospectiveView } from './components/RetrospectiveView';

const isSwipeCorrect = (direction: 'left' | 'right', expectedAction: 'keep' | 'discard'): boolean => {
  return (direction === 'right' && expectedAction === 'keep') ||
         (direction === 'left' && expectedAction === 'discard');
};

import vazquezData from './data/lore/vazquezDialogs.json';

const VAZQUEZ_LINES = vazquezData.vazquezDialogs;

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
        className="glass-panel p-8 max-w-sm border-accent/40 text-center shadow-[0_0_50px_rgba(34,211,238,0.15)] relative bg-slate-900/90"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-24 h-24 flex items-center justify-center text-6xl mx-auto mb-4 filter drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]"
        >
          👴
        </motion.div>
        <span className="text-[10px] font-black tracking-[0.4em] text-accent uppercase mb-2 block">
          DR. VÁZQUEZ — INTERRUPCIÓN
        </span>
        <h3 className="text-xl font-display font-black text-white mb-3 tracking-tight">
          "{line.titulo}"
        </h3>
        <p className="text-sm text-slate-400 italic font-medium mb-4 leading-relaxed">
          {line.cuerpo}
        </p>
        <div className="h-1 w-12 bg-accent/20 mx-auto rounded-full" />
      </motion.div>
    </div>
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
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-full shadow-2xl border-2 flex items-center gap-3 font-black italic tracking-tight whitespace-nowrap backdrop-blur-md
            ${toast.type === 'milestone' ? 'bg-secondary border-white/20 text-white' : 'bg-slate-900 border-primary/20 text-primary'}
          `}
        >
          <span className="text-xl">{toast.type === 'milestone' ? '🏆' : '🪙'}</span>
          {toast.text}
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
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[160] p-6">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      <motion.div
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="glass-panel p-10 max-w-xs w-full text-center border-primary/40 shadow-[0_0_50px_rgba(34,211,238,0.2)] bg-slate-900 relative overflow-hidden loot-box-shine"
      >
        <motion.div 
          className="text-8xl mb-6 loot-box-shake inline-block"
        >
          📦
        </motion.div>
        
        <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase block mb-2">¡CAJA DE SUMINISTROS!</span>
        <h3 className="text-2xl font-display font-black text-white mb-4 mt-2">{reward.item.nombre}</h3>
        
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-8 border border-white/5">
          <p className="text-sm font-medium text-slate-400 italic mb-1">"{reward.item.texto}"</p>
        </div>

        <button
          onClick={onClaim}
          className="btn-primary w-full py-4 text-base"
        >
          ¡LO TOMO!
        </button>
      </motion.div>
    </div>
  );
};

const PenaltyOverlay: React.FC<{ 
  penalty: { active: boolean; item: any }; 
  onAccept: () => void 
}> = ({ penalty, onAccept }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[160] p-6">
      <motion.div
        className="absolute inset-0 bg-red-900/60 backdrop-blur-md mix-blend-multiply"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="glass-panel p-8 max-w-sm w-full text-center border-moomin-accent/40 shadow-2xl bg-white relative overflow-hidden"
      >
        <span className="text-[10px] font-black tracking-[0.5em] text-moomin-accent uppercase block mb-2">CONSECUENCIA</span>
        <h3 className="text-2xl font-display font-black text-moomin-text mb-4 mt-2 leading-tight">{penalty.item.nombre}</h3>
        
        <div className="bg-moomin-accent/10 rounded-xl p-4 mb-6 border border-moomin-accent/20">
          <p className="text-sm font-medium text-moomin-text italic mb-1">"{penalty.item.texto}"</p>
        </div>

        <button
          onClick={onAccept}
          className="w-full py-4 text-base font-bold text-white bg-moomin-accent rounded-full shadow-[0_4px_12px_rgba(235,87,87,0.3)] hover:bg-red-600 transition-colors"
        >
           ENTENDIDO
        </button>
      </motion.div>
    </div>
  );
};

const EventOverlay: React.FC<{ 
  event: { type: 'lab' | 'archive' | 'systemic'; item: any }; 
  onAccept: () => void 
}> = ({ event, onAccept }) => {
  const getStyle = () => {
    switch(event.type) {
      case 'lab': return { bg: 'bg-blue-900/60', border: 'border-blue-500/40', title: 'TÉCNICO DE LABORATORIO', button: 'bg-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:bg-blue-700', icon: '🧪' };
      case 'archive': return { bg: 'bg-yellow-900/60', border: 'border-yellow-500/40', title: 'ENCARGADO DE ARCHIVO', button: 'bg-yellow-600 shadow-[0_4px_12px_rgba(202,138,4,0.3)] hover:bg-yellow-700', icon: '🗄️' };
      default: return { bg: 'bg-purple-900/60', border: 'border-purple-500/40', title: 'SISTEMA INSTITUCIONAL', button: 'bg-purple-600 shadow-[0_4px_12px_rgba(147,51,234,0.3)] hover:bg-purple-700', icon: '⚠️' };
    }
  };
  
  const style = getStyle();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[160] p-6">
      <motion.div
        className={`absolute inset-0 ${style.bg} backdrop-blur-md mix-blend-multiply`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`glass-panel p-8 max-w-sm w-full text-center bg-slate-900 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.4)] border-white/10`}
        >
          <span className="text-4xl mb-6 block drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{style.icon}</span>
          <span className="text-[10px] font-black tracking-[0.6em] text-slate-500 uppercase block mb-2">{style.title}</span>
          <h3 className="text-2xl font-display font-black text-white mb-6 mt-2 leading-tight tracking-tight">{event.item.nombre}</h3>
          
          <div className={`rounded-3xl p-6 mb-8 border border-white/5 bg-black/40 backdrop-blur-sm`}>
            <p className="text-base font-medium text-slate-300 italic mb-1 leading-relaxed">"{event.item.texto || (event.item.frases && event.item.frases.start) || '...'}"</p>
          </div>

          <button
            onClick={onAccept}
            className={`w-full py-5 text-sm font-black tracking-widest text-slate-950 rounded-2xl transition-all active:scale-95 uppercase ${event.type === 'lab' ? 'bg-primary' : event.type === 'archive' ? 'bg-amber-400' : 'bg-purple-400'}`}
          >
             CONFIRMAR RECEPCIÓN
          </button>
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
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[180] p-6">
      <motion.div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-panel p-10 max-w-md w-full text-center border-moomin-accent/40 shadow-2xl bg-white relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-moomin-accent/20" />
        
        <div className="text-6xl mb-6">🚑</div>
        
        <span className="text-[10px] font-black tracking-[0.5em] text-moomin-accent uppercase block mb-2">INCIDENTE CRÍTICO</span>
        <h3 className="text-2xl font-display font-black text-moomin-text mb-4 mt-2 leading-tight">INTERNO RELEVADO</h3>
        
        <div className="bg-moomin-accent/5 rounded-2xl p-6 mb-8 border border-moomin-accent/10 text-left">
          <p className="text-xs font-black text-moomin-accent uppercase tracking-widest mb-2">MOTIVO DEL RELEVO:</p>
          <p className="text-sm font-medium text-moomin-text italic leading-relaxed">"{error}"</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={onRescue}
            className="btn-primary w-full py-5 text-lg flex flex-col items-center justify-center gap-1 shadow-[0_6px_0_rgba(135,206,235,0.3)]"
          >
            <span className="text-sm font-black tracking-widest">LLAMAR REFUERZO</span>
            <span className="text-[10px] opacity-70">QUEDAN {livesRemaining - 1} INTERNOS DISPONIBLES</span>
          </button>
          
          <button
            onClick={onRestart}
            className="text-[11px] font-black text-moomin-muted hover:text-moomin-accent uppercase tracking-[0.3em] py-2 transition-colors"
          >
            Finalizar Guardia
          </button>
        </div>

        {/* Intern icons representation */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-3">
            {[...Array(5)].map((_, i) => (
                <div 
                    key={i}
                    className={`w-3 h-3 rounded-full ${i < livesRemaining ? 'bg-moomin-primary' : 'bg-slate-200'} ${i === livesRemaining - 1 ? 'animate-pulse' : ''}`}
                />
            ))}
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
  lives: number;
}> = ({ timeLeft, state, score, combo, vitality, lives }) => {
  if (state !== 'triage' && state !== 'boss_fight' && state !== 'urgent_triage') return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex items-center justify-between glass-panel p-3 px-5 border-moomin-text/10 shadow-xl bg-white/90 backdrop-blur-md rounded-2xl">
      {/* Left: Score & Vitality (Life) - Better spacing to avoid overlap */}
      <div className="flex items-center gap-5 flex-1">
        <div className="flex flex-col gap-1 min-w-fit">
          <span className="text-[7px] font-black tracking-[0.3em] text-moomin-muted uppercase leading-none">Pts</span>
          <motion.span
            key={score}
            initial={{ scale: 1.2, color: '#87CEEB' }}
            animate={{ scale: 1, color: '#5C4033' }}
            className="text-lg font-display font-black leading-none"
          >
            {score}
          </motion.span>
        </div>

        <div className="w-px h-8 bg-moomin-text/10" />

        <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
          <span className="text-[7px] font-black tracking-[0.3em] text-moomin-muted uppercase leading-none">Salud</span>
          <div className="h-2.5 w-full bg-moomin-bg/60 rounded-full overflow-hidden border border-moomin-text/10 shadow-inner">
            <motion.div
              initial={{ width: '100%' }}
              animate={{
                width: `${vitality}%`,
                backgroundColor: vitality > 60 ? '#98D8C8' : vitality > 30 ? '#FFD700' : '#FF9F7F'
              }}
              className="h-full transition-colors duration-500"
            />
          </div>
          <span className="text-[7px] text-moomin-muted/50 font-black">{vitality}%</span>
        </div>
      </div>

      {/* Interns (Lives) display - Cleaner layout */}
      <div className="flex items-center gap-3 ml-2">
        <div className="flex flex-col items-center gap-1">
            <span className="text-[7px] font-black text-moomin-muted tracking-[0.3em] uppercase">Equipo</span>
            <div className="flex gap-1.5 items-center">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: i < lives ? 1 : 0.7,
                            opacity: i < lives ? 1 : 0.3,
                            backgroundColor: i < lives ? '#87CEEB' : '#ccc'
                        }}
                        className="w-2 h-2 rounded-full border border-white shadow-sm"
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Center: Combo Pill (Only if > 1) - Better visibility */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            initial={{ y: -15, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -15, opacity: 0, scale: 0.9 }}
            className={`px-4 py-2 rounded-full border-2 text-[11px] font-black tracking-widest shadow-lg ${
              combo >= 15 ? 'bg-moomin-accent/15 border-moomin-accent text-moomin-accent animate-pulse' :
              combo >= 10 ? 'bg-orange-100/80 border-orange-400 text-orange-700 font-black' :
              'bg-moomin-primary/15 border-moomin-primary text-moomin-primary'
            }`}
          >
            🔥 {combo} ACIERTOS
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Timer - Cleaner, more visible */}
      <div className="flex items-center gap-2 ml-2">
        <div className="flex items-center gap-3 bg-moomin-bg/50 px-4 py-2 rounded-full border-2 border-moomin-text/10">
          <span className="text-[7px] font-black tracking-[0.3em] text-moomin-muted uppercase leading-none">⏱️</span>
          <span className={`text-base font-mono font-black leading-none tabular-nums ${timeLeft <= 10 ? 'text-moomin-accent animate-pulse' : 'text-moomin-text'}`}>
            {timeLeft.toString().padStart(2, '0')}s
          </span>
          {timeLeft <= 10 && <div className={`w-2 h-2 rounded-full bg-moomin-accent animate-ping`} />}
        </div>
      </div>
    </div>
  );
};



function App() {
  const [state, send] = useMachine(gameMachine);
  const { playGhosted, startAlarm, stopAlarm } = useGameAudio();
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  const { addXp, addCoins, registerCaseSolved, unlockPearl, updateSwipeResult, incrementSessions, spendCoins, updateDailyStreak, clearSessionProgress, stats, dailyStreak } = useCodexStore();
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
  const [caseQueue, setCaseQueue] = useState<ClinicalCase[]>([]);
  const [rewardToast, setRewardToast] = useState<{ show: boolean; text: string; type: 'coins' | 'xp' | 'milestone' }>({
    show: false,
    text: '',
    type: 'coins'
  });

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



  // Clear session progress when game ends (reward or ghosted)
  useEffect(() => {
    if (state.matches('reward') || state.matches('ghosted') || state.matches('debrief')) {
      clearSessionProgress();
    }
    // Automatically clear swipe feedback elements when exiting triage
    if (!state.matches('triage') && !state.matches('urgent_triage')) {
      setComment(null);
      setExpression('neutral');
      setSwipeFeedback(null);
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
    const isOverlayActive = !!(state.context.activeEvent || state.context.activePenalty || state.context.lootBoxReward);
    
    if (!isPaused && !isOverlayActive && timeLeft > 0 && (state.matches('triage') || state.matches('urgent_triage'))) {
      timer = window.setInterval(() => {
        setTimeLeft(t => t - 1);
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
        const bonus = calculatePerfectRoundBonus(
          state.context.deck.length,
          state.context.difficulty
        );
        totalCoins += bonus;
        showToast(`¡GUARDIA PERFECTA! +${bonus} 🪙`, 'milestone');
      }
      addCoins(totalCoins);
      if (totalCoins > 0 && state.context.mistakesThisCase > 0) {
        showToast(`+${totalCoins} 🪙`, 'coins');
      }

      registerCaseSolved(currentCase.case_id, state.context.score);
      const pearl = currentCase.enarm_pearl || (currentCase as any).perla_enarm;
      if (pearl) unlockPearl(pearl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.matches('reward')]);

  const startNewCase = async (skipIntro = false, isFullShift = true) => {
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
      
      const numCases = isFullShift ? 3 : 1;
      const loadedCases: ClinicalCase[] = [];
      
      for (let i = 0; i < numCases; i++) {
        const caseData = await dataLoader.loadRandomCase();
        
        // Validate case has required fields
        if (!caseData.card_stream || caseData.card_stream.length < 1) {
          throw new Error('Caso inválido: no contiene cartas.');
        }

        // Shuffle boss questions if they exist
        if (caseData.boss_fight_triad?.questions) {
          caseData.boss_fight_triad.questions = caseData.boss_fight_triad.questions.map(q => shuffleBossQuestion(q));
        }

        // Apply difficulty override
        if (selectedDifficulty) {
          (caseData as any).difficulty = selectedDifficulty;
        }
        
        loadedCases.push(caseData);
      }

      const caseData = loadedCases[0];
      const remainingCases = loadedCases.slice(1);

      setCurrentCase(caseData);
      setCaseQueue(remainingCases);

      // Adaptive Learning Curve (más suave para permitir aprendizaje)
      // Progresión: Principiante (18s) → Competente (15s) → Ágil (12s) → Experto (10s)
      let timePerCard = 18; // Inicio más generoso
      if (savedStreak >= 8) timePerCard = 10;  // Experto
      else if (savedStreak >= 6) timePerCard = 12;  // Ágil
      else if (savedStreak >= 3) timePerCard = 15;  // Competente
      const timeLimit = Math.max(90, Math.min(180, caseData.card_stream.length * timePerCard));

      // Shuffle cards logic
      const fullDeck = [...caseData.card_stream];
      const vitals = fullDeck.shift()!;
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

  const showToast = (text: string, type: 'coins' | 'xp' | 'milestone' = 'coins') => {
    setRewardToast({ show: true, text, type });
    setTimeout(() => setRewardToast(prev => ({ ...prev, show: false })), 2500);
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


  const handleCaseTransition = () => {
    if (caseQueue.length === 0) {
      send({ type: 'RESTART' });
      return;
    }

    const nextCase = caseQueue[0];
    const remaining = caseQueue.slice(1);
    
    // Prepare deck
    const fullDeck = [...nextCase.card_stream];
    const vitals = fullDeck.shift()!;
    const shuffledCards = [vitals, ...fullDeck.sort(() => Math.random() - 0.5)];
    
    // Update state
    setCurrentCase(nextCase);
    setCaseQueue(remaining);
    
    // Reset timer
    const streak = state.context.caseStreak;
    let timePerCard = 18;
    if (streak >= 8) timePerCard = 10;
    else if (streak >= 6) timePerCard = 12;
    else if (streak >= 3) timePerCard = 15;
    const timeLimit = Math.max(90, Math.min(180, nextCase.card_stream.length * timePerCard));
    setTimeLeft(timeLimit);
    timeLimitRef.current = timeLimit;
    pendingDeckRef.current = shuffledCards;

    send({ 
       type: 'CONTINUE_SHIFT', 
       deck: shuffledCards, 
       puzzle: nextCase.enarm_pearl || (nextCase as any).perla_enarm 
    });
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



  const renderCurrentView = () => {
     if (showIntro && currentCase) {
      const difficultyLabel = currentCase.difficulty === 'extreme' ? 'EXTREMO' : currentCase.difficulty === 'hard' ? 'DIFÍCIL' : 'NORMAL';
      const difficultyColor = currentCase.difficulty === 'extreme' ? 'text-moomin-accent border-moomin-accent/20 bg-moomin-accent/5' : currentCase.difficulty === 'hard' ? 'text-orange-400 border-orange-200 bg-orange-50' : 'text-moomin-primary border-moomin-primary/20 bg-moomin-primary/5';
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel p-10 max-w-md w-full text-center border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden mx-4 bg-slate-900/90 medical-grid"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase">EXPEDIENTE MÉDICO</span>
            <span className={`text-[9px] font-black tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border ${difficultyColor} backdrop-blur-md`}>
              NIVEL: {difficultyLabel}
            </span>
          </div>

          {/* Patient Name Area */}
          <div className="mb-8 group">
             <div className="text-[11px] font-bold text-primary/60 tracking-widest uppercase mb-1">IDENTIDAD DEL PACIENTE</div>
             <h2 className="text-5xl font-display font-black text-white leading-tight tracking-tighter drop-shadow-sm">
               {currentCase.patient_intro.name}
             </h2>
          </div>

          {/* Clinical Consign */}
          <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 mb-10 text-left relative">
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-primary px-3 py-1 rounded-full text-[9px] font-black text-slate-950 uppercase tracking-widest">
              CONSIGNA
            </div>
            <p className="text-lg text-slate-200 leading-relaxed font-medium">
              "{currentCase.patient_intro.arrival_scenario}"
            </p>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-3">
              <span className="text-primary text-lg">💡</span>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-snug">
                REGLA DE GUARDIA: Clasifica cada dato. No permitas que el ruido clínico sature el sistema.
              </p>
            </div>
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-center gap-12 mb-10">
             <div className="text-center">
                <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase mb-1">RELOJ</div>
                <div className="text-xl font-display font-black text-white">{timeLimitRef.current}s</div>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center">
                <div className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase mb-1">ESTADO</div>
                <div className="text-xl font-display font-black text-primary">TRIAGE</div>
             </div>
          </div>

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
            className="btn-primary w-full py-6 text-xl group"
          >
             <span className="flex items-center justify-center gap-3">
                ABRIR EXPEDIENTE
                <span className="group-hover:translate-x-1 transition-transform">➡️</span>
             </span>
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
            className="flex flex-col items-center justify-center p-8 gap-8 w-full min-h-screen relative overflow-hidden medical-grid"
          >
            {/* Ambient background glows */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative mb-8 text-center z-10">
              <span className="text-[14px] font-black tracking-[0.8em] text-primary/60 uppercase mb-4 block animate-pulse">TERMINAL MÉDICO v4.0</span>
              <h1 className="text-8xl md:text-9xl font-display font-black tracking-tighter text-white italic leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                DR. SWIPE
              </h1>
              <div className="h-1.5 w-48 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6 rounded-full" />
            </div>

            {/* Daily Streak Badge */}
            {dailyStreak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full mb-4 backdrop-blur-xl z-10"
              >
                <span className="text-accent text-xl animate-bounce">🔥</span>
                <span className="text-[12px] font-black text-white tracking-[0.2em] uppercase">
                  RACHA ACTIVA: {dailyStreak} DÍAS {dailyStreak >= 7 ? '— BONUS MAX' : ''}
                </span>
              </motion.div>
            )}

            {/* Quick Progress Stats */}
            {stats.cases_solved > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-3 gap-6 mb-8 w-full max-w-md z-10"
              >
                <div className="glass-panel p-6 text-center border-white/5 bg-slate-900/40">
                  <div className="text-4xl font-display font-black text-primary">{stats.cases_solved}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Expedientes</div>
                </div>
                <div className="glass-panel p-6 text-center border-white/5 bg-slate-900/40">
                  <div className="text-4xl font-display font-black text-secondary">
                    {stats.correct_swipes + stats.mistakes > 0
                      ? Math.round((stats.correct_swipes / (stats.correct_swipes + stats.mistakes)) * 100)
                      : 0}%
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Efectividad</div>
                </div>
                <div className="glass-panel p-6 text-center border-white/5 bg-slate-900/40">
                  <div className="text-4xl font-display font-black text-accent">{Math.floor((stats.xp || 0) / 1000)}k</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Puntos</div>
                </div>
              </motion.div>
            )}

            {/* Difficulty Selector */}
            <div className="flex flex-col items-center gap-4 mb-8 z-10">
              <span className="text-[10px] font-black tracking-[0.5em] text-slate-500 uppercase">SELECCIONAR RANGO</span>
              <div className="flex gap-4">
                {(['standard', 'hard', 'extreme'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                    className={`px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest border transition-all duration-300 ${
                      selectedDifficulty === diff
                        ? diff === 'extreme' ? 'bg-accent/20 border-accent text-white shadow-[0_0_30px_rgba(251,113,133,0.3)] scale-105'
                          : diff === 'hard' ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_30px_rgba(245,158,11,0.3)] scale-105'
                          : 'bg-primary/20 border-primary text-white shadow-[0_0_30px_rgba(34,211,238,0.3)] scale-105'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {diff === 'standard' ? 'Médico' : diff === 'hard' ? 'Residente' : 'Director'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-xs justify-center z-10">
              <button
                onClick={() => startNewCase(false)}
                disabled={isLoadingCase}
                className={`btn-primary py-7 text-2xl group ${isLoadingCase ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingCase ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                    INICIANDO...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    NUEVA GUARDIA
                    <span className="group-hover:translate-x-1 transition-transform">⚡</span>
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowStats(true)}
                disabled={isLoadingCase}
                className="text-[12px] font-black tracking-[0.5em] text-slate-500 hover:text-primary transition-colors uppercase flex items-center justify-center gap-2 group"
              >
                <span className="w-8 h-px bg-slate-800 group-hover:bg-primary/40 transition-all" />
                CENTRO DE DATOS
                <span className="w-8 h-px bg-slate-800 group-hover:bg-primary/40 transition-all" />
              </button>
            </div>
          </motion.div>
        );

      case state.matches('triage') || state.matches('urgent_triage'):
        return (
          <div className="flex flex-col items-center justify-center w-full max-w-sm gap-4 px-4 h-full mt-12 pb-12 min-h-[42rem]">
            {state.context.deck.length > 0 ? (
              <SwipeDeck
                cards={state.context.deck}
                currentIndex={state.context.currentCardIndex}
                onSwipe={handleSwipe}
                isLocked={isProcessing || isPaused}
                lifelineActive={state.context.lifelineActive}
                canUseLifeline={stats.coins >= LIFELINE_COST && !state.context.lifelineActive}
                onUseLifeline={handleLifeline}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-moomin-muted/40 animate-pulse">
                <span className="text-6xl">📋</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando Expediente...</span>
              </div>
            )}
          </div>
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
                if (caseQueue.length > 0) {
                  handleCaseTransition();
                } else {
                  send({ type: 'RESTART' });
                }
              }}
              className="btn-primary w-full py-6 text-xl shadow-[0_10px_0_rgba(135,206,235,0.3)]"
            >
              {caseQueue.length > 0 ? `SIGUIENTE PACIENTE (${caseQueue.length} restantes)` : 'FINALIZAR GUARDIA'}
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
              onClick={() => setShowRetro(true)}
              className="btn-primary w-full py-5 !bg-white border-2 border-moomin-accent/20 !text-moomin-accent shadow-sm hover:!bg-moomin-bg transition-all"
            >
              VER HISTORIAL DE GUARDIA
            </button>
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
    <div className={`fixed inset-0 bg-moomin-bg flex flex-col items-center select-none overflow-hidden text-moomin-text pt-6
      ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''}
      ${swipeFeedback === 'wrong' ? 'shake-lite' : ''}
      ${state.context.combo >= 15 ? 'combo-glow-3' : (state.context.combo >= 10 ? 'combo-glow-2' : (state.context.combo >= 5 ? 'combo-glow-1' : ''))}
    `}>
      {/* Background Ambience Layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-moomin-primary/10 to-transparent opacity-40" />
      </div>

      <TelemetryHUD 
        timeLeft={timeLeft} 
        state={state.value as string} 
        score={state.context.score}
        combo={state.context.combo}
        vitality={state.context.vitality}
        lives={state.context.lives}
      />

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
              animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }}
              transition={{ duration: 0.7, repeat: 2, type: 'spring' }}
              className="text-6xl font-display font-black text-moomin-text drop-shadow-[0_12px_20px_rgba(135,206,235,0.3)] tracking-tighter relative italic"
            >
              {showMilestoneCelebration >= 20 ? '🌈✨ LEYENDA' : showMilestoneCelebration >= 15 ? '⭐✨ SOÑADA' : showMilestoneCelebration >= 10 ? '🔥💪 IMPARABLE' : '⚡ ¡GENIAL!'}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-2xl font-black text-moomin-accent tracking-widest italic font-display"
            >
              {showMilestoneCelebration} ✨
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Status Label - Better visual feedback */}
      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex flex-col items-center gap-3"
          >
            {swipeFeedback === 'correct' ? (
              <>
                <motion.span
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl drop-shadow-[0_10px_15px_rgba(135,206,235,0.4)]"
                >
                  ✨
                </motion.span>
                <span className="text-5xl font-display font-black italic text-moomin-primary drop-shadow-lg tracking-tighter">
                  CORRECTO
                </span>
              </>
            ) : (
              <>
                <motion.span
                  animate={{ scale: [1, 1.1, 1], shake: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl drop-shadow-[0_10px_15px_rgba(255,159,127,0.4)]"
                >
                  ⚠️
                </motion.span>
                <span className="text-4xl font-display font-black italic text-moomin-accent drop-shadow-lg tracking-tighter">
                  REVISÁ
                </span>
              </>
            )}
            {swipeFeedback === 'correct' && (Date.now() - state.context.lastCardPresentedAt < 1200) && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="text-moomin-secondary font-black text-xl italic tracking-wider drop-shadow-sm"
              >
                ✦ DECISIÓN OPORTUNA ✦
              </motion.span>
            )}
            {state.context.showEureka && (
              <motion.span 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: [0, 1.5, 1], rotate: 0 }}
                className="text-moomin-primary font-black text-2xl drop-shadow-md mt-2 italic"
              >
                💡 CRITERIO DOBLE 💡
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
      
      {/* Mentor Feedback Area */}
      <div className="w-full flex justify-center z-[60] pointer-events-none mb-1">
        <ErrorBoundary fallback={<div className="h-40 flex items-center justify-center text-red-400 font-bold bg-red-400/10 rounded-xl border border-red-400/20 px-8">Error en Feedback del Mentor</div>}>
          <AvatarFeedback
            doctor={currentCase ? (currentCase.case_id.toLowerCase().includes('ped') ? 'castillo' : (currentCase.case_id.toLowerCase().includes('surg') ? 'mendoza' : 'navarro')) : 'navarro'}
            expression={expression}
            dialogueText={comment}
            isVisible={(!state.matches('idle') || showIntro) && !state.context.interruptionActive}
          />
        </ErrorBoundary>
      </div>

      {/* Tactical Dossier (Dossier Médico) */}
      {!state.matches('idle') && (
        <div className="fixed right-6 top-24 bottom-24 w-40 hidden lg:flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar pointer-events-none opacity-80 hover:opacity-100 transition-opacity z-10">
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
      <div className="w-full flex-grow flex items-center justify-center overflow-y-auto relative z-[70]">
        {renderCurrentView()}
      </div>

      {/* Footer */}
      {!state.matches('boss_fight') && (
        <div className="w-full max-w-md text-center opacity-30 py-4">
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

      {/* Critical Game Overlays (High priority z-index) */}
      <AnimatePresence>
        {state.context.activePenalty?.active && state.context.activePenalty.item && (
          <PenaltyOverlay 
            penalty={{ active: true, item: state.context.activePenalty.item }} 
            onAccept={() => {
              send({ type: 'CLEAR_OVERLAYS' });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.matches('fail_protection') && (
          <FailProtectionOverlay 
            error={state.context.fatalError || "Error Clínico Crítico"}
            livesRemaining={state.context.lives}
            onRescue={() => send({ type: 'RESCUE' })}
            onRestart={() => send({ type: 'RESTART' })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.context.activeEvent?.item && (
          <EventOverlay 
            event={{ type: state.context.activeEvent.type, item: state.context.activeEvent.item }} 
            onAccept={() => {
              send({ type: 'CLEAR_OVERLAYS' });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.context.lootBoxReward?.active && state.context.lootBoxReward.item && (
          <LootBoxOverlay 
            reward={{ active: true, item: state.context.lootBoxReward.item }} 
            onClaim={() => {
              const efecto = state.context.lootBoxReward?.item?.efecto;
              if (efecto && efecto.tipo === 'heal' && efecto.valor) {
                send({ type: 'APPLY_REWARD_HEAL', value: efecto.valor });
              } else {
                addCoins(50);
                send({ type: 'CLEAR_OVERLAYS' });
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Narrative & History Overlays (Lower priority than critical gameplay) */}
      <AnimatePresence>
        {showRetro && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <RetrospectiveView 
              history={state.context.feedbackHistory} 
              onClose={() => setShowRetro(false)}
              caseId={currentCase?.case_id}
            />
          </div>
        )}
      </AnimatePresence>

      <RewardToast toast={rewardToast} />


      {/* Pause overlay */}
      <AnimatePresence>
        {isPaused && !isProcessing && state.matches('triage') && (
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
              <p className="text-slate-400 text-sm font-medium mb-8">El expediente sigue abierto.</p>
              <div className="flex flex-col gap-4 w-full">
                <button
                  onClick={() => setIsPaused(false)}
                  className="btn-primary w-full py-4"
                >
                  REANUDAR GUARDIA
                </button>
                <button
                  onClick={() => {
                    setIsPaused(false);
                    send({ type: 'RESTART' });
                  }}
                  className="btn-primary w-full py-4 !bg-moomin-accent/10 !text-moomin-accent border-2 border-moomin-accent/20 shadow-none !italic"
                >
                  ABANDONAR GUARDIA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
