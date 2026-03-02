const fs = require('fs');
const path = require('path');

function reconstructUnified() {
    const canonDir = path.join(__dirname, 'CORE_CANON');
    const indexPath = path.join(canonDir, 'CORE_INDEX.jsonl');
    const dataDir = path.join(__dirname, 'data');
    const outputPath = path.join(dataDir, 'CORE_UNIFIED.jsonl');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(indexPath)) {
        console.error(`Error: Index not found at ${indexPath}`);
        return;
    }

    const unifiedLines = [];
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const indexLines = indexContent.split('\n');

    for (let i = 0; i < indexLines.length; i++) {
        const line = indexLines[i].trim();
        if (!line) continue;

        let indexEntry;
        try {
            indexEntry = JSON.parse(line);
        } catch (e) {
            console.error(`Error parsing index line ${i + 1}:`, e);
            continue;
        }

        const domain = indexEntry.domain || 'unknown';
        const topic = indexEntry.topic || 'unknown';
        const relPath = indexEntry.path;
        if (!relPath) continue;

        const absPath = path.join(canonDir, relPath);

        if (!fs.existsSync(absPath)) {
            console.warn(`Warning: File not found ${absPath}`);
            continue;
        }

        console.log(`Reading ${absPath}...`);
        try {
            const content = fs.readFileSync(absPath, 'utf-8').trim();
            if (!content) {
                console.log(`Empty file: ${absPath}`);
                continue;
            }

            let nodes = [];
            try {
                const data = JSON.parse(content);
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    nodes = data.nodes || [];
                } else if (Array.isArray(data)) {
                    nodes = data;
                }
            } catch (e) {
                // Try to parse as JSONL
                const fileLines = content.split('\n');
                for (const l of fileLines) {
                    if (l.trim()) {
                        try {
                            nodes.push(JSON.parse(l));
                        } catch (err) {
                            // ignore
                        }
                    }
                }
            }

            for (const node of nodes) {
                if (!node || typeof node !== 'object') continue;

                const unifiedNode = {
                    schema: "core_unified_v1",
                    id: node.id,
                    domain: domain,
                    topic: topic,
                    source_path: relPath,
                    source_version: node.version,
                    tema: node.tema,
                    subtema: node.subtema,
                    enunciado: node.enunciado || node.prompt || node.pregunta,
                    escenario: node.escenario || null,
                    tipo_decision: node.tipo_decision,
                    opciones: [],
                    respuesta_correcta: node.respuesta_correcta || null,
                    justificacion: node.justificacion || null,
                    letal_si_falla: node.letal_si_falla || null,
                    dificultad: node.dificultad || null,
                    tags: node.tags || null,
                    fuentes: node.fuentes || [],
                    original: node,
                    extras: {}
                };

                const rawOpciones = node.opciones || node.options;
                if (rawOpciones) {
                    if (Array.isArray(rawOpciones)) {
                        for (const opt of rawOpciones) {
                            unifiedNode.opciones.push({
                                id: opt.id,
                                texto: opt.texto || opt.text,
                                resultado: opt.resultado || opt.outcome,
                                impacto: opt.impacto || opt.impact
                            });
                        }
                    } else if (typeof rawOpciones === 'object') {
                        for (const [k, v] of Object.entries(rawOpciones)) {
                            const resultado = (k === node.respuesta_correcta) ? "correcto" : null;
                            unifiedNode.opciones.push({
                                id: k,
                                texto: v,
                                resultado: resultado,
                                impacto: null
                            });
                        }
                    }
                }

                unifiedLines.push(JSON.stringify(unifiedNode));
            }
        } catch (e) {
            console.error(`Error processing ${absPath}:`, e);
        }
    }

    fs.writeFileSync(outputPath, unifiedLines.join('\n') + '\n', 'utf-8');
    console.log(`Successfully created ${outputPath} with ${unifiedLines.length} nodes using UTF-8 encoding.`);
}

reconstructUnified();
