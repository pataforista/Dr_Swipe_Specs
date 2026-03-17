/**
 * validate_case.js — ENGINE_SWIPE_CASE_VALIDATOR_v1
 *
 * Valida la integridad de un caso antes de cargarlo o jugarlo.
 * Aplica las reglas de ENGINE_SWIPE_CASE_GENERATOR_RULES_v1.md
 * y ENGINE_SWIPE_NOISE_MODEL_v1.json.
 *
 * Uso:
 *   import { validateCase } from './validate_case.js';
 *   const result = validateCase(caseData);
 *   if (!result.valid) console.error(result.errors);
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(['vitals', 'labs', 'imaging', 'meds', 'timeline', 'notes', 'admin']);
const SIGNAL_CATEGORIES = new Set(['vitals', 'labs', 'imaging', 'meds', 'timeline', 'notes']);
const VALID_NOISE_TYPES = new Set(['none', 'irrelevant_true', 'borderline', 'duplicate', 'delayed_result', 'false_alarm']);
const VALID_NOISE_CLASS = new Set(['none', 'ruido_blanco', 'ruido_trampa']);
const VALID_TRIAD_TYPES = new Set(['diagnosis', 'gold_standard', 'treatment']);
const VALID_DIFFICULTIES = new Set(['easy', 'standard', 'hard']);
const VALID_MODES = new Set(['standard', 'enarm']);

const EXPECTED_TOTAL = 14;
const EXPECTED_SIGNAL = 9;
const EXPECTED_NOISE = 5;
const MIN_SIGNAL_CATS = 4; // al menos 4 de 5 categorías clínicas
const REQUIRED_SIGNAL_CATS = ['vitals', 'labs', 'imaging', 'meds', 'timeline'];

// ─── Validador principal ───────────────────────────────────────────────────────

/**
 * Valida un objeto de caso Dr. Swipe.
 * @param {Object} caseData - El objeto JSON del caso.
 * @returns {{ valid: boolean, errors: string[], warnings: string[], summary: Object }}
 */
export function validateCase(caseData) {
    const errors = [];
    const warnings = [];

    if (!caseData || typeof caseData !== 'object') {
        return { valid: false, errors: ['El caso no es un objeto válido.'], warnings, summary: {} };
    }

    // ── 1. Campos de cabecera ─────────────────────────────────────────────────
    _checkHeader(caseData, errors, warnings);

    // ── 2. evidence_stream ───────────────────────────────────────────────────
    const stream = caseData.evidence_stream;
    if (!Array.isArray(stream)) {
        errors.push('[stream] evidence_stream debe ser un array.');
    } else {
        _checkStreamCounts(caseData, stream, errors);
        _checkEachEvidence(stream, errors, warnings);
        _checkCategoryDistribution(stream, errors, warnings);
        _checkHighlightTargets(stream, warnings);
        _checkSafetyRule(stream, errors);
        _checkDuplicateRule(stream, warnings);
        _checkBlockDistribution(stream, warnings);
    }

    // ── 3. checkpoint_quizzes ────────────────────────────────────────────────
    _checkCheckpoints(caseData, stream, errors, warnings);

    // ── 4. final_triad ───────────────────────────────────────────────────────
    _checkFinalTriad(caseData, stream, errors, warnings);

    // ── 5. perla_enarm ───────────────────────────────────────────────────────
    _checkPerla(caseData, warnings);

    // ─── Resumen ──────────────────────────────────────────────────────────────
    const signalItems = Array.isArray(stream) ? stream.filter(e => e.is_signal) : [];
    const noiseItems = Array.isArray(stream) ? stream.filter(e => !e.is_signal) : [];

    const summary = {
        case_id: caseData.case_id || '(sin id)',
        difficulty: caseData.difficulty || '(sin dificultad)',
        total_evidence: Array.isArray(stream) ? stream.length : 0,
        signal_count: signalItems.length,
        noise_count: noiseItems.length,
        errors_found: errors.length,
        warnings_found: warnings.length,
    };

    return { valid: errors.length === 0, errors, warnings, summary };
}

// ─── Reglas individuales (privado) ────────────────────────────────────────────

