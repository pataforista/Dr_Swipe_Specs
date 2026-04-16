import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TelemetryHUDProps {
  timeLeft: number;
  state: string;
  score: number;
  combo: number;
  vitality: number;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = React.memo(({ 
  timeLeft, state, score, combo, vitality 
}) => {
  if (state !== 'triage' && state !== 'boss_fight' && state !== 'urgent_triage') return null;

  return (
    <div className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-hud flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 paper-sheet shadow-md border-2 border-white/50 bg-white/60 backdrop-blur-md rounded-2xl gap-3 sm:gap-0">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-primary/60 uppercase leading-none lettering">
            Puntaje
          </span>
          <motion.span
            key={score}
            animate={{ scale: [1, 1.1, 1] }}
            className="text-base sm:text-lg font-bold text-slate-700 leading-none lettering"
          >
            {Math.max(0, score)}
          </motion.span>
        </div>
        <div className="w-px h-6 bg-slate-200 hidden sm:block" />
        <div className="flex flex-col gap-0.5 flex-1 max-w-[80px] sm:max-w-[100px]">
          <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-primary/60 uppercase leading-none lettering">
            Salud Px
          </span>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
            <motion.div
              animate={{
                width: `${vitality}%`,
                backgroundColor: vitality > 60 ? '#10B981' : vitality > 30 ? '#F59E0B' : '#F43F5E',
              }}
              className="h-full transition-all duration-500"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-5">
        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0, rotate: 10 }}
              animate={{ scale: 1, rotate: -3 }}
              exit={{ scale: 0 }}
              className="px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest shadow-sm bg-amber-100 text-amber-700 border border-amber-200 lettering"
            >
              x{combo} ✨
            </motion.div>
          )}
        </AnimatePresence>
        {state !== 'boss_fight' && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-rose-400 uppercase leading-none lettering">
              Tiempo
            </span>
            <span
              className={`text-base sm:text-lg font-bold leading-none lettering tabular-nums ${
                timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-600'
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality check if needed, but React.memo's default shallow comparison 
  // is sufficient for these primitives.
  return (
    prevProps.timeLeft === nextProps.timeLeft &&
    prevProps.state === nextProps.state &&
    prevProps.score === nextProps.score &&
    prevProps.combo === nextProps.combo &&
    prevProps.vitality === nextProps.vitality
  );
});
