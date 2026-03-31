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
    neutral: 'saturate(0.4) contrast(0.9)',
    happy: 'drop-shadow(0 0 15px rgba(34,211,238,0.4)) saturate(1.1)',
    angry: 'drop-shadow(0 0 15px rgba(251,113,133,0.5)) saturate(1.5)',
    shocked: 'drop-shadow(0 0 20px rgba(251,191,36,0.5)) contrast(1.2) brightness(1.1)'
  };

  const glowColors = {
    neutral: 'bg-slate-500/10',
    happy: 'bg-primary/20',
    angry: 'bg-accent-alert/20',
    shocked: 'bg-accent-warning/20'
  };

  const borderColors = {
    neutral: 'border-white/5',
    happy: 'border-primary/40',
    angry: 'border-accent-alert/40',
    shocked: 'border-accent-warning/40'
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
      <div className="glass-panel p-4 border-accent-alert/30 text-center animate-pulse bg-slate-950">
        <p className="text-accent-alert font-display font-black text-[10px] tracking-widest uppercase">CONEXIÓN PERDIDA</p>
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
              className={`w-14 h-14 glass-panel !rounded-full flex items-center justify-center text-3xl shadow-2xl relative z-10 border bg-slate-900 border-white/10 ${borderColors[validExpression]}`}
              style={{ filter: expressionFilters[validExpression] }}
            >
              {mentorIcons[validDoctor]}

              {/* Expression ring pulse for angry/shocked */}
              {(validExpression === 'angry' || validExpression === 'shocked') && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: validExpression === 'angry' ? '#fb7185' : '#fbbf24' }}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.6, repeat: 2 }}
                />
              )}
            </motion.div>

            {/* Dialogue Bubble */}
            <div className="flex flex-col items-center relative z-20">
              <AnimatePresence mode="wait">
                {dialogueText && (
                  <motion.div
                    key={dialogueText}
                    initial={{ opacity: 0, y: 18, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.88 }}
                    transition={{ duration: 0.4, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    className={`glass-panel p-5 max-w-sm text-center relative border bg-slate-950/95 overflow-hidden ${
                      validExpression === 'angry' ? 'border-accent-alert/50 glow-border-alert' :
                      validExpression === 'happy' ? 'border-primary/50 glow-border-primary' :
                      validExpression === 'shocked' ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]' :
                      'border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <span className="absolute -top-3 left-6 text-[9px] font-black text-white/40 tracking-[0.4em] uppercase bg-slate-950 px-4 py-1 rounded-full border border-white/5">
                      {validExpression === 'angry' ? 'ALERTA' : validExpression === 'happy' ? 'CORRECTO' : validExpression === 'shocked' ? 'ANOMALÍA' : 'DR. COM'}
                    </span>
                    <p className={`text-sm md:text-base font-display font-black leading-relaxed italic tracking-tight ${
                      validExpression === 'angry' ? 'text-accent-alert' :
                      validExpression === 'happy' ? 'text-primary' :
                      validExpression === 'shocked' ? 'text-accent-warning' :
                      'text-white'
                    }`}>
                      "{dialogueText}"
                    </p>
                    {/* Bubble tail */}
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-slate-950 rotate-45 border-l border-t border-inherit" />
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
