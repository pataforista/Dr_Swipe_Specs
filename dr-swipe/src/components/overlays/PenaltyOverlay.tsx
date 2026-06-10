import React from 'react';
import { motion } from 'framer-motion';
import type { LoreItem } from '../../types/game';

interface PenaltyOverlayProps {
  penalty: {
    active: boolean;
    item: LoreItem;
  };
  onAccept: () => void;
}

export const PenaltyOverlay: React.FC<PenaltyOverlayProps> = ({ penalty, onAccept }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-overlay p-6">
      <motion.div
        className="absolute inset-0 bg-rose-50/90 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="paper-sheet p-10 max-w-sm w-full text-center border-rose-200 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-400 sticker-glow" />
        <span className="lettering text-rose-500 font-bold block mb-2 text-[10px] uppercase">
          Llamada de atención
        </span>
        <h3 className="text-3xl font-black text-slate-800 mb-6 lettering leading-tight italic">
          {penalty.item.nombre}
        </h3>
        <div className="bg-rose-50 rounded-2xl p-6 mb-8 border border-rose-100 shadow-inner text-base font-medium text-slate-600 italic leading-relaxed lettering">
          "{penalty.item.texto}"
        </div>
        <button onClick={onAccept} className="marker-btn w-full py-5 text-base !bg-rose-500 !shadow-rose-100">
          ENTENDIDO 🖍️
        </button>
      </motion.div>
    </div>
  );
};
