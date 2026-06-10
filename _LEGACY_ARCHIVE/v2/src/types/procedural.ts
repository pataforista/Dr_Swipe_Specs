export interface ClinicalRange {
  min: number;
  max: number;
  unit: string;
  isBorderline?: boolean; // Para aumentar la dificultad en rangos altos
}

export interface BlueprintCard {
  id: string;
  category: string;
  nlg_trigger: string;
  expected_action: 'keep' | 'discard';
  dynamic_value?: ClinicalRange; // Si existe, el motor calculará un valor
  static_text?: string;          // Si existe, se usa tal cual
}

export interface PlayableCard extends BlueprintCard {
  displayText: string;
  instanceId: string;
}
