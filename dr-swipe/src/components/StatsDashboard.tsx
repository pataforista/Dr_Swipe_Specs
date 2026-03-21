import React from 'react';
import { motion } from 'framer-motion';
import { useCodexStore } from '../store/useCodexStore';

interface StatsDashboardProps {
  onClose: () => void;
}

const RANK_THRESHOLDS = [
  { min: 0, label: 'R0 Aspirante' },
  { min: 500, label: 'R1 Interno' },
  { min: 2000, label: 'R2 Residente' },
  { min: 5000, label: 'R3 Senior' },
  { min: 10000, label: 'Adscrito' },
  { min: 25000, label: 'Jefe de Guardia' },
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
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      className="glass-panel p-8 max-w-sm w-full text-left border-white/20 shadow-2xl"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-black tracking-[0.4em] text-medical-primary uppercase">
          Expediente de Guardia
        </span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors text-xl font-black leading-none"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Rank badge */}
      <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-2xl border border-white/10">
        <span className="text-3xl">🏥</span>
        <div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Rango Actual</span>
          <span className="text-lg font-display font-black text-medical-primary">{rank}</span>
        </div>
        <div className="ml-auto text-right">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">XP Total</span>
          <span className="text-lg font-black text-white font-mono">{stats.xp.toLocaleString()}</span>
        </div>
      </div>

      {/* XP progress */}
      {nextThreshold && (
        <div className="mb-5">
          <div className="flex justify-between mb-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Próximo rango</span>
            <span className="text-[9px] font-mono text-slate-400">{stats.xp} / {nextThreshold.min} XP</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-medical-primary rounded-full"
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Casos Resueltos" value={stats.cases_solved} unit="casos" color="primary" />
        <StatCard label="Sesiones" value={stats.total_sessions ?? 0} unit="partidas" color="secondary" />
        <StatCard label="Aciertos" value={stats.correct_swipes} unit="cartas" color="primary" />
        <StatCard label="Errores" value={stats.mistakes} unit="cartas" color="danger" />
        <StatCard label="Precisión" value={`${accuracy}%`} unit="" color={accuracy >= 80 ? 'primary' : accuracy >= 60 ? 'secondary' : 'danger'} />
        <StatCard label="Mejor Score" value={(stats.best_score ?? 0).toLocaleString()} unit="pts" color="secondary" />
      </div>

      {/* Accuracy bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Precisión Global</span>
          <span className="text-[9px] text-slate-300 font-mono font-black">{accuracy}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className={`h-full rounded-full ${
              accuracy >= 80 ? 'bg-medical-primary' :
              accuracy >= 60 ? 'bg-medical-secondary' : 'bg-medical-danger'
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
  color: 'primary' | 'secondary' | 'danger';
}> = ({ label, value, unit, color }) => {
  const colorClass = {
    primary: 'text-medical-primary',
    secondary: 'text-medical-secondary',
    danger: 'text-medical-danger',
  }[color];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-display font-black ${colorClass}`}>{value}</span>
        {unit && <span className="text-[9px] text-slate-500">{unit}</span>}
      </div>
    </div>
  );
};
