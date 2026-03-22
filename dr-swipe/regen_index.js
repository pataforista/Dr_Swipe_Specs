import fs from 'fs';
import path from 'path';

const publicCasesDir = 'c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases';
const indexPath = path.join(publicCasesDir, 'case_index.json');

const files = fs.readdirSync(publicCasesDir);
const caseIds = files
  .filter(f => f.startsWith('CASE_') && f.endsWith('.json'))
  .map(f => f.replace('CASE_', '').replace('.json', ''))
  .sort();

fs.writeFileSync(indexPath, JSON.stringify(caseIds, null, 2));
console.log(`Regenerated case_index.json with ${caseIds.length} IDs.`);
