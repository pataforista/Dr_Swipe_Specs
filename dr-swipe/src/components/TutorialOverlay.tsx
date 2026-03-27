import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    emoji: '📝',
    title: 'El expediente no se organiza solo.',
    body: 'Cada tarjeta es una decisión. Desliza a la derecha para ACEPTAR lo que corresponde al caso, a la izquierda para RECHAZAR lo que no aplica. El orden importa. El caos en el expediente es caos en la atención.',
    hint: '← Rechaza  |  Acepta →',
  },
  {
    emoji: '❤️',
    title: 'El monitor no miente.',
    body: 'Cada error drena la Vitalidad del paciente. Cada acierto la recupera, pero nunca al mismo ritmo. En medicina tampoco.',
    hint: 'Error: -25 Vitalidad  ·  Acierto: +5 Vitalidad',
  },
  {
    emoji: '📦',
    title: 'Las guardias limpias tienen recompensa.',
    body: 'Mantén una racha sin errores y el sistema te entrega una Caja de Suministros — monedas, beneficios, lo que necesitas para aguantar la noche.',
    hint: 'Racha x10 = Caja de Suministros',
  },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel p-10 max-w-sm w-full text-center border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] bg-slate-900 rounded-[3rem] overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-50" />
        <span className="text-[9px] font-black tracking-[0.5em] text-primary uppercase mb-10 block">
          INICIALIZACIÓN DE PROTOCOLO · {current + 1}/{SLIDES.length}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="text-7xl mb-8 animate-pulse filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{slide.emoji}</div>
            <h3 className="text-2xl font-display font-black text-white mb-4 tracking-tight italic">
              {slide.title}
            </h3>
            <p className="text-slate-400 leading-relaxed mb-8 text-sm font-black italic">
              {slide.body}
            </p>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-slate-950/60 py-3 rounded-2xl border border-white/5 italic">
              {slide.hint}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress pips */}
        <div className="flex gap-2.5 justify-center mt-8 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === current ? 'w-10 bg-primary shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onComplete() : setCurrent((s) => s + 1))}
          className="bg-primary hover:bg-white text-slate-950 font-black text-[11px] tracking-[0.5em] uppercase py-6 px-8 rounded-2xl shadow-lg transition-all active:scale-95 w-full"
        >
          {isLast ? 'INICIAR GUARDIA' : 'SIGUIENTE PASO'}
        </button>

        {current === 0 && (
          <button
            onClick={onComplete}
            className="mt-6 text-[10px] font-black tracking-[0.3em] text-slate-600 hover:text-primary transition-colors uppercase italic"
          >
            SALTAR PROTOCOLO
          </button>
        )}
      </motion.div>
    </div>
  );
};