function _checkHeader(c, errors, warnings) {
    if (!c.case_id) errors.push('[header] Falta case_id.');
    if (!c.mode || !VALID_MODES.has(c.mode))
        errors.push(`[header] mode inválido: "${c.mode}". Válidos: ${[...VALID_MODES].join(', ')}.`);
    if (!c.difficulty || !VALID_DIFFICULTIES.has(c.difficulty))
        errors.push(`[header] difficulty inválido: "${c.difficulty}". Válidos: ${[...VALID_DIFFICULTIES].join(', ')}.`);
    if (!c.case_meta)
        warnings.push('[header] Falta case_meta (paciente, queja principal).');
    if (!Array.isArray(c.checkpoint_triggers) || c.checkpoint_triggers.length === 0)
        warnings.push('[header] No hay checkpoint_triggers definidos.');
}

function _checkStreamCounts(caseData, stream, errors) {
    const signalCount = stream.filter(e => e.is_signal).length;
    const noiseCount = stream.filter(e => !e.is_signal).length;

    const targetNoise = caseData.noise_budget?.target_noise_items ?? EXPECTED_NOISE;
    const expectedSignal = stream.length - targetNoise;

    if (noiseCount !== targetNoise)
        errors.push(`[stream.noise] Se esperan exactamente ${targetNoise} ruidos según budget, encontrados: ${noiseCount}.`);

    if (signalCount !== expectedSignal)
        errors.push(`[stream.signal] Para ${stream.length} ítems y ${targetNoise} ruidos, se esperan ${expectedSignal} señales, encontradas: ${signalCount}.`);
}

function _checkEachEvidence(stream, errors, warnings) {
    const ids = new Set();

    stream.forEach((ev, i) => {
        const prefix = `[ev[${i}] id="${ev.evidence_id || '?'}"]`;

        // ID único
        if (!ev.evidence_id) {
            errors.push(`${prefix} Falta evidence_id.`);
        } else if (ids.has(ev.evidence_id)) {
            errors.push(`${prefix} evidence_id duplicado: "${ev.evidence_id}".`);
        } else {
            ids.add(ev.evidence_id);
        }

        // category
        if (!ev.category || !VALID_CATEGORIES.has(ev.category))
            errors.push(`${prefix} category inválida: "${ev.category}".`);

        // payload
        if (!ev.payload || !ev.payload.title || !ev.payload.text)
            errors.push(`${prefix} payload incompleto (requiere title y text).`);

        // is_signal
        if (typeof ev.is_signal !== 'boolean')
            errors.push(`${prefix} is_signal debe ser booleano.`);

        // noise_type
        if (!VALID_NOISE_TYPES.has(ev.noise_type))
            warnings.push(`${prefix} noise_type inválido o ausente: "${ev.noise_type}".`);

        // noise_class (solo en ruido)
        if (!ev.is_signal) {
            if (!VALID_NOISE_CLASS.has(ev.noise_class))
                warnings.push(`${prefix} noise_class inválido o ausente en ruido: "${ev.noise_class}".`);
            if (ev.noise_type === 'none')
                errors.push(`${prefix} El ruido (is_signal=false) no puede tener noise_type="none".`);
        }

        // signal debe tener noise_type="none"
        if (ev.is_signal && ev.noise_type !== 'none')
            errors.push(`${prefix} La señal no puede tener noise_type diferente de "none".`);

        // tags
        if (!Array.isArray(ev.tags) || ev.tags.length === 0)
            warnings.push(`${prefix} tags vacío o ausente.`);

        // safety_flags estructura mínima
        if (!ev.safety_flags || typeof ev.safety_flags !== 'object')
            errors.push(`${prefix} Falta safety_flags.`);
    });
}

function _checkCategoryDistribution(stream, errors, warnings) {
    const signalCats = new Set(
        stream.filter(e => e.is_signal).map(e => e.category)
    );
    const clinicalSignalCats = REQUIRED_SIGNAL_CATS.filter(c => signalCats.has(c));

    if (clinicalSignalCats.length < MIN_SIGNAL_CATS) {
        const missing = REQUIRED_SIGNAL_CATS.filter(c => !signalCats.has(c));
        warnings.push(
            `[distribution] Solo ${clinicalSignalCats.length}/${MIN_SIGNAL_CATS} categorías clínicas representadas en señal. ` +
            `Faltantes: ${missing.join(', ')}.`
        );
    }
}

