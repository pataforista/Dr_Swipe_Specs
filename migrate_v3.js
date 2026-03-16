const fs = require('fs');
const path = require('path');

const casesDir = './cases';
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

console.log(`🚀 Starting Lore Migration: ${files.length} cases to Anti-Triage v3 schema...\n`);

const CATEGORY_ICONS = {
    'diagnosis': '🧠',
    'labs': '🧪',
    'imaging': '☢️',
    'vitals': '🩺',
    'history': '📝',
    'history_fh': '👪',
    'physical': '👥',
    'meds': '💊',
    'admin': '📁',
    'inspección': '👁️',
    'exploración': '🧤',
    'manejo': '⚡'
};

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

function getThemeForSpecialty(caseId) {
    const cid = caseId.toLowerCase();
    if (cid.includes('psych')) return "theme-psych";
    if (cid.includes('surg')) return "theme-surg";
    if (cid.includes('ped')) return "theme-ped";
    if (cid.includes('obs') || cid.includes('gyn')) return "theme-gyn";
    return "theme-default";
}

files.forEach(file => {
    const filePath = path.join(casesDir, file);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        
        if (data.version === 'v3_swipe_action' && !process.env.FORCE) {
            return;
        }

        const case_id = data.case_id || (data.meta && data.meta.id) || "unknown_case";
        const mentorName = getMentorForSpecialty(case_id);

        const v3 = {
            case_id: case_id,
            version: "v3_swipe_action",
            theme_config: getThemeForSpecialty(case_id),
            difficulty: data.difficulty || (data.meta && data.meta.difficulty) || "standard",
            patient_intro: {
                name: data.patient_profile?.name || (data.patient_intro?.name) || "Paciente",
                arrival_scenario: (data.patient_profile?.bio || data.patient_profile?.details || data.patient_intro?.arrival_scenario || "Ingresa al servicio de urgencias.").replace(/\s+/g, ' ').trim(),
                time_limit_sec: 45
            },
            card_stream: [],
            boss_fight_triad: {
                trigger: "after_cards",
                questions: (data.boss_fight_triad?.questions || data.final_triad || []).map(q => ({
                    q: q.q || q.question,
                    options: q.options,
                    correct_index: q.correct_index
                }))
            },
            enarm_pearl: data.enarm_pearl || data.perla_enarm || {}
        };

        // 1. Initial Vitals Card (Lore flavored)
        if (data.patient_profile?.vitals) {
            const v = data.patient_profile.vitals;
            v3.card_stream.push({
                card_id: "init_vitals",
                ui_icon: "heartbeat",
                category: "Signos Vitales",
                card_text: `TA ${v.TA || '?'}, FC ${v.FC || '?'}, Temp ${v.Temp || '?'}`,
                expected_action: "discard",
                scoring: {
                    points: 50,
                    error_type: "hoarding",
                    vazquez_comment: `${mentorName}: No pierdas tiempo guardando signos estables. Enfócate en lo que está matando al paciente.`
                }
            });
        }

        // 2. Map existing stream
        const stream = data.evidence_stream || data.card_stream || [];
        stream.forEach((card, idx) => {
            const isMatch = card.is_match || card.expected_action === "keep";
            const newCard = {
                card_id: card.card_id || card.evidence_id || `c_${idx}`,
                ui_icon: card.ui_icon || CATEGORY_ICONS[card.category?.toLowerCase()] || '📄',
                category: card.category || 'Evidencia',
                card_text: card.card_text || card.payload?.text || "Sin descripción",
                expected_action: isMatch ? "keep" : "discard",
                scoring: {
                    points: isMatch ? 100 : 50,
                    error_type: isMatch ? "omission" : "hoarding",
                    vazquez_comment: (card.scoring?.vazquez_comment || card.feedback?.match || card.feedback?.discard || "Revisa tus prioridades.")
                }
            };

            // Inject mentor identity into comment if not present
            if (!newCard.scoring.vazquez_comment.includes(':')) {
                newCard.scoring.vazquez_comment = `${mentorName}: ${newCard.scoring.vazquez_comment}`;
            }

            if (card.safety_flags) {
                newCard.safety_flags = card.safety_flags;
                if (card.safety_flags.lethal_risk) {
                    newCard.scoring.error_type = isMatch ? "lethal_omission" : "lethal_hazard";
                    // If it was already a Red Flag, Navarro might take over the comment for "Choque" mode
                    if (isMatch && !newCard.scoring.vazquez_comment.includes('Navarro')) {
                        newCard.scoring.vazquez_comment = `Navarro: ¡Ignoraste una Red Flag! El paciente se nos fue. Código negro.`;
                    }
                }
            }

            v3.card_stream.push(newCard);
        });

        fs.writeFileSync(filePath, JSON.stringify(v3, null, 2));
        // console.log(` - Migrated ${file}`);

    } catch (e) {
        console.error(`❌ Error migrating ${file}: ${e.message}`);
    }
});

console.log(`\n✨ Lore Migration Complete! Mentors Mendoza, Castillo and Navarro are now on duty.`);
