import { describe, it, expect, beforeEach } from 'vitest';
import { ACHIEVEMENTS, evaluateAchievements, buildAchievementSnapshot, isNightHour, EMPTY_COUNTERS } from '../utils/achievementsEngine';
import dialogsData from '../data/lore/mentorDialogs.json';
import { pickDialog, seededRng, greetingContext, type DialogContext } from '../utils/dialogEngine';
import { getSpecialtyStats } from '../utils/codexStats';
import { useCodexStore } from '../store/useCodexStore';
import type { CaseResult } from '../types/game';
import type { CaseProgress } from '../types/srs';

// Respectful tone is a content rule: the mentors tease, they never insult.
const DISRESPECTFUL = /cabr[oó]n|pinche|ching|puto|verga|g[uü]ey|pendej|mierda|idiota|est[uú]pid|in[uú]til|burro/i;

const progress = (caseId: string, over: Partial<CaseProgress> = {}): CaseProgress => ({
  caseId, easeFactor: 2.5, interval: 1, repetitions: 1, nextReviewDate: 0, lastReviewDate: 0,
  lapses: 0, totalReviews: 1, lastQuality: 5, mastered: false, ...over,
});
const result = (o: Partial<CaseResult> = {}): CaseResult => ({
  caseId: 'PROC_PED_X_001_001', specialty: 'ped', outcome: 'perfect', mistakes: 0, lethalErrors: 0,
  timeSpentMs: 1000, cardsSeen: 10, xpEarned: 40, coinsEarned: 4, pearlId: null, ...o,
});

describe('catálogo de logros', () => {
  it('ids únicos, umbrales positivos y textos completos', () => {
    expect(new Set(ACHIEVEMENTS.map(a => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.umbral).toBeGreaterThan(0);
      expect(a.nombre.length).toBeGreaterThan(3);
      expect(a.chiste.length).toBeGreaterThan(10);
      expect(a.emoji).toBeTruthy();
    }
  });
  it('incluye los chistes pedidos', () => {
    const names = ACHIEVEMENTS.map(a => a.nombre);
    expect(names).toContain('El interno con más ingresos');
    expect(names).toContain('Dr. Mandrake');
  });
  it('el tono es respetuoso', () => {
    for (const a of ACHIEVEMENTS) expect(`${a.nombre} ${a.chiste}`).not.toMatch(DISRESPECTFUL);
  });
});

describe('evaluateAchievements', () => {
  const base = buildAchievementSnapshot({ stats: { cases_solved: 0, correct_swipes: 0 }, dailyStreak: 0, pearlCount: 0, caseProgress: {} });
  it('un snapshot vacío no desbloquea nada', () => {
    expect(evaluateAchievements(base, {})).toEqual([]);
  });
  it('Dr. Mandrake llega con 10 de combo y no se repite si ya está desbloqueado', () => {
    const snap = { ...base, bestCombo: 10 };
    expect(evaluateAchievements(snap, {}).map(a => a.id)).toContain('mandrake');
    expect(evaluateAchievements(snap, { mandrake: 1 }).map(a => a.id)).not.toContain('mandrake');
    expect(evaluateAchievements(snap, {}).map(a => a.id)).not.toContain('mandrake_gran');
  });
  it('El interno con más ingresos pide 25 casos', () => {
    expect(evaluateAchievements({ ...base, cases_solved: 24 }, {}).map(a => a.id)).not.toContain('mas_ingresos');
    expect(evaluateAchievements({ ...base, cases_solved: 25 }, {}).map(a => a.id)).toContain('mas_ingresos');
  });
  it('el snapshot cuenta especialidades distintas y casos dominados', () => {
    const snap = buildAchievementSnapshot({
      stats: { cases_solved: 3, correct_swipes: 9 }, dailyStreak: 2, pearlCount: 1, favors: 4,
      caseProgress: {
        a: progress('PROC_PED_X_001_001', { mastered: true }),
        b: progress('PROC_PED_X_001_002'),
        c: progress('PROC_SURG_X_001_001', { mastered: true }),
      },
    });
    expect(snap.specialtiesPlayed).toBe(2);
    expect(snap.masteredCases).toBe(2);
    expect(snap.favors).toBe(4);
  });
  it('la madrugada es de 0 a 5 h', () => {
    expect(isNightHour(0)).toBe(true);
    expect(isNightHour(5)).toBe(true);
    expect(isNightHour(6)).toBe(false);
    expect(isNightHour(23)).toBe(false);
  });
});

describe('diálogos de los mentores', () => {
  const contexts = Object.keys(dialogsData.contextos) as DialogContext[];
  it('cada contexto tiene líneas y ninguna es irrespetuosa', () => {
    for (const ctx of contexts) {
      const lines = dialogsData.contextos[ctx] as { quien: string; texto: string }[];
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) {
        expect(['navarro', 'vazquez']).toContain(l.quien);
        expect(l.texto).not.toMatch(DISRESPECTFUL);
      }
    }
  });
  it('ambos mentores hablan y tienen voz mexicana', () => {
    const all = contexts.flatMap(c => dialogsData.contextos[c] as { quien: string; texto: string }[]);
    expect(new Set(all.map(l => l.quien))).toEqual(new Set(['navarro', 'vazquez']));
    expect(all.some(l => /órale|ahorita|va que va|échale/i.test(l.texto))).toBe(true);
  });
  it('pickDialog no repite la última línea cuando hay alternativas', () => {
    const first = pickDialog('bienvenida', () => 0);
    for (let i = 0; i < 20; i++) expect(pickDialog('bienvenida', Math.random, first.texto).texto).not.toBe(first.texto);
  });
  it('la línea de un caso es estable entre renders y siempre válida', () => {
    const a = pickDialog('caso_perfecto', seededRng('PROC_PED_X_001_001'));
    expect(pickDialog('caso_perfecto', seededRng('PROC_PED_X_001_001'))).toEqual(a);
    for (const id of ['', 'a', 'PROC_OBS_Z_001_015']) expect(pickDialog('guardia_inicio', seededRng(id)).texto).toBeTruthy();
  });
  it('tras 3 días de ausencia saluda con "regreso"', () => {
    expect(greetingContext(null, '2026-10-02')).toBe('bienvenida');
    expect(greetingContext('2026-10-01', '2026-10-02')).toBe('bienvenida');
    expect(greetingContext('2026-09-29', '2026-10-02')).toBe('regreso');
  });
});

