import React from 'react';
import { motion } from 'framer-motion';

interface EventAlertProps {
  event: {
    type: 'lab' | 'archive' | 'systemic';
    item: any;
  } | null;
  onClose: () => void;
}

export const EventAlert: React.FC<EventAlertProps> = ({ event, onClose }) => {
  if (!event) return null;

  const getEventTheme = (type: string) => {
    switch (type) {
      case 'lab': return { icon: '🧪', title: 'REPORTE DE LABORATORIO', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800' };
      case 'archive': return { icon: '📂', title: 'ARCHIVO ENCONTRADO', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' };
      case 'systemic': return { icon: '🏥', title: 'EVENTO SISTÉMICO', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800' };
      default: return { icon: '🔔', title: 'AVISO', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800' };
    }
  };

  const theme = getEventTheme(event.type);
  const effectText = event.item.efecto ? 
    `Efecto: ${event.item.efecto.tipo.replace(/_/g, ' ').toUpperCase()}` : 
    "Cambio en las reglas de la guardia";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-24 sm:bottom-32 left-4 right-4 z-[140] p-4 sm:p-6 rounded-3xl border-2 shadow-2xl ${theme.bg} ${theme.border} ${theme.text} max-w-sm mx-auto backdrop-blur-md`}
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl sm:text-4xl bg-white/80 p-2 rounded-2xl shadow-sm border border-white">
          {theme.icon}
        </div>
        <div className="flex-grow">
          <h3 className="text-[10px] sm:text-[11px] font-black tracking-[0.2em] opacity-60 mb-1 leading-none">{theme.title}</h3>
          <h4 className="text-lg sm:text-xl font-black mb-2 leading-tight">{event.item.nombre}</h4>
          <p className="text-xs sm:text-sm font-medium italic opacity-80 mb-4 leading-relaxed line-clamp-3">"{event.item.texto || event.item.frases?.start}"</p>
          
          <div className="bg-white/50 px-3 py-2 rounded-xl flex items-center gap-2 border border-white/40">
            <span className="text-[10px] font-black uppercase tracking-widest">Utilidad:</span>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase">{effectText}</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onClose}
        className="mt-4 w-full py-3 bg-white/80 rounded-xl text-[10px] font-black tracking-[0.3em] uppercase border border-white shadow-sm hover:bg-white transition-colors"
      >
        ENTENDIDO 📝
      </button>
    </motion.div>
  );
};
