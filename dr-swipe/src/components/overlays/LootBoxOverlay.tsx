import React from 'react';
import { motion } from 'framer-motion';
import type { LoreItem } from '../../types/game';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface LootBoxOverlayProps {
  reward: {
    active: boolean;
    item: LoreItem;
  };
  onClaim: () => void;
  /** What the reward does, in player-facing words (see resolveRewardEffect). */
  effectText: string;
}

export const LootBoxOverlay: React.FC<LootBoxOverlayProps> = ({ reward, onClaim, effectText }) => {
  const trapRef = useFocusTrap<HTMLDivElement>(reward.active, onClaim);
  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-y-auto overscroll-contain z-overlay p-6">
      <motion.div
        className="absolute inset-0 bg-[#FDFBF7]/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="paper-sheet p-6 sm:p-10 max-w-sm w-full text-center border-primary/20 shadow-2xl relative overflow-hidden my-auto shrink-0"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 sticker-glow" />
        <motion.div 
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 4 }} 
          className="text-6xl mb-4 inline-block"
        >
          🎁
        </motion.div>
        <span className="lettering text-primary font-bold block mb-1 text-[10px] uppercase">Premio por racha de 8 aciertos</span>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 lettering leading-tight">{reward.item.nombre}</h3>
        <div className="bg-primary/10 border border-primary/30 text-primary rounded-2xl px-4 py-3 mb-4 text-sm font-black leading-snug">
          {effectText}
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100 relative text-sm font-medium text-slate-500 italic leading-relaxed lettering">
          "{reward.item.texto}"
        </div>
        <button onClick={onClaim} className="marker-btn w-full py-4 text-lg group">
          USAR PREMIO ✨
        </button>
      </motion.div>
    </div>
  );
};
