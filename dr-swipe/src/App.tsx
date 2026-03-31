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
        className="glass-panel-dark p-10 max-w-sm border border-primary/20 text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] relative"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 glow-border-primary" />
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-24 h-24 flex items-center justify-center text-7xl mx-auto mb-6 filter drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]"
        >
          👴
        </motion.div>
        <span className="neon-text-primary block mb-3 text-[10px]">
          DR. VÁZQUEZ — INTERRUPCIÓN
        </span>
        <h3 className="text-2xl font-display font-black text-white mb-4 tracking-tighter italic shadow-text uppercase">
          "{line.titulo}"
        </h3>
        <p className="text-base text-slate-300 italic font-medium mb-6 leading-relaxed px-2">
          "{line.cuerpo}"
        </p>
        <div className="h-1.5 w-16 bg-primary/20 mx-auto rounded-full" />
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
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] border-2 flex items-center gap-4 font-black italic tracking-tighter whitespace-nowrap backdrop-blur-xl
            ${toast.type === 'milestone' ? 'bg-secondary/40 border-secondary/60 text-white glow-border-primary' : 'bg-black/60 border-primary/40 text-primary glow-border-primary'}
          `}
        >
          <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{toast.type === 'milestone' ? '🏆' : '🪙'}</span>
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
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[160] p-6">
      <motion.div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      <motion.div
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="glass-panel-dark p-12 max-w-sm w-full text-center border-primary/30 shadow-[0_0_80px_rgba(0,229,255,0.2)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 glow-border-primary" />
        <motion.div 
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="text-8xl mb-8 inline-block filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          🎁
        </motion.div>
        
        <span className="neon-text-primary block mb-3 text-[10px]">SUMINISTROS TÉCNICOS</span>
        <h3 className="text-3xl font-display font-black text-white mb-6 uppercase tracking-tight italic">{reward.item.nombre}</h3>
        
        <div className="bg-primary/5 rounded-2xl p-6 mb-10 border border-primary/10 backdrop-blur-sm relative">
          <div className="absolute top-0 left-0 w-full h-full medical-grid opacity-10" />
          <p className="text-base font-medium text-slate-300 italic mb-1 leading-relaxed relative z-10">"{reward.item.texto}"</p>
        </div>

        <button
          onClick={onClaim}
          className="btn-primary w-full py-5 text-lg group"
        >
          <span className="flex items-center justify-center gap-3">
             INSTALAR MEJORA
             <span className="group-hover:translate-x-1 transition-transform">➡️</span>
          </span>
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
        className="absolute inset-0 bg-red-950/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="glass-panel-dark p-10 max-w-sm w-full text-center border-accent-alert/50 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-accent-alert/30 glow-border-alert" />
        <span className="neon-text-accent block mb-2 text-[10px]">CONSECUENCIA</span>
        <h3 className="text-3xl font-display font-black text-white mb-6 mt-2 leading-tight italic">{penalty.item.nombre}</h3>
        
        <div className="bg-accent-alert/10 rounded-2xl p-6 mb-8 border border-accent-alert/20 backdrop-blur-sm">
          <p className="text-base font-medium text-slate-200 italic mb-2 leading-relaxed">"{penalty.item.texto}"</p>
          <div className="h-1 w-8 bg-accent-alert/40 mx-auto rounded-full" />
        </div>

        <button
          onClick={onAccept}
          className="btn-primary w-full py-5 text-base !bg-accent-alert !shadow-[0_0_40px_rgba(255,45,85,0.4)] !text-white"
        >
           ENTENDIDO <span className="ml-2">☠️</span>
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
      case 'lab': return { accent: 'text-primary', glow: 'shadow-[0_0_30px_rgba(0,229,255,0.3)]', title: 'TÉCNICO DE LABORATORIO', icon: '🧪' };
      case 'archive': return { accent: 'text-secondary', glow: 'shadow-[0_0_30px_rgba(167,139,250,0.3)]', title: 'ENCARGADO DE ARCHIVO', icon: '🗄️' };
      default: return { accent: 'text-accent-alert', glow: 'shadow-[0_0_30px_rgba(255,45,85,0.3)]', title: 'SISTEMA INSTITUCIONAL', icon: '⚠️' };
    }
  };
  
  const style = getStyle();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[160] p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.88, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        className="glass-panel-dark p-12 max-w-sm w-full text-center border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative"
      >
        <div className={`absolute top-0 left-0 w-full h-1.5 opacity-50 ${event.type === 'lab' ? 'bg-primary' : event.type === 'archive' ? 'bg-secondary' : 'bg-accent-alert'}`} />
        
        <span className={`text-5xl mb-8 block filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]`}>{style.icon}</span>
        <span className="text-[10px] font-black tracking-[0.5em] text-slate-500 uppercase block mb-4 italic">PROCEDIMIENTO: {style.title}</span>
        
        <h3 className="text-2xl font-display font-black text-white mb-8 mt-2 italic shadow-text uppercase tracking-tight leading-tight px-2">
          {event.item.nombre}
        </h3>
        
        <div className="rounded-[2.5rem] p-8 mb-10 border border-white/5 bg-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full medical-grid opacity-5" />
          <p className="text-base font-medium text-slate-300 italic mb-1 leading-relaxed relative z-10">
            "{event.item.texto || (event.item.frases && event.item.frases.start) || '...'}"
          </p>
        </div>

        <button
          onClick={onAccept}
          className={`btn-primary w-full py-6 text-base ${event.type === 'lab' ? '' : event.type === 'archive' ? '!bg-secondary shadow-[0_4px_0_#7c3aed,0_8px_30px_rgba(167,139,250,0.4)]' : '!bg-accent-alert shadow-[0_4px_0_#e11d48,0_8px_30px_rgba(255,45,85,0.4)]'}`}
        >
           CONFIRMAR RECEPCIÓN <span className="ml-2 font-serif">→</span>
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
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-panel-dark p-10 max-w-md w-full text-center border-accent-alert/40 shadow-[0_0_100px_rgba(255,45,85,0.2)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-accent-alert/20 glow-border-alert" />
        
        <div className="text-7xl mb-8 filter drop-shadow-[0_0_20px_rgba(255,45,85,0.5)]">🚑</div>
        
        <span className="neon-text-accent block mb-2 text-xs">INCIDENTE CRÍTICO</span>
        <h3 className="text-4xl font-display font-black text-white mb-6 mt-2 leading-tight tracking-tighter italic shadow-text">INTERNO RELEVADO</h3>
        
        <div className="bg-black/40 rounded-[2rem] p-8 mb-10 border border-accent-alert/10 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full medical-grid opacity-10" />
          <p className="text-[11px] font-black text-accent-alert uppercase tracking-[0.3em] mb-3 relative z-10">MOTIVO DEL RELEVO:</p>
          <p className="text-lg font-medium text-slate-200 italic leading-relaxed relative z-10">"{error}"</p>
        </div>

        <div className="flex flex-col gap-5 relative z-10">
          <button
            onClick={onRescue}
            className="btn-primary w-full py-6 text-xl flex flex-col items-center justify-center gap-2 group"
          >
            <span className="text-sm font-black tracking-[0.3em]">LLAMAR REFUERZO</span>
            <span className="text-[11px] opacity-70 font-bold tracking-widest uppercase">QUEDAN {livesRemaining - 1} INTERNOS DISPONIBLES</span>
          </button>
          
          <button
            onClick={onRestart}
            className="text-[12px] font-black text-slate-500 hover:text-accent-alert uppercase tracking-[0.4em] py-3 transition-all hover:scale-105"
          >
            — Finalizar Guardia —
          </button>
        </div>

        {/* Intern icons representation */}
        <div className="mt-12 pt-8 border-t border-white/5 flex justify-center gap-5 relative z-10">
            {[...Array(5)].map((_, i) => (
                <motion.div 
                    key={i}
                    animate={i === livesRemaining - 1 ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border ${i < livesRemaining ? 'bg-primary border-primary/40 glow-border-primary' : 'bg-slate-800 border-white/5'}`}
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
    <div className="fixed top-4 left-4 right-4 z-[100] flex items-center justify-between glass-panel p-3 px-5 border-primary/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-slate-900/80 backdrop-blur-xl rounded-2xl glow-border-primary">
      {/* Left: Score & Vitality (Life) */}
      <div className="flex items-center gap-5 flex-1">
        <div className="flex flex-col gap-1 min-w-fit">
          <span className="text-[7px] font-black tracking-[0.3em] text-primary/60 uppercase leading-none">Pts</span>
          <motion.span
            key={score}
            initial={{ scale: 1.5, color: '#22D3EE' }}
            animate={{ scale: 1, color: '#F8FAFC' }}
            className="text-xl font-display font-black leading-none drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
          >
            {Math.max(0, score)}
          </motion.span>
        </div>

        <div className="w-px h-8 bg-white/10" />

        <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
          <span className="text-[7px] font-black tracking-[0.3em] text-primary/60 uppercase leading-none">Salud</span>
          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
            <div className="absolute inset-0 bg-primary/20 blur-[2px]" />
            <motion.div
              initial={{ width: '100%' }}
              animate={{
                width: `${vitality}%`,
                backgroundColor: vitality > 60 ? '#22D3EE' : vitality > 30 ? '#F59E0B' : '#FB7185'
              }}
              className="h-full transition-colors duration-500 relative z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
          <span className="text-[7px] text-white/50 font-black">{vitality}%</span>
        </div>
      </div>

      {/* Interns (Lives) display */}
      <div className="flex items-center gap-3 ml-2">
        <div className="flex flex-col items-center gap-1">
            <span className="text-[7px] font-black text-primary/60 tracking-[0.3em] uppercase">Equipo</span>
            <div className="flex gap-1.5 items-center">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            scale: i < lives ? 1 : 0.7,
                            opacity: i < lives ? 1 : 0.2,
                            backgroundColor: i < lives ? '#22D3EE' : '#334155',
                            boxShadow: i < lives ? '0 0 10px rgba(34,211,238,0.6)' : 'none'
                        }}
                        className="w-2 h-2 rounded-full border border-white/20"
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Center: Combo Pill (Only if > 1) */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            initial={{ y: -15, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -15, opacity: 0, scale: 0.9 }}
            className={`px-4 py-2 rounded-full border-2 text-[11px] font-black tracking-widest shadow-lg backdrop-blur-md ${
              combo >= 15 ? 'bg-primary/20 border-primary text-primary animate-pulse glow-border-primary' :
              combo >= 10 ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-black glow-border-primary' :
              'bg-secondary/20 border-secondary text-secondary'
            }`}
          >
            🔥 {combo} ACIERTOS
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Timer */}
      {state !== 'boss_fight' && (
        <div className="flex items-center gap-2 ml-2">
          <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-full border border-white/10 shadow-inner">
            <span className="text-[7px] font-black tracking-[0.3em] text-primary/60 uppercase leading-none">⏱️</span>
            <span className={`text-base font-mono font-black leading-none tabular-nums ${timeLeft <= 10 ? 'text-accent-alert animate-pulse drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]' : 'text-white'}`}>
              {timeLeft.toString().padStart(2, '0')}s
            </span>
            {timeLeft <= 10 && <div className={`w-2 h-2 rounded-full bg-accent-alert animate-ping shadow-[0_0_10px_rgba(251,113,133,1)]`} />}
          </div>
        </div>
      )}
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
  // Retrospective view toggle
  const [showRetro, setShowRetro] = useState(false);
  const [caseQueue, setCaseQueue] = useState<ClinicalCase[]>([]);
  const [rewardToast, setRewardToast] = useState<{ show: boolean; text: string; type: 'coins' | 'xp' | 'milestone' }>({
    show: false,
    text: '',
    type: 'coins'
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  if (loadError) console.error("Critical Load Error:", loadError);

  // Dynamic Background Theming — High-Intensity Doc-Punk Palette
  useEffect(() => {
    if (currentCase) {
      const colors: Record<string, string> = {
        ped: '255, 45, 85',   // Neon Rose/Pink
        surg: '255, 115, 0',  // Neon Orange
        obs: '0, 229, 255',   // Neon Cyan
        gyn: '217, 70, 239',  // Neon Fuchsia
        im: '129, 140, 248',  // Indigo Medical
        gast: '251, 191, 36', // Neon Amber
        card: '239, 68, 68',  // Pure Red
        endo: '249, 115, 22', // Orange Red
        inf: '16, 185, 129',  // Emerald Green
        neur: '139, 92, 246', // Deep Violet
        prev: '45, 212, 191', // Teal
        stats: '15, 23, 42',  // Dark Slate
        engl: '248, 250, 252' // Polar Blue
      };
      const key = Object.keys(colors).find(k => currentCase.case_id.toLowerCase().includes(k)) || 'default';
      const rgb = colors[key] || '0, 229, 255';
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

  // Auto-dismiss Avatar Feedback after 6 seconds
  useEffect(() => {
    if (comment) {
      const dismissTimer = setTimeout(() => {
        setComment(null);
        setSwipeFeedback(null);
        setExpression('neutral');
      }, 6000);
      return () => clearTimeout(dismissTimer);
    }
  }, [comment]);

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
      const difficultyColor = currentCase.difficulty === 'extreme' ? 'text-accent-alert border-accent-alert/20 bg-accent-alert/5' : currentCase.difficulty === 'hard' ? 'text-orange-400 border-orange-200 bg-orange-50' : 'text-primary border-primary/20 bg-primary/5';
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
              <div className="flex flex-col items-center gap-4 text-slate-500/40 animate-pulse">
                <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">📋</span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando Expediente...</span>
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
              className="absolute inset-0 bg-accent-alert/20"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-[10rem] mb-12 filter drop-shadow-[0_0_40px_rgba(255,45,85,0.6)]"
            >
              🚨
            </motion.div>
            <h2 className="text-7xl font-display font-black text-white tracking-tighter text-glow-danger uppercase italic shadow-text">
              CÓDIGO ROJO
            </h2>
            <p className="neon-text-accent mt-8 text-sm">
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
              <div className="text-center z-10 px-8">
                <span className="neon-text-accent block mb-3 text-[10px]">PROTOCOLO DE EMERGENCIA</span>
                <h2 className="text-4xl font-display font-black text-white italic tracking-tighter mb-4 shadow-text uppercase">ESTABILIZACIÓN MANUAL</h2>
                <div className="h-1.5 w-40 bg-accent-alert/30 mx-auto mb-8 rounded-full glow-border-alert" />
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] leading-relaxed">Mantén el ritmo pulsando el núcleo</p>
              </div>

              {/* Stabilization Heart/Core */}
              <div className="relative group p-14">
                <div className="absolute inset-0 bg-accent-alert/10 blur-[80px] rounded-full animate-pulse group-hover:opacity-30 transition-opacity" />
                <motion.div
                  animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 20px rgba(255,45,85,0)', '0 0 40px rgba(255,45,85,0.3)', '0 0 20px rgba(255,45,85,0)'] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="w-56 h-56 rounded-full border-4 border-accent-alert/40 flex items-center justify-center relative z-10 cursor-pointer active:scale-95 transition-all bg-black/20 backdrop-blur-md"
                  onClick={() => {
                    triggerHaptic('qteInteract');
                    send({ type: 'QTE_INTERACT' });
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-8xl filter drop-shadow-[0_0_20px_rgba(255,45,85,0.6)]">❤️</span>
                    <span className="neon-text-accent mt-8 text-[11px] animate-gentle-bounce">PULSAR</span>
                  </div>
                </motion.div>
              </div>

              {/* QTE Timer */}
              <div className="w-full max-w-xs space-y-6 text-center mt-6">
                <div className="text-5xl font-black text-white font-mono mb-2 tracking-tighter">
                  {state.context.qteTimeLeft}<span className="text-2xl text-slate-600">s</span>
                </div>
                <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                  <motion.div
                    animate={{ width: [`${(state.context.qteTimeLeft / 5) * 100}%`] }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-accent-alert rounded-full shadow-[0_0_20px_rgba(255,45,85,0.6)]"
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
            className="glass-panel-dark p-12 max-w-md text-center border-primary/20 shadow-[0_0_100px_rgba(34,211,238,0.15)] relative overflow-hidden"
          >
            {/* Particle burst on reward - High Intensity */}
            {[...Array(20)].map((_, i) => {
              const angle = (i / 20) * 360;
              const rad = (angle * Math.PI) / 180;
              const dist = 120 + Math.random() * 100;
              return (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
                  style={{ backgroundColor: i % 3 === 0 ? '#00E5FF' : i % 3 === 1 ? '#FF2D55' : '#00F5D4' }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 1.2, delay: 0.1 + i * 0.02, ease: 'easeOut' }}
                />
              );
            })}

            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10 border border-primary/20 shadow-[0_0_30px_rgba(0,229,255,0.2)]"
            >
              <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(0,229,255,0.6)]">🌈</span>
            </motion.div>

            {state.context.caseStreak > 1 && (
              <motion.div
                initial={{ y: -15, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-6 inline-block bg-primary/10 text-primary px-6 py-2 rounded-full text-[11px] font-black tracking-[0.3em] border border-primary/20 relative z-10 uppercase"
              >
                🔥 RACHA ACTIVA: x{state.context.caseStreak}
              </motion.div>
            )}

            <div className="absolute top-8 right-8 z-20">
              <button
                onClick={() => setShowRetro(true)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl hover:bg-white/10 transition-all hover:scale-110 shadow-lg backdrop-blur-md"
                title="Ver Resumen de Guardia"
              >
                 📔
              </button>
            </div>

            <h2 className="text-5xl font-display font-black text-white mb-4 tracking-tighter italic relative z-10 shadow-text">
              ¡EXCELENTE!
            </h2>
            <p className="text-slate-400 mb-8 font-medium italic text-lg leading-relaxed relative z-10 px-6">
              "El paciente se encuentra estable. Tu razonamiento clínico ha sido impecable."
            </p>

            {/* Perfect Round Badge - High Tech */}
            {state.context.mistakesThisCase === 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="mb-10 inline-block bg-primary/15 text-primary px-8 py-3 rounded-2xl text-[10px] font-black tracking-[0.4em] border border-primary/40 relative z-10 shadow-[0_0_30px_rgba(0,229,255,0.2)] uppercase"
              >
                ✨ Guardia Perfecta ✨
              </motion.div>
            )}

            {/* Score breakdown - Tech Card style */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 mb-10 text-left relative z-10 shadow-inner overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-full h-full medical-grid opacity-5" />
              <div className="flex justify-between items-center mb-6 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">REPORTE DE SESIÓN</span>
                <span className="text-[10px] font-mono font-bold text-primary/60">{currentCase?.case_id?.slice(-8) || '---'}</span>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Experiencia</span>
                  <span className="text-3xl font-display font-black text-primary">+{Math.max(0, state.context.score)}</span>
                </div>
                <div className="flex justify-between items-end border-t border-white/5 pt-6">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Monedas GDC</span>
                  <span className="text-3xl font-display font-black text-secondary">+{state.context.coinsEarnedThisCase}</span>
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
            className="glass-panel-dark p-12 max-w-md text-center border-accent-alert/30 shadow-[0_0_100px_rgba(255,45,85,0.15)] relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 bg-accent-alert/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent-alert/20"
            >
              <span className="text-5xl filter drop-shadow-[0_0_20px_rgba(255,45,85,0.6)]">👻</span>
            </motion.div>

            <h2 className="text-5xl font-display font-black text-white mb-4 tracking-tighter italic uppercase shadow-text">
              DESERTADO
            </h2>
            <p className="text-slate-400 mb-10 font-medium italic text-lg leading-relaxed px-6">
              "El paciente ha abandonado la sala por falta de atención oportuna."
            </p>

            <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 mb-10 text-left shadow-inner relative overflow-hidden">
               <div className="absolute top-0 right-0 w-full h-full medical-grid opacity-5" />
               <span className="neon-text-accent block mb-3 text-[10px]">MOTIVO DEL FALLO</span>
               <p className="text-base text-slate-200 font-medium italic leading-relaxed relative z-10">
                 {state.context.fatalError || "El tiempo de guardia ha expirado sin una resolución clínica adecuada."}
               </p>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowRetro(true)}
                className="w-full py-5 text-[11px] font-black tracking-[0.4em] text-slate-400 bg-black/20 border border-white/10 rounded-2xl hover:bg-black/40 transition-all uppercase"
              >
                VER HISTORIAL DE GUARDIA
              </button>
              <button
                onClick={() => {
                  triggerHaptic('lethalError');
                  send({ type: 'RESTART' });
                }}
                className="btn-primary w-full py-6 text-xl !bg-accent-alert !shadow-[0_0_40px_rgba(255,45,85,0.4)] !text-white"
              >
                REINTENTAR CONSULTA
              </button>
            </div>
          </motion.div>
        );

      case state.matches('debrief'):
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel-dark p-12 max-w-md text-left border-accent-alert/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-8">
              <span className="neon-text-accent text-[10px]">
                ERROR DETECTADO
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest tracking-tighter">REF-ID: {currentCase?.case_id?.slice(-8) || '---'}</span>
            </div>

            <div className="mb-10 p-8 bg-accent-alert/5 border-l-4 border-accent-alert rounded-r-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full medical-grid opacity-5" />
              <p className="text-[10px] text-accent-alert font-black mb-4 flex items-center gap-3 tracking-[0.3em] uppercase relative z-10">
                <span className="w-2.5 h-2.5 bg-accent-alert rounded-full animate-pulse shadow-[0_0_10px_rgba(255,45,85,0.6)]" />
                NOTA DE SUPERVISIÓN:
              </p>
              <p className="text-lg text-white italic font-medium leading-[1.6] relative z-10">
                "{state.context.debriefData?.comment}"
              </p>
            </div>

            <div className="mb-10 pb-8 border-b border-white/5">
              <div className="text-[10px] text-slate-500 mb-4 font-black uppercase tracking-[0.4em]">EXPLICACIÓN CLÍNICA:</div>
              <p className="text-base text-slate-300 leading-relaxed font-medium bg-black/40 p-6 rounded-3xl border border-white/5 italic">
                {state.context.debriefData?.text}
              </p>
            </div>

            <div className="flex items-center justify-between mb-10">
              <span className="text-sm font-black text-primary italic border-b-2 border-primary/40 pb-1 tracking-widest uppercase">GPC: {state.context.debriefData?.gpc}</span>
            </div>

            <div className="flex flex-col gap-5">
              <button
                 onClick={() => setShowRetro(true)}
                 className="w-full py-5 text-[11px] font-black tracking-[0.4em] text-slate-400 bg-black/20 border border-white/10 rounded-2xl hover:bg-black/40 transition-all uppercase"
              >
                VER HISTORIAL COMPLETO
              </button>

              <button 
                onClick={() => send({ type: 'RESTART' })} 
                className="btn-primary w-full py-6 text-xl shadow-[0_10px_0_rgba(0,229,255,0.2)]"
              >
                VOLVER A GUARDIA
              </button>
            </div>
          </motion.div>
        );

      case state.matches('critical_warning'):
        return (
          <div className="fixed inset-0 bg-accent-alert/20 backdrop-blur-3xl flex flex-col items-center justify-center z-[100]">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-9xl mb-12 filter drop-shadow-[0_0_30px_rgba(255,45,85,0.6)]"
            >
              ⚠️
            </motion.div>
            <h2 className="text-6xl font-display font-black text-white italic tracking-tighter uppercase shadow-text">ADVERTENCIA CRÍTICA</h2>
            <p className="text-2xl text-slate-200 mt-8 px-16 text-center font-bold italic max-w-2xl leading-relaxed">
              "{state.context.fatalError}"
            </p>
            <p className="mt-16 neon-text-primary text-xs tracking-[0.6em] animate-pulse">REINTENTANDO ESTABILIZACIÓN...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-slate-950 flex flex-col items-center select-none overflow-hidden text-white pt-6
      ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''}
      ${swipeFeedback === 'wrong' ? 'shake-lite' : ''}
      ${state.context.combo >= 15 ? 'combo-glow-3' : (state.context.combo >= 10 ? 'combo-glow-2' : (state.context.combo >= 5 ? 'combo-glow-1' : ''))}
    `}>
      {/* Background Ambience Layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-x-0 top-0 h-[50vh] bg-gradient-to-b from-primary/10 to-transparent opacity-30" />
        <div className="absolute inset-0 medical-grid opacity-[0.03]" />
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
            className={`fixed inset-0 z-0 pointer-events-none ${swipeFeedback === 'correct' ? 'bg-primary' : 'bg-accent-alert'}`}
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
                className="absolute w-24 h-24 rounded-full border-2 border-secondary/30"
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 3 + i, opacity: 0 }}
                transition={{ duration: 0.9, delay: i * 0.18, ease: 'easeOut' }}
              />
            ))}
            <motion.span
              animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }}
              transition={{ duration: 0.7, repeat: 2, type: 'spring' }}
              className="text-6xl font-display font-black text-white drop-shadow-[0_12px_20px_rgba(0,229,255,0.4)] tracking-tighter relative italic"
            >
              {showMilestoneCelebration >= 20 ? '🌈✨ LEYENDA' : showMilestoneCelebration >= 15 ? '⭐✨ SOÑADA' : showMilestoneCelebration >= 10 ? '🔥💪 IMPARABLE' : '⚡ ¡GENIAL!'}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-2xl font-black text-accent-alert tracking-widest italic font-display"
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
                  className="text-6xl drop-shadow-[0_10px_15px_rgba(34,211,238,0.6)]"
                >
                  ✨
                </motion.span>
                <span className="text-5xl font-display font-black italic text-primary drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] tracking-tighter">
                  CORRECTO
                </span>
              </>
            ) : (
              <>
                <motion.span
                  animate={{ scale: [1, 1.1, 1], x: [0, -5, 5, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl drop-shadow-[0_10px_15px_rgba(251,113,133,0.6)]"
                >
                  ⚠️
                </motion.span>
                <span className="text-4xl font-display font-black italic text-accent-alert drop-shadow-[0_0_10px_rgba(251,113,133,0.8)] tracking-tighter">
                  REVISÁ
                </span>
              </>
            )}
            {swipeFeedback === 'correct' && (Date.now() - state.context.lastCardPresentedAt < 1200) && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="text-secondary font-black text-xl italic tracking-wider drop-shadow-sm"
              >
                ✦ DECISIÓN OPORTUNA ✦
              </motion.span>
            )}
            {state.context.showEureka && (
              <motion.span 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: [0, 1.5, 1], rotate: 0 }}
                className="text-primary font-black text-2xl drop-shadow-md mt-2 italic shadow-text"
              >
                💡 CRITERIO DOBLE 💡
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Red-Out Vignette Effect - Now Neon Accent (Rose) */}
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
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 border-b border-white/5 pb-2 italic text-center">Dossier Clínico</span>
          <AnimatePresence>
            {state.context.dossier.map((card, idx) => (
              <motion.div 
                key={`${card.card_id}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-2xl bg-black/60 border border-white/5 text-[10px] flex flex-col gap-2 shadow-lg relative overflow-hidden backdrop-blur-md ${state.context.showEureka && idx >= state.context.dossier.length - 3 ? 'eureka-glow ring-2 ring-primary/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : ''}`}
              >
                <div className="absolute top-0 left-0 w-full h-full medical-grid opacity-5 pointer-events-none" />
                <span className="text-primary font-black uppercase tracking-widest text-[8px] relative z-10">{card.category}</span>
                <span className="text-slate-200 font-medium italic leading-loose line-clamp-2 relative z-10">{card.card_text}</span>
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
              className="glass-panel-dark p-12 max-w-xs w-full text-center border-primary/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 glow-border-primary" />
              <span className="neon-text-primary block mb-6 text-[11px]">INTERRUPCIÓN DE GUARDIA</span>
              <p className="text-5xl mb-8 filter drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]">⏸</p>
              <p className="text-slate-400 text-sm font-medium mb-10 italic">El expediente clínico permanece abierto. Los protocolos están en espera.</p>
              <div className="flex flex-col gap-5 w-full">
                <button
                  onClick={() => setIsPaused(false)}
                  className="btn-primary w-full py-5 text-sm"
                >
                  REANUDAR PROTOCOLO
                </button>
                <button
                  onClick={() => {
                    setIsPaused(false);
                    send({ type: 'RESTART' });
                  }}
                  className="w-full py-4 text-[11px] font-black tracking-[0.4em] text-slate-500 hover:text-accent-alert transition-all uppercase italic border border-white/5 hover:border-accent-alert/30 rounded-2xl"
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
