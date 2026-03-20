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
    neutral: 'grayscale(0)',
    happy: 'drop-shadow(0 0 10px rgba(20, 184, 166, 0.5))',
    angry: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5)) saturate(1.5)',
    shocked: 'contrast(1.2) brightness(1.2)'
  };

  // Validate doctor and expression
  const validDoctor = (doctor in mentorIcons) ? doctor : 'mendoza';
  const validExpression = (expression in expressionFilters) ? expression : 'neutral';

  return (
    <ErrorBoundary fallback={
      <div className="glass-panel p-4 border-medical-danger/30 text-center animate-pulse">
        <p className="text-medical-danger font-display font-black text-xs tracking-widest uppercase">SISTEMA DE FEEDBACK OFFLINE</p>
      </div>
    }>
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex flex-col items-center gap-6 py-6 relative"
          >
            {/* Character Glow Ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-32 h-32 rounded-full blur-3xl opacity-20 ${
                validExpression === 'happy' ? 'bg-medical-primary' :
                (validExpression === 'angry' ? 'bg-medical-danger' : 'bg-medical-info')
              }`} />
            </div>

            <motion.div
              animate={{
                scale: dialogueText ? [1, 1.05, 1] : 1,
                rotate: validExpression === 'angry' ? [0, -3, 3, 0] : 0
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`w-28 h-28 glass-panel !rounded-full flex items-center justify-center text-6xl shadow-2xl relative z-10 border-2 ${
                validExpression === 'happy' ? 'border-medical-primary/40' :
                (validExpression === 'angry' ? 'border-medical-danger/40' : 'border-white/10')
              }`}
              style={{ filter: expressionFilters[validExpression] }}
            >
              {mentorIcons[validDoctor]}
            </motion.div>

            {/* Premium Dialogue Bubble */}
            <div className="h-24 flex flex-col items-center relative z-20">
              <AnimatePresence mode="wait">
                {dialogueText && (
                  <motion.div
                    key={dialogueText}
                    initial={{ opacity: 0, y: 20, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.85 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                    className="glass-panel p-6 max-w-sm text-center border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.4)] relative"
                  >
                    <span className="absolute -top-3 left-4 text-[8px] font-black text-white/30 tracking-[0.3em] uppercase bg-slate-900 px-2">FEEDBACK</span>
                    <p className="text-base font-display font-black text-slate-100 leading-snug italic-glow">
                      "{dialogueText}"
                    </p>
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
