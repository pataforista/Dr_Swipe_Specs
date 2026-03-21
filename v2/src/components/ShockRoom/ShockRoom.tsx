import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriadQuestion } from '../../types/clinical';
import './ShockRoom.css';

export interface ShockRoomProps {
  questions: TriadQuestion[];
  dossierItems: string[]; // Lo que el jugador salvó
  onSurvive: () => void;
  onGhosted: (reason: string) => void;
}

export const ShockRoom: React.FC<ShockRoomProps> = ({ 
  questions, 
  dossierItems, 
  onSurvive, 
  onGhosted 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const currentQ = questions[currentIndex];

  // Timer que decrementa el tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Efecto separado que verifica si el tiempo se agotó
  useEffect(() => {
    if (timeLeft <= 0) {
      onGhosted("El tiempo se agotó. El paciente entró en paro mientras dudabas.");
    }
  }, [timeLeft, onGhosted]);

  const handleAnswer = (selectedIndex: number) => {
    if (selectedIndex !== currentQ.correct_index) {
      onGhosted(`¡Error crítico! ${currentQ.rationale || "Elegiste el manejo incorrecto."}`);
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      onSurvive();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      className="shock-room-overlay"
    >
      <motion.div 
        animate={{ opacity: [0.1, 0.4, 0.1] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="alarm-hue"
      />

      <div className="shock-header">
        <h2 className="alarm-title glitch-text">¡BRECHA DETECTADA!</h2>
        <p className="timer-display font-mono text-red-500">
          DESTIERRO EN: 00:{timeLeft.toString().padStart(2, '0')}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          className="question-card"
        >
          <p className="step-indicator font-mono uppercase tracking-widest text-xs opacity-70">
            Verso {currentIndex + 1} de {questions.length} del Conjuro
          </p>
          <h3 className="question-text">{currentQ.question}</h3>

          <div className="options-list">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="option-btn"
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="dossier-preview">
        <p className="dossier-label">Tu Expediente:</p>
        <div className="dossier-pills">
          {dossierItems.map((item, idx) => (
            <span key={idx} className="dossier-pill">
              {item}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
