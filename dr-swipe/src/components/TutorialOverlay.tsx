import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    emoji: '👆',
    title: 'Desliza para decidir',
    body: 'Swipe a la derecha para MANTENER un hallazgo clínico. Swipe a la izquierda para DESCARTAR. También puedes usar los botones en la parte inferior.',
    hint: '← Descartar  |  Mantener →',
  },
  {
    emoji: '⚠️',
    title: 'Cuidado con las letales',
    body: 'Las cartas con borde rojo son de RIESGO LETAL. Un error puede costarte la guardia. Las advertencias disminuyen conforme subes de nivel.',
    hint: 'R1: 2 advertencias · R2/R3: 1 · Adscrito: 0',
  },
  {
    emoji: '🚨',
    title: 'Shock Room al final',
    body: 'Al terminar las cartas enfrentarás el Shock Room. Responde la triada clínica correctamente para salvar al paciente y ganar puntos de racha.',
    hint: 'Velocidad + precisión = mayor puntaje',
  },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel p-10 max-w-sm w-full text-center border-white/20 shadow-2xl"
      >
        <span className="text-[9px] font-black tracking-[0.4em] text-medical-primary uppercase mb-6 block">
          INDUCCIÓN · {current + 1}/{SLIDES.length}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.22 }}
          >
            <div className="text-7xl mb-6 filter drop-shadow-lg">{slide.emoji}</div>
            <h3 className="text-2xl font-display font-black text-white mb-4 tracking-tighter">
              {slide.title}
            </h3>
            <p className="text-slate-300 leading-relaxed mb-4 text-sm font-medium">
              {slide.body}
            </p>
            <p className="text-[10px] font-black text-medical-primary/60 uppercase tracking-widest">
              {slide.hint}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress pips */}
        <div className="flex gap-2 justify-center my-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-medical-primary' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onComplete() : setCurrent((s) => s + 1))}
          className="btn-primary w-full py-4 text-sm"
        >
          {isLast ? 'COMENZAR GUARDIA' : 'SIGUIENTE'}
        </button>

        {current === 0 && (
          <button
            onClick={onComplete}
            className="mt-4 text-[10px] font-black tracking-[0.4em] text-slate-600 hover:text-slate-400 transition-colors uppercase"
          >
            Ya sé jugar
          </button>
        )}
      </motion.div>
    </div>
  );
};
