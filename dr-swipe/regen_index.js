import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicCasesDir = path.join(__dirname, 'public', 'cases');
const indexPath = path.join(publicCasesDir, 'case_index.json');

try {
  const files = fs.readdirSync(publicCasesDir);
  const caseIds = files
    .filter(f => f.startsWith('CASE_') && f.endsWith('.json'))
    .map(f => f.replace('CASE_', '').replace('.json', ''))
    .sort();

  fs.writeFileSync(indexPath, JSON.stringify(caseIds, null, 2));
  console.log(`Successfully regenerated case_index.json with ${caseIds.length} IDs.`);
} catch (error) {
  console.error('Error regenerating case index:', error.message);
  process.exit(1);
}
