# 📘 Guía de Casos Clínicos (Dr. Swipe)

Este documento detalla cómo está estructurada la base de datos de casos clínicos (`cases/`) y cómo mantener el contenido médico limpio, funcional y balanceado.

## 1. Estructura de un Caso Clínico

Cada caso es un archivo `.json` que debe cumplir con el esquema **Zod** (`caseSchema.ts`). Un caso se compone de cuatro partes clave:

1.  **Metadatos y Presentación:** Define el ID, dificultad (`standard`, `hard`, `extreme`) y la descripción del paciente.
2.  **Card Stream (Baraja):** De 3 a 15 cartas que el jugador debe aceptar (keep) o descartar (discard).
3.  **Perla ENARM:** La lección o conclusión médica que se desbloquea al final.
4.  **Boss Fight Triad:** 3 preguntas de opción múltiple (Shock Room) para validar el conocimiento del jugador.

### Ejemplo de Configuración Básica
\`\`\`json
{
    "case_id": "CASE_PROC_SPECIALTY_THEME_001",
    "version": "v3_swipe_action",
    "theme_config": "ped",
    "difficulty": "standard",
    "patient_intro": {
        "name": "Paciente de Ejemplo",
        "arrival_scenario": "Descripción de cómo llega el paciente a urgencias.",
        "time_limit_sec": 60
    }
}
\`\`\`

## 2. Tipos de Cartas y Reglas

*   **Tipos de Acción (`expected_action`):** 
    *   `keep`: El jugador desliza a la derecha (Aceptar hallazgo / Tratamiento).
    *   `discard`: El jugador desliza a la izquierda (Descartar distractores / Tratamientos dañinos).
*   **Puntuación (`scoring`):** Define los puntos otorgados o restados y el comentario de feedback de "Dr. Navarro".
*   **Safety Flags (`safety_flags`):**
    *   `lethal_risk`: Si el jugador se equivoca, sufre daño letal (Error crítico).
    *   `lethal_if_discarded`: Si descarta algo vital (ej. intubación en vía aérea inestable).
*   **Restricción Importante:** El sistema rechaza casos que tengan cartas con el mismo `card_id` (para evitar contaminación cruzada entre enfermedades).

### Cartas que no delatan la respuesta
El jugador lee `card_text` **antes** de decidir. Si el texto trae una pista del veredicto, la decisión se vuelve reconocimiento de patrones y el juego pierde la tensión.

*   **Sin letras de opción** (`F) `, `G) `, `H) `…): en el corpus original marcaban "aceptar" en ~95% de los casos. El validador las rechaza.
*   **Sin etiquetas de veredicto** al inicio (`Dato anecdótico:`, `Contraindicado:`, `Información redundante:`, `Ruido en el expediente:`): solo aparecían en cartas de descarte. El validador las rechaza.
*   **Balance:** apunta a ~40% de cartas de descarte por caso. Con 26% de descarte, deslizar siempre a la derecha acertaba 3 de cada 4.
*   **`vazquez_comment`** se muestra tanto si el jugador acierta como si falla: escríbelo como explicación clínica válida en ambos casos. Los regaños que solo tienen sentido tras un error deben empezar con `¿` (el juego los omite cuando el jugador acierta). No incluyas prefijos como `🧹 DESCARTE RECOMENDADO:`; el juego los añade.

Limpieza automática (idempotente) y lista de revisión clínica:
\`\`\`bash
python3 tools/clean_card_leaks.py cases            # quita letras, etiquetas y prefijos horneados
python3 tools/report_content_review.py cases REVISION_CONTENIDO_JUGABILIDAD.csv
python3 tools/apply_guideline_review.py cases     # correcciones de vitales validadas contra guías (fuentes en el script)
\`\`\`

## 3. Revisión de Casos

Para auditar el contenido sin abrir los archivos JSON directamente, se han habilitado herramientas de exportación en la raíz del proyecto.

### Exportar Catálogo General
Genera un archivo `.csv` con la lista de casos, especialidad, dificultad y perla médica.
\`\`\`bash
npx tsx generate_csv.ts
\`\`\`
*(Genera: `CATALOGO_CASOS_COMPLETO.csv`)*

### Exportar Preguntas y Respuestas (QA)
Extrae todas las preguntas de los Boss Fights junto con sus opciones y señala exactamente cuál es la respuesta correcta en formato tabular.
\`\`\`bash
npx tsx export_qa.ts
\`\`\`
*(Genera: `REVISION_PREGUNTAS_RESPUESTAS.csv`)*

## 4. Balance de Dificultades
A partir de septiembre de 2026, el juego soporta tres dificultades:
*   `standard`: Casos típicos del ENARM. Opciones obvias y margen de error.
*   `hard`: Casos con distractores agresivos y complicaciones moderadas.
*   `extreme`: Escenarios de tiempo crítico (ej. Shock Cardiogénico, Rabia) donde el primer error suele ser letal. Ideal para conceptos altamente evaluados.
