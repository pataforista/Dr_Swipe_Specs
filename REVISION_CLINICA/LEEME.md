# Paquete de revisión clínica

Para quien revisa el contenido médico de las cartas nuevas de Dr. Swipe. No hace falta abrir ningún JSON.

## Archivos

| Archivo | Para qué |
|---|---|
| `revision_clinica.xlsx` | **Úsalo este.** Una hoja por especialidad, con filtros y menús para el veredicto. |
| `revision_clinica.csv` | Las mismas filas en plano, por si prefieres otra herramienta. |

## Cómo revisar (en este orden)

1. **Hoja `Prioridad (riesgo letal)`**: 63 cartas cuyo error sería peligroso en la práctica (por ejemplo, un fármaco contraindicado). Revísalas primero.
2. **Una hoja por especialidad**: el resto de las cartas, 237 en total.
3. **Hoja `Correcciones`**: 3 diagnósticos diferenciales que estaban como "aceptar" y ahora son "descartar" (afectan 4 casos).

Por cada carta confirma dos cosas:

- La afirmación es de verdad incorrecta o inadecuada para ese paciente (por eso se descarta).
- El comentario del mentor es correcto, tanto si el jugador acierta como si falla.

Llena `Veredicto` (Aprobar, Corregir o Rechazar). Si corriges, escribe el texto correcto en `Corrección sugerida`.

## Advertencia sobre las fuentes

La columna `Fuente citada` se redactó de memoria y **no está verificada**: los textos originales de las guías no se consultaron. Marca `Fuente verificada = Sí` solo si abriste la guía y la afirmación aparece en ella.

## Decisiones aparte

- Roséola (15 casos): fuera de este paquete hasta que se decida su contenido.
- Umbral de SatO₂ en la GPC mexicana.

## Regenerar

```bash
pip install openpyxl
python3 tools/export_review_pack.py cases content_drafts REVISION_CLINICA
```

Para ver todas las cartas del corpus con lo que cambió, está `REVISION_COMPLETA_CASOS.csv` en la raíz.
