import { motion, AnimatePresence } from 'framer-motion';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { SwipeDeck } from './components/SwipeDeck';
import { AvatarFeedback } from './components/AvatarFeedback';
import { ShockRoom } from './components/ShockRoom';
import { useState, useEffect } from 'react';
import type { ClinicalCase } from './types/game';
import { dataLoader } from './utils/dataLoader';
import { useGameAudio } from './hooks/useGameAudio';
import { cleanVazquezComment } from './utils/formatters';
import { triggerHaptic } from './utils/hapticFeedback';
import { calculateCardScore } from './utils/scoringEngine';
import DecryptedText from './components/bits/DecryptedText';
import ShinyText from './components/bits/ShinyText';
import ErrorBoundary from './components/ErrorBoundary';

const isSwipeCorrect = (direction: 'left' | 'right', expectedAction: 'keep' | 'discard'): boolean => {
  return (direction === 'right' && expectedAction === 'keep') ||
         (direction === 'left' && expectedAction === 'discard');
};

const AutoSkipBossFight: React.FC<{ send: any; stopAlarm: () => void }> = ({ send, stopAlarm }) => {
  useEffect(() => {
    stopAlarm();
    send({ type: 'ANSWER_CORRECT' });
  }, [send, stopAlarm]);
  return null;
};

