import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    emoji: '🎨',
    title: 'Pinceladas de Decisión',
    body: 'Desliza a la derecha para MANTENER un hallazgo. Desliza a la izquierda para DESCARTAR. También puedes usar los hermosos botones de abajo.',
    hint: '← Descartar  |  Mantener →',
  },
  {
    emoji: '✨',
    title: 'Cuidado con el Bosque',
    body: 'Las cartas con borde naranja o coral son IMPORTANTES o de RIESGO ALTO. ¡Sé valiente pero precavido, pequeño sanador!',
    hint: 'Nivel 1: Mucha ayuda  ·  Nivel 5: Toda tu sabiduría',
  },
  {
    emoji: '🏡',
    title: 'El Final del Camino',
    body: 'Al terminar las cartas, llegarás a la Sala de Choque. Encuentra la solución correcta para proteger el Valle y ganar muchas monedas.',
    hint: 'Amor + Precisión = ¡Gran Victoria!',
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
        className="glass-panel p-10 max-w-sm w-full text-center border-4 border-moomin-primary/10 shadow-2xl bg-white rounded-[3rem]"
      >
        <span className="text-[9px] font-black tracking-[0.4em] text-moomin-primary uppercase mb-8 block italic">
          BIENVENIDA AL VALLE · {current + 1}/{SLIDES.length}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="text-7xl mb-8 animate-bounce-slow filter drop-shadow-xl">{slide.emoji}</div>
            <h3 className="text-2xl font-display font-black text-moomin-text mb-4 tracking-tight italic">
              {slide.title}
            </h3>
            <p className="text-moomin-muted leading-relaxed mb-6 text-sm font-black italic">
              {slide.body}
            </p>
            <p className="text-[10px] font-black text-moomin-primary/60 uppercase tracking-[0.3em] bg-moomin-bg/30 py-2 rounded-full border border-moomin-primary/10 italic">
              {slide.hint}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress pips */}
        <div className="flex gap-2.5 justify-center mt-8 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === current ? 'w-10 bg-moomin-primary shadow-[0_0_10px_rgba(135,206,235,0.4)]' : 'w-2 bg-moomin-bg'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onComplete() : setCurrent((s) => s + 1))}
          className="bg-moomin-primary hover:bg-moomin-primary/90 text-white font-black text-[10px] tracking-[0.4em] uppercase py-5 px-8 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 italic w-full"
        >
          {isLast ? '¡EMPEZAR!' : 'CONTINUAR'}
        </button>

        {current === 0 && (
          <button
            onClick={onComplete}
            className="mt-6 text-[10px] font-black tracking-[0.3em] text-moomin-muted/40 hover:text-moomin-primary transition-colors uppercase italic"
          >
            Ya conozco el camino
          </button>
        )}
      </motion.div>
    </div>
  );
};
