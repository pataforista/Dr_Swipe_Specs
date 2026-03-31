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

export interface DraggableCardHandle {
  swipeOut: (direction: 'left' | 'right') => Promise<void>;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ 
  cards, currentIndex, onSwipe, isLocked, lifelineActive, canUseLifeline, onUseLifeline 
}) => {
  const { playSwipe } = useGameAudio();
  const topX = useMotionValue(0);
  const topCardRef = React.useRef<DraggableCardHandle>(null);

  // Take current + 2 more for the stack
  const visibleCards = cards.slice(currentIndex, currentIndex + 3).reverse();

  const handleActionSwipe = async (direction: 'left' | 'right') => {
    if (isLocked || visibleCards.length === 0) return;
    if (topCardRef.current) {
      await topCardRef.current.swipeOut(direction);
    } else {
      playSwipe(direction);
      onSwipe(direction);
    }
  };

  // Keyboard support (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isLocked) return;
      if (e.key === 'ArrowLeft') handleActionSwipe('left');
      if (e.key === 'ArrowRight') handleActionSwipe('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLocked, onSwipe]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-8 px-2 relative overflow-hidden">

      {/* Deck Vertical Spacer/Container */}
      <div className="relative w-full aspect-[3/4.2] flex items-center justify-center overflow-hidden">
        {/* Progress Dots inside the deck area for focus */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-50 w-full justify-center">
          {cards.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === currentIndex ? '48px' : '8px',
                backgroundColor: i < currentIndex
                  ? 'rgba(34, 211, 238, 0.2)'
                  : i === currentIndex
                  ? '#22D3EE'
                  : 'rgba(255, 255, 255, 0.1)'
              }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="h-1.5 rounded-full"
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
            className={`mt-4 px-8 py-5 rounded-3xl border/10 italic text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 relative backdrop-blur-xl border ${
              cards[currentIndex].expected_action === 'keep' 
                ? 'bg-primary/10 border-primary/20 text-primary' 
                : 'bg-accent-alert/10 border-accent-alert/20 text-accent-alert'
            }`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t bg-inherit border-inherit" />
            <span className="flex items-center gap-3">
               {cards[currentIndex].expected_action === 'keep' ? '⚡ DATO CRÍTICO CONFIRMADO ➡️' : '🛡️ DESCARTAR: INTERFERENCIA DETECTADA ⬅️'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons Hub */}
      <div className="flex items-center justify-center gap-10 w-full mt-2 relative z-[60]">
        {/* Discard */}
        <div className="flex flex-col items-center gap-3 relative group">
          <div className="absolute inset-0 bg-accent-alert/20 rounded-full blur-xl scale-90 group-hover:scale-110 group-hover:bg-accent-alert/40 transition-all opacity-0 group-hover:opacity-100" />
          <motion.button
            disabled={isLocked || visibleCards.length === 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleActionSwipe('left'); }}
            whileHover={!isLocked ? { scale: 1.15, y: -4 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            className={`w-20 h-20 rounded-full bg-slate-900 border text-accent-alert shadow-[0_0_40px_rgba(0,0,0,0.4)] flex items-center justify-center text-3xl hover:bg-slate-800 hover:border-accent-alert/50 transition-all disabled:opacity-20 select-none overflow-hidden active:shadow-inner relative ${
              lifelineActive && cards[currentIndex]?.expected_action === 'discard' ? 'glow-border-alert border-accent-alert/100 animate-pulse' : 'border-white/10'
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.accent-alert/10),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
            <span className="relative z-10 drop-shadow-[0_0_10px_rgba(251,113,133,0.8)]">✕</span>
          </motion.button>
          <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${
            lifelineActive && cards[currentIndex]?.expected_action === 'discard' ? 'text-accent-alert' : 'text-slate-500 group-hover:text-accent-alert'
          }`}>DESCARTAR</span>
        </div>

        {/* Hint */}
        <div className="flex flex-col items-center gap-3">
          <motion.button
            disabled={!canUseLifeline || isLocked}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onUseLifeline?.(); }}
            whileHover={canUseLifeline && !isLocked ? { scale: 1.15, rotate: 180, boxShadow: '0 0 30px rgba(129,140,248,0.4)' } : {}}
            whileTap={canUseLifeline && !isLocked ? { scale: 0.85 } : {}}
            className={`w-16 h-16 rounded-full border shadow-2xl flex items-center justify-center text-2xl transition-all ${
              lifelineActive ? 'bg-secondary/20 border-secondary text-white glow-border-primary' : 'bg-slate-900 border-white/5 text-secondary hover:bg-white/5 hover:border-white/20 disabled:opacity-20'
            }`}
             title="Escanear (25 🪙)"
          >
            {lifelineActive ? '✨' : '🧬'}
          </motion.button>
          <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${lifelineActive ? 'text-secondary' : 'text-slate-500'}`}>{lifelineActive ? 'ACTIVO' : 'ESCANEO'}</span>
        </div>

        {/* Keep */}
        <div className="flex flex-col items-center gap-3 relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-90 group-hover:scale-110 group-hover:bg-primary/40 transition-all opacity-0 group-hover:opacity-100" />
          <motion.button
            disabled={isLocked || visibleCards.length === 0}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleActionSwipe('right'); }}
            whileHover={!isLocked ? { scale: 1.15, y: -4 } : {}}
            whileTap={!isLocked ? { scale: 0.9 } : {}}
            className={`w-20 h-20 rounded-full bg-slate-900 border text-primary shadow-[0_0_40px_rgba(0,0,0,0.4)] flex items-center justify-center text-3xl hover:bg-slate-800 hover:border-primary/50 transition-all disabled:opacity-20 select-none overflow-hidden active:shadow-inner relative ${
              lifelineActive && cards[currentIndex]?.expected_action === 'keep' ? 'glow-border-primary border-primary/100 animate-pulse' : 'border-white/10'
            }`}
          >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.primary/10),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
             <span className="relative z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">♥</span>
          </motion.button>
          <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-colors ${
            lifelineActive && cards[currentIndex]?.expected_action === 'keep' ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
          }`}>MANTENER</span>
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
  topX: any;
}

const ICON_MAP: Record<string, string> = {
  'heartbeat': '🩺', 'heart': '❤️', 'target': '🎯', 'slash': '⚠️',
  'alert-triangle': '⚠️', 'alert-circle': '⚠️', 'eye': '👁️', 'pill': '💊',
  'clock': '⏱️', 'zap': '⚡', 'activity': '📈', 'trending-up': '📈',
  'users': '👨‍⚕️', 'user': '👨‍⚕️', 'search': '🔍', 'grid': '📊',
  'bar-chart-2': '📉', 'maximize': '🔎', 'help-circle': '❓', 'frown': '🤕',
  'rotate-cw': '🔄', 'brain': '🧠', 'message-square': '🗣️', 'alert-octagon': '🚨',
  'shield': '🛡️', 'droplets': '💧', 'check-circle': '✅', 'link': '🔗',
  'refresh-cw': '🔄', 'image': '🖼️', 'dna': '🧬', 'clipboard': '📋',
  'file-text': '📄', 'thermometer': '🌡️', 'test-tube': '🧪'
};

const getIcon = (iconName: string) => {
  if (!iconName) return '📋';
  return ICON_MAP[iconName] || (/\p{Emoji}/u.test(iconName) ? iconName : '📋');
};

const DraggableCard = React.forwardRef<DraggableCardHandle, DraggableCardProps>(({
  card, isTop, indexOffset, onSwipe, playSwipe, isLocked, cardNumber, totalCards, topX
}, ref) => {
  const fallbackX = useMotionValue(0);
  const x = isTop ? topX : fallbackX;
  const controls = useAnimation();

  React.useImperativeHandle(ref, () => ({
    swipeOut: async (direction: 'left' | 'right') => {
      playSwipe(direction);
      triggerHaptic('cardSwipe');
      const exitX = direction === 'right' ? 1200 : -1200;
      await controls.start({ 
        x: exitX, 
        opacity: 0, 
        rotate: direction === 'right' ? 60 : -60, 
        transition: { duration: 0.3 } 
      });
      onSwipe(direction);
    }
  }));

  useEffect(() => {
    if (isTop) {
      controls.start({ opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } });
    }
  }, [isTop, controls]);

  // Dynamic font scaling logic for dense clinical cases
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len < 50) return 'text-3xl md:text-4xl';
    if (len < 100) return 'text-xl md:text-2xl';
    if (len < 150) return 'text-lg md:text-xl';
    return 'text-base md:text-lg';
  };

  const rotate = useTransform(x, [-300, 300], [-35, 35]);
  const scaleTop = useTransform(x, [-200, 0, 200], [1.08, 1, 1.08]);
  const yOffset = useTransform(x, [-200, 0, 200], [-20, 0, -20]);
  
  const stackScale = useTransform(x, [-300, 0, 300], [1 - (indexOffset - 1) * 0.05, 1 - indexOffset * 0.05, 1 - (indexOffset - 1) * 0.05]);
  const stackY = useTransform(x, [-300, 0, 300], [(indexOffset - 1) * 12, indexOffset * 12, (indexOffset - 1) * 12]);

  const overlayOpacityLeft = useTransform(x, [0, -120], [0, 1]);
  const overlayOpacityRight = useTransform(x, [0, 120], [0, 1]);

  const isLethal = card.safety_flags?.lethal_risk || card.safety_flags?.lethal_if_discarded;
  const isCritical = card.safety_flags?.decision_critical;

  const headerGradient = isLethal ? 'from-rose-500/80 to-slate-950' : isCritical ? 'from-amber-500/80 to-slate-950' : 'from-primary/40 to-slate-950';
  const cardBorderColor = isLethal ? 'border-accent-alert/60' : isCritical ? 'bg-amber-500/20 border-amber-500/40' : 'border-white/10';

  const handleDragEnd = async (_event: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (!isTop || isLocked) return;
    const threshold = 80;
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      playSwipe(direction);
      triggerHaptic('cardSwipe');
      const exitX = direction === 'right' ? 1200 : -1200;
      await controls.start({ x: exitX, opacity: 0, rotate: direction === 'right' ? 60 : -60, transition: { duration: 0.3 } });
      onSwipe(direction);
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 600, damping: 30 } });
    }
  };

  return (
    <motion.div
      className={`absolute w-full h-full rounded-[3.5rem] border ${cardBorderColor} overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.5)] flex flex-col bg-slate-950 select-none medical-grid`}
      style={{
        x, rotate,
        scale: isTop ? scaleTop : stackScale,
        y: isTop ? yOffset : stackY,
        opacity: 1,
        zIndex: 1000 - (indexOffset * 100),
        isolation: 'isolate',
        touchAction: isTop && !isLocked ? 'pan-y' : 'auto',
      }}
      drag={isTop && !isLocked ? "x" : false}
      dragConstraints={{ left: -500, right: 500 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      initial={isTop ? { opacity: 0, scale: 0.95, y: 30 } : false}
      animate={isTop ? controls : undefined}
      exit={{ opacity: 0, scale: 0.8 }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
    >
      {/* Swipe Stamps */}
      <motion.div style={{ opacity: overlayOpacityLeft }} className="absolute top-12 left-10 z-50 pointer-events-none">
        <div className="border border-accent-alert/50 text-accent-alert font-black text-xl px-6 py-2 rounded-2xl uppercase tracking-[0.4em] rotate-[-12deg] bg-slate-950/80 backdrop-blur-md shadow-[0_0_20px_rgba(251,113,133,0.3)]">DESCARTAR</div>
      </motion.div>
      <motion.div style={{ opacity: overlayOpacityRight }} className="absolute top-12 right-10 z-50 pointer-events-none">
        <div className="border border-primary/50 text-primary font-black text-xl px-6 py-2 rounded-2xl uppercase tracking-[0.4em] rotate-[12deg] bg-slate-950/80 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.3)]">MANTENER</div>
      </motion.div>

      {/* Header */}
      <div className="relative h-[32%] flex items-center justify-center border-b border-white/10 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${headerGradient} opacity-60`} />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-5 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">{card?.category || 'DATA'}</span>
        </div>
        <div className="absolute bottom-5 right-8 z-30 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-xl border border-white/5">
          <span className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase">{cardNumber} OF {totalCards}</span>
        </div>
        {(isLethal || isCritical) && isTop && (
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`absolute bottom-5 left-8 z-30 px-4 py-1.5 rounded-full text-[8px] font-black tracking-[0.2em] uppercase flex items-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.4)] ${isLethal ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
            <span className="relative z-10">{isLethal ? 'RIESGO LETAL' : 'ESTADO CRÍTICO'}</span>
          </motion.div>
        )}
        <div className="text-7xl drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] relative z-20 flex items-center justify-center h-24 w-24 brightness-125">{getIcon(card?.ui_icon || '')}</div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-10 pt-10 pb-8 bg-slate-950 relative">
        <div className="flex-1 flex items-center justify-center text-center">
          <p className={`font-display font-black text-white leading-[1.1] tracking-tighter italic ${getFontSizeClass(card?.card_text || '')} overflow-y-auto custom-scrollbar h-full flex items-center justify-center pr-2 break-words text-balance w-full drop-shadow-lg`}>
            {card?.card_text || ''}
          </p>
        </div>
        <div className="flex justify-between items-end pt-8 mt-6 border-t border-white/5">
          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">TRIAGE ANALYTICS</span>
            <div className="flex gap-1.5">
              <div className={`w-14 h-1.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,1)] ${isLethal ? 'bg-rose-500' : isCritical ? 'bg-amber-500' : 'bg-primary'}`} />
              <div className={`w-14 h-1.5 rounded-full ${isCritical || isLethal ? (isLethal ? 'bg-rose-500/20' : 'bg-amber-500/20') : 'bg-white/5'}`} />
            </div>
          </div>
          <div className="text-right">
             <span className="text-[9px] font-black text-slate-600 block tracking-[0.3em] uppercase mb-1">DATA SOURCE</span>
             <span className="text-[10px] font-black text-primary/60 tracking-widest uppercase">ID-{card?.card_id?.slice(-4).toUpperCase() || 'CORE'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
