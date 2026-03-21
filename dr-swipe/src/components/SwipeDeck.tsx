import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import type { Card } from '../types/game';
import { useGameAudio } from '../hooks/useGameAudio';

interface SwipeDeckProps {
  cards: Card[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right') => void;
  isLocked?: boolean;
  lifelineActive?: boolean;
  canUseLifeline?: boolean;
  onUseLifeline?: () => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ cards, currentIndex, onSwipe, isLocked, lifelineActive, canUseLifeline, onUseLifeline }) => {
  const { playSwipe } = useGameAudio();
  const visibleCards = cards.slice(currentIndex, currentIndex + 3).reverse();
  const totalCards = cards.length;

  // Keyboard support (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.key === 'ArrowLeft') onSwipe('left');
      if (e.key === 'ArrowRight') onSwipe('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLocked, onSwipe]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-6">
    <div className="relative w-full h-80 flex items-center justify-center perspective-1000">

      {/* Swipe Direction Hints */}
      <div className="absolute -left-6 md:-left-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-50 pointer-events-none z-0">
        <span className="text-3xl animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">⬅️</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-medical-danger -rotate-90 mt-8 drop-shadow-lg bg-black/50 px-2 py-1 rounded">Descartar</span>
      </div>

      <div className="absolute -right-6 md:-right-16 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 opacity-50 pointer-events-none z-0">
        <span className="text-3xl animate-pulse drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]">➡️</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-medical-primary rotate-90 mt-8 drop-shadow-lg bg-black/50 px-2 py-1 rounded">Mantener</span>
      </div>

      {/* Deck Progress Pips */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none z-10">
        {cards.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              width: i === currentIndex ? '20px' : '6px',
              backgroundColor: i < currentIndex
                ? 'rgba(13,148,136,0.3)'
                : i === currentIndex
                ? '#0d9488'
                : 'rgba(255,255,255,0.1)'
            }}
            transition={{ duration: 0.3 }}
            className="h-1.5 rounded-full"
          />
        ))}
      </div>

      <AnimatePresence>
        {visibleCards.map((card, idx) => {
          const isTop = idx === visibleCards.length - 1;
          return (
            <DraggableCard
              key={card.card_id}
              card={card}
              isTop={isTop}
              indexOffset={visibleCards.length - 1 - idx}
              onSwipe={onSwipe}
              playSwipe={playSwipe}
              isLocked={isLocked}
              cardNumber={currentIndex + (visibleCards.length - 1 - idx) + 1}
              totalCards={totalCards}
            />
          );
        })}
      </AnimatePresence>
    </div>

    {/* Lifeline Hint Overlay */}
    {lifelineActive && cards[currentIndex] && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-sm mx-auto mb-2 px-4 py-3 rounded-2xl border text-center text-sm font-black uppercase tracking-widest ${
          cards[currentIndex].expected_action === 'keep'
            ? 'bg-medical-primary/15 border-medical-primary/40 text-medical-primary'
            : 'bg-medical-danger/15 border-medical-danger/40 text-medical-danger'
        }`}
      >
        {cards[currentIndex].expected_action === 'keep' ? '➡️ MANTENER esta carta' : '⬅️ DESCARTAR esta carta'}
      </motion.div>
    )}

    {/* Tap Zones — alternative to swiping on mobile */}
    <div className="flex gap-3 w-full px-2">
      <button
        disabled={isLocked}
        onPointerDown={(e) => { e.stopPropagation(); playSwipe('left'); onSwipe('left'); }}
        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-medical-danger/30 bg-medical-danger/10 active:bg-medical-danger/25 text-medical-danger font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-30 select-none"
        aria-label="Descartar"
      >
        ← Descartar
      </button>

      {/* Lifeline Button */}
      {onUseLifeline && (
        <button
          disabled={!canUseLifeline || isLocked}
          onClick={(e) => { e.stopPropagation(); onUseLifeline(); }}
          className="w-14 flex items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 active:bg-yellow-500/25 text-yellow-400 text-lg transition-all disabled:opacity-20 select-none hover:scale-105"
          aria-label="Usar pista (25 monedas)"
          title="Pista — 25 🪙"
        >
          💡
        </button>
      )}

      <button
        disabled={isLocked}
        onPointerDown={(e) => { e.stopPropagation(); playSwipe('right'); onSwipe('right'); }}
        className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border border-medical-primary/30 bg-medical-primary/10 active:bg-medical-primary/25 text-medical-primary font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-30 select-none"
        aria-label="Mantener"
      >
        Mantener →
      </button>
    </div>
    </div>
  );
};

interface DraggableCardProps {
  card: Card;
  isTop: boolean;
  indexOffset: number;
  onSwipe: (direction: 'left' | 'right') => void;
  playSwipe: (direction: 'left' | 'right') => void;
  isLocked?: boolean;
  cardNumber: number;
  totalCards: number;
}

const ICON_MAP: Record<string, string> = {
  'heartbeat': '🩺',
  'heart': '❤️',
  'target': '🎯',
  'slash': '⚠️',
  'alert-triangle': '⚠️',
  'alert-circle': '⚠️',
  'eye': '👁️',
  'pill': '💊',
  'clock': '⏱️',
  'zap': '⚡',
  'activity': '📈',
  'trending-up': '📈',
  'users': '👨‍⚕️',
  'user': '👨‍⚕️',
  'search': '🔍',
  'grid': '📊',
  'bar-chart-2': '📉',
  'maximize': '🔎',
  'help-circle': '❓',
  'frown': '🤕',
  'rotate-cw': '🔄',
  'brain': '🧠',
  'message-square': '🗣️',
  'alert-octagon': '🚨',
  'shield': '🛡️',
  'droplets': '💧',
  'check-circle': '✅',
  'link': '🔗',
  'refresh-cw': '🔄',
  'image': '🖼️',
  'dna': '🧬',
  'clipboard': '📋',
  'file-text': '📄',
  'thermometer': '🌡️',
  'test-tube': '🧪'
};

const getIcon = (iconName: string) => {
  if (!iconName) return '📋';
  if (ICON_MAP[iconName]) return ICON_MAP[iconName];
  try {
    if (/\p{Emoji}/u.test(iconName)) return iconName;
  } catch {
    if (iconName.length > 1 || iconName.charCodeAt(0) > 127) return iconName;
  }
  return '📋';
};

const DraggableCard: React.FC<DraggableCardProps> = ({
  card, isTop, indexOffset, onSwipe, playSwipe, isLocked, cardNumber, totalCards
}) => {
  const x = useMotionValue(0);
  const controls = useAnimation();

  const rotate = useTransform(x, [-250, 250], [-30, 30]);
  const overlayOpacityLeft = useTransform(x, [0, -80], [0, 1]);
  const overlayOpacityRight = useTransform(x, [0, 80], [0, 1]);

  // Safety level for border accent
  const isLethal = card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded;
  const isCritical = card.safety_flags?.decision_critical;
  const borderColor = isLethal
    ? 'rgba(239,68,68,0.5)'
    : isCritical
    ? 'rgba(251,191,36,0.4)'
    : 'rgba(255,255,255,0.12)';

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (!isTop) return;

    const threshold = 40;
    const velocity = info.velocity.x;

    if (info.offset.x > threshold || velocity > 500) {
      playSwipe('right');
      await controls.start({ x: 600, opacity: 0, rotate: 25, transition: { duration: 0.25 } });
      onSwipe('right');
    } else if (info.offset.x < -threshold || velocity < -500) {
      playSwipe('left');
      await controls.start({ x: -600, opacity: 0, rotate: -25, transition: { duration: 0.25 } });
      onSwipe('left');
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 350, damping: 22 } });
    }
  };

  return (
    <motion.div
      className="absolute w-full h-[22rem] swipe-card cursor-grab active:cursor-grabbing group"
      style={{
        x,
        rotate,
        zIndex: 10 - indexOffset,
        boxShadow: `0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.04), 0 0 0 1px ${borderColor}`,
      }}
      drag={isTop && !isLocked ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      animate={isTop ? controls : "stacked"}
      variants={{
        stacked: {
          scale: 1 - indexOffset * 0.04,
          opacity: 1 - indexOffset * 0.15,
          y: indexOffset * 10,
          transition: { type: 'spring', stiffness: 250, damping: 25 }
        }
      }}
      initial={{ scale: 0.85, opacity: 0, y: 30 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
    >
      {/* Decorative Fold-over Tab */}
      <div className="absolute top-0 right-10 w-24 h-6 bg-white/5 rounded-b-xl border-x border-b border-white/10 flex items-center justify-center">
        <span className="text-[8px] font-black tracking-[0.2em] text-white/20 uppercase">
          {cardNumber}/{totalCards}
        </span>
      </div>

      {/* Safety Flag Badge */}
      {(isLethal || isCritical) && isTop && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute top-3 left-3 z-30 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase flex items-center gap-1 ${
            isLethal
              ? 'bg-medical-danger/20 text-medical-danger border border-medical-danger/40'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}
        >
          <span className="animate-ping-slow w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: isLethal ? '#ef4444' : '#eab308' }}
          />
          {isLethal ? 'RIESGO LETAL' : 'DECISIÓN CRÍTICA'}
        </motion.div>
      )}

      {/* Swipe Direction Overlays */}
      <motion.div
        style={{
          opacity: overlayOpacityLeft,
          scale: useTransform(x, [0, -100], [0.8, 1.1]),
        }}
        className="absolute inset-0 bg-medical-danger/25 rounded-[2.5rem] pointer-events-none flex items-center justify-center border-4 border-medical-danger/50 z-20"
      >
        <motion.span
          style={{ rotate: useTransform(x, [0, -100], [0, -10]) }}
          className="text-4xl font-black text-medical-danger border-4 border-medical-danger px-6 py-3 uppercase shadow-xl bg-black/50 backdrop-blur-sm tracking-widest"
        >
          DESCARTAR
        </motion.span>
      </motion.div>

      <motion.div
        style={{
          opacity: overlayOpacityRight,
          scale: useTransform(x, [0, 100], [0.8, 1.1]),
        }}
        className="absolute inset-0 bg-medical-primary/25 rounded-[2.5rem] pointer-events-none flex items-center justify-center border-4 border-medical-primary/50 z-20"
      >
        <motion.span
          style={{ rotate: useTransform(x, [0, 100], [0, 10]) }}
          className="text-4xl font-black text-medical-primary border-4 border-medical-primary px-6 py-3 uppercase shadow-xl bg-black/50 backdrop-blur-sm tracking-widest"
        >
          MANTENER
        </motion.span>
      </motion.div>

      <div className="flex flex-col h-full relative z-10">
        {/* Corner Accents */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-medical-primary/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-medical-primary/40 pointer-events-none" />

        {/* Metadata Label */}
        <div className="absolute -right-4 top-1/2 -rotate-90 pointer-events-none opacity-20">
          <span className="text-[7px] font-mono font-black tracking-[0.4em] text-white uppercase whitespace-nowrap">
            MD_REF_{card.card_id.toUpperCase().slice(-4)}_LOG
          </span>
        </div>

        <div className="scanline opacity-20" />

        {/* Card Header */}
        <div className="flex justify-between items-start mb-6 mt-6">
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black tracking-[0.3em] text-medical-primary uppercase mb-1">CATEGORÍA</span>
            <div className="px-2 py-0.5 bg-medical-primary/10 rounded border border-medical-primary/20">
              <span className="text-[11px] font-bold text-medical-primary uppercase">{card.category}</span>
            </div>
          </div>
          <motion.div
            animate={isTop ? { rotate: [0, -3, 3, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="w-12 h-12 glass-panel !rounded-2xl flex items-center justify-center text-2xl shadow-inner"
          >
            {getIcon(card.ui_icon)}
          </motion.div>
        </div>

        {/* Card Text */}
        <div className="flex-grow flex flex-col justify-center px-2">
          <p className="text-xl md:text-2xl font-display font-black text-slate-100 leading-[1.4] tracking-tight">
            {card.card_text}
          </p>
        </div>

        {/* Card Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
          {/* Vitals mini-bar */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">PRIORIDAD</span>
            <div className="flex gap-1">
              <div className={`w-8 h-1.5 rounded-full ${isLethal ? 'bg-medical-danger' : isCritical ? 'bg-yellow-500' : 'bg-medical-primary'}`} />
              <div className={`w-8 h-1.5 rounded-full ${isCritical || isLethal ? (isLethal ? 'bg-medical-danger/40' : 'bg-yellow-500/40') : 'bg-white/10'}`} />
              <div className={`w-8 h-1.5 rounded-full ${isLethal ? 'bg-medical-danger/20' : 'bg-white/10'}`} />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase">ARCHIVO CLÍNICO</span>
        </div>
      </div>
    </motion.div>
  );
};
