import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShockRoomProps {
  questions: any[];
  dossierItems: any[];
  onSurvive: () => void;
  onGhosted: (error: string) => void;
}

export const ShockRoom: React.FC<ShockRoomProps> = ({
  questions,
  dossierItems,
  onSurvive,
  onGhosted
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [shakeIndicator, setShakeIndicator] = useState(false);
  const totalSteps = questions.length;
  const MAX_WRONG_ATTEMPTS = 2; // Allow 2 wrong answers before game over

  useEffect(() => {
    if (timeLeft <= 0) {
      onGhosted("El tiempo se agotó en la fase crítica.");
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onGhosted]);

  const handleAnswer = (selectedIndex: number) => {
    const question = questions[currentStep];
    const isCorrect = selectedIndex === question.correct_index;
    if (isCorrect) {
      setWrongAttempts(0); // Reset on correct answer
      if (currentStep + 1 >= totalSteps) {
        onSurvive();
      } else {
        setCurrentStep(prev => prev + 1);
        setTimeLeft(12); // Refresh time for next step
      }
    } else {
      const nextAttempts = wrongAttempts + 1;
      if (nextAttempts >= MAX_WRONG_ATTEMPTS) {
        onGhosted("Decisión crítica errónea bajo presión.");
      } else {
        setWrongAttempts(nextAttempts);
        // Visual feedback that they can try again
        setShakeIndicator(true);
        setTimeout(() => setShakeIndicator(false), 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-6 bg-[#FDFBF7]/90 backdrop-blur-md overflow-y-auto">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />

      <motion.div
        initial={{ scale: 0.9, y: 20, rotate: -2 }}
        animate={shakeIndicator ? { x: [-10, 10, -10, 10, 0] } : { scale: 1, y: 0, rotate: 0 }}
        transition={shakeIndicator ? { duration: 0.4 } : { duration: 0.3 }}
        className="paper-sheet p-10 md:p-14 max-w-2xl w-full shadow-2xl relative bg-white border-2 border-rose-100 flex flex-col"
      >
        {/* Washi Tape Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-10 washi-tape-pink -rotate-1 shadow-sm border-x-2 border-white/40 z-20" />

        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-rose-500 font-black text-[12px] tracking-[0.4em] uppercase lettering">Fase Crítica ⚡</span>
            <div className="h-1.5 w-16 bg-rose-200 rounded-full" />
          </div>
          <div className={`px-6 py-2 rounded-2xl border-2 font-bold lettering text-2xl transition-colors ${timeLeft <= 5 ? 'bg-rose-500 text-white border-white animate-pulse' : 'bg-slate-50 text-slate-700 border-white'}`}>
            ⏱️ {timeLeft}s
          </div>
        </div>

        <div className="mb-12 relative z-10">
            <div className="flex justify-between items-end mb-4">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] lettering">PROGRESO DEL CASO</span>
              <div className="flex gap-4 items-center">
                <span className="text-[12px] font-bold text-slate-500 lettering">{currentStep + 1} / {totalSteps}</span>
                {wrongAttempts > 0 && (
                  <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.15em] lettering">
                    {MAX_WRONG_ATTEMPTS - wrongAttempts} intentos restantes
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border-2 border-white p-0.5 shadow-inner">
                <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                   className="h-full bg-emerald-400 rounded-full"
                />
            </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-12 relative z-10 flex-1 flex flex-col w-full"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8 leading-tight lettering tracking-tight">
              {questions[currentStep].question || questions[currentStep].q}
            </h3>

            <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2">
              {questions[currentStep].options.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="paper-sheet p-6 text-left hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group flex items-center gap-4 border-2 border-slate-50 flex-shrink-0"
                >
                  <span className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center font-bold text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500 transition-colors flex-shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-xl font-bold text-slate-600 group-hover:text-slate-800 lettering">{opt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Marginal notes for previous findings (Dossier) */}
        <div className="mt-10 pt-8 border-t-2 border-slate-50 flex flex-wrap gap-3 opacity-60">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block w-full mb-2 lettering italic">Hallazgos registrados en el diario:</span>
            {dossierItems.slice(-3).map((item, idx) => (
                <span key={idx} className="bg-slate-50 px-4 py-1 rounded-full text-[10px] lowercase lettering font-bold border-2 border-white">
                   #{item.card_id || item.category}
                </span>
            ))}
        </div>
      </motion.div>
    </div>
  );
};
