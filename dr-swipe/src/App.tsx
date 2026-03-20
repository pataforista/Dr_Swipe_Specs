import { motion } from 'framer-motion';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { SwipeDeck } from './components/SwipeDeck';
import { AvatarFeedback } from './components/AvatarFeedback';
import { ShockRoom } from './components/ShockRoom';
import { useState, useEffect } from 'react';
import type { ClinicalCase } from './types/game';
import { dataLoader } from './utils/dataLoader';
import { useGameAudio } from './hooks/useGameAudio';
import DecryptedText from './components/bits/DecryptedText';
import ShinyText from './components/bits/ShinyText';
import ErrorBoundary from './components/ErrorBoundary';

const isSwipeCorrect = (direction: 'left' | 'right', expectedAction: 'keep' | 'discard'): boolean => {
  return (direction === 'right' && expectedAction === 'keep') ||
         (direction === 'left' && expectedAction === 'discard');
};

const TelemetryHUD: React.FC<{ timeLeft: number; state: string }> = ({ timeLeft, state }) => {
  const [pulse, setPulse] = useState(72);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + (Math.random() > 0.5 ? 1 : -1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (state !== 'triage') return null;

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-8 pointer-events-none z-50">
      <div className="telemetry-text text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-medical-primary rounded-full animate-pulse" />
          <span>SYS_READY // V_0.4.1</span>
        </div>
        <div className="mt-2 text-white/40 font-mono">BP: 120/80 mmHg</div>
        <div className="text-white/40 font-mono">O2: 98% (STABLE)</div>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="telemetry-text text-[8px] opacity-40">HR_MONITOR</span>
        <div className="flex items-end gap-1 h-8">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [10, 25, 15, 20, 12] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              className="w-1 bg-medical-primary/30 rounded-full"
            />
          ))}
        </div>
        <span className="text-xl font-black text-medical-primary font-mono">{pulse} <small className="text-[10px]">BPM</small></span>
      </div>

      <div className="telemetry-text text-[8px] opacity-40">
        TIME_REMAINING: {timeLeft}S
      </div>
    </div>
  );
};


