import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackToastProps {
  result: 'correct' | 'wrong' | null;
  points: number;
}

export const FeedbackToast: React.FC<FeedbackToastProps> = ({ result, points }) => {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          // Same anchor family as RewardToast (bottom-center, above the deck's
          // action row) instead of a bottom-right corner that sat on top of
          // the action buttons in mobile portrait (F4).
          className={`fixed bottom-40 sm:bottom-44 left-1/2 -translate-x-1/2 z-global-toast px-6 py-4 rounded-3xl shadow-xl border-2 flex items-center gap-4 lettering
            ${result === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}
          `}
        >
          <span className="text-2xl">{result === 'correct' ? '✨' : '🖍️'}</span>
          <span className="uppercase text-lg font-bold tracking-tighter">
            {result === 'correct' ? `+${points} PTS` : `${points} PTS`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
