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
    <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-10 px-2 sm:px-4">
    <div className="relative w-full h-[24rem] flex items-center justify-center perspective-1000 md:h-[28rem]">

      {/* Swipe Direction Hints - Simplified to reduce clutter */}
      {/* Informational overlays appear on drag, no static side arrows needed */}

      {/* Deck Progress Pips - Playful rounded bars */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10 w-full justify-center max-w-[200px]">
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

    {/* Lifeline Hint Overlay - Playful Speech Bubble */}
    <AnimatePresence>
      {lifelineActive && cards[currentIndex] && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`w-full max-w-sm mx-auto mb-4 px-6 py-4 rounded-[2rem] border-2 text-center shadow-xl relative backdrop-blur-md flex items-center justify-between gap-4 ${
            cards[currentIndex].expected_action === 'keep'
              ? 'bg-moomin-primary/10 border-moomin-primary/30 text-moomin-text'
              : 'bg-moomin-accent/10 border-moomin-accent/30 text-moomin-text'
          }`}
        >
          {/* Bubble Arrow */}
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

    {/* Tap Zones — alternative to swiping on mobile */}
    <div className="flex gap-3 sm:gap-4 w-full px-0">
      <motion.button
        disabled={isLocked}
        onPointerDown={(e) => { e.stopPropagation(); playSwipe('left'); onSwipe('left'); }}
        whileHover={!isLocked ? { scale: 1.05, y: -2 } : {}}
        whileTap={!isLocked ? { scale: 0.95, rotate: -2 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className="flex-1 flex items-center justify-center gap-2 py-4 sm:py-5 px-3 rounded-[2rem] border-2 border-moomin-accent/20 bg-white text-moomin-accent font-black text-xs sm:text-sm uppercase tracking-widest disabled:opacity-30 select-none transition-all shadow-lg hover:bg-moomin-accent hover:text-white"
        aria-label="Descartar"
      >
        <span className="text-xl">←</span> <span className="hidden sm:inline">Descartar</span>
      </motion.button>

      {/* Lifeline Button */}
      {onUseLifeline && (
        <motion.button
          disabled={!canUseLifeline || isLocked}
          onClick={(e) => { e.stopPropagation(); onUseLifeline(); }}
          whileHover={canUseLifeline && !isLocked ? { scale: 1.15, rotate: 15 } : {}}
          whileTap={canUseLifeline && !isLocked ? { scale: 0.9 } : {}}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className={`w-14 sm:w-16 h-14 sm:h-16 flex items-center justify-center rounded-full border-2 transition-all shadow-lg ${lifelineActive ? 'bg-moomin-secondary border-white text-white' : 'bg-white border-moomin-secondary/30 text-moomin-secondary hover:bg-moomin-secondary/10'}`}
          aria-label="Usar pista (25 monedas)"
          title="Pista — 25 🪙"
        >
          💡
        </motion.button>
      )}

      <motion.button
        disabled={isLocked}
        onPointerDown={(e) => { e.stopPropagation(); playSwipe('right'); onSwipe('right'); }}
        whileHover={!isLocked ? { scale: 1.05, y: -2 } : {}}
        whileTap={!isLocked ? { scale: 0.95, rotate: 2 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
        className="flex-1 flex items-center justify-center gap-2 py-4 sm:py-5 px-3 rounded-[2rem] border-2 border-moomin-primary/20 bg-white text-moomin-primary font-black text-xs sm:text-sm uppercase tracking-widest disabled:opacity-30 select-none transition-all shadow-lg hover:bg-moomin-primary hover:text-white"
        aria-label="Mantener"
      >
        <span className="hidden sm:inline">Mantener</span> <span className="text-xl">→</span>
      </motion.button>
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

  // Auto-hide the drag hint after first drag attempt
  React.useEffect(() => {
    const timer = setTimeout(() => setShowDragHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Safety level for border accent
  const isLethal = card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded;
  const isCritical = card.safety_flags?.decision_critical;
  
  const cardBorderColor = isLethal
    ? 'border-moomin-accent/40'
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
      className={`absolute w-full h-[24rem] swipe-card cursor-grab active:cursor-grabbing group bg-white rounded-[2.5rem] border-4 ${cardBorderColor} overflow-hidden`}
      style={{
        x,
        rotate,
        zIndex: 10 - indexOffset,
        boxShadow: isTop ? '0 25px 50px -12px rgba(135,206,235,0.25)' : 'none',
      }}
      drag={isTop && !isLocked ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      animate={isTop ? controls : "stacked"}
      variants={{
        stacked: {
          scale: 1 - indexOffset * 0.05,
          opacity: 1 - indexOffset * 0.2,
          y: indexOffset * 12,
          transition: { type: 'spring', stiffness: 300, damping: 25 }
        }
      }}
      initial={{ scale: 0.8, opacity: 0, y: 40 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      whileHover={isTop && !isLocked ? { scale: 1.02, y: -4 } : {}}
    >
      {/* Playful Corner Accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-moomin-primary/10 rounded-tl-xl" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-moomin-primary/10 rounded-br-xl" />

      {/* Safety Flag Badge - Playful Pill Style */}
      {(isLethal || isCritical) && isTop && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-5 left-5 z-30 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-sm ${
            isLethal
              ? 'bg-moomin-accent/10 text-moomin-accent border border-moomin-accent/20'
              : 'bg-orange-100 text-orange-600 border border-orange-200'
          }`}
        >
          <span className="animate-pulse w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: isLethal ? '#FF9F7F' : '#F6AD55' }}
          />
          {isLethal ? 'RIESGO ALTO' : 'IMPORTANTE'}
        </motion.div>
      )}

      {/* Drag Hint - Playful floating guide */}
      {showDragHint && isTop && !isLocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none z-40 hidden sm:block"
        >
          <div className="flex flex-col items-center gap-1 bg-white/90 px-4 py-2 rounded-full border border-moomin-primary/20 shadow-lg">
            <motion.div
              animate={{ x: [-8, 8, -8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-3"
            >
              <span className="text-sm font-black text-moomin-accent">⬅️</span>
              <span className="text-[10px] font-black text-moomin-muted uppercase tracking-[0.2em] italic">DESLIZA</span>
              <span className="text-sm font-black text-moomin-primary">➡️</span>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Card Metadata Badge */}
      <div className="absolute top-6 right-6 px-3 py-1 bg-moomin-bg/50 rounded-full border border-moomin-text/5 flex items-center justify-center">
        <span className="text-[9px] font-black text-moomin-primary/40 uppercase tracking-widest italic">
          {cardNumber} / {totalCards}
        </span>
      </div>

      {/* Swipe Direction Overlays - Playful Stamps */}
      <motion.div
        style={{ opacity: overlayOpacityLeft }}
        className="absolute inset-0 bg-moomin-accent/10 pointer-events-none flex items-center justify-center z-20"
      >
        <motion.div
          style={{ scale: useTransform(x, [0, -100], [0.5, 1]), rotate: -15 }}
          className="bg-white border-4 border-moomin-accent text-moomin-accent font-black text-2xl px-6 py-3 rounded-2xl shadow-xl uppercase italic tracking-widest"
        >
          DESCARTAR
        </motion.div>
      </motion.div>

      <motion.div
        style={{ opacity: overlayOpacityRight }}
        className="absolute inset-0 bg-moomin-primary/10 pointer-events-none flex items-center justify-center z-20"
      >
        <motion.div
          style={{ scale: useTransform(x, [0, 100], [0.5, 1]), rotate: 15 }}
          className="bg-white border-4 border-moomin-primary text-moomin-primary font-black text-2xl px-6 py-3 rounded-2xl shadow-xl uppercase italic tracking-widest"
        >
          MANTENER
        </motion.div>
      </motion.div>

      <div className="flex flex-col h-full p-8 relative z-10 overflow-hidden">
        {/* Card Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] text-moomin-muted uppercase mb-2 italic">CATEGORÍA</span>
            <div className="px-4 py-1.5 bg-moomin-bg rounded-2xl border border-moomin-text/5 inline-block">
              <span className="text-[12px] font-black text-moomin-primary uppercase tracking-wider">{card.category}</span>
            </div>
          </div>
          <motion.div
            animate={isTop ? { 
              rotate: [0, -5, 5, 0],
              y: [0, -2, 2, 0]
            } : {}}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-16 h-16 bg-moomin-bg rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner border border-moomin-text/5"
          >
            {getIcon(card.ui_icon)}
          </motion.div>
        </div>

        {/* Card Text - High Legibility Playful Type with content-aware sizing and scroll */}
        <div className="flex-grow flex flex-col justify-center overflow-hidden">
          <p className={`
            font-display font-black text-moomin-text leading-[1.3] tracking-tight italic text-center
            ${card.card_text.length > 140 ? 'text-lg sm:text-xl' : 
              card.card_text.length > 80 ? 'text-xl sm:text-2xl' : 
              'text-2xl sm:text-3xl'}
            max-h-full overflow-y-auto custom-scrollbar pr-1
          `}>
            {card.card_text}
          </p>
        </div>

        {/* Card Footer */}
        <div className="mt-8 pt-6 border-t border-moomin-text/5 flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-moomin-muted uppercase tracking-[0.2em] italic">PRIORIDAD</span>
            <div className="flex gap-1.5">
              <div className={`w-8 h-2 rounded-full ${isLethal ? 'bg-moomin-accent shadow-[0_0_8px_rgba(255,159,127,0.4)]' : isCritical ? 'bg-orange-400' : 'bg-moomin-primary shadow-[0_0_8px_rgba(135,206,235,0.4)]'}`} />
              <div className={`w-8 h-2 rounded-full ${isCritical || isLethal ? (isLethal ? 'bg-moomin-accent/30' : 'bg-orange-200') : 'bg-moomin-muted/10'}`} />
              <div className={`w-8 h-2 rounded-full ${isLethal ? 'bg-moomin-accent/10' : 'bg-moomin-muted/5'}`} />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-moomin-muted font-black tracking-[0.3em] uppercase italic">FICHA MÉDICA</span>
            <span className="text-[8px] font-black text-moomin-muted/30 tracking-widest mt-1">REF: {card.card_id.toUpperCase().slice(-6)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
