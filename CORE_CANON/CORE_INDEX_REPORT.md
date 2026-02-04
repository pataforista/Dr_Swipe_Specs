# CORE_INDEX_REPORT

Fecha: 2026-01-04
Fuente: tree provisto por el usuario (sin lectura de contenidos).

## Qué incluye este índice
- Índice canónico a nivel ARCHIVO.
- Cada línea = 1 archivo, clasificado por:
  - domain (carpeta)
  - topic (tema)
  - layer (core_decisions | metadata | context)
  - version_tag (inferido del nombre)

## Limitación actual
No se puede emitir 1 línea por decision_node (decision_id real) sin abrir los .json/.jsonl.
En cuanto entregues el zip con contenidos, se genera:
- CORE_INDEX_NODES.jsonl (1 línea por node)
- Validación de IDs duplicados
- Conteo de nodos por tema y cobertura

## Alertas detectadas (por tree)
1) Duplicado / colisión de tema: TEP aparece en:
   - cardio/core_tep.json (v0)
   - respiratorio/CORE_TEP_v1.0.json (v1.0)
   Regla recomendada:
   - Mantener UNA fuente canónica (preferir la más versionada: v1.0),
   - y la otra dejarla como alias o deprecated en MANIFEST_CORE.json.

2) Nombre de archivo sospechoso:
   - cardio/core_acls.json.json (doble extensión).
   Acción mínima: renombrar a cardio/core_acls.json.

3) Anáfilaxia ubicada en respiratorio:
   - respiratorio/core_anaphylaxis.json
   No está “mal” (por vía aérea), pero es transversal.
   Acción mínima: conservar ahí, y en el MANIFEST marcar cross_domain=["urgencias","inmunologia","respiratorio"].

4) MANIFEST:
   - Existe CORE_CANON/MANIFEST_CORE.json
   Recomendación: usarlo como autoridad de:
   - canonical_source por topic (ej. "tep" -> respiratorio/CORE_TEP_v1.0.json)
   - alias/deprecated

## Regla canónica de resolución (mínima, sin reescritura)
- Si hay 2 archivos que representan el mismo topic:
  1) Gana el que tenga version_tag explícito (vX.Y) o el más reciente.
  2) El otro se marca en MANIFEST como:
     { "status":"deprecated", "replaced_by":"<ruta>" }
  3) No se fusiona clínica automáticamente.
