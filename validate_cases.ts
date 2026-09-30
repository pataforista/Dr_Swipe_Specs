import fs from 'fs';
import path from 'path';
import { ClinicalCaseSchema } from './dr-swipe/src/utils/caseSchema';

const casesDir = path.join(process.cwd(), 'cases');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));

let total = 0;
let errors = 0;

for (const file of files) {
  const filePath = path.join(casesDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    total++;
    const result = ClinicalCaseSchema.safeParse(data);
    if (!result.success) {
      console.log(`\n❌ Error in ${file}:`);
      result.error.errors.forEach(e => {
        console.log(`  - ${e.path.join('.')}: ${e.message}`);
      });
      errors++;
    }
  } catch (e) {
    console.log(`\n❌ Failed to parse ${file}: ${e.message}`);
    errors++;
  }
}

console.log(`\nDone. Checked ${total} cases. Errors found: ${errors}`);
if (errors > 0) process.exit(1);
