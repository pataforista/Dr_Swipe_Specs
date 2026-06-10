import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarFeedbackProps, DoctorName, FaceExpression } from '../../types/avatars';
import './AvatarFeedback.css';

export const AvatarFeedback: React.FC<AvatarFeedbackProps> = ({ 
  doctor, 
  expression, 
  dialogueText, 
  isVisible 
}) => {
  
  // Diccionario visual (Placeholder paths)
  const avatarSprites: Record<DoctorName, Record<FaceExpression, string>> = {
    mendoza: {
      idle: '/sprites/mendoza-idle.png',
      angry: '/sprites/mendoza-angry.png',
      disappointed: '/sprites/mendoza-disappointed.png',
      focus: '/sprites/mendoza-idle.png',
      approval: '/sprites/mendoza-idle.png',
    },
    castillo: {
      idle: '/sprites/castillo-idle.png',
      focus: '/sprites/castillo-focus.png',
      angry: '/sprites/castillo-idle.png',
      disappointed: '/sprites/castillo-idle.png',
      approval: '/sprites/castillo-idle.png',
    },
    navarro: {
      idle: '/sprites/navarro-idle.png',
      approval: '/sprites/navarro-approval.png',
      focus: '/sprites/navarro-focus.png',
      angry: '/sprites/navarro-idle.png',
      disappointed: '/sprites/navarro-idle.png',
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="avatar-feedback-container"
        >
          {/* El globo de diálogo dinámico */}
          <AnimatePresence>
            {dialogueText && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="speech-bubble"
              >
                <p>{dialogueText}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* El Sprite del Avatar */}
          <motion.img 
            key={`${doctor}-${expression}`} // Fuerza el re-render si cambia la cara
            src={avatarSprites[doctor][expression as keyof typeof avatarSprites[doctor]]}
            alt={`Dr. ${doctor} - ${expression}`}
            className="avatar-sprite"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
