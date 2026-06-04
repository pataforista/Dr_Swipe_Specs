import React from 'react';
import { motion } from 'framer-motion';

interface LootScreenProps {
  score: number;
  xpTotal: number;
  coins: number;
  isPerfect: boolean;
  onContinue: () => void;
}

export const LootScreen: React.FC<LootScreenProps> = ({
  score, coins, isPerfect, onContinue
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 30 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      className="paper-sheet p-6 sm:p-10 max-w-md w-full text-center shadow-2xl relative mx-4 bg-white overflow-hidden"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 medical-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-2 bg-secondary" />

      {/* Header Container */}
      <div className="relative z-10 mb-6 sm:mb-8">
        <motion.div 
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 5, scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 sm:w-24 h-20 sm:h-24 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg"
        >
          <span className="text-4xl sm:text-5xl">💰</span>
        </motion.div>
        <h2 className="text-4xl sm:text-5xl font-black text-slate-800 lettering uppercase tracking-tight">Botín de Guardia</h2>
        <div className="h-1 w-24 bg-amber-200 mx-auto mt-2 rounded-full" />
      </div>

      {/* Items List */}
      <div className="bg-slate-50 p-5 sm:p-8 rounded-[2.5rem] mb-6 sm:mb-8 border-2 border-dashed border-slate-200 relative z-10 flex flex-col gap-4">
        {/* Experience Item */}
        <div className="flex justify-between items-center group">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl bg-white w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-xl shadow-sm border border-slate-100">✨</span>
            <div className="text-left">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none">Experiencia</span>
              <span className="text-sm sm:text-base font-bold text-slate-600">Puntaje acumulado</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-primary lettering">+{score}</span>
        </div>

        <div className="h-px w-full bg-slate-200/50" />

        {/* Coins Item */}
        <div className="flex justify-between items-center group">
          <div className="flex items-center gap-3">
             <span className="text-2xl sm:text-3xl bg-white w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center rounded-xl shadow-sm border border-slate-100">🪙</span>
             <div className="text-left">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none">Monedas</span>
              <span className="text-sm sm:text-base font-bold text-slate-600">Créditos de hospital</span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-secondary lettering">+{coins}</span>
        </div>

        {isPerfect && (
          <div className="mt-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-200 animate-pulse">
            + Bono de Guardia Perfecta 🌟
          </div>
        )}
      </div>

      {/* Utility Message */}
      <div className="mb-6 sm:mb-10 px-4">
        <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed font-bold lettering uppercase tracking-wide">
          "Usa tus monedas para **ESCANEAR cartas difíciles** en futuras consultas. Un buen médico invierte en sus herramientas."
        </p>
      </div>

      {/* Call to Action */}
      <div className="relative z-10">
        <button 
          onClick={onContinue} 
          className="marker-btn w-full py-4 sm:py-5 text-base sm:text-xl group shadow-amber-100/50"
        >
          COBRAR Y CONTINUAR ✨
        </button>
      </div>

      {/* Decorative Washi Tape */}
      <div className="absolute bottom-4 -right-10 w-40 h-8 bg-cyan-100 -rotate-12 opacity-40" />
    </motion.div>
  );
};
