import React from 'react';
import { motion } from 'framer-motion';
import type { LoreItem } from '../../types/game';

interface LootBoxOverlayProps {
  reward: {
    active: boolean;
    item: LoreItem;
  };
  onClaim: () => void;
}

export const LootBoxOverlay: React.FC<LootBoxOverlayProps> = ({ reward, onClaim }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-overlay p-6">
      <motion.div
        className="absolute inset-0 bg-[#FDFBF7]/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="paper-sheet p-10 max-w-sm w-full text-center border-primary/20 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 sticker-glow" />
        <motion.div 
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 4 }} 
          className="text-7xl mb-6 inline-block"
        >
          🎁
        </motion.div>
        <span className="lettering text-primary font-bold block mb-2 text-[10px] uppercase">Suministros del Dr. Swipe</span>
        <h3 className="text-3xl font-black text-slate-800 mb-6 lettering leading-tight">{reward.item.nombre}</h3>
        <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 relative text-base font-medium text-slate-600 italic leading-relaxed lettering">
          "{reward.item.texto}"
        </div>
        <button onClick={onClaim} className="marker-btn w-full py-5 text-lg group">
          RECIBIR MEJORA ✨
        </button>
      </motion.div>
    </div>
  );
};