function _checkHighlightTargets(stream, warnings) {
    stream.forEach((ev, i) => {
        const prefix = `[ev[${i}] id="${ev.evidence_id || '?'}"]`;

        if (ev.is_signal) {
            // señal debe tener ≥1 highlight_target
            if (!Array.isArray(ev.highlight_targets) || ev.highlight_targets.length === 0)
                warnings.push(`${prefix} Señal sin highlight_targets. Se recomienda ≥1 segmento subrayable.`);
        } else {
            // ruido no debe tener highlight_targets
            if (Array.isArray(ev.highlight_targets) && ev.highlight_targets.length > 0)
                warnings.push(`${prefix} Ruido con highlight_targets. El ruido no debería ser subrayable.`);
        }
    });
}

function _checkSafetyRule(stream, errors) {
    stream.forEach((ev, i) => {
        const prefix = `[SAFETY ev[${i}] id="${ev.evidence_id || '?'}"]`;
        const sf = ev.safety_flags;
        if (!sf) return;

        const isCritical = sf.contraindication || sf.lethal_risk || sf.decision_critical;

        if (isCritical) {
            if (!ev.is_signal)
                errors.push(`${prefix} VIOLACIÓN DE SAFETY RULE: evidencia de seguridad crítica marcada como ruido.`);
            if (ev.noise_type && ev.noise_type !== 'none')
                errors.push(`${prefix} VIOLACIÓN DE SAFETY RULE: evidencia crítica tiene noise_type="${ev.noise_type}".`);
            if (ev.noise_type === 'duplicate' || ev.noise_type === 'delayed_result')
                errors.push(`${prefix} VIOLACIÓN DE SAFETY RULE: evidencia crítica no puede ser duplicate/delayed_result.`);
        }
    });
}

function _checkDuplicateRule(stream, warnings) {
    stream.forEach((ev, i) => {
        if (ev.noise_type !== 'duplicate') return;
        const prefix = `[ev[${i}] id="${ev.evidence_id || '?'}"]`;

        // Verificar que exista una evidencia previa con la misma categoría
        const prevSameCategory = stream.slice(0, i).some(prev => prev.category === ev.category);
        if (!prevSameCategory)
            warnings.push(`${prefix} duplicate sin evidencia previa de la misma categoría "${ev.category}".`);
    });
}

function _checkBlockDistribution(stream, warnings) {
    // El bloque 1 debe tener ≥2 categorías
    const block1 = stream.filter(e => e.block_index === 1);
    const block2 = stream.filter(e => e.block_index === 2);

    if (block1.length > 0) {
        const block1Cats = new Set(block1.map(e => e.category));
        if (block1Cats.size < 2)
            warnings.push(`[blocks] Bloque 1 tiene solo ${block1Cats.size} categoría(s). Se requieren ≥2.`);
    }
    if (block2.length > 0) {
        const block2Cats = new Set(block2.map(e => e.category));
        if (block2Cats.size < 2)
            warnings.push(`[blocks] Bloque 2 tiene solo ${block2Cats.size} categoría(s). Se requieren ≥2.`);
    }
}

function _checkCheckpoints(caseData, stream, errors, warnings) {
    if (!Array.isArray(caseData.checkpoint_quizzes)) {
        warnings.push('[checkpoints] checkpoint_quizzes ausente o vacío.');
        return;
    }

    caseData.checkpoint_quizzes.forEach((cp, i) => {
        const prefix = `[checkpoint[${i}] seq=${cp.checkpoint_sequence ?? '?'}]`;

        if (!cp.question) errors.push(`${prefix} Falta question.`);
        if (!Array.isArray(cp.options) || cp.options.length < 2)
            errors.push(`${prefix} options debe tener ≥2 opciones.`);

        // correct_index o correct
        const hasCorrectIndex = typeof cp.correct_index === 'number';
        const hasCorrect = typeof cp.correct === 'string';
        if (!hasCorrectIndex && !hasCorrect)
            errors.push(`${prefix} Falta correct_index o correct.`);
        if (hasCorrectIndex && Array.isArray(cp.options) && cp.correct_index >= cp.options.length)
            errors.push(`${prefix} correct_index=${cp.correct_index} fuera de rango (${cp.options.length} opciones).`);

        // required_evidence_ids apuntan a evidencias reales
        if (Array.isArray(cp.required_evidence_ids) && Array.isArray(stream)) {
            const validIds = new Set(stream.map(e => e.evidence_id));
            cp.required_evidence_ids.forEach(eid => {
                if (!validIds.has(eid))
                    errors.push(`${prefix} required_evidence_ids referencia ID inexistente: "${eid}".`);
            });
        }
    });
}

