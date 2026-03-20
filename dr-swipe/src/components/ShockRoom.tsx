import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { BossQuestion, Card } from '../types/game';
import GlitchText from './bits/GlitchText';

interface ShockRoomProps {
  questions: BossQuestion[];
  dossierItems: Card[];
  onSurvive: () => void;
  onGhosted: (reason: string) => void;
}

export const ShockRoom: React.FC<ShockRoomProps> = ({ 
  questions, 
  onSurvive, 
  onGhosted 
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const q = questions[currentQIndex];

  const handleAnswer = (idx: number) => {
    if (idx === q.correct_index) {
      if (currentQIndex === questions.length - 1) {
        onSurvive();
      } else {
        setCurrentQIndex(prev => prev + 1);
      }
    } else {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
      const errorMessage = q.q || q.question || 'Pregunta desconocida';
      onGhosted(`Fallo crítico en el Shock Room: ${errorMessage}`);
    }
  };

  if (!q) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center z-[100] bg-medical-danger/5 backdrop-blur-sm">
      {/* Background Pulsing Hazard */}
      <div className="absolute inset-0 bg-medical-danger/10 animate-pulse pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel p-10 w-full max-w-lg border-medical-danger/40 shadow-[0_0_80px_rgba(239,68,68,0.3)] relative overflow-hidden"
      >
        {/* Urgent Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-2 h-2 rounded-full bg-medical-danger animate-ping" />
          <span className="text-[10px] font-black text-medical-danger tracking-[0.5em] uppercase">ALERTA DE SEGURIDAD: SALA DE CHOQUE</span>
          <div className="w-2 h-2 rounded-full bg-medical-danger animate-ping" />
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-black text-white mb-10 leading-tight tracking-tight px-4 underline decoration-medical-danger/30 underline-offset-8">
          <GlitchText text={q.q || q.question || "URGENCIA: REQUIERE ACCIÓN INMEDIATA"} />
        </h2>
        
        <div className="w-full h-0.5 bg-white/5 mb-10 relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-medical-danger shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {q.options.map((opt, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(idx)}
              className="w-full text-left p-6 glass-panel !rounded-3xl hover:bg-white/5 transition-colors flex justify-between items-center group border-white/5 hover:border-medical-primary/30"
            >
              <div className="flex gap-4 items-center">
                <span className="text-[10px] font-black font-mono text-white/20 uppercase">0{idx + 1}</span>
                <span className="text-base font-bold text-slate-100 group-hover:text-medical-primary transition-colors pr-4">{opt}</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-medical-primary/50 group-hover:bg-medical-primary/10 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-medical-primary transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Triad Progress Bubbles */}
      <div className="mt-12 flex gap-4">
        {questions.map((_, idx) => (
          <motion.div 
            key={idx}
            animate={{ 
              scale: idx === currentQIndex ? [1, 1.2, 1] : 1,
              backgroundColor: idx <= currentQIndex ? "#ef4444" : "rgba(255,255,255,0.1)"
            }}
            transition={{ repeat: idx === currentQIndex ? Infinity : 0, duration: 1.5 }}
            className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          />
        ))}
      </div>
    </div>
  );
};
