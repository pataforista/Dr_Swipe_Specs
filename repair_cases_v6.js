const fs = require('fs');
const path = require('path');

const casesDir = 'cases';
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

// Mapeo exhaustivo de bytes mangled (interpretados como caracteres individuales)
const REPLACEMENTS = [
    { from: /\u00c3\u00b3/g, to: 'ó' },
    { from: /\u00c3\u00a1/g, to: 'á' },
    { from: /\u00c3\u00a9/g, to: 'é' },
    { from: /\u00c3\u00ad/g, to: 'í' },
    { from: /\u00c3\u00ba/g, to: 'ú' },
    { from: /\u00c3\u00b1/g, to: 'ñ' },
    { from: /\u00c3\u0091/g, to: 'Ñ' },
    { from: /\u00c3\u00bc/g, to: 'ü' },
    { from: /\u00c2\u00ba/g, to: '°' },
    { from: /\u00c2\u00bf/g, to: '¿' },
    { from: /\u00c2\u00a1/g, to: '¡' },
    { from: /\u00e2\u0080\u009c/g, to: '“' },
    { from: /\u00e2\u0080\u009d/g, to: '”' },
    { from: /\u00c2/g, to: '' } // Limpieza de Â residual
];

const NARRATIVE_MAP = {
    vitals: ["El monitor muestra:", "Enfermería reporta:", "La nota de triage indica:", "Al tomar signos vitales:"],
    labs: ["Laboratorio entregó reporte:", "Revisaste los resultados:", "El técnico de lab informa:", "Viste en el sistema:"],
    notes: ["A la exploración física:", "El paciente refiere:", "Notas en el expediente:", "Al interrogar al paciente:"],
    meds: ["El paciente admite:", "Al revisar sus medicamentos:", "Refiere automedicarse con:", "La receta previa indica:"],
    imaging: ["La radiografía muestra:", "En el ultrasonido se ve:", "El reporte de imagen indica:", "Viste en la placa:"]
};
const DEFAULT_PREFIXES = ["Hallazgo clínico:", "Hallazgo:", "Evidencia clínica:", "Dato de importancia:"];

function fixString(s) {
    if (!s) return s;
    let result = s;
    REPLACEMENTS.forEach(r => {
        result = result.replace(r.from, r.to);
    });
    // Limpieza de duplicados o solapamientos
    result = result.replace(/Enfermería reporta: (El monitor|La nota|Enfermería)/g, '$1');
    result = result.replace(/Evidencia: (El monitor|La nota|Enfermería)/g, '$1');
    return result;
}

function refineNarrative(card) {
    let text = fixString(card.card_text || "");
    if (!text) return text;

    // Detectar si ya tiene un prefijo narrativo decente
    const decentPrefixes = Object.values(NARRATIVE_MAP).flat().concat(["Evidencia:", "Hallazgo:"]);
    const alreadyDecent = decentPrefixes.some(p => text.startsWith(p));

    if (!alreadyDecent || text.startsWith("Dato clínico:") || text.startsWith("Dato cl")) {
        const category = (card.category || "default").toLowerCase();
        const options = NARRATIVE_MAP[category] || DEFAULT_PREFIXES;
        const prefix = options[Math.floor(Math.random() * options.length)];
        text = text.replace(/^Dato cl[ií]nico: /, ""); // Quitar si existe
        if (!decentPrefixes.some(p => text.startsWith(p))) {
            text = `${prefix} ${text}`;
        }
    }
    return text;
}

console.log(`🚀 Iniciando reparación masiva (Node.js v6) de ${files.length} casos...`);

let successCount = 0;

files.forEach((file) => {
    const filePath = path.join(casesDir, file);
    try {
        let raw = fs.readFileSync(filePath, 'utf8');
        
        // 0. Eliminar el BOM (Byte Order Mark) si existe (\uFEFF)
        if (raw.charCodeAt(0) === 0xFEFF) {
            raw = raw.slice(1);
        }
        
        // 1. Reparar encoding de todo el JSON antes de parsear
        const repairedRaw = fixString(raw);
        
        let data;
        try {
            data = JSON.parse(repairedRaw);
        } catch (parseErr) {
            // Intentar reparar un posible error común de comas finales o similares si falló
            console.error(`⚠️ Error de baneo en ${file}. Saltando.`);
            return;
        }
        
        if (data.card_stream) {
            data.card_stream.forEach(card => {
                // 2. Refinar narrativa
                card.card_text = refineNarrative(card);
                
                // 3. Reparar comentarios de Vazquez
                if (card.scoring && card.scoring.vazquez_comment) {
                    card.scoring.vazquez_comment = fixString(card.scoring.vazquez_comment);
                }

                // 4. Auditoría de vitales patológicos
                if (card.card_id === "init_vitals" || (card.category && (card.category.toLowerCase().includes("vital") || card.category.toLowerCase().includes("signo")))) {
                    const text = card.card_text;
                    const isBad = /90\/60|80\/50|70\/40|120 lpm|130 lpm|140 lpm|150 lpm|38\.[5-9]|39\./.test(text);
                    if (isBad) {
                        card.expected_action = "keep";
                        if (card.scoring && (card.scoring.error_type === "hoarding" || !card.scoring.error_type)) {
                            card.scoring.error_type = "omission";
                        }
                    }
                }
            });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        successCount++;
        if (successCount % 100 === 0) console.log(`Progreso: ${successCount} casos...`);
    } catch (e) {
        console.error(`❌ Error inesperado en ${file}: ${e.message}`);
    }
});

console.log(`✅ FINALIZADO. ${successCount} casos reparados.`);
