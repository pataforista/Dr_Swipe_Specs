# Revisión de contenido

Para quien revisa el contenido médico de Dr. Swipe. No hace falta abrir ningún JSON.

## Por qué este archivo

El juego tiene 599 casos, pero son variantes de 72 familias clínicas que comparten cartas, preguntas y perla. Revisar caso por caso obliga a leer la misma carta hasta 15 veces. Aquí cada elemento distinto aparece **una sola vez por familia**, con el número de casos en que sale.

| | En el juego | En este archivo |
|---|---|---|
| Cartas | 7 907 | 1 077 |
| Preguntas del Shock Room | 1 797 | 942 |
| Perlas | 599 | 95 |
| Escenarios de llegada | 599 | 591 |

## Archivos

| Archivo | Para qué |
|---|---|
| `revision_contenido.xlsx` | **Usa este.** Filtros, menús para el veredicto y colores. |
| `revision_contenido.csv` | Las mismas filas en plano, por si prefieres otra herramienta. |

## Hojas

| Hoja | Contenido |
|---|---|
| `LEEME` | Estas instrucciones, dentro del libro |
| `Familias` | Índice: una fila por familia, con casos, cartas, % de descarte y filas con alerta. Aquí se anota el avance (estado, revisor, fecha) |
| `Cartas` | Texto, acción esperada (aceptar o descartar) y comentario del mentor. Las de riesgo letal van primero dentro de cada familia, en rosa |
| `Preguntas` | Pregunta, respuesta correcta y opciones incorrectas |
| `Perlas` | Título, texto y guía citada |
| `Escenarios` | Paciente y cuadro de llegada |
| `Alertas` | Todas las filas que un programa marcó para mirar con atención |

## Cómo revisar

1. En `Familias`, elige una y márcala "En curso".
2. Filtra `Cartas` por esa familia. Confirma que la acción esperada es correcta para ese paciente y que el comentario del mentor es cierto.
3. Filtra `Preguntas`. Confirma que hay una sola respuesta correcta y que las incorrectas son falsas pero verosímiles.
4. Revisa su perla y sus escenarios.
5. Llena `Veredicto` (Aprobar, Corregir o Rechazar). Si corriges, escribe el texto correcto en `Corrección sugerida`.
6. Marca `Fuente verificada = Sí` solo si abriste la guía o el artículo y la afirmación aparece ahí.

Orden sugerido de familias: primero las que tienen más cartas de riesgo letal, luego las de más casos (un error ahí se repite 15 veces).

## Sobre las alertas automáticas

Las genera un programa con reglas simples. Señalan dónde mirar; no son veredictos, hay falsos positivos y una fila sin alerta puede estar mal.

| Alerta | Filas | Qué significa |
|---|---|---|
| La respuesta correcta es mucho más larga que las demás | 163 preguntas | El jugador puede acertar por la forma, sin saber |
| Posible tilde faltante | 100 filas | La palabra aparece casi siempre con tilde en el resto del juego |
| El escenario menciona un diagnóstico | 28 escenarios | Puede adelantar la respuesta |

## Qué no cubre

- No trae la fuente de cada carta. Las fuentes de las 237 cartas añadidas en octubre están en `REVISION_CLINICA/`.
- No juzga la calidad clínica: solo ordena el material para que una persona lo haga.

## Devolver la revisión

Guarda el libro con tus veredictos bajo otro nombre (por ejemplo `revision_contenido_REVISADO.xlsx`). Regenerar sobrescribe el original.

## Regenerar

```bash
pip install openpyxl
python3 tools/export_content_review.py cases REVISION_CONTENIDO
```
