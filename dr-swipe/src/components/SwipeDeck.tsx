import React from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import type { Card } from '../types/game';
import { useGameAudio } from '../hooks/useGameAudio';

interface SwipeDeckProps {
  cards: Card[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right') => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ cards, currentIndex, onSwipe }) => {
  const { playSwipe } = useGameAudio();
  // Solo renderizamos 3 cartas al mismo tiempo por rendimiento (DOM ligero)
  const visibleCards = cards.slice(currentIndex, currentIndex + 3).reverse();

  return (
    <div className="relative w-full max-w-sm h-80 mx-auto flex items-center justify-center perspective-1000">
      {visibleCards.map((card, idx) => {
        // La tarjeta de hasta arriba es la única interactiva (isTop)
        const isTop = idx === visibleCards.length - 1;
        return (
          <DraggableCard 
            key={card.card_id} 
            card={card} 
            isTop={isTop} 
            indexOffset={visibleCards.length - 1 - idx} 
            onSwipe={onSwipe} 
            playSwipe={playSwipe}
          />
        );
      })}
    </div>
  );
};

interface DraggableCardProps {
  card: Card;
  isTop: boolean;
  indexOffset: number;
  onSwipe: (direction: 'left' | 'right') => void;
  playSwipe: (direction: 'left' | 'right') => void;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ card, isTop, indexOffset, onSwipe, playSwipe }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const overlayOpacityLeft = useTransform(x, [0, -150], [0, 1]);
  const overlayOpacityRight = useTransform(x, [0, 150], [0, 1]);

  const handleDragEnd = async (_: any, info: any) => {
    if (!isTop) return;

    const threshold = 100;
    const velocity = info.velocity.x;

    if (info.offset.x > threshold || velocity > 500) {
      playSwipe('right');
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe('right');
    } else if (info.offset.x < -threshold || velocity < -500) {
      playSwipe('left');
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe('left');
    } else {
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      className="absolute w-full h-[22rem] swipe-card cursor-grab active:cursor-grabbing perspective-1000 group"
      style={{
        x,
        rotate,
        zIndex: 10 - indexOffset,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={isTop ? controls : "stacked"}
      variants={{
        stacked: { 
          scale: 1 - indexOffset * 0.05, 
          opacity: 1, 
          y: indexOffset * 15,
          transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
      }}
      initial={{ scale: 0.8, opacity: 0 }}
    >
      {/* Decorative Fold-over Tab */}
      <div className="absolute top-0 right-10 w-24 h-6 bg-white/5 rounded-b-xl border-x border-b border-white/10 flex items-center justify-center">
        <span className="text-[8px] font-black tracking-[0.2em] text-white/20 uppercase">FILE: {card.card_id.slice(-4)}</span>
      </div>

      {/* Indicadores visuales de Decisión */}
      <motion.div 
        style={{ opacity: overlayOpacityLeft }} 
        className="absolute inset-0 bg-medical-danger/20 rounded-[2.5rem] pointer-events-none flex items-center justify-center"
      >
        <span className="text-4xl font-black text-medical-danger border-4 border-medical-danger px-4 py-2 rotate-[-20deg] uppercase">DESCARTAR</span>
      </motion.div>
      <motion.div 
        style={{ opacity: overlayOpacityRight }} 
        className="absolute inset-0 bg-medical-primary/20 rounded-[2.5rem] pointer-events-none flex items-center justify-center"
      >
        <span className="text-4xl font-black text-medical-primary border-4 border-medical-primary px-4 py-2 rotate-[20deg] uppercase">MANTENER</span>
      </motion.div>

      <div className="flex flex-col h-full relative z-10">
        <div className="scanline opacity-20" />
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black tracking-[0.3em] text-medical-primary uppercase mb-1">CATEGORÍA</span>
            <div className="px-2 py-0.5 bg-medical-primary/10 rounded border border-medical-primary/20">
              <span className="text-[11px] font-bold text-medical-primary uppercase">{card.category}</span>
            </div>
          </div>
          <div className="w-12 h-12 glass-panel !rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            {card.ui_icon === 'heartbeat' ? '🩺' : '📋'}
          </div>
        </div>

        <div className="flex-grow flex flex-col justify-center px-2">
          <p className="text-xl md:text-2xl font-display font-black text-slate-100 leading-[1.4] tracking-tight">
            {card.card_text}
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ESTADO DEL PACIENTE</span>
            <div className="flex gap-1">
              <div className="w-8 h-1 bg-medical-primary rounded-full" />
              <div className="w-8 h-1 bg-white/10 rounded-full" />
              <div className="w-8 h-1 bg-white/10 rounded-full" />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase">ARCHIVO CLÍNICO</span>
        </div>
      </div>
    </motion.div>
  );
};
