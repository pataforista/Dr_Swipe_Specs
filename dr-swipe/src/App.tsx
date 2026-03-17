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
import Aurora from './components/bits/Aurora';
import DecryptedText from './components/bits/DecryptedText';
import ShinyText from './components/bits/ShinyText';

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
        im: '59, 130, 246'
      };
      const key = Object.keys(colors).find(k => currentCase.case_id.toLowerCase().includes(k)) || 'default';
      const rgb = colors[key] || '13, 148, 136';
      document.documentElement.style.setProperty('--specialty-rgb', rgb);
    }
  }, [currentCase]);

  const [showIntro, setShowIntro] = useState(false);
  const [expression, setExpression] = useState<'neutral' | 'happy' | 'angry' | 'shocked'>('neutral');
  const [comment, setComment] = useState<string | null>(null);

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

    const isCorrect = (direction === 'right' && card.expected_action === 'keep') || 
                      (direction === 'left' && card.expected_action === 'discard');
    
    setExpression(isCorrect ? 'happy' : 'angry');
    setComment(card.scoring.vazquez_comment.split(':')[1]?.trim() || card.scoring.vazquez_comment);

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
            <DecryptedText text={currentCase.patient_intro.name} animateOn="view" speed={80} />
          </h2>
          
          <div className="w-12 h-1 bg-medical-primary/30 mx-auto mb-8 rounded-full" />
          
          <p className="text-lg text-slate-300 leading-relaxed mb-10 italic font-medium px-4">
            <DecryptedText text={currentCase.patient_intro.arrival_scenario} animateOn="view" speed={40} maxIterations={5} />
          </p>
          
          <button 
            onClick={() => {
              setShowIntro(false);
              send({ type: 'START_GUARD', deck: currentCase.card_stream });
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
        return currentCase ? (
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
        ) : null;

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
              onClick={() => send({ type: 'RESTART' })} 
              className="text-xs font-black tracking-[0.5em] text-slate-500 hover:text-white transition-colors uppercase border-b border-slate-800 pb-1"
            >
              Cerrar Expediente
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#070b14] flex flex-col items-center safe-top safe-bottom select-none overflow-hidden text-slate-100">
      <Aurora speed={0.5} />
      
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

      {/* Mentor Feedback Area */}
      <div className="w-full h-40 flex justify-center -mt-8 pointer-events-none">
        <AvatarFeedback 
          doctor={currentCase?.case_id.toLowerCase().includes('ped') ? 'castillo' : (currentCase?.case_id.toLowerCase().includes('surg') ? 'mendoza' : 'navarro')} 
          expression={expression} 
          dialogueText={comment}
          isVisible={!state.matches('idle') || showIntro}
        />
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
