# ENGINE_SWIPE_FREEZE_ACT_v1

## Objeto
Acta de congelación — Dr_Swipe ENGINE v1

## Alcance congelado
Quedan congelados y no deben modificarse sin romper congelación:
- ENGINE_SWIPE_SPEC_v1.md
- ENGINE_SWIPE_DOSSIER_SCHEMA_v1.json
- ENGINE_SWIPE_NOISE_MODEL_v1.json
- ENGINE_SWIPE_SCORING_RULES_v1.md
- ENGINE_SWIPE_ACCEPTANCE_TESTS_v1.md
- ENGINE_SWIPE_CORE_BRIDGE_v1.md
- ENGINE_SWIPE_CASE_INSTANCE_SCHEMA_v1.json
- ENGINE_SWIPE_CASE_GENERATOR_RULES_v1.md
- ENGINE_SWIPE_CASE_FRAMING_SPEC_v1.md
- ENGINE_SWIPE_UI_MINIMAL_SPEC_v1.md
- ENGINE_SWIPE_UI_CHECKLIST_v1.md
- ENGINE_SWIPE_FEEDBACK_SPEC_v1.md
- ENGINE_SWIPE_TELEMETRY_SCHEMA_v1.json

## Permitido cambiar sin romper congelación
- Casos nuevos en /cases (nuevos IDs)
- Ajustes de copy en una biblioteca separada (no specs)
- Implementación de UI (mientras cumpla checklist)

## Romper congelación (requiere v2)
Se considera ruptura:
- Cambiar estados del motor
- Permitir shuffle en runtime
- Añadir inputs nuevos
- Modificar estructura de dossier o case_instance
- Introducir feedback clínico o prescriptivo

## Versionado
- v1: especificaciones normativas.
- Parches v1.0.x: solo aclaraciones textuales y fixtures, sin cambio de contrato.

Fecha: 2026-01-04
