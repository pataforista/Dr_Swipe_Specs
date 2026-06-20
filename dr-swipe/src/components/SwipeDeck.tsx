import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence, type MotionValue, type PanInfo } from 'framer-motion';
import type { Card } from '../types/game';
import { useGameAudio } from '../hooks/useGameAudio';
import { triggerHaptic, getSwipeHapticPattern } from '../utils/hapticFeedback';
import { LIFELINE_COST } from '../store/useCodexStore';

interface SwipeDeckProps {
  cards: Card[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right') => void;
  isLocked?: boolean;
  lifelineActive?: boolean;
  canUseLifeline?: boolean;
  onUseLifeline?: () => void;
}

export interface DraggableCardHandle {
  swipeOut: (direction: 'left' | 'right') => Promise<void>;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ 
  cards, currentIndex, onSwipe, isLocked, lifelineActive, canUseLifeline, onUseLifeline 
}) => {
  const { playSwipe } = useGameAudio();
  const topX = useMotionValue(0);
  const topCardRef = React.useRef<DraggableCardHandle>(null);
  // Blocks inputs while the exit animation runs (~250ms). Without it, a double
  // tap or a held arrow key in auto-repeat dispatches a second swipe that the
  // machine applies to the NEXT card, deciding it sight-unseen.
  const isAnimatingRef = React.useRef(false);

  // Take current + 2 more for the stack
  const visibleCards = cards.slice(currentIndex, currentIndex + 3).reverse();

  const handleActionSwipe = React.useCallback(async (direction: 'left' | 'right') => {
    if (isLocked || isAnimatingRef.current || currentIndex >= cards.length) return;
    isAnimatingRef.current = true;
    try {
      if (topCardRef.current) {
        await topCardRef.current.swipeOut(direction);
      } else {
        playSwipe(direction);
        onSwipe(direction);
      }
    } finally {
      isAnimatingRef.current = false;
    }
  }, [isLocked, onSwipe, playSwipe, currentIndex, cards.length]);

  // Keyboard support (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.key === 'ArrowLeft') handleActionSwipe('left');
      if (e.key === 'ArrowRight') handleActionSwipe('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLocked, handleActionSwipe]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-4 sm:gap-8 px-2 sm:px-3 relative overflow-hidden">

      {/* Deck Vertical Spacer/Container */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[3/4.2] flex items-center justify-center overflow-hidden">
        {/* Progress Dots inside the deck area for focus */}
        <div className="absolute -top-9 sm:-top-10 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none z-50 w-full justify-center flex-wrap px-4">
          {cards.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === currentIndex ? '40px' : '6px',
                backgroundColor: i < currentIndex
                  ? 'rgba(34, 211, 238, 0.35)'
                  : i === currentIndex
                  ? '#22D3EE'
                  : 'rgba(148, 163, 184, 0.4)'
              }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="h-1 sm:h-1.5 rounded-full"
            />
          ))}
        </div>

        <AnimatePresence initial={false}>
          {visibleCards.map((card, idx) => {
            const keyIndex = currentIndex + (visibleCards.length - 1 - idx);
            const isTop = idx === visibleCards.length - 1;
            
            return (
              <DraggableCard 
                // CRITICAL: Key includes isTop to force re-mount when becoming top card.
                // This resets Framer Motion drag handlers for the new top card.
                key={`${card.card_id}-${isTop}`}
                ref={isTop ? topCardRef : undefined}
                card={card}
                isTop={isTop}
                indexOffset={keyIndex - currentIndex}
                onSwipe={onSwipe}
                playSwipe={playSwipe}
                isLocked={isLocked}
                cardNumber={keyIndex + 1}
                totalCards={cards.length}
                topX={topX}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Lifeline Hint Area - Floating above actions */}
      <AnimatePresence>
        {lifelineActive && cards[currentIndex] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`mt-2 sm:mt-4 px-4 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl italic text-[10px] sm:text-[11px] font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 relative backdrop-blur-xl border max-w-xs ${
              cards[currentIndex].expected_action === 'keep'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-accent-alert/10 border-accent-alert/20 text-accent-alert'
            }`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t bg-inherit border-inherit" />
            <span className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
               {cards[currentIndex].expected_action === 'keep' ? '⚡ DATO CRÍTICO ➡️' : '🛡️ DESCARTAR ⬅️'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons Hub */}
      <div className="flex items-center justify-center gap-4 sm:gap-10 w-full mt-2 sm:mt-4 relative z-[60]">
        {/* Discard */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 relative group">
          <div className="absolute inset-0 bg-accent-alert/20 rounded-full blur-xl scale-90 group-hover:scale-110 group-hover:bg-accent-alert/40 transition-all opacity-0 group-hover:opacity-100" />
          <motion.button
            type="button"
            aria-label="Descartar esta carta médica (Flecha izquierda)"
            title="DESCARTAR"
            disabled={isLocked || visibleCards.length === 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleActionSwipe('left'); }}
            whileHover={!isLocked ? { scale: 1.15, y: -4 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            className={`w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white border text-accent-alert shadow-xl flex items-center justify-center text-2xl sm:text-3xl hover:bg-slate-800 hover:border-accent-alert/50 transition-all disabled:opacity-20 select-none overflow-hidden active:shadow-inner relative ${
              lifelineActive && cards[currentIndex]?.expected_action === 'discard' ? 'sticker-glow border-accent-alert/100 animate-pulse' : 'border-white/10'
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.accent-alert/10),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
            <span className="relative z-10 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]">✕</span>
          </motion.button>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-colors line-clamp-2 text-center max-w-[70px] sm:max-w-none ${
            lifelineActive && cards[currentIndex]?.expected_action === 'discard' ? 'text-accent-alert' : 'text-slate-500 group-hover:text-accent-alert'
          }`}>PÉRDIDA DE TIEMPO</span>
        </div>

        {/* Hint */}
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <motion.button
            type="button"
            aria-label="Escanear carta médica usando créditos (25 🪙)"
            disabled={!canUseLifeline || isLocked}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onUseLifeline?.(); }}
            whileHover={canUseLifeline && !isLocked ? { scale: 1.15, rotate: 180, boxShadow: '0 0 30px rgba(129,140,248,0.4)' } : {}}
            whileTap={canUseLifeline && !isLocked ? { scale: 0.85 } : {}}
            className={`w-14 sm:w-16 h-14 sm:h-16 rounded-full border shadow-lg flex items-center justify-center text-xl sm:text-2xl transition-all ${
              lifelineActive ? 'bg-secondary/20 border-secondary text-white sticker-glow' : 'bg-white border-white/5 text-secondary hover:bg-white/5 hover:border-white/20 disabled:opacity-20'
            }`}
              title={`Escanear Carta (Cuesta ${LIFELINE_COST} 🪙)`}
          >
            {lifelineActive ? '✨' : '🧬'}
          </motion.button>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] ${lifelineActive ? 'text-secondary' : 'text-slate-500'}`}>
            {lifelineActive ? 'ACTIVO' : `${LIFELINE_COST} 🪙`}
          </span>
        </div>

        {/* Keep */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-90 group-hover:scale-110 group-hover:bg-primary/40 transition-all opacity-0 group-hover:opacity-100" />
          <motion.button
            type="button"
            aria-label="Mantener esta carta médica (Flecha derecha)"
            title="MANTENER"
            disabled={isLocked || visibleCards.length === 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleActionSwipe('right'); }}
            whileHover={!isLocked ? { scale: 1.15, y: -4 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            className={`w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white border text-primary shadow-xl flex items-center justify-center text-2xl sm:text-3xl hover:bg-slate-800 hover:border-primary/50 transition-all disabled:opacity-20 select-none overflow-hidden active:shadow-inner relative ${
              lifelineActive && cards[currentIndex]?.expected_action === 'keep' ? 'sticker-glow border-primary/100 animate-pulse' : 'border-white/10'
            }`}
          >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.primary/10),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
             <span className="relative z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">♥</span>
          </motion.button>
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-colors line-clamp-2 text-center max-w-[70px] sm:max-w-none ${
            lifelineActive && cards[currentIndex]?.expected_action === 'keep' ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
          }`}>ESTO CAMBIA TODO</span>
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
  topX: MotionValue<number>;
}

// Icon helper for scrapbook categories

const getIconForCategory = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('cardio')) return '❤️';
  if (cat.includes('derma')) return '🩹';
  if (cat.includes('gastro')) return '🍏';
  if (cat.includes('neuro')) return '🧠';
  if (cat.includes('psic')) return '🗣️';
  if (cat.includes('ped')) return '👶';
  if (cat.includes('sur')) return '🔪';
  if (cat.includes('inf')) return '🦠';
  if (cat.includes('endo')) return '🧪';
  if (cat.includes('gyn') || cat.includes('obs')) return '🤰';
  return '📋';
};

