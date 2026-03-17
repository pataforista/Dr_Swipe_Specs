# ENGINE_SWIPE_RUNTIME_STUB_v1

## Objetivo
Proveer funciones deterministas para:
- calcular métricas (kept_ratio, category_coverage)
- activar patrones usando ENGINE_SWIPE_PATTERN_THRESHOLDS_v1.json
- construir feedback sistémico según ENGINE_SWIPE_FEEDBACK_SPEC_v1.md
- emitir telemetría según ENGINE_SWIPE_TELEMETRY_SCHEMA_v1.json

Estas funciones NO leen clínica ni texto del CORE.

---

## Tipos mínimos

result_event ∈ { "success", "fail", "fail_lethal" }

category ∈ { "timeline","vitals","labs","imaging","meds","notes" }

---

## Pseudocódigo (JS/TS style)

### computeKeptRatio(totalItems, keptItems)
- return keptItems / max(totalItems, 1)

### computeCategoryCoverage(keptEvidence[])
- set = categorías únicas en keptEvidence
- return set.size

### evaluatePatterns(thresholds, metrics, context)
Inputs:
- thresholds: ENGINE_SWIPE_PATTERN_THRESHOLDS_v1.json
- metrics: { kept_ratio, total_items, category_coverage, avg_time_per_item_ms, pause_count }
- context: { checkpoint1_result_event }

Output:
- pattern_metrics: { hoarding, clean_dossier, tunnel_vision, safe_prioritization, delay }

Rule:
- Para cada patrón:
  - aplicar trigger_if (comparaciones gte/lte, min_total_items, etc.)
  - si falta un campo, el patrón no se activa (fail closed)

### buildFeedback(resultEvent, patternMetrics, evidenceMetrics)
Output:
- feedback_lines[] (máx 3 líneas)

Reglas:
1) Primera línea: consecuencia sistémica del checkpoint
   - success: "La decisión se ejecutó con la información disponible."
   - fail: "La información conservada fue insuficiente para esta decisión."
   - fail_lethal: "El sistema no pudo amortiguar un evento crítico."
2) Segunda línea: patrón dominante (si existe), en formato:
   "Patrón detectado: <etiqueta>."
   Dominante sugerido por prioridad:
   fail_lethal > tunnel_vision > hoarding > delay > clean_dossier > safe_prioritization
3) Tercera línea (opcional): comparación interna mínima:
   "Conservaste X de Y elementos."

Nunca mencionar evidencia específica.

### buildTelemetry(sessionContext)
Inputs mínimos:
- timestamps start/end
- case_id, difficulty
- evidence_metrics (conteos)
- checkpoint_metrics (result_event + time_to_checkpoint_ms)
- pattern_metrics
- timing_metrics
- ui_context

Output:
- objeto que cumple ENGINE_SWIPE_TELEMETRY_SCHEMA_v1.json

---

## Criterio de cierre
- Con un CASE_INSTANCE + una simulación de swipes, estas funciones deben producir:
  - pattern_metrics determinista
  - feedback_lines conforme a spec (sin clínica)
  - telemetry conforme a schema
