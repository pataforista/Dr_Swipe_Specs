# ENGINE_SWIPE_CASE_GENERATOR_RULES_v1

## Propósito
Generar casos reproducibles para ENGINE_SWIPE a partir de tags/dominio y 2 decision_nodes del CORE,
sin inventar contenido clínico nuevo.

## Entradas del generador
- dominant_tags (lista)
- difficulty
- checkpoint_nodes (2 ids CORE)
- noise model (ENGINE_SWIPE_NOISE_MODEL_v1.json)
- dossier categories (ENGINE_SWIPE_DOSSIER_SCHEMA_v1.json)
- mode (standard|enarm)

## Salida
Un objeto que cumple ENGINE_SWIPE_CASE_INSTANCE_SCHEMA_v1.json.

## Tamaño del caso (MVP)
- total_evidence_items = 14
- target_noise_items = 5
- target_signal_items = 9

## Distribución mínima por categoría (para evitar túnel)
Al menos 4 de estas 5 categorías deben aparecer en la señal:
- vitals
- labs
- imaging
- meds
- timeline/notes

## Cobertura de tags (para mostrar el dataset)
- cada dominant_tag debe aparecer al menos 2 veces en la señal.
- incluir al menos 1 evidencia con tag secundario (no dominante) para variedad.

## Bloques ENARM (ritmo)
- dividir evidence_stream en 2 bloques: 1-6 y 7-14.
- cada bloque debe contener ≥ 2 categorías.

## Reglas de ruido (no mentir)
- El ruido es irrelevancia, duplicación, ambigüedad, desfase temporal o falsa alarma autolimitada.
- Prohibido:
  - inventar diagnósticos
  - cambiar valores críticos de seguridad
  - generar contradicciones explícitas con señal crítica

## Regla explícita de seguridad (prioridad máxima)
Si evidence.safety_flags contiene cualquier true:
- contraindication
- lethal_risk
- decision_critical
Entonces:
- noise_type debe ser "none"
- tags no pueden degradarse a ruido
- no puede ser duplicate ni delayed_result

## Duplicados
- duplicate solo puede referir a evidencia previa de la misma categoría/payload (mismo texto o mismo título).
- duplicate cuenta como ruido.

## Delayed_result
- delayed_result debe ser verdadero pero “llega tarde”.
- No se permite delayed_result en evidencia con safety_flags true.

## False_alarm
- false_alarm representa un evento alarmante autolimitado que no modifica elegibilidad del checkpoint.
- No se permite false_alarm si podría cambiar contraindicación o letalidad.

## Ruido ENARM (distractores activos)
- ruido_blanco: datos normales, familiares o irrelevantes.
- ruido_trampa: datos que sugieren diagnóstico alterno frecuente.
- ruido_trampa debe ser descartable sin contradecir safety_flags.

## Orden del stream
- Por defecto: mixed (mezclar señal y ruido).
- Checkpoint 1: después de 6 evidencias (índice 5).
- Checkpoint 2: al final (índice 13).

## Highlight targets (ENARM)
- cada evidencia puede incluir 0..n segmentos objetivo.
- señal debe tener ≥ 1 highlight_target.
- ruido debe tener 0 highlight_target.

## Checkpoint sindromático (ENARM)
- generar pregunta de síndrome al final del bloque 1.
- incluir required_evidence_ids (segmentos clave).
- si falla, habilitar pista de evidencia omitida.

## Tríada final (ENARM)
- generar 3 preguntas: diagnóstico, estudio de elección, tratamiento inicial.
- marcar evidencias críticas (ej. alergias) como required_evidence_ids.

## Compatibilidad con scoring
- Asegurar suficiente “basura guardable” para que exista hoarding.
- Asegurar señal suficiente para que exista safe_prioritization.

## Criterio de cierre
Un caso generado debe:
- cumplir schema
- contener exactamente 14 evidencias
- contener exactamente 5 ruidos (según difficulty/modelo)
- respetar safety_rule sin excepciones
