import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, TriangleAlert, Check, X } from 'lucide-react';
import type { BossQuestion, Card } from '../types/game';
import { useGameAudio } from '../hooks/useGameAudio';
import { triggerHaptic } from '../utils/hapticFeedback';
import { shuffleBossQuestion } from '../utils/formatters';

interface ShockRoomProps {
  questions: BossQuestion[];
  dossierItems: Card[];
  onSurvive: () => void;
  onGhosted: (error: string) => void;
}

// Every step gets the same window instead of the first one arbitrarily
// getting 15s and the rest 12s (F7).
const STEP_TIME_LIMIT = 12;
const MAX_WRONG_ATTEMPTS = 2; // Allow 2 wrong answers before game over

// Beats between answers. The clock is stopped and the options locked while
// one plays: a correct answer used to cut straight to the next question (and
// the last one straight to the reward screen) with no acknowledgement.
const CORRECT_BEAT_MS = 450;
const STABILIZED_BEAT_MS = 900;
// On a final failure the right option stays lit long enough to read it.
const REVEAL_BEAT_MS = 1600;

type Beat =
  | { kind: 'correct'; picked: number }
  | { kind: 'stabilized'; picked: number }
  | { kind: 'wrong'; picked: number }
  | { kind: 'reveal'; picked: number | null; error: string };

