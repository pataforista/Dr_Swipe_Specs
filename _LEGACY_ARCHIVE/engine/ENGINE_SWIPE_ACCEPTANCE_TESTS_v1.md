# ENGINE_SWIPE_ACCEPTANCE_TESTS_v1

## A. Integridad del CORE
AT-01 Si decision_node_id no existe en CORE_CANON, no se crea checkpoint.
AT-02 El motor nunca modifica decision_nodes.
AT-03 El checkpoint solo puede leer categorías presentes y contadores.

## B. Dossier
AT-04 swipe_right => kept_items +1 exacto.
AT-05 swipe_left => discarded_items +1 exacto.
AT-06 pin no duplica contenido ni altera contadores.
AT-07 annotate solo persiste texto; no altera lógica.

## C. Ruido seguro
AT-08 safety_flags true => noise_type debe ser "none".
AT-09 false_alarm no modifica elegibilidad del checkpoint.
AT-10 #ruido respeta target_noise_items del caso.

## D. Scoring / Patrones
AT-11 guardar basura repetida activa hoarding según thresholds.
AT-12 clean_dossier se activa por compacidad y cobertura mínima de categorías.
AT-13 tunnel_vision se activa por baja cobertura de categorías.
AT-14 delay se activa por tiempos/pausas (si aplica).

## E. Seguridad sistémica
AT-15 letal_si_falla => feedback descriptivo, no moralizante.
AT-16 El motor no puede reordenar evidence_stream en runtime.

## Cierre
Pasa AT-01..AT-16.
