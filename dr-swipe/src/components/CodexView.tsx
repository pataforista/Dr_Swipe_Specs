import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnarmPearl } from '../types/game';
import { useCodexStore, KNOWLEDGE_CRATE_COST, type CrateResult } from '../store/useCodexStore';
import { useGameAudio } from '../hooks/useGameAudio';

interface CodexViewProps { onClose: () => void; }

const RARITY = {
  common:    { label: 'Común',      ring: 'border-slate-200',  text: 'text-slate-500',  chip: 'bg-slate-100 text-slate-500' },
  rare:      { label: 'Rara',       ring: 'border-cyan-300',   text: 'text-cyan-600',   chip: 'bg-cyan-100 text-cyan-700' },
  epic:      { label: 'Épica',      ring: 'border-fuchsia-300',text: 'text-fuchsia-600',chip: 'bg-fuchsia-100 text-fuchsia-700' },
  legendary: { label: 'Legendaria', ring: 'border-amber-300',  text: 'text-amber-600',  chip: 'bg-amber-100 text-amber-700' },
} as const;
const rarityOf = (r?: string) => RARITY[(r as keyof typeof RARITY)] ?? RARITY.common;

export const CodexView: React.FC<CodexViewProps> = ({ onClose }) => {
  const { unlockedPearls, stats, openKnowledgeCrate } = useCodexStore();
  const { playGacha, playFeedback } = useGameAudio();
  const [pool, setPool] = useState<EnarmPearl[]>([]);
  const [reveal, setReveal] = useState<CrateResult | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}pearls.json`)
      .then(r => r.ok ? r.json() : [])
      .then(setPool)
      .catch(() => setPool([]));
  }, []);

  const ownedKey = (p: EnarmPearl) => p.id || p.title;
  const ownedSet = new Set(unlockedPearls.map(ownedKey));
  const isOwned = (p: EnarmPearl) => ownedSet.has(p.id || '') || ownedSet.has(p.title);
  const ownedCount = pool.filter(isOwned).length;
  const canBuy = stats.coins >= KNOWLEDGE_CRATE_COST && pool.length > 0;

  const handleOpen = () => {
    const res = openKnowledgeCrate(pool);
    if (!res) return;
    res.isNew ? playGacha() : playFeedback('correct');
    setReveal(res);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      className="paper-sheet p-5 sm:p-8 max-w-md w-full text-left shadow-2xl relative overflow-hidden bg-white mx-4 flex flex-col max-h-[90vh]"
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] medical-grid z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 sm:h-9 washi-tape-pink -rotate-1 shadow-sm z-20" />

      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 pt-3 relative z-10 gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] sm:text-[12px] font-black tracking-[0.3em] text-primary/60 uppercase lettering">CODEX CLÍNICO 📖</span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 lettering">{ownedCount} / {pool.length} perlas coleccionadas</span>
        </div>
        <button onClick={onClose} aria-label="Cerrar"
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border-2 border-white shadow-sm text-slate-400 hover:text-rose-400 transition-colors flex-shrink-0">
          <span className="text-lg font-bold">✕</span>
        </button>
      </div>

      {/* Crate shop */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-4 sm:p-5 mb-4 relative z-10 flex items-center gap-3 sm:gap-4">
        <motion.div animate={{ rotate: [0, 4, -4, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="text-4xl sm:text-5xl flex-shrink-0">🎁</motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-sm font-black text-slate-700 lettering leading-tight">Caja de Conocimiento</p>
          <p className="text-[9px] sm:text-[10px] text-slate-400 lettering">Revela una perla ENARM aleatoria.</p>
        </div>
        <button onClick={handleOpen} disabled={!canBuy}
          className="marker-btn !rotate-0 py-2.5 px-4 sm:px-5 text-[11px] sm:text-sm flex-shrink-0 disabled:opacity-30">
          {KNOWLEDGE_CRATE_COST} 🪙
        </button>
      </div>
      {!canBuy && pool.length > 0 && stats.coins < KNOWLEDGE_CRATE_COST && (
        <p className="text-[9px] text-rose-400 font-bold lettering text-center -mt-2 mb-3 relative z-10">Te faltan {KNOWLEDGE_CRATE_COST - stats.coins} 🪙 — gánalas en la guardia.</p>
      )}

      {/* Collection grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 overflow-y-auto custom-scrollbar pr-1 relative z-10">
        {pool.map((p) => {
          const owned = isOwned(p);
          const r = rarityOf(p.rarity);
          return (
            <div key={p.id || p.title}
              className={`rounded-2xl border-2 p-3 ${owned ? `bg-white ${r.ring} shadow-sm` : 'bg-slate-50 border-slate-100'}`}>
              {owned ? (
                <>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${r.chip}`}>{r.label}</span>
                  </div>
                  <p className={`text-[11px] font-black lettering leading-tight ${r.text}`}>{p.title}</p>
                  <p className="text-[9px] text-slate-500 leading-snug mt-1 line-clamp-3">{p.text}</p>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-3 opacity-50">
                  <span className="text-2xl mb-1">🔒</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest lettering">Por descubrir</span>
                </div>
              )}
            </div>
          );
        })}
        {pool.length === 0 && <p className="col-span-2 text-center text-slate-400 text-sm py-8 lettering">Cargando perlas…</p>}
      </div>

      {/* Reveal overlay */}
      <AnimatePresence>
        {reveal && (() => {
          const r = rarityOf(reveal.pearl.rarity);
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[#FDFBF7]/95 backdrop-blur-sm p-5"
              onClick={() => setReveal(null)}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className={`paper-sheet p-6 sm:p-8 max-w-xs w-full text-center shadow-2xl border-2 ${r.ring} relative`}
              >
                <span className={`inline-block text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full mb-3 ${r.chip}`}>
                  {reveal.isNew ? `¡${r.label}!` : 'Repetida'}
                </span>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="text-5xl mb-3">
                  {reveal.isNew ? '✨' : '📑'}
                </motion.div>
                <h3 className={`text-xl font-black lettering mb-3 leading-tight ${r.text}`}>{reveal.pearl.title}</h3>
                <div className="bg-slate-50 p-4 rounded-2xl mb-3 border border-slate-100 text-[12px] text-slate-600 italic leading-relaxed lettering">
                  "{reveal.pearl.text}"
                </div>
                {reveal.pearl.gpc_ref && <p className="text-[8px] font-bold text-slate-400 uppercase mb-4 lettering">{reveal.pearl.gpc_ref}</p>}
                {!reveal.isNew && <p className="text-[10px] font-black text-emerald-600 mb-3 lettering">Ya la tenías · +{reveal.refund} 🪙 de polvo</p>}
                <button onClick={() => setReveal(null)} className="marker-btn w-full py-3 text-sm">
                  {reveal.isNew ? 'GUARDAR EN EL CODEX ✨' : 'CONTINUAR'}
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
};
