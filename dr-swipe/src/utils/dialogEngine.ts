import dialogsData from '../data/lore/mentorDialogs.json';

export type MentorId = 'navarro' | 'vazquez';
export type DialogContext = keyof typeof dialogsData.contextos;
export type SpecialtyKey = keyof typeof dialogsData.especialidades;
export interface MentorLine { quien: MentorId; texto: string }

export const MENTOR_NAMES: Record<MentorId, string> = { navarro: 'Dra. Navarro', vazquez: 'Dr. Vázquez' };
export const MENTOR_ICONS: Record<MentorId, string> = { navarro: '', vazquez: '' };

/** Maps a case specialty code to a dialog specialty key, if one exists. */
function toSpecialtyKey(specialty?: string): SpecialtyKey | null {
  if (!specialty) return null;
  const s = specialty.toLowerCase();
  if (s in dialogsData.especialidades) return s as SpecialtyKey;
  // Map compound specialty codes to the closest dialog key
  if (s === 'gyn' || s === 'go') return 'obs';
  return null;
}

/** Picks a line for the context; `avoid` keeps the same line from repeating back to back.
 *  When `specialty` is provided and specialty-specific dialogs exist, those are preferred. */
export function pickDialog(context: DialogContext, rng: () => number = Math.random, avoid?: string, specialty?: string): MentorLine {
  const specKey = toSpecialtyKey(specialty);
  let lines: MentorLine[] | undefined;

  // Try specialty-specific pool first
  if (specKey) {
    const specDialogs = dialogsData.especialidades[specKey] as Record<string, MentorLine[]> | undefined;
    if (specDialogs) {
      lines = specDialogs[context] as MentorLine[] | undefined;
    }
  }

  // Fall back to generic pool
  if (!lines || lines.length === 0) {
    lines = dialogsData.contextos[context] as MentorLine[];
  }

  const pool = lines.length > 1 && avoid ? lines.filter(l => l.texto !== avoid) : lines;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

/** Whole days since the last session; the greeting changes after 3 days away. */
export function greetingContext(lastPlayedDate: string | null, today: string): DialogContext {
  if (!lastPlayedDate) return 'bienvenida';
  const gap = Math.round((Date.parse(today) - Date.parse(lastPlayedDate)) / 86_400_000);
  return Number.isFinite(gap) && gap >= 3 ? 'regreso' : 'bienvenida';
}

/** Deterministic 0..1 value from a string, so a case keeps the same line across re-renders. */
export function seededRng(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return () => (h % 1000) / 1000;
}
