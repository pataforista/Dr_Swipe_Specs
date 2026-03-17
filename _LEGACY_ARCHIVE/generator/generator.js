import { validateCase, logValidationResult } from '../js/validate_case.js';

const STATE = {
    coreData: [],
    domains: new Set()
};

async function loadCoreData() {
    try {
        const response = await fetch('../data/CORE_UNIFIED.jsonl');
        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();

        const lines = text.split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const node = JSON.parse(line);
                STATE.coreData.push(node);
                if (node.domain) STATE.domains.add(node.domain);
            } catch (e) {
                console.warn('Skipped invalid JSONL line');
            }
        }

        const domainSelect = document.getElementById('domain');
        domainSelect.innerHTML = '';
        STATE.domains.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = formatDomain(d);
            domainSelect.appendChild(opt);
        });

        domainSelect.disabled = false;
        document.getElementById('btn-generate').disabled = false;
        document.getElementById('status-msg').textContent = `✅ Cargados ${STATE.coreData.length} nodos desde CORE_UNIFIED.`;
        document.getElementById('status-msg').className = 'status success';
    } catch (error) {
        document.getElementById('status-msg').textContent = `❌ Error cargando base de datos: ${error.message}`;
        document.getElementById('status-msg').className = 'status error';
    }
}

function formatDomain(d) {
    return d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

document.getElementById('btn-generate').addEventListener('click', generateCase);
document.getElementById('btn-copy').addEventListener('click', () => {
    const area = document.getElementById('output-area');
    area.select();
    document.execCommand('copy');
    alert('JSON copiado al portapapeles');
});

document.getElementById('btn-play').addEventListener('click', () => {
    const jsonStr = document.getElementById('output-area').value;
    if (!jsonStr) {
        alert("Genera un caso primero.");
        return;
    }
    try {
        const caseObj = JSON.parse(jsonStr);

        // ── Validar antes de enviar al engine ────────────────────────────
        const validation = validateCase(caseObj);
        if (!validation.valid) {
            const errList = validation.errors.slice(0, 5).join('\n• ');
            const more = validation.errors.length > 5 ? `\n... y ${validation.errors.length - 5} más.` : '';
            alert(
                `⚠️ Este caso tiene ${validation.errors.length} error(es) clínico(s) y no puede jugarse:\n\n• ${errList}${more}\n\nRevisa la consola para el detalle completo.`
            );
            return;
        }
        // ────────────────────────────────────────────────────────────────

        sessionStorage.setItem('PROCEDURAL_CASE', JSON.stringify(caseObj));
        window.open('../index.html?mode=procedural', '_blank');
    } catch (e) {
        alert("JSON inválido");
    }
});

function generateCase() {
    const domain = document.getElementById('domain').value;
    const difficulty = document.getElementById('difficulty').value;
    const caseCodeInput = document.getElementById('caseCode').value || `PROC_${Date.now().toString().slice(-5)}`;

    const domainNodes = STATE.coreData.filter(n => n.domain === domain);
    if (domainNodes.length < 2) {
        alert("No hay suficientes nodos en este dominio para generar un caso.");
        return;
    }

    // Pick 2 random nodes
    const node1 = domainNodes[Math.floor(Math.random() * domainNodes.length)];
    let node2 = domainNodes[Math.floor(Math.random() * domainNodes.length)];
    while (node2.id === node1.id && domainNodes.length > 1) {
        node2 = domainNodes[Math.floor(Math.random() * domainNodes.length)];
    }

    // Generate evidence stream (14 cards: 9 signal, 5 noise)
    const evidenceStream = buildEvidenceStream(node1, node2, difficulty);

    const caseInstance = {
        schema_version: "1.0",
        case_id: caseCodeInput,
        difficulty: difficulty,
        mode: "enarm",
        case_meta: {
            patient_code: "PAC-" + Math.floor(Math.random() * 9000 + 1000),
            age: Math.floor(Math.random() * 50 + 20),
            sex: Math.random() > 0.5 ? "M" : "F",
            chief_complaint: node1.tema || "Consulta general",
            enarm_specialty: formatDomain(domain)
        },
        evidence_stream: evidenceStream,
        checkpoint_triggers: [
            { after_evidence_index: 5, checkpoint_sequence: 1 }
        ],
        checkpoint_quizzes: [
            {
                checkpoint_sequence: 1,
                type: "syndrome",
                question: node1.enunciado,
                options: node1.opciones.map(o => o.texto),
                correct_index: node1.opciones.findIndex(o => o.resultado === 'correcto'),
                required_evidence_ids: [evidenceStream[2].evidence_id]
            }
        ],
        final_triad: buildTriad(node2),
        perla_enarm: {
            title: node2.subtema || "Perla Clínica",
            text: "Recuerda siempre priorizar la clínica y los signos de alarma antes de solicitar estudios de gabinete.",
            gpc_ref: node2.fuentes?.[0] || "Guía de Práctica Clínica"
        },
        synergy_rules: []
    };

    const jsonStr = JSON.stringify(caseInstance, null, 2);
    document.getElementById('output-area').value = jsonStr;

    // ── Validar el caso generado ───────────────────────────────────────────
    const validation = validateCase(caseInstance);
    logValidationResult(validation);
    _renderValidationBadge(validation);
}

function buildTriad(node) {
    // Attempt to parse options into Triad if possible, or fallback to generic
    return [
        {
            type: "diagnosis",
            question: node.enunciado || "¿Diagnóstico más probable?",
            options: node.opciones.map(o => o.texto),
            correct_index: node.opciones.findIndex(o => o.resultado === 'correcto') !== -1 ? node.opciones.findIndex(o => o.resultado === 'correcto') : 0
        },
        {
            type: "gold_standard",
            question: "¿Estudio de elección confirmatorio?",
            options: ["Biopsia", "TAC con contraste", "RM", "Ultrasonido Doppler"],
            correct_index: 0
        },
        {
            type: "treatment",
            question: "¿Tratamiento inicial de primera línea?",
            options: ["Soporte vital", "Cirugía urgente", "Manejo conservador", "Antibioticoterapia de amplio espectro"],
            correct_index: 0
        }
    ];
}

function buildEvidenceStream(node1, node2, difficulty) {
    const stream = [];
    const categories = ['vitals', 'labs', 'imaging', 'meds', 'timeline'];

    // 9 signals
    for (let i = 0; i < 9; i++) {
        stream.push({
            evidence_id: `ev_signal_${i}`,
            category: categories[i % categories.length],
            is_signal: true,
            payload: {
                title: `Hallazgo Clínico ${i + 1}`,
                text: i === 0 ? (node1.enunciado.split('.')[0] + '.') : `Dato relevante de ${categories[i % categories.length]} relacionado con ${node1.subtema || node1.tema}.`
            },
            tags: [node1.tema.toLowerCase().replace(/\s/g, '_')],
            safety_flags: { lethal_risk: false, contraindication: false, decision_critical: i === 2 }
        });
    }

    // 5 noise
    const noiseTypes = getDifficultyNoise(difficulty);
    for (let i = 0; i < 5; i++) {
        stream.push({
            evidence_id: `ev_noise_${i}`,
            category: i % 2 === 0 ? 'admin' : categories[Math.floor(Math.random() * categories.length)],
            is_signal: false,
            noise_type: noiseTypes[i],
            payload: {
                title: `Dato Distractor ${i + 1}`,
                text: `Información contextual tipo: ${noiseTypes[i]}. No debería alterar la decisión central.`
            },
            tags: ['distractor']
        });
    }

    // Shuffle
    for (let i = stream.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [stream[i], stream[j]] = [stream[j], stream[i]];
    }

    return stream;
}

function getDifficultyNoise(diff) {
    if (diff === 'easy') return ['irrelevant_true', 'duplicate', 'borderline', 'delayed_result', 'irrelevant_true'];
    if (diff === 'standard') return ['duplicate', 'false_alarm', 'borderline', 'delayed_result', 'irrelevant_true'];
    return ['false_alarm', 'false_alarm', 'duplicate', 'delayed_result', 'borderline'];
}

// ─── Validation Badge UI ──────────────────────────────────────────────────────

function _renderValidationBadge(validation) {
    const badge = document.getElementById('validation-badge');
    if (!badge) return;

    badge.className = '';
    badge.style.display = 'block';

    const { valid, errors, warnings, summary } = validation;

    if (!valid) {
        badge.classList.add('invalid');
        const errItems = errors.map(e => `<li>${e}</li>`).join('');
        badge.innerHTML = `
            <strong>❌ Caso inválido — ${errors.length} error(es) crítico(s)</strong>
            <ul>${errItems}</ul>
            ${warnings.length > 0 ? `<small>+ ${warnings.length} advertencia(s) — ver consola.</small>` : ''}
            <br><small>Este caso <strong>no puede jugarse</strong> hasta que se corrijan los errores.</small>
        `;
    } else if (warnings.length > 0) {
        badge.classList.add('warnings');
        const warnItems = warnings.slice(0, 5).map(w => `<li>${w}</li>`).join('');
        const more = warnings.length > 5 ? `<li>... y ${warnings.length - 5} más (ver consola)</li>` : '';
        badge.innerHTML = `
            <strong>🟡 Schema válido con ${warnings.length} advertencia(s)</strong>
            <ul>${warnItems}${more}</ul>
            <small>El caso puede jugarse pero tiene áreas de mejora.</small>
        `;
    } else {
        badge.classList.add('valid');
        badge.innerHTML = `
            <strong>✅ Caso íntegro</strong> — ${summary.signal_count} señales · ${summary.noise_count} ruidos · 0 errores
        `;
    }
}

// Init
window.onload = loadCoreData;
