import React from 'react';
import { motion } from 'framer-motion';

interface FailProtectionOverlayProps {
  error: string;
  livesRemaining: number;
  onRescue: () => void;
  onRestart: () => void;
}

export const FailProtectionOverlay: React.FC<FailProtectionOverlayProps> = ({ 
  error, livesRemaining, onRescue, onRestart 
}) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[110] p-6">
      <motion.div
        className="absolute inset-0 bg-rose-50/95 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="paper-sheet p-10 max-md w-full text-center border-rose-200 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-400 sticker-glow" />
        <div className="text-7xl mb-6">🚑</div>
        <span className="lettering text-rose-500 font-bold block mb-2 text-xs uppercase">
          Incidente en la Guardia
        </span>
        <h3 className="text-4xl font-black text-slate-800 mb-6 mt-2 leading-tight lettering tracking-tighter">
          RELEVO MÉDICO
        </h3>
        <div className="bg-white p-6 rounded-2xl mb-8 border-2 border-dashed border-rose-100 text-left relative overflow-hidden">
          <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1 lettering">
            NOTAS DEL DIRECTOR:
          </p>
          <p className="text-lg font-medium text-slate-600 italic leading-relaxed relative z-10 lettering">
            "{error}"
          </p>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          <button
            onClick={onRescue}
            className="marker-btn w-full py-6 text-xl flex flex-col items-center justify-center gap-1 group"
          >
            <span className="text-sm font-black uppercase">CAMBIAR DE INTERNO ✨</span>
            <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest">
              ({livesRemaining - 1} DISPONIBLES)
            </span>
          </button>
          <button
            onClick={onRestart}
            className="text-[10px] font-bold text-slate-300 hover:text-rose-400 uppercase tracking-widest py-2 transition-all lettering"
          >
            — Terminar Turno —
          </button>
        </div>
      </motion.div>
    </div>
  );
};
