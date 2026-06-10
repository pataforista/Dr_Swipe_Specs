import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TelemetryHUDProps {
  timeLeft: number;
  state: string;
  score: number;
  combo: number;
  vitality: number;
  coins: number;
  lastVitals: { ta?: string; fc?: number; temp?: number; status: string } | null;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = React.memo(({ 
  timeLeft, state, score, combo, vitality, coins, lastVitals
}) => {
  if (state !== 'triage' && state !== 'boss_fight') return null;

  return (
    <>
    <div className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-hud flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 paper-sheet shadow-md border-2 border-white/50 bg-white/60 backdrop-blur-md rounded-2xl gap-3 sm:gap-0 pointer-events-none">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-primary uppercase leading-none lettering">
            Puntaje
          </span>
          <motion.span
            key={score}
            animate={{ scale: [1, 1.1, 1] }}
            className="text-lg sm:text-xl font-bold text-slate-700 leading-none lettering tabular-nums"
          >
            {Math.max(0, score)}
          </motion.span>
        </div>
        <div className="w-px h-6 bg-slate-200 hidden sm:block" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-secondary uppercase leading-none lettering">
            Créditos 🪙
          </span>
          <motion.span
            key={coins}
            animate={{ scale: [1, 1.2, 1] }}
            className="text-lg sm:text-xl font-bold text-slate-700 leading-none lettering tabular-nums"
          >
            {coins}
          </motion.span>
        </div>
        <div className="w-px h-6 bg-slate-200 hidden sm:block" />
        <div className="flex flex-col gap-0.5 flex-1 max-w-[80px] sm:max-w-[100px]">
          <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-primary uppercase leading-none lettering">
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
            <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-rose-400 uppercase leading-none lettering">
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
    <div className="fixed top-24 sm:top-28 right-2 sm:right-4 z-hud pointer-events-none">
       <VitalsMonitor vitals={lastVitals} />
    </div>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom equality check if needed, but React.memo's default shallow comparison 
  // is sufficient for these primitives.
  return (
    prevProps.timeLeft === nextProps.timeLeft &&
    prevProps.state === nextProps.state &&
    prevProps.score === nextProps.score &&
    prevProps.combo === nextProps.combo &&
    prevProps.vitality === nextProps.vitality &&
    prevProps.coins === nextProps.coins &&
    JSON.stringify(prevProps.lastVitals) === JSON.stringify(nextProps.lastVitals)
  );
});

const VitalsMonitor: React.FC<{ vitals: TelemetryHUDProps['lastVitals'] }> = ({ vitals }) => {
  if (!vitals) return (
    <div className="paper-sheet bg-white/70 backdrop-blur-md text-slate-400 p-3 rounded-2xl border-2 border-white/60 shadow-md flex flex-col gap-1 min-w-[120px]">
       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telemetría</span>
       <div className="flex flex-col gap-1 opacity-30">
         <div className="h-1.5 w-full bg-slate-200 rounded-full" />
         <div className="h-1.5 w-2/3 bg-slate-200 rounded-full" />
       </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-rose-500';
      case 'alert': return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  };
  const dotColor = vitals.status === 'critical' ? 'bg-rose-500' : vitals.status === 'alert' ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="paper-sheet bg-white/85 backdrop-blur-md shadow-md p-2.5 sm:p-3 rounded-2xl border-2 border-white/60 flex flex-col gap-1.5 sm:gap-2 min-w-[100px] sm:min-w-[140px] pointer-events-auto hover:scale-105 transition-transform group"
    >
      <div className="absolute top-0 right-3 w-10 h-3 washi-tape-pink opacity-50 -rotate-2" />
      <div className="flex justify-between items-center">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 lettering">
          <span className={`w-1 h-1 ${dotColor} rounded-full animate-pulse`} /> Monitor
        </span>
        <span className={`text-[9px] sm:text-[10px] font-bold uppercase ${getStatusColor(vitals.status)}`}>
          {vitals.status === 'normal' ? 'Estable' : vitals.status === 'alert' ? 'Riesgo' : 'CRÍTICO'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {vitals.ta && (
           <div className="flex justify-between items-baseline gap-2">
             <span className="text-[10px] font-bold text-slate-400">TA</span>
             <span className={`text-xs sm:text-sm font-black tabular-nums ${getStatusColor(vitals.status)}`}>{vitals.ta}</span>
           </div>
        )}
        {vitals.fc && (
           <div className="flex justify-between items-baseline gap-2">
             <span className="text-[10px] font-bold text-slate-400">FC</span>
             <span className={`text-xs sm:text-sm font-black tabular-nums ${getStatusColor(vitals.status)}`}>{vitals.fc} <span className="text-[9px] opacity-50">lpm</span></span>
           </div>
        )}
        {vitals.temp && (
           <div className="flex justify-between items-baseline gap-2">
             <span className="text-[10px] font-bold text-slate-400">T°</span>
             <span className={`text-xs sm:text-sm font-black tabular-nums ${getStatusColor(vitals.status)}`}>{vitals.temp}°C</span>
           </div>
        )}
      </div>

      <div className="h-4 sm:h-5 w-full bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200/60">
         <motion.div
           animate={{ x: [-100, 100] }}
           transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
           className={`h-px w-full ${vitals.status === 'critical' ? 'bg-rose-300' : 'bg-slate-300'}`}
         />
      </div>
    </motion.div>
  );
};
