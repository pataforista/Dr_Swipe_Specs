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
        // Centering lives on a static wrapper: framer-motion writes `transform`
        // inline, which overrode `-translate-x-1/2` and pushed the toast off the
        // right edge. The wrapper is also pointer-events-none and sits above the
        // action row so it never hides the swipe buttons.
        <div className="fixed left-0 right-0 bottom-[11.5rem] z-[200] flex justify-center px-3 pointer-events-none">
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={`max-w-full px-4 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-xl border-2 flex items-center gap-3 sm:gap-4 font-black italic tracking-tighter backdrop-blur-xl
              ${toast.type === 'milestone' ? 'bg-secondary/90 border-secondary text-amber-900 sticker-glow' : 'bg-white/90 border-emerald-100 text-primary'}
            `}
          >
            <span className="text-2xl flex-shrink-0">{toast.type === 'milestone' ? '🏆' : '🪙'}</span>
            <span className="uppercase text-xs sm:text-sm tracking-wider sm:tracking-widest leading-snug break-words min-w-0">{toast.text}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
