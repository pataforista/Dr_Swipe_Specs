import { validateCase, logValidationResult } from './js/validate_case.js';
import fs from 'fs';
import path from 'path';

const casesDir = './cases';
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));

let allValid = true;

for (const file of files) {
    const filePath = path.join(casesDir, file);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        const result = validateCase(data);

        console.log(`\n===========================================`);
        console.log(`Validating: ${file}`);
        logValidationResult(result);

        if (!result.valid) allValid = false;
    } catch (e) {
        console.error(`Error parsing ${file}:`, e.message);
        allValid = false;
    }
}

if (allValid) {
    console.log('\n✅ All cases are valid.');
} else {
    console.log('\n❌ Some cases have critical errors.');
}