function App() {
  const [state, send] = useMachine(gameMachine);
  const { playGhosted, startAlarm, stopAlarm } = useGameAudio();
  const [currentCase, setCurrentCase] = useState<ClinicalCase | null>(null);
  
  // Dynamic Background Theming
  useEffect(() => {
    if (currentCase) {
      const colors: Record<string, string> = {
        ped: '244, 114, 182',
        surg: '185, 28, 28',
        obs: '139, 92, 246',
        gyn: '168, 85, 247',
        im: '59, 130, 246',
        gast: '234, 179, 8',
        card: '225, 29, 72',
        endo: '249, 115, 22',
        inf: '34, 197, 94',
        neur: '79, 70, 229',
        prev: '20, 184, 166',
        stats: '100, 116, 139',
        engl: '51, 65, 85'
      };
      const key = Object.keys(colors).find(k => currentCase.case_id.toLowerCase().includes(k)) || 'default';
      const rgb = colors[key] || '13, 148, 136';
      document.documentElement.style.setProperty('--specialty-rgb', rgb);
    }
  }, [currentCase]);

  const [showIntro, setShowIntro] = useState(false);
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'angry' | 'shocked'>('neutral');
  const [comment, setComment] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  // Time Tense Haptics (Variance)
  useEffect(() => {
    if (!state.matches('triage')) return;
    if (timeLeft === 10 || timeLeft === 5 || timeLeft === 3) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Short warning pulse
      }
    }
  }, [timeLeft, state]);

  useEffect(() => {
    let timer: number;
    if (state.matches('triage') && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (state.matches('triage') && timeLeft === 0) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([500, 100, 500, 100, 1000]); // Lethal time-out pattern
      }
      send({ type: 'TIME_OUT' });
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, send]);

  useEffect(() => {
    const isLethal = state.matches('ghosted') || state.matches('debrief');
    if (isLethal && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 500]); // Lethal mistake pattern
    }
  }, [state]);

  const startNewCase = async () => {
    try {
      const caseData = await dataLoader.loadRandomCase();
      setCurrentCase(caseData);
      setShowIntro(true);
    } catch (err) {
      console.error(err);
      alert("Error al cargar caso.");
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const card = state.context.deck[state.context.currentCardIndex];
    if (!card) return;

    const isCorrect = isSwipeCorrect(direction, card.expected_action);

    setExpression(isCorrect ? 'happy' : 'angry');
    const comment = card.scoring.vazquez_comment;
    setComment(comment ? (comment.split(':')[1]?.trim() || comment) : null);

    send({ type: 'SWIPE', direction });

    setTimeout(() => {
      setExpression('neutral');
      setComment(null);
    }, 2000);
  };

  const renderCurrentView = () => {
    if (showIntro && currentCase) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel p-10 max-w-md text-center border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Decorative Corner Accent */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-medical-primary/10 -translate-x-8 -translate-y-8 rotate-45 border border-medical-primary/30" />
          
          <span className="text-[10px] font-black tracking-[0.4em] text-medical-primary uppercase mb-6 block">BREVIARIO CLÍNICO</span>
          
          <h2 className="text-4xl font-display font-black text-white mb-6 leading-tight tracking-tighter">
            <DecryptedText text={currentCase.patient_intro.name} animateOn="view" speed={30} maxIterations={5} />
          </h2>
          
          <div className="w-12 h-1 bg-medical-primary/30 mx-auto mb-8 rounded-full" />
          
          <p className="text-lg text-slate-300 leading-relaxed mb-10 italic font-medium px-4">
            <DecryptedText text={currentCase.patient_intro.arrival_scenario} animateOn="view" speed={25} maxIterations={1} revealMultiplier={2} />
          </p>
          
          <button 
            onClick={() => {
              setShowIntro(false);
              setTimeLeft(currentCase.patient_intro.time_limit_sec);
              send({ 
                type: 'START_GUARD', 
                deck: currentCase.card_stream,
                difficulty: currentCase.difficulty || 'standard',
                pearl: currentCase.enarm_pearl || currentCase.perla_enarm
              });
            }}
            className="btn-primary w-full py-5 text-base"
          >
            <ShinyText text="INGRESAR A URGENCIAS" speed={3} />
          </button>
        </motion.div>
      );
    }

    switch (true) {
      case state.matches('idle'):
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-8"
          >
            <div className="relative mb-12">
              <h1 className="text-7xl font-display font-black tracking-tighter text-medical-primary text-glow italic">
                <DecryptedText text="DR. SWIPE" animateOn="view" speed={100} />
              </h1>
              <span className="absolute -bottom-4 right-0 text-[10px] font-black tracking-[0.5em] text-white/20 uppercase">MEDICAL TRUTH SYSTEM</span>
            </div>
            <button onClick={startNewCase} className="btn-primary px-16 py-6 text-xl">
              <ShinyText text="INICIAR GUARDIA" speed={3} />
            </button>
          </motion.div>
        );

      case state.matches('triage'):
        return (
          <SwipeDeck 
            cards={state.context.deck} 
            currentIndex={state.context.currentCardIndex} 
            onSwipe={handleSwipe} 
            isLocked={!state.matches('triage')}
          />
        );

      case state.matches('critical_alert'):
        startAlarm();
        return (
          <div className="fixed inset-0 bg-medical-danger/20 flex flex-col items-center justify-center animate-pulse">
            <h2 className="text-4xl font-display font-black text-medical-danger">CÓDIGO ROJO</h2>
            <p className="text-sm font-bold tracking-[0.3em] mt-4 opacity-60">SHOCK ROOM REQUERIDO</p>
          </div>
        );

      case state.matches('boss_fight'):
        const hasQuestions = currentCase?.boss_fight_triad?.questions && 
                           Array.isArray(currentCase.boss_fight_triad.questions) && 
                           currentCase.boss_fight_triad.questions.length > 0;
                           
        if (!hasQuestions) {
          send({ type: 'ANSWER_CORRECT' });
          return null;
        }
        return (
          <ShockRoom 
            questions={currentCase.boss_fight_triad.questions}
            dossierItems={state.context.dossier}
            onSurvive={() => {
              stopAlarm();
              send({ type: 'ANSWER_CORRECT' });
            }}
            onGhosted={(error) => {
              stopAlarm();
              playGhosted();
              send({ type: 'ANSWER_WRONG', error });
            }}
          />
        );

      case state.matches('reward'):
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-10 max-w-sm text-center border-medical-primary/30 shadow-[0_0_50px_rgba(13,148,136,0.1)]"
          >
            <div className="w-20 h-20 bg-medical-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-3xl font-display font-black text-medical-primary mb-4 tracking-tighter">MÉRITO ALCANZADO</h2>
            <p className="text-slate-400 mb-8 font-medium italic">"Se ha estabilizado la situación clínica con precisión empírica."</p>
            <button onClick={() => send({ type: 'CLAIM' })} className="btn-primary w-full">REGISTRAR EN BITÁCORA</button>
          </motion.div>
        );

      case state.matches('ghosted'):
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="relative mb-6">
              <h2 className="text-6xl font-display font-black text-medical-danger text-glow-danger italic tracking-tighter">GHOSTED</h2>
              <div className="absolute top-0 left-0 w-full h-full bg-medical-danger opacity-20 animate-pulse blur-2xl" />
            </div>
            
            <div className="glass-panel p-6 border-medical-danger/20 mb-8 max-w-xs bg-medical-danger/5">
              <p className="text-sm font-mono text-medical-danger uppercase tracking-[0.2em] mb-2 font-black">FALLO SISTÉMICO</p>
              <p className="text-slate-400 font-medium leading-relaxed">{state.context.fatalError || "Negligencia o fallo preventivo en el triage."}</p>
            </div>
            
            <button 
              onClick={() => send({ type: 'VIEW_DEBRIEF' })} 
              className="btn-primary px-8 py-4 text-xs mb-4 !rounded-xl"
            >
              <ShinyText text="ABRIR CAJA NEGRA (DEBRIEF)" speed={3} />
            </button>
            <br />
            <button 
              onClick={() => send({ type: 'RESTART' })} 
              className="text-[10px] font-black tracking-[0.4em] text-slate-500 hover:text-white transition-colors uppercase border-b border-white/5 pb-1"
            >
              Cerrar Expediente
            </button>
          </motion.div>
        );

      case state.matches('debrief'):
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="cyber-panel p-8 max-w-sm text-left bg-black/80"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="telemetry-text text-[9px] text-medical-danger font-black tracking-[0.4em] uppercase">
                ERROR_TYPE: {state.context.debriefData?.title.toUpperCase().replace(' ', '_')}
              </span>
              <span className="text-[8px] font-mono text-white/20">CASE ID: {currentCase?.case_id || 'UNKNOWN'}</span>
            </div>

            <div className="mb-6 p-4 bg-medical-danger/10 border-l-4 border-medical-danger">
              <p className="text-xs text-medical-danger font-mono font-black mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-medical-danger rounded-full animate-ping" />
                VÁZQUEZ_LOG_REPORT:
              </p>
              <p className="text-sm text-slate-100 italic font-medium leading-relaxed">
                "{state.context.debriefData?.comment}"
              </p>
            </div>

            <div className="mb-6">
              <div className="text-[9px] text-white/40 mb-2 font-mono uppercase tracking-widest">Diagnostic_Correction:</div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {state.context.debriefData?.text}
              </p>
            </div>

            <div className="flex items-center justify-between mb-8 opacity-60">
              <span className="text-[9px] font-mono text-medical-primary">GPC_SOURCE: {state.context.debriefData?.gpc}</span>
              <div className="flex gap-1">
                <div className="w-1 h-3 bg-medical-primary/20" />
                <div className="w-1 h-3 bg-medical-primary/40" />
                <div className="w-1 h-3 bg-medical-primary/60" />
              </div>
            </div>

            <button 
              onClick={() => send({ type: 'RESTART' })} 
              className="btn-primary w-full py-4 !rounded-none !bg-medical-danger hover:!bg-red-700 text-xs tracking-widest border-t border-b border-white/20"
            >
              TERMINAR_REPORTE // VOLVER_A_GUARDIA
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 bg-[#070b14] flex flex-col items-center safe-top safe-bottom select-none overflow-hidden text-slate-100 crt-screen ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''}`}>
      <TelemetryHUD timeLeft={timeLeft} state={state.value as string} />
      
      {/* Red-Out Vignette Effect */}
      {timeLeft <= 15 && state.matches('triage') && (
        <div 
          className="red-out-overlay fixed inset-0" 
          style={{ opacity: (1 - (timeLeft / 15)) * 1.5 }}
        />
      )}
      
      {/* HUD */}
      <div className="w-full max-w-md flex justify-between items-start px-8 py-10 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mb-1">XP ACUMULADO</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-black text-medical-primary text-glow tracking-tighter">
              {state.context.score}
            </span>
            {state.context.multiplier > 1 && (
              <motion.span 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-[10px] font-black text-medical-secondary bg-medical-secondary/10 px-2 py-0.5 rounded-full border border-medical-secondary/20 uppercase"
              >
                x{state.context.multiplier.toFixed(1)}
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="h-12 w-12 glass-panel !rounded-2xl flex items-center justify-center font-black text-sm border-white/20 shadow-lg scale-110">
            R1
          </div>
          {state.context.combo > 1 && (
            <motion.div
              key={state.context.combo}
              initial={{ scale: 0.5, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="flex flex-col items-end"
            >
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">STREAK</span>
              <span className="text-2xl font-display font-black text-medical-primary italic drop-shadow-[0_0_10px_rgba(13,148,136,0.5)]">
                {state.context.combo}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Timer Bar */}
      {state.matches('triage') && currentCase && (
        <div className="w-full max-w-sm px-8 -mt-2 mb-4 z-50">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner flex mb-1">
            <motion.div 
              className={`h-full ${timeLeft <= 10 ? 'bg-medical-danger flex-grow h-full' : 'bg-medical-secondary flex-grow h-full'}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / currentCase.patient_intro.time_limit_sec) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              style={{ originX: 0 }}
            />
          </div>
          <div className="flex justify-between w-full">
            <span className={`text-[10px] uppercase font-black tracking-widest ${timeLeft <= 10 ? 'text-medical-danger animate-pulse' : 'text-slate-500'}`}>
              TIEMPO DE RESPUESTA
            </span>
            <span className="text-[10px] text-white/80 font-mono font-black">{timeLeft}s</span>
          </div>
        </div>
      )}

      {/* Mentor Feedback Area */}
      <div className="w-full h-40 flex justify-center -mt-8 pointer-events-none">
        <ErrorBoundary fallback={<div className="h-40 flex items-center justify-center text-red-400 font-bold bg-red-400/10 rounded-xl border border-red-400/20 px-8">Error en Feedback del Mentor</div>}>
          <AvatarFeedback 
            doctor={currentCase?.case_id.toLowerCase().includes('ped') ? 'castillo' : (currentCase?.case_id.toLowerCase().includes('surg') ? 'mendoza' : 'navarro')} 
            expression={expression} 
            dialogueText={comment}
            isVisible={!state.matches('idle') || showIntro}
          />
        </ErrorBoundary>
      </div>

      {/* Content */}
      <div className="w-full flex-grow flex items-center justify-center">
        {renderCurrentView()}
      </div>

      {/* Footer */}
      {!state.matches('boss_fight') && (
        <div className="w-full max-w-md text-center opacity-30 py-8">
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase">
            HGC ARCHIVE · Dr. Swipe v3
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
