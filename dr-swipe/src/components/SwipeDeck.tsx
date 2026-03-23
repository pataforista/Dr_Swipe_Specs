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

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ 
  cards, currentIndex, onSwipe, isLocked, lifelineActive, canUseLifeline, onUseLifeline 
}) => {
  const { playSwipe } = useGameAudio();
  const topX = useMotionValue(0);

  // Take current + 2 more for the stack
  const visibleCards = cards.slice(currentIndex, currentIndex + 3).reverse();

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
    <div className="flex flex-col items-center w-full max-w-sm mx-auto gap-8 px-2 relative overflow-hidden">

      {/* Deck Vertical Spacer/Container */}
      <div className="relative w-full aspect-[3/4.2] flex items-center justify-center overflow-hidden">
        {/* Progress Dots inside the deck area for focus */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-50 w-full justify-center">
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
            className={`mt-4 px-8 py-4 rounded-[2rem] border-2 italic text-[11px] font-black tracking-[0.2em] uppercase shadow-2xl z-50 relative ${
              cards[currentIndex].expected_action === 'keep' 
                ? 'bg-sky-50 border-sky-200 text-sky-700' 
                : 'bg-orange-50 border-orange-200 text-orange-700'
            }`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l-2 border-t-2 bg-inherit border-inherit" />
            {cards[currentIndex].expected_action === 'keep' ? '✨ MANTENER ESTA CARTA ➡️' : '⚠️ DESCARTAR ESTA CARTA ⬅️'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons Hub */}
      <div className="flex items-center justify-center gap-10 w-full mt-2 relative z-[60]">
        {/* Discard */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            disabled={isLocked}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); if(!isLocked) { playSwipe('left'); onSwipe('left'); } }}
            whileHover={!isLocked ? { scale: 1.12, y: -3 } : {}}
            whileTap={!isLocked ? { scale: 0.85 } : {}}
            className="w-16 h-16 rounded-full bg-white border-4 border-moomin-accent/20 text-moomin-accent shadow-xl flex items-center justify-center text-3xl hover:bg-moomin-accent hover:text-white transition-all disabled:opacity-20 select-none"
          >
            ✕
          </motion.button>
          <span className="text-[10px] font-black text-moomin-accent/40 uppercase tracking-widest">DESCARTAR</span>
        </div>

        {/* Hint */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            disabled={!canUseLifeline || isLocked}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onUseLifeline?.(); }}
            whileHover={canUseLifeline && !isLocked ? { scale: 1.15, rotate: 15 } : {}}
            whileTap={canUseLifeline && !isLocked ? { scale: 0.85 } : {}}
            className={`w-14 h-14 rounded-full border-4 shadow-lg flex items-center justify-center text-2xl transition-all ${
              lifelineActive ? 'bg-moomin-secondary border-moomin-secondary/30 text-white' : 'bg-white border-moomin-secondary/20 text-moomin-secondary hover:bg-moomin-secondary/10 disabled:opacity-20'
            }`}
             title="Pista (25 🪙)"
          >
            💡
          </motion.button>
          <span className="text-[10px] font-black text-moomin-secondary/40 uppercase tracking-widest">PISTA</span>
        </div>

        {/* Keep */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            disabled={isLocked}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); if(!isLocked) { playSwipe('right'); onSwipe('right'); } }}
            whileHover={!isLocked ? { scale: 1.12, y: -3 } : {}}
            whileTap={!isLocked ? { scale: 0.85 } : {}}
            className="w-16 h-16 rounded-full bg-white border-4 border-moomin-primary/20 text-moomin-primary shadow-xl flex items-center justify-center text-3xl hover:bg-moomin-primary hover:text-white transition-all disabled:opacity-20 select-none"
          >
            ♥
          </motion.button>
          <span className="text-[10px] font-black text-moomin-primary/40 uppercase tracking-widest">MANTENER</span>
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

const DraggableCard: React.FC<DraggableCardProps> = ({
  card, isTop, indexOffset, onSwipe, playSwipe, isLocked, cardNumber, totalCards, topX
}) => {
  const fallbackX = useMotionValue(0);
  const x = isTop ? topX : fallbackX;
  const controls = useAnimation();

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

  const headerGradient = isLethal ? 'from-red-200 to-red-300' : isCritical ? 'from-orange-200 to-orange-300' : 'from-sky-200 to-sky-300';
  const cardBorderColor = isLethal ? 'border-red-500' : isCritical ? 'border-orange-500' : 'border-moomin-primary/60';

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
      className={`absolute w-full h-full rounded-[3.5rem] border-4 ${cardBorderColor} overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] flex flex-col bg-white select-none`}
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
        <div className="border-[6px] border-red-600/80 text-red-600 font-extrabold text-2xl px-6 py-2 rounded-2xl uppercase tracking-[0.2em] rotate-[-12deg] bg-white/90 shadow-2xl backdrop-blur-sm">DESCARTAR</div>
      </motion.div>
      <motion.div style={{ opacity: overlayOpacityRight }} className="absolute top-12 right-10 z-50 pointer-events-none">
        <div className="border-[6px] border-sky-600/80 text-sky-600 font-extrabold text-2xl px-6 py-2 rounded-2xl uppercase tracking-[0.2em] rotate-[12deg] bg-white/90 shadow-2xl backdrop-blur-sm">MANTENER</div>
      </motion.div>

      {/* Header */}
      <div className="relative h-[32%] flex items-center justify-center border-b-4 border-slate-100 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${headerGradient}`} />
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 px-5 py-1.5 bg-white rounded-full border border-slate-200/50 shadow-sm">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] whitespace-nowrap">{card?.category || 'DOC'}</span>
        </div>
        <div className="absolute bottom-4 right-6 z-30 px-3 py-1 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
          <span className="text-[10px] font-black text-slate-500/60 tracking-widest">{cardNumber} / {totalCards}</span>
        </div>
        {(isLethal || isCritical) && isTop && (
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`absolute bottom-4 left-6 z-30 px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase flex items-center gap-2 shadow-lg ${isLethal ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
            <span className="relative z-10">{isLethal ? 'RIESGO LETAL' : 'CRÍTICO'}</span>
          </motion.div>
        )}
        <div className="text-7xl drop-shadow-2xl relative z-20 flex items-center justify-center h-24 w-24">{getIcon(card?.ui_icon || '')}</div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-10 pt-10 pb-8 bg-white relative">
        <div className="flex-1 flex items-center justify-center text-center">
          <p className={`font-display font-black text-moomin-text leading-[1.05] tracking-tighter italic ${getFontSizeClass(card?.card_text || '')} overflow-y-auto custom-scrollbar h-full flex items-center justify-center pr-2 break-words text-balance w-full`} style={{ textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}>
            {card?.card_text || ''}
          </p>
        </div>
        <div className="flex justify-between items-end pt-8 mt-6 border-t-2 border-slate-50">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TRIAGE SCORE</span>
            <div className="flex gap-1.5">
              <div className={`w-12 h-2.5 rounded-full ${isLethal ? 'bg-red-600' : isCritical ? 'bg-orange-500' : 'bg-sky-500'}`} />
              <div className={`w-12 h-2.5 rounded-full ${isCritical || isLethal ? (isLethal ? 'bg-red-100' : 'bg-orange-100') : 'bg-slate-100'}`} />
            </div>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-black text-slate-300 block tracking-widest uppercase mb-0.5">ESTADO VITAL</span>
             <span className="text-xs font-black text-slate-200">#DATA-{card?.card_id?.slice(-4).toUpperCase() || 'SYS'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
