const fs = require('fs');
const path = require('path');

const PREFIXES = {
    keep: {
        vitals: ["Enfermería reporta:", "El monitor muestra:", "Al tomar signos vitales:", "En el triage se anotó:"],
        labs: ["Laboratorio entregó reporte:", "Revisaste los resultados:", "El técnico de lab informa:", "Viste en el sistema:"],
        notes: ["A la exploración física:", "El paciente refiere:", "Notas en el expediente:", "Al interrogar al paciente:"],
        meds: ["El paciente confiesa:", "Al revisar sus medicamentos:", "Refiere automedicarse con:", "La receta previa indica:"],
        imaging: ["La radiografía muestra:", "En el ultrasonido se ve:", "El reporte de imagen indica:", "Viste en la placa:"],
        default: ["Dato clínico:", "Hallazgo:", "Evidencia:"]
    },
    discard: {
        vitals: ["Un interno te entrega por error:", "Viste una nota vieja de ayer:", "Un compañero te comenta de paso:", "Recordaste una cifra previa de:"],
        labs: ["Un técnico te entrega un resultado ajeno:", "Encontraste una hoja de lab sin nombre:", "Viste un resultado normal previo de:", "Recordaste que ayer la cifra era:"],
        notes: ["Un familiar menciona haber oído que:", "Un amigo del paciente te dice que:", "Recordaste un rumor sobre el paciente:", "Escuchaste en el pasillo que:"],
        meds: ["Viste una nota de una vitamina irrelevante:", "Un amigo menciona que el paciente toma té de:", "Recordaste leer sobre un suplemento de:", "El paciente dice que hace un año tomó:"],
        imaging: ["Recordaste una placa de hace 2 años:", "El reporte de un estudio ajeno indica:", "Viste una radiografía de otro servicio de:", "Un interno menciona una placa normal de:"],
        default: ["Dato anecdótico:", "Información redundante:", "Ruido en el expediente:"]
    }
};

function cleanComment(comment, isCorrect, lethalRisk = false) {
    if (!comment) return "";
    
    // Remove existing prefixes
    let clean = comment.replace(/^(Mendoza|Vazquez|Dr\. Vázquez|Dr\. Mendoza):\s*/i, '');
    
    if (!isCorrect) {
        if (lethalRisk) {
            return `🚨 ¡ERROR CRÍTICO! ${clean}`;
        } else if (clean.toLowerCase().includes("ruido") || clean.toLowerCase().includes("irrelevante") || clean.toLowerCase().includes("basura")) {
            return `🧹 DESCARTE RECOMENDADO: ${clean}`;
        } else {
            return `🎯 DATO CLAVE OMITIDO: ${clean}`;
        }
    }
    return clean;
}

function migrateCase(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const caseData = JSON.parse(data);
        
        if (!caseData.card_stream) return false;
        
        caseData.card_stream.forEach(card => {
            const scoring = card.scoring || {};
            const errorType = scoring.error_type || '';
            const safetyFlags = card.safety_flags || {};
            const lethalRisk = safetyFlags.lethal_risk || false;
            const decisionCritical = safetyFlags.decision_critical || false;
            
            // Logic override
            if (lethalRisk || decisionCritical || ['lethal_omission', 'omission', 'lethal_hazard'].includes(errorType)) {
                card.expected_action = 'keep';
            } else if (errorType === 'hoarding') {
                card.expected_action = 'discard';
            }
            
            // Narrative layer
            const action = card.expected_action;
            let category = (card.category || 'default').toLowerCase();
            if (!PREFIXES[action][category]) category = 'default';
            
            const options = PREFIXES[action][category];
            const prefix = options[Math.floor(Math.random() * options.length)];
            const text = card.card_text || '';
            
            // Avoid double prefixes
            const allPrefixes = [...PREFIXES.keep.default, ...PREFIXES.discard.default];
            if (!allPrefixes.some(p => text.startsWith(p))) {
                card.card_text = `${prefix} ${text}`;
            }
            
            // Feedback
            if (scoring.vazquez_comment) {
                scoring.vazquez_comment = cleanComment(scoring.vazquez_comment, action === 'keep', lethalRisk);
            }
        });
        
        fs.writeFileSync(filePath, JSON.stringify(caseData, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error(`Error in ${filePath}:`, e);
        return false;
    }
}

const casesDir = 'cases';
let count = 0;
const files = fs.readdirSync(casesDir);
files.forEach(file => {
    if (file.endsWith('.json')) {
        if (migrateCase(path.join(casesDir, file))) {
            count++;
            if (count % 100 === 0) console.log(`Processed ${count} cases...`);
        }
    }
});

console.log(`FINISHED. Processed ${count} cases total.`);
