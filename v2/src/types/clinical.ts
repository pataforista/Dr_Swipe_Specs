export type Specialty = 'all' | 'ped_' | 'obs_' | 'int_' | 'surg_' | 'psych_' | 'ANOMALÍA' | 'SOCIAL';

export type ExpectedAction = 'keep' | 'discard';
export type CardSource = 'medical' | 'inquilino' | 'irrelevant';

export interface SafetyFlags {
    lethal_risk?: boolean;
    lethal_if_discarded?: boolean;
    rationale? : string;
}

export interface SwipeCard {
    id: string;
    card_text: string;
    category: string;
    expected_action: ExpectedAction;
    source: CardSource;
    critical?: boolean;
    safety_flags?: SafetyFlags;
    feedback?: {
        match?: string;
        discard?: string;
    };
}

export interface PatientProfile {
    name: string;
    age: number;
    arrival_scenario: string;
    vitals_preview?: string;
}

export interface TriadQuestion {
    type: 'diagnosis' | 'study' | 'treatment';
    question: string;
    options: string[];
    correct_index: number;
    rationale?: string;
}

export interface ClinicalCase {
    id: string;
    patient_intro: PatientProfile;
    card_stream: SwipeCard[];
    final_triad: TriadQuestion[];
    perla_enarm?: PerlaENARM;
}

export interface PerlaENARM {
  id: string;
  title: string;
  text: string;
  category: string;
  gpc_ref: string;
  rarity: 'common' | 'rare' | 'legendary';
}
