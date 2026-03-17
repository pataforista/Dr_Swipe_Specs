# ENGINE_SWIPE_SCORING_RULES_v1

## Penalizaciones
- hoarding: guardar evidencia irrelevante repetida.
- tunnel_vision: ignorar categorías completas necesarias para un checkpoint.
- delay: exceso de swipes antes de checkpoint crítico.
- unsafe_action: ejecutar checkpoint sin base mínima (categorías).
- highlight_imprecise: subrayado demasiado amplio o fuera de señal.
- false_positive: subrayar ruido o datos normales.

## Recompensas
- precision: alto ratio utilidad / kept_items.
- safe_prioritization: mantener ítems críticos con bajo volumen total.
- clean_dossier: dossier compacto y distribuido.
- highlight_precision: exactitud del subrayado en segmentos clave.
- clinical_eye_bonus: descartar ruido trampa de forma consistente.
- speed_bonus: completar bloques dentro del tiempo (solo ENARM).

## Uso de letal_si_falla
- sube tensión visual y feedback.
- no añade culpa ni juicio.
- feedback sistémico, no personal.
