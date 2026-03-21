import React from 'react';
import { motion } from 'framer-motion';

interface FeedbackItem {
  cardId: string;
  cardText: string;
  isCorrect: boolean;
  feedback: string;
  category: string;
  points: number;
  expectedAction: 'keep' | 'discard';
}

interface RetrospectiveViewProps {
  history: FeedbackItem[];
  onClose: () => void;
  caseId?: string;
}

export const RetrospectiveView: React.FC<RetrospectiveViewProps> = ({ history, onClose, caseId }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border-white/20 shadow-2xl relative z-[150] bg-slate-900/90 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-black tracking-[0.4em] text-medical-primary uppercase block mb-1">
            REPORTE DE RETROSPECTIVA
          </span>
          <h2 className="text-xl font-display font-black text-white tracking-tight italic">
            {caseId ? `Caso: ${caseId.split('_').slice(-2).join(' ')}` : 'Análisis de Guardia'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <span className="text-2xl">✕</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-grow overflow-y-auto px-2 custom-scrollbar space-y-4 pb-6">
        {history.length === 0 ? (
          <div className="py-20 text-center opacity-40">
            <p className="text-sm italic">No hay historial de decisiones en esta sesión.</p>
          </div>
        ) : (
          history.map((item, idx) => (
            <motion.div
              key={`${item.cardId}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-2xl border bg-slate-800/40 relative overflow-hidden ${
                item.isCorrect ? 'border-green-500/30' : 'border-red-500/30'
              }`}
            >
              {/* Vertical accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
              
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {item.category}
                </span>
                <span className={`text-[10px] font-mono font-black ${item.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.points >= 0 ? '+' : ''}{item.points} PTS
                </span>
              </div>

              <p className="text-sm text-slate-200 mb-3 font-medium leading-relaxed">
                {item.cardText}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
                  item.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  ACCIÓN: {item.expectedAction === 'keep' ? 'INGRESAR' : 'DESCARTAR'} {item.isCorrect ? '✓' : '✗'}
                </span>
              </div>

              <div className={`p-3 rounded-xl text-xs italic font-medium leading-relaxed ${
                item.isCorrect ? 'bg-green-500/5 text-green-200/70' : 'bg-red-500/5 text-red-200/70'
              }`}>
                <span className="font-black not-italic text-[9px] uppercase mr-2 opacity-50">Log:</span>
                "{item.feedback}"
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
        <button
          onClick={onClose}
          className="btn-primary px-10 py-3 text-xs tracking-widest"
        >
          VOLVER AL REPORTE
        </button>
      </div>
    </motion.div>
  );
};
