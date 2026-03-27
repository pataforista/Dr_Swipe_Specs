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
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.98 }}
      className="glass-panel p-8 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.7)] relative z-[150] bg-slate-900 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent-alert opacity-50" />
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-8">
        <div>
          <span className="text-[10px] font-black tracking-[0.5em] text-primary uppercase block mb-1">
            ANÁLISIS DE RENDIMIENTO
          </span>
          <h2 className="text-2xl font-display font-black text-white tracking-tight italic">
            {caseId ? `${caseId.split('_').slice(-2).join(' ')}` : 'REPORTE DE INCIDENCIAS'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors text-slate-500 hover:text-white border border-white/10"
        >
          <span className="text-xl font-black">✕</span>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-6 rounded-3xl border relative overflow-hidden bg-slate-950/40 ${
                item.isCorrect ? 'border-primary/20 shadow-[0_0_20px_rgba(34,211,238,0.05)]' : 'border-accent-alert/20 shadow-[0_0_20px_rgba(251,113,133,0.05)]'
              }`}
            >
              {/* Playful side accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.isCorrect ? 'bg-primary' : 'bg-accent-alert'}`} />
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  {item.category}
                </span>
                <span className={`text-[11px] font-black italic px-4 py-1.5 rounded-full ${item.points >= 0 ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-accent-alert/20 text-accent-alert border border-accent-alert/20'}`}>
                  {item.points >= 0 ? '+' : ''}{item.points} XP
                </span>
              </div>

              <p className="text-[16px] text-white mb-5 font-black leading-relaxed tracking-tight italic">
                {item.cardText}
              </p>

              <div className="flex items-center gap-3 mb-5">
                <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest ${
                  item.isCorrect ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-accent-alert/10 border-accent-alert/30 text-accent-alert'
                }`}>
                  DRIVE: {item.expectedAction === 'keep' ? 'ACEPTAR' : 'IGNORAR'} {item.isCorrect ? '✔' : '✘'}
                </span>
              </div>

              <div className={`p-5 rounded-2xl text-[12px] italic font-black leading-relaxed border ${
                item.isCorrect ? 'bg-black/20 border-primary/20 text-primary/80' : 'bg-black/20 border-accent-alert/20 text-accent-alert/80'
              }`}>
                <span className="font-black not-italic text-[9px] uppercase mr-3 opacity-40 tracking-[0.3em]">ANALYTICS:</span>
                "{item.feedback}"
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
        <button
          onClick={onClose}
          className="bg-primary hover:bg-white text-slate-950 font-black text-[11px] tracking-[0.6em] uppercase py-6 px-16 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-all active:scale-95"
        >
          DESPRENDER REPORTE
        </button>
      </div>
    </motion.div>
  );
};
