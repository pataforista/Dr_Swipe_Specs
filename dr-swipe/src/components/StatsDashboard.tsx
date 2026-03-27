import React from 'react';
import { motion } from 'framer-motion';
import { useCodexStore } from '../store/useCodexStore';

interface StatsDashboardProps {
  onClose: () => void;
}

const RANK_THRESHOLDS = [
  { min: 0, label: '🩺 ESTUDIANTE DE MEDICINA' },
  { min: 500, label: '🧪 MÉDICO INTERNO' },
  { min: 2000, label: '🏥 MÉDICO RESIDENTE' },
  { min: 5000, label: '⚡ MÉDICO ADSCRITO' },
  { min: 10000, label: '👑 JEFE DE GUARDIA' },
  { min: 25000, label: '🌟 DIRECTOR MÉDICO' },
];

function getRank(xp: number) {
  let rank = RANK_THRESHOLDS[0].label;
  for (const t of RANK_THRESHOLDS) {
    if (xp >= t.min) rank = t.label;
  }
  return rank;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ onClose }) => {
  const { stats } = useCodexStore();

  const totalSwipes = stats.correct_swipes + stats.mistakes;
  const accuracy = totalSwipes > 0
    ? Math.round((stats.correct_swipes / totalSwipes) * 100)
    : 0;

  const rank = getRank(stats.xp);
  const nextThreshold = RANK_THRESHOLDS.find(t => t.min > stats.xp);
  const xpProgress = nextThreshold
    ? Math.min(100, Math.round((stats.xp / nextThreshold.min) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className="glass-panel p-10 max-w-sm w-full text-left border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)] bg-slate-900 rounded-[3rem] overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent-alert opacity-50" />
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase italic">
          CENTRO DE DATOS OPERATIVOS
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors text-slate-500 hover:text-white border border-white/10"
          aria-label="Cerrar"
        >
          <span className="text-xl font-black">✕</span>
        </button>
      </div>

      {/* Rank badge */}
      <div className="flex items-center gap-5 mb-10 p-6 bg-slate-950/60 rounded-[2.5rem] border border-white/5 shadow-inner">
        <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">🧬</span>
        <div>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-1">CREDENCIAL</span>
          <span className="text-lg font-display font-black text-white italic tracking-tight">{rank}</span>
        </div>
        <div className="ml-auto text-right">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] block mb-1">SCORE</span>
          <span className="text-lg font-black text-primary drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">{stats.xp.toLocaleString()}</span>
        </div>
      </div>

      {/* XP progress */}
      {nextThreshold && (
        <div className="mb-10 px-2">
          <div className="flex justify-between mb-3 items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">SIGUIENTE ASCENSO</span>
            <span className="text-[10px] font-black text-primary italic tracking-widest">{stats.xp} / {nextThreshold.min} XP</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
              className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(34,211,238,0.6)]"
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <StatCard label="EXPEDIENTES" value={stats.cases_solved} unit="pts" color="primary" />
        <StatCard label="TURNOS" value={stats.total_sessions ?? 0} unit="guardias" color="secondary" />
        <StatCard label="ACIERTOS" value={stats.correct_swipes} unit="ops" color="primary" />
        <StatCard label="FALLOS" value={stats.mistakes} unit="ERR" color="accent" />
        <StatCard label="EFECTIVIDAD" value={`${accuracy}%`} unit="" color={accuracy >= 80 ? 'primary' : accuracy >= 60 ? 'secondary' : 'accent'} />
        <StatCard label="RÉCORD" value={(stats.best_score ?? 0).toLocaleString()} unit="XP" color="secondary" />
      </div>

      {/* Accuracy bar */}
      <div className="p-1">
        <div className="flex justify-between items-center mb-3 px-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black">MÉTRICA DE PRECISIÓN</span>
          <span className="text-[10px] text-white font-black italic">{accuracy}%</span>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 1.5, delay: 0.4, type: 'spring' }}
            className={`h-full rounded-full ${
              accuracy >= 80 ? 'bg-primary shadow-[0_0_15px_rgba(34,211,238,0.5)]' :
              accuracy >= 60 ? 'bg-secondary shadow-[0_0_15px_rgba(129,140,248,0.5)]' : 'bg-accent-alert shadow-[0_0_15px_rgba(251,113,133,0.5)]'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  unit: string;
  color: 'primary' | 'secondary' | 'accent';
}> = ({ label, value, unit, color }) => {
  const colorClass = {
    primary: 'text-moomin-primary',
    secondary: 'text-moomin-secondary',
    accent: 'text-moomin-accent',
  }[color];

  return (
    <div className="bg-slate-950/40 border border-white/5 rounded-[2rem] p-5 flex flex-col justify-between shadow-sm">
      <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-3 leading-tight">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-display font-black italic ${colorClass}`}>{value}</span>
        {unit && <span className="text-[9px] text-slate-500 font-black italic uppercase tracking-tighter">{unit}</span>}
      </div>
    </div>
  );
};
