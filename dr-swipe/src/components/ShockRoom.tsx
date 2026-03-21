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
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center z-[100] backdrop-blur-sm">
      {/* Answer feedback overlay flash */}
      <AnimatePresence>
        {answerState === 'correct' && (
          <motion.div
            key="correct-flash"
            className="absolute inset-0 bg-medical-primary/15 pointer-events-none z-[150]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.6 }}
          />
        )}
        {answerState === 'wrong' && (
          <motion.div
            key="wrong-flash"
            className="absolute inset-0 bg-medical-danger/30 pointer-events-none z-[150]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.4] }}
            transition={{ duration: 0.7 }}
          />
        )}
      </AnimatePresence>

      {/* Background hazard pulse */}
      <motion.div
        className="absolute inset-0 bg-medical-danger/10 pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Answer result banner */}
      <AnimatePresence>
        {answerState && (
          <motion.div
            key={answerState}
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[160] pointer-events-none
              text-4xl font-display font-black tracking-widest uppercase
              ${answerState === 'correct' ? 'text-medical-primary' : 'text-medical-danger'}
            `}
            style={{
              textShadow: answerState === 'correct'
                ? '0 0 30px rgba(13,148,136,0.9), 0 0 60px rgba(13,148,136,0.4)'
                : '0 0 30px rgba(239,68,68,0.9), 0 0 60px rgba(239,68,68,0.4)'
            }}
            initial={{ scale: 0.4, opacity: 0, y: 20, rotate: -5 }}
            animate={{ scale: [0.4, 1.3, 1], opacity: [0, 1, 0.9], y: [-10, -28], rotate: [0, 0] }}
            exit={{ opacity: 0, scale: 0.7, y: -40 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {answerState === 'correct' ? '✓ CORRECTO' : '✗ FALLO CRÍTICO'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQIndex}
          initial={{ opacity: 0, x: 60, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -60, scale: 0.96 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="glass-panel p-10 w-full max-w-lg border-medical-danger/40 shadow-[0_0_80px_rgba(239,68,68,0.3)] relative overflow-hidden"
        >
          {/* Urgent Header */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-medical-danger"
            />
            <span className="text-[10px] font-black text-medical-danger tracking-[0.5em] uppercase">
              ALERTA DE SEGURIDAD: SALA DE CHOQUE
            </span>
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-medical-danger"
            />
          </div>

          {/* Case trigger context */}
          <p className="text-[10px] font-mono text-white/30 tracking-widest mb-4 uppercase">
            PREGUNTA {currentQIndex + 1} / {questions.length}
          </p>

          <h2 className="text-2xl md:text-3xl font-display font-black text-white mb-10 leading-tight tracking-tight px-4 underline decoration-medical-danger/30 underline-offset-8">
            <GlitchText text={q.q || q.question || "URGENCIA: REQUIERE ACCIÓN INMEDIATA"} />
          </h2>

          {/* Progress bar */}
          <div className="w-full h-0.5 bg-white/5 mb-10 relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-medical-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              initial={{ width: `${(currentQIndex / questions.length) * 100}%` }}
              animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 gap-4">
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
                  whileHover={answerState === null ? { scale: 1.02, x: 8, transition: { type: 'spring', stiffness: 400, damping: 20 } } : {}}
                  whileTap={answerState === null ? { scale: 0.96 } : {}}
                  onClick={() => handleAnswer(idx)}
                  disabled={answerState !== null}
                  className={`w-full text-left p-6 glass-panel !rounded-3xl transition-all flex justify-between items-center group
                    ${showResult && answerState === 'correct' ? 'border-medical-primary/60 bg-medical-primary/10' :
                      showResult && answerState === 'wrong' ? 'border-medical-danger/60 bg-medical-danger/10' :
                      answerState !== null && isCorrectAnswer ? 'border-medical-primary/40 bg-medical-primary/5' :
                      'border-white/5 hover:bg-white/5 hover:border-medical-primary/30'
                    }
                  `}
                >
                  <div className="flex gap-4 items-center">
                    <span className="text-[10px] font-black font-mono text-white/20 uppercase">0{idx + 1}</span>
                    <span className={`text-base font-bold pr-4 transition-colors
                      ${showResult && answerState === 'correct' ? 'text-medical-primary' :
                        showResult && answerState === 'wrong' ? 'text-medical-danger' :
                        'text-slate-100 group-hover:text-medical-primary'
                      }
                    `}>
                      {opt}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all
                    ${showResult && answerState === 'correct' ? 'border-medical-primary/60 bg-medical-primary/20' :
                      showResult && answerState === 'wrong' ? 'border-medical-danger/60 bg-medical-danger/20' :
                      'bg-white/5 border-white/10 group-hover:border-medical-primary/50 group-hover:bg-medical-primary/10'
                    }
                  `}>
                    {showResult && answerState === 'correct' ? (
                      <span className="text-medical-primary text-sm">✓</span>
                    ) : showResult && answerState === 'wrong' ? (
                      <span className="text-medical-danger text-sm">✗</span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-medical-primary transition-colors" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Triad Progress Bubbles */}
      <div className="mt-12 flex gap-4">
        {questions.map((_, idx) => (
          <motion.div
            key={idx}
            animate={{
              scale: idx === currentQIndex ? [1, 1.25, 1] : 1,
              backgroundColor: idx < currentQIndex
                ? '#14b8a6'
                : idx === currentQIndex
                ? '#ef4444'
                : 'rgba(255,255,255,0.1)'
            }}
            transition={{ repeat: idx === currentQIndex ? Infinity : 0, duration: 1.5 }}
            className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          />
        ))}
      </div>
    </div>
  );
};