export const ShockRoom: React.FC<ShockRoomProps> = ({
  questions: questionsProp,
  dossierItems,
  onSurvive,
  onGhosted
}) => {
  const { playFeedback, playBossCorrect, startTriageAlarm, stopTriageAlarm } = useGameAudio();
  // Options are reshuffled on every mount: a retry after a failure (the boss
  // checkpoint) must not be beaten by remembering positions.
  const [questions] = useState(() => questionsProp.map(q => shuffleBossQuestion(q)));
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(STEP_TIME_LIMIT);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [beat, setBeat] = useState<Beat | null>(null);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const totalSteps = questions.length;
  const question = questions[currentStep];
  const locked = beat !== null && beat.kind !== 'wrong';
  // App passes fresh closures on every render; a ref keeps the beat timer
  // below from restarting whenever the parent re-renders.
  const exitRef = useRef({ onSurvive, onGhosted });
  useEffect(() => { exitRef.current = { onSurvive, onGhosted }; });

  // Leaving the app freezes the clock: a phone call must not lose the case.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (locked || hidden || timeLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setTimeLeft(timeLeft - 1);
      if (timeLeft <= 1) setBeat({ kind: 'reveal', picked: null, error: 'El tiempo se agotó en la fase crítica.' });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, locked, hidden]);

  // The most tense phase of the game was completely silent (F7): reuse the
  // same clock-tick urgency cue the triage timer already has.
  useEffect(() => {
    if (!locked && !hidden && timeLeft > 0 && timeLeft <= 5) {
      startTriageAlarm();
    } else {
      stopTriageAlarm();
    }
  }, [timeLeft, locked, hidden, startTriageAlarm, stopTriageAlarm]);

  // Resolve each beat once it has played.
  useEffect(() => {
    if (!beat) return;
    if (beat.kind === 'wrong') {
      const t = window.setTimeout(() => setBeat(null), 500);
      return () => clearTimeout(t);
    }
    const delay = beat.kind === 'correct' ? CORRECT_BEAT_MS : beat.kind === 'stabilized' ? STABILIZED_BEAT_MS : REVEAL_BEAT_MS;
    const t = window.setTimeout(() => {
      if (beat.kind === 'correct') {
        setBeat(null);
        setCurrentStep(prev => prev + 1);
        setTimeLeft(STEP_TIME_LIMIT); // Refresh time for next step
      } else if (beat.kind === 'stabilized') {
        exitRef.current.onSurvive();
      } else {
        exitRef.current.onGhosted(beat.error);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [beat]);

  const handleAnswer = (selectedIndex: number) => {
    if (locked) return;
    const isCorrect = selectedIndex === question.correct_index;
    if (isCorrect) {
      playBossCorrect();
      triggerHaptic('correctCritical');
      setWrongAttempts(0); // Reset on correct answer
      setBeat({ kind: currentStep + 1 >= totalSteps ? 'stabilized' : 'correct', picked: selectedIndex });
      return;
    }
    playFeedback('wrong');
    triggerHaptic('warning');
    const nextAttempts = wrongAttempts + 1;
    setWrongAttempts(nextAttempts);
    setBeat(nextAttempts >= MAX_WRONG_ATTEMPTS
      ? { kind: 'reveal', picked: selectedIndex, error: 'Decisión crítica errónea bajo presión.' }
      : { kind: 'wrong', picked: selectedIndex });
  };

  const optionState = (idx: number): 'right' | 'wrong' | 'idle' => {
    if (!beat) return 'idle';
    if ((beat.kind === 'correct' || beat.kind === 'stabilized') && beat.picked === idx) return 'right';
    if (beat.kind === 'reveal' && idx === question.correct_index) return 'right';
    if ((beat.kind === 'wrong' || beat.kind === 'reveal') && beat.picked === idx) return 'wrong';
    return 'idle';
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center pt-28 sm:pt-32 pb-4 sm:pb-6 px-4 sm:px-6 bg-paper/90 backdrop-blur-md overflow-y-auto">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />

      <motion.div
        initial={{ scale: 0.9, y: 20, rotate: -2 }}
        animate={beat?.kind === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0, rotate: 0 }}
        transition={beat?.kind === 'wrong' ? { duration: 0.4 } : { duration: 0.3 }}
        className="paper-sheet p-4 sm:p-8 md:p-12 max-w-2xl w-full shadow-2xl relative bg-white border-2 border-rose-100 flex flex-col"
      >
        {/* Washi Tape Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-10 washi-tape -rotate-1 shadow-sm border-x-2 border-white/40 z-20" />

        {/* Stamp for a correct answer / a stabilized patient */}
        <AnimatePresence>
          {(beat?.kind === 'correct' || beat?.kind === 'stabilized') && (
            <motion.div
              key={`${beat.kind}-${currentStep}`}
              initial={{ scale: 1.8, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: -6 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              className="absolute top-16 right-4 sm:right-8 z-30 pointer-events-none bg-white/95 text-emerald-600 border-4 border-emerald-500 rounded-xl px-3 py-1 lettering font-bold text-lg sm:text-2xl shadow-md"
            >
              {beat.kind === 'stabilized' ? '¡ESTABILIZADO!' : 'CORRECTO ✓'}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center mb-3 sm:mb-8 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-rose-500 font-black text-xs tracking-[0.3em] uppercase lettering">Fase Crítica</span>
            <div className="h-1.5 w-16 bg-rose-200 rounded-full" />
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-6 sm:py-2 rounded-2xl border-2 font-bold lettering text-lg sm:text-2xl tabular-nums transition-colors ${timeLeft <= 5 && !locked ? 'bg-rose-500 text-white border-white animate-pulse' : 'bg-slate-50 text-slate-700 border-white'}`}>
            <Timer className="w-5 h-5" aria-hidden="true" /> {Math.max(0, timeLeft)}s
          </div>
        </div>

        <div className="mb-3 sm:mb-10 relative z-10">
            <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] lettering">Progreso del caso</span>
              <div className="flex gap-4 items-center">
                <span className="text-xs font-bold text-slate-500 lettering">{currentStep + 1} / {totalSteps}</span>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border-2 border-white p-0.5 shadow-inner">
                <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentStep + (beat?.kind === 'correct' || beat?.kind === 'stabilized' ? 1 : 0)) / totalSteps) * 100}%` }}
                   className="h-full bg-emerald-400 rounded-full"
                />
            </div>
        </div>

        {beat?.kind === 'reveal' ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold mb-4 flex items-center gap-2"
          >
            <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>La respuesta era: <strong>{question.options[question.correct_index]}</strong></span>
          </motion.div>
        ) : wrongAttempts > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold mb-4 flex items-center gap-2"
          >
            <TriangleAlert className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Opción incorrecta. Revisa el diario y los vitales. ¡Queda {MAX_WRONG_ATTEMPTS - wrongAttempts} intento crítico!</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-3 sm:mb-10 relative z-10 flex-1 flex flex-col w-full"
          >
            <h3 className="text-lg sm:text-2xl md:text-4xl font-bold text-slate-800 mb-2 sm:mb-6 leading-tight lettering tracking-tight">
              {question.question || question.q}
            </h3>

            <div className="flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-1 sm:pr-2">
              {question.options.map((opt: string, idx: number) => {
                const st = optionState(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={locked}
                    className={`paper-sheet p-2.5 sm:p-5 text-left transition-all group flex items-center gap-2 sm:gap-4 border-2 flex-shrink-0 ${
                      st === 'right' ? 'border-emerald-400 bg-emerald-50'
                        : st === 'wrong' ? 'border-rose-300 bg-rose-50'
                        : 'border-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors flex-shrink-0 ${
                      st === 'right' ? 'border-emerald-500 bg-emerald-500 text-white'
                        : st === 'wrong' ? 'border-rose-400 bg-rose-400 text-white'
                        : 'border-slate-200 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500'
                    }`}>
                      {st === 'right' ? <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                        : st === 'wrong' ? <X className="w-4 h-4" strokeWidth={3} aria-hidden="true" />
                        : String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm sm:text-lg font-bold text-slate-600 group-hover:text-slate-800 lettering">{opt}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Marginal notes for previous findings (Dossier) */}
        <div className="mt-3 sm:mt-8 pt-3 sm:pt-6 border-t-2 border-slate-50 flex flex-wrap gap-3 opacity-60">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block w-full mb-2 lettering italic">Hallazgos registrados en el diario:</span>
            {dossierItems.slice(-3).map((item, idx) => (
                <span key={idx} className="bg-slate-50 px-4 py-1.5 rounded-full text-xs lettering font-bold border-2 border-white max-w-[200px] truncate" title={item.card_text}>
                   📌 {item.card_text.length > 40 ? `${item.card_text.slice(0, 40)}...` : item.card_text}
                </span>
            ))}
        </div>
      </motion.div>
    </div>
  );
};
