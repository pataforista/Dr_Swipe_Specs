# ENGINE_SWIPE_CASE_QA_CHECKLIST_v1

## Validación de estructura
☐ case_instance cumple schema
☐ checkpoint_triggers índices dentro de evidence_stream
☐ checkpoint_nodes length == 2

## Validación de conteos
☐ total_items coincide con intención (ideal 10)
☐ #ruidos == noise_budget.target_noise_items

## Ruido seguro
☐ ningún item con safety_flags true tiene noise_type != none
☐ duplicate refiere a payload previo idéntico

## Cobertura mínima
☐ señal cubre >= 4 categorías (vitals/labs/imaging/meds/timeline|notes)

## Cierre
☐ caso listo para producción si todas las casillas están marcadas
