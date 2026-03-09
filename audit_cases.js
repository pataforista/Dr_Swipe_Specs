const fs = require('fs');
const path = require('path');

const CASES_DIR = './cases';

function auditCase(filePath) {
    const fileName = path.basename(filePath);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const version = data.version || 'v1';

        console.log(`\n--- Auditing: ${fileName} (${version}) ---`);

        // Common Checks
        if (!data.case_id) console.error(`[ERR] Missing case_id`);
        if (!data.evidence_stream || !Array.isArray(data.evidence_stream)) {
            console.error(`[ERR] Missing or invalid evidence_stream`);
            return;
        }

        if (version === 'v1') {
            auditV1(data);
        } else if (version === 'v2') {
            auditV2(data);
        } else {
            console.warn(`[WARN] Unknown version: ${version}`);
        }

    } catch (e) {
        console.error(`[ERR] Failed to parse ${fileName}: ${e.message}`);
    }
}

function auditV1(data) {
    // Check Noise Budget
    if (!data.noise_budget) {
        console.warn(`[WARN] V1 case missing noise_budget`);
    }

    // Check Signals
    const signals = data.evidence_stream.filter(e => e.is_signal === true);
    if (signals.length === 0) console.warn(`[WARN] No signal items found in V1 stream`);

    // Check Checkpoints
    if (!data.checkpoint_quizzes || data.checkpoint_quizzes.length === 0) {
        console.warn(`[WARN] No checkpoint quizzes found`);
    }
}

function auditV2(data) {
    // Check Patient Profile
    if (!data.patient_profile) {
        console.error(`[ERR] V2 case missing patient_profile`);
    } else {
        const profile = data.patient_profile;
        if (!profile.name || !profile.bio) console.error(`[ERR] Incomplete patient_profile`);
    }

    // Check Differentials
    const differentials = data.evidence_stream.filter(e => e.type === 'differential');
    if (differentials.length === 0) console.error(`[ERR] V2 case has no differentials`);

    differentials.forEach((diff, idx) => {
        if (diff.is_match === undefined) console.error(`[ERR] Differential ${idx} missing is_match`);
        if (!diff.feedback || !diff.feedback.match || !diff.feedback.discard) {
            console.warn(`[WARN] Differential ${idx} missing feedback (match/discard)`);
        }
        if (diff.safety_flags?.lethal_risk) {
            console.log(`[INFO] Lethal risk (Red Flag) identified in: ${diff.payload.title}`);
        }
    });

    if (!data.perla_enarm) console.warn(`[WARN] Missing perla_enarm metadata`);
}

// Run Audit
if (fs.existsSync(CASES_DIR)) {
    const files = fs.readdirSync(CASES_DIR).filter(f => f.endsWith('.json'));
    files.forEach(f => auditCase(path.join(CASES_DIR, f)));
} else {
    console.error(`Directory not found: ${CASES_DIR}`);
}
