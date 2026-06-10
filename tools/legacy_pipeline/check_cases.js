import fs from 'fs';
import path from 'path';

const publicCasesDir = 'c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases';
const indexPath = path.join(publicCasesDir, 'case_index.json');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
const files = new Set(fs.readdirSync(publicCasesDir));

const missing = [];

for (const id of index) {
  const fileName = `CASE_${id}.json`;
  if (!files.has(fileName)) {
    missing.push(id);
  }
}

console.log(`Total IDs in index: ${index.length}`);
console.log(`Missing files: ${missing.length}`);
if (missing.length > 0) {
  console.log('Sample missing IDs:');
  console.log(missing.slice(0, 20));
}
