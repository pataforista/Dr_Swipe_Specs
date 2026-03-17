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

function getMentorForSpecialty(caseId) {
    const cid = caseId.toLowerCase();
    if (cid.includes('surg') || cid.includes('int_') || cid.includes('card') || cid.includes('endo') || cid.includes('gast')) {
        return "Mendoza";
    }
    if (cid.includes('ped') || cid.includes('obs') || cid.includes('gyn')) {
        return "Castillo";
    }
    return "Navarro";
}

function generateCase(blueprint, index) {
    const t = blueprint.template;
    const p = t.patient;

    const sex = getRandomItem(p.sex_options);
    const name = sex === "Masculino" ? getRandomItem(MALE_NAMES) : getRandomItem(FEMALE_NAMES);
    const age = getRandomInt(p.age_range[0], p.age_range[1]);
    const duration = getRandomItem(p.duration_options);
    const leucos = p.leucos_options ? getRandomItem(p.leucos_options) : "";
    const leads = p.leads_options ? getRandomItem(p.leads_options) : "";

    let bio = getRandomItem(p.bio_templates).replace("{duration}", duration);
    let details = getRandomItem(p.details_templates).replace("{leucos}", leucos).replace("{leads}", leads);

    const TA = getRandomItem(p.vitals.TA);
    const FC = getRandomItem(p.vitals.FC);
    const Temp = getRandomItem(p.vitals.Temp);

    const caseId = `PROC_${blueprint.id.toUpperCase()}_${index.toString().padStart(3, '0')}`;
    const mentorName = getMentorForSpecialty(caseId);

    let diffs = JSON.parse(JSON.stringify(t.differentials));
    
    const caseData = {
        case_id: caseId,
        version: "v3_swipe_action",
        theme_config: blueprint.id.split('_')[0] || "theme-default",
        difficulty: blueprint.difficulty,
        patient_intro: {
            name: `${name}, ${age} años`,
            arrival_scenario: `${bio} ${details}`.replace(/\s+/g, ' ').trim(),
            time_limit_sec: 45
        },
        card_stream: [
            {
                card_id: "init_vitals",
                ui_icon: "heartbeat",
                category: "Signos Vitales",
                card_text: `TA ${TA}, FC ${FC}, Temp ${Temp}`,
                expected_action: "discard",
                scoring: {
                    points: 50,
                    error_type: "hoarding",
                    vazquez_comment: `${mentorName}: No te detengas en signos estables, R1. El reloj no se detiene.`
                }
            }
        ],
        enarm_pearl: t.perla_enarm
    };

    // Add differentials as cards
    diffs.forEach((d, idx) => {
        const isMatch = d.is_match;
        const card = {
            card_id: `c_${idx + 1}`,
            ui_icon: isMatch ? "target" : "eye",
            category: "Diagnóstico",
            card_text: d.title + ": " + d.text,
            expected_action: isMatch ? "keep" : "discard",
            scoring: {
                points: isMatch ? 150 : 50,
                error_type: isMatch ? "omission" : "hoarding",
                vazquez_comment: `${mentorName}: ${isMatch ? (d.feedback.match || "Exacto.") : (d.feedback.discard || "Buena decisión.")}`
            }
        };

        if (d.safety_flags) {
            card.safety_flags = d.safety_flags;
            if (d.safety_flags.lethal_risk) {
                card.scoring.error_type = isMatch ? "lethal_omission" : "lethal_hazard";
                if (isMatch) card.safety_flags.lethal_if_discarded = true;
            }
        }

        caseData.card_stream.push(card);
    });

    return caseData;
}

function main() {
    const outDir = path.join(__dirname, '../cases');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    let totalGenerated = 0;
    const NUM_VARIATIONS = 15;
    const caseIndex = [];

    for (const blueprint of BLUEPRINTS) {
        for (let i = 1; i <= NUM_VARIATIONS; i++) {
            const caseData = generateCase(blueprint, i);
            const fileName = `CASE_${caseData.case_id}.json`;
            const outPath = path.join(outDir, fileName);
            fs.writeFileSync(outPath, JSON.stringify(caseData, null, 2));
            caseIndex.push(caseData.case_id);
            totalGenerated++;
        }
    }

    fs.writeFileSync(path.join(outDir, 'case_index.json'), JSON.stringify(caseIndex, null, 2));
    console.log(`\n🎉 V3 Procedural generation complete! Created ${totalGenerated} cases with Lore Mentors.`);
}

main();
