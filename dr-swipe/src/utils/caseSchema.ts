import { z } from 'zod';

// ── primitivos ────────────────────────────────────────────────────────────────

const DynamicValueSchema = z.object({
  min: z.number(),
  max: z.number(),
  unit: z.string(),
  isBorderline: z.boolean().optional(),
});

const SafetyFlagsSchema = z.object({
  lethal_risk:        z.boolean().optional(),
  decision_critical:  z.boolean().optional(),
  lethal_if_discarded: z.boolean().optional(),
  is_critical_dxd:    z.boolean().optional(),
});

const CardScoringSchema = z.object({
  points: z.number(),
  error_type: z.enum([
    'omission', 'hoarding',
    'lethal_omission', 'lethal_hazard', 'lethal_commission',
    'critical_dxd',
  ]).optional(),
  vazquez_comment: z.string().optional(),
});

// ── Card ─────────────────────────────────────────────────────────────────────

export const CardSchema = z.object({
  card_id:         z.string().min(1),
  ui_icon:         z.string(),
  category:        z.string().min(1),
  card_text:       z.string().min(1),
  expected_action: z.enum(['keep', 'discard']),
  dynamic_value:   DynamicValueSchema.optional(),
  safety_flags:    SafetyFlagsSchema.optional(),
  scoring:         CardScoringSchema,
});

// ── Boss Fight ────────────────────────────────────────────────────────────────

const BossQuestionSchema = z.object({
  q:             z.string().optional(),     // current field
  question:      z.string().optional(),     // legacy alias
  options:       z.array(z.string()).min(2),
  correct_index: z.number().int().min(0),
}).refine(
  (q) => !!(q.q || q.question),
  { message: 'BossQuestion necesita "q" o "question"' }
).refine(
  (q) => q.correct_index < q.options.length,
  { message: 'correct_index fuera de rango (el boss sería imposible de ganar)' }
);

const QTEConfigSchema = z.object({
  enabled:   z.boolean(),
  timeLimit: z.number().positive(),
});

const BossFightTriadSchema = z.object({
  trigger:      z.literal('after_cards'),
  questions:    z.array(BossQuestionSchema).min(1, 'boss_fight_triad necesita al menos 1 pregunta'),
  qte_fallback: QTEConfigSchema.optional(),
});

// ── EnarmPearl ────────────────────────────────────────────────────────────────

export const EnarmPearlSchema = z.object({
  id:       z.string().min(1).optional(),
  category: z.string().optional(),
  rarity:   z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  title:    z.string().min(1),
  text:     z.string().min(1),
  gpc_ref:  z.string().optional(),
});

// ── ClinicalCase  (el que importa para dataLoader) ────────────────────────────

export const ClinicalCaseSchema = z.object({
  case_id:      z.string().min(1),
  version:      z.literal('v3_swipe_action'),
  theme_config: z.string(),
  difficulty:   z.enum(['standard', 'hard', 'extreme']),
  patient_intro: z.object({
    name:             z.string().min(1),
    arrival_scenario: z.string().min(1),
    time_limit_sec:   z.number().positive(),
  }),
  card_stream:      z.array(CardSchema)
    .min(3, 'Un caso necesita al menos 3 cartas')
    .max(15, 'Un caso no debe exceder 15 cartas')
    .superRefine((cards, ctx) => {
      // These two invariants are the fingerprints of the cross-case
      // contamination incident: duplicated card_ids and multiple init_vitals
      // meant cards from *other diseases* were injected into the case.
      const seen = new Set<string>();
      let initVitalsCount = 0;
      for (const card of cards) {
        if (seen.has(card.card_id)) {
          ctx.addIssue({ code: 'custom', message: `card_id duplicado: ${card.card_id}` });
        }
        seen.add(card.card_id);
        if (card.card_id === 'init_vitals') initVitalsCount++;
      }
      if (initVitalsCount > 1) {
        ctx.addIssue({ code: 'custom', message: `${initVitalsCount} cartas init_vitals (máximo 1)` });
      }
    }),
  boss_fight_triad: BossFightTriadSchema.optional(),
  // Consolidating pearl fields: enarm_pearl is the primary, perla_enarm is legacy
  enarm_pearl:      EnarmPearlSchema.optional(),
  perla_enarm:      EnarmPearlSchema.optional(),
});

// Tipo inferido — úsalo en lugar de la interfaz manual si quieres
export type ClinicalCaseFromSchema = z.infer<typeof ClinicalCaseSchema>;
