# Dr. Swipe v1 — Bundle

Este ZIP contiene la especificación y fixtures de **Dr. Swipe: Clinical Investigation** (v1), sin incluir CORE_CANON.
El motor consume CORE_CANON como dependencia **read-only**.

## Estructura
- engine/: especificación del motor, UI normativa y schemas
- generator/: reglas de generación de casos
- cases/: golden fixtures + checklist QA
- telemetry/: schema de telemetría
- runtime/: stub determinista para scoring→patrones→feedback
- copy/: biblioteca de microcopy permitido
- governance/: acta de congelación
- MANIFEST_Dr_Swipe_v1.json: índice del paquete

## Nota
El archivo MANIFEST asume estas rutas.
