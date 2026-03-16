import React, { useEffect, useState, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { SwipeDeck } from './components/SwipeDeck/SwipeDeck';
import { AvatarFeedback } from './components/AvatarFeedback/AvatarFeedback';
import { ShockRoom } from './components/ShockRoom/ShockRoom';
import { GachaReveal } from './components/GachaReveal/GachaReveal';
import { CodexView } from './components/CodexView/CodexView';
import { gameMachine } from './machines/gameMachine';
import { DoctorName, FaceExpression } from './types/avatars';
import { useCodexStore } from './store/useCodexStore';
import { useProceduralLore } from './hooks/useProceduralLore';
import './App.css';

// Blueprint temporal para demostración del lore
const APPENDICITIS_BLUEPRINT = {
  signals: [
    { trigger: 'leucocitosis', range: { min: 12, max: 18, unit: 'mil' }, category: 'LABS', critical: true },
    { trigger: 'fiebre', range: { min: 38, max: 39.5, unit: '°C' }, category: 'VITALES' }
  ],
  triad: [
    { type: 'diagnosis', question: "¿Cuál es el ritual de diagnóstico?", options: ["Apendicitis Aguda", "Infiltración del Inquilino", "Gastroenteritis"], correct_index: 0 },
    { type: 'study', question: "¿Qué herramienta ancla la verdad?", options: ["TAC Abdominal", "Fé ciega", "Ultrasonido"], correct_index: 0 },
    { type: 'treatment', question: "¿Cómo se destierra la patología?", options: ["Apendicectomía", "Exorcismo", "Antibióticos"], correct_index: 0 }
  ],
  perla: {
    id: 'perla_appendicitis',
    title: 'Anclaje Quirúrgico: Apendicitis',
    text: 'El diagnóstico es CLÍNICO. Descartar la basura del Inquilino y confiar en McBurney salva almas.',
    category: 'Cirugía',
    gpc_ref: 'GPC-005-08',
    rarity: 'legendary'
  }
};

function App() {
  const [state, send] = useMachine(gameMachine);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Lore-ready: darker start
  const [currentView, setCurrentView] = useState<'game' | 'codex'>('game');
  
  const addPearl = useCodexStore((state) => state.addPearl);
  const unlockedCount = useCodexStore((state) => state.unlockedPearls.length);
  const { generateDynamicCase } = useProceduralLore();

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const getAvatarState = (): { doctor: DoctorName; expression: FaceExpression; text: string | null } => {
    if (state.matches('ghosted')) {
      return { 
        doctor: 'navarro', 
        expression: 'angry', 
        text: "Dudaste. Perdimos su ancla vital. Declara la hora de muerte y sal del cubículo... ahora." 
      };
    }
    if (state.matches('boss_fight')) {
      return { 
        doctor: 'navarro', 
        expression: 'focus', 
        text: "¡Cama 4 se nos va! ¡Dime la guía exacta o esta cama se lo traga para siempre! ¡15 segundos!" 
      };
    }
    if (state.matches('reward')) {
        return {
            doctor: 'castillo',
            expression: 'approval',
            text: "Impecable. Tu rigor científico cortó el caos de tajo y lo ancló a este lado. Toma este fragmento de la GPC."
        };
    }
    if (state.matches('results')) {
      return { 
        doctor: 'castillo', 
        expression: 'approval', 
        text: "Realidad estabilizada. Paciente anclado." 
      };
    }
    if (state.matches('swiping')) {
      const isR1Losing = state.context.stats.correct < state.context.currentIndex / 2;
      return {
        doctor: 'mendoza',
        expression: isR1Losing ? 'disappointed' : 'focus',
        text: isR1Losing 
          ? "Llenaste el expediente de sombras, R1. Te distrajiste con los susurros. Limpia tu mente o este hospital te va a devorar."
          : "El Archivista te vigila. No guardes basura."
      };
    }
    return { doctor: 'mendoza', expression: 'idle', text: null };
  };

  const avatar = getAvatarState();

  // Inicio de la guardia del lore
  useEffect(() => {
    const loreCase = generateDynamicCase(APPENDICITIS_BLUEPRINT, 0.5);
    send({ type: 'START_CASE', caseData: loreCase });
  }, [send]);

  const handleCollectPearl = () => {
    if (state.context.latestPerla) {
      addPearl(state.context.latestPerla);
      send({ type: 'COLLECTED' });
    }
  };

  return (
    <div className={`view-container ${theme === 'dark' ? 'noise-bg' : ''}`}>
      <header className="app-header">
        <div className="header-meta">
          <span className="rank-badge">GPC-GUARD</span>
          <div className="header-actions">
            <button 
              className="view-toggle"
              onClick={() => setCurrentView(v => v === 'game' ? 'codex' : 'game')}
            >
              {currentView === 'game' ? 'CÓDICE' : 'GUARDIA'}
            </button>
            <button 
              className="theme-toggle" 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
        
        {currentView === 'game' && state.context.currentCase && (
          <div className="patient-summary">
            <h2 className="text-xl font-bold tracking-tighter">
              {state.context.currentCase.patient_intro.name}, {state.context.currentCase.patient_intro.age}a
            </h2>
            <p className="italic text-sm opacity-80">{state.context.currentCase.patient_intro.arrival_scenario}</p>
          </div>
        )}
      </header>

      <main className="game-area">
        {currentView === 'codex' ? (
          <CodexView totalPearlsInGame={24} />
        ) : (
          <>
            {state.matches('swiping') && state.context.currentCase && (
              <SwipeDeck 
                cards={state.context.currentCase.card_stream}
                currentIndex={state.context.currentIndex}
                onSwipe={(dir) => send({ type: 'SWIPE', direction: dir })}
              />
            )}

            {state.matches('ghosted') && (
              <div className="ghosted-view group">
                <h1 className="text-6xl font-black text-red-700 animate-pulse tracking-widest">
                  GHOSTED
                </h1>
                <p className="lethal-reason border-l-4 border-red-500 pl-4 my-4 font-mono">
                  {state.context.stats.lethalError}
                </p>
                <button className="btn-retry uppercase tracking-tighter" onClick={() => send({ type: 'RESTART' })}>
                  Reiniciar Ritual
                </button>
              </div>
            )}

            {state.matches('boss_fight') && state.context.currentCase && (
              <ShockRoom 
                questions={state.context.currentCase.final_triad}
                dossierItems={state.context.keptItems.map(i => i.card_text)}
                onSurvive={() => send({ type: 'SURVIVE' })}
                onGhosted={(reason) => send({ type: 'GHOST', reason })}
              />
            )}

            {state.matches('results') && (
                <div className="results-view p-8 text-center bg-white dark:bg-black rounded-3xl shadow-2xl">
                    <h1 className="text-4xl font-black text-emerald-900 dark:text-red-600 mb-4">GUARDIA TERMINADA</h1>
                    <p className="text-emerald-700 dark:text-gray-400 mb-8">Has salvado al paciente con éxito.</p>
                    {state.context.currentCase?.perla_enarm && (
                      <button 
                        className="btn-reward" 
                        onClick={() => send({ type: 'CLAIM_REWARD', perla: state.context.currentCase!.perla_enarm! })}
                      >
                        Recuperar Residuo de Conocimiento
                      </button>
                    )}
                </div>
            )}

            {state.matches('reward') && state.context.latestPerla && (
                <GachaReveal 
                  perla={state.context.latestPerla} 
                  onComplete={handleCollectPearl}
                />
            )}
          </>
        )}

        {currentView === 'game' && (
          <AvatarFeedback 
            doctor={avatar.doctor}
            expression={avatar.expression}
            dialogueText={avatar.text}
            isVisible={true}
          />
        )}
      </main>

      {currentView === 'game' && (
        <footer className="game-footer">
          <div className="stats-bar">
            <div className="stat-pill">
              <span className="label">Aciertos:</span>
              <span className="value">{state.context.stats.correct}</span>
            </div>
            <div className="stat-pill">
              <span className="label">Restante:</span>
              <span className="value">
                {state.context.currentCase 
                  ? state.context.currentCase.card_stream.length - state.context.currentIndex 
                  : 0}
              </span>
            </div>
            <div className="stat-pill">
              <span className="label">Códice:</span>
              <span className="value">{unlockedCount}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
