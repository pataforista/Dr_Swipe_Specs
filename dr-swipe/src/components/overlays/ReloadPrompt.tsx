import React, { useEffect } from 'react';
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

  // "Offline ready" is good news, not a decision: it appears on the very first
  // visit, on top of the tutorial, so it is a small pill that leaves on its own.
  useEffect(() => {
    if (!offlineReady || needRefresh) return;
    const t = window.setTimeout(() => setOfflineReady(false), 4000);
    return () => window.clearTimeout(t);
  }, [offlineReady, needRefresh, setOfflineReady]);

  return (
    <AnimatePresence>
      {offlineReady && !needRefresh && (
        <motion.div
          key="offline"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-4 left-0 right-0 z-[1000] flex justify-center pointer-events-none px-4"
          role="status"
        >
          <button
            onClick={close}
            className="pointer-events-auto bg-white border border-primary/20 shadow-lg rounded-full px-4 py-2 text-[11px] font-bold text-slate-600"
          >
            🚀 Listo para usar sin conexión
          </button>
        </motion.div>
      )}
      {needRefresh && (
        <motion.div
          key="refresh"
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
                ACTUALIZACIÓN DISPONIBLE ✨
              </span>
              
              <h3 className="text-xl font-black text-slate-800 lettering mb-3">
                ¡Nuevas notas de estudio!
              </h3>
              
              <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">
                Hemos actualizado el manual de Dr. Swipe con mejoras visuales y nuevos casos.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="marker-btn flex-grow py-3 text-xs !rotate-0 hover:scale-105"
                >
                  ACTUALIZAR YA ✨
                </button>
                <button
                  onClick={close}
                  className="px-6 py-3 rounded-full border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                >
                  LUEGO
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
