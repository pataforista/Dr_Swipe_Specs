import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause } from 'lucide-react';

interface TelemetryHUDProps {
  timeLeft: number;
  state: string;
  score: number;
  combo: number;
  vitality: number;
  /** Interns left in the shift (fail_protection spends one per incident). */
  lives: number;
  maxLives?: number;
  coins: number;
  /** Loot-box shield charges left (mistakes that cost no vitality). */
  shield?: number;
  lastVitals: { ta?: string; fc?: number; temp?: number; status: string } | null;
  onPause?: () => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = React.memo(({
  timeLeft, state, score, combo, vitality, lives, maxLives = 5, coins, shield = 0, lastVitals, onPause
}) => {
  // A vitality drop should read as a hit, not just a number changing — flash
  // the bar red for a beat instead of just easing the width down (F2).
  const prevVitalityRef = React.useRef(vitality);
  const [tookDamage, setTookDamage] = React.useState(false);
  React.useEffect(() => {
    if (vitality < prevVitalityRef.current) {
      setTookDamage(true);
      const t = setTimeout(() => setTookDamage(false), 400);
      prevVitalityRef.current = vitality;
      return () => clearTimeout(t);
    }
    prevVitalityRef.current = vitality;
  }, [vitality]);

  if (state !== 'triage' && state !== 'boss_fight') return null;

  // In normal flow (not `fixed`): `.paper-sheet` sets position: relative
  // outside Tailwind's layer, which silently overrode `fixed` and let the flex
  // column squeeze the HUD until its second row was clipped by overflow-hidden.
  // In flow, the deck below simply gets the remaining height.
  return (
    <div className="relative z-hud w-full max-w-md flex-shrink-0 px-2 sm:px-4 pt-1 sm:pt-2 flex flex-col gap-1.5">
      <div className="paper-sheet !overflow-visible shadow-md border-2 border-white/50 bg-white/70 backdrop-blur-md rounded-2xl px-3 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black tracking-widest text-primary uppercase leading-none lettering">Puntaje</span>
          <motion.span
            key={score}
            animate={{ scale: [1, 1.1, 1] }}
            className="text-lg font-bold text-slate-700 leading-none lettering tabular-nums"
          >
            {score}
          </motion.span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black tracking-widest text-secondary uppercase leading-none lettering">Créditos 🪙</span>
          <motion.span
            key={coins}
            animate={{ scale: [1, 1.2, 1] }}
            className="text-lg font-bold text-slate-700 leading-none lettering tabular-nums"
          >
            {coins}
          </motion.span>
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-[64px] max-w-[110px]">
          <span className="text-[10px] font-black tracking-widest text-primary uppercase leading-none lettering">Salud Px</span>
          <div className={`h-2 w-full bg-slate-100 rounded-full overflow-hidden border shadow-inner transition-colors ${
            tookDamage ? 'border-rose-400 ring-2 ring-rose-300/60' : 'border-slate-200'
          }`}>
            <motion.div
              animate={{
                width: `${vitality}%`,
                backgroundColor: vitality > 60 ? '#10B981' : vitality > 30 ? '#F59E0B' : '#F43F5E',
              }}
              className="h-full transition-all duration-500"
            />
          </div>
        </div>
        {state !== 'boss_fight' && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase leading-none lettering">Tiempo</span>
              <span
                className={`text-lg font-bold leading-none lettering tabular-nums ${
                  timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-slate-600'
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <button
              onClick={onPause}
              className="w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-rose-50 border border-slate-200 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              aria-label="Pausar juego"
            >
              <Pause className="w-4 h-4" fill="currentColor" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="basis-full flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
          <div className="flex items-center gap-2" aria-label={`${lives} de ${maxLives} internos disponibles`}>
            <span className="text-[10px] font-black tracking-widest text-rose-400 uppercase leading-none lettering">Internos</span>
            <div className="flex gap-px text-sm leading-none" aria-hidden="true">
              {Array.from({ length: maxLives }, (_, i) => (
                <motion.span
                  key={i}
                  animate={i < lives ? { opacity: 1, scale: 1 } : { opacity: 0.2, scale: 0.8 }}
                  className={i < lives ? '' : 'grayscale'}
                >
                  🩺
                </motion.span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shield > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-700 border border-sky-200" title="Escudo: errores sin daño">
                🛡️ ×{shield}
              </span>
            )}
            <AnimatePresence>
              {combo > 1 && (() => {
                // The pill escalates by tier instead of staying static — a combo
                // of 20 should look and feel different from a combo of 2 (F3).
                const tier = combo >= 12 ? 'rose' : combo >= 5 ? 'amber' : 'slate';
                const tierClass = {
                  slate: 'bg-slate-100 text-slate-600 border-slate-200',
                  amber: 'bg-amber-100 text-amber-700 border-amber-200',
                  rose: 'bg-rose-100 text-rose-600 border-rose-300',
                }[tier];
                const scale = tier === 'rose' ? 1.2 : tier === 'amber' ? 1.1 : 1;
                return (
                  <motion.div
                    key={tier}
                    initial={{ scale: 0, rotate: 10 }}
                    animate={{ scale, rotate: -3 }}
                    exit={{ scale: 0 }}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-widest shadow-sm border lettering ${tierClass}`}
                  >
                    x{combo} ✨
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <VitalsMonitor vitals={lastVitals} />
    </div>
  );
}, (prevProps, nextProps) => {
  const v1 = prevProps.lastVitals;
  const v2 = nextProps.lastVitals;
  const vitalsEqual = (!v1 && !v2) || (
    !!v1 && !!v2 &&
    v1.ta === v2.ta &&
    v1.fc === v2.fc &&
    v1.temp === v2.temp &&
    v1.status === v2.status
  );
  return (
    prevProps.timeLeft === nextProps.timeLeft &&
    prevProps.state === nextProps.state &&
    prevProps.score === nextProps.score &&
    prevProps.combo === nextProps.combo &&
    prevProps.vitality === nextProps.vitality &&
    prevProps.lives === nextProps.lives &&
    prevProps.shield === nextProps.shield &&
    prevProps.coins === nextProps.coins &&
    vitalsEqual
  );
});

const Reading: React.FC<{ label: string; value: string; unit?: string; color: string }> = ({ label, value, unit, color }) => (
  <span className="flex items-baseline gap-1 whitespace-nowrap">
    <span className="text-[10px] font-bold text-slate-400">{label}</span>
    <span className={`text-xs font-black tabular-nums ${color}`}>{value}{unit && <span className="text-[10px] opacity-60 ml-0.5">{unit}</span>}</span>
  </span>
);

// Fixed-height strip: values appear and disappear without moving the deck.
const VitalsMonitor: React.FC<{ vitals: TelemetryHUDProps['lastVitals'] }> = ({ vitals }) => {
  const shell = 'paper-sheet !overflow-hidden bg-white/80 backdrop-blur-md rounded-xl border-2 border-white/60 shadow-sm h-9 px-3 flex items-center gap-3';
  if (!vitals) return (
    <div className={`${shell} text-slate-400`}>
      <span className="text-[10px] font-black uppercase tracking-widest">Telemetría</span>
      <div className="flex-1 h-1.5 bg-slate-200/70 rounded-full" />
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-rose-500';
      case 'alert': return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  };
  const dotColor = vitals.status === 'critical' ? 'bg-rose-500' : vitals.status === 'alert' ? 'bg-amber-500' : 'bg-emerald-500';
  const color = getStatusColor(vitals.status);
  return (
    <div className={shell}>
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 lettering">
        <span className={`w-1.5 h-1.5 ${dotColor} rounded-full animate-pulse`} />
        <span className={color}>{vitals.status === 'normal' ? 'Estable' : vitals.status === 'alert' ? 'Riesgo' : 'CRÍTICO'}</span>
      </span>
      {vitals.ta && <Reading color={color} label="TA" value={vitals.ta} />}
      {vitals.fc && <Reading color={color} label="FC" value={String(vitals.fc)} unit="lpm" />}
      {vitals.temp && <Reading color={color} label="T°" value={String(vitals.temp)} unit="°C" />}
      {/* A sliding flat line reads as asystole; draw an actual beat whose
          pace follows the patient's status. */}
      <div className="flex-1 min-w-[28px] h-5 bg-slate-100 rounded-md overflow-hidden border border-slate-200/60">
        <motion.svg
          viewBox="0 0 120 20"
          preserveAspectRatio="none"
          className="h-full w-[200%]"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: vitals.status === 'critical' ? 0.7 : vitals.status === 'alert' ? 1.1 : 1.6, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        >
          <polyline
            fill="none"
            strokeWidth="1.5"
            className={vitals.status === 'critical' ? 'stroke-rose-400' : vitals.status === 'alert' ? 'stroke-amber-400' : 'stroke-emerald-400'}
            points="0,12 14,12 18,10 22,12 26,12 28,15 31,2 34,17 37,12 46,12 50,9 54,12 60,12 74,12 78,10 82,12 86,12 88,15 91,2 94,17 97,12 106,12 110,9 114,12 120,12"
          />
        </motion.svg>
      </div>
    </div>
  );
};
