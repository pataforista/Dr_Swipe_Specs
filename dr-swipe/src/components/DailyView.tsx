import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCodexStore, STREAK_MILESTONES } from '../store/useCodexStore';
import { triggerHaptic } from '../utils/hapticFeedback';

interface DailyViewProps { onClose: () => void; }

const MILESTONES = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);

export const DailyView: React.FC<DailyViewProps> = ({ onClose }) => {
  const { dailyMissions, dailyStreak, claimMission, refreshDaily } = useCodexStore();

  useEffect(() => { refreshDaily(); }, [refreshDaily]);

  const nextMilestone = MILESTONES.find(m => m > dailyStreak);
  const prevMilestone = [...MILESTONES].reverse().find(m => m <= dailyStreak) ?? 0;
  const streakPct = nextMilestone
    ? Math.min(100, Math.round(((dailyStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      className="paper-sheet p-5 sm:p-8 max-w-md w-full text-left shadow-2xl relative overflow-hidden bg-white mx-4 flex flex-col max-h-[90vh]"
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 sm:h-9 washi-tape-pink -rotate-1 shadow-sm z-20" />

      <div className="flex justify-between items-center mb-4 sm:mb-6 pt-3 relative z-10 gap-2">
        <span className="text-[10px] sm:text-[12px] font-black tracking-[0.3em] text-primary/60 uppercase lettering">GUARDIA DIARIA 🗓️</span>
        <button onClick={onClose} aria-label="Cerrar"
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-white shadow-sm text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0">
          <span className="text-lg font-bold">✕</span>
        </button>
      </div>

      {/* Streak goal */}
      <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-4 sm:p-5 mb-5 relative z-10">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-base sm:text-lg font-black text-amber-700 lettering">🔥 Racha: {dailyStreak} {dailyStreak === 1 ? 'día' : 'días'}</span>
          {nextMilestone
            ? <span className="text-[10px] font-bold text-amber-600 lettering">Meta {nextMilestone}d → +{STREAK_MILESTONES[nextMilestone]} 🪙</span>
            : <span className="text-[10px] font-bold text-amber-600 lettering">¡Racha máxima! 🌟</span>}
        </div>
        <div className="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden border border-white">
          <motion.div initial={{ width: 0 }} animate={{ width: `${streakPct}%` }} transition={{ duration: 1, type: 'spring', bounce: 0.2 }} className="h-full bg-amber-400 rounded-full" />
        </div>
        <p className="text-[9px] text-amber-600/80 italic lettering mt-2">Juega cada día para mantener la racha y ganar recompensas.</p>
      </div>

      {/* Daily missions */}
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] lettering mb-3 relative z-10">Misiones de hoy</span>
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 relative z-10">
        {dailyMissions.list.map((m) => {
          const done = m.progress >= m.target;
          const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
          return (
            <div key={m.id} className="bg-slate-50 border-2 border-white rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl flex-shrink-0">{m.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] sm:text-sm font-black text-slate-700 lettering leading-tight">{m.label}</p>
                    <p className="text-[9px] text-slate-400 lettering">{Math.min(m.progress, m.target)} / {m.target} · +{m.reward} 🪙</p>
                  </div>
                </div>
                {m.claimed
                  ? <span className="text-[10px] font-black text-emerald-600 lettering flex-shrink-0">✓ Reclamada</span>
                  : <button onClick={() => { if (claimMission(m.id)) triggerHaptic('criticalSuccess'); }} disabled={!done}
                      className="marker-btn !rotate-0 py-2 px-3 text-[10px] sm:text-xs flex-shrink-0 disabled:opacity-30">
                      {done ? 'COBRAR' : 'En curso'}
                    </button>}
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-white">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${done ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
