export type Specialty = 'ped' | 'obs' | 'gyn' | 'im' | 'surg' | 'psych' | 'neur' | 'inf' | 'prev' | 'stats' | 'engl';

export interface Vitals {
  TA?: string;
  FC?: string;
  Temp?: string;
  FR?: string;
  SatO2?: string;
}

export interface DynamicValue {
  min: number;
  max: number;
  unit: string;
  isBorderline?: boolean;
}

export interface PatientIntro {
  name: string;
  arrival_scenario: string;
  time_limit_sec: number;
}

export interface SafetyFlags {
  lethal_risk?: boolean;
  decision_critical?: boolean;
  lethal_if_discarded?: boolean;
  is_critical_dxd?: boolean;
}

export interface CardScoring {
  points: number;
  error_type?: 'omission' | 'hoarding' | 'lethal_omission' | 'lethal_hazard' | 'lethal_commission' | 'critical_dxd';
  vazquez_comment?: string;
}

export interface Card {
  card_id: string;
  ui_icon: string;
  category: string;
  card_text: string;
  expected_action: 'keep' | 'discard';
  dynamic_value?: DynamicValue;
  safety_flags?: SafetyFlags;
  scoring: CardScoring;
}

export interface BossQuestion {
  q: string;
  question?: string; // legacy alias
  options: string[];
  correct_index: number;
}

export interface BossFightTriad {
  trigger: 'after_cards';
  questions: BossQuestion[];
}

export interface EnarmPearl {
  id: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  title: string;
  text: string;
  gpc_ref: string;
}

export interface ClinicalCase {
  case_id: string;
  version: 'v3_swipe_action';
  theme_config: string;
  difficulty: 'standard' | 'hard' | 'extreme';
  patient_intro: PatientIntro;
  card_stream: Card[];
  boss_fight_triad: BossFightTriad;
  enarm_pearl: EnarmPearl;
}

export interface PlayerStats {
  rank: string;
  xp: number;
  coins: number;
  correct_swipes: number;
  mistakes: number;
  cases_solved: number;
}
