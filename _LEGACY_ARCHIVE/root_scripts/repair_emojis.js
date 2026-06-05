const fs = require('fs');
const path = require('path');

const casesDir = 'cases';
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

const FINAL_REPLACEMENTS = [
    { from: /ðŸŽ¯/g, to: '🎯' },
    { from: /ðŸš€/g, to: '🚀' },
    { from: /âœ…/g, to: '✅' },
    { from: /ðŸš¨/g, to: '🚨' },
    { from: /ðŸ§¹/g, to: '🧹' }
];

files.forEach(file => {
    const filePath = path.join(casesDir, file);
    try {
        let raw = fs.readFileSync(filePath, 'utf8');
        let repaired = raw;
        FINAL_REPLACEMENTS.forEach(r => {
            repaired = repaired.replace(r.from, r.to);
        });
        
        // Limpiar "Evidencia clínica: Información redundante:" a solo "Información redundante:"
        repaired = repaired.replace(/Hallazgo clínico: Información redundante:/g, 'Información redundante:');
        repaired = repaired.replace(/Evidencia clínica: Información redundante:/g, 'Información redundante:');
        repaired = repaired.replace(/Dato de importancia: Información redundante:/g, 'Información redundante:');

        if (repaired !== raw) {
            fs.writeFileSync(filePath, repaired, 'utf8');
        }
    } catch (e) {
        console.error(`Error en ${file}: ${e.message}`);
    }
});
console.log("✅ Emoji repair and prefix cleanup complete.");
