import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';

interface AvatarFeedbackProps {
  doctor: 'mendoza' | 'castillo' | 'navarro';
  expression: 'neutral' | 'happy' | 'angry' | 'shocked';
  dialogueText: string | null;
  isVisible: boolean;
}

export const AvatarFeedback: React.FC<AvatarFeedbackProps> = ({
  doctor = 'mendoza',
  expression = 'neutral',
  dialogueText,
  isVisible
}) => {
  const mentorIcons = {
    mendoza: '👴',
    castillo: '👩‍🔬',
    navarro: '👩‍⚕️'
  };

  const expressionColors = {
    neutral: 'text-slate-400',
    happy: 'text-emerald-500',
    angry: 'text-rose-500',
    shocked: 'text-amber-500'
  };

  const bubbleColors = {
    neutral: 'border-slate-100 bg-white',
    happy: 'border-emerald-100 bg-emerald-50/50',
    angry: 'border-rose-100 bg-rose-50/50',
    shocked: 'border-amber-100 bg-amber-50/50'
  };

  const validDoctor = (doctor in mentorIcons) ? doctor : 'mendoza';
  const validExpression = (expression in expressionColors) ? expression : 'neutral';

  const avatarMotion = {
    neutral: { scale: 1, rotate: 0 },
    happy: { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] },
    angry: { scale: [1, 1.05, 1.1, 1], rotate: [0, -8, 8, -4, 0] },
    shocked: { scale: [1, 1.25, 1.1], rotate: [0, -10, 10, 0] }
  };

  return (
    <ErrorBoundary fallback={
      <div className="paper-sheet p-4 border-rose-200 text-center animate-pulse bg-rose-50">
        <p className="text-rose-500 font-bold text-[10px] uppercase lettering">Notas Perdidas...</p>
      </div>
    }>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-2 py-0 relative pointer-events-none"
          >
            {/* Avatar Circle - Styled as a circular sticker */}
            <motion.div
              key={`avatar-${validExpression}`}
              animate={avatarMotion[validExpression]}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-md relative z-10 border-4 border-white bg-slate-50 transition-colors duration-500`}
            >
              <span className="relative z-10 filter drop-shadow-sm">
                {mentorIcons[validDoctor]}
              </span>

              {/* Playful ring pulse for high emotion */}
              {(validExpression === 'angry' || validExpression === 'shocked') && (
                <motion.div
                  className={`absolute inset-0 rounded-full border-4 ${validExpression === 'angry' ? 'border-rose-300' : 'border-amber-300'}`}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Dialogue Bubble - Styled as a handwritten note bubble */}
            <div className="flex flex-col items-center relative z-20">
              <AnimatePresence mode="wait">
                {dialogueText && (
                  <motion.div
                    key={dialogueText}
                    initial={{ opacity: 0, y: 15, scale: 0.85, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.85, rotate: 2 }}
                    transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
                    className={`paper-sheet p-6 max-w-sm text-center relative border-2 rounded-panel shadow-lg overflow-hidden ${bubbleColors[validExpression]}`}
                  >
                    {/* Washi Tape Accent */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 washi-tape-pink opacity-60 -rotate-2" />
                    
                    <span className="block text-[10px] font-black opacity-30 tracking-[0.3em] uppercase mb-3 lettering">
                      {validExpression === 'angry' ? '¡OJO!' : validExpression === 'happy' ? 'CORRECTO' : validExpression === 'shocked' ? '¡PELIGRO!' : 'CONSEJO'}
                    </span>
                    
                    <p className={`text-base md:text-xl font-bold leading-relaxed italic lettering ${expressionColors[validExpression]}`}>
                      "{dialogueText}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
};
