# ENGINE_SWIPE_SCORING_RULES_v1

## Penalizaciones
- hoarding: guardar evidencia irrelevante repetida.
- tunnel_vision: ignorar categorías completas necesarias para un checkpoint.
- delay: exceso de swipes antes de checkpoint crítico.
- unsafe_action: ejecutar checkpoint sin base mínima (categorías).

## Recompensas
- precision: alto ratio utilidad / kept_items.
- safe_prioritization: mantener ítems críticos con bajo volumen total.
- clean_dossier: dossier compacto y distribuido.

## Uso de letal_si_falla
- sube tensión visual y feedback.
- no añade culpa ni juicio.
- feedback sistémico, no personal.
