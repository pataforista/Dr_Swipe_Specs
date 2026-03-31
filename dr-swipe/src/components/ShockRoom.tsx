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
    <div className="fixed inset-0 flex flex-col items-center justify-start md:justify-center p-4 md:p-6 text-center z-[100] backdrop-blur-xl medical-grid overflow-y-auto py-10 md:py-20">
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
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="glass-panel-dark p-10 md:p-14 w-full max-w-2xl border border-primary/20 shadow-[0_0_100px_rgba(0,0,0,0.9)] relative overflow-hidden max-h-[85vh] custom-scrollbar mb-10 shrink-0 pb-20"
        >
          {/* Scanning Line Animation */}
          <motion.div 
             animate={{ top: ['0%', '100%'] }}
             transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
             className="absolute left-0 right-0 h-1 bg-primary/20 z-10 pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          />
          
          {/* Boss Avatar */}
          <div className="relative mb-8 mt-2 flex justify-center">
            <AnimatePresence>
              {answerState === 'wrong' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 2 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-full bg-accent-alert/20 blur-3xl z-0"
                />
              )}
            </AnimatePresence>
            <motion.div
              className={`w-32 h-32 md:w-44 md:h-44 rounded-full flex items-center justify-center text-7xl md:text-8xl border-2 z-20 relative transition-all duration-500 bg-black/40 backdrop-blur-md ${
                answerState === 'wrong' 
                  ? 'border-accent-alert shadow-[0_0_50px_rgba(255,45,85,0.4)]' 
                  : 'border-primary/40 shadow-[0_0_40px_rgba(0,229,255,0.2)]'
              }`}
              animate={{ 
                scale: answerState === 'wrong' ? [1, 1.1, 1] : 1,
                y: answerState === 'wrong' ? [0, -5, 5, 0] : 0
              }}
              transition={{ repeat: answerState === 'wrong' ? Infinity : 0, duration: 0.15 }}
            >
              <span className="relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                {answerState === 'wrong' ? '🦊💢' : '🦊💻'}
              </span>
            </motion.div>
          </div>

          <p className={`neon-text-primary block mb-8 text-[11px] tracking-[0.5em] ${answerState === 'wrong' ? '!text-accent-alert animate-pulse' : ''}`}>
            {answerState === 'wrong' ? 'FALLO EN SECUENCIA CRÍTICA' : `NODO DE ESTABILIZACIÓN • R-${currentQIndex + 1}/${questions.length}`}
          </p>

          <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-10 md:mb-14 leading-tight tracking-tighter px-4 italic shadow-text uppercase">
            <GlitchText text={q.q || q.question || "¿DIAGNÓSTICO FINAL?"} />
          </h2>

          <div className="w-full h-1.5 bg-black/60 rounded-full mb-12 relative overflow-hidden border border-white/5">
            <motion.div
              className={`absolute top-0 left-0 h-full ${answerState === 'wrong' ? 'bg-accent-alert glow-border-alert' : 'bg-primary glow-border-primary'}`}
              initial={{ width: `${(currentQIndex / questions.length) * 100}%` }}
              animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:gap-5">
            {q.options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              const showResult = answerState !== null && isSelected;

              return (
                <motion.button
                  key={`${currentQIndex}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={answerState === null ? { scale: 1.02, x: 10 } : {}}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(idx)}
                  disabled={answerState !== null}
                  className={`w-full text-left p-6 md:p-8 rounded-[2rem] border transition-all flex justify-between items-center group relative overflow-hidden
                    ${showResult && answerState === 'correct' ? 'border-primary bg-primary/20 shadow-[0_0_30px_rgba(0,229,255,0.2)]' :
                      showResult && answerState === 'wrong' ? 'border-accent-alert bg-accent-alert/20 shadow-[0_0_30px_rgba(255,45,85,0.2)]' :
                      'bg-black/40 border-white/10 hover:border-primary/50'
                    }
                  `}
                >
                  <div className="flex gap-5 md:gap-8 items-center flex-1 relative z-10">
                    <span className="text-[10px] font-black text-slate-500 uppercase italic opacity-50">MOD_0{idx + 1}</span>
                    <span className={`text-lg md:text-xl font-display font-black transition-colors italic tracking-tighter uppercase
                      ${showResult && answerState === 'correct' ? 'text-primary' :
                        showResult && answerState === 'wrong' ? 'text-accent-alert' :
                        'text-slate-200 group-hover:text-primary'
                      }
                    `}>
                      {opt}
                    </span>
                  </div>
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all
                    ${showResult && answerState === 'correct' ? 'border-primary/60 bg-primary/30' :
                      showResult && answerState === 'wrong' ? 'border-accent-alert/60 bg-accent-alert/30' :
                      'border-white/5 bg-slate-900 group-hover:border-primary/40'
                    }
                  `}>
                    {showResult && answerState === 'correct' ? '✔' : showResult && answerState === 'wrong' ? '!' : ''}
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
