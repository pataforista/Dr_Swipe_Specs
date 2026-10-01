# Plan: siguientes pasos de Dr. Swipe

Estado al cierre de esta tanda (rama `ccr-0c3d28da-8c3d0c`, sin PR abierto):

- **Jugabilidad:** reloj arreglado, tiempo por carta según dificultad, errores letales con costo real, deshacer limitado, pantalla "Código Rojo", pila de cartas con profundidad, vidas visibles.
- **Contenido:** pistas que delataban la respuesta eliminadas, 67 + 15 + 15 + 30 cartas de vitales corregidas según guías, 1,000+ distractores nuevos con fuente. El descarte pasó de 24.6% a 34.5%.
- **Herramientas:** validador de CI endurecido, `tools/clean_card_leaks.py`, `tools/apply_guideline_review.py`, `tools/insert_distractors.py`, `tools/report_content_review.py`.

## 1. Abrir el PR (primero)

La rama mezcla tres cosas. Propongo un solo PR con la descripción dividida en tres secciones, o tres PR si prefieres revisar por partes:

| Parte | Contenido | Quién la revisa |
|---|---|---|
| A. Motor y jugabilidad | `dr-swipe/src/**`, tests | Desarrollo |
| B. Limpieza de contenido | `tools/clean_card_leaks.py`, `tools/validate_cases.py`, `GUIA_CASOS.md` | Desarrollo y contenido |
| C. Correcciones por guía y distractores | `cases/**`, `content_drafts/**`, scripts de `tools/` | **Revisor clínico** |

- Antes de abrir: confirmar que CI (`validate_cases.py`, `npm test`, `npm run build`) pasa en la rama.
- La parte C cambia ~600 archivos de casos; conviene que el revisor clínico lea `content_drafts/*.json` y los docstrings de `tools/apply_guideline_review.py` (ahí está cada fuente) y no el diff de los JSON.
- Pendiente de decisión del revisor: roséola (15 cartas) y umbral de SatO₂ en la GPC mexicana.

## 2. Contenido: lote 5 (familias pequeñas)

Quedan 55 familias por debajo de 40% de descarte, 417 casos en total, de los cuales unas 35 familias son de 1 a 2 casos: trauma ATLS 10, obstrucción intestinal, Apgar, neumonía y crup pediátricos, CAD en DM1, diverticulitis, isquemia mesentérica, apendicitis y Alvarado, colangitis, depresión/suicidio, HPP, vaginitis, meningitis, eritema infeccioso, entre otras.

Método (el mismo de los lotes 1 a 4):
1. Leer los mazos por familia y qué pregunta resuelve cada carta.
2. Buscar la guía que decide cada afirmación; **si no hay fuente confirmada, no se escribe la carta** ("Insufficient data").
3. Redactar 3 a 4 distractores por familia en `content_drafts/distractores_lote5.json`, con comentario válido tras acierto y tras error, y la fuente.
4. Simular con `insert_distractors.py --check`, aplicar, y correr validador, esquema Zod y build.

Las familias de 15 casos (vaginitis, meningitis, eritema infeccioso, neumotórax a tensión) pesan más en el promedio que las de 1 caso: priorizarlas junto con HPP, neumonía pediátrica y crup. Meta: acercar el corpus a 38% de descarte.

## 3. Contenido: pendientes que no son distractores

- **Estructura repetida:** el 91% de las cartas de las familias con varias variantes aparece idéntico en todas ellas y cambian solo el escenario. Evaluar si 15 variantes aportan; podría bastar con 6 a 8 y más variedad de pacientes.
- **Mazos de hasta 18 cartas (hecho):** el límite subió de 15 a 18 en el validador, el esquema Zod de la app y `insert_distractors.py`; el tope del reloj subió de 130 a 180 s para mantener ~10 s por carta. Falta usar el espacio nuevo: las familias llenas pueden recibir más distractores en el lote 5.
- **Comentarios del mentor:** 813 comentarios únicos para ~7,100 cartas; los de la carta plantilla de vitales se repiten cientos de veces. Redactar variantes por especialidad.
- **Cartas "aceptar" que repiten el escenario:** el jugador acierta sin pensar. Marcarlas para revisión (el informe ya lista los vitales; falta un criterio para el resto).
- **Preguntas del jefe (Shock Room):** auditar las 1,797 preguntas con el mismo método de fuentes que las cartas.

## 4. Jugabilidad (sin cambios aún)

Prioridad por impacto y esfuerzo:

1. **Shock Room:** marcar qué opción falló (hoy se puede volver a pulsar la misma), añadir háptica y sonido de acierto, y no reiniciar el caso completo al fallar (reiniciar desde la carta 1 es desproporcionado frente al triage).
2. **HUD a 390 px:** el monitor de vitales tapa el "Tiempo" cuando aparece la píldora de combo. Reordenar o colapsar el monitor.
3. **Recompensas:** conteo ascendente en el botín y animación del combo en cada acierto (hoy solo cambia por nivel).
4. **Dificultad adaptativa:** subir el costo de vitalidad o recortar tiempo tras rachas largas; ahora el reto es plano dentro de un caso.
5. **Telemetría opcional:** registrar tiempo por carta y tasa de acierto por familia para ver con datos qué cartas son demasiado fáciles o demasiado confusas.

## 5. Calidad y mantenimiento

- **CI:** añadir al workflow `python3 tools/apply_guideline_review.py cases --check`, `tools/clean_card_leaks.py cases --check` y `tools/insert_distractors.py` de cada lote con `--check`, para que ningún cambio manual deshaga las correcciones.
- **Validador TS de la raíz** (`validate_cases.ts`): falla fuera de `dr-swipe/` por la ruta de importación. Moverlo a `dr-swipe/` o documentar el comando.
- **Fin de línea:** `REVISION_CONTENIDO_JUGABILIDAD.csv` avisa de CRLF; fijarlo en `.gitattributes`.
- **Pruebas de contenido:** convertir el test temporal de "los 599 casos pasan el esquema Zod" en un test permanente de `dr-swipe/src/tests/`.
- **Detector de vitales** (`report_content_review.py`): usa umbrales de adulto y marca falsos positivos pediátricos. Añadir rangos por edad (PALS) o un campo `edad` por caso.

## 6. Orden sugerido

1. Abrir el PR y pedir la revisión clínica de la parte C.
2. Mientras tanto, lote 5 en un PR aparte (no bloquea el primero).
3. Shock Room y HUD (jugabilidad) en otro PR.
4. CI y mantenimiento junto con el PR del lote 5.
5. Decidir sobre la estructura repetida de las familias tras ver la revisión clínica.

## Decisiones que necesito de ti

- ¿Un PR o tres?
- ¿Quién hace la revisión clínica de la parte C? `REVISION_COMPLETA_CASOS.csv` trae todas las cartas con lo que cambió y su fuente.
