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
      className="paper-sheet p-8 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative z-[150] bg-white overflow-hidden"
    >
      {/* Paper texture overlay (Dot Grid) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />
      
      {/* Washi Tape Header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-10 washi-tape-pink -rotate-1 shadow-sm border-x-2 border-white/40 z-20" />

      {/* Header */}
      <div className="flex justify-between items-center mb-10 pt-6 relative z-10 border-b-2 border-slate-50 pb-8">
        <div>
          <span className="text-[12px] font-black tracking-[0.4em] text-primary/60 uppercase block mb-2 lettering">
            Log de Aprendizaje 📔
          </span>
          <h2 className="text-4xl font-bold text-slate-800 tracking-tight lettering">
            {caseId ? `Caso: ${caseId.split('_').pop()}` : 'Notas de la Guardia'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 font-bold border-2 border-white shadow-sm"
        >
          ✕
        </button>
      </div>

      {/* History List */}
      <div className="flex-grow overflow-y-auto px-4 custom-scrollbar space-y-8 pb-10 relative z-10">
        {history.length === 0 ? (
          <div className="py-20 text-center opacity-30 lettering">
            <p className="text-2xl italic">"Todavía no hay notas en este diario..." ✍️</p>
          </div>
        ) : (
          history.map((item, idx) => (
            <motion.div
              key={`${item.cardId}-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-8 rounded-[2.5rem] border-2 relative overflow-hidden bg-white shadow-sm transition-all hover:shadow-md ${
                item.isCorrect ? 'border-emerald-100' : 'border-rose-100 shadow-[0_5px_15px_rgba(244,63,94,0.05)]'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-slate-100 text-slate-500 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest lettering">
                  {item.category}
                </span>
                <span className={`text-[12px] font-bold px-4 py-1.5 rounded-full border-2 lettering ${item.points >= 0 ? 'bg-emerald-50 text-emerald-600 border-white' : 'bg-rose-50 text-rose-600 border-white'}`}>
                  {item.points >= 0 ? '✨' : '🖍️'} {item.points >= 0 ? '+' : ''}{item.points} pts
                </span>
              </div>

              <p className="text-xl text-slate-700 mb-6 font-bold leading-relaxed lettering">
                "{item.cardText}"
              </p>

              <div className="flex items-center gap-4 mb-6">
                <span className={`text-[11px] font-bold px-5 py-2 rounded-2xl border-2 uppercase tracking-widest lettering ${
                  item.isCorrect ? 'bg-emerald-500 text-white border-white' : 'bg-rose-500 text-white border-white'
                }`}>
                  {item.expectedAction === 'keep' ? 'ACEPTAR' : 'DESCARTAR'} {item.isCorrect ? '✅' : '❌'}
                </span>
              </div>

              <div className={`p-6 rounded-3xl text-[14px] font-bold leading-relaxed border-2 border-dashed lettering italic ${
                item.isCorrect ? 'bg-slate-50 border-emerald-100 text-slate-500' : 'bg-rose-50/30 border-rose-100 text-rose-600/80'
              }`}>
                <span className="not-italic text-[10px] uppercase font-black mr-3 opacity-40">PERLA MÉDICA:</span>
                "{item.feedback}"
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-8 border-t-2 border-slate-50 flex justify-center relative z-10">
        <button
          onClick={onClose}
          className="marker-btn py-5 px-20 text-xl group shadow-teal-100"
        >
          CERRAR DIARIO ✨
        </button>
      </div>
    </motion.div>
  );
};
