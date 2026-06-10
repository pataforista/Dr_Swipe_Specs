import fs from 'fs';
import path from 'path';

const publicCasesDir = 'c:/Users/Admin/Desktop/Juegos ENARM/Dr_Swipe_Specs/dr-swipe/public/cases';
const indexPath = path.join(publicCasesDir, 'case_index.json');

const rawContent = fs.readFileSync(indexPath, 'utf-8');
const index = JSON.parse(rawContent);
const files = new Set(fs.readdirSync(publicCasesDir));

console.log(`Total entries: ${index.length}`);

index.forEach((id, i) => {
  if (typeof id !== 'string') {
    console.log(`Entry ${i} is not a string:`, id);
    return;
  }
  if (id.includes('\n') || id.includes('\r')) {
    console.log(`Entry ${i} has newline:`, JSON.stringify(id));
  }
  const fileName = `CASE_${id}.json`;
  if (!files.has(fileName)) {
    console.log(`Missing file for Entry ${i}: [${id}] (Filename: ${fileName})`);
  }
});
