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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel-dark p-12 max-w-md w-full text-center border border-primary/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/30 glow-border-primary" />
        <span className="neon-text-primary block mb-12 text-[10px] tracking-[0.6em]">
          PROTOCOLO DE INDUCCIÓN · {current + 1}/{SLIDES.length}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="text-8xl mb-10 animate-pulse filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{slide.emoji}</div>
            <h3 className="text-3xl font-display font-black text-white mb-6 tracking-tighter italic shadow-text uppercase">
              {slide.title}
            </h3>
            <p className="text-slate-300 leading-relaxed mb-10 text-base font-medium italic px-4">
              "{slide.body}"
            </p>
            <div className="relative overflow-hidden rounded-2xl p-4 bg-black/40 border border-primary/10">
              <div className="absolute top-0 left-0 w-full h-full medical-grid opacity-10 pointer-events-none" />
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic relative z-10">
                {slide.hint}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress pips */}
        <div className="flex gap-4 justify-center mt-12 mb-12">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === current ? 40 : 12,
                backgroundColor: i === current ? '#00E5FF' : 'rgba(255,255,255,0.05)',
                boxShadow: i === current ? '0 0 15px rgba(0, 229, 255, 0.6)' : 'none'
              }}
              className="h-2 rounded-full transition-all duration-500 border border-white/5"
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onComplete() : setCurrent((s) => s + 1))}
          className="btn-primary w-full py-6 text-lg group"
        >
          <span className="flex items-center justify-center gap-3">
            {isLast ? 'INICIAR GUARDIA' : 'SIGUIENTE PASO'}
            <span className="group-hover:translate-x-1 transition-transform">➡️</span>
          </span>
        </button>

        {current === 0 && (
          <button
            onClick={onComplete}
            className="mt-8 text-[11px] font-black tracking-[0.4em] text-slate-600 hover:text-primary transition-all uppercase italic hover:scale-105"
          >
            — SALTAR PROTOCOLO —
          </button>
        )}
      </motion.div>
    </div>
  );
};
