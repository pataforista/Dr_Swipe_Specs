import { DoctorName } from '../types/avatars';

/**
 * Motor de lenguaje natural "El Pabellón Olvidado"
 * Genera señales médicas (verdad) y ruido cósmico (engaño del Inquilino).
 */

const COSMIC_WHISPERS = [
  "TA 110/70. El monitor parpadea brevemente y vuelve a la normalidad.",
  "Pupilas isocóricas. El paciente lleva 10 minutos mirando fijamente la esquina vacía del techo.",
  "Temperatura 36.8°C. Sin embargo, la habitación se siente extrañamente helada.",
  "El paciente susurra en un idioma que no figura en los registros.",
  "Se percibe un olor a ozono y tierra antigua cerca de la cama.",
  "Las sombras en la radiografía parecen moverse independientemente.",
  "El paciente intenta morder el aire con una fuerza inhumana.",
  "Las pupilas se dilatan formando patrones que no responden a la luz."
];

const MEDICAL_TEMPLATES: Record<string, string[]> = {
  'leucocitosis': [
    "Laboratorio reporta leucocitosis de {value} {unit}.",
    "Cifra de leucocitos confirmada en {value} {unit}.",
    "Biometría hemática con {value} {unit} blancos."
  ],
  'ta_sistolica': [
    "Presión sistólica medida en {value} {unit}.",
    "Tensión arterial sistólica de {value} {unit}.",
    "Monitor registra {value} {unit} mmHg de sistólica."
  ],
  'fiebre': [
    "Registro térmico de {value} {unit}.",
    "Temperatura central confirmada en {value} {unit}.",
    "Se detecta temperatura de {value} {unit}."
  ],
  'saturacion': [
    "Saturación de oxígeno al {value} {unit}.",
    "Oxigenometría de pulso reporta {value} {unit}.",
    "SatO2 captada en {value} {unit}."
  ]
};

export const nlgEngine = {
  /**
   * Genera una señal médica 100% rigurosa y científica.
   */
  generateSignal: (trigger: string, value: number | string, unit: string): string => {
    const templates = MEDICAL_TEMPLATES[trigger] || [`{trigger}: {value} {unit}`];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template
      .replace('{value}', value.toString())
      .replace('{unit}', unit)
      .replace('{trigger}', trigger);
  },

  /**
   * Genera ruido inquietante (clinico + atmósfera pesada).
   */
  generateInquilinoNoise: (): string => {
    return COSMIC_WHISPERS[Math.floor(Math.random() * COSMIC_WHISPERS.length)];
  },

  /**
   * Genera un dato irrelevante (Folclore típico de hospital).
   */
  generateIrrelevant: (): string => {
    const irrelevants = [
      "La enfermera del turno nocturno dejó las muestras y salió rápido del cubículo.",
      "El paciente refiere que su perro se llama 'Boby'.",
      "Menciona que el café del hospital está demasiado frío.",
      "El expediente menciona que es alérgico a las fresas.",
      "Lleva puestos calcetines de diferentes colores.",
      "Refiere que su signo zodiacal es Escorpio."
    ];
    return irrelevants[Math.floor(Math.random() * irrelevants.length)];
  }
};
