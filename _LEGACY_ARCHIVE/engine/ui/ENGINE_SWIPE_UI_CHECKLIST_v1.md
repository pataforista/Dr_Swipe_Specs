# ENGINE_SWIPE_UI_CHECKLIST_v1

## A. Estados del sistema
☐ La UI solo muestra estados: intake, evidence_stream, checkpoint, results, dossier.
☐ La UI no introduce estados nuevos (diagnóstico, análisis, plan).
☐ ENARM: permite checkpoint_quiz y final_triad (solo si mode=enarm).

## B. Evidencia
☐ Se muestra una tarjeta a la vez.
☐ No muestra tags, safety_flags, noise_type.
☐ No agrupa/filtra/reordena evidencia.

## C. Acciones
☐ Swipe left/right simétricos, sin dirección “correcta”.
☐ Pin solo referencia IDs; no cambia lógica.
☐ Annotate es texto libre, sin plantillas ni sugerencias.
☐ ENARM: highlight_select habilitado antes del swipe.

## D. Checkpoint
☐ Se activa por motor, no por elección clínica.
☐ No pide input clínico.
☐ No muestra “te falta X”, ni suficiencia.
☐ ENARM: pregunta sindromática con pista solo tras fallo.

## E. Feedback
☐ Lenguaje sistémico, no evaluativo.
☐ Nunca “debiste”, “correcto/incorrecto”.
☐ letal => describe evento, no culpa.
☐ ENARM: feedback educativo solo en cierre con GPC.

## F. Dossier
☐ Muestra solo guardados + contadores + patrones mecánicos.
☐ No interpreta clínica ni recomienda.
☐ ENARM: tablero final con tríada + comparación visual.

## Veredicto
- CUMPLE: todas las casillas.
- NO CUMPLE: una o más sin marcar.
