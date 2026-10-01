import React, { useEffect } from 'react';
import { motion, useIsPresent, useMotionValue, useMotionValueEvent, useTransform, useAnimation, AnimatePresence, type MotionValue, type PanInfo } from 'framer-motion';
import { X, ClipboardCheck, Dna, Sparkles } from 'lucide-react';
import type { Card } from '../types/game';
import { useGameAudio } from '../hooks/useGameAudio';
import { triggerHaptic } from '../utils/hapticFeedback';
import { LIFELINE_COST } from '../store/useCodexStore';

interface SwipeDeckProps {
  cards: Card[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right') => void;
  isLocked?: boolean;
  lifelineActive?: boolean;
  canUseLifeline?: boolean;
  onUseLifeline?: () => void;
  /** Study mode only: show which direction is lethal before the decision. */
  revealLethalDirection?: boolean;
}

export interface DraggableCardHandle {
  swipeOut: (direction: 'left' | 'right') => Promise<void>;
}

const SwipeDeckComponent: React.FC<SwipeDeckProps> = ({
  cards, currentIndex, onSwipe, isLocked, lifelineActive, canUseLifeline, onUseLifeline, revealLethalDirection
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
        {/* Progress indicator inside the deck area */}
        <div className="absolute -top-9 sm:-top-10 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none z-50 w-full justify-center px-6">
          {cards.length > 8 ? (
            <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden border border-slate-300/10 max-w-[280px]">
              <motion.div
                animate={{ width: `${(currentIndex / cards.length) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-[#0D9488] rounded-full"
              />
            </div>
          ) : (
            cards.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentIndex ? '40px' : '6px',
                  backgroundColor: i < currentIndex
                    ? 'rgba(13, 148, 136, 0.35)'
                    : i === currentIndex
                    ? '#0D9488'
                    : 'rgba(148, 163, 184, 0.4)'
                }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="h-1 sm:h-1.5 rounded-full"
              />
            ))
          )}
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
                animatingRef={isAnimatingRef}
                revealLethalDirection={revealLethalDirection}
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
            className={`mt-2 sm:mt-4 px-4 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl italic text-[10px] sm:text-[11px] font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase shadow-lg z-50 relative backdrop-blur-sm border-2 max-w-xs ${
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
            className={`w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white border text-accent-alert shadow-xl flex items-center justify-center text-2xl sm:text-3xl hover:bg-rose-50 hover:border-accent-alert/50 transition-all disabled:opacity-20 select-none overflow-hidden active:shadow-inner relative ${
              lifelineActive && cards[currentIndex]?.expected_action === 'discard' ? 'sticker-glow border-accent-alert/100 animate-pulse' : 'border-slate-200'
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.accent-alert/10),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
            <X className="relative z-10 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={3} aria-hidden="true" />
          </motion.button>
          <span className={`text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] transition-colors text-center whitespace-nowrap ${
            lifelineActive && cards[currentIndex]?.expected_action === 'discard' ? 'text-accent-alert' : 'text-slate-500 group-hover:text-accent-alert'
          }`}>DESCARTAR</span>
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
              lifelineActive ? 'bg-amber-100 border-secondary text-amber-700 sticker-glow' : 'bg-white border-slate-200 text-secondary hover:bg-amber-50 hover:border-secondary/40 disabled:opacity-20'
            }`}
              title={`Escanear Carta (Cuesta ${LIFELINE_COST} 🪙)`}
          >
            {lifelineActive ? <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" /> : <Dna className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />}
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
            aria-label="Aceptar esta carta médica (Flecha derecha)"
            title="ACEPTAR"
            disabled={isLocked || visibleCards.length === 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleActionSwipe('right'); }}
            whileHover={!isLocked ? { scale: 1.15, y: -4 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            className={`w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white border text-primary shadow-xl flex items-center justify-center text-2xl sm:text-3xl hover:bg-teal-50 hover:border-primary/50 transition-all disabled:opacity-20 select-none overflow-hidden active:shadow-inner relative ${
              lifelineActive && cards[currentIndex]?.expected_action === 'keep' ? 'sticker-glow border-primary/100 animate-pulse' : 'border-slate-200'
            }`}
          >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.primary/10),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
             <ClipboardCheck className="relative z-10 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} aria-hidden="true" />
          </motion.button>
          <span className={`text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] transition-colors text-center whitespace-nowrap ${
            lifelineActive && cards[currentIndex]?.expected_action === 'keep' ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
          }`}>ACEPTAR</span>
        </div>
      </div>

      {/* Visible keyboard hint — the ← / → shortcut was previously only announced via aria-label */}
      <span className="hidden sm:block text-[11px] font-bold text-slate-300 uppercase tracking-widest text-center" aria-hidden="true">
        ← Descartar &nbsp;·&nbsp; Aceptar →
      </span>
    </div>
  );
};

// The countdown timer in App ticks every second and re-renders the whole
// tree; none of that state affects the deck, so a shallow memo keeps
// SwipeDeck (and its 3 framer-motion cards) from re-rendering on every tick.
export const SwipeDeck = React.memo(SwipeDeckComponent);

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
  animatingRef: React.RefObject<boolean>;
  revealLethalDirection?: boolean;
}

// Card categories are free text written by content authors, and several of
// them predict the answer on their own ("Diagnóstico Diferencial" is 99%
// discard, "Signo Clínico" 100% keep). Before the decision the card only shows
// a broad bucket; the original category is kept for the retrospective.
const normalizeCategory = (category: string) =>
  (category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getDisplayCategory = (category: string): string => {
  const c = normalizeCategory(category);
  const has = (...keys: string[]) => keys.some(k => c.includes(k));
  if (has('vital', 'signo', 'clinic', 'explor', 'examen', 'semiolog', 'sintom', 'physical')) return 'Exploración';
  if (has('diagnost', 'diferencial', 'criterio')) return 'Diagnóstico';
  if (has('lab', 'imag', 'gabinete', 'tomograf', 'rx', 'paraclin', 'otoscop', 'colposc', 'estudio')) return 'Estudios';
  if (has('med', 'trat', 'manejo', 'farmac', 'antibiot', 'antidot', 'profilax', 'dosis')) return 'Manejo';
  return 'Hallazgo';
};

// Icon helper for scrapbook categories

const CATEGORY_ICONS: Record<string, string> = {
  'Exploración': '🩺',
  'Diagnóstico': '🔎',
  'Estudios': '🧪',
  'Manejo': '💊',
  'Hallazgo': '📋',
};

import { calculateExitPosition, SWIPE_CONFIG } from '../utils/swipePhysics';

const DraggableCard = React.forwardRef<DraggableCardHandle, DraggableCardProps>(({
  card, isTop, indexOffset, onSwipe, playSwipe, isLocked, cardNumber, totalCards, topX, animatingRef, revealLethalDirection
}, ref) => {
  // Each card owns its x. The top card mirrors it into the shared topX so the
  // cards behind can rise one step as it leaves (they used to read a private
  // value that never moved, so the stack sat frozen and fully overlapped).
  // topX is only ever set, never animated or bound to a draggable element:
  // when it was the top card's own x, the unmounting previous card stopped
  // the new card's exit animation, its promise never resolved and the deck
  // locked up after a fast flick.
  const x = useMotionValue(0);
  const isPresent = useIsPresent(); // false while a swiped card plays its exit
  useMotionValueEvent(x, 'change', (latest) => {
    if (isTop && isPresent) topX.set(latest);
  });
  const controls = useAnimation();
  const pastThresholdRef = React.useRef(false);

  React.useImperativeHandle(ref, () => ({
    swipeOut: async (direction: 'left' | 'right') => {
      playSwipe(direction);
      triggerHaptic('cardSwipe');
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
      x.set(0);
      topX.set(0); // the stack settles into its new depths
      controls.start({ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } });
    }
  }, [isTop, controls, x, topX]);

  // Dynamic font scaling logic for dense clinical cases
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len < 50) return 'text-2xl sm:text-3xl md:text-4xl';
    if (len < 100) return 'text-xl sm:text-2xl md:text-3xl';
    if (len < 150) return 'text-lg sm:text-xl md:text-2xl';
    return 'text-base sm:text-lg md:text-xl';
  };

  const threshold = SWIPE_CONFIG.CARD_WIDTH * SWIPE_CONFIG.DRAG_THRESHOLD;
  const rotate = useTransform(x, [-300, 300], [-10, 10]);
  const scaleTop = useTransform(x, [-200, 0, 200], [1.02, 1, 1.02]);

  // Stack depth: each card sits one step further back (offset 1 and 2 used to
  // share the same pose) and moves one step forward as the top card is dragged.
  const depth = Math.max(0, indexOffset);
  const restScale = 1 - depth * 0.04;
  const nextScale = 1 - Math.max(0, depth - 1) * 0.04;
  const stackScale = useTransform(topX, [-300, 0, 300], [nextScale, restScale, nextScale]);
  const stackY = useTransform(topX, [-300, 0, 300], [Math.max(0, depth - 1) * 12, depth * 12, Math.max(0, depth - 1) * 12]);
  const tilt = indexOffset % 2 === 0 ? 1.5 : -1.5;
  const stackRotate = useTransform(topX, [-300, 0, 300], [depth > 1 ? tilt : 0, tilt, depth > 1 ? tilt : 0]);

  // Stamps reach full opacity exactly at the commit threshold, so a fully
  // inked stamp means the swipe will go through.
  const overlayOpacityLeft = useTransform(x, [-threshold * 0.3, -threshold], [0, 1]);
  const overlayOpacityRight = useTransform(x, [threshold * 0.3, threshold], [0, 1]);

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const past = Math.abs(info.offset.x) > threshold;
    if (past && !pastThresholdRef.current) triggerHaptic('dragHeavy');
    pastThresholdRef.current = past;
  };

  // `lethal_risk` is authored on cards in both directions (e.g. "ECG en 10 min"
  // is a keep card flagged lethal_risk), so the badge wording follows the card's
  // expected action: lethal to accept only when the right move is to discard.
  //
  // Outside study mode the badge stays neutral: the directional wording
  // matched the expected action one-to-one, so it gave the answer away on
  // exactly the cards with the most at stake. The direction is revealed after
  // the decision, in the mentor's feedback.
  const isLethal = card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded;
  const lethalIfAccepted = !!revealLethalDirection && !!card.safety_flags?.lethal_risk && card.expected_action === 'discard';
  const lethalIfDiscarded = !!revealLethalDirection && !!(card.safety_flags?.lethal_if_discarded || card.safety_flags?.lethal_risk) && card.expected_action === 'keep';
  const lethalNeutral = !!isLethal && !lethalIfAccepted && !lethalIfDiscarded;
  const displayCategory = getDisplayCategory(card.category);
  const isCritical = card.safety_flags?.decision_critical;

  const cardBg = isLethal ? 'bg-rose-50' : isCritical ? 'bg-amber-50' : 'bg-white';
  const accentColor = isLethal ? 'border-accent-alert/40 shadow-rose-100' : isCritical ? 'border-secondary/40 shadow-amber-100' : 'border-slate-100 shadow-slate-200/50';

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    pastThresholdRef.current = false;
    if (!isTop || isLocked) return;
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > SWIPE_CONFIG.VELOCITY_THRESHOLD * 1000) {
      const direction = info.offset.x > 0 ? 'right' : 'left';

      // Mirrors handleActionSwipe's guard: without it, a button tap during the
      // ~250ms exit animation still sees this as the top card and fires a
      // second onSwipe that lands on the NEXT card, sight-unseen (F5).
      animatingRef.current = true;
      try {
        // IMMEDIATE FEEDBACK (T+0)
        playSwipe(direction);
        triggerHaptic('cardSwipe');

        const exitPos = calculateExitPosition(direction, velocity / 1000);

        await controls.start({
          x: exitPos.x,
          y: exitPos.y,
          opacity: 0,
          rotate: exitPos.rotate,
          transition: { duration: SWIPE_CONFIG.EXIT_DURATION, ease: "easeOut" }
        });
        onSwipe(direction);
      } finally {
        animatingRef.current = false;
      }
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 600, damping: 30 } });
    }
  };

  return (
    <motion.div
      className={`absolute w-full h-full rounded-[2.5rem] border-2 ${accentColor} shadow-2xl flex flex-col ${cardBg} select-none overflow-hidden index-card`}
      style={{
        x,
        rotate: isTop ? rotate : stackRotate,
        scale: isTop ? scaleTop : stackScale,
        y: isTop ? 0 : stackY,
        zIndex: 1000 - (indexOffset * 100),
        isolation: 'isolate',
        touchAction: isTop && !isLocked ? 'pan-y' : 'auto',
      }}
      drag={isTop && !isLocked ? "x" : false}
      dragConstraints={{ left: -500, right: 500 }}
      dragElastic={0.4}
      // The exit is animated by handleDragEnd; built-in momentum would fight it.
      dragMomentum={false}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      // The card promoted to top has already risen to the front pose while
      // the previous one flew out (the stack follows topX), so it mounts
      // exactly there instead of jumping back and re-entering (F1).
      initial={isTop ? { scale: 1, y: 0 } : false}
      animate={isTop ? controls : undefined}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {/* Red line margin effect (Notebook style) */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-rose-200/40 z-10" />

      {/* Swipe Stamps - Marker Style */}
      {/* Stamps sit on the side the card is moving away from, so they stay
          inside the card instead of being clipped by its edge. */}
      <motion.div style={{ opacity: isTop ? overlayOpacityLeft : 0 }} className="absolute top-20 right-5 z-50 pointer-events-none">
        <div className="bg-white/90 text-rose-500 font-bold lettering text-xl sm:text-2xl px-4 py-1.5 rounded-xl rotate-12 shadow-md border-4 border-rose-500">DESCARTAR ✕</div>
      </motion.div>
      <motion.div style={{ opacity: isTop ? overlayOpacityRight : 0 }} className="absolute top-20 left-5 z-50 pointer-events-none">
        <div className="bg-white/90 text-primary font-bold lettering text-xl sm:text-2xl px-4 py-1.5 rounded-xl -rotate-12 shadow-md border-4 border-primary">ACEPTAR ✓</div>
      </motion.div>

      {/* Header (Subject Tab) */}
      <div className={`p-4 sm:p-6 pl-8 sm:pl-14 flex justify-between items-center gap-2 border-b border-slate-100 ${isLethal ? 'bg-rose-100/40' : isCritical ? 'bg-amber-100/40' : 'bg-slate-50/60'}`}>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Materia</span>
          <span className="bg-white px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold text-slate-600 shadow-sm border border-slate-100 flex items-center gap-1 sm:gap-2 truncate">
            <span className="flex-shrink-0">{CATEGORY_ICONS[displayCategory]}</span>
            <span className="truncate">{displayCategory}</span>
          </span>
        </div>
        <div className="bg-white/80 px-2 sm:px-3 py-1 rounded-lg border border-slate-100 flex-shrink-0">
           {/* Card number, not the card_id suffix: ids often end in the card's
               type ("..._vitals"), which leaked the same hint as the category. */}
           <span className="text-[11px] sm:text-[10px] font-black text-slate-400 tracking-tighter">#{cardNumber}</span>
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
          {lethalIfAccepted && (
            <div className="bg-rose-500 text-white text-[11px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm lettering tracking-wider">
              ☠️ LETAL SI LO ACEPTAS
            </div>
          )}
          {lethalNeutral && (
            <div className="bg-rose-500 text-white text-[11px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm lettering tracking-wider">
              ⚠️ ALTO RIESGO
            </div>
          )}
          {lethalIfDiscarded && (
            <div className="bg-amber-500 text-white text-[11px] sm:text-[10px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm lettering tracking-wider border-2 border-rose-500/30">
              ⚠️ LETAL SI LO TIRAS
            </div>
          )}
          {isCritical && (
             <div className="bg-amber-400 text-slate-850 text-[11px] sm:text-[10px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm lettering tracking-wider">
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
