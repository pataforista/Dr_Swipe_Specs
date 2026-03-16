import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PerlaENARM } from '../../types/clinical';
import './GachaReveal.css';

interface GachaRevealProps {
  perla: PerlaENARM;
  onComplete: () => void;
}

export const GachaReveal: React.FC<GachaRevealProps> = ({ perla, onComplete }) => {
  const [stage, setStage] = useState<'idle' | 'opening' | 'revealed'>('idle');

  const handlePull = () => {
    setStage('opening');
    // Simulamos el suspense de la tirada (2 segundos)
    setTimeout(() => setStage('revealed'), 2000);
  };

  return (
    <div className="gacha-overlay">
      <AnimatePresence mode="wait">
        
        {/* ESTADO 1: El Expediente Sellado / Botón de Tirada */}
        {stage === 'idle' && (
          <motion.button
            key="idle"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePull}
            className="dossier-sealed"
          >
            <div className="dossier-inner">
               <span className="decrypt-text">DESENCRIPTAR</span>
            </div>
            <div className="dossier-glow" />
          </motion.button>
        )}

        {/* ESTADO 2: Animación de Tensión (El Gacha girando) */}
        {stage === 'opening' && (
          <motion.div
            key="opening"
            animate={{ 
              x: [-10, 10, -10, 10, -5, 5, 0], // Temblor errático
              scale: [1, 1.1, 1.2], 
              rotateZ: [-2, 2, -1, 1, 0]
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="dossier-opening"
          >
             <div className="opening-light" />
          </motion.div>
        )}

        {/* ESTADO 3: La Perla Revelada */}
        {stage === 'revealed' && (
          <motion.div
            key="revealed"
            initial={{ scale: 0, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className={`perla-card rarity-${perla.rarity}`}
          >
            <div className="perla-badge">
              {perla.category || "Nueva Perla"}
            </div>
            
            <h2 className="perla-title">
              {perla.title}
            </h2>
            <p className="perla-text">
              {perla.text}
            </p>
            
            <div className="perla-footer">
              <span className="ref-label">Referencia Oficial</span>
              <span className="ref-value">{perla.gpc_ref}</span>
            </div>

            <button 
              onClick={onComplete}
              className="btn-save-codex"
            >
              Guardar en el Códice
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
