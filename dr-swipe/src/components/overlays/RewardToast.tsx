import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardToastProps {
  toast: {
    show: boolean;
    text: string;
    type: string;
  };
}

export const RewardToast: React.FC<RewardToastProps> = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl shadow-xl border-2 flex items-center gap-4 font-black italic tracking-tighter whitespace-nowrap backdrop-blur-xl
            ${toast.type === 'milestone' ? 'bg-secondary/40 border-secondary/60 text-white sticker-glow' : 'bg-white/90 border-emerald-100 text-primary'}
          `}
        >
          <span className="text-2xl">{toast.type === 'milestone' ? '🏆' : '🪙'}</span>
          <span className="uppercase text-sm tracking-widest">{toast.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
