import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[1000] flex justify-center pointer-events-none"
        >
          <div className="paper-sheet p-6 max-w-sm w-full shadow-2xl pointer-events-auto bg-white border-primary/20 relative overflow-hidden">
            {/* Washi Tape Header */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 washi-tape-pink -rotate-2 opacity-80" />
            
            <div className="mt-4 text-center">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-1">
                {offlineReady ? 'MODO OFFLINE LISTO 🚀' : 'ACTUALIZACIÓN DISPONIBLE ✨'}
              </span>
              
              <h3 className="text-xl font-black text-slate-800 lettering mb-3">
                {offlineReady ? '¡Listo para la guardia!' : '¡Nuevas notas de estudio!'}
              </h3>
              
              <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">
                {offlineReady 
                  ? 'La aplicación ya funciona sin conexión. Puedes estudiar en el metro o en quirófano.'
                  : 'Hemos actualizado el manual de Dr. Swipe con mejoras visuales y nuevos casos.'}
              </p>

              <div className="flex gap-3">
                {needRefresh && (
                  <button
                    onClick={() => updateServiceWorker(true)}
                    className="marker-btn flex-grow py-3 text-xs !rotate-0 hover:scale-105"
                  >
                    ACTUALIZAR YA ✨
                  </button>
                )}
                <button
                  onClick={close}
                  className="px-6 py-3 rounded-full border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  {needRefresh ? 'LUEGO' : 'CERRAR'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReloadPrompt;