const VazquezInterruption: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-[120] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-panel p-8 max-w-sm border-medical-danger/40 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)]"
      >
        <div className="w-20 h-20 flex items-center justify-center text-5xl mx-auto mb-4 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          👴
        </div>
        <h3 className="text-xl font-display font-black text-white mb-3 tracking-tight">
          "Así que... ¿racha de aciertos?"
        </h3>
        <p className="text-sm text-slate-300 italic font-medium mb-4">
          Déjame complicarte un poco las cosas, doctorcillo.
        </p>
        <div className="h-0.5 w-16 bg-medical-danger/40 mx-auto" />
      </motion.div>
    </div>
  );
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
    <div className="fixed left-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 pointer-events-none z-50 glass-panel p-6 border-white/10 shadow-2xl bg-slate-900/60 backdrop-blur-md rounded-3xl">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-2">
        <div className="w-3 h-3 bg-medical-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
        <span className="text-xs font-black tracking-widest text-medical-primary uppercase">MONITOR DE PACIENTE</span>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Presión Arterial</span>
        <div className="text-lg text-slate-200 font-mono font-black">120/80 <span className="text-[10px] text-slate-500">mmHg</span></div>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saturación O2</span>
        <div className="text-lg text-slate-200 font-mono font-black">98% <span className="text-[10px] text-medical-primary">(ESTABLE)</span></div>
      </div>

      <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frecuencia Cardíaca</span>
        <div className="flex items-end gap-1 h-8 opacity-80">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [10, 25, 15, 20, 12] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              className="w-1.5 bg-medical-primary/50 rounded-full"
            />
          ))}
        </div>
        <span className="text-3xl font-black text-medical-primary font-mono mt-1">{pulse} <small className="text-xs text-medical-primary/70 mb-1 inline-block">LPM</small></span>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiempo de Reacción</span>
        <div className="text-xl text-slate-100 font-mono font-black">{timeLeft} <span className="text-[10px] text-slate-500">SEG</span></div>
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
  const [swipeFeedback, setSwipeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  // Time Tense Haptics (Variance)
  useEffect(() => {
    if (!state.matches('triage')) return;
    if (timeLeft === 10 || timeLeft === 5 || timeLeft === 3) {
      triggerHaptic('warning');
    }
  }, [timeLeft, state]);

  useEffect(() => {
    let timer: number;
    if (state.matches('triage') && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (state.matches('triage') && timeLeft === 0) {
      triggerHaptic('timeoutAlarm');
      send({ type: 'TIME_OUT' });
    }
    return () => clearInterval(timer);
  }, [state, timeLeft, send]);

  useEffect(() => {
    if (state.matches('triage') && !state.context.isUrgent) {
      const timer = window.setInterval(() => {
        if (Math.random() < 0.15) { // 15% chance every 15s
          send({ type: 'TRIGGER_URGENCY' });
        }
      }, 15000);
      return () => clearInterval(timer);
    }
  }, [state, send]);

  // QTE Timer countdown
  useEffect(() => {
    if (!state.matches('boss_fight') || !state.context.qteActive) return;

    const timer = window.setInterval(() => {
      send({ type: 'QTE_TIMER_TICK' });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, send]);

  useEffect(() => {
    const isLethal = state.matches('ghosted') || state.matches('debrief');
    if (isLethal) {
      triggerHaptic('lethalError');
    }
  }, [state]);

  const startNewCase = async (skipIntro = false) => {
    try {
      send({ type: 'RESTART' }); // Reset machine to idle
      const caseData = await dataLoader.loadRandomCase();
      setCurrentCase(caseData);
      
      if (skipIntro) {
        setShowIntro(false);
        // Adaptive Learning Curve: Time per card decreases as streak increases
        let timePerCard = 15; // R1
        if (state.context.caseStreak >= 6) timePerCard = 8; // Adscrito
        else if (state.context.caseStreak >= 3) timePerCard = 12; // R2/R3

        const timeLimit = Math.max(60, Math.min(180, caseData.card_stream.length * timePerCard));
        setTimeLeft(timeLimit);
        
        // Shuffle logic
        const fullDeck = [...caseData.card_stream];
        const vitals = fullDeck.shift();
        const shuffledCards = vitals 
          ? [vitals, ...fullDeck.sort(() => Math.random() - 0.5)]
          : fullDeck.sort(() => Math.random() - 0.5);

        send({ 
          type: 'START_GUARD', 
          deck: shuffledCards,
          difficulty: caseData.difficulty || 'standard',
          pearl: (caseData.enarm_pearl || caseData.perla_enarm) as any
        });
      } else {
        setShowIntro(true);
      }
    } catch (err) {
      console.error(err);
      alert("Error al cargar caso.");
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const card = state.context.deck[state.context.currentCardIndex];
    if (!card) return;

    const isCorrect = isSwipeCorrect(direction, card.expected_action);
    
    setSwipeFeedback(isCorrect ? 'correct' : 'wrong');
    setExpression(isCorrect ? 'happy' : 'angry');
    const rawComment = card.scoring.vazquez_comment;
    const cleanComment = cleanVazquezComment(rawComment, isCorrect);
    const feedbackIcon = isCorrect ? "✅ " : "❌ ";
    setComment(cleanComment ? feedbackIcon + cleanComment : null);

    send({ type: 'SWIPE', direction });

    setTimeout(() => {
      setExpression('neutral');
      setComment(null);
      setSwipeFeedback(null);
      send({ type: 'CLEAR_VISUALS' });
    }, 1500); // Faster feedback loop (1.5s)
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
              if (!currentCase) return;
              setShowIntro(false);
              // Dynamic Time Buff: 12s per card (min 60s, max 150s)
              const timeLimit = Math.max(60, Math.min(150, currentCase.card_stream.length * 12));
              setTimeLeft(timeLimit);
              
              // Quick Round Shuffling: Randomize all cards except initial vitals
              const fullDeck = [...currentCase.card_stream];
              const vitals = fullDeck.shift();
              const shuffledCards = vitals 
                ? [vitals, ...fullDeck.sort(() => Math.random() - 0.5)]
                : fullDeck.sort(() => Math.random() - 0.5);

              send({ 
                type: 'START_GUARD', 
                deck: shuffledCards,
                difficulty: currentCase.difficulty || 'standard',
                pearl: (currentCase.enarm_pearl || currentCase.perla_enarm) as any
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
            <button onClick={() => startNewCase(false)} className="btn-primary px-16 py-6 text-xl">
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
          return (
            <div className="telemetry-panel w-full max-w-xl h-full flex flex-col items-center justify-center gap-8 relative overflow-hidden bg-black/40">
              {/* Background ECG pulse effect */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <motion.path
                    d="M 0 50 L 20 50 L 25 30 L 30 70 L 35 50 L 50 50"
                    fill="transparent"
                    stroke="#dc2626"
                    strokeWidth="2"
                    initial={{ pathLength: 0, x: -100 }}
                    animate={{ pathLength: 1, x: 200 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                </svg>
              </div>

              <div className="text-center z-10">
                <h2 className="text-2xl font-black text-white italic tracking-tighter animate-pulse mb-1">PROTOCOLO DE ESTABILIZACIÓN</h2>
                <div className="h-0.5 w-32 bg-medical-danger mx-auto mb-4" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] px-4">Pulsa rítmicamente para mantener el gasto cardíaco</p>
              </div>

              {/* Stabilization Heart/Core */}
              <div className="relative group p-8">
                <div className="absolute inset-0 bg-medical-danger/20 blur-3xl rounded-full animate-pulse group-hover:opacity-40 transition-opacity" />
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="w-40 h-40 rounded-full border-2 border-medical-danger/40 flex items-center justify-center relative z-10 cursor-pointer active:scale-95 transition-transform bg-black/20"
                  onClick={() => {
                    triggerHaptic('qteInteract');
                    send({ type: 'QTE_INTERACT' });
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">❤️</span>
                    <span className="text-[8px] font-black text-medical-danger mt-4 animate-bounce">PULSAR</span>
                  </div>
                </motion.div>
              </div>

              {/* QTE Timer */}
              <div className="w-full max-w-xs space-y-2 text-center mt-4">
                <div className="text-2xl font-black text-medical-danger font-mono mb-3">
                  {state.context.qteTimeLeft}s
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    animate={{ width: [`${(state.context.qteTimeLeft / 5) * 100}%`] }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-medical-danger shadow-[0_0_10px_#dc2626]"
                  />
                </div>
                <p className="text-[9px] font-black text-white/30 italic tracking-widest uppercase">Mantén el ritmo cardíaco...</p>
              </div>
            </div>
          );
        }
        return (
          <ShockRoom 
            questions={currentCase!.boss_fight_triad!.questions}
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
              <span className="text-4xl text-glow-medical">🏆</span>
            </div>
            
            {state.context.caseStreak > 1 && (
              <motion.div 
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-4 inline-block bg-medical-secondary/20 text-medical-secondary px-4 py-1 rounded-full text-[10px] font-black tracking-widest border border-medical-secondary/30"
              >
                STREAK DE CASOS: x{state.context.caseStreak}
              </motion.div>
            )}

            <h2 className="text-3xl font-display font-black text-medical-primary mb-4 tracking-tighter uppercase">MÉRITO ALCANZADO</h2>
            <p className="text-slate-400 mb-8 font-medium italic">"Se ha estabilizado la situación clínica con precisión empírica."</p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => startNewCase(true)} // Skip Intro for Rapid Play
                className="btn-primary w-full py-5 !bg-medical-primary hover:!bg-teal-600 group"
              >
                <div className="flex items-center justify-center gap-2">
                  <ShinyText text="SIGUIENTE CASO" speed={3} />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </button>
              <button 
                onClick={() => send({ type: 'CLAIM' })} 
                className="text-[10px] font-black tracking-[0.4em] text-slate-500 hover:text-white transition-colors uppercase"
              >
                Registrar y Salir
              </button>
            </div>
          </motion.div>
        );

      case state.matches('critical_warning'):
        return (
          <div className="fixed inset-0 bg-red-600/20 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-pulse">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-5xl font-display font-black text-white text-glow-danger uppercase tracking-tighter">ADVERTENCIA CRÍTICA</h2>
            <p className="text-lg text-white/80 mt-4 px-12 text-center font-bold italic">
              {state.context.fatalError}
            </p>
            <p className="mt-8 text-[10px] text-white/40 tracking-[0.5em] font-black uppercase">REINTENTANDO ESTABILIZACIÓN...</p>
          </div>
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
    <div className={`fixed inset-0 bg-[#070b14] flex flex-col items-center safe-top safe-bottom select-none overflow-hidden text-slate-100 crt-screen 
      ${timeLeft <= 10 && state.matches('triage') ? 'destabilized-content' : ''} 
      ${swipeFeedback === 'wrong' ? 'shake-lite' : ''}
      ${state.context.combo >= 15 ? 'combo-glow-3' : (state.context.combo >= 10 ? 'combo-glow-2' : (state.context.combo >= 5 ? 'combo-glow-1' : ''))}
      ${state.context.showBloodVignette ? 'blood-vignette' : ''}
    `}>
      {/* Glitch Overlay (Urgency) */}
      {state.context.isUrgent && <div className="fixed inset-0 z-[100] glitch-overlay pointer-events-none" />}

      <TelemetryHUD timeLeft={timeLeft} state={state.value as string} />

      {/* Lethal Error Red Flash */}
      <AnimatePresence>
        {state.context.showBloodVignette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.5, 0.3, 0.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 bg-medical-danger pointer-events-none z-[110]"
          />
        )}
      </AnimatePresence>

      {/* Vazquez Interruption */}
      <AnimatePresence>
        {state.context.interruptionActive && (
          <VazquezInterruption onDismiss={() => send({ type: 'RESOLVE_INTERRUPTION' })} />
        )}
      </AnimatePresence>

      {/* Swipe Feedback Flash - Short burst */}
      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-0 pointer-events-none ${swipeFeedback === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}
          />
        )}
      </AnimatePresence>

      {/* Swipe Status Label - Subtle and brief */}
      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex flex-col items-center gap-2"
          >
            <span className={`text-3xl font-display font-black uppercase tracking-[0.1em] ${swipeFeedback === 'correct' ? 'text-green-300' : 'text-red-300'} drop-shadow-lg`}>
              {swipeFeedback === 'correct' ? 'CORRECTO' : 'FALLO'}
            </span>
            {swipeFeedback === 'correct' && (Date.now() - state.context.lastCardPresentedAt < 1200) && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                className="perfect-swipe-text"
              >
                ⚡ ¡PERFECTO! +20% ⚡
              </motion.span>
            )}
            {state.context.showEureka && (
              <motion.span 
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: [0, 1.5, 1], rotate: 0 }}
                className="text-yellow-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] mt-2"
              >
                💡 COMBO DE CLARIDAD x2 💡
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Red-Out Vignette Effect - Reduced intensity */}
      {timeLeft <= 15 && state.matches('triage') && (
        <div
          className="red-out-overlay fixed inset-0"
          style={{ opacity: (1 - (timeLeft / 15)) * 0.8 }}
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
            {state.context.caseStreak >= 6 ? 'ADSC' : (state.context.caseStreak >= 4 ? 'R3' : (state.context.caseStreak >= 2 ? 'R2' : 'R1'))}
          </div>
          {state.context.combo > 1 && (
            <motion.div
              key={state.context.combo}
              initial={{ scale: 0.5, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
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
            doctor={currentCase ? (currentCase.case_id.toLowerCase().includes('ped') ? 'castillo' : (currentCase.case_id.toLowerCase().includes('surg') ? 'mendoza' : 'navarro')) : 'navarro'} 
            expression={expression} 
            dialogueText={comment}
            isVisible={!state.matches('idle') || showIntro}
          />
        </ErrorBoundary>
      </div>

      {/* Tactical Dossier (Dossier Médico) */}
      {!state.matches('idle') && (
        <div className="fixed right-4 top-1/4 bottom-1/4 w-32 hidden lg:flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar pointer-events-none opacity-60 hover:opacity-100 transition-opacity z-10">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">Dossier</span>
          <AnimatePresence>
            {state.context.dossier.map((card, idx) => (
              <motion.div 
                key={`${card.card_id}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 rounded bg-slate-900/40 border border-slate-800/50 text-[9px] flex flex-col gap-1 ${state.context.showEureka && idx >= state.context.dossier.length - 3 ? 'eureka-glow ring-1 ring-yellow-400/50' : ''}`}
              >
                <span className="text-slate-400 font-bold">{card.category}</span>
                <span className="text-slate-200 line-clamp-2">{card.card_text}</span>
              </motion.div>
            )).reverse()}
          </AnimatePresence>
        </div>
      )}

      {/* Content Area */}
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
