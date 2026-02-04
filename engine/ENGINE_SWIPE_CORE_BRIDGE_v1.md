# ENGINE_SWIPE_CORE_BRIDGE_v1

## Rol
Contrato mínimo entre ENGINE_SWIPE y CORE_CANON para seleccionar y ejecutar decision_nodes sin inferir clínica.

## Campos CORE permitidos (solo lectura)
- decision_node.id
- decision_node.domain
- decision_node.tags
- decision_node.letal_si_falla
- decision_node.input_requirements (si existen)
- decision_node.outcomes (labels mecánicos)

## Selección de checkpoints
- 2 decision_nodes por caso.
- Filtrar por domain/tags compatibles con dominant_tags.
- Excluir: tutorial_only, meta (si existen).

## Dificultad (mecánica)
- easy: excluir nodes con letal_si_falla=true
- standard: permitir 1 node letal
- hard: permitir 2 letales

## Traducción a requisitos de dossier
- input_requirements => categorías esperadas (presencia/ausencia).
- No validar valores, solo existencia:
  labs/vitals/meds/imaging/timeline/notes

## Checkpoint
- lee dossier (categorías + contadores)
- ejecuta decision_node
- emite result_event
- no escribe en dossier

## Ruido vs requisitos
- evidencia requerida por input_requirements nunca puede ser ruido.

## Auditoría
Reconstruible por:
- decision_node ids
- dossier_state final
- kept_items / discarded_items
