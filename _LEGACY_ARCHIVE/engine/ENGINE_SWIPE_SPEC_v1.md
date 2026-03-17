# ENGINE_SWIPE_SPEC_v1

## Propósito
Motor de investigación clínica por descarte. El jugador gestiona evidencia incompleta y ruidosa, prioriza seguridad y ejecuta decision_nodes del CORE sin diagnosticar ni inferir clínica nueva.

## Principios no negociables
- El motor no decide clínica.
- El ruido nunca contradice ni oculta información crítica de seguridad.
- Penaliza acumulación indiscriminada más que descarte prudente.
- El CORE es inmutable; el motor solo orquesta contexto y secuencia.

## Modo ENARM (variación explícita)
En modo ENARM el motor **sí** puede solicitar integración sindromática y
tríada diagnóstica final, porque el objetivo es entrenar lectura y síntesis
tipo examen. Este modo:
- mantiene la regla de seguridad (safety_flags nunca pueden ser ruido).
- separa señal vs. ruido con mecánicas de precisión, no con pistas visuales.
- habilita feedback educativo y referencias GPC **solo al cierre**.

## Objetivo de experiencia
El modo de juego debe:
- evitar sensación de vacío con **ritmo y capas**,
- hacer visible la **riqueza del dataset** sin revelar clínica,
- sostener tensión mecánica entre señal, ruido y seguridad.

## Core Loop (con ritmo)
1. intake
2. briefing (framing + metas mecánicas visibles)
3. evidence_stream (en bloques cortos)
4. highlight_select (selección precisa de segmentos)
5. swipe (keep / discard)
6. checkpoint decision (decision_node CORE)
7. results
8. dossier

## Core Loop ENARM (extensión)
1. intake
2. briefing con timer opcional
3. evidence_stream por bloques (1-6, 7-14)
4. highlight_select + swipe
5. checkpoint_quiz (síndrome)
6. results
7. evidence_stream bloque 2
8. final_triad (diagnóstico, estudio, tratamiento)
9. dossier + feedback educativo

## Ritmo y capas
- La evidencia se entrega en **bloques** (bursts) para crear pausas naturales.
- Al cierre de cada bloque, se emite un **progress pulse**: conteo, categorías cubiertas y checkpoint próximo.
- El jugador ve la **superficie del dataset**: variedad de categorías y tags dominantes,
  pero nunca pistas clínicas.

## Estados
- intake: inicializa sesión, dificultad y tags dominantes.
- briefing: muestra framing, número de checkpoints y tamaño del caso.
- evidence_stream: flujo secuencial de evidencia.
- highlight_select: el jugador subraya un segmento antes del swipe.
- checkpoint: se dispara un decision_node CORE.
- checkpoint_quiz: pregunta sindromática (solo ENARM).
- results: resolución mecánica del checkpoint.
- final_triad: tres preguntas seriadas (solo ENARM).
- dossier: revisión final del expediente.

## Inputs
- swipe_right: guardar evidencia.
- swipe_left: descartar evidencia.
- highlight_select: subrayar un segmento específico del texto.
- pin: marcar evidencia como prioritaria (máx. N activos).
- annotate: nota libre, sin efecto clínico.
- pause: pausa segura.

## Outputs
- result_event: evento mecánico del CORE (éxito, fallo, fallo letal).
- dossier_state: snapshot (kept_items, discarded_items, contenido).
- progress_pulse: avance mecánico (conteo, categorías vistas, checkpoint próximo).
- highlight_precision: métrica de exactitud del subrayado.
- clinical_eye_bonus: bonus por descartar ruido trampa.

## Reglas de Flujo
- evidencia en orden no cronológico.
- checkpoints solo leen el dossier, no swipes individuales.
- el jugador nunca ve “la respuesta correcta”.
- cada bloque debe cubrir **≥ 2 categorías** para evitar sensación monótona.

## Seguridad
- antes de cada checkpoint, validar que ninguna pieza crítica se convirtió en ruido.
- si una pieza tiene tags de contraindication / lethal_risk / decision_critical, jamás puede ser ruido.

## Señales de aprovechamiento del dataset (sin clínica)
- diversidad mínima de categorías por caso
- presencia explícita de tags dominantes en la evidencia
- mezcla intencional de subdominios (ej. timeline + labs + notes)

## Mecánica principal (Active Highlighting)
- Cada evidencia define uno o más **segmentos objetivo**.
- El jugador debe subrayar el segmento patológico clave.
- Subrayar texto completo = impreciso (penaliza precisión).
- Subrayar un dato normal o distractor = falso positivo.

## Ruido como distractor activo
- Ruido blanco: datos normales o triviales.
- Ruido trampa: datos que sugieren un diagnóstico alterno común.
- Descartar ruido trampa otorga **clinical_eye_bonus**.
