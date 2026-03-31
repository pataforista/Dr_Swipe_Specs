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
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 40 }}
      className="glass-panel-dark p-12 max-w-md w-full text-left border border-primary/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent-alert opacity-40 shadow-[0_0_15px_rgba(0,229,255,0.3)]" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase italic">
            CENTRO DE DATOS OPERATIVOS
          </span>
          <div className="h-0.5 w-12 bg-primary/30 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-500 hover:text-white"
          aria-label="Cerrar"
        >
          <span className="text-xl font-black">✕</span>
        </button>
      </div>

      {/* Rank badge */}
      <div className="flex items-center gap-6 mb-12 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full medical-grid opacity-10 pointer-events-none" />
        <motion.div 
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="text-5xl filter drop-shadow-[0_0_15px_rgba(0,229,255,0.4)] relative z-10"
        >
          🧬
        </motion.div>
        <div className="relative z-10">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">CREDENCIAL ACTIVA</span>
          <span className="text-xl font-display font-black text-white italic tracking-tighter shadow-text">{rank}</span>
        </div>
        <div className="ml-auto text-right relative z-10">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2">XP TOTAL</span>
          <span className="text-2xl font-black text-primary drop-shadow-[0_0_15px_rgba(0,229,255,0.4)]">{stats.xp.toLocaleString()}</span>
        </div>
      </div>

      {/* XP progress */}
      {nextThreshold && (
        <div className="mb-12 px-2">
          <div className="flex justify-between mb-4 items-end">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">SIGUIENTE ASCENSO</span>
            <span className="text-[11px] font-black text-primary italic tracking-[0.2em]">{stats.xp} / {nextThreshold.min} <span className="text-[8px] opacity-60">PTS</span></span>
          </div>
          <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.5, type: 'spring', bounce: 0.2 }}
              className="h-full bg-primary rounded-full shadow-[0_0_20px_rgba(0,229,255,0.6)]"
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-5 mb-12">
        <StatCard label="CASOS RESUELTOS" value={stats.cases_solved} unit="EXP" color="primary" />
        <StatCard label="TURNOS" value={stats.total_sessions ?? 0} unit="GDS" color="secondary" />
        <StatCard label="ACIERTOS" value={stats.correct_swipes} unit="ops" color="primary" />
        <StatCard label="FALLOS" value={stats.mistakes} unit="err" color="accent-alert" />
      </div>

      {/* Accuracy Metric */}
      <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8">
        <div className="flex justify-between items-center mb-5 px-1">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${accuracy >= 80 ? 'bg-primary shadow-[0_0_10px_rgba(0,229,255,0.8)]' : accuracy >= 60 ? 'bg-secondary' : 'bg-accent-alert'}`} />
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black">PRECISIÓN DIAGNÓSTICA</span>
          </div>
          <span className="text-xl text-white font-black italic">{accuracy}%</span>
        </div>
        <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 2, delay: 0.5, type: 'spring' }}
            className={`h-full rounded-full ${
              accuracy >= 80 ? 'bg-primary shadow-[0_0_20px_rgba(0,229,255,0.6)]' :
              accuracy >= 60 ? 'bg-secondary shadow-[0_0_20px_rgba(167,139,250,0.6)]' : 'bg-accent-alert shadow-[0_0_20px_rgba(255,45,85,0.6)]'
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
  color: 'primary' | 'secondary' | 'accent-alert';
}> = ({ label, value, unit, color }) => {
  const colorClass = {
    'primary': 'text-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]',
    'secondary': 'text-secondary drop-shadow-[0_0_10px_rgba(167,139,250,0.3)]',
    'accent-alert': 'text-accent-alert drop-shadow-[0_0_10px_rgba(255,45,85,0.3)]',
  }[color];

  return (
    <div className="bg-black/60 border border-white/5 rounded-[2.2rem] p-6 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all hover:border-white/10 group cursor-default">
      <div className="absolute top-0 right-0 w-full h-full medical-grid opacity-5 pointer-events-none" />
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-4 leading-tight group-hover:text-slate-300 transition-colors uppercase">{label}</span>
      <div className="flex items-baseline gap-2 relative z-10">
        <span className={`text-3xl font-display font-black italic tracking-tighter ${colorClass}`}>{value}</span>
        {unit && <span className="text-[9px] text-slate-600 font-black italic uppercase tracking-widest">{unit}</span>}
      </div>
    </div>
  );
};
