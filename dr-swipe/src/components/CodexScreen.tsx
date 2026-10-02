import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCodexStore } from '../store/useCodexStore';
import { ACHIEVEMENTS, buildAchievementSnapshot } from '../utils/achievementsEngine';
import { getSpecialtyStats } from '../utils/codexStats';
import { pickDialog, MENTOR_NAMES, MENTOR_ICONS } from '../utils/dialogEngine';

interface CodexScreenProps {
  onClose: () => void;
}

type Tab = 'logros' | 'perlas' | 'especialidades';

export const CodexScreen: React.FC<CodexScreenProps> = ({ onClose }) => {
  const { stats, unlockedPearls = [], achievements = {}, counters, caseProgress, dailyStreak, favors } = useCodexStore();
  const [tab, setTab] = useState<Tab>('logros');
  const greeting = useMemo(() => pickDialog('codex'), []);

  const current = buildAchievementSnapshot({
    stats, counters, dailyStreak, pearlCount: unlockedPearls.length, caseProgress, favors,
  });
  const unlockedCount = ACHIEVEMENTS.filter(a => a.id in achievements).length;
  const [openedAt] = useState(() => Date.now());
  const specialties = useMemo(() => getSpecialtyStats(caseProgress, openedAt), [caseProgress, openedAt]);

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'logros', label: 'Logros 🏆', badge: `${unlockedCount}/${ACHIEVEMENTS.length}` },
    { id: 'perlas', label: 'Perlas 🌟', badge: unlockedPearls.length > 0 ? String(unlockedPearls.length) : undefined },
    { id: 'especialidades', label: 'Materias 📚' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 40 }}
      className="paper-sheet p-5 sm:p-8 max-w-md w-full text-left shadow-2xl relative overflow-hidden bg-white mx-4 max-h-[92vh] flex flex-col"
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />
      <div className="flex justify-between items-center mb-3 pt-2 relative z-10 gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] sm:text-[12px] font-black tracking-[0.3em] text-primary/60 uppercase lettering">CÓDEX 📖</span>
          <div className="h-1 w-20 bg-cyan-100 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-white shadow-sm text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-start gap-3 mb-4 relative z-10 bg-slate-50 rounded-2xl p-3 border border-slate-100">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">{MENTOR_ICONS[greeting.quien]}</span>
        <p className="text-xs text-slate-600 leading-relaxed italic">
          <span className="font-black not-italic text-slate-700">{MENTOR_NAMES[greeting.quien]}: </span>
          {greeting.texto}
        </p>
      </div>

      <div role="tablist" className="flex gap-3 mb-4 border-b border-slate-100 relative z-10 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`pb-2 text-[11px] font-black uppercase tracking-wide whitespace-nowrap flex items-center gap-1.5 transition-all ${
              tab === t.id ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label}
            {t.badge && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[11px] font-black leading-none">{t.badge}</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-1 relative z-10 min-h-0 flex-1">
        {tab === 'logros' && ACHIEVEMENTS.map((a, i) => {
          const unlockedAt = achievements[a.id];
          const done = unlockedAt !== undefined;
          const value = Math.min(current[a.metric] ?? 0, a.umbral);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl p-3 border flex gap-3 items-start ${done ? 'bg-amber-50/60 border-amber-100' : 'bg-slate-50 border-slate-100'}`}
            >
              <span className={`text-2xl flex-shrink-0 ${done ? '' : 'grayscale opacity-40'}`} aria-hidden="true">{a.emoji}</span>
              <div className="min-w-0 flex-1">
                <h4 className={`text-sm font-black leading-snug ${done ? 'text-slate-800' : 'text-slate-500'}`}>{a.nombre}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{done ? a.chiste : 'Pista: sigue jugando guardias para descubrirlo.'}</p>
                {!done && (
                  <div className="mt-2 flex items-center gap-2" aria-label={`Progreso ${value} de ${a.umbral}`}>
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(value / a.umbral) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 tabular-nums">{value}/{a.umbral}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {tab === 'perlas' && (unlockedPearls.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm italic lettering leading-relaxed">
            "Aún no has desbloqueado perlas ENARM.<br />Resuelve casos clínicos con éxito para coleccionarlas aquí."
          </div>
        ) : unlockedPearls.map((pearl, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={pearl.id || i}
            className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <span className="text-[11px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-md">{pearl.category || 'General'}</span>
              {pearl.gpc_ref && <span className="text-[11px] font-bold text-slate-400 uppercase">GPC: {pearl.gpc_ref}</span>}
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-1 leading-snug">{pearl.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{pearl.text}</p>
          </motion.div>
        )))}

        {tab === 'especialidades' && (specialties.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm italic lettering leading-relaxed">
            "Todavía no hay casos en tu libreta.<br />Cada guardia que termines aparece aquí por especialidad."
          </div>
        ) : specialties.map(row => (
          <div key={row.specialty} className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <h4 className="text-sm font-black text-slate-800">{row.label}</h4>
              <span className="text-[11px] font-bold text-slate-400 tabular-nums">{row.seen} {row.seen === 1 ? 'caso' : 'casos'}</span>
            </div>
            <div className="flex gap-2 text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Dominados {row.mastered}</span>
              <span className={`px-2 py-0.5 rounded-full ${row.due > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>Por repasar {row.due}</span>
            </div>
          </div>
        )))}
      </div>

      <div className="mt-4 flex justify-center relative z-10">
        <button onClick={onClose} className="marker-btn py-3 px-10 text-base">CERRAR LIBRETA ✨</button>
      </div>
    </motion.div>
  );
};
