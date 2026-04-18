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
  if (state !== 'triage' && state !== 'boss_fight' && state !== 'urgent_triage') return null;

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
    <div className="bg-slate-900/90 text-slate-500 p-3 rounded-xl border border-slate-700/50 flex flex-col gap-1 min-w-[120px]">
       <span className="text-[8px] font-black uppercase tracking-widest">Telemetría</span>
       <div className="flex flex-col gap-1 opacity-20">
         <div className="h-1.5 w-full bg-slate-700 rounded-full" />
         <div className="h-1.5 w-2/3 bg-slate-700 rounded-full" />
       </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]';
      case 'alert': return 'text-amber-400';
      default: return 'text-emerald-400';
    }
  };

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-slate-900 shadow-2xl p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-slate-800 flex flex-col gap-1.5 sm:gap-2 min-w-[100px] sm:min-w-[140px] pointer-events-auto hover:scale-105 transition-transform group"
    >
      <div className="flex justify-between items-center">
        <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Monitor Activo
        </span>
        <span className={`text-[7px] sm:text-[8px] font-bold uppercase ${getStatusColor(vitals.status)}`}>
          {vitals.status === 'normal' ? 'Estable' : vitals.status === 'alert' ? 'Riesgo' : 'CRÍTICO'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-1">
        {vitals.ta && (
           <div className="flex justify-between items-baseline gap-2">
             <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">TA</span>
             <span className={`text-xs sm:text-sm font-black tabular-nums ${getStatusColor(vitals.status)}`}>{vitals.ta}</span>
           </div>
        )}
        {vitals.fc && (
           <div className="flex justify-between items-baseline gap-2">
             <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">FC</span>
             <span className={`text-xs sm:text-sm font-black tabular-nums ${getStatusColor(vitals.status)}`}>{vitals.fc} <span className="text-[7px] opacity-50">lpm</span></span>
           </div>
        )}
        {vitals.temp && (
           <div className="flex justify-between items-baseline gap-2">
             <span className="text-[8px] sm:text-[9px] font-bold text-slate-400">T°</span>
             <span className={`text-xs sm:text-sm font-black tabular-nums ${getStatusColor(vitals.status)}`}>{vitals.temp}°C</span>
           </div>
        )}
      </div>

      <div className="h-4 sm:h-5 w-full bg-slate-800/50 rounded flex items-center justify-center overflow-hidden">
         <motion.div
           animate={{ x: [-100, 100] }}
           transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
           className="h-px w-full bg-slate-700/50"
         />
      </div>
    </motion.div>
  );
};
