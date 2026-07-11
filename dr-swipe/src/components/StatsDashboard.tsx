import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCodexStore } from '../store/useCodexStore';
import { DoodlePlayerCard } from './ui/DoodlePlayerCard';
interface StatsDashboardProps {
  onClose: () => void;
}

const RANK_THRESHOLDS = [
  { min: 0, label: '🩺 ESTUDIANTE MÉDICO' },
  { min: 500, label: '🧪 INTERNO DE GUARDIA' },
  { min: 2000, label: '🏥 MÉDICO RESIDENTE' },
  { min: 5000, label: '⚡ ESPECIALISTA' },
  { min: 10000, label: '👑 JEFE DE ENSEÑANZA' },
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
  const { stats, unlockedPearls = [] } = useCodexStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'pearls'>('stats');

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
      className="paper-sheet p-6 sm:p-10 md:p-14 max-w-md w-full text-left shadow-2xl relative overflow-hidden bg-white mx-4"
    >
      {/* Paper texture overlay (Dot Grid) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />

      {/* Washi Tape Header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-7 sm:h-10 washi-tape-pink -rotate-1 shadow-sm border-x-2 border-white/40 z-20" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 sm:mb-8 pt-4 sm:pt-6 relative z-10 gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] sm:text-[12px] font-black tracking-[0.3em] sm:tracking-[0.4em] text-primary/60 uppercase lettering">
            LIBRETA DE LOGROS 📔
          </span>
          <div className="h-1 w-20 sm:w-24 bg-cyan-100 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-white shadow-sm text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <span className="text-lg sm:text-xl font-bold">✕</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-100 pb-2 relative z-10">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'stats' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Estadísticas 📊
        </button>
        <button
          onClick={() => setActiveTab('pearls')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === 'pearls' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Códex de Perlas 🌟
          {unlockedPearls.length > 0 && (
            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none">
              {unlockedPearls.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'stats' ? (
        <>
          {/* Rank badge */}
          <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-8 bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-white shadow-inner relative overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-4xl sm:text-6xl filter drop-shadow-sm relative z-10 flex-shrink-0"
            >
              🎓
            </motion.div>
            <div className="relative z-10 min-w-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] sm:tracking-[0.3em] block mb-1 sm:mb-2 lettering">RANGO ACTUAL:</span>
              <span className="text-base sm:text-xl font-bold text-slate-800 lettering tracking-tight break-words">{rank}</span>
            </div>
          </div>

          {/* XP progress */}
          <div className="mb-6 sm:mb-8 px-1 sm:px-2 relative z-10">
            <div className="flex justify-between mb-2 sm:mb-4 items-end gap-2">
              <span className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] lettering">EXPERIENCIA</span>
              <span className="text-[10px] sm:text-[12px] font-bold text-primary italic lettering">
                {nextThreshold ? `${stats.xp} / ${nextThreshold.min}` : `${stats.xp} 🌟`}
              </span>
            </div>
            <div className="w-full h-3 sm:h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-white p-0.5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1.5, type: 'spring', bounce: 0.2 }}
                className="h-full bg-[#0D9488] rounded-full shadow-sm"
              />
            </div>
          </div>

          {/* Avatar and Best Case */}
          <div className="mb-8 w-full flex justify-center relative z-10 mt-6">
            <DoodlePlayerCard name="INTERNO" role={rank}>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mejor Caso</span>
                <span className="text-3xl font-bold text-[#fbbc05]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {stats.best_score ?? 0}
                </span>
              </div>
            </DoodlePlayerCard>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-8 relative z-10">
            <StatCard label="RESUELTOS" value={stats.cases_solved} emoji="📑" color="primary" />
            <StatCard label="ACIERTOS" value={stats.correct_swipes} emoji="📈" color="primary" />
            <div className="col-span-2">
              <StatCard label="FALLOS" value={stats.mistakes} emoji="🖍️" color="accent-alert" />
            </div>
          </div>

          {/* Accuracy Metric */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.8rem] sm:rounded-[2.5rem] p-4 sm:p-8 relative z-10">
            <div className="flex justify-between items-center mb-3 sm:mb-6 px-1 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-xl sm:text-2xl filter drop-shadow-sm flex-shrink-0">{accuracy >= 80 ? '🎯' : '🚧'}</span>
                <span className="text-[9px] sm:text-[11px] text-slate-500 uppercase tracking-[0.25em] sm:tracking-[0.4em] font-black lettering">PRECISIÓN</span>
              </div>
              <span className="text-2xl sm:text-3xl text-slate-700 font-bold lettering italic flex-shrink-0">{accuracy}%</span>
            </div>
            <div className="w-full h-3 sm:h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-white p-0.5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${accuracy}%` }}
                transition={{ duration: 2, delay: 0.5, type: 'spring' }}
                className={`h-full rounded-full ${
                  accuracy >= 80 ? 'bg-emerald-400' :
                  accuracy >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[360px] pr-1 relative z-10 scrollbar-thin">
          {unlockedPearls.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm italic lettering leading-relaxed">
              "Aún no has desbloqueado perlas ENARM.<br />Resuelve casos clínicos con éxito para coleccionarlas en tu códex de estudio."
            </div>
          ) : (
            unlockedPearls.map((pearl, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={pearl.id || i}
                className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-2 bg-amber-200/50 -rotate-1" />
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-[8px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                    {pearl.category || 'General'}
                  </span>
                  {pearl.gpc_ref && (
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      GPC: {pearl.gpc_ref}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-800 mb-1 leading-snug">{pearl.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{pearl.text}</p>
              </motion.div>
            ))
          )}
        </div>
      )}

      <div className="mt-6 sm:mt-8 flex justify-center relative z-10">
         <button onClick={onClose} className="marker-btn py-4 sm:py-5 px-8 sm:px-16 text-base sm:text-xl">DESPRENDER RANGO ✨</button>
      </div>
    </motion.div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  emoji: string;
  color: 'primary' | 'secondary' | 'accent-alert';
}> = ({ label, value, emoji, color }) => {
  return (
    <div className="bg-white border-2 border-slate-100 rounded-[1.5rem] sm:rounded-[2.2rem] p-4 sm:p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-primary/20 group cursor-default">
      <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] sm:tracking-[0.3em] lettering leading-tight">{label}</span>
        <span className="text-base sm:text-xl opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">{emoji}</span>
      </div>
      <div className="flex items-baseline gap-1.5 relative z-10">
        <span className={`text-2xl sm:text-3xl font-bold lettering tracking-tighter ${
          color === 'primary' ? 'text-primary' : color === 'secondary' ? 'text-secondary' : 'text-rose-500'
        }`}>{value.toLocaleString()}</span>
      </div>
    </div>
  );
};
