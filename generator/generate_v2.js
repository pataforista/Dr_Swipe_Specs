const fs = require('fs');
const path = require('path');
const { BLUEPRINTS } = require('./blueprint_db.js');

const MALE_NAMES = ["Juan", "Carlos", "José", "Miguel", "Pedro", "Luis", "Antonio", "Fernando"];
const FEMALE_NAMES = ["María", "Ana", "Carmen", "Laura", "Isabel", "Marta", "Rosa", "Elena"];

function getRandomItem(arr) {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCase(blueprint, index) {
    const t = blueprint.template;
    const p = t.patient;

    const sex = getRandomItem(p.sex_options);
    const name = sex === "Masculino" ? getRandomItem(MALE_NAMES) : getRandomItem(FEMALE_NAMES);
    const age = getRandomInt(p.age_range[0], p.age_range[1]);
    const mood = getRandomItem(p.mood_options);
    const duration = getRandomItem(p.duration_options);
    const leucos = p.leucos_options ? getRandomItem(p.leucos_options) : "";
    const leads = p.leads_options ? getRandomItem(p.leads_options) : "";

    // Replace placeholders in BIO
    let bio = getRandomItem(p.bio_templates);
    bio = bio.replace("{duration}", duration);

    // Replace placeholders in DETAILS
    let details = getRandomItem(p.details_templates);
    details = details.replace("{leucos}", leucos).replace("{leads}", leads);

    const TA = getRandomItem(p.vitals.TA);
    const FC = getRandomItem(p.vitals.FC);
    const Temp = getRandomItem(p.vitals.Temp);

    // Deep copy and filter differentials based on logic
    let diffs = JSON.parse(JSON.stringify(t.differentials));

    // Clean up generator-specific fields that shouldn't be in the final JSON
    diffs.forEach(d => {
        if (d.safety_flags && d.safety_flags.condition) {
            if (d.safety_flags.condition === 'female' && sex === 'Masculino') {
                // If the red flag is only for females but patient is male, disable lethal risk
                d.safety_flags.lethal_risk = false;
            }
            delete d.safety_flags.condition;
        }
    });

    const caseData = {
        meta: {
            id: `PROC_${blueprint.id.toUpperCase()}_${index.toString().padStart(3, '0')}`,
            title: blueprint.id.replace(/_/g, " ").toUpperCase() + ` (Var ${index})`,
            category: "Procedural",
            difficulty: blueprint.difficulty,
            tags: ["procedural", blueprint.mode] // Important
        },
        version: "v2",
        format: "clinical_reasoning",
        patient_profile: {
            name: name,
            age: age,
            sex: sex,
            image_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}${age}&backgroundColor=c0aede,b6e3f4`,
            mood: mood,
            bio: bio,
            vitals: {
                TA: TA,
                FC: FC,
                Temp: Temp
            },
            details: details
        },
        evidence_stream: diffs.map(d => ({
            type: "differential",
            is_match: d.is_match,
            payload: { title: d.title, text: d.text },
            safety_flags: d.safety_flags,
            feedback: d.feedback
        })),
        perla_enarm: t.perla_enarm
    };

    return caseData;
}

function main() {
    const outDir = path.join(__dirname, '../cases');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }

    let totalGenerated = 0;
    const NUM_VARIATIONS = 15; // Setup to generate 15 of each
    const caseIndex = [];

    for (const blueprint of BLUEPRINTS) {
        for (let i = 1; i <= NUM_VARIATIONS; i++) {
            const caseData = generateCase(blueprint, i);
            const fileName = `CASE_${caseData.meta.id}.json`;
            const outPath = path.join(outDir, fileName);
            fs.writeFileSync(outPath, JSON.stringify(caseData, null, 2));
            caseIndex.push(caseData.meta.id);
            console.log(`✅ Generated: ${fileName} as ${caseData.version}`);
            totalGenerated++;
        }
    }

    // Write index file
    fs.writeFileSync(path.join(outDir, 'case_index.json'), JSON.stringify(caseIndex, null, 2));

    console.log(`\n🎉 Procedural generation complete! Created ${totalGenerated} cases.`);
}

main();
