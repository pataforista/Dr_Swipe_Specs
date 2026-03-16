/**
 * NLG_Engine — Dr. Swipe: Triage Fatal
 * Transforma datos clínicos crudos en narrativa inmersiva y añade "sabor" mexicano.
 */

export const NLG_ENGINE = {
    // Mapeo de condiciones clínicas a narrativas viscerales
    NARATIVE_MAP: {
        "dolor_fid": [
            "El paciente grita al descompresionar el cuadrante inferior derecho.",
            "Una mueca de dolor cruza su cara cuando palpas la fosa ilíaca derecha.",
            "Defensa abdominal evidente en la zona del apéndice."
        ],
        "leucocitosis": [
            "El conteo de blancos está por las nubes: {value} leucos.",
            "Biometría reporta leucocitosis marcada con neutrofilia del 85%.",
            "La respuesta inflamatoria es sistémica: leucocitos en {value}."
        ],
        "fiebre": [
            "Sientes su frente arder al tacto: {value}°C.",
            "El termómetro marca una fiebre persistente de {value}°C.",
            "Paciente diaforético, piel caliente al tacto ({value}°C)."
        ],
        "mania_energia": [
            "Habla tan rápido que apenas puedes seguirle el hilo.",
            "Lleva 4 días sin dormir y dice que 'nunca se ha sentido mejor'.",
            "Entra al cubículo saltando, con una energía inagotable."
        ],
        "mania_compras": [
            "Te muestra recibos de deudas por $50,000 en un solo día.",
            "Dice que compró tres guitarras eléctricas aunque no sabe tocar.",
            "Presume sus nuevas adquisiciones impulsivas del fin de semana."
        ],
        "estabilidad": [
            "Signos vitales estables: TA {ta}, FC {fc}.",
            "Monitor muestra ritmo sinusal, constantes dentro de parámetros.",
            "Paciente tranquilo, sin datos de compromiso hemodinámico."
        ]
    },

    // Pool de Ruido Mexicano (HGC Style)
    MEXICAN_NOISE: [
        { title: "Dieta", text: "El paciente pregunta si puede comer tamales de verde." },
        { title: "Logística", text: "La enfermera Lety te pide que firmes unos vales de gasas." },
        { title: "Ambiente", text: "Se escucha el radio de urgencias tocando una de Los Ángeles Azules." },
        { title: "Familiar", text: "La tía del paciente pregunta si le puede traer un atole." },
        { title: "Fatiga", text: "Tus ojos arden; llevas 18 horas de guardia sin café." },
        { title: "Burocracia", text: "El sistema de admisiones se cayó. Otra vez." },
        { title: "Social", text: "El paciente te pregunta si eres el doctor que salió en la tele." },
        { title: "Interrupción", text: "Un camillero pasa gritando: '¡Va choque! ¡Abran paso!'" }
    ],

    /**
     * Procesa una tarjeta de evidencia para inyectar narrativa si es necesario.
     */
    processCard(card) {
        if (!card.payload) return card;

        // Inyección de narrativa basada en tags o condiciones
        if (card.payload.condition && this.NARATIVE_MAP[card.payload.condition]) {
            const pool = this.NARATIVE_MAP[card.payload.condition];
            const rawText = pool[Math.floor(Math.random() * pool.length)];
            
            // Reemplazo simple de variables
            card.payload.text = rawText
                .replace("{value}", card.payload.value || "")
                .replace("{ta}", card.payload.ta || "")
                .replace("{fc}", card.payload.fc || "");
        }

        return card;
    },

    /**
     * Obtiene una tarjeta de ruido aleatoria del pool mexicano.
     */
    getRandomNoise() {
        const noise = this.MEXICAN_NOISE[Math.floor(Math.random() * this.MEXICAN_NOISE.length)];
        return {
            evidence_id: `noise_${Math.random().toString(36).substr(2, 9)}`,
            category: "admin",
            is_signal: false,
            noise_type: "irrelevant_true",
            payload: {
                title: noise.title,
                text: noise.text
            }
        };
    }
};

// Node.js support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NLG_ENGINE };
}
