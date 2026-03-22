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
      className="glass-panel p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border-4 border-moomin-primary/10 shadow-2xl relative z-[150] bg-white rounded-[3rem] backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-moomin-text/5 pb-6">
        <div>
          <span className="text-[10px] font-black tracking-[0.4em] text-moomin-primary uppercase block mb-1 italic">
            RESUMEN DE GUARDIA
          </span>
          <h2 className="text-xl font-display font-black text-moomin-text tracking-tight italic">
            {caseId ? `Caso: ${caseId.split('_').slice(-2).join(' ')}` : 'Análisis del Turno'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-moomin-bg transition-colors text-moomin-muted hover:text-moomin-text border-2 border-moomin-text/5"
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
              className={`p-6 rounded-[2rem] border-2 bg-moomin-bg/20 relative overflow-hidden ${
                item.isCorrect ? 'border-moomin-primary/30' : 'border-moomin-accent/30'
              }`}
            >
              {/* Playful side accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${item.isCorrect ? 'bg-moomin-primary/40' : 'bg-moomin-accent/40'}`} />
              
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-moomin-muted/50 uppercase tracking-[0.2em] italic">
                  {item.category}
                </span>
                <span className={`text-[11px] font-black italic px-3 py-1 rounded-full ${item.points >= 0 ? 'bg-moomin-primary/10 text-moomin-primary' : 'bg-moomin-accent/10 text-moomin-accent'}`}>
                  {item.points >= 0 ? '+' : ''}{item.points} 🪙
                </span>
              </div>

              <p className="text-[15px] text-moomin-text mb-4 font-black leading-relaxed italic">
                {item.cardText}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full border-2 uppercase tracking-wide italic ${
                  item.isCorrect ? 'bg-moomin-primary/10 border-moomin-primary/20 text-moomin-primary' : 'bg-moomin-accent/10 border-moomin-accent/20 text-moomin-accent'
                }`}>
                  {item.expectedAction === 'keep' ? 'INGRESAR' : 'DESCARTAR'} {item.isCorrect ? '✨' : '⚠️'}
                </span>
              </div>

              <div className={`p-4 rounded-2xl text-[12px] italic font-black leading-relaxed border-2 ${
                item.isCorrect ? 'bg-white border-moomin-primary/10 text-moomin-primary/70' : 'bg-white border-moomin-accent/10 text-moomin-accent/70'
              }`}>
                <span className="font-black not-italic text-[9px] uppercase mr-2 opacity-30 tracking-widest">NOTA:</span>
                "{item.feedback}"
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-moomin-text/5 flex justify-center">
        <button
          onClick={onClose}
          className="bg-moomin-primary hover:bg-moomin-primary/90 text-white font-black text-[10px] tracking-[0.4em] uppercase py-5 px-12 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 italic"
        >
          COMPRENDIDO
        </button>
      </div>
    </motion.div>
  );
};
