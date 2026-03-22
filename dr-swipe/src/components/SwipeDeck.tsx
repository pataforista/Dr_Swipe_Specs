import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import type { Card } from '../types/game';
import { useGameAudio } from '../hooks/useGameAudio';
import { triggerHaptic } from '../utils/hapticFeedback';

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
    <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-6 px-2 sm:px-4">
      <div className="relative w-full h-[28rem] flex items-center justify-center md:h-[30rem]">

        {/* Deck Progress Pips */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10 w-full justify-center max-w-[200px]">
          {cards.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === currentIndex ? '32px' : '8px',
                backgroundColor: i < currentIndex
                  ? 'rgba(135,206,235,0.2)'
                  : i === currentIndex
                  ? '#87CEEB'
                  : 'rgba(92,64,51,0.05)'
              }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        <AnimatePresence mode="popLayout">
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
      <AnimatePresence>
        {lifelineActive && cards[currentIndex] && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`w-full max-w-sm mx-auto px-6 py-4 rounded-[2rem] border-2 text-center shadow-xl relative backdrop-blur-md flex items-center justify-between gap-4 ${
              cards[currentIndex].expected_action === 'keep'
                ? 'bg-moomin-primary/10 border-moomin-primary/30 text-moomin-text'
                : 'bg-moomin-accent/10 border-moomin-accent/30 text-moomin-text'
            }`}
          >
            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l-2 border-t-2 ${
              cards[currentIndex].expected_action === 'keep' ? 'bg-[#F0FAFF] border-moomin-primary/30' : 'bg-[#FFF5F2] border-moomin-accent/30'
            }`} />
            <button
              onClick={(e) => { e.stopPropagation(); onUseLifeline?.(); }}
              className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white/80 transition-colors z-20 flex-shrink-0"
              title="Cerrar pista"
            >
              ✕
            </button>
            <span className="relative z-10 italic text-[11px] font-black uppercase tracking-[0.2em] flex-grow">
              {cards[currentIndex].expected_action === 'keep' ? '✨ MANTENER ESTA CARTA ➡️' : '⚠️ DESCARTAR ESTA CARTA ⬅️'}
            </span>
            <div className="w-8 h-8" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tinder-style circular action buttons */}
      <div className="flex items-center justify-center gap-5 w-full">
        {/* Discard — X */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            disabled={isLocked}
            onPointerDown={(e) => { e.stopPropagation(); playSwipe('left'); onSwipe('left'); }}
            whileHover={!isLocked ? { scale: 1.12, y: -3 } : {}}
            whileTap={!isLocked ? { scale: 0.9, rotate: -5 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="w-16 h-16 rounded-full bg-white border-2 border-moomin-accent/40 text-moomin-accent flex items-center justify-center shadow-lg text-2xl disabled:opacity-30 hover:bg-moomin-accent hover:text-white hover:border-moomin-accent transition-colors select-none"
            aria-label="Descartar"
          >
            ✕
          </motion.button>
          <span className="text-[9px] font-black text-moomin-accent/60 uppercase tracking-widest">Descartar</span>
        </div>

        {/* Lifeline */}
        {onUseLifeline && (
          <div className="flex flex-col items-center gap-1.5">
            <motion.button
              disabled={!canUseLifeline || isLocked}
              onClick={(e) => { e.stopPropagation(); onUseLifeline(); }}
              whileHover={canUseLifeline && !isLocked ? { scale: 1.15, rotate: 15 } : {}}
              whileTap={canUseLifeline && !isLocked ? { scale: 0.9 } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-md transition-colors text-lg ${lifelineActive ? 'bg-moomin-secondary border-moomin-secondary text-white' : 'bg-white border-moomin-secondary/40 text-moomin-secondary hover:bg-moomin-secondary/10 disabled:opacity-30'}`}
              aria-label="Usar pista (25 monedas)"
              title="Pista — 25 🪙"
            >
              💡
            </motion.button>
            <span className="text-[9px] font-black text-moomin-secondary/60 uppercase tracking-widest">Pista</span>
          </div>
        )}

        {/* Keep — Heart */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            disabled={isLocked}
            onPointerDown={(e) => { e.stopPropagation(); playSwipe('right'); onSwipe('right'); }}
            whileHover={!isLocked ? { scale: 1.12, y: -3 } : {}}
            whileTap={!isLocked ? { scale: 0.9, rotate: 5 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="w-16 h-16 rounded-full bg-white border-2 border-moomin-primary/40 text-moomin-primary flex items-center justify-center shadow-lg text-2xl disabled:opacity-30 hover:bg-moomin-primary hover:text-white hover:border-moomin-primary transition-colors select-none"
            aria-label="Mantener"
          >
            ♥
          </motion.button>
          <span className="text-[9px] font-black text-moomin-primary/60 uppercase tracking-widest">Mantener</span>
        </div>
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
  const [showDragHint, setShowDragHint] = React.useState(true);

  const rotate = useTransform(x, [-250, 250], [-25, 25]);
  const overlayOpacityLeft = useTransform(x, [0, -80], [0, 1]);
  const overlayOpacityRight = useTransform(x, [0, 80], [0, 1]);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowDragHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const isLethal = card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded;
  const isCritical = card.safety_flags?.decision_critical;

  // Header gradient based on safety level
  const headerGradient = isLethal
    ? 'from-red-50 via-moomin-accent/20 to-moomin-accent/30'
    : isCritical
    ? 'from-orange-50 via-orange-100 to-orange-200'
    : 'from-sky-50 via-moomin-primary/15 to-moomin-primary/25';

  const cardBorderColor = isLethal
    ? 'border-moomin-accent/30'
    : isCritical
    ? 'border-orange-300/40'
    : 'border-moomin-primary/10';

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (!isTop) return;

    setShowDragHint(false);
    const threshold = 50;
    const velocity = info.velocity.x;

    try {
      if (info.offset.x > threshold || velocity > 400) {
        playSwipe('right');
        triggerHaptic('cardSwipe');
        await controls.start({ x: 600, opacity: 0, rotate: 20, transition: { duration: 0.3 } });
        onSwipe('right');
      } else if (info.offset.x < -threshold || velocity < -400) {
        playSwipe('left');
        triggerHaptic('cardSwipe');
        await controls.start({ x: -600, opacity: 0, rotate: -20, transition: { duration: 0.3 } });
        onSwipe('left');
      } else {
        controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } });
      }
    } catch (error) {
      console.error('Error during drag end:', error);
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 500, damping: 18 } });
    }
  };

  return (
    <motion.div
      className={`absolute w-full h-[28rem] swipe-card cursor-grab active:cursor-grabbing bg-white rounded-[2rem] border-2 ${cardBorderColor} overflow-hidden md:h-[30rem]`}
      style={{
        x,
        rotate,
        zIndex: 10 - indexOffset,
        boxShadow: isTop
          ? '0 20px 60px -10px rgba(135,206,235,0.3), 0 4px 16px -4px rgba(0,0,0,0.08)'
          : '0 4px 12px rgba(0,0,0,0.04)',
      }}
      drag={isTop && !isLocked ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={isTop ? controls : "stacked"}
      variants={{
        stacked: {
          scale: 1 - indexOffset * 0.04,
          opacity: 1 - indexOffset * 0.15,
          y: indexOffset * 10,
          transition: { type: 'spring', stiffness: 300, damping: 25 }
        }
      }}
      initial={{ scale: 0.85, opacity: 0, y: 40 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      whileHover={isTop && !isLocked ? { scale: 1.01, y: -3 } : {}}
    >
      {/* ── Swipe stamps — top corners, Tinder style ── */}
      <motion.div
        style={{ opacity: overlayOpacityLeft }}
        className="absolute top-6 left-5 z-30 pointer-events-none"
      >
        <div className="border-[3px] border-moomin-accent text-moomin-accent font-black text-base px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] rotate-[-18deg] bg-white/80 shadow-md">
          DESCARTAR
        </div>
      </motion.div>

      <motion.div
        style={{ opacity: overlayOpacityRight }}
        className="absolute top-6 right-5 z-30 pointer-events-none"
      >
        <div className="border-[3px] border-moomin-primary text-moomin-primary font-black text-base px-4 py-1.5 rounded-xl uppercase tracking-[0.2em] rotate-[18deg] bg-white/80 shadow-md">
          MANTENER
        </div>
      </motion.div>

      {/* ── Visual header area (~45% height) — replaces Tinder photo ── */}
      <div className={`relative h-[45%] bg-gradient-to-br ${headerGradient} flex items-center justify-center overflow-hidden`}>

        {/* Safety badge — top-left */}
        {(isLethal || isCritical) && isTop && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm backdrop-blur-sm border ${
              isLethal
                ? 'bg-white/80 text-moomin-accent border-moomin-accent/20'
                : 'bg-white/80 text-orange-500 border-orange-200'
            }`}
          >
            <span
              className="animate-pulse w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: isLethal ? '#FF9F7F' : '#F6AD55' }}
            />
            {isLethal ? 'RIESGO ALTO' : 'IMPORTANTE'}
          </motion.div>
        )}

        {/* Card counter — top-right */}
        <div className="absolute top-3 right-3 z-20 px-2.5 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/40">
          <span className="text-[9px] font-black text-moomin-text/50 uppercase tracking-widest">
            {cardNumber} / {totalCards}
          </span>
        </div>

        {/* Big icon — center */}
        <motion.div
          animate={isTop ? {
            rotate: [0, -5, 5, 0],
            y: [0, -3, 3, 0]
          } : {}}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-6xl drop-shadow-sm select-none"
        >
          {getIcon(card.ui_icon)}
        </motion.div>

        {/* Category overlay — bottom of header, like Tinder name/age */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/25 to-transparent pt-10 pb-3 px-5">
          <span className="text-white font-black text-sm uppercase tracking-wider drop-shadow-sm">
            {card.category}
          </span>
        </div>

        {/* Drag hint */}
        {showDragHint && isTop && !isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden sm:flex"
          >
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/60 shadow-md">
              <motion.span
                animate={{ x: [-6, 6, -6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-2 text-[10px] font-black text-moomin-muted uppercase tracking-[0.2em]"
              >
                ⬅️ desliza ➡️
              </motion.span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Content area (~55% height) ── */}
      <div className="flex flex-col h-[55%] px-6 pt-5 pb-4 relative z-10">

        {/* Card text */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <p className={`
            font-display font-black text-moomin-text leading-[1.3] tracking-tight italic text-center
            ${card.card_text.length > 140 ? 'text-base sm:text-lg' :
              card.card_text.length > 80 ? 'text-lg sm:text-xl' :
              'text-xl sm:text-2xl'}
            max-h-full overflow-y-auto custom-scrollbar pr-1
          `}>
            {card.card_text}
          </p>
        </div>

        {/* Footer: priority bars + reference */}
        <div className="flex justify-between items-center pt-3 border-t border-moomin-text/5 mt-2 flex-shrink-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-black text-moomin-muted uppercase tracking-[0.2em] italic">PRIORIDAD</span>
            <div className="flex gap-1">
              <div className={`w-6 h-1.5 rounded-full ${isLethal ? 'bg-moomin-accent shadow-[0_0_6px_rgba(255,159,127,0.5)]' : isCritical ? 'bg-orange-400' : 'bg-moomin-primary shadow-[0_0_6px_rgba(135,206,235,0.4)]'}`} />
              <div className={`w-6 h-1.5 rounded-full ${isCritical || isLethal ? (isLethal ? 'bg-moomin-accent/30' : 'bg-orange-200') : 'bg-moomin-muted/10'}`} />
              <div className={`w-6 h-1.5 rounded-full ${isLethal ? 'bg-moomin-accent/10' : 'bg-moomin-muted/5'}`} />
            </div>
          </div>
          <span className="text-[8px] font-black text-moomin-muted/30 tracking-widest">
            REF: {card.card_id.toUpperCase().slice(-6)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
