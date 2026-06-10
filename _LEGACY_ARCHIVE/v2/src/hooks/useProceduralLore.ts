import { nlgEngine } from '../utils/nlgEngine';
import { SwipeCard, ClinicalCase } from '../types/clinical';
import { generateClinicalValue, ClinicalRange } from '../utils/clinicalMath';

/**
 * Hook para generar casos dinámicos basados en la "Orden del Triage"
 * Integra las señales médicas con el ruido del Inquilino.
 */

export const useProceduralLore = () => {
  
  const generateDynamicCase = (blueprint: any, difficulty: number): ClinicalCase => {
    
    const stream: SwipeCard[] = [];
    
    // 1. Generamos señales médicas reales basadas en el blueprint
    blueprint.signals.forEach((sig: any, index: number) => {
      const val = generateClinicalValue(sig.range, difficulty);
      stream.push({
        id: `sig_${index}`,
        category: sig.category,
        card_text: nlgEngine.generateSignal(sig.trigger, val, sig.range.unit),
        expected_action: 'keep',
        source: 'medical',
        critical: sig.critical,
        safety_flags: sig.critical ? {
          lethal_if_discarded: true,
          rationale: `Descartar ${sig.trigger} es una decisión fatal. Este dato clínico crítico no puede ignorarse.`
        } : undefined
      });
    });

    // 2. Inyectamos ruido del Inquilino
    const noiseCount = Math.floor(difficulty * 2) + 2;
    for (let i = 0; i < noiseCount; i++) {
      stream.push({
        id: `noise_${i}`,
        category: 'ANOMALÍA',
        card_text: nlgEngine.generateInquilinoNoise(),
        expected_action: 'discard',
        source: 'inquilino'
      });
    }

    // 3. Inyectamos datos irrelevantes
    for (let i = 0; i < 3; i++) {
        stream.push({
          id: `irr_${i}`,
          category: 'SOCIAL',
          card_text: nlgEngine.generateIrrelevant(),
          expected_action: 'discard',
          source: 'irrelevant'
        });
    }

    // Shuffle simple
    stream.sort(() => Math.random() - 0.5);

    return {
      id: `case_${Date.now()}`,
      patient_intro: {
        name: "Sujeto de Prueba",
        age: 35,
        arrival_scenario: "Ingresa con pupilas dilatadas y pulso errático."
      },
      card_stream: stream,
      final_triad: blueprint.triad,
      perla_enarm: blueprint.perla
    };
  };

  return { generateDynamicCase };
};
