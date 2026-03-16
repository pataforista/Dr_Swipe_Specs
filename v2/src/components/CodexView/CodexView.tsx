import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCodexStore } from '../../store/useCodexStore';
import { PerlaENARM } from '../../types/clinical';

export const CodexView: React.FC<{ totalPearlsInGame?: number }> = ({ totalPearlsInGame = 24 }) => {
  const unlockedPearls = useCodexStore((state) => state.unlockedPearls);
  const [selectedPearl, setSelectedPearl] = useState<PerlaENARM | null>(null);

  const emptySlots = Array.from({ length: Math.max(0, totalPearlsInGame - unlockedPearls.length) });

  return (
    <div className="min-h-screen p-8 bg-[#F4F1EA] dark:bg-black font-sans transition-colors duration-500 overflow-y-auto">
      
      <header className="mb-10 border-b-4 border-emerald-800 dark:border-red-900 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase text-emerald-900 dark:text-red-600 tracking-tighter">
            Compendio Clínico
          </h1>
          <p className="text-emerald-700 dark:text-red-400 mt-2 font-mono text-sm leading-tight">
            Autorización de lectura: Dr. Celada y Dra. Aguilar.<br/>
            [{unlockedPearls.length} / {totalPearlsInGame} Archivos Rotos]
          </p>
        </div>
      </header>

      {/* LA CUADRÍCULA */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 relative">
        {unlockedPearls.map((perla) => (
          <motion.div
            key={perla.id}
            layoutId={`card-${perla.id}`}
            onClick={() => setSelectedPearl(perla)}
            whileHover={{ y: -5, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className={`cursor-pointer p-4 h-40 flex flex-col justify-end rounded-lg border-2 shadow-md relative overflow-hidden transition-shadow
              ${perla.rarity === 'legendary' 
                ? 'bg-amber-100 border-amber-500 dark:bg-[#1A0000] dark:border-red-600 dark:shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                : 'bg-white border-emerald-200 dark:bg-gray-900 dark:border-purple-900 dark:shadow-[0_0_8px_rgba(138,43,226,0.2)]'
              }`}
          >
            <span className="text-xs font-bold text-emerald-600 dark:text-purple-400 uppercase mb-1 drop-shadow-sm">
              {perla.category}
            </span>
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">
              {perla.title}
            </h3>
          </motion.div>
        ))}

        {/* ESPACIOS BLOQUEADOS */}
        {emptySlots.map((_, idx) => (
          <div 
            key={`empty-${idx}`} 
            className="h-40 rounded-lg border-2 border-dashed border-emerald-300 dark:border-red-900/40 bg-emerald-50/50 dark:bg-black flex items-center justify-center pointer-events-none"
          >
             <span className="text-emerald-300 dark:text-red-900/50 font-mono text-xs uppercase tracking-widest">
                Classified
             </span>
          </div>
        ))}
      </div>

      {/* EL MODAL DE DETALLE */}
      <AnimatePresence>
        {selectedPearl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPearl(null)}
              className="fixed inset-0 bg-emerald-900/20 dark:bg-black/80 backdrop-blur-sm z-[1000]"
            />
            
            <div className="fixed inset-0 flex items-center justify-center z-[1001] pointer-events-none p-4">
              <motion.div
                layoutId={`card-${selectedPearl.id}`}
                className={`pointer-events-auto w-full max-w-lg p-8 rounded-xl border-4 shadow-2xl relative
                  ${selectedPearl.rarity === 'legendary' 
                    ? 'bg-[#FFFDF5] border-amber-500 dark:bg-[#0a0000] dark:border-red-600' 
                    : 'bg-[#FFFDF5] border-emerald-600 dark:bg-gray-900 dark:border-purple-600'
                  }`}
              >
                <button 
                  onClick={() => setSelectedPearl(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
                <span className="text-sm font-black text-emerald-600 dark:text-purple-500 uppercase tracking-widest block mb-2">
                  {selectedPearl.category}
                </span>
                <h2 className="text-3xl font-bold text-black dark:text-white mb-4 leading-tight">
                  {selectedPearl.title}
                </h2>
                <div className="overflow-y-auto max-h-[60vh]">
                  <p className="text-gray-800 dark:text-gray-300 text-lg leading-relaxed font-serif dark:font-mono">
                    {selectedPearl.text}
                  </p>
                </div>
                
                <div className="mt-8 p-4 bg-emerald-100 dark:bg-black border-l-4 border-emerald-800 dark:border-red-700">
                  <span className="text-xs uppercase font-bold text-emerald-900 dark:text-red-500 block mb-1">
                    Directriz Oficial
                  </span>
                  <span className="text-sm font-mono text-black dark:text-gray-300">
                    {selectedPearl.gpc_ref}
                  </span>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
