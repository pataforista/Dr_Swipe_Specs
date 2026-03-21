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
    neutral: 'grayscale(0.2)',
    happy: 'drop-shadow(0 0 12px rgba(20,184,166,0.6)) saturate(1.2)',
    angry: 'drop-shadow(0 0 12px rgba(239,68,68,0.7)) saturate(1.8) contrast(1.1)',
    shocked: 'drop-shadow(0 0 16px rgba(251,191,36,0.7)) contrast(1.3) brightness(1.15)'
  };

  const glowColors = {
    neutral: 'bg-slate-500',
    happy: 'bg-medical-primary',
    angry: 'bg-medical-danger',
    shocked: 'bg-yellow-400'
  };

  const borderColors = {
    neutral: 'border-white/10',
    happy: 'border-medical-primary/50',
    angry: 'border-medical-danger/50',
    shocked: 'border-yellow-400/50'
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
      <div className="glass-panel p-4 border-medical-danger/30 text-center animate-pulse">
        <p className="text-medical-danger font-display font-black text-xs tracking-widest uppercase">SISTEMA DE FEEDBACK OFFLINE</p>
      </div>
    }>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-6 py-6 relative"
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
              className={`w-28 h-28 glass-panel !rounded-full flex items-center justify-center text-6xl shadow-2xl relative z-10 border-2 ${borderColors[validExpression]}`}
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
            <div className="h-24 flex flex-col items-center relative z-20">
              <AnimatePresence mode="wait">
                {dialogueText && (
                  <motion.div
                    key={dialogueText}
                    initial={{ opacity: 0, y: 18, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.88 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`glass-panel p-5 max-w-sm text-center shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative border ${
                      validExpression === 'angry' ? 'border-medical-danger/30' :
                      validExpression === 'happy' ? 'border-medical-primary/30' :
                      validExpression === 'shocked' ? 'border-yellow-400/30' :
                      'border-white/20'
                    }`}
                  >
                    <span className="absolute -top-3 left-4 text-[8px] font-black text-white/30 tracking-[0.3em] uppercase bg-slate-900 px-2">
                      {validExpression === 'angry' ? 'CRÍTICA' : validExpression === 'happy' ? 'APROBACIÓN' : validExpression === 'shocked' ? 'ALERTA' : 'FEEDBACK'}
                    </span>
                    <p className={`text-base font-display font-black leading-snug italic-glow ${
                      validExpression === 'angry' ? 'text-red-200' :
                      validExpression === 'happy' ? 'text-teal-200' :
                      validExpression === 'shocked' ? 'text-yellow-200' :
                      'text-slate-100'
                    }`}>
                      "{dialogueText}"
                    </p>
                    {/* Bubble tail */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1e293b]/80 rotate-45 border-l border-t border-white/10" />
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
