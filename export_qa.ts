import fs from 'fs';
import path from 'path';

const casesDir = path.join(process.cwd(), 'cases');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

// Helper to escape CSV fields that might contain commas or quotes
const escapeCSV = (field: any) => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

let csvContent = '\uFEFF'; // BOM para Excel
csvContent += 'ID_Caso,Especialidad,Num_Pregunta,Pregunta,Opcion_0,Opcion_1,Opcion_2,Opcion_3,Respuesta_Correcta_Texto\n';

for (const file of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'));
    const id = data.case_id || file;
    const spec = data.theme_config || 'N/A';
    
    const questions = data.boss_fight_triad?.questions || [];
    
    questions.forEach((q: any, index: number) => {
      const qText = q.question || q.q || 'N/A';
      const options = q.options || [];
      const correctIdx = q.correct_index;
      const correctText = options[correctIdx] || 'ERROR: Índice inválido';
      
      const opt0 = options[0] || '';
      const opt1 = options[1] || '';
      const opt2 = options[2] || '';
      const opt3 = options[3] || '';

      csvContent += `${escapeCSV(id)},${escapeCSV(spec)},${index + 1},${escapeCSV(qText)},${escapeCSV(opt0)},${escapeCSV(opt1)},${escapeCSV(opt2)},${escapeCSV(opt3)},${escapeCSV(correctText)}\n`;
    });
    
  } catch (e) {
    // skip
  }
}

fs.writeFileSync('REVISION_PREGUNTAS_RESPUESTAS.csv', csvContent, 'utf8');
console.log('CSV de preguntas generado con éxito.');
