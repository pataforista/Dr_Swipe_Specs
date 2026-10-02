import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Coins, ChevronRight, Brain } from 'lucide-react';
import type { SessionMetrics } from '../../types/game';

interface PerformanceReviewProps {
  metrics: SessionMetrics;
  mode: 'victory' | 'failure';
  onClose: () => void;
}

const STAMP_VARIANTS = {
  hidden: { scale: 3, opacity: 0, rotate: -20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    rotate: -12,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20, delay: 0.1 }
  }
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export const PerformanceReview: React.FC<PerformanceReviewProps> = ({ metrics, mode, onClose }) => {
  const isVictory = mode === 'victory';

  // Grades color mapping
  const gradeColors = {
    'S': 'text-yellow-500 border-yellow-500',
    'A': 'text-emerald-500 border-emerald-500',
    'B': 'text-blue-500 border-blue-500',
    'C': 'text-rose-500 border-rose-500'
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center overflow-y-auto overscroll-contain p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="paper-sheet w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative my-auto shrink-0"
      >
        {/* Top Tape */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-amber-500/20 backdrop-blur-md rotate-2 border border-amber-500/10 z-10" />

        <div className="p-6 sm:p-8 relative">
          {/* 1. Grade Stamp (Delay: 0ms) */}
          <motion.div 
            variants={STAMP_VARIANTS}
            initial="hidden"
            animate="visible"
            className={`absolute top-6 right-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex items-center justify-center text-4xl sm:text-5xl font-black lettering opacity-90 ${gradeColors[metrics.grade]}`}
            style={{ textShadow: '2px 2px 0px rgba(255,255,255,0.8)' }}
          >
            {metrics.grade}
          </motion.div>

          {/* 2. Title (Delay: 200ms) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 pr-20"
          >
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
              EXPEDIENTE CERRADO
            </span>
            <h2 className={`text-3xl sm:text-4xl font-black lettering tracking-tight leading-none ${isVictory ? 'text-slate-800' : 'text-rose-600'}`}>
              {isVictory ? 'Guardia Superada' : 'Turno Complicado'}
            </h2>
          </motion.div>

          <motion.div 
            variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.4 } } }}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* 3 & 4. Rewards (Delay: ~400-500ms) */}
            <motion.div variants={ITEM_VARIANTS} className="flex gap-4">
              <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-100 flex flex-col items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-2xl font-black text-amber-600 lettering">+{metrics.xpEarned}</span>
                <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest">XP Ganada</span>
              </div>
              <div className="flex-1 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col items-center justify-center">
                <Coins className="w-6 h-6 text-emerald-500 mb-1" />
                <span className="text-2xl font-black text-emerald-600 lettering">+{metrics.coinsEarned}</span>
                <span className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest">Monedas</span>
              </div>
            </motion.div>

            {/* 5. Metrics Cards (Delay: ~600-800ms) */}
            <motion.div variants={ITEM_VARIANTS} className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-lg font-black text-slate-700">{Math.round(metrics.precision * 100)}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-1">Precisión<br/>Clínica</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-lg font-black text-slate-700">x{metrics.maxCombo}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-1">Combo<br/>Máximo</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-lg font-black text-slate-700">{metrics.casesCompleted}/{metrics.casesCompleted + metrics.casesFailed}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-1">Pacientes<br/>Estables</span>
              </div>
            </motion.div>

            {/* 6. SRS Hook Placeholder (Delay: ~1000ms) */}
            <motion.div variants={ITEM_VARIANTS} className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-indigo-900">
                    {metrics.casesScheduledAhead} {metrics.casesScheduledAhead === 1 ? 'caso' : 'casos'} para repasar
                  </p>
                  <p className="text-xs font-medium text-indigo-700/70 mt-0.5 leading-tight">
                    Programado en tu sistema de estudio. Te lo volveremos a preguntar pronto para asegurar la memoria a largo plazo.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 7. Action Button (Delay: ~1400ms via staggering) */}
            <motion.div variants={ITEM_VARIANTS} className="pt-2">
              <button 
                onClick={onClose}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors group"
              >
                <span className="font-bold tracking-widest text-sm uppercase">Regresar al Menú</span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
