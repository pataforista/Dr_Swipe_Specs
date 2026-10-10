import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trophy, TriangleAlert } from 'lucide-react';

const TOAST_STYLE = {
  milestone: { className: 'bg-amber-50 border-secondary text-amber-900', Icon: Trophy },
  alert: { className: 'bg-rose-50 border-rose-200 text-rose-700', Icon: TriangleAlert },
  coins: { className: 'bg-white border-emerald-100 text-primary', Icon: Coins },
} as const;

interface RewardToastProps {
  toast: {
    show: boolean;
    text: string;
    type: string;
  };
}

export const RewardToast: React.FC<RewardToastProps> = ({ toast }) => {
  const { className, Icon } = TOAST_STYLE[toast.type as keyof typeof TOAST_STYLE] ?? TOAST_STYLE.coins;
  return (
    <AnimatePresence>
      {toast.show && (
        // Centering lives on a static wrapper: framer-motion writes `transform`
        // inline, which overrode `-translate-x-1/2` and pushed the toast off the
        // right edge. The wrapper is also pointer-events-none and sits over the
        // card's header strip (subject + number), so it covers neither the card
        // text nor the swipe buttons.
        <div className="fixed left-0 right-0 top-[8.75rem] z-[200] flex justify-center px-3 pointer-events-none">
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className={`max-w-full px-4 sm:px-8 py-2 sm:py-4 rounded-2xl shadow-xl border-2 flex items-center gap-3 sm:gap-4 font-black italic tracking-tighter ${className}`}
          >
            <Icon className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
            <span className="uppercase text-xs sm:text-sm tracking-wider sm:tracking-widest leading-snug break-words min-w-0 line-clamp-2">{toast.text}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
