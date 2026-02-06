# ENGINE_SWIPE_UI_MINIMAL_SPEC_v1

## Rol del documento
Definir la interfaz mínima necesaria para operar ENGINE_SWIPE.
En modo estándar, sin introducir:
- decisiones clínicas explícitas
- pistas diagnósticas
- lógica de examen
- retroalimentación prescriptiva

En modo ENARM, se habilitan UI de examen **solo** en checkpoints y cierre.

La UI es un ejecutor visual del motor, no un intérprete clínico.

---

## Principio rector
La UI muestra **estado y acciones**, nunca **significado clínico**.
En modo ENARM, el significado clínico solo aparece en:
- checkpoint_quiz (síndrome)
- final_triad (diagnóstico/estudio/tratamiento)
- cierre con “Perla ENARM” + GPC

Si una UI permite inferir qué decisión es correcta,
esa UI viola el diseño del sistema.

---

## Estados visibles de la UI

La UI solo puede representar estados ya definidos por el motor:

- intake
- evidence_stream
- checkpoint
- results
- dossier
En modo ENARM se añaden:
- checkpoint_quiz
- final_triad

La UI no puede crear estados nuevos.

---

## Componentes permitidos por estado

### 1. Estado: intake

#### Componentes permitidos
- Texto de framing inicial (desde CASE_FRAMING).
- Botón único: “Comenzar revisión”.

#### Prohibido
- Información clínica.
- Resumen del caso.
- Objetivos clínicos.

---

### 2. Estado: evidence_stream

#### Componentes permitidos
- Tarjeta de evidencia (una a la vez).
- Indicador de progreso (ej. 3 / 10).
- Contadores visibles:
  - kept_items
  - discarded_items

#### Acciones permitidas
- swipe_right (guardar)
- swipe_left (descartar)
- highlight_select (subrayar segmento)
- pin (solo si guardado)
- annotate
- pause

#### Prohibido
- Mostrar categorías faltantes.
- Resaltar evidencia “importante”.
- Ordenar o reagrupar evidencia.
- Mostrar tags, safety_flags o noise_type.

La evidencia se presenta como texto plano + título.
En modo ENARM:
- Se permite subrayado con feedback táctil neutro.

---

### 3. Acción: swipe

#### Reglas visuales
- swipe_right y swipe_left deben ser simétricos.
- Ninguna dirección puede sentirse “correcta”.

#### Prohibido
- Colores semánticos (ej. rojo = malo, verde = bueno).
- Vibración diferencial por tipo de evidencia.

---

### 4. Acción: pin

#### Comportamiento
- Marca visual discreta.
- Máximo permitido: definido por motor (ej. 3).

#### Prohibido
- Priorizar automáticamente en checkpoint.
- Cambiar orden de lectura del motor.

Pin es solo ayuda cognitiva del jugador.

---

### 5. Acción: annotate

#### Comportamiento
- Campo de texto libre.
- Asociado a evidence_id.

#### Prohibido
- Autocompletado.
- Plantillas clínicas.
- Keywords sugeridas.

---

### 6. Estado: checkpoint

#### Componentes permitidos
- Mensaje sistémico (desde CASE_FRAMING).
- Botón único: “Continuar”.

#### Prohibido
- Mostrar evidencia resumida.
- Reordenar dossier.
- Preguntas tipo “¿Qué harías?”

El checkpoint ocurre por lógica, no por input clínico.

### 6b. Estado: checkpoint_quiz (solo ENARM)
#### Componentes permitidos
- Pregunta sindromática + opciones.
- Indicador de evidencia requerida (solo tras fallo).

#### Prohibido
- Explicaciones clínicas antes de responder.

---

### 7. Estado: results

#### Componentes permitidos
- Mensaje sistémico de outcome.
- Indicador de severidad si letal_si_falla = true
  (visual, no textual explicativo).

#### Prohibido
- Explicar causalidad clínica.
- Comparar con decisiones alternativas.

---

### 8. Estado: dossier (cierre)

#### Componentes permitidos
- Lista de evidencia guardada (IDs + títulos).
- Estadísticas:
  - kept_items
  - discarded_items
  - etiquetas de scoring (ej. clean_dossier).

#### Prohibido
- “Lo correcto habría sido…”
- Feedback educativo explícito.
- Recomendaciones.

En modo ENARM se permite:
- tablero final con tríada (diagnóstico, estudio, tratamiento).
- resaltado visual de señal vs. ruido tras terminar.
- botón “Ver diagrama GPC”.

---

## Restricciones globales de UI

### Prohibido en cualquier estado (modo estándar)
- Diagnósticos.
- Algoritmos.
- Referencias a guías.
- Lenguaje evaluativo (“bien”, “mal”).
- Indicadores de completitud clínica.

### Permitido global
- Feedback mecánico.
- Progreso temporal.
- Consecuencias sistémicas.

---

## Relación con accesibilidad
- La UI debe ser operable sin gestos (botones alternos).
- Ningún color debe ser el único canal de información.

---

## Auditoría de UI

Una UI incumple esta специficación si:
- permite inferir qué evidencia “importa”
- empuja a una acción como correcta
- reduce la ambigüedad clínica de forma artificial

---

## Criterio de cierre
ENGINE_SWIPE_UI_MINIMAL_SPEC_v1 queda aprobado cuando:
- permite jugar un caso completo
- no explica la clínica
- no modifica la lógica del motor
- es intercambiable (web, mobile, PWA)
