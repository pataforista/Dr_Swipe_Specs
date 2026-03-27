import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BossQuestion, Card } from '../types/game';
import GlitchText from './bits/GlitchText';

interface ShockRoomProps {
  questions: BossQuestion[];
  dossierItems: Card[];
  onSurvive: () => void;
  onGhosted: (reason: string) => void;
}

type AnswerState = null | 'correct' | 'wrong';

export const ShockRoom: React.FC<ShockRoomProps> = ({
  questions,
  onSurvive,
  onGhosted
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const q = questions[currentQIndex];

  const handleAnswer = (idx: number) => {
    if (answerState !== null) return; // prevent double-click during feedback

    setSelectedIdx(idx);

    if (idx === q.correct_index) {
      setAnswerState('correct');
      setTimeout(() => {
        setAnswerState(null);
        setSelectedIdx(null);
        if (currentQIndex === questions.length - 1) {
          onSurvive();
        } else {
          setCurrentQIndex(prev => prev + 1);
        }
      }, 700);
    } else {
      setAnswerState('wrong');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
      setTimeout(() => {
        const errorMessage = q.q || q.question || 'Pregunta desconocida';
        onGhosted(`Fallo crítico en el Shock Room: ${errorMessage}`);
      }, 900);
    }
  };

  if (!q) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center z-[100] backdrop-blur-xl medical-grid overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-slate-950/40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent-alert/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Answer feedback overlay flash */}
      <AnimatePresence>
        {answerState === 'correct' && (
          <motion.div
            key="correct-flash"
            className="absolute inset-0 bg-primary/10 pointer-events-none z-[150] shadow-[inset_0_0_100px_rgba(34,211,238,0.2)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
          />
        )}
        {answerState === 'wrong' && (
          <motion.div
            key="wrong-flash"
            className="absolute inset-0 bg-accent-alert/20 pointer-events-none z-[150] shadow-[inset_0_0_100px_rgba(251,113,133,0.3)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4] }}
            transition={{ duration: 0.7 }}
          />
        )}
      </AnimatePresence>

      {/* Answer result banner */}
      <AnimatePresence>
        {answerState && (
          <motion.div
            key={answerState}
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[160] pointer-events-none
              text-5xl font-display font-black tracking-[0.2em] uppercase italic
              ${answerState === 'correct' ? 'text-primary' : 'text-accent-alert'}
            `}
            style={{
              textShadow: answerState === 'correct'
                ? '0 0 40px rgba(34,211,238,0.8)'
                : '0 0 40px rgba(251,113,133,0.8)'
            }}
            initial={{ scale: 0.4, opacity: 0, y: 20, rotate: -5 }}
            animate={{ scale: [0.4, 1.1, 1], opacity: [0, 1, 0.9], y: [-10, -40], rotate: [-2, 0] }}
            exit={{ opacity: 0, scale: 0.7, y: -60 }}
            transition={{ duration: 0.5, ease: "circOut" }}
          >
            {answerState === 'correct' ? '✨ ¡EXCELENTE!' : '⚠️ CASI...'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQIndex}
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="glass-panel p-6 md:p-12 w-full max-w-xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] relative bg-slate-900 overflow-hidden"
        >
          {/* Scanning Line Animation */}
          <motion.div 
             animate={{ top: ['0%', '100%'] }}
             transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
             className="absolute left-0 right-0 h-px bg-primary/20 z-10 pointer-events-none"
          />
          {/* Boss Avatar */}
          <div className="relative mb-6 mt-2 flex justify-center">
            {/* Rage fire background */}
            {answerState === 'wrong' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-600/40 blur-2xl z-0"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
              />
            )}
            <motion.div
              className={`w-28 h-28 md:w-40 md:h-40 rounded-full flex items-center justify-center text-6xl md:text-8xl border shadow-[0_0_30px_rgba(0,0,0,0.5)] z-20 relative transition-all duration-300 ${
                answerState === 'wrong' 
                  ? 'border-accent-alert bg-slate-950 shadow-[0_0_60px_rgba(251,113,133,0.4)]' 
                  : 'border-primary/30 bg-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.2)]'
              }`}
              animate={{ 
                scale: answerState === 'wrong' ? [1, 1.05, 1] : 1,
                rotate: answerState === 'wrong' ? [-4, 4, -4, 4, 0] : 0,
              }}
              transition={{ repeat: answerState === 'wrong' ? Infinity : 0, duration: 0.2 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <span className="relative z-10 pt-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {answerState === 'wrong' ? '🦊💢' : '🦊💻'}
              </span>
            </motion.div>
          </div>

          {/* Question Index */}
          <p className={`text-[10px] md:text-[12px] font-black tracking-[0.6em] mb-6 uppercase text-center ${answerState === 'wrong' ? 'text-accent-alert animate-pulse' : 'text-slate-500'}`}>
            {answerState === 'wrong' ? 'ANOMALÍA DETECTADA' : `PROTOCOL ESTABILIZACIÓN • R-${currentQIndex + 1}/${questions.length}`}
          </p>

          <h2 className="text-2xl md:text-3xl font-display font-black text-white mb-8 md:mb-12 leading-tight tracking-tight px-2 md:px-4 italic drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            <GlitchText text={q.q || q.question || "¿DIAGNÓSTICO FINAL?"} />
          </h2>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/5 rounded-full mb-10 md:mb-12 relative overflow-hidden">
            <motion.div
              className={`absolute top-0 left-0 h-full ${answerState === 'wrong' ? 'bg-accent-alert shadow-[0_0_15px_rgba(251,113,133,0.5)]' : 'bg-primary shadow-[0_0_20px_rgba(34,211,238,0.5)]'}`}
              initial={{ width: `${(currentQIndex / questions.length) * 100}%` }}
              animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {q.options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectAnswer = idx === q.correct_index;
              const showResult = answerState !== null && isSelected;

              return (
                <motion.button
                  key={`${currentQIndex}-${idx}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={
                    showResult && answerState === 'wrong'
                      ? { opacity: 1, x: [0, -8, 8, -6, 6, -3, 0] }
                      : { opacity: 1, x: 0 }
                  }
                  transition={
                    showResult && answerState === 'wrong'
                      ? { duration: 0.45, delay: 0 }
                      : { duration: 0.3, delay: idx * 0.07, ease: 'easeOut' }
                  }
                  whileHover={answerState === null ? { scale: 1.01, x: 4, transition: { type: 'spring', stiffness: 400, damping: 20 } } : {}}
                  whileTap={answerState === null ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(idx)}
                  disabled={answerState !== null}
                  className={`w-full text-left p-5 md:p-8 glass-panel !rounded-3xl md:!rounded-[2.5rem] transition-all flex justify-between items-center group border border-white/5 relative overflow-hidden active:scale-[0.98]
                    ${showResult && answerState === 'correct' ? 'border-primary/40 bg-primary/10 shadow-[0_0_30px_rgba(34,211,238,0.1)]' :
                      showResult && answerState === 'wrong' ? 'border-accent-alert/40 bg-accent-alert/10 shadow-[0_0_30px_rgba(251,113,133,0.1)]' :
                      answerState !== null && isCorrectAnswer ? 'border-primary/20 bg-primary/5' :
                      'bg-slate-950/40 hover:bg-slate-800/60 hover:border-primary/40'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="flex gap-4 md:gap-6 items-center flex-1 relative z-10">
                    <span className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase italic tracking-wider">MOD_0{idx + 1}</span>
                    <span className={`text-base md:text-lg font-black pr-4 transition-colors italic leading-relaxed tracking-tight
                      ${showResult && answerState === 'correct' ? 'text-primary' :
                        showResult && answerState === 'wrong' ? 'text-accent-alert' :
                        'text-slate-200 group-hover:text-primary'
                      }
                    `}>
                      {opt}
                    </span>
                  </div>
                  <div className={`w-8 h-8 md:w-12 md:h-12 rounded-2xl md:rounded-[1.5rem] border flex items-center justify-center shrink-0 transition-all relative z-10
                    ${showResult && answerState === 'correct' ? 'border-primary/40 bg-primary/20' :
                      showResult && answerState === 'wrong' ? 'border-accent-alert/40 bg-accent-alert/20 font-black' :
                      'bg-slate-900 border-white/5 group-hover:border-primary/40 group-hover:bg-primary/10'
                    }
                  `}>
                    {showResult && answerState === 'correct' ? (
                      <span className="text-primary text-xl font-black">✔</span>
                    ) : showResult && answerState === 'wrong' ? (
                      <span className="text-accent-alert text-xl font-black">!</span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-800 group-hover:bg-primary/60 transition-colors" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bubbles */}
      <div className="mt-16 flex gap-6">
        {questions.map((_, idx) => (
          <motion.div
            key={idx}
            animate={{
              scale: idx === currentQIndex ? [1, 1.4, 1] : 1,
              backgroundColor: idx < currentQIndex
                ? '#22D3EE'
                : idx === currentQIndex
                ? (answerState === 'wrong' ? '#FB7185' : '#22D3EE')
                : 'rgba(255,255,255,0.05)',
              boxShadow: idx === currentQIndex 
                ? (answerState === 'wrong' ? '0 0 20px rgba(251,113,133,0.5)' : '0 0 20px rgba(34,211,238,0.5)')
                : 'none'
            }}
            transition={{ repeat: idx === currentQIndex ? Infinity : 0, duration: 2 }}
            className="w-3 h-3 rounded-full border border-white/20"
          />
        ))}
      </div>
    </div>
  );
};
