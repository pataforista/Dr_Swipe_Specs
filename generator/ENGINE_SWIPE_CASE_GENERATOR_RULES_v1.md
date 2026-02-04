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

## Salida
Un objeto que cumple ENGINE_SWIPE_CASE_INSTANCE_SCHEMA_v1.json.

## Tamaño del caso (MVP)
- total_evidence_items = 10
- target_noise_items = 3
- target_signal_items = 7

## Distribución mínima por categoría (para evitar túnel)
Al menos 4 de estas 5 categorías deben aparecer en la señal:
- vitals
- labs
- imaging
- meds
- timeline/notes

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

## Orden del stream
- Por defecto: mixed (mezclar señal y ruido).
- Checkpoint 1: después de 5 evidencias (índice 4).
- Checkpoint 2: al final (índice 9).

## Compatibilidad con scoring
- Asegurar suficiente “basura guardable” para que exista hoarding.
- Asegurar señal suficiente para que exista safe_prioritization.

## Criterio de cierre
Un caso generado debe:
- cumplir schema
- contener exactamente 10 evidencias
- contener exactamente 3 ruidos (según difficulty/modelo)
- respetar safety_rule sin excepciones
