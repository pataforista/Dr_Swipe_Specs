import React from 'react';
import { motion } from 'framer-motion';
import { useCodexStore } from '../store/useCodexStore';

interface StatsDashboardProps {
  onClose: () => void;
}

const RANK_THRESHOLDS = [
  { min: 0, label: '🏠 Amigo del Valle' },
  { min: 500, label: '🌱 Ayudante Curioso' },
  { min: 2000, label: '🌿 Sanador del Bosque' },
  { min: 5000, label: '✨ Experto en Calma' },
  { min: 10000, label: '👑 Sabio del Valle' },
  { min: 25000, label: '🌟 Gran Protector' },
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
      className="glass-panel p-10 max-w-sm w-full text-left border-4 border-moomin-primary/10 shadow-2xl bg-white rounded-[3rem]"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <span className="text-[10px] font-black tracking-[0.4em] text-moomin-primary uppercase italic">
          EXPEDIENTE DEL VALLE
        </span>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-moomin-bg transition-colors text-moomin-muted hover:text-moomin-text border-2 border-moomin-text/5"
          aria-label="Cerrar"
        >
          <span className="text-xl font-black">✕</span>
        </button>
      </div>

      {/* Rank badge */}
      <div className="flex items-center gap-4 mb-8 p-5 bg-moomin-bg/30 rounded-[2rem] border-2 border-moomin-primary/10">
        <span className="text-4xl animate-bounce-slow">🎨</span>
        <div>
          <span className="text-[9px] font-black text-moomin-muted/50 uppercase tracking-[0.2em] block italic">RANGO ACTUAL</span>
          <span className="text-lg font-display font-black text-moomin-primary italic">{rank}</span>
        </div>
        <div className="ml-auto text-right">
          <span className="text-[9px] font-black text-moomin-muted/50 uppercase tracking-[0.2em] block italic">EXPERIENCIA</span>
          <span className="text-lg font-black text-moomin-text">{stats.xp.toLocaleString()}</span>
        </div>
      </div>

      {/* XP progress */}
      {nextThreshold && (
        <div className="mb-8 p-1">
          <div className="flex justify-between mb-2">
            <span className="text-[9px] font-black text-moomin-muted uppercase tracking-[0.2em] italic">PRÓXIMO NIVEL</span>
            <span className="text-[9px] font-black text-moomin-primary/60 italic">{stats.xp} / {nextThreshold.min} XP</span>
          </div>
          <div className="w-full h-3 bg-moomin-bg rounded-full overflow-hidden border border-moomin-text/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
              className="h-full bg-moomin-primary rounded-full shadow-[0_0_15px_rgba(135,206,235,0.4)]"
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="CASOS RESUELTOS" value={stats.cases_solved} unit="pts" color="primary" />
        <StatCard label="SESIONES" value={stats.total_sessions ?? 0} unit="partidas" color="secondary" />
        <StatCard label="ACIERTOS" value={stats.correct_swipes} unit="cartas" color="primary" />
        <StatCard label="ERRORES" value={stats.mistakes} unit="cartas" color="accent" />
        <StatCard label="PRECISIÓN" value={`${accuracy}%`} unit="" color={accuracy >= 80 ? 'primary' : accuracy >= 60 ? 'secondary' : 'accent'} />
        <StatCard label="RÉCORD" value={(stats.best_score ?? 0).toLocaleString()} unit="pts" color="secondary" />
      </div>

      {/* Accuracy bar */}
      <div className="p-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] text-moomin-muted uppercase tracking-[0.2em] font-black italic">PRECISIÓN GLOBAL</span>
          <span className="text-[10px] text-moomin-text font-black italic">{accuracy}%</span>
        </div>
        <div className="w-full h-3 bg-moomin-bg rounded-full overflow-hidden border border-moomin-text/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accuracy}%` }}
            transition={{ duration: 1.2, delay: 0.3, type: 'spring' }}
            className={`h-full rounded-full ${
              accuracy >= 80 ? 'bg-moomin-primary shadow-[0_0_10px_rgba(135,206,235,0.4)]' :
              accuracy >= 60 ? 'bg-moomin-secondary shadow-[0_0_10px_rgba(255,182,193,0.4)]' : 'bg-moomin-accent shadow-[0_0_10px_rgba(255,159,127,0.4)]'
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
    <div className="bg-moomin-bg/20 border-2 border-moomin-text/5 rounded-[2rem] p-4 flex flex-col justify-between">
      <span className="text-[8px] font-black text-moomin-muted/50 uppercase tracking-[0.2em] block mb-2 italic leading-tight">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-display font-black italic ${colorClass}`}>{value}</span>
        {unit && <span className="text-[9px] text-moomin-muted/40 font-black italic">{unit}</span>}
      </div>
    </div>
  );
};