import { calculateExitPosition, SWIPE_CONFIG } from '../utils/swipePhysics';

const DraggableCard = React.forwardRef<DraggableCardHandle, DraggableCardProps>(({
  card, isTop, indexOffset, onSwipe, playSwipe, isLocked, cardNumber, totalCards, topX
}, ref) => {
  const fallbackX = useMotionValue(0);
  const x = isTop ? topX : fallbackX;
  const controls = useAnimation();

  React.useImperativeHandle(ref, () => ({
    swipeOut: async (direction: 'left' | 'right') => {
      playSwipe(direction);
      triggerHaptic(getSwipeHapticPattern(card, direction));
      const exitPos = calculateExitPosition(direction, 0); // No velocity on button click
      await controls.start({ 
        x: exitPos.x, 
        y: exitPos.y,
        opacity: 0, 
        rotate: exitPos.rotate, 
        transition: { duration: SWIPE_CONFIG.EXIT_DURATION, ease: "easeOut" } 
      });
      onSwipe(direction);
    }
  }));

  useEffect(() => {
    if (isTop) {
      x.set(0); // Reset position when becoming top card
      controls.start({ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } });
    }
  }, [isTop, controls, x]);

  // Dynamic font scaling logic for dense clinical cases
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len < 50) return 'text-2xl sm:text-3xl md:text-4xl';
    if (len < 100) return 'text-lg sm:text-xl md:text-2xl';
    if (len < 150) return 'text-base sm:text-lg md:text-xl';
    return 'text-sm sm:text-base md:text-lg';
  };

  const rotate = useTransform(x, [-300, 300], [-10, 10]);
  const scaleTop = useTransform(x, [-200, 0, 200], [1.02, 1, 1.02]);
  
  // Stack visibility: gentle paper stacking
  const stackScale = useTransform(x, [-300, 0, 300], [1, 0.96, 1]);
  const stackY = useTransform(x, [-300, 0, 300], [0, 12, 0]);
  const stackOpacity = useTransform(x, [-300, 0, 300], [1, 0.9, 1]);
  const stackRotate = useTransform(x, [-300, 0, 300], [0, (indexOffset % 2 === 0 ? 1.5 : -1.5), 0]);

  const overlayOpacityLeft = useTransform(x, [0, -100], [0, 1]);
  const overlayOpacityRight = useTransform(x, [0, 100], [0, 1]);

  const isLethal = card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded;
  const isCritical = card.safety_flags?.decision_critical;

  const cardBg = isLethal ? 'bg-rose-50' : isCritical ? 'bg-amber-50' : 'bg-white';
  const accentColor = isLethal ? 'border-accent-alert/40 shadow-rose-100' : isCritical ? 'border-secondary/40 shadow-amber-100' : 'border-slate-100 shadow-slate-200/50';

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isTop || isLocked) return;
    const threshold = SWIPE_CONFIG.CARD_WIDTH * SWIPE_CONFIG.DRAG_THRESHOLD;
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > SWIPE_CONFIG.VELOCITY_THRESHOLD * 1000) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      
      // IMMEDIATE FEEDBACK (T+0)
      playSwipe(direction);
      triggerHaptic(getSwipeHapticPattern(card, direction));
      
      const exitPos = calculateExitPosition(direction, velocity / 1000);
      
      await controls.start({ 
        x: exitPos.x, 
        y: exitPos.y,
        opacity: 0, 
        rotate: exitPos.rotate, 
        transition: { duration: SWIPE_CONFIG.EXIT_DURATION, ease: "easeOut" } 
      });
      onSwipe(direction);
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 600, damping: 30 } });
    }
  };

  return (
    <motion.div
      className={`absolute w-full h-full rounded-[2.5rem] border-2 ${accentColor} shadow-2xl flex flex-col ${cardBg} select-none overflow-hidden index-card`}
      style={{
        x, rotate: isTop ? rotate : stackRotate,
        scale: isTop ? scaleTop : stackScale,
        y: isTop ? 0 : stackY,
        opacity: isTop ? 1 : stackOpacity,
        zIndex: 1000 - (indexOffset * 100),
        isolation: 'isolate',
        touchAction: isTop && !isLocked ? 'pan-y' : 'auto',
      }}
      drag={isTop && !isLocked ? "x" : false}
      dragConstraints={{ left: -500, right: 500 }}
      dragElastic={0.4}
      onDragEnd={handleDragEnd}
      initial={isTop ? { opacity: 0, scale: 0.9, y: 30 } : false}
      animate={isTop ? controls : undefined}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {/* Red line margin effect (Notebook style) */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-rose-200/40 z-10" />

      {/* Swipe Stamps - Marker Style */}
      <motion.div style={{ opacity: overlayOpacityLeft }} className="absolute top-12 left-12 z-50 pointer-events-none">
        <div className="bg-rose-500 text-white font-bold lettering text-3xl px-8 py-3 rounded-xl -rotate-12 shadow-lg border-2 border-white/20">NO SIRVE 🖍️</div>
      </motion.div>
      <motion.div style={{ opacity: overlayOpacityRight }} className="absolute top-12 right-12 z-50 pointer-events-none">
        <div className="bg-cyan-500 text-white font-bold lettering text-3xl px-8 py-3 rounded-xl rotate-12 shadow-lg border-2 border-white/20">¡QUÉ NIVEL! ✨</div>
      </motion.div>

      {/* Header (Subject Tab) */}
      <div className={`p-4 sm:p-6 pl-8 sm:pl-14 flex justify-between items-center gap-2 border-b border-slate-100 ${isLethal ? 'bg-rose-100/40' : isCritical ? 'bg-amber-100/40' : 'bg-slate-50/60'}`}>
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Materia</span>
          <span className="bg-white px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold text-slate-600 shadow-sm border border-slate-100 flex items-center gap-1 sm:gap-2 truncate">
            <span className="flex-shrink-0">{getIconForCategory(card.category)}</span>
            <span className="truncate">{card.category}</span>
          </span>
        </div>
        <div className="bg-white/80 px-2 sm:px-3 py-1 rounded-lg border border-slate-100 flex-shrink-0">
           <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-tighter">#{card.card_id.split('_').pop()}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-6 sm:p-10 pl-10 sm:pl-16 flex flex-col justify-center relative">
         <p className={`font-semibold leading-relaxed text-slate-800 text-center ${getFontSizeClass(card.card_text)} px-2`}>
          {card.card_text}
        </p>
      </div>

      {/* Highlighter Labels */}
      {(isLethal || isCritical) && (
        <div className="p-4 sm:p-6 pt-0 sm:pt-0 pl-8 sm:pl-14 flex justify-center gap-2 sm:gap-3 flex-wrap">
          {isLethal && (
            <div className="bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm lettering tracking-wider">
              ⚠️ ¡Letal!
            </div>
          )}
          {isCritical && (
             <div className="bg-amber-400 text-slate-800 text-[9px] sm:text-[10px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm lettering tracking-wider">
              👀 ¡ENARM!
            </div>
          )}
        </div>
      )}

      {/* Card Footer */}
      <div className="p-3 sm:p-5 pl-8 sm:pl-14 bg-slate-50/40 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 gap-2">
        <span className="lettering text-sm sm:text-lg text-slate-300 truncate">Guardia nocturna...</span>
        <div className="bg-white px-2 sm:px-3 py-1 rounded-full border border-slate-100 text-slate-500 flex-shrink-0 whitespace-nowrap">
          {cardNumber}/{totalCards}
        </div>
      </div>
    </motion.div>
  );
});