describe('getSpecialtyStats', () => {
  it('agrupa por especialidad, cuenta dominados y casos por repasar', () => {
    const rows = getSpecialtyStats({
      a: progress('PROC_PED_X_001_001', { mastered: true, nextReviewDate: 9e12 }),
      b: progress('PROC_PED_X_001_002', { nextReviewDate: 0 }),
      c: progress('PROC_SURG_X_001_001', { nextReviewDate: 9e12 }),
    }, 1000);
    expect(rows[0]).toMatchObject({ specialty: 'ped', seen: 2, mastered: 1, due: 1 });
    expect(rows[1]).toMatchObject({ specialty: 'surg', seen: 1, mastered: 0, due: 0 });
  });
});

describe('logros en el store', () => {
  beforeEach(() => useCodexStore.setState({
    stats: { xp: 0, coins: 0, correct_swipes: 0, mistakes: 0, cases_solved: 0, best_score: 0, total_sessions: 0 },
    achievements: {}, counters: EMPTY_COUNTERS, caseProgress: {}, favors: 0, dailyStreak: 0, unlockedPearls: [],
  }));

  it('commitSession cuenta perfectos, rescates, fallos y errores letales', () => {
    useCodexStore.getState().commitSession([
      result(), result({ caseId: 'PROC_PED_X_001_002', outcome: 'rescued' }),
      result({ caseId: 'PROC_PED_X_001_003', outcome: 'failed', lethalErrors: 2 }),
    ], 0);
    expect(useCodexStore.getState().counters).toMatchObject({ perfectCases: 1, rescuedCases: 1, failedCases: 1, lethalErrors: 2 });
  });

  it('desbloquea una sola vez y devuelve solo los nuevos', () => {
    useCodexStore.getState().noteCombo(12);
    const first = useCodexStore.getState().unlockEarnedAchievements(500);
    expect(first.map(a => a.id)).toContain('mandrake');
    expect(useCodexStore.getState().achievements.mandrake).toBe(500);
    expect(useCodexStore.getState().unlockEarnedAchievements(900)).toEqual([]);
    expect(useCodexStore.getState().achievements.mandrake).toBe(500);
  });

  it('noteCombo solo guarda el máximo', () => {
    useCodexStore.getState().noteCombo(7);
    useCodexStore.getState().noteCombo(3);
    expect(useCodexStore.getState().counters.bestCombo).toBe(7);
  });

  it('una guardia de madrugada desbloquea "Café de las 4 AM"; una de tarde no', () => {
    useCodexStore.getState().incrementSessions(new Date(2026, 9, 2, 14, 0));
    expect(useCodexStore.getState().counters.nightShifts).toBe(0);
    useCodexStore.getState().incrementSessions(new Date(2026, 9, 3, 4, 0));
    expect(useCodexStore.getState().counters.nightShifts).toBe(1);
    expect(useCodexStore.getState().unlockEarnedAchievements().map(a => a.id)).toContain('cafe_4am');
  });

  it('recordRevive suma y desbloquea "Adjunto, ¿tiene un minutito?"', () => {
    useCodexStore.getState().recordRevive();
    expect(useCodexStore.getState().unlockEarnedAchievements().map(a => a.id)).toContain('llamada_adjunto');
  });
});