function _checkFinalTriad(caseData, stream, errors, warnings) {
    if (!Array.isArray(caseData.final_triad) || caseData.final_triad.length === 0) {
        errors.push('[triad] final_triad ausente o vacío.');
        return;
    }

    if (caseData.final_triad.length !== 3)
        warnings.push(`[triad] Se esperan exactamente 3 preguntas en la tríada, hay ${caseData.final_triad.length}.`);

    const types = caseData.final_triad.map(q => q.type);
    ['diagnosis', 'gold_standard', 'treatment'].forEach(t => {
        if (!types.includes(t)) warnings.push(`[triad] Falta pregunta de tipo "${t}".`);
    });

    caseData.final_triad.forEach((q, i) => {
        const prefix = `[triad[${i}] type="${q.type ?? '?'}"]`;

        if (!q.type || !VALID_TRIAD_TYPES.has(q.type))
            warnings.push(`${prefix} type inválido: "${q.type}".`);
        if (!q.question) errors.push(`${prefix} Falta question.`);
        if (!Array.isArray(q.options) || q.options.length < 2)
            errors.push(`${prefix} options debe tener ≥2 opciones.`);

        const hasCorrectIndex = typeof q.correct_index === 'number';
        const hasCorrect = typeof q.correct === 'string';
        if (!hasCorrectIndex && !hasCorrect)
            errors.push(`${prefix} Falta correct_index o correct.`);

        if (!Array.isArray(q.required_evidence_ids) || q.required_evidence_ids.length === 0)
            warnings.push(`${prefix} Sin required_evidence_ids — el scoring de priorización no puede verificar integridad.`);

        // Verificar IDs
        if (Array.isArray(q.required_evidence_ids) && Array.isArray(stream)) {
            const validIds = new Set(stream.map(e => e.evidence_id));
            q.required_evidence_ids.forEach(eid => {
                if (!validIds.has(eid))
                    errors.push(`${prefix} required_evidence_ids referencia ID inexistente: "${eid}".`);
            });
        }
    });
}

function _checkPerla(caseData, warnings) {
    const p = caseData.perla_enarm;
    if (!p) {
        warnings.push('[perla] perla_enarm ausente.');
        return;
    }
    if (!p.title) warnings.push('[perla] perla_enarm.title ausente.');
    if (!p.text) warnings.push('[perla] perla_enarm.text ausente.');
    if (!p.gpc_ref) warnings.push('[perla] perla_enarm.gpc_ref ausente (sin referencia GPC).');
}

// ─── Logger para consola ───────────────────────────────────────────────────────

/**
 * Imprime el resultado de validación en la consola con formato legible.
 * @param {{ valid: boolean, errors: string[], warnings: string[], summary: Object }} result
 */
export function logValidationResult(result) {
    const { valid, errors, warnings, summary } = result;
    const icon = valid ? '✅' : '❌';

    console.group(`${icon} [validate_case] Caso: ${summary.case_id} | ${summary.difficulty}`);
    console.log(`  Total evidencias : ${summary.total_evidence} (señal: ${summary.signal_count}, ruido: ${summary.noise_count})`);
    console.log(`  Errores  críticos: ${summary.errors_found}`);
    console.log(`  Advertencias     : ${summary.warnings_found}`);

    if (errors.length > 0) {
        console.group('  🔴 ERRORES');
        errors.forEach(e => console.error('  ', e));
        console.groupEnd();
    }
    if (warnings.length > 0) {
        console.group('  🟡 ADVERTENCIAS');
        warnings.forEach(w => console.warn('  ', w));
        console.groupEnd();
    }
    console.groupEnd();
}
