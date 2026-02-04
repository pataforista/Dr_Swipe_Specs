# ENGINE_SWIPE_SPEC_v1

## Propósito
Motor de investigación clínica por descarte. El jugador gestiona evidencia incompleta y ruidosa, prioriza seguridad y ejecuta decision_nodes del CORE sin diagnosticar ni inferir clínica nueva.

## Principios no negociables
- El motor no decide clínica.
- El ruido nunca contradice ni oculta información crítica de seguridad.
- Penaliza acumulación indiscriminada más que descarte prudente.
- El CORE es inmutable; el motor solo orquesta contexto y secuencia.

## Core Loop
1. intake
2. evidence_stream
3. swipe (keep / discard)
4. checkpoint decision (decision_node CORE)
5. results
6. dossier

## Estados
- intake: inicializa sesión, dificultad y tags dominantes.
- evidence_stream: flujo secuencial de evidencia.
- checkpoint: se dispara un decision_node CORE.
- results: resolución mecánica del checkpoint.
- dossier: revisión final del expediente.

## Inputs
- swipe_right: guardar evidencia.
- swipe_left: descartar evidencia.
- pin: marcar evidencia como prioritaria (máx. N activos).
- annotate: nota libre, sin efecto clínico.
- pause: pausa segura.

## Outputs
- result_event: evento mecánico del CORE (éxito, fallo, fallo letal).
- dossier_state: snapshot (kept_items, discarded_items, contenido).

## Reglas de Flujo
- evidencia en orden no cronológico.
- checkpoints solo leen el dossier, no swipes individuales.
- el jugador nunca ve “la respuesta correcta”.

## Seguridad
- antes de cada checkpoint, validar que ninguna pieza crítica se convirtió en ruido.
- si una pieza tiene tags de contraindication / lethal_risk / decision_critical, jamás puede ser ruido.
