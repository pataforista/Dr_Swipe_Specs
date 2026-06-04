import React from 'react';
import { motion } from 'framer-motion';
import { useCodexStore, BOOST_CATALOG } from '../store/useCodexStore';
import { triggerHaptic } from '../utils/hapticFeedback';

interface TiendaViewProps { onClose: () => void; }

export const TiendaView: React.FC<TiendaViewProps> = ({ onClose }) => {
  const { stats, boosts, buyBoost } = useCodexStore();
  const owned = boosts ?? { doubleXp: 0, doubleCoins: 0, freeHints: 0 };

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
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] sm:text-[12px] font-black tracking-[0.3em] text-primary/60 uppercase lettering">TIENDA DE SUMINISTROS 🛒</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-secondary lettering">{stats.coins} 🪙 disponibles</span>
        </div>
        <button onClick={onClose} aria-label="Cerrar"
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-white shadow-sm text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0">
          <span className="text-lg font-bold">✕</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 relative z-10">
        {BOOST_CATALOG.map((b) => {
          const canBuy = stats.coins >= b.cost;
          const have = owned[b.id] ?? 0;
          return (
            <div key={b.id} className="bg-slate-50 border-2 border-white rounded-3xl p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
              <div className="text-3xl sm:text-4xl flex-shrink-0">{b.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] sm:text-sm font-black text-slate-700 lettering leading-tight">{b.name}</p>
                  {have > 0 && <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">x{have}</span>}
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 lettering leading-snug">{b.desc}</p>
              </div>
              <button
                onClick={() => { if (buyBoost(b.id)) triggerHaptic('criticalSuccess'); }}
                disabled={!canBuy}
                className="marker-btn !rotate-0 py-2.5 px-3 sm:px-4 text-[11px] sm:text-sm flex-shrink-0 disabled:opacity-30 !bg-secondary !border-secondary"
              >
                {b.cost} 🪙
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-slate-400 italic lettering text-center mt-4 relative z-10">
        Las ventajas se activan al iniciar tu próxima guardia. ¡Gana monedas resolviendo casos! ✨
      </p>
    </motion.div>
  );
};
