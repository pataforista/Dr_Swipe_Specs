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
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.8 }}
          className={`fixed bottom-10 right-10 z-global-toast px-6 py-4 rounded-3xl shadow-xl border-2 flex items-center gap-3 lettering
            ${result === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}
          `}
        >
          <span className="text-2xl" aria-hidden="true">{result === 'correct' ? '✨' : '🖍️'}</span>
          <span className="uppercase text-lg font-bold tracking-tighter">
            {result === 'correct' ? '¡Bien!' : 'Revisa'} {result === 'correct' ? `+${points}` : `${points}`} pts
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
