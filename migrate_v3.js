const fs = require('fs');
const path = require('path');

const casesDir = './cases';
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json') && f !== 'case_index.json');

console.log(`Migrating ${files.length} cases to v3 schema...\n`);

const CATEGORY_ICONS = {
    'diagnosis': '🧠',
    'labs': '🧪',
    'imaging': '☢️',
    'vitals': '🩺',
    'history': '📝',
    'history_fh': '👪',
    'physical': '👥',
    'meds': '💊',
    'admin': '📁'
};

files.forEach(file => {
    const filePath = path.join(casesDir, file);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (data.version === 'v3_swipe_action') {
            console.log(` - Skipping ${file} (already v3)`);
            return;
        }

        const v3 = {
            case_id: data.case_id || (data.meta && data.meta.id) || "unknown_case",
            version: "v3_swipe_action",
            theme_config: (data.case_id || (data.meta && data.meta.id) || "").includes('psych') ? "theme-psych" : ((data.case_id || (data.meta && data.meta.id) || "").includes('surg') ? "theme-surg" : "theme-default"),
            difficulty: data.difficulty || (data.meta && data.meta.difficulty) || "standard",
            patient_intro: {
                name: data.patient_profile?.name || "Paciente",
                arrival_scenario: data.patient_profile?.bio || data.patient_profile?.details || "Ingresa al servicio de urgencias.",
                time_limit_sec: 30
            },
            card_stream: [],
            boss_fight_triad: {
                trigger: "after_cards",
                questions: (data.final_triad || []).map(q => ({
                    question: q.question,
                    options: q.options,
                    correct_index: q.correct_index
                }))
            },
            perla_enarm: data.perla_enarm || {}
        };

        // Add Vitals as cards if they exist
        if (data.patient_profile?.vitals) {
            const v = data.patient_profile.vitals;
            v3.card_stream.push({
                card_id: "init_vitals",
                ui_icon: "🩺",
                category: "vitals",
                card_text: `TA ${v.TA || '?'}, FC ${v.FC || '?'}, Temp ${v.Temp || '?'}`,
                expected_action: "discard",
                scoring: {
                    points: 50,
                    error_type: "hoarding",
                    vazquez_comment: "¿Para qué guardas signos vitales normales, R1? No estamos en piso de medicina interna."
                }
            });
        }

        // Convert evidence_stream
        (data.evidence_stream || []).forEach((card, idx) => {
            const newCard = {
                card_id: card.evidence_id || `card_${idx}`,
                ui_icon: CATEGORY_ICONS[card.category] || '📄',
                category: card.category || 'Evidencia',
                card_text: card.payload?.text || "Sin descripción",
                expected_action: card.is_match ? "keep" : "discard",
                scoring: {
                    points: card.is_match ? 100 : 50,
                    error_type: card.is_match ? "omission" : "hoarding"
                }
            };

            if (card.safety_flags) {
                newCard.safety_flags = card.safety_flags;
                // v3 specialized flags
                if (card.safety_flags.lethal_risk && !card.is_match) {
                    newCard.scoring.error_type = "lethal_hazard";
                    newCard.scoring.vazquez_comment = "¡Eso era una Red Flag letal! ¡El paciente está en choque por tu culpa!";
                }
                if (card.safety_flags.lethal_risk && card.is_match) {
                     newCard.safety_flags.lethal_if_discarded = true;
                     newCard.scoring.error_type = "lethal_omission";
                     newCard.scoring.vazquez_comment = "¡Descartaste una advertencia vital! Nunca ignores signos de alarma en mi guardia.";
                }
            }

            if (card.feedback) {
                newCard.scoring.vazquez_comment = card.feedback.match || card.feedback.discard || newCard.scoring.vazquez_comment;
            }

            v3.card_stream.push(newCard);
        });

        fs.writeFileSync(filePath, JSON.stringify(v3, null, 4));
        console.log(` - Migrated ${file}`);

    } catch (e) {
        console.error(`Error migrating ${file}: ${e.message}`);
    }
});
