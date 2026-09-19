import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// `cases/` at the repo root is the authored source of truth; `public/cases/`
// is only the copy Vite serves. Keeping both in git meant 2x the repo weight
// and a real risk of the two drifting apart (M3 in the engine diagnostic).
const sourceDir = path.join(__dirname, '..', 'cases');
const targetDir = path.join(__dirname, 'public', 'cases');

try {
  fs.mkdirSync(targetDir, { recursive: true });
  const caseFiles = fs.readdirSync(sourceDir).filter(f => f.startsWith('CASE_') && f.endsWith('.json'));
  for (const file of caseFiles) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
  }
  console.log(`Synced ${caseFiles.length} clinical cases from cases/ to public/cases/.`);
} catch (error) {
  console.error('Error syncing clinical cases:', error.message);
  process.exit(1);
}
