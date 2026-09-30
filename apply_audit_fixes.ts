import fs from 'fs';
import path from 'path';

const casesDir = path.join(process.cwd(), 'cases');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

let modifiedCount = 0;

for (const file of files) {
    let content = fs.readFileSync(path.join(casesDir, file), 'utf8');
    let original = content;

    // 1. Typos and Orthography
    content = content.replace(/sitémica/g, 'sistémica');
    content = content.replace(/\bNINA\b/g, 'NIÑA');
    content = content.replace(/\bOsea\b/g, 'Ósea');
    content = content.replace(/\bAcido\b/g, 'Ácido');
    content = content.replace(/\bventriculo\b/g, 'ventrículo');
    content = content.replace(/\bestadistica\b/g, 'estadística');
    content = content.replace(/\bpediatria\b/g, 'pediatría');
    content = content.replace(/\bevalua\b/g, 'evalúa');
    content = content.replace(/\bdesnutricion\b/g, 'desnutrición');
    content = content.replace(/\bantropometrico\b/g, 'antropométrico');
    content = content.replace(/\bsintomas\b/g, 'síntomas');
    // content = content.replace(/\bperdida\b/g, 'pérdida'); // could be past participle, skipping to be safe
    content = content.replace(/¿Que /g, '¿Qué ');
    content = content.replace(/¿Cual /g, '¿Cuál ');
    content = content.replace(/¿Cuales /g, '¿Cuáles ');
    content = content.replace(/¿Como /g, '¿Cómo ');
    content = content.replace(/¿En que /g, '¿En qué ');
    content = content.replace(/¿A que /g, '¿A qué ');
    content = content.replace(/¿Por que /g, '¿Por qué ');
    content = content.replace(/\bPs\b/g, 'síntomas'); // For "Si hay síntomas clásicos (Ps)"

    // 2. Specific Medical Questions
    // Rubéola: Change question to focus on pregnancy so "Congenital Rubella" is correct
    content = content.replace(
        /Cuál es la complicación más grave de la Rubéola en la población general\?/g,
        'Cuál es la complicación más grave de la rubéola durante el embarazo?'
    );
    
    // Alvarado:
    content = content.replace(
        /Qué componente de la Escala de Alvarado otorga 2 puntos\?/g,
        'Cuáles son los componentes de la Escala de Alvarado que otorgan 2 puntos?'
    );

    // Aborto (NOM-007):
    content = content.replace(/Antes de la semana 22/g, 'Antes de la semana 20');
    content = content.replace(/22 semanas/g, '20 semanas');

    // Ticagrelor con Fibrinólisis:
    content = content.replace(/Ticagrelor y fibrinolítico/g, 'Clopidogrel y fibrinolítico');
    content = content.replace(/Ticagrelor/g, 'Clopidogrel'); // Broad replace for this specific AMI context

    // 3. Specialty Metadata fixes
    let data = JSON.parse(content);
    if (data.theme_config === 'psych') data.theme_config = 'psyc';
    
    // Sífilis -> inf
    if (file.toLowerCase().includes('syphilis') || data.patient_intro?.name?.toLowerCase().includes('sífilis')) {
        data.theme_config = 'inf';
    }
    // Glaucoma -> oph
    if (file.toLowerCase().includes('glaucoma')) {
        data.theme_config = 'oph';
    }
    // Epistaxis -> orl
    if (file.toLowerCase().includes('epistaxis')) {
        data.theme_config = 'orl';
    }
    // Acné -> derm
    if (file.toLowerCase().includes('acne')) {
        data.theme_config = 'derm';
    }

    // 4. Hitos del desarrollo pediátrico (Sedestación)
    if (data.boss_fight_triad && data.boss_fight_triad.questions) {
        data.boss_fight_triad.questions.forEach((q: any) => {
            if (q.question && q.question.includes('sedestación sin apoyo')) {
                // Change options to reflect 6 meses
                q.options = ["4 meses", "6 meses", "9 meses"];
                q.correct_index = 1;
            }
        });
    }

    let newContent = JSON.stringify(data, null, 4);
    
    // We already applied string replaces, but JSON.stringify will overwrite some of them if we didn't apply them to the JS object.
    // So let's string replace again on the final JSON to be sure.
    newContent = newContent.replace(/sitémica/g, 'sistémica');
    newContent = newContent.replace(/\bNINA\b/g, 'NIÑA');
    newContent = newContent.replace(/\bOsea\b/g, 'Ósea');
    newContent = newContent.replace(/\bAcido\b/g, 'Ácido');
    newContent = newContent.replace(/\bventriculo\b/g, 'ventrículo');
    newContent = newContent.replace(/\bestadistica\b/g, 'estadística');
    newContent = newContent.replace(/\bpediatria\b/g, 'pediatría');
    newContent = newContent.replace(/\bevalua\b/g, 'evalúa');
    newContent = newContent.replace(/\bdesnutricion\b/g, 'desnutrición');
    newContent = newContent.replace(/\bantropometrico\b/g, 'antropométrico');
    newContent = newContent.replace(/\bsintomas\b/g, 'síntomas');
    newContent = newContent.replace(/¿Que /g, '¿Qué ');
    newContent = newContent.replace(/¿Cual /g, '¿Cuál ');
    newContent = newContent.replace(/¿Cuales /g, '¿Cuáles ');
    newContent = newContent.replace(/¿Como /g, '¿Cómo ');
    newContent = newContent.replace(/¿En que /g, '¿En qué ');
    newContent = newContent.replace(/¿A que /g, '¿A qué ');
    newContent = newContent.replace(/¿Por que /g, '¿Por qué ');
    newContent = newContent.replace(/\bPs\b/g, 'síntomas');
    newContent = newContent.replace(/Cuál es la complicación más grave de la Rubéola en la población general\?/g, 'Cuál es la complicación más grave de la rubéola durante el embarazo?');
    newContent = newContent.replace(/Qué componente de la Escala de Alvarado otorga 2 puntos\?/g, 'Cuáles son los componentes de la Escala de Alvarado que otorgan 2 puntos?');
    newContent = newContent.replace(/Antes de la semana 22/g, 'Antes de la semana 20');
    // Avoid double replacing if it was already replaced
    // Also, '22 semanas' to '20 semanas'
    // Let's just write the parsed obj, and apply replaces on the strings dynamically
    
    if (original !== newContent) {
        fs.writeFileSync(path.join(casesDir, file), newContent, 'utf8');
        modifiedCount++;
    }
}

console.log(`Auditoría aplicada. Casos modificados: ${modifiedCount}`);
