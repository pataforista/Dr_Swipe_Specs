import type { CaseProgress } from '../types/srs';
import type { Specialty } from '../types/game';
import { specialtyFromCaseId } from './sessionEngine';

export const SPECIALTY_LABELS: Record<Specialty, string> = {
  ped: 'Pediatría 👶', obs: 'Obstetricia 🤰', gyn: 'Ginecología 🌸', im: 'Medicina Interna 🩺',
  surg: 'Cirugía 🩹', psych: 'Psiquiatría 🧠', neur: 'Neurología ⚡', inf: 'Infectología 🦠',
  prev: 'Medicina Preventiva 💉', stats: 'Estadística 📊', engl: 'Inglés médico 🔤',
};

export interface SpecialtyStat {
  specialty: Specialty;
  label: string;
  seen: number;
  mastered: number;
  due: number;
}

/** Per-specialty view of the SRS schedule, most-played first. */
export function getSpecialtyStats(caseProgress: Record<string, CaseProgress>, now: number): SpecialtyStat[] {
  const map = new Map<Specialty, SpecialtyStat>();
  for (const p of Object.values(caseProgress)) {
    const specialty = specialtyFromCaseId(p.caseId);
    const row = map.get(specialty) ?? { specialty, label: SPECIALTY_LABELS[specialty], seen: 0, mastered: 0, due: 0 };
    row.seen += 1;
    if (p.mastered) row.mastered += 1;
    if (p.nextReviewDate <= now) row.due += 1;
    map.set(specialty, row);
  }
  return [...map.values()].sort((a, b) => b.seen - a.seen || a.label.localeCompare(b.label));
}
