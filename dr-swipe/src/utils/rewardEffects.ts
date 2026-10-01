/**
 * Maps a loot-box reward (rewardItems.json `efecto`) to what it actually does.
 * Until now only `heal` had an effect: the other rewards showed flavour text
 * and a "RECIBIR MEJORA" button that improved nothing. The same table drives
 * the machine event and the text shown before claiming, so the two can't drift.
 */
export interface RewardEffect {
  heal: number;
  /** Mistakes that cost no vitality. */
  shield: number;
  undo: number;
  hint: boolean;
  seconds: number;
  /** Player-facing summary of the effect. */
  description: string;
}

type Efecto = { tipo: string; valor?: number; duracion?: number } | undefined;

const NONE: Omit<RewardEffect, 'description'> = { heal: 0, shield: 0, undo: 0, hint: false, seconds: 0 };

export const resolveRewardEffect = (efecto: Efecto): RewardEffect => {
  const duracion = efecto?.duracion ?? 1;
  switch (efecto?.tipo) {
    case 'heal': {
      const heal = efecto.valor ?? 20;
      return { ...NONE, heal, description: `+${heal} de salud del paciente` };
    }
    case 'shield':
      return { ...NONE, shield: duracion, description: `Escudo: tus próximos ${duracion} errores no dañan al paciente` };
    case 'elimina_error':
      return { ...NONE, undo: 1, description: '+1 Deshacer para corregir un swipe' };
    case 'hint_visual':
    case 'reveal_category':
      return { ...NONE, hint: true, description: 'Pista gratis: te muestra la acción correcta de la carta actual' };
    case 'freeze':
      return { ...NONE, seconds: duracion * 2, description: `El reloj se detiene: +${duracion * 2} s` };
    case 'reduce_interrupciones':
      return { ...NONE, heal: duracion * 5, description: `Te despeja: +${duracion * 5} de salud del paciente` };
    default:
      return { ...NONE, description: 'Sin efecto en esta guardia' };
  }
};
