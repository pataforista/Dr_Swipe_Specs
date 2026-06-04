import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    emoji: '📝',
    title: 'Tu Diario de Guardia.',
    body: 'Cada paciente es una historia. Desliza a la derecha para ACEPTAR los hallazgos que explican el caso, y a la izquierda para DESCARTAR lo irrelevante. Tu criterio es la mejor medicina.',
    hint: '← Descartar  |  Aceptar →',
  },
  {
    emoji: '💖',
    title: 'Cuida tus Notas.',
    body: 'Los errores en el diagnóstico drenan la Vitalidad del paciente. Mantén tu enfoque: las notas impecables salvan vidas y mantienen tu guardia bajo control.',
    hint: 'Error: -15 Vitalidad  ·  Acierto: +8 Vitalidad',
  },
  {
    emoji: '✨',
    title: 'Colecciona Logros.',
    body: 'Una racha de aciertos te premia con Caja de Suministros. Úsalas para obtener ventajas y demostrar que eres el mejor del servicio.',
    hint: 'Racha x8 = Caja de Suministros',
  },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#FDFBF7]/90 backdrop-blur-md p-6">
      {/* Paper texture overlay (Dot Grid) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="paper-sheet p-6 sm:p-12 max-w-md w-full text-center shadow-2xl relative overflow-hidden bg-white"
      >
        {/* Washi Tape Header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-7 sm:h-10 washi-tape-pink -rotate-1 shadow-sm border-x-2 border-white/40 z-20" />

        <span className="text-primary/60 block mb-6 sm:mb-10 text-[10px] sm:text-[12px] font-black tracking-[0.3em] sm:tracking-[0.4em] lettering uppercase">
          Guía de Estudio ✨ {current + 1}/{SLIDES.length}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -50, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="px-2"
          >
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-8 filter drop-shadow-sm animate-pulse">{slide.emoji}</div>
            <h3 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-4 sm:mb-6 tracking-tighter lettering leading-tight">
              {slide.title}
            </h3>
            <p className="text-slate-500 leading-relaxed mb-6 sm:mb-10 text-base sm:text-xl font-bold lettering italic px-2 sm:px-4">
              "{slide.body}"
            </p>

            <div className="relative py-4 sm:py-6 px-3 sm:px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2 sm:rounded-3xl mb-6 sm:mb-8">
              <p className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.25em] sm:tracking-[0.3em] lettering relative z-10">
                {slide.hint}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex gap-2 sm:gap-3 justify-center mb-6 sm:mb-10">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i === current ? 1.2 : 1,
                backgroundColor: i === current ? '#22D3EE' : '#E2E8F0'
              }}
              className="w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all duration-300"
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onComplete() : setCurrent((s) => s + 1))}
          className="marker-btn w-full py-4 sm:py-6 text-base sm:text-xl group"
        >
          <span className="flex items-center justify-center gap-2 sm:gap-3">
            {isLast ? '¡VAMOS A LA GUARDIA! 🚀' : 'SIGUIENTE NOTA ✨'}
          </span>
        </button>

        {current === 0 && (
          <button
            onClick={onComplete}
            className="mt-8 text-[11px] font-black tracking-[0.4em] text-slate-400 hover:text-rose-500 transition-colors uppercase lettering italic"
          >
            — SALTAR TUTORIAL —
          </button>
        )}
      </motion.div>
    </div>
  );
};
