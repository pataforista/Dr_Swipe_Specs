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
            className="absolute inset-0 bg-moomin-primary/10 pointer-events-none z-[150]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.6 }}
          />
        )}
        {answerState === 'wrong' && (
          <motion.div
            key="wrong-flash"
            className="absolute inset-0 bg-moomin-accent/20 pointer-events-none z-[150]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.2] }}
            transition={{ duration: 0.7 }}
          />
        )}
      </AnimatePresence>

      {/* Background soft pulse */}
      <motion.div
        className="absolute inset-0 bg-moomin-accent/5 pointer-events-none"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Answer result banner */}
      <AnimatePresence>
        {answerState && (
          <motion.div
            key={answerState}
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[160] pointer-events-none
              text-4xl font-display font-black tracking-widest uppercase italic
              ${answerState === 'correct' ? 'text-moomin-primary' : 'text-moomin-accent'}
            `}
            style={{
              textShadow: answerState === 'correct'
                ? '0 0 30px rgba(135,206,235,0.6)'
                : '0 0 30px rgba(255,159,127,0.6)'
            }}
            initial={{ scale: 0.4, opacity: 0, y: 20, rotate: -10 }}
            animate={{ scale: [0.4, 1.2, 1], opacity: [0, 1, 0.9], y: [-10, -30], rotate: [-5, 0] }}
            exit={{ opacity: 0, scale: 0.7, y: -50 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {answerState === 'correct' ? '✨ ¡EXCELENTE!' : '⚠️ CASI...'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQIndex}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="glass-panel p-10 w-full max-w-lg border-4 border-moomin-accent/10 shadow-2xl relative overflow-hidden bg-white rounded-[3rem]"
        >
          {/* Boss Avatar (Aggretsuko Style) */}
          <div className="relative mb-8 mt-2 flex justify-center">
            {/* Rage fire background if angry */}
            {answerState === 'wrong' && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-600/40 blur-2xl z-0"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
              />
            )}
            <motion.div
              className={`w-32 h-32 rounded-full flex items-center justify-center text-8xl border-4 shadow-xl z-20 relative transition-colors duration-300 ${
                answerState === 'wrong' 
                  ? 'border-red-600 bg-red-100 shadow-[0_0_50px_rgba(220,38,38,0.8)]' 
                  : 'border-moomin-primary/40 bg-white shadow-[0_15px_30px_rgba(135,206,235,0.2)]'
              }`}
              animate={{ 
                scale: answerState === 'wrong' ? [1, 1.1, 1] : 1,
                rotate: answerState === 'wrong' ? [-8, 8, -6, 6, -4, 4] : 0,
                y: answerState === 'wrong' ? [-2, 2, -2] : 0
              }}
              transition={{ repeat: answerState === 'wrong' ? Infinity : 0, duration: 0.15 }}
            >
              {answerState === 'wrong' ? '🦊🔥' : '🦊💖'}
            </motion.div>
          </div>

          {/* Question Index */}
          <p className={`text-[11px] font-black tracking-[0.4em] mb-4 uppercase italic text-center ${answerState === 'wrong' ? 'text-red-600 animate-pulse' : 'text-moomin-muted/80'}`}>
            {answerState === 'wrong' ? '¡INACEPTABLE!' : `JEFA DE GUARDIA - DESAFÍO ${currentQIndex + 1}/${questions.length}`}
          </p>

          <h2 className="text-2xl md:text-3xl font-display font-black text-moomin-text mb-10 leading-tight tracking-tight px-4 italic">
            <GlitchText text={q.q || q.question || "¿QUÉ SIGUE AHORA?"} />
          </h2>

          {/* Progress bar */}
          <div className="w-full h-2 bg-moomin-bg rounded-full mb-10 relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-moomin-accent"
              initial={{ width: `${(currentQIndex / questions.length) * 100}%` }}
              animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
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
                  className={`w-full text-left p-6 glass-panel !rounded-[2rem] transition-all flex justify-between items-center group border-2
                    ${showResult && answerState === 'correct' ? 'border-moomin-primary/40 bg-moomin-primary/5' :
                      showResult && answerState === 'wrong' ? 'border-moomin-accent/40 bg-moomin-accent/5' :
                      answerState !== null && isCorrectAnswer ? 'border-moomin-primary/20 bg-moomin-primary/5' :
                      'border-moomin-text/5 hover:bg-moomin-bg hover:border-moomin-primary/30'
                    }
                  `}
                >
                  <div className="flex gap-4 items-center">
                    <span className="text-[10px] font-black text-moomin-muted/30 uppercase italic">0{idx + 1}</span>
                    <span className={`text-base font-black pr-4 transition-colors italic
                      ${showResult && answerState === 'correct' ? 'text-moomin-primary' :
                        showResult && answerState === 'wrong' ? 'text-moomin-accent' :
                        'text-moomin-text group-hover:text-moomin-primary'
                      }
                    `}>
                      {opt}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all
                    ${showResult && answerState === 'correct' ? 'border-moomin-primary/40 bg-moomin-primary/10' :
                      showResult && answerState === 'wrong' ? 'border-moomin-accent/40 bg-moomin-accent/10' :
                      'bg-moomin-bg border-moomin-text/5 group-hover:border-moomin-primary/40 group-hover:bg-moomin-primary/5'
                    }
                  `}>
                    {showResult && answerState === 'correct' ? (
                      <span className="text-moomin-primary text-sm font-black">✨</span>
                    ) : showResult && answerState === 'wrong' ? (
                      <span className="text-moomin-accent text-sm font-black">⚠️</span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-moomin-muted/20 group-hover:bg-moomin-primary transition-colors" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bubbles */}
      <div className="mt-12 flex gap-4">
        {questions.map((_, idx) => (
          <motion.div
            key={idx}
            animate={{
              scale: idx === currentQIndex ? [1, 1.3, 1] : 1,
              backgroundColor: idx < currentQIndex
                ? '#87CEEB'
                : idx === currentQIndex
                ? '#FF9F7F'
                : 'rgba(92,64,51,0.05)'
            }}
            transition={{ repeat: idx === currentQIndex ? Infinity : 0, duration: 2 }}
            className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
          />
        ))}
      </div>
    </div>
  );
};
