import fs from 'fs';
import path from 'path';

const casesDir = path.join(process.cwd(), 'cases');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

let csvContent = '\uFEFF'; // BOM for UTF-8 Excel compatibility
csvContent += 'ID_Caso,Especialidad,Dificultad,Nombre_Paciente,Diagnostico_Perla,Numero_Cartas,Preguntas_Boss\n';

for (const file of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'));
    
    const id = data.case_id || file;
    const spec = data.theme_config || 'N/A';
    const diff = data.difficulty || 'standard';
    const name = data.patient_intro?.name?.replace(/,/g, '') || 'N/A';
    
    let pearlTitle = 'N/A';
    if (data.enarm_pearl?.title) pearlTitle = data.enarm_pearl.title;
    else if (data.perla_enarm?.title) pearlTitle = data.perla_enarm.title;
    pearlTitle = pearlTitle.replace(/,/g, ' '); // remove commas for CSV

    const numCards = data.card_stream ? data.card_stream.length : 0;
    const bossFights = (data.boss_fight_triad?.questions) ? data.boss_fight_triad.questions.length : 0;

    csvContent += `${id},${spec},${diff},${name},${pearlTitle},${numCards},${bossFights}\n`;
  } catch (e) {
    // Skip unparseable
  }
}

fs.writeFileSync('CATALOGO_CASOS_COMPLETO.csv', csvContent, 'utf8');
console.log('CSV generado con éxito.');
