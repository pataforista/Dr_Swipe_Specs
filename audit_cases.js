const fs = require('fs');
const path = require('path');

const casesDir = './cases';
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

console.log(`Auditing ${files.length} cases for v3 schema...\n`);

const results = {
    v3: [],
    legacy: []
};

files.forEach(file => {
    try {
        const content = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'));
        if (content.version === 'v3_swipe_action') {
            results.v3.push(file);
        } else {
            results.legacy.push({ file, version: content.version || 'v1' });
        }
    } catch (e) {
        console.error(`Error reading ${file}: ${e.message}`);
    }
});

console.log(`V3 Cases (${results.v3.length}):`);
results.v3.forEach(f => console.log(` - [DONE] ${f}`));

console.log(`\nLegacy Cases (${results.legacy.length}):`);
results.legacy.forEach(l => console.log(` - [MISSING] ${l.file} (${l.version})`));

if (results.legacy.length > 0) {
    console.log(`\nTotal migration needed: ${results.legacy.length} files.`);
} else {
    console.log(`\nAll cases are up to date!`);
}
