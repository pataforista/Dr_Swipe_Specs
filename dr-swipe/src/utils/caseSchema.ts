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
  related_diagnoses: z.array(z.string()).optional(),
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
);

const QTEConfigSchema = z.object({
  enabled:   z.boolean(),
  timeLimit: z.number().positive(),
});

const BossFightTriadSchema = z.object({
  trigger:      z.literal('after_cards'),
  questions:    z.array(BossQuestionSchema),
  qte_fallback: QTEConfigSchema.optional(),
});

// ── EnarmPearl ────────────────────────────────────────────────────────────────

export const EnarmPearlSchema = z.object({
  id:       z.string().min(1),
  category: z.string(),
  rarity:   z.enum(['common', 'rare', 'epic', 'legendary']),
  title:    z.string().min(1),
  text:     z.string().min(1),
  gpc_ref:  z.string(),
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
  card_stream:      z.array(CardSchema).min(3, 'Un caso necesita al menos 3 cartas'),
  boss_fight_triad: BossFightTriadSchema.optional(),
  enarm_pearl:      EnarmPearlSchema.optional(),
  perla_enarm:      EnarmPearlSchema.optional(), // soporte legacy
});

// Tipo inferido — úsalo en lugar de la interfaz manual si quieres
export type ClinicalCaseFromSchema = z.infer<typeof ClinicalCaseSchema>;
