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

  const expressionFilters = {
    neutral: 'saturate(0.8)',
    happy: 'drop-shadow(0 0 15px rgba(135,206,235,0.4)) saturate(1.1)',
    angry: 'drop-shadow(0 0 15px rgba(255,159,127,0.5)) saturate(1.5) contrast(1.1)',
    shocked: 'drop-shadow(0 0 20px rgba(255,182,193,0.5)) contrast(1.2) brightness(1.1)'
  };

  const glowColors = {
    neutral: 'bg-moomin-muted/20',
    happy: 'bg-moomin-primary/30',
    angry: 'bg-moomin-accent/30',
    shocked: 'bg-moomin-secondary/30'
  };

  const borderColors = {
    neutral: 'border-moomin-text/5',
    happy: 'border-moomin-primary/40',
    angry: 'border-moomin-accent/40',
    shocked: 'border-moomin-secondary/40'
  };

  const validDoctor = (doctor in mentorIcons) ? doctor : 'mendoza';
  const validExpression = (expression in expressionFilters) ? expression : 'neutral';

  const avatarMotion = {
    neutral: { scale: 1, rotate: 0 },
    happy: { scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] },
    angry: { scale: [1, 1.05, 0.97, 1], rotate: [0, -4, 4, -2, 0] },
    shocked: { scale: [1, 1.15, 1.05], rotate: [0, -5, 5, 0] }
  };

  return (
    <ErrorBoundary fallback={
      <div className="glass-panel p-4 border-moomin-accent/30 text-center animate-pulse">
        <p className="text-moomin-accent font-display font-black text-xs tracking-widest uppercase">CONEXIÓN INTERRUMPIDA</p>
      </div>
    }>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-1 py-0 relative"
          >
            {/* Ambient Glow Ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: validExpression === 'shocked' ? [1, 1.4, 1] : [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-32 h-32 rounded-full blur-3xl opacity-25 ${glowColors[validExpression]}`}
              />
            </div>

            {/* Avatar Circle */}
            <motion.div
              key={`avatar-${validExpression}`}
              animate={avatarMotion[validExpression]}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className={`w-12 h-12 glass-panel !rounded-full flex items-center justify-center text-2xl shadow-2xl relative z-10 border-2 ${borderColors[validExpression]}`}
              style={{ filter: expressionFilters[validExpression] }}
            >
              {mentorIcons[validDoctor]}

              {/* Expression ring pulse for angry/shocked */}
              {(validExpression === 'angry' || validExpression === 'shocked') && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: validExpression === 'angry' ? '#ef4444' : '#fbbf24' }}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.6, repeat: 2 }}
                />
              )}
            </motion.div>

            {/* Dialogue Bubble */}
            <div className="h-14 flex flex-col items-center relative z-20">
              <AnimatePresence mode="wait">
                {dialogueText && (
                  <motion.div
                    key={dialogueText}
                    initial={{ opacity: 0, y: 18, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.88 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`glass-panel p-4 max-w-md text-center shadow-2xl relative border-2 bg-white/95 ${
                      validExpression === 'angry' ? 'border-moomin-accent/50' :
                      validExpression === 'happy' ? 'border-moomin-primary/50' :
                      validExpression === 'shocked' ? 'border-moomin-secondary/50' :
                      'border-moomin-text/10'
                    }`}
                  >
                    <span className="absolute -top-3 left-4 text-[9px] font-black text-moomin-muted/50 tracking-[0.3em] uppercase bg-white px-3 py-0.5 rounded-full border border-moomin-text/5">
                      {validExpression === 'angry' ? 'PISTA' : validExpression === 'happy' ? '¡GENIAL!' : validExpression === 'shocked' ? '¡CUIDADO!' : 'DOCTOR'}
                    </span>
                    <p className={`text-sm md:text-base font-display font-black leading-snug italic tracking-tight ${
                      validExpression === 'angry' ? 'text-moomin-accent' :
                      validExpression === 'happy' ? 'text-moomin-primary' :
                      validExpression === 'shocked' ? 'text-moomin-secondary' :
                      'text-moomin-text'
                    }`}>
                      "{dialogueText}"
                    </p>
                    {/* Bubble tail */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rotate-45 border-l-2 border-t-2 border-inherit" />
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
